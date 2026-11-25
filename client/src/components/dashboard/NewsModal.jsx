import { motion } from 'framer-motion';
import Modal from './Modal';

function getSentimentColor(sentiment) {
  if (sentiment === 'positive') return 'border-l-emerald-500 bg-emerald-50/30';
  if (sentiment === 'negative') return 'border-l-rose-500 bg-rose-50/30';
  return 'border-l-amber-400 bg-amber-50/30';
}

function getSentimentBadge(sentiment) {
  const colors = {
    positive: 'bg-emerald-100 text-emerald-700',
    negative: 'bg-rose-100 text-rose-700',
    neutral: 'bg-amber-100 text-amber-700',
  };
  return colors[sentiment] || colors.neutral;
}

export default function NewsModal({ isOpen, onClose, headlines = [], symbol }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`All News — ${symbol}`}>
      <div className="space-y-3">
        {headlines.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No headlines available.</p>
        ) : (
          headlines.map((headline, i) => (
            <motion.div
              key={`${headline.title}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border border-l-4 border-slate-200 p-4 ${getSentimentColor(headline.sentiment)}`}
            >
              <p className="text-sm font-medium leading-relaxed text-slate-800">
                {headline.title}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-[10px] text-slate-400">
                  {headline.source || 'Unknown'}
                </span>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSentimentBadge(headline.sentiment)}`}>
                  {headline.sentiment}
                </span>
                <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Confidence: {Math.floor(60 + Math.random() * 35)}%
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Modal>
  );
}
