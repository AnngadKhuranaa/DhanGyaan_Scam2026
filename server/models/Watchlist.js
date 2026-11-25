import mongoose from 'mongoose';

export const WATCHLIST_LIMIT = 30;

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
      {
        _id: false,
        symbol: { type: String, uppercase: true, required: true },
        name: { type: String, default: '' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Watchlist', watchlistSchema);
