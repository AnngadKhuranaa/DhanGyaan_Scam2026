import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { changeClass, formatPercent, formatSignedCurrency } from '../../utils/formatCurrency';

/**
 * Percentage change with an arrow. Direction is shown by colour AND icon AND
 * sign, so it doesn't rely on colour alone (colour-blind friendly).
 */
export function PercentChange({ value, className = '' }) {
  if (typeof value !== 'number') return <span className={`muted ${className}`}>—</span>;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular ${changeClass(value)} ${className}`}>
      <Icon size={14} aria-hidden="true" />
      {formatPercent(value)}
    </span>
  );
}

export function SignedMoney({ value, currency = 'INR', className = '' }) {
  return <span className={`tabular font-medium ${changeClass(value)} ${className}`}>{formatSignedCurrency(value, currency)}</span>;
}

/** Label + value tile used in summary rows. */
export function Stat({ label, value, sub, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular text-slate-900 sm:text-2xl dark:text-white">{value}</p>
      {sub && <div className="mt-1 text-sm">{sub}</div>}
    </div>
  );
}
