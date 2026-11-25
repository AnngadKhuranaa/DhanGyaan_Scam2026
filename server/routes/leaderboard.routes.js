import express from 'express';
import { getLeaderboardData } from '../services/leaderboard.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await getLeaderboardData();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
