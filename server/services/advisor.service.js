import logger from '../utils/logger.js';
import { round } from '../utils/stats.js';
import { generateText } from './ai.service.js';
import { getConfidence } from './insights.service.js';
import { getQuote } from './marketData.service.js';
import { getPortfolioSummary } from './portfolio.service.js';

export const DISCLAIMER =
  'Educational content generated from market data and your paper portfolio. It is not financial advice; do your own research before investing real money.';

const SYSTEM_PROMPT = `You are DhanGyaan's investing tutor for Indian retail investors who are learning with a paper-trading account.
Rules:
- Use ONLY the numbers in the CONTEXT block. If something isn't there, say you don't have that data. Never invent prices, news or fundamentals.
- Explain in plain English what the numbers mean for risk: trend, momentum, volatility, sentiment and the user's own position.
- Do not tell the user to buy or sell. You may describe what different kinds of investors might consider.
- Use ₹ for INR amounts and $ for USD. Keep answers under 220 words, short paragraphs or bullet points, no tables.
- Do not add a disclaimer; the app shows one.`;

/** Portfolio-level lines so general questions ("how am I doing?") have real data too. */
function portfolioLines(p) {
  const top = p.holdings.slice(0, 5).map((h) => `${h.symbol} ${h.allocationPercent}% (P&L ${h.unrealizedPnLPercent}%)`);
  return [
    `USER PORTFOLIO: value ₹${p.totalValue} (${p.totalReturnPercent}% since start), cash ₹${p.cash}, ${p.holdings.length} holdings.`,
    top.length ? `Largest holdings: ${top.join('; ')}.` : 'No holdings yet.',
  ];
}

/** Gather the real numbers the model is allowed to use. */
async function buildStockContext(userId, symbol) {
  const lines = [];
  const meta = { symbol: null, hasPosition: false, sentimentDemo: null };
  if (!symbol) {
    const portfolio = await getPortfolioSummary(userId);
    return { text: ['No specific stock selected.', ...portfolioLines(portfolio)].join('\n'), meta, confidence: null };
  }

  const [quote, confidence, portfolio] = await Promise.all([
    getQuote(symbol),
    getConfidence(symbol).catch((e) => {
      logger.warn(`AI context: confidence failed for ${symbol}: ${e.message}`);
      return null;
    }),
    getPortfolioSummary(userId),
  ]);

  meta.symbol = quote.symbol;
  lines.push(
    `STOCK ${quote.symbol} (${quote.name}), listed ${quote.exchange}, currency ${quote.currency}.`,
    `Price ${quote.price} ${quote.currency}; today ${round(quote.changePercent ?? 0)}%; 52-week range ${quote.fiftyTwoWeekLow}–${quote.fiftyTwoWeekHigh}.`
  );

  if (confidence) {
    lines.push(`Confidence score ${confidence.score}/100 (${confidence.label}). Components:`);
    for (const c of confidence.components) {
      lines.push(`- ${c.label}: ${c.score ?? 'n/a'}/100${c.included ? '' : ' (excluded)'}: ${c.explanation}`);
    }
    meta.sentimentDemo = confidence.sentimentDemo;
  }

  const position = portfolio.holdings.find((h) => h.symbol === quote.symbol);
  if (position) {
    meta.hasPosition = true;
    lines.push(
      `USER POSITION: ${position.quantity} shares, average price ${position.avgPrice} ${position.currency}, market value ₹${position.marketValueInr}, unrealised P&L ₹${position.unrealizedPnL} (${position.unrealizedPnLPercent}%), ${position.allocationPercent}% of their portfolio.`
    );
  } else {
    lines.push('USER POSITION: none in this stock.');
  }
  lines.push(...portfolioLines(portfolio));

  return { text: lines.join('\n'), meta, confidence };
}

function ruleBasedStockAnswer(contextText, confidence) {
  if (!confidence) {
    return [
      'The AI tutor needs GEMINI_API_KEY or OPENAI_API_KEY on the server, so I can only show computed data.',
      '',
      contextText.replace('No specific stock selected.\n', ''),
      '',
      'Pick a stock above to see its trend, momentum, volatility and sentiment scores, or use Portfolio → “Explain my portfolio”.',
    ].join('\n');
  }
  const strongest = [...confidence.components].filter((c) => c.included).sort((a, b) => b.score - a.score);
  return [
    `Confidence ${confidence.score}/100 (${confidence.label}).`,
    `Strongest signal: ${strongest[0].label} (${strongest[0].score}). ${strongest[0].explanation}`,
    `Weakest signal: ${strongest.at(-1).label} (${strongest.at(-1).score}). ${strongest.at(-1).explanation}`,
    '',
    'This is a rule-based summary because no AI provider key (GEMINI_API_KEY / OPENAI_API_KEY) is configured.',
  ].join('\n');
}

/** Chat about a stock (optional) with the user's real context. */
export async function chat({ userId, message, symbol, history = [] }) {
  const { text: contextText, meta, confidence } = await buildStockContext(userId, symbol);

  const messages = [
    ...history.slice(-8).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: `CONTEXT:\n${contextText}\n\nQUESTION: ${message}` },
  ];

  const ai = await generateText({ system: SYSTEM_PROMPT, messages });
  if (ai) return { reply: ai.text, provider: ai.provider, model: ai.model, context: meta, disclaimer: DISCLAIMER };

  return {
    reply: ruleBasedStockAnswer(contextText, confidence),
    provider: 'rule-based',
    model: null,
    context: meta,
    disclaimer: DISCLAIMER,
  };
}

/** Plain-language explanation of the user's whole paper portfolio. */
export async function explainPortfolio(userId) {
  const p = await getPortfolioSummary(userId);
  const holdingsText = p.holdings.length
    ? p.holdings
        .map((h) => `- ${h.symbol} (${h.market}): ${h.quantity} sh, ${h.allocationPercent}% of portfolio, P&L ₹${h.unrealizedPnL} (${h.unrealizedPnLPercent}%)`)
        .join('\n')
    : '- (no holdings)';
  const contextText = [
    `Starting balance ₹${p.startingBalance}; total value ₹${p.totalValue} (${p.totalReturnPercent}%).`,
    `Cash ₹${p.cash} (${p.allocation.at(-1).percent}% of portfolio). Invested cost ₹${p.invested}.`,
    `Realised P&L ₹${p.realizedPnL}; unrealised P&L ₹${p.unrealizedPnL}.`,
    'Holdings:',
    holdingsText,
  ].join('\n');

  const ai = await generateText({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `CONTEXT:\n${contextText}\n\nQUESTION: Explain how my paper portfolio is doing, how concentrated or diversified it is, and the main risks I should understand.` }],
  });
  if (ai) return { reply: ai.text, provider: ai.provider, model: ai.model, disclaimer: DISCLAIMER };

  const top = p.holdings[0];
  const reply = p.holdings.length
    ? [
        `Your portfolio is ${p.totalReturnPercent >= 0 ? 'up' : 'down'} ${Math.abs(p.totalReturnPercent)}% since you started.`,
        `Largest position: ${top.symbol} at ${top.allocationPercent}% of the portfolio${top.allocationPercent > 25 ? ', which is concentrated: one stock moves your whole result' : ''}.`,
        `You hold ${p.holdings.length} stock${p.holdings.length > 1 ? 's' : ''} and ${p.allocation.at(-1).percent}% cash.`,
        '',
        'This is a rule-based summary because no AI provider key is configured.',
      ].join('\n')
    : 'You have no holdings yet. Place a paper trade to see an explanation of your portfolio.';
  return { reply, provider: 'rule-based', model: null, disclaimer: DISCLAIMER };
}
