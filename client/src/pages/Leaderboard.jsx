import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function MarketTable({ title, rows }) {
  return (
    <div className="fintech-card p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      <div className="table-shell mt-4">
        <div className="table-head grid grid-cols-4 px-4 py-3">
          <span>Stock</span>
          <span>Name</span>
          <span>Price</span>
          <span>% Change</span>
        </div>

        <div className="divide-y divide-slate-200">
          {rows.map((row) => (
            <div key={row.symbol} className="table-row grid grid-cols-4 px-4 py-3">
              <span>{row.symbol}</span>
              <span>{row.name}</span>
              <span>Rs {row.price}</span>
              <span className={row.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {row.changePercent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [marketData, setMarketData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      setError('');

      try {
        const [marketResponse, leaderboardResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/market/top`),
          fetch(`${API_BASE_URL}/leaderboard`),
        ]);

        const [marketText, leaderboardText] = await Promise.all([
          marketResponse.text(),
          leaderboardResponse.text(),
        ]);

        console.log("RAW RESPONSE:", marketText, leaderboardText);

        let marketJson, leaderboardJson;
        try {
          marketJson = JSON.parse(marketText);
          leaderboardJson = JSON.parse(leaderboardText);
        } catch {
          throw new Error("Server returned HTML instead of JSON");
        }

        if (!marketResponse.ok) {
          throw new Error(marketJson.message || 'Failed to load market tables');
        }

        if (!leaderboardResponse.ok) {
          throw new Error(leaderboardJson.message || 'Failed to load leaderboard');
        }

        setMarketData(marketJson);
        setLeaderboard(Array.isArray(leaderboardJson) ? leaderboardJson : []);
      } catch (requestError) {
        setError(requestError.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <section className="space-y-8">
      <div className="section-header">
        <h1 className="section-title">Leaderboard</h1>
        <p className="section-copy">
          Track top market movers and compare paper-trading performance across portfolios.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-500">
          {error}
        </div>
      ) : null}

      <div className="fintech-card">
        <h2 className="text-2xl font-semibold text-slate-900">Portfolio Leaderboard</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Ranked by highest portfolio return percentage.
        </p>

        <div className="table-shell mt-6">
          <div className="table-head grid grid-cols-4 px-4 py-3">
            <span>User</span>
            <span>Return %</span>
            <span>Total PnL</span>
            <span>Portfolio Value</span>
          </div>
          <div className="divide-y divide-slate-200">
            {leaderboard.map((entry) => (
              <div key={entry.userId} className="table-row grid grid-cols-4 px-4 py-3">
                <span>{entry.email}</span>
                <span className={entry.totalReturnPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {entry.totalReturnPercent}%
                </span>
                <span>Rs {entry.totalPnL}</span>
                <span>Rs {entry.portfolioValue}</span>
              </div>
            ))}
            {!loading && leaderboard.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No leaderboard data available yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <MarketTable title="Top Gainers" rows={marketData?.topGainers || []} />
        <MarketTable title="Top Losers" rows={marketData?.topLosers || []} />
        <MarketTable title="Most Traded" rows={marketData?.mostTraded || []} />
      </div>
    </section>
  );
}
