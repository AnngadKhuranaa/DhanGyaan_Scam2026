import mongoose from 'mongoose';

/**
 * One holding. Costs are tracked in INR (the account currency) so P&L for a US
 * stock includes currency moves, which is what a real Indian investor experiences.
 */
const holdingSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: '' },
    market: { type: String, enum: ['IN', 'US'], required: true },
    currency: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
    avgCostInr: { type: Number, required: true, min: 0 }, // INR paid per share, incl. FX
    avgPriceNative: { type: Number, required: true, min: 0 }, // per share in the listing currency
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    holdings: { type: [holdingSchema], default: [] },
    realizedPnL: { type: Number, default: 0 }, // INR, accumulated on every sell
  },
  { timestamps: true }
);

export default mongoose.model('Portfolio', portfolioSchema);
