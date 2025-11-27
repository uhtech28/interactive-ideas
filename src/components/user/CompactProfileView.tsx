"use client";

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Eye, Lightbulb, Users, Sparkles, Heart, MapPin, Link2, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation";
import { ProfileStatsDialog } from "./ProfileStatsDialog";
import { Id } from "@convex/_generated/dataModel";

interface UserProfile {
  _id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills?: string[];
  location?: string;
  website?: string;
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
}

interface Idea {
  _id: string;
  title: string;
  description: string;
  visibility: string;
  category?: string;
  createdAt: number;
  sparkCount?: number;
  contributionCount?: number;
}

interface CompactProfileViewProps {
  profile: UserProfile;
  publicIdeas?: Idea[];
  onInvite?: () => void;
}

export const CompactProfileView: React.FC<CompactProfileViewProps> = ({ 
  profile, 
  publicIdeas,
  onInvite 
}) => {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<"created" | "sparked" | "contributed" | null>(null);

  const metrics = {
    ideasCreated: profile.ideasCreated || 0,
    ideasSparked: profile.ideasSparked || 0,
    ideasContributed: profile.ideasContributed || 0,
  };

  const openDialog = (type: "created" | "sparked" | "contributed") => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleIdeaClick = (ideaId: string) => {
    router.push(`/idea/${ideaId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Identity Card (Span 2) */}
        <Card className="md:col-span-2 shadow-sm border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden relative flex flex-col">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"></div>
          <CardContent className="p-5 pt-6 relative flex-1">
            <div className="flex flex-col sm:flex-row gap-5 items-start h-full">
              <div className="relative shrink-0">
                <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                  <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground leading-tight">{profile.displayName}</h1>
                  <p className="text-muted-foreground font-medium text-sm">@{profile.username}</p>
                </div>

                {profile.bio && (
                  <p className="text-foreground/80 text-sm leading-relaxed max-w-xl line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center pt-0.5">
                  {profile.location && (
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors bg-muted/50 px-2 py-1 rounded-md">
                      <Link2 className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>

                {/* Skills & Industries moved here */}
                <div className="pt-1.5 space-y-2">
                   {(profile.industry || (profile.skills && profile.skills.length > 0)) && (
                     <div className="flex flex-wrap gap-1.5">
                        {profile.industry && (
                          <Badge variant="secondary" className="rounded-md px-2 py-0 text-[10px] font-medium h-5">
                            {profile.industry}
                          </Badge>
                        )}
                        {profile.skills && profile.skills.slice(0, 5).map((skill, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="rounded-md px-2 py-0 text-[10px] font-normal bg-background/50 h-5"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills && profile.skills.length > 5 && (
                          <Badge variant="outline" className="rounded-md px-2 py-0 text-[10px] font-normal bg-background/50 h-5">
                            +{profile.skills.length - 5}
                          </Badge>
                        )}
                     </div>
                   )}
                </div>

                {onInvite && (
                  <div className="pt-1">
                    <Button onClick={onInvite} size="sm" className="rounded-full px-5 h-8 text-xs">
                      Send Invitation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Stats Column (Span 1) */}
        <div className="md:col-span-1 grid grid-rows-3 gap-3">
          <Card 
            className="shadow-sm border-border/40 hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => openDialog("created")}
          >
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metrics.ideasCreated}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="shadow-sm border-border/40 hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => openDialog("sparked")}
          >
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Sparked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metrics.ideasSparked}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-sm border-border/40 hover:bg-muted/30 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => openDialog("contributed")}
          >
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Contributed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{metrics.ideasContributed}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Public Ideas Feed (Span 3 - Full Width) */}
        <Card className="md:col-span-3 shadow-sm border-border/40 min-h-[300px]">
          <CardHeader className="border-b border-border/40 bg-muted/10 py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                Public Ideas
              </CardTitle>
              {publicIdeas && publicIdeas.length > 0 && (
                 <Badge variant="secondary" className="rounded-full px-2 h-5 text-[10px]">
                   {publicIdeas.length}
                 </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {publicIdeas && publicIdeas.length > 0 ? (
              <div className="divide-y divide-border/40">
                {publicIdeas.slice(0, 5).map((idea) => (
                  <div 
                    key={idea._id} 
                    className="p-4 hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => handleIdeaClick(idea._id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {idea.title}
                          </h4>
                          {idea.category && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded-sm font-normal text-muted-foreground">
                              {idea.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {idea.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                         <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            <Heart className="w-3 h-3" />
                            {idea.sparkCount || 0}
                         </div>
                         <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            <Users className="w-3 h-3" />
                            {idea.contributionCount || 0}
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
                {publicIdeas.length > 5 && (
                  <div className="p-3 text-center bg-muted/5">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-8">
                      View All Ideas
                    </Button>
                  </div>
                )}
              </div>
            ) : publicIdeas === undefined ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mb-2"></div>
                <p className="text-xs">Loading ideas...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                <Eye className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-medium">No public ideas shared yet</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <ProfileStatsDialog 
        userId={profile._id as Id<"users">} 
        type={dialogType}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}