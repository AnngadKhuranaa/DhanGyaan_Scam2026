import NewsAPI from 'newsapi';

const CACHE_TTL_MS = 15 * 60 * 1000;
const sentimentCache = new Map();

const POSITIVE_KEYWORDS = [
  'surge',
  'gain',
  'growth',
  'beat',
  'strong',
  'up',
  'rise',
  'profit',
  'bullish',
  'record',
];

const NEGATIVE_KEYWORDS = [
  'fall',
  'drop',
  'loss',
  'weak',
  'down',
  'risk',
  'bearish',
  'miss',
  'decline',
  'concern',
];

// Fallback mock headlines when NEWS_API_KEY is not available
const MOCK_HEADLINES = {
  AAPL: [
    { title: 'Apple reports strong quarterly earnings, beats Wall Street estimates', source: 'Reuters', url: '#', sentiment: 'positive' },
    { title: 'iPhone demand shows signs of growth in emerging markets', source: 'Bloomberg', url: '#', sentiment: 'positive' },
    { title: 'Apple faces regulatory concerns in EU over App Store policies', source: 'CNBC', url: '#', sentiment: 'negative' },
  ],
  MSFT: [
    { title: 'Microsoft Azure cloud revenue surges 29% year-over-year', source: 'TechCrunch', url: '#', sentiment: 'positive' },
    { title: 'Microsoft AI Copilot adoption rises across enterprise clients', source: 'The Verge', url: '#', sentiment: 'positive' },
  ],
  TSLA: [
    { title: 'Tesla reports decline in vehicle deliveries this quarter', source: 'Reuters', url: '#', sentiment: 'negative' },
    { title: 'Analysts bearish on Tesla amid rising competition', source: 'Bloomberg', url: '#', sentiment: 'negative' },
    { title: 'Tesla expands Supercharger network with record installations', source: 'Electrek', url: '#', sentiment: 'positive' },
  ],
  GOOGL: [
    { title: 'Google Search revenue continues strong growth trajectory', source: 'CNBC', url: '#', sentiment: 'positive' },
    { title: 'Alphabet faces antitrust concerns over ad market dominance', source: 'WSJ', url: '#', sentiment: 'negative' },
  ],
};

function classifyHeadline(headline) {
  const text = String(headline || '').toLowerCase();

  const positiveMatches = POSITIVE_KEYWORDS.filter((keyword) =>
    text.includes(keyword)
  ).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter((keyword) =>
    text.includes(keyword)
  ).length;

  if (positiveMatches > negativeMatches) {
    return { label: 'positive', score: 1 };
  }

  if (negativeMatches > positiveMatches) {
    return { label: 'negative', score: -1 };
  }

  return { label: 'neutral', score: 0 };
}

function buildSummary(score) {
  if (score > 0.2) {
    return 'Recent news flow looks mostly positive for this stock.';
  }

  if (score < -0.2) {
    return 'Recent news flow looks mostly negative for this stock.';
  }

  return 'Recent news flow looks mixed to neutral for this stock.';
}

function buildMockSentiment(symbol) {
  const mockHeadlines = MOCK_HEADLINES[symbol] || [
    { title: `${symbol} trades steady amid mixed market conditions`, source: 'MarketWatch', url: '#', sentiment: 'neutral' },
    { title: `Analysts maintain hold rating on ${symbol}`, source: 'Seeking Alpha', url: '#', sentiment: 'neutral' },
  ];

  const averageScore =
    mockHeadlines.reduce((sum, item) => {
      const score =
        item.sentiment === 'positive'
          ? 1
          : item.sentiment === 'negative'
            ? -1
            : 0;
      return sum + score;
    }, 0) / mockHeadlines.length;

  return {
    sentimentScore: Number(averageScore.toFixed(2)),
    summary: buildSummary(averageScore),
    topHeadlines: mockHeadlines,
  };
}

export async function getSentimentData(symbol) {
  const normalizedSymbol = String(symbol || '').trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error('Stock symbol is required');
  }

  const cachedEntry = sentimentCache.get(normalizedSymbol);

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.data;
  }

  // Fall back to mock data if no API key
  if (!process.env.NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not configured — using mock sentiment data');
    const mockData = buildMockSentiment(normalizedSymbol);

    sentimentCache.set(normalizedSymbol, {
      data: mockData,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return mockData;
  }

  try {
    const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
    const response = await newsapi.v2.everything({
      q: normalizedSymbol,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 5,
    });

    const topHeadlines = (response.articles || [])
      .slice(0, 5)
      .map((article) => {
        const title = article.title || '';
        const sentiment = classifyHeadline(title);

        return {
          title,
          source: article.source?.name || 'Unknown',
          url: article.url || '',
          sentiment: sentiment.label,
        };
      });

    const averageScore =
      topHeadlines.length > 0
        ? topHeadlines.reduce((sum, item) => {
            const score =
              item.sentiment === 'positive'
                ? 1
                : item.sentiment === 'negative'
                  ? -1
                  : 0;

            return sum + score;
          }, 0) / topHeadlines.length
        : 0;

    const data = {
      sentimentScore: Number(averageScore.toFixed(2)),
      summary: buildSummary(averageScore),
      topHeadlines,
    };

    sentimentCache.set(normalizedSymbol, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return data;
  } catch (error) {
    console.warn(`News API failed for ${normalizedSymbol}: ${error.message}. Using mock data.`);
    const mockData = buildMockSentiment(normalizedSymbol);

    sentimentCache.set(normalizedSymbol, {
      data: mockData,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return mockData;
  }
}
