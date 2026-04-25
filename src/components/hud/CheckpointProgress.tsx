"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CheckpointProgressProps {
  completed: number;
  total: number;
  goldCount: number;
}

export function CheckpointProgress({ completed, total, goldCount }: CheckpointProgressProps) {
  const percentage = Math.min((completed / total) * 100, 100);

  return (
    <div className="flex items-center gap-3.5 font-sans group">
      {/* Checkpoint count with icon */}
      <div className="flex flex-col">
        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
          Checkpoint
        </span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20">
            <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[14px] font-black text-white leading-none">{completed}</span>
            <span className="text-[10px] text-zinc-500 font-bold">/{total}</span>
          </div>
        </div>
      </div>

      {/* Progress bar with modern styling */}
      <div className="relative w-24 h-2 bg-black/40 backdrop-blur-sm border border-white/5 rounded-full overflow-hidden shadow-inner mt-4">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
          {/* Inner highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-full" />
        </motion.div>
      </div>

      {/* Gold count badge - premium look */}
      <AnimatePresence>
        {goldCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, x: -10 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            className="flex flex-col items-center mt-0.5"
          >
            <span className="text-[8px] text-amber-500/80 font-black uppercase tracking-tighter mb-0.5">Gold</span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <svg className="w-3 h-3 text-amber-400 drop-shadow-[0_0_3px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-[11px] font-black text-amber-400 tabular-nums leading-none">{goldCount}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}