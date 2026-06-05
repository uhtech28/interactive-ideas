"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAction, useMutation, usePreloadedQuery } from "convex/react";
import { Preloaded } from "convex/react";

import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { IdeaForgeExperience } from "@/components/ideaforge/experience";
import { IdeaForgeIdea } from "@/components/ideaforge/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { ContributionRequestModal } from "@/components/requests/ContributionRequestModal";
import { useToast } from "@/components/ui/use-toast";
import { useProfileCompletion } from "@/lib/hooks/use-profile-completion";
import { useQuery } from "convex/react";
import { FeedTutorial } from "@/components/tutorial/FeedTutorial";

export function FeedClient({
  preloadedIdeas,
}: {
  preloadedIdeas: Preloaded<typeof api.ideas.getPublicIdeas>;
}) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isComplete: isProfileComplete, isLoading: isProfileLoading } = useProfileCompletion();
  const currentUser = useQuery(api.users.getCurrentUser);

  const PAGE_SIZE = 20;
  const [limit, setLimit] = useState(PAGE_SIZE);

  // usePreloadedQuery gives us the SSR data immediately, then stays live
  const ideasQuery = usePreloadedQuery(preloadedIdeas);
  const toggleSpark = useMutation(api.ideas.toggleSpark);

  const hasMore = ideasQuery !== undefined && ideasQuery.length >= limit;

  function loadMore() {
    if (hasMore) setLimit((l) => l + PAGE_SIZE);
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommentIdea, setActiveCommentIdea] = useState<IdeaForgeIdea | null>(null);
  const [activeContributeIdea, setActiveContributeIdea] = useState<IdeaForgeIdea | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/");
    }
  }, [isLoaded, router, userId]);

  // PRD §6 AC6 — Profile-completion toast is superseded by the
  // first-time-user FeedTutorial below. We still need to route users
  // through profile setup if they haven't completed it, but the
  // tutorial only mounts AFTER profile setup, so the explicit nag
  // here is no longer required.
  useEffect(() => {
    if (isLoaded && userId && !isProfileLoading && !isProfileComplete) {
      router.push("/profile-setup");
    }
  }, [isLoaded, isProfileComplete, isProfileLoading, router, userId]);

  // First-run tour state.
  const tutorialState = useQuery(api.tutorial.getMyFeedTutorialState, {});
  const myIdeaCount = useQuery(api.tutorial_metrics.getMyIdeaCount, {});
  const [tutorialOpen, setTutorialOpen] = useState(false);
  useEffect(() => {
    if (!tutorialState) return;
    // Hard local guard: once the user has explicitly dismissed the
    // tour this session, don't re-open it even if convex hasn't
    // finished propagating the completion mutation yet.
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("feedTourClosed") === "1"
    ) {
      return;
    }
    if (tutorialState.state === "not_started" || tutorialState.state === "in_progress") {
      const t = window.setTimeout(() => setTutorialOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, [tutorialState]);

  // Fetch the AI pre-filled idea once when the tour is in its compose
  // phase (user has 0 ideas). We hold it locally and pass it to the
  // wizard, which auto-opens via tutorialOpenCompose.
  const generateTutorialIdea = useAction(api.ai.generateTutorialIdeaDraft);
  const [tutorialDraft, setTutorialDraft] = useState<
    | {
        title?: string;
        description?: string;
        industries?: string[];
        skills?: string[];
      }
    | undefined
  >(undefined);
  // Treat loading-state convex queries as "maybe in tour" so the user
  // gets the tutorial draft even if they click + before metadata loads.
  // tutorialState may be undefined (loading) OR null (no user yet);
  // either is a "don't know yet" signal that should still attempt the
  // pre-fill.
  const tourActiveOrLoading =
    !tutorialState ||
    tutorialState.state === "in_progress" ||
    tutorialState.state === "not_started";
  const ideaCountKnown = typeof myIdeaCount === "number";
  const inComposePhase =
    tourActiveOrLoading && (!ideaCountKnown || myIdeaCount === 0);
  useEffect(() => {
    if (!inComposePhase) return;
    if (tutorialDraft) return;
    let cancelled = false;
    void generateTutorialIdea({})
      .then((draft) => {
        if (cancelled) return;
        setTutorialDraft({
          title: draft.title,
          description: draft.description,
          industries: draft.industries,
          skills: draft.skills,
        });
      })
      .catch(() => {
        // If AI fails, fall back to a generic seed so the tour still
        // auto-opens the composer.
        if (cancelled) return;
        setTutorialDraft({
          title: "My first idea",
          description:
            "A small project I want to ship in the next two weeks. I'll use this space to plan it in public and find people who want to help.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [inComposePhase, tutorialDraft, generateTutorialIdea]);

  const ideas = useMemo(() => (ideasQuery || []) as IdeaForgeIdea[], [ideasQuery]);

  return (
    <>
      <IdeaForgeExperience
        mode="feed"
        currentUser={currentUser || null}
        ideas={ideas}
        isLoading={false}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tutorialDraft={tutorialDraft}
        tutorialOpenCompose={inComposePhase && !!tutorialDraft}
        onSpark={async (ideaId) => {
          await toggleSpark({ ideaId: ideaId as Id<"ideas"> });
        }}
        onIdeaClick={(ideaId) => router.push(`/idea/${ideaId}`)}
        onCommentClick={(ideaId) => {
          const idea = ideas.find((entry) => entry._id === ideaId);
          if (idea) setActiveCommentIdea(idea);
        }}
        onContributeClick={(ideaId) => {
          const idea = ideas.find((entry) => entry._id === ideaId);
          if (idea) setActiveContributeIdea(idea);
        }}
        isProfileComplete={isProfileComplete}
        onCompleteProfile={() => router.push("/profile-setup")}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />

      <Dialog open={!!activeCommentIdea} onOpenChange={(open) => !open && setActiveCommentIdea(null)}>
        <DialogContent
          className="
            grid grid-rows-[auto_1fr] gap-0 overflow-hidden border-white/10 bg-[#0A0D12] p-0 text-white shadow-[0_24px_80px_rgba(3,7,18,0.65)]
            w-full max-w-[640px]
            h-[100dvh] max-h-[100dvh] rounded-none
            sm:h-[min(85dvh,720px)] sm:max-h-[85dvh] sm:rounded-2xl
          "
        >
          <header className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-b from-[#141B2D] to-[#0F1524] px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6366F1]/25 to-[#8B5CF6]/15 ring-1 ring-[#6366F1]/30">
              <MessageCircle className="h-5 w-5 text-[#C7D2FE]" />
            </div>
            <DialogTitle className="min-w-0 flex-1 truncate text-base font-semibold leading-tight text-white">
              {activeCommentIdea?.title}
            </DialogTitle>
          </header>
          <div className="min-h-0 px-5 py-4 overflow-hidden">
            {activeCommentIdea && (
              <CommentsSection
                ideaId={activeCommentIdea._id as Id<"ideas">}
                commentCount={activeCommentIdea.commentCount || 0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeContributeIdea} onOpenChange={(open) => !open && setActiveContributeIdea(null)}>
        <DialogContent className="w-[min(92vw,560px)] max-w-[560px] overflow-hidden border-white/10 bg-[#111827] text-white">
          {activeContributeIdea && (
            <ContributionRequestModal
              ideaId={activeContributeIdea._id as Id<"ideas">}
              ideaTitle={activeContributeIdea.title}
              authorName={activeContributeIdea.author?.displayName || activeContributeIdea.author?.name || activeContributeIdea.author?.username}
              authorUsername={activeContributeIdea.author?.username}
              authorAvatar={activeContributeIdea.author?.avatar}
              onClose={() => setActiveContributeIdea(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PRD §6 — first-time user walkthrough */}
      <FeedTutorial
        show={tutorialOpen}
        initialStep={tutorialState?.step ?? 0}
        onClose={() => {
          setTutorialOpen(false);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("feedTourClosed", "1");
          }
        }}
        composeDraftReady={
          inComposePhase ? !!tutorialDraft?.title?.trim() : true
        }
      />
    </>
  );
}
