import express from 'express';
import { getSentimentData } from '../services/sentiment.service.js';

const router = express.Router();

router.get('/:symbol', async (req, res) => {
  console.log('Sentiment API hit');

  try {
    const data = await getSentimentData(req.params.symbol);
    return res.json({
      sentimentScore: data.sentimentScore ?? 0,
      summary: data.summary || '',
      topHeadlines: data.topHeadlines || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      sentimentScore: 0,
      summary: '',
      topHeadlines: [],
    });
  }
});

export default router;
