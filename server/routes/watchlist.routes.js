import { Router } from 'express';
import * as controller from '../controllers/community.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { symbolBody, symbolParam } from '../validators/common.validators.js';

const router = Router();
router.use(protect);

router.get('/', asyncHandler(controller.getWatchlist));
router.post('/', validate([symbolBody]), asyncHandler(controller.addToWatchlist));
router.delete('/:symbol', validate([symbolParam]), asyncHandler(controller.removeFromWatchlist));

export default router;
