"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { useChat } from "./ChatContext";
import { useConvexAuth } from "convex/react";

/**
 * Floating Action Button for opening the global chat sheet.
 * Anchored to bottom-right of the viewport, sits above the mobile bottom nav.
 */
export const FloatingChatButton: React.FC = () => {
  const { toggleChat, isOpen } = useChat();
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) return null;
  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-label="Open chat"
      className="
        fixed z-[45]
        right-4 bottom-20 lg:bottom-5
        flex h-10 w-10 items-center justify-center rounded-full
        bg-primary text-primary-foreground
        border border-white/10
        hover:bg-primary/90 active:scale-95
        transition-colors
      "
    >
      <MessageCircle className="h-4 w-4" />
    </button>
  );
};