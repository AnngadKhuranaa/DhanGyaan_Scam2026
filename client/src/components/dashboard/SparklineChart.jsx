import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * Generate mock sparkline data points from a base price
 */
export function generateSparklineData(basePrice, points = 20, trend = 0) {
  const data = [];
  let price = basePrice * 0.97;
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48 + trend * 0.02) * basePrice * 0.008;
    price = Math.max(price + change, basePrice * 0.85);
    data.push({ value: Number(price.toFixed(2)) });
  }
  
  return data;
}

export default function SparklineChart({ data, positive = true, height = 40 }) {
  if (!data || data.length === 0) return null;

  const color = positive ? '#10b981' : '#f43f5e';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
