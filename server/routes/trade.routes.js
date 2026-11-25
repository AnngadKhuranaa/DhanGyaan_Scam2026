import express from 'express';
import Portfolio from '../models/Portfolio.js';
import Trade from '../models/Trade.js';
import User from '../models/User.js';
import { getStockData } from '../services/stock.service.js';

const router = express.Router();

async function getUserAndPortfolio(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  let portfolio = await Portfolio.findOne({ userId });

  if (!portfolio) {
    portfolio = await Portfolio.create({ userId, stocks: [] });
  }

  return { user, portfolio };
}

router.post('/buy', async (req, res) => {
  try {
    const { userId, stock, quantity } = req.body;

    if (!userId || !stock || !quantity) {
      return res.status(400).json({ success: false, message: 'userId, stock, and quantity are required' });
    }

    const buyQuantity = Number(quantity);

    if (Number.isNaN(buyQuantity) || buyQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const marketData = await getStockData(stock);
    const executionPrice = Number(marketData.price);
    const totalCost = executionPrice * buyQuantity;
    const normalizedStock = String(stock).trim().toUpperCase();

    const { user, portfolio } = await getUserAndPortfolio(userId);

    if (user.balance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const existingHolding = portfolio.stocks.find((item) => item.name === normalizedStock);

    if (existingHolding) {
      const combinedQuantity = existingHolding.quantity + buyQuantity;
      existingHolding.avgPrice =
        (existingHolding.quantity * existingHolding.avgPrice + totalCost) / combinedQuantity;
      existingHolding.quantity = combinedQuantity;
    } else {
      portfolio.stocks.push({
        name: normalizedStock,
        quantity: buyQuantity,
        avgPrice: executionPrice,
      });
    }

    user.balance -= totalCost;

    await Promise.all([
      user.save(),
      portfolio.save(),
      Trade.create({
        userId,
        stock: normalizedStock,
        quantity: buyQuantity,
        price: executionPrice,
        type: 'buy',
      }),
    ]);

    return res.json({
      success: true,
      price: executionPrice,
      balance: Number(user.balance.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sell', async (req, res) => {
  try {
    const { userId, stock, quantity } = req.body;

    if (!userId || !stock || !quantity) {
      return res.status(400).json({ success: false, message: 'userId, stock, and quantity are required' });
    }

    const sellQuantity = Number(quantity);

    if (Number.isNaN(sellQuantity) || sellQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const normalizedStock = String(stock).trim().toUpperCase();
    const marketData = await getStockData(normalizedStock);
    const executionPrice = Number(marketData.price);
    const { user, portfolio } = await getUserAndPortfolio(userId);
    const holding = portfolio.stocks.find((item) => item.name === normalizedStock);

    if (!holding || holding.quantity < sellQuantity) {
      return res.status(400).json({ success: false, message: 'Not enough stock to sell' });
    }

    const realizedPnL = (executionPrice - holding.avgPrice) * sellQuantity;
    const proceeds = executionPrice * sellQuantity;

    holding.quantity -= sellQuantity;
    if (holding.quantity === 0) {
      portfolio.stocks = portfolio.stocks.filter((item) => item.name !== normalizedStock);
    }

    portfolio.realizedPnL += realizedPnL;
    user.balance += proceeds;

    await Promise.all([
      user.save(),
      portfolio.save(),
      Trade.create({
        userId,
        stock: normalizedStock,
        quantity: sellQuantity,
        price: executionPrice,
        type: 'sell',
      }),
    ]);

    return res.json({
      success: true,
      price: executionPrice,
      realizedPnL: Number(realizedPnL.toFixed(2)),
      balance: Number(user.balance.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
