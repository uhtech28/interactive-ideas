import React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Interface matching the UserProfile from profile page
interface UserProfile {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  industry?: string;
  skills: string[];
  completedOnboarding: boolean;
  createdAt: number;
  updatedAt: number;
  ideasCreated?: number;
  ideasSparked?: number;
  ideasContributed?: number;
}

interface CompactProfileViewProps {
  profile: UserProfile;
}

export const CompactProfileView: React.FC<CompactProfileViewProps> = ({ profile }) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header - Compact */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar} alt={profile.displayName} />
              <AvatarFallback className="text-lg">
                {profile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <p className="text-lg text-muted-foreground">@{profile.username}</p>
              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm max-w-lg line-clamp-3">
                  {profile.bio}
                </p>
              )}
              {profile.industry && (
                <Badge variant="secondary" className="mt-2">
                  {profile.industry}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Compact Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-xl font-bold text-primary">{profile.ideasCreated || 0}</div>
            <div className="text-xs text-muted-foreground">Ideas Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-xl font-bold text-primary">{profile.ideasSparked || 0}</div>
            <div className="text-xs text-muted-foreground">Ideas Sparked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <div className="text-xl font-bold text-primary">{profile.ideasContributed || 0}</div>
            <div className="text-xs text-muted-foreground">Contributed</div>
          </CardContent>
        </Card>
      </div>

      {/* Skills - Compact */}
      {profile.skills.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Skills</h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.skills.slice(0, 6).map((skill: string, index: number) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.skills.length - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}