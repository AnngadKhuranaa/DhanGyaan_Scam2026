import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, ColorType, HistogramSeries, createChart } from 'lightweight-charts';
import { marketService } from '../../services';
import useAsync from '../../hooks/useAsync';
import useUIStore from '../../store/useUIStore';
import { ErrorState } from '../ui/States';

const RANGES = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];

const THEMES = {
  light: { bg: '#ffffff', text: '#475569', grid: '#f1f5f9', up: '#047857', down: '#be123c' },
  dark: { bg: '#0f172a', text: '#94a3b8', grid: '#1e293b', up: '#34d399', down: '#fb7185' },
};

/** Real daily candles (TradingView lightweight-charts) with a range selector. */
export default function PriceChart({ symbol, height = 320, defaultRange = '6mo' }) {
  const [range, setRange] = useState(defaultRange);
  const theme = useUIStore((s) => s.theme);
  const containerRef = useRef(null);
  const { data, error, loading, reload } = useAsync(() => marketService.history(symbol, range), [symbol, range]);

  useEffect(() => {
    if (!data?.candles?.length || !containerRef.current) return undefined;
    const c = THEMES[theme] || THEMES.light;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: c.bg }, textColor: c.text, fontFamily: 'Inter, system-ui' },
      grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: c.up, downColor: c.down, wickUpColor: c.up, wickDownColor: c.down, borderVisible: false,
    });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const toTime = (iso) => Math.floor(new Date(iso).getTime() / 1000);
    candles.setData(data.candles.map((k) => ({ time: toTime(k.date), open: k.open, high: k.high, low: k.low, close: k.close })));
    volume.setData(
      data.candles.map((k) => ({ time: toTime(k.date), value: k.volume, color: k.close >= k.open ? `${c.up}55` : `${c.down}55` }))
    );
    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [data, theme]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="muted text-xs">Daily candles · source: Yahoo Finance</p>
        <div className="tab-list" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`tab px-2.5 py-1 text-xs ${range === r ? 'tab-active' : ''}`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {loading && <div style={{ height }} className="skeleton w-full" role="status" aria-label="Loading chart" />}
      {error && <ErrorState error={error} onRetry={reload} title="Chart unavailable" compact />}
      {!loading && !error && (
        <div ref={containerRef} style={{ height }} className="w-full" role="img" aria-label={`${symbol} price chart, ${range}`} />
      )}
    </div>
  );
}
