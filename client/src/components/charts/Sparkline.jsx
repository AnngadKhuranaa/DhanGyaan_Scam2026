import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { marketService } from '../../services';
import useAsync from '../../hooks/useAsync';
import useUIStore from '../../store/useUIStore';

const COLORS = { light: { up: '#047857', down: '#be123c' }, dark: { up: '#34d399', down: '#fb7185' } };

/** Tiny 1-month trend line from REAL daily closes (cached server-side for 30 min). */
export default function Sparkline({ symbol, height = 36, width = 96 }) {
  const theme = useUIStore((s) => s.theme);
  const { data, loading, error } = useAsync(() => marketService.history(symbol, '1mo'), [symbol]);

  if (loading) return <div className="skeleton" style={{ height, width }} aria-hidden="true" />;
  if (error || !data?.candles?.length) return <div style={{ height, width }} aria-hidden="true" />;

  const points = data.candles.map((c) => ({ v: c.close }));
  const up = points[points.length - 1].v >= points[0].v;
  const color = (COLORS[theme] || COLORS.light)[up ? 'up' : 'down'];
  return (
    <div style={{ height, width }} role="img" aria-label={`${symbol} 1-month trend ${up ? 'up' : 'down'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line type="monotone" dataKey="v" dot={false} strokeWidth={1.6} stroke={color} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
