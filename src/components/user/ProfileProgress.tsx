"use client";

import React, { useEffect, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Trophy, Sparkles, Flame } from "lucide-react";

// Full 50-level table — mirrors convex/ventureConstants.ts so the UI can resolve
// titles locally even before the backend redeploys with the new query shape.
const LEVEL_TABLE: Array<{ level: number; title: string; titlePoints: number }> = [
  { level: 1, title: "Newcomer", titlePoints: 0 },
  { level: 2, title: "Explorer", titlePoints: 0 },
  { level: 3, title: "Thinker", titlePoints: 0 },
  { level: 4, title: "Connector", titlePoints: 50 },
  { level: 5, title: "Contributor", titlePoints: 150 },
  { level: 6, title: "Initiator", titlePoints: 300 },
  { level: 7, title: "Spark", titlePoints: 500 },
  { level: 8, title: "Kindler", titlePoints: 800 },
  { level: 9, title: "Surveyor", titlePoints: 1200 },
  { level: 10, title: "Pathfinder", titlePoints: 1700 },
  { level: 11, title: "Builder", titlePoints: 2300 },
  { level: 12, title: "Artisan", titlePoints: 3000 },
  { level: 13, title: "Cultivator", titlePoints: 3800 },
  { level: 14, title: "Shaper", titlePoints: 4400 },
  { level: 15, title: "Strategist", titlePoints: 5000 },
  { level: 16, title: "Pioneer", titlePoints: 6000 },
  { level: 17, title: "Catalyst", titlePoints: 7200 },
  { level: 18, title: "Luminary", titlePoints: 8600 },
  { level: 19, title: "Vanguard", titlePoints: 10200 },
  { level: 20, title: "Architect", titlePoints: 12000 },
  { level: 21, title: "Trailblazer", titlePoints: 14000 },
  { level: 22, title: "Visionary", titlePoints: 16200 },
  { level: 23, title: "Navigator", titlePoints: 18600 },
  { level: 24, title: "Forger", titlePoints: 21200 },
  { level: 25, title: "Innovator", titlePoints: 24000 },
  { level: 26, title: "Magnate", titlePoints: 27000 },
  { level: 27, title: "Curator", titlePoints: 30200 },
  { level: 28, title: "Orchestrator", titlePoints: 33600 },
  { level: 29, title: "Sage", titlePoints: 37200 },
  { level: 30, title: "Maven", titlePoints: 41000 },
  { level: 31, title: "Pillar", titlePoints: 45000 },
  { level: 32, title: "Champion", titlePoints: 49200 },
  { level: 33, title: "Exemplar", titlePoints: 53600 },
  { level: 34, title: "Harbinger", titlePoints: 58200 },
  { level: 35, title: "Virtuoso", titlePoints: 63000 },
  { level: 36, title: "Elder", titlePoints: 68000 },
  { level: 37, title: "Sovereign", titlePoints: 73200 },
  { level: 38, title: "Luminary", titlePoints: 78600 },
  { level: 39, title: "Legend", titlePoints: 84200 },
  { level: 40, title: "Mentor", titlePoints: 90000 },
  { level: 41, title: "Guide", titlePoints: 96000 },
  { level: 42, title: "Steward", titlePoints: 102200 },
  { level: 43, title: "Luminary", titlePoints: 108600 },
  { level: 44, title: "Pillar", titlePoints: 115200 },
  { level: 45, title: "Oracle", titlePoints: 122000 },
  { level: 46, title: "Paragon", titlePoints: 129000 },
  { level: 47, title: "Titan", titlePoints: 136200 },
  { level: 48, title: "Legend", titlePoints: 143600 },
  { level: 49, title: "Icon", titlePoints: 151200 },
  { level: 50, title: "Visionary", titlePoints: 159000 },
];

const titleFor = (lv: number) =>
  LEVEL_TABLE.find((l) => l.level === lv)?.title ?? "—";

// Streak milestones — show progress toward the next achievable goal.
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

function nextStreakMilestone(current: number) {
  for (const m of STREAK_MILESTONES) {
    if (current < m) return m;
  }
  return current;
}

interface BarProps {
  icon: React.ReactNode;
  label: string;
  detail: string;
  value: number;
  max: number;
  fillClass: string;
  iconBgClass: string;
}

function ProgressBar({ icon, label, detail, value, max, fillClass, iconBgClass }: BarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`grid place-items-center h-7 w-7 rounded-full shrink-0 ${iconBgClass}`}>
            {icon}
          </span>
          <span className="text-sm font-semibold text-foreground truncate">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{detail}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface ProfileProgressProps {
  userId: Id<"users">;
}

export const ProfileProgress: React.FC<ProfileProgressProps> = ({ userId }) => {
  const { isAuthenticated } = useConvexAuth();
  const levelProgress = useQuery(api.levels.getUserLevelProgress, { userId });
  const streak = useQuery(api.gamification.getUserStreak, { userId });
  // Real sparks received — sum of sparkCount across all of this user's ideas.
  const profileIdeas = useQuery(api.ideas.getProfileIdeas, { userId, limit: 100 });
  const sparksReceived = (profileIdeas ?? []).reduce(
    (sum, idea: any) => sum + (idea.sparkCount || 0),
    0
  );

  // Silently tick the *viewer's* streak once auth is ready. Idempotent on the
  // server — only counts the day if not already counted.
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
  const localTitle = titleFor(level);
  const title = levelProgress?.title && levelProgress.title !== "Unknown"
    ? levelProgress.title
    : localTitle;

  const nextLevel = Math.min(50, level + 1);

  const points = levelProgress?.titlePoints ?? 0;
  const totalPoints = levelProgress?.totalPoints ?? 0;

  const nextPointsGate = (() => {
    for (let lv = nextLevel; lv <= 50; lv++) {
      const def = LEVEL_TABLE.find((l) => l.level === lv);
      if (def && def.titlePoints > 0) return def.titlePoints;
    }
    return 50;
  })();

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const streakGoal = nextStreakMilestone(currentStreak);

  let streakDetail: string;
  if (streak === undefined) {
    streakDetail = "Loading…";
  } else if (currentStreak > 0) {
    streakDetail = `${currentStreak} / ${streakGoal} days  ·  best ${longestStreak}`;
  } else {
    streakDetail = isAuthenticated ? "Starts on your first sign-in today" : "Sign in to start";
  }

  const isMaxLevel = level >= 50;
  const xpDetail = isMaxLevel
    ? `${totalPoints.toLocaleString()} XP  ·  Apex`
    : `${points.toLocaleString()} / ${nextPointsGate.toLocaleString()} XP  ·  ${totalPoints.toLocaleString()} total`;

  return (
    <div className="pt-3 space-y-4">
      {/* Level — single combined bar with real XP progress to the next level */}
      <ProgressBar
        icon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
        iconBgClass="bg-amber-500/15 ring-1 ring-amber-500/30"
        label={`Lv ${level} — ${title}`}
        detail={xpDetail}
        value={points}
        max={nextPointsGate}
        fillClass="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.45)]"
      />

      {/* Sparks earned — REAL sparks received on this user's ideas. */}
      {(() => {
        const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
        const goal = milestones.find((m) => sparksReceived < m) ?? sparksReceived;
        const detail =
          profileIdeas === undefined
            ? "Loading…"
            : sparksReceived > 0
              ? `${sparksReceived.toLocaleString()} / ${goal.toLocaleString()}  ·  next milestone`
              : "Post an idea — sparks from others will fill this bar";
        return (
          <ProgressBar
            icon={<Sparkles className="w-3.5 h-3.5 text-violet-300" />}
            iconBgClass="bg-violet-500/15 ring-1 ring-violet-500/30"
            label="Sparks Earned"
            detail={detail}
            value={sparksReceived}
            max={goal || 10}
            fillClass="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.45)]"
          />
        );
      })()}

      <ProgressBar
        icon={<Flame className="w-3.5 h-3.5 text-orange-300" />}
        iconBgClass="bg-orange-500/15 ring-1 ring-orange-500/30"
        label="Day Streak"
        detail={streakDetail}
        value={currentStreak}
        max={streakGoal || 7}
        fillClass="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 shadow-[0_0_8px_rgba(251,146,60,0.45)]"
      />
    </div>
  );
};