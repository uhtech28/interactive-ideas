"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { api } from "@convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@convex/_generated/dataModel";
import { UserPlus, Check } from "lucide-react";

interface InvitationButtonProps {
  targetUser: {
    _id: string;
    username: string;
    displayName: string;
  };
}

export const InvitationButton: React.FC<InvitationButtonProps> = ({ targetUser }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<Id<"ideas"> | null>(null);
  const [invitationMessage, setInvitationMessage] = useState("");

  const { toast } = useToast();

  // Get current user's ideas
  const myIdeas = useQuery(api.ideas.getUserIdeas);

  // Send invitation mutation
  const sendInvitationMutation = useMutation(api.invitations.sendInvitation);

  const handleSendInvitation = async () => {
    if (!selectedIdeaId) {
      toast({
        title: "Please select an idea",
        description: "You need to select an idea to invite the user to collaborate on.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendInvitationMutation({
        ideaId: selectedIdeaId,
        username: targetUser.username,
        message: invitationMessage.trim() || undefined,
      });

      toast({
        title: "Invitation sent!",
        description: `Successfully invited ${targetUser.displayName} to collaborate.`,
      });

      // Reset state
      setIsPopoverOpen(false);
      setSelectedIdeaId(null);
      setInvitationMessage("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: "Failed to send invitation",
        description: message || "An error occurred while sending the invitation.",
        variant: "destructive",
      });
    }
  };

  const handleClosePopover = () => {
    setIsPopoverOpen(false);
    setSelectedIdeaId(null);
    setInvitationMessage("");
  };

  if (!myIdeas) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Spinner size={14} />
        Loading...
      </Button>
    );
  }

  if (myIdeas.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        title="Create an idea first to send invitations"
        className="w-full"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Send Invitation
      </Button>
    );
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Send Invitation
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 max-h-[80vh] overflow-y-auto" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Invite {targetUser.displayName} to collaborate</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Select one of your ideas that you'd like {targetUser.displayName} to contribute to.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Select an idea:
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {myIdeas.map((idea) => (
                  <div
                    key={idea._id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedIdeaId === idea._id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedIdeaId(idea._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{idea.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {idea.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {idea.category}
                          </Badge>
                          <Badge
                            variant={idea.visibility === "public" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {idea.visibility}
                          </Badge>
                        </div>
                      </div>
                      {selectedIdeaId === idea._id && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Invitation message (optional):
              </label>
              <textarea
                className="w-full p-3 border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder={`Hi ${targetUser.displayName}, I'd love for you to contribute to this idea...`}
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {invitationMessage.length}/500 characters
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleClosePopover}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendInvitation}
                disabled={!selectedIdeaId}
              >
                Send Invitation
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};