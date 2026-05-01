import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

/**
 * Fire a flare — request help from the community.
 */
export const fireFlare = mutation({
  args: {
    description: v.string(),
    ventureId: v.optional(v.id("ventures")),
    checkpointId: v.optional(v.id("ventureCheckpoints")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) throw new Error("User not found")

    return await ctx.db.insert("flares", {
      userId: user._id,
      ventureId: args.ventureId,
      checkpointId: args.checkpointId,
      description: args.description,
      status: "open",
      createdAt: Date.now(),
    })
  },
})

/**
 * Respond to a flare with helpful advice.
 */
export const respondToFlare = mutation({
  args: {
    flareId: v.id("flares"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) throw new Error("User not found")

    const flare = await ctx.db.get(args.flareId)
    if (!flare) throw new Error("Flare not found")
    if (flare.status !== "open") throw new Error("Flare is not open")

    return await ctx.db.insert("flareResponses", {
      flareId: args.flareId,
      userId: user._id,
      content: args.content,
      createdAt: Date.now(),
    })
  },
})

/**
 * Mark a flare response as helpful.
 */
export const markResponseHelpful = mutation({
  args: {
    responseId: v.id("flareResponses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const response = await ctx.db.get(args.responseId)
    if (!response) throw new Error("Response not found")

    const flare = await ctx.db.get(response.flareId)
    if (!flare) throw new Error("Flare not found")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) throw new Error("User not found")
    if (flare.userId !== user._id) {
      throw new Error("Only the flare owner can mark responses helpful")
    }

    await ctx.db.patch(args.responseId, {
      isHelpful: true,
    })

    // Update user level tracking for helpful responses
    const responderLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", response.userId))
      .first()

    if (responderLevel) {
      await ctx.db.patch(responderLevel._id, {
        helpfulFlareResponses: (responderLevel.helpfulFlareResponses || 0) + 1,
        updatedAt: Date.now(),
      })
    }
  },
})

/**
 * Resolve a flare — mark as resolved.
 */
export const resolveFlare = mutation({
  args: {
    flareId: v.id("flares"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const flare = await ctx.db.get(args.flareId)
    if (!flare) throw new Error("Flare not found")

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) throw new Error("User not found")
    if (flare.userId !== user._id) {
      throw new Error("Only the flare owner can resolve it")
    }

    await ctx.db.patch(args.flareId, {
      status: "resolved",
      resolvedAt: Date.now(),
    })

    // Update user level tracking
    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()

    if (userLevel) {
      await ctx.db.patch(userLevel._id, {
        flaresResolved: (userLevel.flaresResolved || 0) + 1,
        updatedAt: Date.now(),
      })
    }
  },
})

/**
 * Get open flares for the community feed.
 */
export const getOpenFlares = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const flares = await ctx.db
      .query("flares")
      .withIndex("by_status_created", (q) => q.eq("status", "open"))
      .order("desc")
      .take(args.limit ?? 20)

    return flares
  },
})

/**
 * Get responses for a flare.
 */
export const getFlareResponses = query({
  args: { flareId: v.id("flares") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flareResponses")
      .withIndex("by_flare_created", (q) => q.eq("flareId", args.flareId))
      .order("asc")
      .collect()
  },
})

/**
 * Get user's flares.
 */
export const getUserFlares = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flares")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
  },
})
