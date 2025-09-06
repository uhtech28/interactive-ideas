import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new todo for an idea
export const createTodo = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate input
    if (!args.title.trim()) {
      throw new Error("Todo title is required");
    }

    if (args.title.length > 200) {
      throw new Error("Todo title must be 200 characters or less");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if idea exists and get idea details for authorization
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      throw new Error("Idea not found");
    }

    // Check if idea is deleted
    if (idea.isDeleted) {
      throw new Error("Cannot add todos to deleted ideas");
    }

    // Check authorization: user must be author of idea OR have accepted contribution request
    const isAuthor = idea.authorId === user._id;
    if (!isAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === args.ideaId);

      if (!validRequest) {
        throw new Error("You are not authorized to add todos to this idea. You must be the author or have an accepted contribution request.");
      }
    }

    // Get the highest order value for this idea to maintain ordering
    const existingTodos = await ctx.db
      .query("todos")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();

    const maxOrder = existingTodos.length > 0
      ? Math.max(...existingTodos.map(todo => todo.order || 0))
      : 0;

    const now = Date.now();

    // Create the todo
    const todoId = await ctx.db.insert("todos", {
      ideaId: args.ideaId,
      authorId: user._id,
      title: args.title.trim(),
      status: "todo",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return { todoId, message: "Todo created successfully" };
  },
});

// Update a todo (change title or order)
export const updateTodo = mutation({
  args: {
    todoId: v.id("todos"),
    title: v.optional(v.string()),
    order: v.optional(v.number()),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if user is the author of the todo
    if (todo.authorId !== user._id) {
      throw new Error("Not authorized to update this todo");
    }

    // Validate title if provided
    if (args.title !== undefined) {
      if (!args.title.trim()) {
        throw new Error("Todo title is required");
      }
      if (args.title.length > 200) {
        throw new Error("Todo title must be 200 characters or less");
      }
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updateData.title = args.title.trim();
    }

    if (args.order !== undefined) {
      updateData.order = args.order;
    }

    // Update the todo
    await ctx.db.patch(todo._id, updateData);

    return { message: "Todo updated successfully" };
  },
});

// Toggle completion status of a todo
export const toggleTodoComplete = mutation({
  args: {
    todoId: v.id("todos"),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if idea exists and user is authorized
    const idea = await ctx.db.get(todo.ideaId);
    if (!idea) {
      throw new Error("Associated idea not found");
    }

    // Check authorization: user must be author of idea OR todo author OR have accepted contribution request
    const isAuthor = idea.authorId === user._id;
    const isTodoAuthor = todo.authorId === user._id;
    let isAcceptedContributor = false;

    if (!isAuthor && !isTodoAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === todo.ideaId);

      if (!validRequest) {
        throw new Error("You are not authorized to modify todos for this idea.");
      }
      isAcceptedContributor = true;
    }

    // Cycle status: todo -> in_progress -> done -> todo
    let newStatus: "todo" | "in_progress" | "done";
    switch (todo.status) {
      case "todo":
        newStatus = "in_progress";
        break;
      case "in_progress":
        newStatus = "done";
        break;
      case "done":
        newStatus = "todo";
        break;
      default:
        newStatus = "todo"; // fallback
    }

    await ctx.db.patch(todo._id, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    return { status: newStatus, message: "Todo status updated successfully" };
  },
});

// Update todo status directly (for Kanban drag-drop)
export const updateTodoStatus = mutation({
  args: {
    todoId: v.id("todos"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done")),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if idea exists and user is authorized
    const idea = await ctx.db.get(todo.ideaId);
    if (!idea) {
      throw new Error("Associated idea not found");
    }

    // Check authorization: user must be author of idea OR todo author OR have accepted contribution request
    const isAuthor = idea.authorId === user._id;
    const isTodoAuthor = todo.authorId === user._id;
    let isAcceptedContributor = false;

    if (!isAuthor && !isTodoAuthor) {
      // Check for accepted contribution request
      const acceptedRequests = await ctx.db
        .query("contributionRequests")
        .withIndex("by_contributor_status", (q) =>
          q.eq("contributorId", user._id).eq("status", "accepted")
        )
        .collect();

      // Filter to find accepted request for this specific idea
      const validRequest = acceptedRequests.find(request => request.ideaId === todo.ideaId);

      if (!validRequest) {
        throw new Error("You are not authorized to modify todos for this idea.");
      }
      isAcceptedContributor = true;
    }

    // No need to validate status as it's already union-typed

    await ctx.db.patch(todo._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { status: args.status, message: "Todo status updated successfully" };
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: {
    todoId: v.id("todos"),
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

    // Get the todo
    const todo = await ctx.db.get(args.todoId);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Check if user is the author of the todo
    if (todo.authorId !== user._id) {
      throw new Error("Not authorized to delete this todo");
    }

    // Delete the todo
    await ctx.db.delete(args.todoId);

    return { message: "Todo deleted successfully" };
  },
});

// Get todos for an idea with authorization check
export const getTodosForIdea = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication (optional for viewing, but required for editing)
    const identity = await ctx.auth.getUserIdentity();

    // Check if idea exists and is not deleted
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return [];
    }

    if (idea.isDeleted) {
      return [];
    }

    let currentUser = null;
    let isAuthor = false;
    let isAcceptedContributor = false;

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (currentUser) {
        isAuthor = idea.authorId === currentUser._id;

        if (!isAuthor) {
          // Check for accepted contribution request
          const acceptedRequests = await ctx.db
            .query("contributionRequests")
            .withIndex("by_contributor_status", (q) =>
              q.eq("contributorId", currentUser!._id).eq("status", "accepted")
            )
            .collect();

          // Filter to find accepted request for this specific idea
          isAcceptedContributor = acceptedRequests.some(request => request.ideaId === args.ideaId);
        }
      }
    }

    // Get todos for the idea
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .order("asc") // Order by creation time (or we could sort by order field)
      .collect();

    // Get author information for each todo and add authorization info
    const todosWithAuthors = await Promise.all(
      todos.map(async (todo) => {
        const author = await ctx.db.get(todo.authorId);
        return {
          ...todo,
          author: author ? {
            _id: author._id,
            name: author.displayName,
            username: author.username,
            avatar: author.avatar,
          } : null,
          canEdit: currentUser
            ? currentUser._id === todo.authorId
            : false,
          canDelete: currentUser
            ? currentUser._id === todo.authorId
            : false,
        };
      })
    );

    return todosWithAuthors;
  },
});

// Get todos grouped by completion status for an idea
export const getTodosGroupedByStatus = query({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    // Check authentication (optional for viewing, but required for editing)
    const identity = await ctx.auth.getUserIdentity();

    // Check if idea exists and is not deleted
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) {
      return { pending: [], completed: [] };
    }

    if (idea.isDeleted) {
      return { pending: [], completed: [] };
    }

    let currentUser = null;
    let isAuthor = false;
    let isAcceptedContributor = false;

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      if (currentUser) {
        isAuthor = idea.authorId === currentUser._id;

        if (!isAuthor) {
          // Check for accepted contribution request
          const acceptedRequests = await ctx.db
            .query("contributionRequests")
            .withIndex("by_contributor_status", (q) =>
              q.eq("contributorId", currentUser!._id).eq("status", "accepted")
            )
            .collect();

          // Filter to find accepted request for this specific idea
          isAcceptedContributor = acceptedRequests.some(request => request.ideaId === args.ideaId);
        }
      }
    }

    // Get todos for the idea
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .order("asc")
      .collect();

    // Group todos by status
    const todo: any[] = [];
    const in_progress: any[] = [];
    const done: any[] = [];

    for (const todoItem of todos) {
      const author = await ctx.db.get(todoItem.authorId);
      const todoWithAuthor = {
        ...todoItem,
        author: author ? {
          _id: author._id,
          name: author.displayName,
          username: author.username,
          avatar: author.avatar,
        } : null,
        canEdit: currentUser
          ? currentUser._id === todoItem.authorId
          : false,
        canDelete: currentUser
          ? currentUser._id === todoItem.authorId
          : false,
      };

      if (todoItem.status === "todo") {
        todo.push(todoWithAuthor);
      } else if (todoItem.status === "in_progress") {
        in_progress.push(todoWithAuthor);
      } else {
        done.push(todoWithAuthor);
      }
    }

    return {
      todo,
      in_progress,
      done,
    };
  },
});