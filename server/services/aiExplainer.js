import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder-key');

/**
 * Generate plain-language portfolio explanation using AI
 * @param {Array} holdings - User's current holdings
 * @param {number} totalPnL - Overall P&L
 * @param {string} provider - 'openai' | 'gemini'
 */
export const explainPortfolio = async (holdings, totalPnL, provider = 'gemini') => {
  const holdingsSummary = holdings
    .map((h) => `${h.symbol}: ${h.quantity} shares @ ₹${h.avgBuyPrice} avg, current ₹${h.currentPrice}`)
    .join('\n');

  const prompt = `You are a friendly Indian stock market educator. A user has the following paper trading portfolio:

${holdingsSummary}

Overall P&L: ₹${totalPnL.toFixed(2)}

Please provide:
1. A simple explanation of their portfolio's performance in plain English/Hindi mix (like a knowledgeable friend would explain)
2. 2-3 key risks in their current holdings
3. 2-3 actionable suggestions to improve diversification
4. A sentiment summary (Bullish / Neutral / Bearish) for their overall portfolio

Keep it concise, friendly, and educational. Use emojis sparingly.`;

  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      });
      return completion.choices[0].message.content;
    }

    // Default: Gemini
    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    // Fallback when no AI keys are configured
    return 'AI explanation service is not configured. Please set OPENAI_API_KEY or GEMINI_API_KEY in your server .env file.';
  } catch (err) {
    console.error(`AI Explainer error: ${err.message}`);
    throw new Error('AI explanation service temporarily unavailable.');
  }
};

/**
 * Analyze risk profile for a specific stock
 */
export const analyzeStockRisk = async (symbol, stats, provider = 'gemini') => {
  const prompt = `Analyze the risk profile for stock symbol: ${symbol}

Monte Carlo Statistics:
- Loss Probability: ${stats.lossProbability}%
- Expected Return: ${stats.expectedReturn}%
- 5th Percentile Price: ₹${stats.p5}
- 95th Percentile Price: ₹${stats.p95}
- Value at Risk (95% confidence): ₹${stats.var || 'N/A'}

Explain in simple terms what this means for an Indian retail investor. Should they be cautious? Max 150 words.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }

    return 'AI risk analysis is not configured. Please set GEMINI_API_KEY in your server .env file.';
  } catch (err) {
    console.error(`AI Risk Analysis error: ${err.message}`);
    throw new Error('AI risk analysis temporarily unavailable.');
  }
};
