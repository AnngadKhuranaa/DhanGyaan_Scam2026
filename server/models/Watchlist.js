import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    symbols: [
      {
        symbol: { type: String, uppercase: true },
        companyName: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Watchlist', watchlistSchema);
