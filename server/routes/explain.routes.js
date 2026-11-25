import express from 'express';

const router = express.Router();

router.post('/explain', (req, res) => {
  const { portfolio } = req.body;

  return res.json({
    explanation:
      portfolio && Array.isArray(portfolio) && portfolio.length > 0
        ? 'Your portfolio looks moderately diversified, with a stronger tilt toward a few major holdings. Consider balancing sector exposure and reviewing concentration risk in your top positions.'
        : 'Your portfolio is currently empty or limited. Adding a mix of sectors and asset types can help improve diversification and reduce risk.',
  });
});

export default router;
