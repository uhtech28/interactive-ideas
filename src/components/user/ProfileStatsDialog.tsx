"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ProfileStatsDialogProps {
  userId: Id<"users">;
  type: "created" | "sparked" | "contributed" | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IdeaWithDetails {
  _id: string;
  title: string;
  description: string;
  category?: string;
  createdAt: number;
  sparkCount?: number;
  contributionCount?: number;
  author?: {
    username: string;
    displayName: string;
  };
  sparkedAt?: number;
  contributedAt?: number;
}

export function ProfileStatsDialog({ userId, type, isOpen, onOpenChange }: ProfileStatsDialogProps) {
  const router = useRouter();

  // Determine which query to run based on type
  const createdIdeas = useQuery(api.ideas.getPublicIdeasForUser, type === "created" ? { userId } : "skip");
  const sparkedIdeas = useQuery(api.ideas.getPublicSparkedIdeasForUser, type === "sparked" ? { userId } : "skip");
  const contributedIdeas = useQuery(api.ideas.getPublicContributedIdeasForUser, type === "contributed" ? { userId } : "skip");

  const ideas = (type === "created" ? createdIdeas : type === "sparked" ? sparkedIdeas : contributedIdeas) as IdeaWithDetails[] | undefined;
  const isLoading = ideas === undefined;

  const getTitle = () => {
    switch (type) {
      case "created": return "Created Ideas";
      case "sparked": return "Sparked Ideas";
      case "contributed": return "Contributed Ideas";
      default: return "";
    }
  };

  const handleIdeaClick = (ideaId: string) => {
    onOpenChange(false);
    router.push(`/idea/${ideaId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {getTitle()}
            {!isLoading && ideas && (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                {ideas.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-4">
                <Spinner />
              </div>
              <p>Loading ideas...</p>
            </div>
          ) : ideas && ideas.length > 0 ? (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div 
                  key={idea._id} 
                  className="group p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => handleIdeaClick(idea._id)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary/50 transition-all duration-300"></div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-base truncate pr-2 group-hover:text-primary transition-colors">
                          {idea.title}
                        </h3>
                        {idea.category && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-sm font-normal text-muted-foreground shrink-0">
                            {idea.category}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {idea.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(
                              type === 'sparked' ? idea.sparkedAt || idea.createdAt : 
                              type === 'contributed' ? idea.contributedAt || idea.createdAt : 
                              idea.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {idea.author && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground/50">by</span>
                            <span className="font-medium text-foreground/80">@{idea.author.username}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        <Heart className="w-3 h-3" />
                        {idea.sparkCount || 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        <Users className="w-3 h-3" />
                        {idea.contributionCount || 0}
                      </div>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                {type === 'created' ? <Users className="w-8 h-8 opacity-50" /> :
                 type === 'sparked' ? <Heart className="w-8 h-8 opacity-50" /> :
                 <Users className="w-8 h-8 opacity-50" />}
              </div>
              <p className="text-base font-medium">No ideas found</p>
              <p className="text-sm max-w-xs text-center mt-1">
                {type === 'created' ? "This user hasn't created any public ideas yet." :
                 type === 'sparked' ? "This user hasn't sparked any public ideas yet." :
                 "This user hasn't contributed to any public ideas yet."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
