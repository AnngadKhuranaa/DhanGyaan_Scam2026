import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/risk.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { symbolBody } from '../validators/common.validators.js';

const router = Router();

const simulateRules = [
  symbolBody,
  body('amount').isFloat({ min: 1000, max: 1e9 }).withMessage('Amount must be between 1,000 and 1,000,000,000').toFloat(),
  body('horizonDays')
    .optional()
    .isInt({ min: 5, max: 756 })
    .withMessage('Horizon must be 5-756 trading days (about 1 week to 3 years)')
    .toInt(),
  body('paths').optional().isInt({ min: 100, max: 10_000 }).withMessage('Paths must be 100-10,000').toInt(),
  body('lookback').optional().isIn(['1y', '2y']).withMessage('lookback must be 1y or 2y'),
  body('seed').optional().isInt({ min: 0, max: 2 ** 31 - 1 }).toInt(),
];

router.post('/simulate', protect, validate(simulateRules), asyncHandler(controller.simulate));

export default router;
