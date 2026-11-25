import { getSentiment } from '../services/sentimentAnalyzer.js';

export const getSentimentHandler = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const data = await getSentiment(symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getNewsSentimentHandler = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const data = await getSentiment(symbol.toUpperCase());
    res.json({ success: true, data: { symbol, news: data.news, sentimentLabel: data.sentimentLabel } });
  } catch (err) { next(err); }
};
