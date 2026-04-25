"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { XPBar } from "./XPBar";
import { LevelDisplay } from "./LevelDisplay";
import { StageInfo } from "./StageInfo";
import { CheckpointProgress } from "./CheckpointProgress";
import { StreakCounter } from "./StreakCounter";
import { QualityScore } from "./QualityScore";
import { AudioControls } from "./AudioControls";
import { QuestList } from "./QuestList";
import { GoldCounter } from "./GoldCounter";
import { VirtualGamepad } from "./VirtualGamepad";
import {
  hudVisibleAtom,
  hudExpandedAtom,
  activeVentureAtom,
  userProgressAtom,
  stageInfoAtom,
  checkpointProgressAtom,
} from "@/lib/stores/hudStore";
import { ChevronDown, ChevronUp, Sparkles, Crown } from "lucide-react";

const HUDComponent = () => {
  const [hudVisible] = useAtom(hudVisibleAtom);
  const [hudExpanded, setHudExpanded] = useAtom(hudExpandedAtom);
  const [activeVenture] = useAtom(activeVentureAtom);
  const [userProgress] = useAtom(userProgressAtom);
  const [stageInfo] = useAtom(stageInfoAtom);
  const [checkpointProgress] = useAtom(checkpointProgressAtom);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleExpanded = useCallback(() => {
    setHudExpanded(!hudExpanded);
  }, [hudExpanded, setHudExpanded]);

  const showMentorBadge = useMemo(
    () => userProgress.level >= 40,
    [userProgress.level],
  );

  if (!hudVisible) return null;

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-4 left-4 right-4 z-50 flex justify-center"
      >
        <div className="bg-[#0A0D12]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden w-full max-w-7xl">
          <AnimatePresence mode="wait">
            {(!isMobile || hudExpanded) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto">
                    {/* Bento Left: Stage & Progress */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                      
                      <StageInfo
                        stageName={stageInfo.stageName}
                        stageIcon={stageInfo.stageIcon}
                        biomeName={stageInfo.biomeName}
                      />
                      <div className="w-px h-8 bg-white/10" />
                      <GoldCounter compact={true} />
                      <div className="w-px h-8 bg-white/10" />
                      <CheckpointProgress
                        completed={checkpointProgress.completed}
                        total={checkpointProgress.total}
                        goldCount={checkpointProgress.goldCount}
                        compact={true}
                      />
                    </div>

                    {/* Bento Right: Performance & XP */}
                    <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                      
                      <StreakCounter streak={userProgress.streak} />
                      <QualityScore
                        qualityScore={userProgress.qualityScore}
                        valuationScore={userProgress.valuationScore}
                      />
                      <div className="hidden lg:block w-px h-8 bg-white/10" />
                      <LevelDisplay
                        level={userProgress.level}
                        phase={userProgress.phase}
                      />
                      <XPBar
                        currentXP={userProgress.xp}
                        maxXP={userProgress.xpToNextLevel}
                      />
                      <AudioControls />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isMobile && (
            <button
              onClick={toggleExpanded}
              className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white transition-colors border-t border-white/5"
            >
              {hudExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-xs uppercase tracking-wider">
                {hudExpanded ? "Collapse" : "Expand"} HUD
              </span>
            </button>
          )}
        </div>

        {activeVenture && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute left-4 top-full mt-2 flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Premium Texture Overlay: Grain & Scanning Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent bg-[length:100%_4px]" />
            
            <Sparkles className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
            <span className="text-sm text-white font-medium truncate max-w-[150px]">
              {activeVenture.name}
            </span>
          </motion.div>
        )}

        {showMentorBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-4 top-full mt-2 flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-lg shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
          >
            <Crown className="w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
            <span className="text-sm text-white font-semibold">Mentor</span>
          </motion.div>
        )}
      </motion.div>

      {/* Quest List - floating top-right panel (manages own positioning) */}
      <QuestList />

      {/* Virtual Gamepad - Floating bottom controller */}
      <VirtualGamepad />
    </>
  );
};

// Memoize HUD to prevent unnecessary re-renders
// Only re-render when Jotai atom values actually change
export const HUD = React.memo(HUDComponent);
