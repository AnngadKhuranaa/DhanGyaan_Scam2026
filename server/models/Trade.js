import mongoose from 'mongoose';

/** Immutable record of one executed paper trade. */
const tradeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: '' },
    market: { type: String, enum: ['IN', 'US'], required: true },
    side: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    price: { type: Number, required: true, min: 0 }, // execution price in the listing currency
    currency: { type: String, required: true },
    fxRate: { type: Number, required: true, min: 0 }, // INR per 1 unit of `currency` (1 for INR)
    amountInr: { type: Number, required: true, min: 0 }, // price * quantity * fxRate
    realizedPnL: { type: Number, default: null }, // INR, sells only
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);

tradeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Trade', tradeSchema);
