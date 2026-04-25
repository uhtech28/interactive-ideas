"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign } from "lucide-react";

interface QualityScoreProps {
  qualityScore: number;
  valuationScore: number;
}

export function QualityScore({ qualityScore, valuationScore }: QualityScoreProps) {
  const getQualityTier = (score: number) => {
    if (score >= 9) return { label: "High", color: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]", bg: "bg-emerald-500/10 border-emerald-500/30", icon: "text-emerald-400" };
    if (score >= 5) return { label: "Standard", color: "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]", bg: "bg-indigo-500/10 border-indigo-500/30", icon: "text-indigo-400" };
    return { label: "Low", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/30", icon: "text-gray-400" };
  };

  const tier = getQualityTier(qualityScore);

  return (
    <div className="flex items-center gap-3 font-sans group">
      {/* Quality Score Badge */}
      <motion.div
        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${tier.bg} backdrop-blur-xl shadow-lg transition-all group-hover:border-emerald-500/50`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
            Build Quality
          </span>
          <div className="flex items-baseline gap-1">
            <span className={`text-[17px] font-black leading-none ${tier.color}`}>{qualityScore}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">/12</span>
          </div>
        </div>
      </motion.div>

      {/* Valuation Badge */}
      <motion.div
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-950/40 border border-emerald-500/20 backdrop-blur-xl shadow-lg transition-all hover:border-emerald-500/50"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black leading-none mb-1">
            Market Value
          </span>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[17px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 tracking-tight leading-none tabular-nums">
              {valuationScore.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}