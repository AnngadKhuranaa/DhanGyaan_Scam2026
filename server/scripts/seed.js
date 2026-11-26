/**
 * npm run seed
 *
 * Creates (or resets) the demo account with a realistic paper portfolio. Each
 * trade is filled at the stock's REAL historical close on that day (and the real
 * USD/INR rate for US stocks) and goes through the same transactional trade
 * engine as live orders, so balances, holdings and history are consistent and
 * the P&L you see is genuine. Also adds two sample traders (flagged as demo) so
 * the leaderboard isn't empty.
 *
 * Requires network access to Yahoo Finance; if it's unreachable the script stops
 * instead of inventing prices.
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Trade from '../models/Trade.js';
import Watchlist from '../models/Watchlist.js';
import { getHistory, getQuotes } from '../services/marketData.service.js';
import { executeTrade } from '../services/trade.service.js';

// [symbol, side, quantity, trading days ago]
const PLANS = {
  demo: [
    ['RELIANCE.NS', 'BUY', 40, 120],
    ['AAPL', 'BUY', 15, 100],
    ['INFY.NS', 'BUY', 60, 90],
    ['HDFCBANK.NS', 'BUY', 50, 60],
    ['INFY.NS', 'SELL', 20, 30],
    ['TCS.NS', 'BUY', 25, 20],
  ],
  sample_priya: [
    ['TCS.NS', 'BUY', 80, 110],
    ['NVDA', 'BUY', 40, 90],
    ['TCS.NS', 'SELL', 30, 15],
  ],
  sample_arjun: [
    ['ICICIBANK.NS', 'BUY', 120, 100],
    ['MSFT', 'BUY', 10, 70],
    ['SBIN.NS', 'BUY', 150, 40],
  ],
};
const DEMO_WATCHLIST = ['TCS.NS', 'ICICIBANK.NS', 'NVDA', 'MSFT'];

/** The candle `daysAgo` trading days back (falls back to the oldest available). */
async function historicalClose(symbol, daysAgo) {
  const candles = await getHistory(symbol, '1y');
  const c = candles[Math.max(0, candles.length - 1 - daysAgo)];
  return { close: c.close, at: new Date(c.date) };
}

/** USD/INR on (or just before) a given date. */
async function fxOn(currency, at) {
  if (currency === 'INR') return 1;
  const candles = await getHistory(`${currency}INR=X`, '1y');
  const onOrBefore = candles.filter((c) => new Date(c.date) <= at);
  return (onOrBefore.at(-1) || candles[0]).close;
}

async function resetUser(username, { email, isDemo }) {
  const { startingBalance } = env();
  let user = await User.findOne({ username });
  if (user) {
    await Promise.all([
      Portfolio.deleteOne({ userId: user._id }),
      Trade.deleteMany({ userId: user._id }),
      Watchlist.deleteOne({ userId: user._id }),
    ]);
    user.balance = startingBalance;
    user.startingBalance = startingBalance;
    user.isDemo = isDemo;
    await user.save();
  } else {
    user = await User.create({
      username,
      email,
      password: crypto.randomBytes(24).toString('hex'), // demo accounts are entered via /auth/demo only
      balance: startingBalance,
      startingBalance,
      isDemo,
    });
  }
  return user;
}

async function seedTrades(user, plan) {
  // Oldest first so cash and holdings evolve in the right order.
  const ordered = [...plan].sort((a, b) => b[3] - a[3]);
  for (const [symbol, side, quantity, daysAgo] of ordered) {
    const { close, at } = await historicalClose(symbol, daysAgo);
    const currency = symbol.endsWith('.NS') ? 'INR' : 'USD';
    const fxRate = await fxOn(currency, at);
    const { trade } = await executeTrade({ userId: user._id, symbol, side, quantity, fill: { price: close, fxRate, at } });
    console.log(`  ${at.toISOString().slice(0, 10)}  ${side.padEnd(4)} ${String(quantity).padStart(4)} ${symbol.padEnd(12)} @ ${close.toFixed(2)} ${currency}  -> cash ₹${trade.balanceAfter.toLocaleString('en-IN')}`);
  }
}

async function main() {
  const config = env();
  await connectDB(config.mongoUri);

  for (const [key, plan] of Object.entries(PLANS)) {
    const username = key === 'demo' ? config.demoUsername : key;
    console.log(`\n${username}`);
    const user = await resetUser(username, { email: `${username}@demo.dhangyaan.app`, isDemo: true });
    await seedTrades(user, plan);
  }

  const demo = await User.findOne({ username: config.demoUsername });
  const names = await getQuotes(DEMO_WATCHLIST);
  await Watchlist.create({ userId: demo._id, items: DEMO_WATCHLIST.map((symbol) => ({ symbol, name: names.get(symbol)?.shortName || '' })) });
  console.log(`\nWatchlist: ${DEMO_WATCHLIST.join(', ')}`);
  console.log('\nDone. Use "Try the demo" on the landing page to log in.');
}

main()
  .catch((error) => {
    console.error(`\nSeed failed: ${error.message}`);
    if (error.statusCode === 503) console.error('Yahoo Finance is unreachable; the seed never invents prices. Try again shortly.');
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
