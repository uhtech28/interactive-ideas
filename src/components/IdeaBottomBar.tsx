import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Handshake, Inbox, Sparkles } from "lucide-react";
import ParticleButton from "@/components/kokonutui/particle-button";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { Spinner } from "@/components/ui/spinner";


interface IdeaBottomBarProps {
  ideaId: string;
  initialSparkCount: number;
  initialHasSparked: boolean;
  commentCount: number;
  onOpenComments: () => void;
  onOpenRequests: () => void;
  isAuthor: boolean;
  requestCount?: number;
}

export function IdeaBottomBar({
  ideaId,
  initialSparkCount,
  initialHasSparked,
  commentCount,
  onOpenComments,
  onOpenRequests,
  isAuthor,
  requestCount = 0,
}: IdeaBottomBarProps) {
  const { userId } = useAuth();
  const toggleSparkMutation = useMutation(api.ideas.toggleSpark);
  
  const [isSparking, setIsSparking] = useState(false);
  const [currentSparkCount, setCurrentSparkCount] = useState(initialSparkCount);
  const [currentHasSparked, setCurrentHasSparked] = useState(initialHasSparked);

  const handleSpark = async () => {
    if (!userId || isSparking) return;

    setIsSparking(true);

    try {
      const result = await toggleSparkMutation({ ideaId: ideaId as Id<"ideas"> });
      setCurrentSparkCount(result.sparkCount);
      setCurrentHasSparked(result.action === 'added');
    } catch (error) {
      console.error('Error toggling spark:', error);
    } finally {
      setIsSparking(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-md border border-border rounded-full shadow-lg px-3 py-2 flex items-center gap-2 z-50">
      {/* Spark Button */}
      <ParticleButton
        variant={currentHasSparked ? "default" : "ghost"}
        size="sm"
        onSuccess={handleSpark}
        disabled={!userId || isSparking}
        className={`
          rounded-full px-3 h-9
          ${currentHasSparked
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            : 'hover:bg-accent/50 hover:text-destructive'
          }
        `}
      >
        {isSparking ? (
          <Spinner size={16} />
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">{currentSparkCount}</span>
          </div>
        )}
      </ParticleButton>

      {/* Comment Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onOpenComments}
        className="rounded-full px-3 h-9 gap-2 hover:bg-blue-500/10 hover:text-blue-600"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium text-sm">{commentCount}</span>
      </Button>

      {/* Contribute/Requests Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onOpenRequests}
        className="rounded-full px-3 h-9 gap-2 hover:bg-green-500/10 hover:text-green-600 relative"
      >
        {isAuthor ? (
          <>
            <Inbox className="w-4 h-4" />
            <span className="font-medium text-sm">Requests</span>
            {requestCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground font-bold border border-background">
                {requestCount}
              </span>
            )}
          </>
        ) : (
          <>
            <Handshake className="w-4 h-4" />
            <span className="font-medium text-sm">Contribute</span>
          </>
        )}
      </Button>
    </div>
  );
}
