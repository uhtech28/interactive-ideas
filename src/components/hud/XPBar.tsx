"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  maxXP: number;
}

const XPBarComponent = ({ currentXP, maxXP }: XPBarProps) => {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);
  const isNearlyFull = percentage >= 90;

  return (
    <div className="flex items-center gap-3.5 font-sans group">
      {/* XP Icon with modern frame */}
      <div className="relative w-10 h-10 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105">
        <Zap
          className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          fill="currentColor"
        />
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
      </div>

      {/* XP Bar Container */}
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none">
            Experience
          </span>
          <span className="text-[10px] text-cyan-400/80 font-bold tabular-nums">
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Bar with modern styling */}
        <div className="relative w-44 h-3 bg-black/40 backdrop-blur-sm border border-white/5 rounded-full overflow-hidden shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] flex items-center p-[1px]">
          {/* Animated XP Fill */}
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
          >
            {/* Main Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-indigo-500 to-cyan-400" />
            
            {/* Animated Pulse Overlay */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Inner top highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 rounded-full" />
          </motion.div>

          {/* Nearly full pulse effect */}
          {isNearlyFull && (
            <motion.div
              className="absolute inset-0 bg-cyan-400/20 pointer-events-none rounded-full"
              animate={{
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      </div>

      {/* XP Numbers */}
      <div className="flex flex-col items-end min-w-[70px] mt-1">
        <div className="text-[13px] font-black tracking-tight text-white tabular-nums leading-none">
          {currentXP.toLocaleString()}
        </div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">
          / {maxXP.toLocaleString()} XP
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when XP values haven't changed
export const XPBar = React.memo(XPBarComponent);
