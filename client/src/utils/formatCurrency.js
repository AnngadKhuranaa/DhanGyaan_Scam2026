/**
 * All money and percentages in the UI go through these helpers.
 * INR uses Indian digit grouping (₹12,34,567.89); USD uses $1,234,567.89.
 */

const formatters = new Map();
function getFormatter(currency, digits) {
  const key = `${currency}:${digits}`;
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    );
  }
  return formatters.get(key);
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Currency for a ticker or market code: NSE/BSE and Indian indices are INR, everything else USD. */
export function currencyOf(symbolOrMarket = '') {
  if (symbolOrMarket === 'IN') return 'INR';
  if (symbolOrMarket === 'US') return 'USD';
  return /\.(NS|BO)$/i.test(symbolOrMarket) || ['^NSEI', '^NSEBANK', '^BSESN'].includes(symbolOrMarket) ? 'INR' : 'USD';
}

/** formatCurrency(1234567.8, 'INR') -> "₹12,34,567.80" */
export function formatCurrency(value, currency = 'INR', digits = 2) {
  if (!isNum(value)) return '—';
  return getFormatter(currency, digits).format(value);
}

/** Signed amount for P&L: "+₹1,200.00" / "−₹350.50". */
export function formatSignedCurrency(value, currency = 'INR', digits = 2) {
  if (!isNum(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatCurrency(Math.abs(value), currency, digits)}`;
}

/** Compact: ₹1.2Cr, ₹3.4L, $5.6M. */
export function formatCompact(value, currency = 'INR') {
  if (!isNum(value)) return '—';
  const symbol = currency === 'INR' ? '₹' : '$';
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (currency === 'INR') {
    // Large-cap market caps are quoted in lakh crore (1 L Cr = 1e12), e.g. ₹4.62L Cr.
    if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}L Cr`;
    if (abs >= 1e7) return `${sign}${symbol}${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}${symbol}${(abs / 1e5).toFixed(2)}L`;
  } else {
    if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(1)}K`;
  return formatCurrency(value, currency);
}

/** "+1.23%" / "−0.45%" */
export function formatPercent(value, digits = 2) {
  if (!isNum(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

/** Share volume: 12.3M, 4.5K. */
export function formatVolume(value) {
  if (!isNum(value)) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

export function formatNumber(value, digits = 0) {
  if (!isNum(value)) return '—';
  return value.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

/** Tailwind class for a directional value. Green/red are reserved for this. */
export function changeClass(value) {
  if (!isNum(value) || value === 0) return 'text-slate-600 dark:text-slate-400';
  return value > 0 ? 'text-gain-c' : 'text-loss-c';
}
