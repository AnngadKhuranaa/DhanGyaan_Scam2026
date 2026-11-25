import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../services/auth.service.js';

/**
 * Require a valid access token. On success req.user is the logged-in user.
 * Every user-scoped query must use req.user._id, never an id from the request,
 * so one user can never read or trade on another user's account.
 */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized('Not authenticated');

    const userId = verifyAccessToken(token);
    const user = await User.findById(userId);
    if (!user) throw ApiError.unauthorized('User no longer exists');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
