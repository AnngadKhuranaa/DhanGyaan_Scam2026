import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function LiveRefreshIndicator({ isRefreshing }) {
  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {isRefreshing ? (
          <motion.div
            key="refreshing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5"
          >
            <RefreshCw size={12} className="animate-spin text-brand-600" />
            <span className="text-[11px] font-semibold text-brand-600">Updating...</span>
          </motion.div>
        ) : (
          <motion.div
            key="live"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700">Live</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
