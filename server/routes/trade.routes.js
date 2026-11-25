import { Router } from 'express';
import { body, query } from 'express-validator';
import * as controller from '../controllers/trade.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { pagination, symbolBody } from '../validators/common.validators.js';

const router = Router();
router.use(protect);

const tradeRules = [
  symbolBody,
  body('side')
    .isString().bail()
    .customSanitizer((v) => v.toUpperCase())
    .isIn(['BUY', 'SELL'])
    .withMessage('side must be BUY or SELL'),
  // isInt rejects 0, negatives, 2.5 and "10abc". Any `price` in the body is ignored.
  body('quantity')
    .isInt({ min: 1, max: 1_000_000 })
    .withMessage('Quantity must be a whole number between 1 and 1,000,000')
    .toInt(),
];

const historyRules = [
  ...pagination,
  query('symbol').optional().isString().trim().isLength({ min: 1, max: 20 }),
  query('side').optional().customSanitizer((v) => String(v).toUpperCase()).isIn(['BUY', 'SELL']).withMessage('side must be BUY or SELL'),
  query('from').optional().isISO8601().withMessage('from must be a date (YYYY-MM-DD)'),
  query('to').optional().isISO8601().withMessage('to must be a date (YYYY-MM-DD)'),
];

router.post('/', validate(tradeRules), asyncHandler(controller.placeTrade));
router.get('/', validate(historyRules), asyncHandler(controller.listTrades));

export default router;
