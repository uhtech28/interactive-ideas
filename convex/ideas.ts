import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

    // Check if current user has sparked this idea
    let hasSparked = false;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (user) {
        const spark = await ctx.db
          .query("userIdeaSparks")
          .withIndex("by_user_idea", (q) =>
            q.eq("userId", user._id).eq("ideaId", args.ideaId)
          )
          .unique();
        hasSparked = spark !== null;
      }
    }

    return {
      ...idea,
      author: author ? {
        ...author,
        name: author.displayName,
        username: author.username,
      } : null,
      hasSparked,
    };
  },
});

// Check if current user has sparked an idea
export const hasSparked = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return false;
    }

    const spark = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", args.ideaId)
      )
      .unique();

    return spark !== null;
  },
});

// Toggle spark for an idea (add/remove spark)
export const toggleSpark = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if idea exists
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if spark already exists
    const existingSpark = await ctx.db
      .query("userIdeaSparks")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", args.ideaId)
      )
      .unique();

    if (existingSpark) {
      // Remove spark
      await ctx.db.delete(existingSpark._id);

      // Decrement spark count
      await ctx.db.patch(idea._id, {
        sparkCount: Math.max(0, idea.sparkCount - 1),
        updatedAt: Date.now(),
      });

      return { action: "removed", sparkCount: Math.max(0, idea.sparkCount - 1) };
    } else {
      // Add spark
      const now = Date.now();
      await ctx.db.insert("userIdeaSparks", {
        userId: user._id,
        ideaId: args.ideaId,
        createdAt: now,
      });

      // Increment spark count
      await ctx.db.patch(idea._id, {
        sparkCount: idea.sparkCount + 1,
        updatedAt: now,
      });

      return { action: "added", sparkCount: idea.sparkCount + 1 };
    }
  },
});

// Get comments for an idea
export const getComments = query({
  args: {
    ideaId: v.id("ideas"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_idea_created", (q) => q.eq("ideaId", args.ideaId))
      .order("asc")
      .take(limit);

    // Get author information for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? {
            ...author,
            name: author.displayName,
            username: author.username,
            avatar: author.avatar,
          } : null,
        };
      })
    );

    return commentsWithAuthors;
  },
});

// Add a comment to an idea
export const addComment = mutation({
  args: {
    ideaId: v.id("ideas"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate input
    if (!args.content.trim()) {
      throw new Error("Comment content is required");
    }

    if (args.content.length > 500) {
      throw new Error("Comment must be 500 characters or less");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if idea exists
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    const now = Date.now();

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      ideaId: args.ideaId,
      authorId: user._id,
      content: args.content.trim(),
      createdAt: now,
      parentCommentId: args.parentCommentId,
    });

    // Increment comment count
    await ctx.db.patch(idea._id, {
      commentCount: idea.commentCount + 1,
      updatedAt: now,
    });

    return { commentId, message: "Comment added successfully" };
  },
});

// Delete a comment (if needed)
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is the author
    if (comment.authorId !== user._id) {
      throw new Error("Not authorized to delete this comment");
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);

    // Get the idea to decrement count
    const idea = await ctx.db.get(comment.ideaId);
    if (idea) {
      await ctx.db.patch(idea._id, {
        commentCount: Math.max(0, idea.commentCount - 1),
        updatedAt: Date.now(),
      });
    }

    // Note: Nested comments should be handled by frontend (e.g., gray out replies)

    return { message: "Comment deleted successfully" };
  },
});

// Update an idea
export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
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

    // Get the idea
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if user is the author
    if (idea.authorId !== user._id) {
      throw new Error("Not authorized to update this idea");
    }

    // Update the idea
    await ctx.db.patch(idea._id, {
      title: args.title.trim(),
      description: args.description.trim(),
      updatedAt: Date.now(),
    });

    return { message: "Idea updated successfully" };
  },
});