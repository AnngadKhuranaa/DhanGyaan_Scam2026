import express from 'express';
import { runMonteCarloSimulation } from '../services/simulation.service.js';
import { getStockData } from '../services/stock.service.js';

const router = express.Router();

function getRiskCategory(probabilityOfLoss) {
  if (probabilityOfLoss < 20) {
    return 'Low';
  }

  if (probabilityOfLoss <= 50) {
    return 'Medium';
  }

  return 'High';
}

router.post('/simulate', async (req, res) => {
  console.log('Simulation API hit');

  try {
    const { stock, amount, duration } = req.body;

    if (!stock) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required',
      });
    }

    const stockData = await getStockData(stock);
    const result = runMonteCarloSimulation(stockData.history, amount, duration);

    return res.json({
      best: result.best,
      worst: result.worst,
      average: result.average,
      probabilityOfLoss: result.probabilityOfLoss,
      risk: getRiskCategory(result.probabilityOfLoss),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
