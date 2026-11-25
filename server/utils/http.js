/**
 * Every endpoint responds with the same envelope: { success, data, message }.
 */
export function sendSuccess(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, message });
}

/**
 * Wrap an async controller so rejected promises reach the error handler
 * (Express 4 does not do this on its own).
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
