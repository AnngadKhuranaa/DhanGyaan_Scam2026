import { Router } from 'express';
import { query } from 'express-validator';
import * as controller from '../controllers/insights.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { symbolParam } from '../validators/common.validators.js';

const router = Router();
router.use(protect);

router.get('/sentiment/:symbol', validate([symbolParam]), asyncHandler(controller.sentiment));
router.get('/confidence/:symbol', validate([symbolParam]), asyncHandler(controller.confidence));
router.get(
  '/exit/:symbol',
  validate([symbolParam, query('entry').optional().isFloat({ gt: 0 }).withMessage('entry must be a positive price').toFloat()]),
  asyncHandler(controller.exitPlan)
);

export default router;
