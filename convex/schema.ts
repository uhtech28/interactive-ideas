import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Users table - stores user profiles and settings
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    username: v.string(), // Unique username
    displayName: v.string(), // Display name
    bio: v.optional(v.string()), // User bio
    avatar: v.optional(v.string()), // Avatar URL
    location: v.optional(v.string()), // User location
    website: v.optional(v.string()), // Website URL
    github: v.optional(v.string()), // GitHub URL
    linkedin: v.optional(v.string()), // LinkedIn URL
    twitter: v.optional(v.string()), // Twitter handle
    skills: v.optional(v.array(v.string())), // Array of user skills (handled via userSkills table)
    industry: v.optional(v.string()), // Primary industry
    completedOnboarding: v.boolean(), // Onboarding status
    createdAt: v.number(), // Unix timestamp
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_completed_onboarding", ["completedOnboarding"])
    .index("by_created_at", ["createdAt"]),

  // User skills table for many-to-many relationship
  userSkills: defineTable({
    userId: v.id("users"), // Reference to users table
    skillName: v.string(), // Skill name
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillName"]),

  // User industries table for many-to-many relationship
  userIndustries: defineTable({
    userId: v.id("users"), // Reference to users table
    industryName: v.string(), // Industry name
  })
    .index("by_user", ["userId"])
    .index("by_industry", ["industryName"]),

  // Session tracking for security
  userSessions: defineTable({
    userId: v.id("users"), // Reference to users table
    sessionId: v.string(), // Session identifier
    expiresAt: v.number(), // Expiration timestamp
  })
    .index("by_session", ["sessionId"])
    .index("by_user_expires", ["userId", "expiresAt"]),
 
    // Ideas table - stores user-created ideas
    ideas: defineTable({
      authorId: v.id("users"), // Reference to users table (author)
      title: v.string(), // Idea title (required)
      description: v.string(), // Idea description (required)
      category: v.string(), // Category selector (Technology, Art, Business, etc.)
      visibility: v.string(), // 'public' or 'private'
      // File attachment URLs (stored in Convex storage)
      attachments: v.optional(v.array(v.object({
        name: v.string(),
        type: v.string(),
        size: v.number(),
        url: v.string(),
        fileId: v.string(), // Convex storage ID
      }))),
      sparkCount: v.number(), // Number of spark/like actions
      commentCount: v.number(), // Number of comments
      createdAt: v.number(), // Unix timestamp
      updatedAt: v.number(), // Unix timestamp
    })
      .index("by_author", ["authorId"])
      .index("by_visibility", ["visibility"])
      .index("by_category", ["category"])
      .index("by_created_at", ["createdAt"])
      .index("by_author_visibility", ["authorId", "visibility"])
      .index("by_category_created", ["category", "createdAt"]),
 })