import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new idea
export const createIdea = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    visibility: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate input
    if (!args.title.trim()) {
      throw new Error("Title is required");
    }

    if (!args.description.trim()) {
      throw new Error("Description is required");
    }

    if (args.title.length > 100) {
      throw new Error("Title must be 100 characters or less");
    }

    if (args.description.length > 500) {
      throw new Error("Description must be 500 characters or less");
    }

    if (!['public', 'private'].includes(args.visibility)) {
      throw new Error("Invalid visibility setting");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Create the idea
    const ideaId = await ctx.db.insert("ideas", {
      authorId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      category: args.category,
      visibility: args.visibility,
      sparkCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { ideaId, message: "Idea created successfully" };
  },
});

// Get all public ideas (for feed)
export const getPublicIdeas = query({
  handler: async (ctx) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(20);

    // Get author information for each idea
    const ideasWithAuthors = await Promise.all(
      ideas.map(async (idea) => {
        const author = await ctx.db.get(idea.authorId);
        return {
          ...idea,
          author: author ? {
            ...author,
            // These fields should match the schema naming
            name: author.displayName,
            username: author.username,
          } : null,
        };
      })
    );

    return ideasWithAuthors;
  },
});

// Get a single idea by ID
export const getIdeaById = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return null;
    }

    // Get author information
    const author = await ctx.db.get(idea.authorId);

    return {
      ...idea,
      author: author ? {
        ...author,
        name: author.displayName,
        username: author.username,
      } : null,
    };
  },
});