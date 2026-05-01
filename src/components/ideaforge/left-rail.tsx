"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Tag, Home, Lightbulb, TrendingUp, Bookmark, Users } from "lucide-react";

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
  parseTags,
  transitionBase,
} from "@/components/ideaforge/shared";

// Mirrors convex/ventureConstants.ts so we can resolve the level title locally
// even before the backend query lands. Matches the 50-row Excel exactly.
const LEVEL_TITLES: Record<number, string> = {
  1: "Newcomer", 2: "Explorer", 3: "Thinker", 4: "Connector", 5: "Contributor",
  6: "Initiator", 7: "Spark", 8: "Kindler", 9: "Surveyor", 10: "Pathfinder",
  11: "Builder", 12: "Artisan", 13: "Cultivator", 14: "Shaper", 15: "Strategist",
  16: "Pioneer", 17: "Catalyst", 18: "Luminary", 19: "Vanguard", 20: "Architect",
  21: "Trailblazer", 22: "Visionary", 23: "Navigator", 24: "Forger", 25: "Innovator",
  26: "Magnate", 27: "Curator", 28: "Orchestrator", 29: "Sage", 30: "Maven",
  31: "Pillar", 32: "Champion", 33: "Exemplar", 34: "Harbinger", 35: "Virtuoso",
  36: "Elder", 37: "Sovereign", 38: "Luminary", 39: "Legend", 40: "Mentor",
  41: "Guide", 42: "Steward", 43: "Luminary", 44: "Pillar", 45: "Oracle",
  46: "Paragon", 47: "Titan", 48: "Legend", 49: "Icon", 50: "Visionary",
};

const NAV_ITEMS = [
  { name: "Feed", href: "/feed", icon: Home },
  { name: "My Ideas", href: "/my-ideas", icon: Lightbulb },
  { name: "Trending", href: "/trending", icon: TrendingUp },
  { name: "Saved", href: "/saved", icon: Bookmark },
  { name: "Community", href: "/community", icon: Users },
];

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
  const wallet = useQuery(api.gamification.getWallet);
  const streak = useQuery(api.gamification.getStreak);
  const levelProgress = useQuery(
    api.levels.getUserLevelProgress,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const ideasPosted = userIdeas.length;
  const totalSparks = userIdeas.reduce((sum, idea) => sum + (idea.sparkCount || 0), 0);

  // Level / title — prefer backend, fall back to local table & XP heuristic.
  const xp = currentUser?.xp || 0;
  const level = levelProgress?.level ?? currentUser?.level ?? Math.max(1, Math.floor(xp / 100) + 1);
  const title = (levelProgress?.title && levelProgress.title !== "Unknown")
    ? levelProgress.title
    : (LEVEL_TITLES[level] || "Newcomer");

  // Progress bar — backend-driven when available; otherwise XP heuristic.
  const titlePoints = levelProgress?.titlePoints ?? xp;
  const nextLevelPoints = levelProgress?.nextLevelPoints ?? 100;
  const rawProgress = nextLevelPoints > 0
    ? Math.round((titlePoints / nextLevelPoints) * 100)
    : 100;
  const progress = Math.min(100, Math.max(4, rawProgress));

  const activeTags = Array.from(
    new Set(
      [
        ...(currentUser?.skills || []),
        ...userIdeas.flatMap((idea) => parseTags(idea.category)),
      ].filter(Boolean)
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
        <section className={cn(cardSurface, "relative overflow-hidden p-5")}>
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.45),transparent_45%),linear-gradient(135deg,rgba(17,24,39,0.98),rgba(31,41,55,0.92))]" />
          <div className="relative">
            <Link
              href={currentUser?.username ? `/profile/${currentUser.username}` : "/profile-setup"}
              className="block group focus:outline-none"
              aria-label="Open my profile"
            >
              <Avatar className="h-14 w-14 ring-2 ring-[#6366F1] ring-offset-4 ring-offset-[#111827] transition-transform duration-200 group-hover:scale-[1.03]">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                <AvatarFallback className="bg-[#1B2440] text-white">
                  {getInitials(currentUser?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4">
                <h2 className={cn(displayFontClass, "text-lg font-semibold text-[#F9FAFB] truncate group-hover:text-white")}>
                  {currentUser?.displayName || "InteractiveIdeas Member"}
                </h2>
                <div className="mt-2 inline-flex items-center rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-3 py-1 text-[11px] font-medium text-[#C7D2FE]">
                  {currentUser?.role === "admin" ? "AI Curator" : "Builder"}
                </div>
              </div>
            </Link>

            <div className="mt-5 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-sm text-[#F9FAFB]">
                <span className="flex flex-col">
                  <span className="font-semibold">Level {level}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#7C86A2]">
                    {title}
                  </span>
                </span>
                <span className="text-[#9CA3AF] tabular-nums">
                  {titlePoints.toLocaleString()} XP
                </span>
              </div>
              <Progress
                value={progress}
                className="mt-3 h-2.5 bg-[#20293B] [&>div]:bg-[linear-gradient(90deg,#6366F1,#8B5CF6)]"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>{(wallet?.balance || 0).toLocaleString()} sparks banked</span>
                <span className="flex items-center gap-1">
                  <span>{streak?.currentStreak || 0}</span>
                  <span>day streak</span>
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-[14px] border border-white/8 bg-[#0A0D12]/70 p-4 text-sm">
              <div>
                <div className="text-[#F9FAFB] tabular-nums">{ideasPosted}</div>
                <div className="text-xs text-[#9CA3AF]">Ideas Posted</div>
              </div>
              <div>
                <div className="text-[#F9FAFB] tabular-nums">{totalSparks}</div>
                <div className="text-xs text-[#9CA3AF]">Upvotes</div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation menu */}
        <nav className={cn(cardSurface, "p-2")}>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      transitionBase,
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-[#6366F1]/15 text-[#C7D2FE] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]"
                        : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#A5B4FC]")} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Active tags */}
        <section className={cn(cardSurface, "p-4")}>
          <div className="flex items-center gap-2 text-sm text-[#F9FAFB]">
            <Tag className="h-4 w-4 text-[#6366F1]" />
            <span className={cn(displayFontClass, "font-semibold")}>Your Active Tags</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeTags.length > 0 ? (
              activeTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagSelect(tag)}
                  className={cn(
                    transitionBase,
                    "rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#C7D2FE] hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10"
                  )}
                >
                  #{tag}
                </button>
              ))
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