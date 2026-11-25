import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
router.use(protect, aiLimiter);

const chatRules = [
  body('message').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('symbol')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .matches(/^[A-Za-z0-9^][A-Za-z0-9.^=&-]{0,19}$/)
    .withMessage('symbol must be a ticker')
    .customSanitizer((s) => s.toUpperCase()),
  body('history').optional().isArray({ max: 20 }).withMessage('history must be an array of at most 20 messages'),
  body('history.*.role').optional().isIn(['user', 'assistant']),
  body('history.*.content').optional().isString().isLength({ max: 4000 }),
];

router.post('/chat', validate(chatRules), asyncHandler(controller.chat));
router.post('/explain-portfolio', asyncHandler(controller.explainPortfolio));

export default router;
