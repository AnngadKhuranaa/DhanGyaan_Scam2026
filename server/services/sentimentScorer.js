/**
 * Deterministic, explainable headline sentiment.
 *
 * Each headline is tokenised into whole words (so "up" no longer matches
 * "update" or "support", a bug in the old substring scorer). Matched words add
 * their lexicon weight; a negator in the two words before a term flips its sign
 * ("fails to beat" counts as negative). The raw sum is squashed with tanh into
 * (-1, 1), so one very strong headline can't dominate. Same input -> same score, always.
 */

const LEXICON = {
  // positive
  beat: 2, beats: 2, surge: 2, surges: 2, surged: 2, soar: 2, soars: 2, soared: 2,
  rally: 2, rallies: 2, rallied: 2, record: 1.5, upgrade: 2, upgrades: 2, upgraded: 2,
  outperform: 2, outperforms: 2, bullish: 2, jump: 1.5, jumps: 1.5, jumped: 1.5,
  gain: 1, gains: 1, gained: 1, rise: 1, rises: 1, rose: 1, rising: 1, growth: 1,
  grows: 1, profit: 1, profits: 1, strong: 1, stronger: 1, boost: 1, boosts: 1,
  wins: 1, win: 1, approval: 1.5, approved: 1.5, buyback: 1, expands: 1, expansion: 1,
  upbeat: 1.5, optimism: 1.5, optimistic: 1.5, recovery: 1, rebound: 1.5, rebounds: 1.5,
  dividend: 0.5, partnership: 0.5, launches: 0.5, high: 0.5, highs: 1,
  // negative
  miss: -2, misses: -2, missed: -2, plunge: -2.5, plunges: -2.5, plunged: -2.5,
  slump: -2, slumps: -2, crash: -2.5, crashes: -2.5, tumble: -2, tumbles: -2, tumbled: -2,
  downgrade: -2, downgrades: -2, downgraded: -2, underperform: -2, bearish: -2,
  loss: -1.5, losses: -1.5, fall: -1, falls: -1, fell: -1, falling: -1, drop: -1,
  drops: -1, dropped: -1, decline: -1, declines: -1, declined: -1, weak: -1, weaker: -1,
  slides: -1, slid: -1, sink: -1.5, sinks: -1.5, lawsuit: -1.5, probe: -1.5, fraud: -2.5,
  penalty: -1.5, fine: -0.5, fined: -1.5, layoffs: -1.5, cuts: -1, cut: -1, warning: -1.5,
  warns: -1.5, concern: -1, concerns: -1, selloff: -2, risk: -0.5, risks: -0.5,
  default: -2, recall: -1.5, halt: -1.5, slowdown: -1.5, lows: -1, low: -0.5,
};

const NEGATORS = new Set(['not', 'no', 'never', 'without', 'fails', 'failed', 'fail', "isn't", "doesn't", "didn't", "won't"]);
const LABEL_THRESHOLD = 0.15;

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/sell-off/g, 'selloff')
    .match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

/** Score one headline -> { score in (-1,1), label, matched: ["beat (+2)", ...] }. */
export function scoreText(text) {
  const tokens = tokenize(text);
  let raw = 0;
  const matched = [];

  tokens.forEach((token, i) => {
    const weight = LEXICON[token];
    if (weight === undefined) return;
    const negated = NEGATORS.has(tokens[i - 1]) || NEGATORS.has(tokens[i - 2]);
    const w = negated ? -weight : weight;
    raw += w;
    matched.push(`${negated ? 'not ' : ''}${token} (${w > 0 ? '+' : ''}${w})`);
  });

  const score = Math.round(Math.tanh(raw / 2) * 1000) / 1000;
  return { score, label: toLabel(score), matched };
}

export function toLabel(score) {
  if (score > LABEL_THRESHOLD) return 'positive';
  if (score < -LABEL_THRESHOLD) return 'negative';
  return 'neutral';
}

/** Average the headline scores into one -1..+1 reading with counts. */
export function aggregate(headlines) {
  if (headlines.length === 0) return { score: 0, label: 'neutral', counts: { positive: 0, neutral: 0, negative: 0 } };
  const score = Math.round((headlines.reduce((s, h) => s + h.score, 0) / headlines.length) * 1000) / 1000;
  const counts = { positive: 0, neutral: 0, negative: 0 };
  headlines.forEach((h) => { counts[h.label] += 1; });
  return { score, label: toLabel(score), counts };
}
