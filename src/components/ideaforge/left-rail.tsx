"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { BriefcaseBusiness, Sparkles, Tag } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  cardSurface,
  CurrentUserProfile,
  displayFontClass,
  getInitials,
  IdeaForgeIdea,
  isAgentRole,
  parseTags,
  transitionBase,
} from "@/components/ideaforge/shared";

// Mirrors convex/ventureConstants.ts and the official "level_table_with_flare"
// spec — single source of truth for level → title / threshold / phase. Lv 1-3
// are purely task-gated (titlePoints = 0); Lv 4 onward needs accumulating pts.
type Phase = "Tutorial" | "Early" | "Mid" | "Senior" | "Mentor";
const LEVEL_TABLE: Array<{ level: number; title: string; pts: number; phase: Phase }> = [
  { level:  1, title: "Newcomer",     pts:      0, phase: "Tutorial" },
  { level:  2, title: "Explorer",     pts:      0, phase: "Tutorial" },
  { level:  3, title: "Thinker",      pts:      0, phase: "Tutorial" },
  { level:  4, title: "Connector",    pts:     50, phase: "Tutorial" },
  { level:  5, title: "Contributor",  pts:    150, phase: "Tutorial" },
  { level:  6, title: "Initiator",    pts:    300, phase: "Tutorial" },
  { level:  7, title: "Spark",        pts:    500, phase: "Early" },
  { level:  8, title: "Kindler",      pts:    800, phase: "Early" },
  { level:  9, title: "Surveyor",     pts:   1200, phase: "Early" },
  { level: 10, title: "Pathfinder",   pts:   1700, phase: "Early" },
  { level: 11, title: "Builder",      pts:   2300, phase: "Early" },
  { level: 12, title: "Artisan",      pts:   3000, phase: "Early" },
  { level: 13, title: "Cultivator",   pts:   3800, phase: "Early" },
  { level: 14, title: "Shaper",       pts:   4400, phase: "Early" },
  { level: 15, title: "Strategist",   pts:   5000, phase: "Early" },
  { level: 16, title: "Pioneer",      pts:   6000, phase: "Mid" },
  { level: 17, title: "Catalyst",     pts:   7200, phase: "Mid" },
  { level: 18, title: "Luminary",     pts:   8600, phase: "Mid" },
  { level: 19, title: "Vanguard",     pts:  10200, phase: "Mid" },
  { level: 20, title: "Architect",    pts:  12000, phase: "Mid" },
  { level: 21, title: "Trailblazer",  pts:  14000, phase: "Mid" },
  { level: 22, title: "Visionary",    pts:  16200, phase: "Mid" },
  { level: 23, title: "Navigator",    pts:  18600, phase: "Mid" },
  { level: 24, title: "Forger",       pts:  21200, phase: "Mid" },
  { level: 25, title: "Innovator",    pts:  24000, phase: "Mid" },
  { level: 26, title: "Magnate",      pts:  27000, phase: "Mid" },
  { level: 27, title: "Curator",      pts:  30200, phase: "Mid" },
  { level: 28, title: "Orchestrator", pts:  33600, phase: "Mid" },
  { level: 29, title: "Sage",         pts:  37200, phase: "Senior" },
  { level: 30, title: "Maven",        pts:  41000, phase: "Senior" },
  { level: 31, title: "Pillar",       pts:  45000, phase: "Senior" },
  { level: 32, title: "Champion",     pts:  49200, phase: "Senior" },
  { level: 33, title: "Exemplar",     pts:  53600, phase: "Senior" },
  { level: 34, title: "Harbinger",    pts:  58200, phase: "Senior" },
  { level: 35, title: "Virtuoso",     pts:  63000, phase: "Senior" },
  { level: 36, title: "Elder",        pts:  68000, phase: "Senior" },
  { level: 37, title: "Sovereign",    pts:  73200, phase: "Senior" },
  { level: 38, title: "Luminary",     pts:  78600, phase: "Senior" },
  { level: 39, title: "Legend",       pts:  84200, phase: "Senior" },
  { level: 40, title: "Mentor",       pts:  90000, phase: "Mentor" },
  { level: 41, title: "Guide",        pts:  96000, phase: "Mentor" },
  { level: 42, title: "Steward",      pts: 102200, phase: "Mentor" },
  { level: 43, title: "Luminary",     pts: 108600, phase: "Mentor" },
  { level: 44, title: "Pillar",       pts: 115200, phase: "Mentor" },
  { level: 45, title: "Oracle",       pts: 122000, phase: "Mentor" },
  { level: 46, title: "Paragon",      pts: 129000, phase: "Mentor" },
  { level: 47, title: "Titan",        pts: 136200, phase: "Mentor" },
  { level: 48, title: "Legend",       pts: 143600, phase: "Mentor" },
  { level: 49, title: "Icon",         pts: 151200, phase: "Mentor" },
  { level: 50, title: "Visionary",    pts: 159000, phase: "Mentor" },
];

const titleFor = (lv: number) => LEVEL_TABLE.find((l) => l.level === lv)?.title ?? "—";

export function IdeaForgeLeftRail({
  currentUser,
  userIdeas,
  onTagSelect,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  userIdeas: IdeaForgeIdea[];
  onTagSelect: (value: string) => void;
}) {
  // Real, live backend data
  const levelProgress = useQuery(
    api.levels.getUserLevelProgress,
    currentUser?._id ? { userId: currentUser._id as any } : "skip"
  );

  const ventureSummaries = useQuery(
    api.ventures.getUserVentureSummaries,
    currentUser?._id ? { userId: currentUser._id as any } : "skip"
  );

  // Level / title — prefer backend, fall back to local table & XP heuristic.
  const xp = currentUser?.xp || 0;
  const level = levelProgress?.level ?? currentUser?.level ?? Math.max(1, Math.floor(xp / 100) + 1);
  const title = (levelProgress?.title && levelProgress.title !== "Unknown")
    ? levelProgress.title
    : titleFor(level);

  // Calculate average progress across all user ideas/ventures
  const averageProgress = (() => {
    if (!ventureSummaries || ventureSummaries.length === 0) return 0;
    const totalPercentage = ventureSummaries.reduce((sum, v) => {
      const total = v.totalCheckpoints || 36;
      const completed = v.completedCheckpoints || 0;
      return sum + (completed / total) * 100;
    }, 0);
    return Math.round(totalPercentage / ventureSummaries.length);
  })();

  const nonAgentUserIdeas = isAgentRole(currentUser?.role) ? [] : userIdeas;
  const activeTags = Array.from(
    new Set(
      nonAgentUserIdeas
        .flatMap((idea) => [
          ...parseTags(idea.category),
          ...parseTags(idea.industries),
        ])
        .filter(Boolean)
    )
  ).slice(0, 8);

  return (
    <aside className="hidden lg:block lg:w-[240px] lg:flex-shrink-0">
      <div
        className="
          sticky top-24
          max-h-[calc(100vh-6rem)]
          overflow-y-auto overscroll-contain
          space-y-4 pr-1 -mr-1
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-track]:bg-transparent
        "
      >
        {/* Profile card */}
        <section className={cn(cardSurface, "relative overflow-hidden p-4")}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_42%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(17,24,39,0.9))]" />
          <div className="relative flex items-center gap-3">
            <Link
              href={currentUser?.username ? `/profile/${currentUser.username}` : "/profile-setup"}
              className="shrink-0 group focus:outline-none"
              aria-label="Open my profile"
            >
              <Avatar className="h-12 w-12 ring-2 ring-[#6366F1] ring-offset-2 ring-offset-[#111827] transition-transform duration-200 group-hover:scale-[1.03]">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                <AvatarFallback className="bg-[#1B2440] text-white text-base">
                  {getInitials(currentUser?.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link
              href={currentUser?.username ? `/profile/${currentUser.username}` : "/profile-setup"}
              className="min-w-0 flex-1 group focus:outline-none"
              aria-label="Open my profile"
            >
              <div>
                <h2 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB] truncate group-hover:text-white")}>
                  {currentUser?.displayName || "Ibhaveda Member"}
                </h2>
                <div className="mt-1.5 flex items-end justify-between gap-3">
                  <span className="flex flex-col text-[#F9FAFB]">
                    <span className="font-semibold">Level {level}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#7C86A2]">
                      {title}
                    </span>
                  </span>
                  <span className="text-[#9CA3AF] tabular-nums text-xs font-medium">
                    {averageProgress}% Avg Progress
                  </span>
                </div>
                <Progress
                  value={averageProgress}
                  className="mt-2 h-1.5 bg-[#20293B] [&>div]:bg-[linear-gradient(90deg,#6366F1,#8B5CF6)]"
                />
              </div>
            </Link>
          </div>
        </section>

        {/* Navigation menu removed — navbar covers Feed / My Ideas / Community. */}

        {/* Active tags */}
        <section className={cn(cardSurface, "p-4")}>
          <div className="flex items-center gap-2 text-sm text-[#F9FAFB]">
            <Tag className="h-4 w-4 text-[#6366F1]" />
            <span className={cn(displayFontClass, "font-semibold")}>Your Active Tags</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeTags.length > 0 ? (
              activeTags.map((tag, index) => {
                const accent = index === 0 ? "purple" : "blue";
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagSelect(tag)}
                    className={cn(
                      transitionBase,
                      "inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[11px] font-medium",
                      accent === "purple"
                        ? "border-fuchsia-500/35 bg-fuchsia-500/12 text-fuchsia-300 hover:bg-fuchsia-500/18"
                        : "border-sky-500/35 bg-sky-500/10 text-sky-300 hover:bg-sky-500/16"
                    )}
                  >
                    {index === 0 ? <Sparkles className="h-3 w-3" /> : <BriefcaseBusiness className="h-3 w-3" />}
                    {tag}
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-[#9CA3AF]">
                Post a few ideas and your strongest topics will show up here.
              </p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
