import { Router } from 'express';
import * as controller from '../controllers/trade.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// The portfolio is always the logged-in user's: there is no userId parameter to tamper with.
router.get('/', protect, asyncHandler(controller.getPortfolio));

export default router;
