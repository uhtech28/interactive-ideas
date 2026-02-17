"use client";

import React, { memo, lazy, Suspense, useCallback } from "react";
import { useConvexAuth } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";

const ChatThread = lazy(() => import("./ChatThread"));
const GroupList = lazy(() => import("./GroupList"));
const ChannelList = lazy(() => import("./ChannelList"));

const ChatWidget: React.FC = () => {
  const {
    isOpen,
    selectedConversationId,
    selectedIdeaId,
    selectedReceiverId,
    closeChat,
    resetSelection,
    openGroupChat,
    setIsOpen
  } = useChat();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user } = useUser();
  const pathname = usePathname();

  const handleSelectGroup = useCallback((conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => {
    openGroupChat(ideaId, conversationId);
    // If no conversationId is passed, it means we selected a Community -> go to Channel List (handled by render logic)
  }, [openGroupChat]);

  const handleSelectChannel = useCallback((conversationId: Id<"conversations">) => {
    if (selectedIdeaId) {
      openGroupChat(selectedIdeaId, conversationId);
    }
  }, [openGroupChat, selectedIdeaId]);


  const handleBack = useCallback(() => {
    // Logic:
    // If viewing ChatThread (Group): go back to ChannelList (keep IdeaId, clear ConvId)
    // If viewing ChatThread (Direct): go back to GroupList (clear All)
    // If viewing ChannelList: go back to GroupList (clear All)

    if (selectedConversationId) {
      if (selectedIdeaId) {
        // It's a group chat, go back to channel list
        openGroupChat(selectedIdeaId, undefined);
      } else {
        // Direct chat or orphan, go back to root
        resetSelection();
      }
    } else if (selectedIdeaId) {
      // In ChannelList, go back to Root
      resetSelection();
    } else {
      resetSelection();
    }

  }, [selectedConversationId, selectedIdeaId, openGroupChat, resetSelection]);

  const handleClose = useCallback(() => {
    closeChat();
  }, [closeChat]);

  // Determine positioning class based on page
  // On profile pages, move to the left (as requested "to the left part a bit")
  // On other pages, keep default behavior (left on mobile, right on desktop)
  const isProfilePage = pathname?.includes('/profile') || pathname?.includes('/profile-setup');
  const positionClass = isProfilePage
    ? "fixed bottom-20 left-4 z-50"
    : "fixed bottom-20 left-4 md:left-auto md:right-20 z-50";

  if (authLoading || !isAuthenticated || !user) {
    return null;
  }

  // Only render the chat window if open. The trigger button is now in RightSidebar.
  if (!isOpen) return null;

  return (
    <div className={positionClass}>
      <Card className="w-[85vw] h-80 md:w-80 md:h-96 shadow-lg bg-card border transition-all duration-300 ease-in-out overflow-hidden">
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          {(selectedConversationId || selectedReceiverId) ? (
            <ChatThread
              conversationId={selectedConversationId}
              onBack={handleBack}
              onClose={handleClose}
              ideaId={selectedIdeaId}
              receiverId={selectedReceiverId}
            />
          ) : selectedIdeaId ? (
            <ChannelList
              ideaId={selectedIdeaId}
              onBack={handleBack}
              onSelectChannel={handleSelectChannel}
            />
          ) : (
            <GroupList
              onSelectGroup={handleSelectGroup}
              onClose={handleClose}
            />
          )}
        </Suspense>
      </Card>
    </div>
  );
};

export default memo(ChatWidget);