import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/http.js';

const COOKIE_NAME = 'refreshToken';

/**
 * httpOnly: JS can't read it. path: only sent to /api/auth/*.
 * In production the client (Vercel) and API (Render) are different sites, so the
 * cookie must be SameSite=None; Secure to be sent on cross-site XHR.
 */
function cookieOptions() {
  const { isProduction, refreshTokenTtlDays } = env();
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

function sendSession(res, { user, accessToken, refreshToken }, message, status = 200) {
  res.cookie(COOKIE_NAME, refreshToken, cookieOptions());
  return sendSuccess(res, { user: user.toPublic(), accessToken }, message, status);
}

export async function register(req, res) {
  const session = await authService.register(req.body);
  sendSession(res, session, 'Account created', 201);
}

export async function login(req, res) {
  sendSession(res, await authService.login(req.body), 'Logged in');
}

export async function demo(req, res) {
  sendSession(res, await authService.demoLogin(), 'Logged in to the demo account');
}

export async function refresh(req, res) {
  sendSession(res, await authService.refresh(req.cookies?.[COOKIE_NAME]), 'Token refreshed');
}

export async function logout(req, res) {
  await authService.logout(authService.userIdFromRefreshToken(req.cookies?.[COOKIE_NAME]));
  const { maxAge: _maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
  sendSuccess(res, null, 'Logged out');
}

export async function me(req, res) {
  sendSuccess(res, { user: req.user.toPublic() });
}
