import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, ShieldCheck, AlertTriangle, DoorOpen,
  ArrowRight, Sparkles,
} from 'lucide-react';

// Interactive tool modals
import TimeTableModal from '../components/insights/TimeTableModal';
import ConfidenceModal from '../components/insights/ConfidenceModal';
import WorstCaseModal from '../components/insights/WorstCaseModal';
import ExitCoachModal from '../components/insights/ExitCoachModal';

const FEATURES = [
  {
    id: 'timetable',
    icon: BarChart3,
    title: 'Time-table Portfolio',
    description: 'Visualize how your investment evolves over time with SIP and lump-sum projections.',
    gradient: 'from-indigo-500 to-blue-500',
    glowColor: 'hover:shadow-indigo-200/50',
  },
  {
    id: 'confidence',
    icon: ShieldCheck,
    title: 'Confidence Breakdown',
    description: 'Get a confidence score combining sentiment, volatility, news impact, and trend strength.',
    gradient: 'from-emerald-500 to-teal-500',
    glowColor: 'hover:shadow-emerald-200/50',
  },
  {
    id: 'worstcase',
    icon: AlertTriangle,
    title: 'Worst Case Reality',
    description: 'Stress-test your portfolio against historical crashes and see realistic downside scenarios.',
    gradient: 'from-amber-500 to-orange-500',
    glowColor: 'hover:shadow-amber-200/50',
  },
  {
    id: 'exit',
    icon: DoorOpen,
    title: 'Smart Exit Coach',
    description: 'Get stop-loss, target prices, support/resistance levels, and hold-or-sell guidance.',
    gradient: 'from-violet-500 to-purple-500',
    glowColor: 'hover:shadow-violet-200/50',
  },
];

export default function Insights() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="section-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="section-title">Investor Insights</h1>
            <p className="section-copy mt-1">
              Advanced tools to evaluate risk, confidence, and exit strategies.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Cards — 2×2 Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={feat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(79, 70, 229, 0.10)' }}
              onClick={() => setActiveModal(feat.id)}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-md shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${feat.glowColor}`}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-slate-50/60 transition-all duration-500 group-hover:to-indigo-50/30" />

              <div className="relative">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                  <Icon size={22} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {feat.description}
                </p>

                <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Launch Tool
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom info strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/50 to-blue-50/30 px-6 py-5"
      >
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">All tools use real calculations</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Each tool provides interactive, data-driven analysis. SIP projections use compound growth, confidence scores combine multiple signals, and crash simulations reference historical market events.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <TimeTableModal isOpen={activeModal === 'timetable'} onClose={() => setActiveModal(null)} />
      <ConfidenceModal isOpen={activeModal === 'confidence'} onClose={() => setActiveModal(null)} />
      <WorstCaseModal isOpen={activeModal === 'worstcase'} onClose={() => setActiveModal(null)} />
      <ExitCoachModal isOpen={activeModal === 'exit'} onClose={() => setActiveModal(null)} />
    </section>
  );
}
