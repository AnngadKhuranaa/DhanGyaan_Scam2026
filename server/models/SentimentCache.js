import mongoose from 'mongoose';

const sentimentCacheSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, unique: true },
    sentimentScore: { type: Number, default: 0 }, // -1 to +1
    sentimentLabel: { type: String, enum: ['BULLISH', 'NEUTRAL', 'BEARISH'], default: 'NEUTRAL' },
    tweets: [
      {
        text: String,
        author: String,
        sentiment: String,
        createdAt: Date,
      },
    ],
    news: [
      {
        title: String,
        source: String,
        url: String,
        sentiment: String,
        publishedAt: Date,
      },
    ],
    cachedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: auto-delete expired cache docs
sentimentCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('SentimentCache', sentimentCacheSchema);
