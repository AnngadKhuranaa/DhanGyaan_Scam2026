import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * Auth flow (explained):
 * - Access token: short-lived JWT (15 min) sent as "Authorization: Bearer ...".
 *   The client keeps it in memory only, so XSS can't read a long-lived secret from storage.
 * - Refresh token: 7-day JWT in an httpOnly cookie scoped to /api/auth. JavaScript
 *   can't read it; the browser sends it only to the refresh/logout endpoints.
 * - Each refresh token embeds the user's tokenVersion. Logout increments the version,
 *   which instantly invalidates every refresh token issued before it.
 */

export function signAccessToken(user) {
  const { jwtSecret, accessTokenTtl } = env();
  return jwt.sign({ sub: user._id.toString(), type: 'access' }, jwtSecret, { expiresIn: accessTokenTtl });
}

export function signRefreshToken(user) {
  const { jwtRefreshSecret, refreshTokenTtlDays } = env();
  return jwt.sign({ sub: user._id.toString(), type: 'refresh', ver: user.tokenVersion }, jwtRefreshSecret, {
    expiresIn: `${refreshTokenTtlDays}d`,
  });
}

export function issueTokens(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

/** Verify an access token and return its user id, or throw 401. */
export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env().jwtSecret);
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload.sub;
  } catch (error) {
    throw ApiError.unauthorized(error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }
}

export async function register({ username, email, password, phone }) {
  const or = [{ username: username.toLowerCase() }, { email: email.toLowerCase() }];
  if (phone) or.push({ phone });
  const existing = await User.findOne({ $or: or }).lean();
  if (existing) {
    const field = existing.username === username.toLowerCase() ? 'Username' : existing.email === email.toLowerCase() ? 'Email' : 'Phone number';
    throw ApiError.conflict(`${field} is already registered`);
  }

  const { startingBalance } = env();
  const user = await User.create({
    username,
    email,
    password,
    phone: phone || undefined,
    balance: startingBalance,
    startingBalance,
  });
  return { user, ...issueTokens(user) };
}

export async function login({ identifier, password }) {
  const id = identifier.trim();
  const user = await User.findOne({
    $or: [{ email: id.toLowerCase() }, { username: id.toLowerCase() }, { phone: id }],
  }).select('+password');

  // Same message for "no such user" and "wrong password" so accounts can't be enumerated.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid username/email or password');
  }
  return { user, ...issueTokens(user) };
}

/** Exchange a valid refresh cookie for a new access token (and a rotated refresh token). */
export async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = jwt.verify(refreshToken, env().jwtRefreshSecret);
  } catch {
    throw ApiError.unauthorized('Session expired, please log in again');
  }
  if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid refresh token');

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.ver) {
    throw ApiError.unauthorized('Session revoked, please log in again');
  }
  return { user, ...issueTokens(user) };
}

/** Revoke all of this user's refresh tokens. */
export async function logout(userId) {
  if (userId) await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

/** Return the user id inside a refresh token without throwing (used by logout). */
export function userIdFromRefreshToken(token) {
  try {
    return jwt.verify(token, env().jwtRefreshSecret).sub;
  } catch {
    return null;
  }
}

/**
 * Log into the shared demo account, creating it (cash only) if `npm run seed`
 * hasn't been run. It has a random password, so the only way in is this endpoint.
 */
export async function demoLogin() {
  const { demoUsername, startingBalance } = env();
  let user = await User.findOne({ username: demoUsername });
  if (!user) {
    user = await User.create({
      username: demoUsername,
      email: `${demoUsername}@demo.dhangyaan.app`,
      password: crypto.randomBytes(24).toString('hex'),
      balance: startingBalance,
      startingBalance,
      isDemo: true,
    });
  }
  return { user, ...issueTokens(user) };
}
