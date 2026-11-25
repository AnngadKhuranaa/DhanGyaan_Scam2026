import { motion } from 'framer-motion';
import { Sparkles, Lightbulb } from 'lucide-react';

/**
 * Reusable insight panel that appears below charts / simulations.
 * @param {string[]} insights — array of insight strings
 * @param {string} title — optional title override
 */
export default function InsightPanel({ insights = [], title = 'AI Insights' }) {
  if (!insights.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-sky-50/40 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 shadow-sm">
          <Sparkles size={13} className="text-white" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      <div className="space-y-2.5">
        {insights.map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
