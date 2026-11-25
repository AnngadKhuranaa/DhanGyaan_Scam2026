import { motion } from 'framer-motion';

export default function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70 ${className}`}
    >
      {/* Title skeleton */}
      <div className="skeleton-shimmer h-3 w-24 rounded-full" />
      
      {/* Value skeleton */}
      <div className="skeleton-shimmer mt-4 h-8 w-32 rounded-lg" />
      
      {/* Extra lines */}
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer mt-4 h-3 rounded-full"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      ))}
    </motion.div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
      <div className="space-y-2">
        <div className="skeleton-shimmer h-4 w-16 rounded" />
        <div className="skeleton-shimmer h-3 w-24 rounded" />
      </div>
      <div className="skeleton-shimmer h-10 w-16 rounded-lg" />
    </div>
  );
}
