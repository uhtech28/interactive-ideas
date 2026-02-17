import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) return [];

    const userId = userDoc._id;

    // Get conversations where user is participant1 or participant2
    const convos1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) => q.eq("participant1", userId))
      .collect();

    const convos2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) => q.eq("participant2", userId))
      .collect();

    // Filter out group conversations and sort
    const allConvos = [...convos1, ...convos2]
      .filter(c => c.type !== 'group')
      .sort((a, b) => b.updatedAt - a.updatedAt);

    // Enhance with last message preview
    const enhancedConvos = await Promise.all(
      allConvos.map(async (convo) => {
        const lastMessage = convo.lastMessageId
          ? await ctx.db.get(convo.lastMessageId)
          : null;

        const otherParticipantId =
          convo.participant1 === userId ? convo.participant2 : convo.participant1;

        if (!otherParticipantId) return null;

        const otherUser = await ctx.db.get(otherParticipantId);

        return {
          ...convo,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          } : null,
          otherUser: otherUser ? {
            id: otherUser._id,
            username: otherUser.username,
            displayName: otherUser.displayName,
            avatar: otherUser.avatar,
          } : null,
        };
      })
    );

    return enhancedConvos.filter(c => c !== null);
  },
});

// Get all group conversations for the user
// UPDATED: Fetches groups where user is a member OR explicit Idea Communities
export const getGroupConversationsList = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) return [];
    const userId = userDoc._id;

    // 1. Get explicit group memberships
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const memberGroupIds = memberships.map(m => m.conversationId);

    const memberGroups = await Promise.all(
      memberGroupIds.map(id => ctx.db.get(id))
    );

    // 2. Get "Implicit" Idea Communities (Where user is Author or Contributor)
    // Deprecated? No, let's keep them as "General" channels for the idea.
    const authoredIdeas = await ctx.db
      .query("ideas")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    const contributions = await ctx.db
      .query("contributionRequests")
      .withIndex("by_contributor_status", (q) => q.eq("contributorId", userId).eq("status", "accepted"))
      .collect();

    const contributedIdeaIds = contributions.map(c => c.ideaId);
    const contributedIdeas = await Promise.all(contributedIdeaIds.map(id => ctx.db.get(id)));

    const allIdeas = [...authoredIdeas, ...contributedIdeas].filter((idea): idea is NonNullable<typeof idea> => idea !== null);
    const uniqueIdeas = Array.from(new Map(allIdeas.map(item => [item._id, item])).values());

    // Retrieve "General" conversations for these ideas
    const generalGroups = await Promise.all(uniqueIdeas.map(async (idea) => {
      const convo = await ctx.db
        .query("conversations")
        .withIndex("by_idea", (q) => q.eq("ideaId", idea._id))
        .filter(q => q.eq(q.field("type"), "group")) // Ensure it's a group
        .collect();

      // Find the "main" one (created automatically or has no custom name/creator)
      // Or simply include ALL groups for this idea if we are "Author"?
      // Actually, "Sub-groups" should probably require explicit membership even for Authors if we want strict separation,
      // BUT usually Authors see everything. Let's stick to:
      // - Sub-Groups: Only if in `conversationMembers` (or maybe Author sees all? Let's say explicit for now)
      // - Main Idea Chat: Implicit for Authors/Contributors.

      // Let's assume the "Main" chat is the one created implicitly (no creatorId or specific name?)
      // Or we just return ALL conversations linked to these ideas, assuming Authors/Contributors have access to at least the Main one?
      // To avoid confusion, let's stick to the current logic:
      // We look for existing conversations for the idea.

      // Filter out sub-groups from this "Implicit" list if they are meant to be private.
      // If a sub-group has a `creatorId`, it's a sub-group.

      return convo.filter(c => !c.creatorId); // implicit groups only
    }));

    const flatGeneralGroups = generalGroups.flat();

    // Combine Member Groups and Implicit General Groups
    const allGroups = [...memberGroups, ...flatGeneralGroups].filter((g): g is NonNullable<typeof g> => !!g);

    // Deduplicate by ID
    const uniqueGroupMap = new Map();
    allGroups.forEach(g => uniqueGroupMap.set(g._id, g));
    const uniqueGroups = Array.from(uniqueGroupMap.values());

    // Format for return
    const groupsFormatted = await Promise.all(uniqueGroups.map(async (convo) => {
      let lastMessage = null;
      if (convo.lastMessageId) {
        lastMessage = await ctx.db.get(convo.lastMessageId);
      }

      // Get Idea Name if missing name (for implicit groups)
      let name = convo.name;
      if (!name && convo.ideaId) {
        const idea = await ctx.db.get(convo.ideaId);
        name = (idea as any)?.title || "Unknown Idea";
      }

      return {
        ideaId: convo.ideaId,
        conversationId: convo._id,
        name: name || "Group Chat",
        avatar: null,
        lastMessage: lastMessage ? {
          content: (lastMessage as any).content,
          createdAt: (lastMessage as any).createdAt,
          senderId: (lastMessage as any).senderId,
        } : null,
        unreadCount: convo.unreadCount || 0,
        isSubGroup: !!convo.creatorId,
      };
    }));

    return groupsFormatted.sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
  }
});

export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Enhance messages with sender details
    const enhancedMessages = await Promise.all(messages.map(async (msg) => {
      const sender = await ctx.db.get(msg.senderId);
      return {
        ...msg,
        senderName: sender?.displayName,
        senderAvatar: sender?.avatar,
      };
    }));

    return enhancedMessages;
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    }));
  },
});

export const getUserByClerkId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

export const sendMessage = mutation({
  args: {
    receiverId: v.optional(v.id("users")),
    content: v.string(),
    messageType: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    ideaId: v.optional(v.id("ideas")), // For creating group chat on first message
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) throw new Error("User not found");
    const userId = userDoc._id;

    let conversationId = args.conversationId;

    // Handle Group Chat Creation/Retrieval
    if (args.ideaId) {
      if (!conversationId) {
        // Try to find the "Main" conversation for this idea (no creatorId)
        const existingConvo = await ctx.db
          .query("conversations")
          .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
          .filter(q => q.eq(q.field("type"), "group"))
          .collect();

        // Find one without creatorId (the specific default one)
        const mainConvo = existingConvo.find(c => !c.creatorId);

        if (mainConvo) {
          conversationId = mainConvo._id;
        } else {
          // Create new DEFAULT group conversation
          conversationId = await ctx.db.insert("conversations", {
            type: 'group',
            ideaId: args.ideaId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            // No creatorId for system/default groups
          });
        }
      }
    }
    // Handle Direct Chat Creation/Retrieval
    else if (args.receiverId && !conversationId) {
      let convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) =>
          q.eq("participant1", userId).eq("participant2", args.receiverId)
        )
        .first();

      if (!convoDoc) {
        convoDoc = await ctx.db
          .query("conversations")
          .withIndex("by_participants", (q) =>
            q.eq("participant1", args.receiverId!).eq("participant2", userId)
          )
          .first();
      }

      if (convoDoc) {
        conversationId = convoDoc._id;
      } else {
        conversationId = await ctx.db.insert("conversations", {
          participant1: userId,
          participant2: args.receiverId,
          type: 'direct',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (!conversationId) throw new Error("Could not determine conversation");

    // Create message
    const messageId = await ctx.db.insert("messages", {
      senderId: userId,
      receiverId: args.receiverId, // Optional for group
      content: args.content,
      createdAt: Date.now(),
      read: false,
      conversationId,
      messageType: args.messageType || "text",
    });

    // Update conversation
    await ctx.db.patch(conversationId, {
      updatedAt: Date.now(),
      lastMessageId: messageId,
    });

    return messageId;
  },
});

export const createConversation = mutation({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) throw new Error("User not found");

    const userId = userDoc._id;

    // Check if conversation already exists
    let convoDoc = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => q.eq("participant1", userId).eq("participant2", args.receiverId))
      .first();

    if (!convoDoc) {
      convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => q.eq("participant1", args.receiverId).eq("participant2", userId))
        .first();
    }

    if (convoDoc) {
      return convoDoc._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participant1: userId,
      participant2: args.receiverId,
      type: 'direct',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const markMessagesRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject as Id<"users">;

    // Get messages in conversation where receiver is current user and not read
    // Note: For group chats, 'read' status is more complex (per user). 
    // For now, we only mark direct messages as read or implement a simpler group read logic later.
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.and(q.eq("receiverId", userId as any), q.eq(q.field("read"), false)))
      .collect();

    // Mark each as read
    await Promise.all(
      messages.map((msg) => ctx.db.patch(msg._id, { read: true }))
    );
  },
});

export const getDirectConversationId = query({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) return null;
    const userId = userDoc._id;

    let convoDoc = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => q.eq("participant1", userId).eq("participant2", args.receiverId))
      .first();

    if (!convoDoc) {
      convoDoc = await ctx.db
        .query("conversations")
        .withIndex("by_participants", (q) => q.eq("participant1", args.receiverId).eq("participant2", userId))
        .first();
    }

    return convoDoc?._id || null;
  },
});

// [NEW] Create a sub-group conversation
export const createGroupConversation = mutation({
  args: {
    ideaId: v.id("ideas"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!userDoc) throw new Error("User not found");
    const userId = userDoc._id;

    // Check permissions: Must be Author or Accepted Contributor
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) throw new Error("Idea not found");

    const isAuthor = idea.authorId === userId;
    let isContributor = false;

    if (!isAuthor) {
      const contribution = await ctx.db
        .query("contributionRequests")
        .withIndex("by_idea_contributor", (q) => q.eq("ideaId", args.ideaId).eq("contributorId", userId))
        .filter(q => q.eq(q.field("status"), "accepted"))
        .first();
      isContributor = !!contribution;
    }

    if (!isAuthor && !isContributor) {
      throw new Error("Only contributors can create sub-groups");
    }

    // Create Group
    const conversationId = await ctx.db.insert("conversations", {
      type: 'group',
      ideaId: args.ideaId,
      name: args.name,
      creatorId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add Creator as Member (Admin)
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    return conversationId;
  }
});

// [NEW] Add a member to a sub-group
export const addGroupMember = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const hasUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!hasUser) throw new Error("User not found");
    const currentUserId = hasUser._id;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== 'group') throw new Error("Invalid group");

    // Retrieve ALL membership records for this conversation at once to check sender permission
    // BUT we can just check if currentUser is a member
    const userMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", q => q.eq("userId", currentUserId).eq("conversationId", args.conversationId))
      .first();

    // Permission Check: 
    // 1. Is Creator?
    // 2. Is Existing Member? (Assuming any member can add, based on user request "if a contributor is there he also can add")
    const isCreator = conversation.creatorId === currentUserId;
    const isMember = !!userMembership;

    if (!isCreator && !isMember) {
      throw new Error("You must be a member of the group to add others");
    }

    // Check if target user is already a member
    const targetMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_conversation", q => q.eq("userId", args.userId).eq("conversationId", args.conversationId))
      .first();

    if (targetMembership) throw new Error("User is already a member");

    // Add Member
    await ctx.db.insert("conversationMembers", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });
  }
});

// [NEW] Get potential members (contributors) to add
export const getPotentialGroupMembers = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, args) => {
    // Get Idea Author
    const idea = await ctx.db.get(args.ideaId);
    if (!idea) return [];

    const author = await ctx.db.get(idea.authorId);

    // Get Contributors
    const contributions = await ctx.db
      .query("contributionRequests")
      .withIndex("by_idea_status_created", (q) => q.eq("ideaId", args.ideaId).eq("status", "accepted"))
      .collect();

    const contributorIds = contributions.map(c => c.contributorId);
    const contributors = await Promise.all(contributorIds.map(id => ctx.db.get(id)));

    const allUsers = [author, ...contributors].filter(u => u !== null);

    // Dedupe
    const uniqueUsers = Array.from(new Map(allUsers.map(item => [item._id, item])).values());

    return uniqueUsers.map(u => ({
      id: u._id,
      displayName: u.displayName,
      avatar: u.avatar
    }));
  }
});