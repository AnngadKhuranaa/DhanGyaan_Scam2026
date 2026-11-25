import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

const registerRules = [
  body('username')
    .isString().withMessage('Username is required').bail()
    .trim()
    .matches(/^[a-zA-Z0-9_]{3,20}$/)
    .withMessage('Username must be 3-20 letters, numbers or underscores'),
  body('email').isString().bail().trim().isEmail().withMessage('Enter a valid email').bail().toLowerCase(),
  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number'),
  body('phone')
    .optional({ values: 'falsy' })
    .isString().bail()
    .trim()
    .matches(/^\+?\d{10,15}$/)
    .withMessage('Phone must be 10-15 digits'),
];

// isString() rejects objects like {"$ne": null}: NoSQL injection is blocked here
// as well as by express-mongo-sanitize.
const loginRules = [
  body('identifier').isString().withMessage('Username or email is required').bail().trim().isLength({ min: 1, max: 100 }).withMessage('Username or email is required'),
  body('password').isString().withMessage('Password is required').bail().isLength({ min: 1, max: 72 }).withMessage('Password is required'),
];

router.post('/register', authLimiter, validate(registerRules), asyncHandler(controller.register));
router.post('/login', authLimiter, validate(loginRules), asyncHandler(controller.login));
router.post('/demo', authLimiter, asyncHandler(controller.demo));
router.post('/refresh', asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));
router.get('/me', protect, asyncHandler(controller.me));

export default router;
