import { Router } from 'express';
import * as controller from '../controllers/community.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { pagination } from '../validators/common.validators.js';

const router = Router();

router.get('/', protect, validate(pagination), asyncHandler(controller.leaderboard));

export default router;
