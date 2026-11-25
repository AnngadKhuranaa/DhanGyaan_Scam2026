import mongoose from 'mongoose';

/** Scored NewsAPI results per symbol. MongoDB's TTL index deletes a document once expiresAt passes. */
const sentimentCacheSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, uppercase: true, unique: true },
    query: { type: String, required: true },
    score: { type: Number, required: true }, // -1..+1
    label: { type: String, enum: ['positive', 'neutral', 'negative'], required: true },
    counts: { positive: Number, neutral: Number, negative: Number },
    headlines: [
      {
        _id: false,
        title: String,
        source: String,
        url: String,
        publishedAt: Date,
        score: Number,
        label: String,
        matched: [String],
      },
    ],
    fetchedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

sentimentCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('SentimentCache', sentimentCacheSchema);
