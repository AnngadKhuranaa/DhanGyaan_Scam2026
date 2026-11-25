import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

const limitMessage = (message) => ({ success: false, data: null, message });

/** General limit for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 10_000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Too many requests, please slow down and try again shortly.'),
});

/**
 * Stricter limit for credential endpoints (login/register/demo) to slow down
 * brute-force attempts. Successful logins don't count against the budget.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 10_000 : 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Too many authentication attempts. Please wait 15 minutes.'),
});

/** AI calls cost money: cap them per client. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isTest ? 10_000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('AI request limit reached, please wait a minute.'),
});
