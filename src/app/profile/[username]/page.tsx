"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/user/avatar-upload"
import { Plus, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { industryCardOptions, skillCardOptions } from "@/lib/options"

// Local UserProfile interface for demonstration
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
}

// Mock profile data for demonstration
const mockProfile: UserProfile = {
  _id: "1",
  clerkId: "clerk_123",
  username: "john-doe",
  displayName: "John Doe",
  bio: "Full-stack developer passionate about building innovative solutions and mentoring the next generation of developers.",
  avatar: "",
  industry: "Technology",
  skills: ["React", "TypeScript", "Node.js", "Python", "AWS"],
  completedOnboarding: true,
  createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  updatedAt: Date.now()
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string

  // Convex data
  const realProfile = useQuery(api.users.getUserProfile, { username })
  const { isLoaded } = useAuth()

  // Local state
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Use real Convex data if available, otherwise mock for john-doe
    if (realProfile) return realProfile as UserProfile
    if (username === "john-doe") return mockProfile
    return null
  })

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    avatar: "",
    industry: "",
    skills: [] as string[],
  })
  const [newSkill, setNewSkill] = useState("")

  // Update profile when Convex data loads
  useEffect(() => {
    console.log('Profile page loading:', { username, realProfile });
    if (realProfile) {
      console.log('🎯 Found real user profile from Convex:', realProfile);
      setProfile(realProfile as UserProfile);
    }
  }, [realProfile, username]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      console.log('🎯 Initializing form with profile:', profile);
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        industry: profile.industry || "",
        skills: profile.skills || [],
      })
    }
  }, [profile])

  const handleSubmit = async () => {
    if (!profile) return

    setLoading(true)
    try {
      // TODO: Integrate with Convex mutation when ready
      console.log("Updating profile:", formData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update the profile state with the new formData
      setProfile(prevProfile => {
        if (!prevProfile) return null
        return {
          ...prevProfile,
          displayName: formData.displayName,
          bio: formData.bio,
          avatar: formData.avatar,
          industry: formData.industry,
          skills: formData.skills,
          updatedAt: Date.now()
        }
      })

      setIsEditing(false)
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName,
        bio: profile.bio || "",
        avatar: profile.avatar || "",
        industry: profile.industry || "",
        skills: profile.skills || [],
      })
    }
    setIsEditing(false)
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Profile Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The user @{username} doesn&#39;t exist or has not set up their profile.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar Upload Component */}
              <div className="flex-shrink-0">
                <AvatarUpload
                  currentAvatar={formData.avatar}
                  onAvatarChange={(avatarUrl: string) =>
                    setFormData(prev => ({ ...prev, avatar: avatarUrl }))
                  }
                  displayName={formData.displayName}
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="mt-1"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={`@${username}`}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        className="mt-1"
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium">
                        Industry
                      </Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryCardOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                    <p className="text-xl text-muted-foreground">@{username}</p>
                    {profile.bio && (
                      <p className="text-gray-600 dark:text-gray-300 max-w-2xl">{profile.bio}</p>
                    )}
                    {profile.industry && (
                      <Badge variant="secondary" className="text-sm">
                        {profile.industry}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Skills Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* Current Skills */}
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {formData.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add New Skill */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select
                      value={newSkill}
                      onValueChange={setNewSkill}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a skill to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillCardOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addSkill}
                      size="sm"
                      disabled={!newSkill || formData.skills.includes(newSkill)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {newSkill && formData.skills.includes(newSkill) && (
                    <p className="text-sm text-muted-foreground">
                      This skill has already been added.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No skills added yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.displayName.trim()}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="px-6">
              Edit Profile
            </Button>
          )}
        </div>

        {/* Demo Notes */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Demo Features:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Profile picture upload with avatar component</li>
            <li>✅ Inline editing with form validation</li>
            <li>✅ Industry dropdown selection from 30+ options</li>
            <li>✅ Skills dropdown selection from 50+ predefined options</li>
            <li>✅ Skills management with add/remove functionality</li>
            <li>✅ Duplicate prevention and validation</li>
            <li>✅ Responsive design with mobile-first approach</li>
            <li>✅ Ready for Convex backend integration</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
