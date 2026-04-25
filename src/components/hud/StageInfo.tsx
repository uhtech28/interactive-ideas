"use client";

import React from "react";
import { motion } from "framer-motion";

interface StageInfoProps {
  stageName: string;
  stageIcon: string;
  biomeName: string;
  centered?: boolean;
  stage?: number;
}

const StageInfoComponent = ({
  stageName,
  stageIcon,
  biomeName,
  centered = false,
  stage = 1,
}: StageInfoProps) => {
  if (centered) {
    // Centered floating title variant for dramatic reveals
    return (
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 font-sans"
      >
        <div className="relative px-12 py-6 bg-zinc-950/60 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center">
          {/* Biome icon with animated pulse */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-zinc-900/90 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            >
              <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {stageIcon}
              </span>
            </motion.div>
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl -z-10 animate-pulse" />
          </div>

          {/* Title with premium spacing */}
          <div className="text-center mt-6">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-2 block">
              Entering Stage {stage}
            </span>
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {biomeName}
            </h2>
            <div className="h-[2px] w-12 bg-indigo-500 mx-auto my-3 rounded-full" />
            <p className="text-[12px] text-zinc-400 font-bold uppercase tracking-widest leading-none">
              {stageName}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-4 font-sans group"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Biome icon with modern frame */}
      <div className="relative w-12 h-12 bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
        <span className="text-[28px] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {stageIcon}
        </span>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Text info - premium typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
            Stage {stage}
          </span>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            {stageName}
          </span>
        </div>
        <span className="text-[15px] font-black text-white uppercase tracking-wider leading-none drop-shadow-sm">
          {biomeName}
        </span>
      </div>
    </motion.div>
  );
};

// Memoize to prevent re-renders when props haven't changed
export const StageInfo = React.memo(StageInfoComponent);
