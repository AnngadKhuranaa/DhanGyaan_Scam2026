const tradeHistory = [
  { stock: 'TCS', action: 'Buy', quantity: 12, price: 'Rs 3,980', status: 'Executed' },
  { stock: 'Infosys', action: 'Sell', quantity: 8, price: 'Rs 1,540', status: 'Executed' },
  { stock: 'HDFC Bank', action: 'Buy', quantity: 15, price: 'Rs 1,720', status: 'Executed' },
];

export default function Trading() {
  return (
    <section className="space-y-8">
      <div className="section-header">
        <h1 className="section-title">Trading</h1>
        <p className="section-copy">
          Practice trades with a virtual balance and review sample order activity.
        </p>
      </div>

      <div className="fintech-card p-6">
        <p className="text-sm text-slate-400">Virtual Balance</p>
        <h2 className="mt-2 text-3xl font-semibold text-emerald-300">Rs 100000</h2>
      </div>

      <div className="fintech-card p-6">
        <h2 className="text-lg font-semibold text-slate-100">Trade Form</h2>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Stock Name</span>
            <input type="text" placeholder="e.g. Reliance" className="fintech-input" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Quantity</span>
            <input type="number" placeholder="e.g. 10" className="fintech-input" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-300">Action</span>
            <select className="fintech-input">
              <option>Buy</option>
              <option>Sell</option>
            </select>
          </label>
        </div>

        <button type="button" className="fintech-button mt-5">
          Execute Trade
        </button>
      </div>

      <div className="fintech-card p-6">
        <h2 className="text-lg font-semibold text-slate-100">Trade History</h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-5 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-400">
            <span>Stock</span>
            <span>Action</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-white/10">
            {tradeHistory.map((trade, index) => (
              <div
                key={`${trade.stock}-${index}`}
                className="grid grid-cols-5 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/[0.03]"
              >
                <span>{trade.stock}</span>
                <span>{trade.action}</span>
                <span>{trade.quantity}</span>
                <span>{trade.price}</span>
                <span>{trade.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
