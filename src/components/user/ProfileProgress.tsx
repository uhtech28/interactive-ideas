"use client";

import React, { useEffect, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Flame } from "lucide-react";

type Phase = "Tutorial" | "Early" | "Mid" | "Senior" | "Mentor";
const LEVEL_TABLE: Array<{ level: number; title: string; pts: number; phase: Phase }> = [
  { level: 1, title: "Newcomer", pts: 0, phase: "Tutorial" },
  { level: 2, title: "Explorer", pts: 0, phase: "Tutorial" },
  { level: 3, title: "Thinker", pts: 0, phase: "Tutorial" },
  { level: 4, title: "Connector", pts: 50, phase: "Tutorial" },
  { level: 5, title: "Contributor", pts: 150, phase: "Tutorial" },
  { level: 6, title: "Initiator", pts: 300, phase: "Tutorial" },
  { level: 7, title: "Spark", pts: 500, phase: "Early" },
  { level: 8, title: "Kindler", pts: 800, phase: "Early" },
  { level: 9, title: "Surveyor", pts: 1200, phase: "Early" },
  { level: 10, title: "Pathfinder", pts: 1700, phase: "Early" },
  { level: 11, title: "Builder", pts: 2300, phase: "Early" },
  { level: 12, title: "Artisan", pts: 3000, phase: "Early" },
  { level: 13, title: "Cultivator", pts: 3800, phase: "Early" },
  { level: 14, title: "Shaper", pts: 4400, phase: "Early" },
  { level: 15, title: "Strategist", pts: 5000, phase: "Early" },
  { level: 16, title: "Pioneer", pts: 6000, phase: "Mid" },
  { level: 17, title: "Catalyst", pts: 7200, phase: "Mid" },
  { level: 18, title: "Luminary", pts: 8600, phase: "Mid" },
  { level: 19, title: "Vanguard", pts: 10200, phase: "Mid" },
  { level: 20, title: "Architect", pts: 12000, phase: "Mid" },
  { level: 21, title: "Trailblazer", pts: 14000, phase: "Mid" },
  { level: 22, title: "Visionary", pts: 16200, phase: "Mid" },
  { level: 23, title: "Navigator", pts: 18600, phase: "Mid" },
  { level: 24, title: "Forger", pts: 21200, phase: "Mid" },
  { level: 25, title: "Innovator", pts: 24000, phase: "Mid" },
  { level: 26, title: "Magnate", pts: 27000, phase: "Mid" },
  { level: 27, title: "Curator", pts: 30200, phase: "Mid" },
  { level: 28, title: "Orchestrator", pts: 33600, phase: "Mid" },
  { level: 29, title: "Sage", pts: 37200, phase: "Senior" },
  { level: 30, title: "Maven", pts: 41000, phase: "Senior" },
  { level: 31, title: "Pillar", pts: 45000, phase: "Senior" },
  { level: 32, title: "Champion", pts: 49200, phase: "Senior" },
  { level: 33, title: "Exemplar", pts: 53600, phase: "Senior" },
  { level: 34, title: "Harbinger", pts: 58200, phase: "Senior" },
  { level: 35, title: "Virtuoso", pts: 63000, phase: "Senior" },
  { level: 36, title: "Elder", pts: 68000, phase: "Senior" },
  { level: 37, title: "Sovereign", pts: 73200, phase: "Senior" },
  { level: 38, title: "Luminary", pts: 78600, phase: "Senior" },
  { level: 39, title: "Legend", pts: 84200, phase: "Senior" },
  { level: 40, title: "Mentor", pts: 90000, phase: "Mentor" },
  { level: 41, title: "Guide", pts: 96000, phase: "Mentor" },
  { level: 42, title: "Steward", pts: 102200, phase: "Mentor" },
  { level: 43, title: "Luminary", pts: 108600, phase: "Mentor" },
  { level: 44, title: "Pillar", pts: 115200, phase: "Mentor" },
  { level: 45, title: "Oracle", pts: 122000, phase: "Mentor" },
  { level: 46, title: "Paragon", pts: 129000, phase: "Mentor" },
  { level: 47, title: "Titan", pts: 136200, phase: "Mentor" },
  { level: 48, title: "Legend", pts: 143600, phase: "Mentor" },
  { level: 49, title: "Icon", pts: 151200, phase: "Mentor" },
  { level: 50, title: "Visionary", pts: 159000, phase: "Mentor" },
];

const titleFor = (level: number) =>
  LEVEL_TABLE.find((entry) => entry.level === level)?.title ?? "-";

interface ProfileProgressProps {
  userId: Id<"users">;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ userId }) => {
  const { isAuthenticated } = useConvexAuth();
  const levelProgress = useQuery(api.levels.getUserLevelProgress, { userId });
  const streak = useQuery(api.gamification.getUserStreak, { userId });
  const updateStreak = useMutation(api.gamification.updateStreak);
  const hasTickedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasTickedRef.current) return;
    hasTickedRef.current = true;
    updateStreak().catch(() => {
      hasTickedRef.current = false;
    });
  }, [isAuthenticated, updateStreak]);

  const level = levelProgress?.level ?? 1;
  const title =
    levelProgress?.title && levelProgress.title !== "Unknown"
      ? levelProgress.title
      : titleFor(level);

  const currentStreak = streak?.currentStreak ?? 0;
  const streakDetail =
    streak === undefined
      ? "Loading..."
      : currentStreak > 0
        ? `${currentStreak} Day Streak`
        : isAuthenticated
          ? "1 Day Streak"
          : "Sign in to start";

  const titlePoints = levelProgress?.titlePoints ?? 0;
  const nextLevelPoints = levelProgress?.nextLevelPoints ?? null;
  const xpDetail =
    levelProgress === undefined
      ? "Loading..."
      : nextLevelPoints && nextLevelPoints > 0
        ? `${titlePoints} / ${nextLevelPoints} XP`
        : `${titlePoints} XP`;
  const xpPct = Math.min(100, Math.max(0, Math.round(levelProgress?.progress ?? 0)));

  return (
    <div className="pt-6 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-black shadow-[0_0_12px_rgba(250,204,21,0.3)]">
            {level}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">{title}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{xpDetail}</span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.45)] transition-all duration-700 ease-out"
          style={{ width: `${xpPct}%` }}
        />
      </div>

      <div className="flex justify-end">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-200 tabular-nums">
          <Flame className="h-3.5 w-3.5 text-orange-300" />
          {streakDetail}
        </span>
      </div>
    </div>
  );
};
