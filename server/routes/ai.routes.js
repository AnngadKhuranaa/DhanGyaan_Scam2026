import express from 'express';
import { getStockData } from '../services/stock.service.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — Goldman Sachs / Bloomberg analyst voice
// ═══════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are a high-level AI Investment Analyst used in professional trading platforms.

Your job:
- Analyze stocks deeply
- Evaluate risk intelligently
- Explain reasoning clearly
- Adapt responses based on user intent

Rules:
- NEVER repeat generic answers
- Always vary phrasing. Each response must feel fresh and unique.
- Be intelligent and analytical
- Do NOT give blind advice — always explain WHY
- When real market data is provided, cite specific numbers from it
- ALWAYS include INR (₹) equivalents alongside USD prices. Use 1 USD = ₹83.5 conversion rate.
- Format INR values in Indian notation: ₹1,23,456 (lakhs/crores system)
- Include actionable insights with estimated INR ranges for upside/downside

Structure every response as valid JSON with these exact fields:
{
  "stock": "TICKER or null",
  "price": "current price with INR equivalent, e.g. $175.40 (₹14,646)",
  "change": "percent change string or null",
  "trend": "Bullish / Bearish / Neutral",
  "risk": "Low / Medium / High",
  "confidence": "a percentage like 72%",
  "summary": "2-3 sentence overview including INR values where relevant",
  "reasoning": "detailed 3-5 point explanation of WHY you reached this conclusion",
  "outlook": {
    "short_term": "1-4 week outlook with estimated INR range",
    "long_term": "3-12 month outlook with estimated INR range"
  },
  "insight": "one-liner key takeaway",
  "suggestedFollowUps": ["question 1", "question 2", "question 3"]
}

Tone: Professional, confident, like a Bloomberg / Goldman Sachs analyst.
IMPORTANT: Return ONLY valid JSON. No markdown, no text before or after the JSON object.`;

// ═══════════════════════════════════════════════════════════════════
// COMPANY NAME → TICKER MAP
// ═══════════════════════════════════════════════════════════════════
const COMPANY_MAP = {
  apple: 'AAPL', google: 'GOOGL', alphabet: 'GOOGL', microsoft: 'MSFT',
  amazon: 'AMZN', tesla: 'TSLA', meta: 'META', facebook: 'META',
  netflix: 'NFLX', nvidia: 'NVDA', amd: 'AMD', intel: 'INTC',
  infosys: 'INFY', tcs: 'TCS', reliance: 'RELIANCE.NS', hdfc: 'HDFCBANK.NS',
  wipro: 'WIPRO.NS', bharti: 'BHARTIARTL.NS', airtel: 'BHARTIARTL.NS',
  adani: 'ADANIENT.NS', tata: 'TATAMOTORS.NS', sbi: 'SBIN.NS',
  icici: 'ICICIBANK.NS', kotak: 'KOTAKBANK.NS', bajaj: 'BAJFINANCE.NS',
  disney: 'DIS', spotify: 'SPOT', uber: 'UBER', paypal: 'PYPL',
  shopify: 'SHOP', snowflake: 'SNOW', palantir: 'PLTR', coinbase: 'COIN',
  adobe: 'ADBE', salesforce: 'CRM', oracle: 'ORCL', ibm: 'IBM',
  jpmorgan: 'JPM', goldman: 'GS', berkshire: 'BRK-B', visa: 'V',
  mastercard: 'MA', walmart: 'WMT', costco: 'COST', nike: 'NKE',
  boeing: 'BA', ford: 'F', gm: 'GM',
};

// ═══════════════════════════════════════════════════════════════════
// SYMBOL EXTRACTION — regex + company-name lookup
// ═══════════════════════════════════════════════════════════════════
function extractSymbol(message, explicitSymbol) {
  if (explicitSymbol) return explicitSymbol.toUpperCase();

  const upper = message.toUpperCase();
  const lower = message.toLowerCase();

  // 1. Check company name map
  for (const [name, ticker] of Object.entries(COMPANY_MAP)) {
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    if (regex.test(lower)) return ticker;
  }

  // 2. Check for ticker patterns (2-5 uppercase letters)
  const IGNORED = new Set([
    'I', 'A', 'THE', 'IS', 'AM', 'ARE', 'WHAT', 'HOW', 'WHY', 'CAN', 'DO',
    'IT', 'MY', 'IN', 'ON', 'TO', 'OF', 'FOR', 'AND', 'OR', 'NOT', 'AT',
    'AN', 'IF', 'BE', 'AS', 'SO', 'BY', 'UP', 'VS', 'LOW', 'HIGH', 'BUY',
    'SELL', 'PUT', 'GET', 'SET', 'ALL', 'NOW', 'NEW', 'OLD', 'BIG', 'TOP',
    'AI', 'PE', 'EPS', 'IPO', 'ETF', 'SIP', 'EMI', 'GDP', 'RBI', 'CEO',
    'JSON', 'API', 'URL', 'YES', 'NO', 'OK', 'RISK', 'SAFE', 'TERM',
    'LONG', 'SHORT', 'GOOD', 'BAD', 'BEST', 'GIVE', 'TELL', 'SHOW',
    'WITH', 'ABOUT', 'FROM', 'THIS', 'THAT', 'WILL', 'LIKE', 'NEED',
    'SHOULD', 'COULD', 'WOULD', 'STOCK', 'MARKET', 'INVEST', 'ANALYZE',
    'COMPARE', 'OUTLOOK', 'PRICE', 'TRADE', 'ANALYSIS', 'RIGHT', 'MUCH',
    'SOME', 'MANY', 'MOST', 'MORE', 'LESS', 'VERY', 'JUST', 'ALSO',
    'ONLY', 'EVEN', 'STILL', 'WELL', 'MAKE', 'TAKE', 'COME', 'KNOW',
    'LOOK', 'WANT', 'THINK', 'HELP', 'DOES', 'BEEN', 'HAVE', 'HAS',
    'HAD', 'WERE', 'WAS', 'EACH', 'OVER', 'SUCH', 'WHEN', 'THEN',
    'THEM', 'THEY', 'THAN', 'INTO', 'ALSO', 'BACK', 'BEST', 'NEXT',
    'LAST', 'SAME', 'WAY', 'OUR', 'ANY', 'TRY', 'SAY', 'SAID',
    'RISKY', 'HOLD', 'DOWN', 'STOP', 'CALL', 'CASH', 'FUND', 'GAIN',
    'LOSS', 'DROP', 'RATE', 'BOND', 'DEBT', 'BEAR', 'BULL', 'DIPS',
  ]);

  const matches = upper.match(/\b([A-Z]{2,5})\b/g);
  if (matches) {
    const found = matches.find((m) => !IGNORED.has(m));
    if (found) return found;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// FETCH STOCK DATA — uses the existing stock.service.js (has fallback)
// ═══════════════════════════════════════════════════════════════════
async function getFinancialContext(symbol) {
  if (!symbol) return null;

  try {
    const data = await getStockData(symbol);
    if (!data || !data.price) return null;

    const history = data.history || [];
    const prices = history.map((h) => h.close).filter(Boolean);
    const latestPrice = data.price;

    // Calculate today's simulated change from last two data points
    let change = 0;
    if (prices.length >= 2) {
      const prev = prices[prices.length - 2];
      const curr = prices[prices.length - 1];
      change = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    }

    // 52-week high/low from history
    let high52 = latestPrice, low52 = latestPrice;
    for (const h of history.slice(-252)) {
      if (h.high > high52) high52 = h.high;
      if (h.low < low52) low52 = h.low;
    }

    // Volatility-based risk
    const vol = data.volatility || 0;
    let risk = 'Low', trend = 'Neutral';
    if (vol > 35) { risk = 'High'; }
    else if (vol > 20) { risk = 'Medium'; }

    if (change > 0.5) trend = 'Bullish';
    else if (change < -0.5) trend = 'Bearish';

    // Volume from recent data
    const recentVol = history.length > 0 ? history[history.length - 1].volume : 0;

    return {
      stock: symbol,
      price: `$${latestPrice.toFixed(2)}`,
      priceNum: latestPrice,
      change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
      changeNum: change,
      trend,
      risk,
      volatility: `${vol.toFixed(1)}%`,
      high52w: `$${high52.toFixed(2)}`,
      low52w: `$${low52.toFixed(2)}`,
      volume: recentVol > 1e6 ? `${(recentVol / 1e6).toFixed(1)}M` : recentVol.toLocaleString(),
      returns30d: `${(data.returns || 0).toFixed(2)}%`,
    };
  } catch (e) {
    console.warn(`Stock data fetch failed for ${symbol}:`, e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// PARSE LLM JSON — robust extraction
// ═══════════════════════════════════════════════════════════════════
function parseAIResponse(rawText, context) {
  // Strip markdown wrappers
  let cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.summary || parsed.answer || parsed.reasoning) return normalizeResponse(parsed, context);
  } catch {}

  // Try extracting JSON block
  try {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.summary || parsed.answer || parsed.reasoning) return normalizeResponse(parsed, context);
    }
  } catch {}

  // Fallback: wrap plain text
  return normalizeResponse({ summary: cleaned }, context);
}

function normalizeResponse(parsed, context) {
  return {
    stock: parsed.stock || context?.stock || null,
    price: parsed.price || context?.price || null,
    change: parsed.change || context?.change || null,
    trend: parsed.trend || context?.trend || 'Neutral',
    risk: parsed.risk || context?.risk || 'Medium',
    confidence: parsed.confidence || '70%',
    summary: parsed.summary || parsed.answer || 'Analysis complete.',
    reasoning: parsed.reasoning || '',
    outlook: parsed.outlook || { short_term: '', long_term: '' },
    insight: parsed.insight || '',
    suggestedFollowUps: parsed.suggestedFollowUps || parsed.suggested_follow_ups || [],
  };
}

// ═══════════════════════════════════════════════════════════════════
// SMART FALLBACK — varied, data-driven responses
// ═══════════════════════════════════════════════════════════════════
const GENERAL_RESPONSES = [
  {
    summary: "Markets are currently navigating a complex macro environment. Central bank policies, inflation data, and corporate earnings are the key drivers this quarter. I'd recommend focusing on quality large-caps with strong balance sheets.",
    reasoning: "1. Interest rate expectations remain fluid — bond yields impact equity valuations directly\n2. Q1 earnings season is showing mixed results across sectors\n3. Geopolitical tensions add an uncertainty premium to risk assets\n4. Defensive sectors (healthcare, utilities) are outperforming cyclicals\n5. Dollar strength is headwind for emerging market equities",
    outlook: { short_term: "Expect range-bound trading with sector rotation favoring defensives", long_term: "Structural growth themes (AI, green energy, semiconductors) remain intact for 2025-2027" },
    insight: "Quality over speculation — focus on fundamentally strong companies in uncertain markets.",
  },
  {
    summary: "The current market cycle favors disciplined, research-driven investing. Momentum strategies are underperforming while value and quality factors show relative strength. This is a stock-picker's market.",
    reasoning: "1. Market breadth is narrowing — fewer stocks driving index returns\n2. Institutional flows favor large-cap quality and dividend payers\n3. Retail sentiment is cautiously optimistic but not euphoric\n4. Credit spreads remain contained, suggesting no imminent recession\n5. Technical indicators show major indices in a consolidation phase",
    outlook: { short_term: "Near-term volatility likely around economic data releases", long_term: "Long-term bull thesis intact if inflation trajectory continues moderating" },
    insight: "This is a stock-picker's market — broad index chasing won't deliver outsized returns.",
  },
  {
    summary: "Smart capital allocation is more important than timing market entries right now. Consider a barbell strategy: high-quality bonds on one end, selective growth equity on the other.",
    reasoning: "1. Risk-free rates are attractive — opportunity cost of holding cash is low\n2. Equity risk premium has compressed, making selective positioning key\n3. AI and semiconductor themes continue to attract institutional capital\n4. Consumer discretionary is showing stress signals in developing markets\n5. Gold and commodities provide portfolio diversification with inflation protection",
    outlook: { short_term: "Expect sector rotation as investors reassess rate cut timelines", long_term: "Structural growth in technology, healthcare innovation, and clean energy" },
    insight: "Barbell strategy — pair high-quality fixed income with selective growth bets.",
  },
];

function generateStockFallback(context, message) {
  const isBullish = context.changeNum >= 0;
  const volLevel = parseFloat(context.volatility) || 0;

  // Vary the analysis based on actual context
  const strengthDesc = isBullish
    ? `showing positive momentum with a ${context.change} move`
    : `under pressure with a ${context.change} decline`;

  const volDesc = volLevel > 35
    ? 'elevated volatility suggests higher risk — position sizing is critical'
    : volLevel > 20
    ? 'moderate volatility — suitable for medium risk tolerance investors'
    : 'relatively low volatility — a more stable profile within its peer group';

  const reasoningPoints = [
    `Price action: ${context.stock} is ${strengthDesc}, currently at ${context.price}`,
    `Volatility profile: Annualized volatility at ${context.volatility} — ${volDesc}`,
    `52-week range: Trading between ${context.low52w} and ${context.high52w}, indicating ${parseFloat(context.volatility) > 25 ? 'wide price swings' : 'a tighter trading band'}`,
    `Momentum: 30-day returns of ${context.returns30d} ${parseFloat(context.returns30d) > 0 ? 'suggest positive near-term trajectory' : 'indicate recent weakness — potential buying opportunity or continued downside'}`,
    `Volume: Recent volume at ${context.volume} — ${parseInt(context.volume) > 20 ? 'healthy institutional participation' : 'watch for volume confirmation on moves'}`,
  ];

  return {
    stock: context.stock,
    price: context.price,
    change: context.change,
    trend: context.trend,
    risk: context.risk,
    confidence: volLevel < 20 ? '82%' : volLevel < 35 ? '71%' : '58%',
    summary: `${context.stock} is currently ${strengthDesc}. Trading at ${context.price} with ${context.volatility} annualized volatility, the stock carries a ${context.risk.toLowerCase()} risk profile. The 52-week range of ${context.low52w} to ${context.high52w} provides important context for position sizing.`,
    reasoning: reasoningPoints.join('\n'),
    outlook: {
      short_term: isBullish
        ? `Near-term momentum is positive. Watch for continuation above ${context.price} with volume confirmation. Key risk: reversal on broader market weakness.`
        : `Short-term pressure evident. Look for support near recent lows. A bounce could materialize on oversold conditions, but confirmation needed.`,
      long_term: volLevel > 30
        ? `Higher volatility stocks require conviction — ensure this aligns with your risk tolerance and portfolio allocation limits. Consider hedging strategies.`
        : `Fundamentals support a hold thesis for medium-term investors. Monitor quarterly earnings for trajectory changes.`,
    },
    insight: `${context.stock} at ${context.price} (${context.change}) — ${context.risk} risk, ${context.trend.toLowerCase()} bias.`,
    suggestedFollowUps: [
      `Compare ${context.stock} with its main competitors`,
      `What's the long-term thesis for ${context.stock}?`,
      `Is ${context.stock} overvalued at current levels?`,
    ],
  };
}

function generateGeneralFallback(message) {
  const idx = Math.floor(Math.random() * GENERAL_RESPONSES.length);
  const base = GENERAL_RESPONSES[idx];

  return {
    stock: null,
    price: null,
    change: null,
    trend: 'Neutral',
    risk: 'Medium',
    confidence: '65%',
    summary: base.summary,
    reasoning: base.reasoning,
    outlook: base.outlook,
    insight: base.insight,
    suggestedFollowUps: [
      'Analyze TSLA in detail',
      'What are the safest stocks right now?',
      'Compare NVDA vs AMD',
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════
// POST /api/ai/chat
// ═══════════════════════════════════════════════════════════════════
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [], symbol, marketMode } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // 1. Extract stock symbol
    const extractedSymbol = extractSymbol(message, symbol);

    // 2. Fetch live stock data (uses stock.service.js with built-in fallback)
    const context = await getFinancialContext(extractedSymbol);

    // 3. Build data injection block for LLM
    let dataBlock = '';
    if (context) {
      dataBlock = `\n\nREAL-TIME MARKET DATA FOR ${context.stock}:
Stock: ${context.stock}
Price: ${context.price}
Change: ${context.change}
Trend: ${context.trend}
Risk: ${context.risk}
Volatility: ${context.volatility}
52-Week High: ${context.high52w}
52-Week Low: ${context.low52w}
Volume: ${context.volume}
30-Day Returns: ${context.returns30d}

IMPORTANT: Use this real data in your analysis. Cite specific numbers. Do NOT make up different numbers.`;
    }

    // 4. Market mode prompt modifier
    let modePrompt = '';
    if (marketMode === 'bull') {
      modePrompt = `\n\nMARKET MODE: BULL 🐂\nThe user is viewing the market through a BULLISH lens. Focus your analysis on:\n- Growth opportunities and upside potential\n- Positive catalysts and momentum signals\n- Entry points and accumulation strategies\n- Optimistic but realistic outlook\nTone: Confident, opportunity-focused. Highlight why this could be a good time to invest.`;
    } else if (marketMode === 'bear') {
      modePrompt = `\n\nMARKET MODE: BEAR 🐻\nThe user is viewing the market through a BEARISH lens. Focus your analysis on:\n- Downside risks and potential losses\n- Warning signals and red flags\n- Capital preservation and hedging strategies\n- Cautious, defensive outlook\nTone: Cautious, risk-aware. Highlight what could go wrong and how to protect capital.`;
    }

    // ──────────────────────────────────────────────
    // TRY GEMINI (free tier)
    // ──────────────────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { temperature: 0.85 },
        });

        // Build full conversation as a single prompt
        let fullPrompt = SYSTEM_PROMPT + modePrompt + dataBlock + '\n\n--- CONVERSATION ---\n';

        for (const msg of history.slice(-5)) {
          if (msg.role && msg.content) {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            fullPrompt += `\n${role}: ${msg.content}\n`;
          }
        }

        fullPrompt += `\nUser: ${message}\n\nAssistant (respond with JSON only):`;

        const result = await model.generateContent(fullPrompt);
        const rawText = result.response.text();
        const structured = parseAIResponse(rawText, context);

        return res.json({ ...structured, provider: 'gemini' });
      } catch (geminiErr) {
        console.warn('Gemini failed:', geminiErr.message);
      }
    }

    // ──────────────────────────────────────────────
    // TRY OPENAI
    // ──────────────────────────────────────────────
    if (process.env.OPENAI_API_KEY) {
      try {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const messages = [
          { role: 'system', content: SYSTEM_PROMPT + modePrompt + dataBlock },
        ];

        // Add conversation history (last 5 messages)
        for (const msg of history.slice(-5)) {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
            });
          }
        }

        messages.push({ role: 'user', content: message });

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.85,
          max_tokens: 1000,
        });

        const rawText = response.choices[0]?.message?.content?.trim() || '';
        const structured = parseAIResponse(rawText, context);

        return res.json({ ...structured, provider: 'openai' });
      } catch (openaiErr) {
        console.warn('OpenAI failed:', openaiErr.message);
      }
    }

    // ──────────────────────────────────────────────
    // SMART FALLBACK (no API key)
    // ──────────────────────────────────────────────
    const fallback = context
      ? generateStockFallback(context, message)
      : generateGeneralFallback(message);

    return res.json({ ...fallback, provider: 'fallback' });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    return res.status(500).json({
      stock: null, price: null, change: null,
      trend: 'Neutral', risk: 'Unknown', confidence: '0%',
      summary: 'AI assistant is temporarily unavailable. Please try again in a moment.',
      reasoning: '', outlook: { short_term: '', long_term: '' },
      insight: 'Service disruption — retrying should resolve this.',
      suggestedFollowUps: ['Try asking again', 'Analyze AAPL', 'Market overview'],
      error: true,
    });
  }
});

export default router;
