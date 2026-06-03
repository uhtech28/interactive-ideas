"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { ArrowUpRight, Flame, MessageCircle, Sparkles, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useChat } from "@/components/chat/ChatContext";
import {
  BuilderSuggestion,
  cardSurface,
  CurrentUserProfile,
  displayFontClass,
  getInitials,
  IdeaForgeIdea,
  isAgentRole,
  transitionBase,
} from "@/components/ideaforge/shared";

function SuggestedBuilderCard({ builder }: { builder: BuilderSuggestion }) {
  const displayName = builder.displayName || builder.username || "Builder";
  const profileHref = builder.username ? `/profile/${builder.username}` : "/community";
  const builderId = (builder._id || builder.id) as Id<"users"> | undefined;
  const { openChatWithUser } = useChat();

  return (
    <div className="flex items-center gap-2 py-1">
      <Link href={profileHref} className="shrink-0" aria-label={`View ${displayName}'s profile`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={builder.avatar} alt={displayName} />
          <AvatarFallback className="bg-[#1B2440] text-xs text-white">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </Link>
      <Link href={profileHref} className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F9FAFB] hover:text-[#C7D2FE] transition-colors">{displayName}</p>
      </Link>
      <Button
        type="button"
        size="icon"
        onClick={() => { if (builderId) openChatWithUser(builderId); }}
        disabled={!builderId}
        aria-label={`Message ${displayName}`}
        title={`Message ${displayName}`}
        className="h-8 w-8 rounded-full bg-transparent p-0 text-[#C7D2FE] hover:bg-[#6366F1]/15 hover:text-white disabled:opacity-50"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function IdeaForgeRightRail({
  currentUser,
  publicIdeas,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  publicIdeas: IdeaForgeIdea[];
}) {
  const suggested = useQuery(api.users.getSuggestedCollaborators, currentUser
    ? {
        skills: currentUser.skills || [],
        industries: currentUser.industries || (currentUser.industry ? [currentUser.industry] : []),
        limit: 8,
        excludeUserId: currentUser.clerkId,
      }
    : "skip");
  const allUsers = useQuery(api.users.getAllUsers);

  const TRENDING_LIMIT = 7;
  const trendingIdeas = useMemo(() => {
    return [...publicIdeas]
      .filter((idea) => !isAgentRole(idea.author?.role))
      .sort(
        (a, b) =>
          (b.sparkCount || 0) - (a.sparkCount || 0) ||
          (b.contributionCount || 0) - (a.contributionCount || 0) ||
          b.createdAt - a.createdAt
      )
      .slice(0, TRENDING_LIMIT);
  }, [publicIdeas]);

  const builders = useMemo(() => {
    const isNonAgent = (user: BuilderSuggestion | CurrentUserProfile) => !isAgentRole(user.role);

    if (suggested && suggested.length > 0) {
      return suggested.filter(isNonAgent).slice(0, 5);
    }
    return (allUsers || [])
      .filter((user) => user._id !== currentUser?._id && isNonAgent(user))
      .slice(0, 5)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        skills: user.skills,
        role: user.role,
      }));
  }, [allUsers, currentUser?._id, suggested]);

  return (
    <aside className="hidden xl:block xl:w-[280px] xl:flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <section className={cn(cardSurface, "p-5")}>
          <div className="flex items-center justify-between">
            <h3 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB]")}>Trending Ideas This Week</h3>
            <Flame className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="mt-4 space-y-2.5">
            {trendingIdeas.length > 0 ? (
              trendingIdeas.map((idea) => (
                <Link
                  key={idea._id}
                  href={`/idea/${idea._id}`}
                  className={cn(
                    transitionBase,
                    "flex items-center gap-3 rounded-[12px] border border-white/7 bg-[#0B101A]/70 px-3 py-3 hover:border-[#6366F1]/35 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-[#F9FAFB]">{idea.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#111827] px-2 text-[11px] font-medium text-orange-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      {idea.sparkCount || 0}
                    </span>
                    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#111827] px-2 text-[11px] font-medium text-emerald-300">
                      <Users className="h-3.5 w-3.5" />
                      {idea.contributionCount || 0}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[#9CA3AF]">Trending ideas will show up here as the feed warms up.</p>
            )}
          </div>
        </section>

        <section className={cn(cardSurface, "p-4")}>
          <div className="flex items-center justify-between">
            <h3 className={cn(displayFontClass, "text-base font-semibold text-[#F9FAFB]")}>Suggested Builders</h3>
            <ArrowUpRight className="h-4 w-4 text-[#9CA3AF]" />
          </div>
          <div className="mt-3 space-y-1">
            {builders.length > 0 ? builders.map((builder) => <SuggestedBuilderCard key={builder._id?.toString() || builder.username} builder={builder as BuilderSuggestion} />) : (
              <p className="text-sm text-[#9CA3AF]">We are lining up collaborators based on your profile and recent ideas.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
