import { Router } from 'express';
import { query } from 'express-validator';
import * as controller from '../controllers/market.controller.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { marketQuery, rangeQuery, symbolParam } from '../validators/common.validators.js';

const router = Router();

router.get(
  '/search',
  validate([
    query('q').isString().trim().isLength({ min: 1, max: 50 }).withMessage('q must be 1-50 characters'),
    marketQuery,
  ]),
  asyncHandler(controller.search)
);
router.get(
  '/quotes',
  validate([
    query('symbols')
      .isString()
      .custom((v) => v.split(',').filter(Boolean).length <= 25)
      .withMessage('symbols must be a comma-separated list of at most 25 tickers'),
  ]),
  asyncHandler(controller.quotes)
);
router.get('/quote/:symbol', validate([symbolParam]), asyncHandler(controller.quote));
router.get('/history/:symbol', validate([symbolParam, rangeQuery]), asyncHandler(controller.history));
router.get('/movers', validate([marketQuery]), asyncHandler(controller.movers));
router.get('/indices', validate([marketQuery]), asyncHandler(controller.indices));

export default router;
