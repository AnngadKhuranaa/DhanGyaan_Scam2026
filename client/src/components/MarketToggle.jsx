import useUIStore from '../store/useUIStore';

const OPTIONS = [
  { value: 'IN', label: 'NSE', title: 'Indian stocks (NSE), prices in ₹' },
  { value: 'US', label: 'US', title: 'US stocks (NYSE/NASDAQ), prices in $' },
];

/** Switch the whole app between NSE and US markets (movers, search, indices). */
export default function MarketToggle({ className = '' }) {
  const market = useUIStore((s) => s.market);
  const setMarket = useUIStore((s) => s.setMarket);

  return (
    <div role="radiogroup" aria-label="Market" className={`tab-list ${className}`}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={market === o.value}
          title={o.title}
          onClick={() => setMarket(o.value)}
          className={`tab ${market === o.value ? 'tab-active' : ''}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
