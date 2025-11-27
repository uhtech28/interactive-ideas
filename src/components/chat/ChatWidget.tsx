"use client";

import React, { useState, memo, lazy, Suspense, useCallback } from "react";
import { useQuery, useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";

const ChatThread = lazy(() => import("./ChatThread"));
const UserList = lazy(() => import("./UserList"));

const ChatWidget: React.FC = () => {
  const { isOpen, setIsOpen } = useChat();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<Id<"users"> | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { user } = useUser();
  const pathname = usePathname();

  const conversations = useQuery(api.chat.getUserConversations, isAuthenticated ? {} : "skip");
  const createConversation = useMutation(api.chat.createConversation);

  const handleSelectUser = useCallback((userId: string) => {
    const actualUserId = userId as Id<"users">;
    setSelectedReceiverId(actualUserId);
    const existingConvo = conversations?.find(convo => convo.otherUser?.id === actualUserId);
    if (existingConvo) {
      setSelectedConversationId(existingConvo._id);
    } else {
      (async () => {
        try {
          const convoId = await createConversation({ receiverId: actualUserId });
          setSelectedConversationId(convoId);
        } catch (error) {
          console.error("Failed to create conversation:", error);
          setSelectedReceiverId(null);
        }
      })();
    }
  }, [conversations, createConversation]);

  const handleBackToUsers = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedConversationId(null);
    setSelectedReceiverId(null);
  }, [setIsOpen]);

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
      <Card className="w-80 h-96 shadow-lg bg-card border transition-all duration-300 ease-in-out overflow-hidden">
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          {selectedConversationId ? (
              <ChatThread
                conversationId={selectedConversationId}
                onBack={handleBackToUsers}
                onClose={handleClose}
                receiverId={selectedReceiverId}
              />
            ) : (
            <UserList
              onSelectUser={handleSelectUser}
              onSelectConversation={handleSelectConversation}
              conversations={conversations || []}
              onClose={handleClose}
              currentUserId={user?.id as Id<"users"> || null}
            />
          )}
        </Suspense>
      </Card>
    </div>
  );
};

export default memo(ChatWidget);