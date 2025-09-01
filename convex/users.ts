import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// TypeScript interfaces for user data
export interface UserProfile {
  _id: string
  clerkId: string
  username: string
  displayName: string
  bio?: string
  avatar?: string
  location?: string
  website?: string
  github?: string
  linkedin?: string
  twitter?: string
  skills: string[]
  industry?: string
  completedOnboarding: boolean
  createdAt: number
  updatedAt: number
}

// Get current user's profile by Clerk ID - FAST lookup with optimized queries
export const getCurrentUser = query({
  handler: async ({ db, auth }): Promise<UserProfile | null> => {
    const identity = await auth.getUserIdentity()

    if (!identity) return null

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!profile) return null

    // Efficiently fetch related data - optimized for performance
    const skills = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    return {
      ...profile,
      skills: skills.map((s) => s.skillName),
    } as UserProfile
  },
})

// Create user profile (during onboarding)
export const createUserProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    skills: v.array(v.string()),
    industry: v.optional(v.string()),
  },
  handler: async ({ db, auth }, args): Promise<string> => {
    // Verify authentication
    const identity = await auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Check if user already exists
    const existing = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (existing) throw new Error("User profile already exists")

    // Check if username is taken
    const usernameTaken = await db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first()

    if (usernameTaken) throw new Error("Username is already taken")

    const now = Date.now()

    // Create user profile
    const userId = await db.insert("users", {
      clerkId: identity.subject,
      username: args.username,
      displayName: args.displayName,
      bio: args.bio,
      avatar: args.avatar,
      location: args.location,
      website: args.website,
      github: args.github,
      linkedin: args.linkedin,
      twitter: args.twitter,
      completedOnboarding: true,
      createdAt: now,
      updatedAt: now,
    })

    // Add skills efficiently with batch operations
    if (args.skills.length > 0) {
      await Promise.all(
        args.skills.map((skill) =>
          db.insert("userSkills", {
            userId,
            skillName: skill,
          })
        )
      )
    }

    return userId
  },
})

// Update user profile - OPTIMISTIC UPDATES with transaction safety
export const updateUserProfile = mutation({
  args: v.object({
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    twitter: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    industry: v.optional(v.string()),
  }),
  handler: async ({ db, auth }, args): Promise<string> => {
    // Verify authentication
    const identity = await auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")

    // Get user profile
    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first()

    if (!profile) throw new Error("User profile not found")

    // Update profile with optimistic results
    const updateData: any = {
      updatedAt: Date.now(),
    }

    // Only update fields that are provided
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && key !== "skills") {
        updateData[key] = value
      }
    })

    await db.patch(profile._id, updateData)

    // Handle skills updates with transaction safety
    if (args.skills !== undefined) {
      // Remove existing skills
      const existingSkills = await db
        .query("userSkills")
        .withIndex("by_user", (q) => q.eq("userId", profile._id))
        .collect()
      await Promise.all(
        existingSkills.map((skill) => db.delete(skill._id))
      )

      // Add new skills
      if (args.skills.length > 0) {
        await Promise.all(
          args.skills.map((skill) =>
            db.insert("userSkills", {
              userId: profile._id,
              skillName: skill,
            })
          )
        )
      }
    }

    return profile._id
  },
})

// Check if user exists (for middleware) - optimized for speed
export const userExists = query({
  handler: async ({ db, auth }): Promise<boolean> => {
    const identity = await auth.getUserIdentity()
    if (!identity) return false

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first()

    return !!profile
  },
})

// Search users by username - optimized with pagination
export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async ({ db }, { query, limit = 20 }): Promise<
    Array<{ id: string; username: string; displayName: string; avatar?: string }>
  > => {
    if (!query.trim()) return []

    const results = await db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", query))
      .take(limit)

    return results.map((user) => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    }))
  },
})

// Get user stats for performance monitoring
export const getUserStats = query({
  handler: async ({ db, auth }): Promise<
    | { skillsCount: number; createdAt: number; completedOnboarding: boolean }
    | null
  > => {
    const identity = await auth.getUserIdentity()
    if (!identity) return null

    const profile = await db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!profile) return null

    const skillsCount = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    return {
      skillsCount: skillsCount.length,
      createdAt: profile.createdAt,
      completedOnboarding: profile.completedOnboarding,
    }
  },
})

// Get user profile by username - for public profiles
export const getUserProfile = query({
  args: { username: v.string() },
  handler: async ({ db }, { username }): Promise<UserProfile | null> => {
    const profile = await db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()

    if (!profile) return null

    // Fetch skills efficiently
    const skills = await db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .collect()

    return {
      ...profile,
      skills: skills.map((s) => s.skillName),
    } as UserProfile
  },
})