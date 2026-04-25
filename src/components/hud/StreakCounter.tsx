"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  const hasStreak = streak > 0;

  return (
    <motion.div
      className="flex items-center gap-3.5 px-4 py-2 bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg font-sans group transition-all hover:border-sky-500/30"
      whileHover={hasStreak ? { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 20 } } : {}}
    >
      {/* Animated lightning icon */}
      <div className="relative">
        <motion.div
          animate={hasStreak ? { 
            scale: [1, 1.1, 1],
            rotate: [-5, 5, -5],
          } : {}}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-10"
        >
          <svg 
            className="w-5 h-5 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" 
            viewBox="0 0 24 24" 
            fill={hasStreak ? "url(#lightningGradientPremium)" : "none"}
            stroke={hasStreak ? "none" : "#3f3f46"}
            strokeWidth={2}
          >
            <defs>
              <linearGradient id="lightningGradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />    {/* Sky 400 */}
                <stop offset="50%" stopColor="#6366f1" />    {/* Indigo 500 */}
                <stop offset="100%" stopColor="#a855f7" />   {/* Purple 500 */}
              </linearGradient>
            </defs>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
        
        {/* Glow effect when active */}
        <AnimatePresence>
          {hasStreak && (
            <motion.div
              className="absolute inset-0 blur-xl bg-sky-500/30 -z-10 rounded-full"
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.3, 0.8] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col pr-1">
        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.25em] font-black leading-none mb-1">
          Streak
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[17px] font-black leading-none tracking-tight tabular-nums ${hasStreak ? "text-transparent bg-clip-text bg-gradient-to-br from-sky-400 to-indigo-500 drop-shadow-sm" : "text-zinc-600"}`}>
            {streak}
          </span>
          <span className={`text-[9px] uppercase tracking-widest font-black ${hasStreak ? "text-sky-400/80" : "text-zinc-700"}`}>
            {streak === 1 ? "Day" : "Days"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}