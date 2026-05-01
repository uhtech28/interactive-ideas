import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { LEVEL_DEFINITIONS } from "./ventureConstants";
import { meetsLevelRequirements } from "./levels";

function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

export const getStreak = query({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const streak = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: "",
            recoveryAvailable: false
        };
    },
});

export const getUserStreak = query({
    args: { userId: v.id("users") },
    handler: async ({ db }, args) => {
        const streak = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        return streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: "",
            recoveryAvailable: false
        };
    },
});

export const updateStreak = mutation({
    handler: async ({ db, auth, scheduler }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const today = getTodayString();

        const streakRecord = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        if (!streakRecord) {
            await db.insert("userStreaks", {
                userId: user._id,
                currentStreak: 1,
                longestStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
                recoveryAvailable: true,
            });

            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "started", streak: 1 };
        }

        if (streakRecord.lastLoginDate === today) {
            return { status: "maintained", streak: streakRecord.currentStreak };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (streakRecord.lastLoginDate === yesterdayString) {
            const newStreak = streakRecord.currentStreak + 1;
            await db.patch(streakRecord._id, {
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streakRecord.longestStreak),
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });

            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "incremented", streak: newStreak };
        } else {
            await db.patch(streakRecord._id, {
                currentStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });

            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "reset", streak: 1 };
        }
    },
});

export const getWallet = query({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return wallet || { balance: 0 };
    },
});

export const getUserWallet = query({
    args: { userId: v.id("users") },
    handler: async ({ db }, args) => {
        const wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        return wallet || { balance: 0 };
    },
});

export const awardPoints = mutation({
    args: {
        userId: v.optional(v.id("users")),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        relatedId: v.optional(v.string()),
    },
    handler: async ({ db, auth }, args) => {
        let userId = args.userId;

        if (!userId) {
            const identity = await auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const user = await db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user) throw new Error("User not found");
            userId = user._id;
        }

        let wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", userId!))
            .first();

        if (!wallet) {
            const walletId = await db.insert("wallets", {
                userId: userId!,
                balance: 0,
                updatedAt: Date.now(),
            });
            wallet = await db.get(walletId);
        }

        if (!wallet) throw new Error("Failed to initialize wallet");

        const newBalance = wallet.balance + args.amount;

        await db.patch(wallet._id, {
            balance: newBalance,
            updatedAt: Date.now(),
        });

        await db.insert("transactions", {
            walletId: wallet._id,
            amount: args.amount,
            type: args.type,
            description: args.description,
            relatedId: args.relatedId,
            createdAt: Date.now(),
        });

        return { success: true, newBalance };
    },
});

function calculateLevelFromXP(xp: number): number {
    if (xp < 1000) {
        return Math.floor(xp / 100) + 1;
    }
    const power = Math.log(xp / 1000) / Math.log(1.5);
    return Math.floor(10 + power);
}

function calculateXPForLevel(level: number): number {
    if (level <= 10) {
        return (level - 1) * 100;
    }
    return Math.floor(1000 * Math.pow(1.5, level - 10));
}

export const getLevelProgress = query({
    args: { xp: v.number() },
    handler: async (ctx, args) => {
        const level = calculateLevelFromXP(args.xp);
        const currentLevelStart = calculateXPForLevel(level);
        const nextLevelStart = calculateXPForLevel(level + 1);

        return {
            level,
            currentXP: args.xp,
            levelStartXP: currentLevelStart,
            nextLevelXP: nextLevelStart,
            progress: ((args.xp - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100
        };
    }
});

export const awardXP = mutation({
    args: {
        userId: v.optional(v.id("users")),
        amount: v.number(),
        action: v.string(),
    },
    handler: async ({ db, auth }, args) => {
        let userId = args.userId;

        if (!userId) {
            const identity = await auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const user = await db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user) throw new Error("User not found");
            userId = user._id;
        }

        const user = await db.get(userId);
        if (!user) throw new Error("User not found");

        const currentXP = user.xp || 0;
        const currentLevel = user.level || 1;
        const newXP = currentXP + args.amount;

        const newLevel = calculateLevelFromXP(newXP);

        await db.patch(userId, {
            xp: newXP,
            level: newLevel,
        });

        return {
            xpAdded: args.amount,
            newTotalXP: newXP,
            levelUp: newLevel > currentLevel,
            newLevel,
        };
    },
});

export const internalAwardXP = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        action: v.string(),
    },
    handler: async ({ db }, args) => {
        const user = await db.get(args.userId);
        if (!user) return;

        const currentXP = user.xp || 0;
        const newXP = currentXP + args.amount;

        const newLevel = calculateLevelFromXP(newXP);

        await db.patch(args.userId, {
            xp: newXP,
            level: newLevel,
        });
    },
});

export const internalAwardPoints = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        relatedId: v.optional(v.string()),
    },
    handler: async ({ db }, args) => {
        let wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (!wallet) {
            const walletId = await db.insert("wallets", {
                userId: args.userId,
                balance: 0,
                updatedAt: Date.now(),
            });
            wallet = await db.get(walletId);
        }

        if (!wallet) return;

        const newBalance = wallet.balance + args.amount;

        await db.patch(wallet._id, {
            balance: newBalance,
            updatedAt: Date.now(),
        });

        await db.insert("transactions", {
            walletId: wallet._id,
            amount: args.amount,
            type: args.type,
            description: args.description,
            relatedId: args.relatedId,
            createdAt: Date.now(),
        });

        // Mirror the award into userLevels.titlePoints/totalPoints so the Level
        // bar in the profile UI advances. Also increment the task-gate counters
        // (ideasCreated/commentsCount/etc.) based on action type so Lv 1–6 gates
        // can actually be cleared.
        const now = Date.now();
        const userLevel = await db
            .query("userLevels")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        const counterDelta = {
            ideasCreated: args.type === "create_idea" ? 1 : 0,
            commentsCount: args.type === "comment" ? 1 : 0,
            collaboratorsRecruited: args.type === "request_accepted" ? 1 : 0,
            collaboratorsJoined: args.type === "contribution_accepted" ? 1 : 0,
        };

        if (userLevel) {
            const newTitlePoints = (userLevel.titlePoints || 0) + args.amount;
            const newTotalPoints = (userLevel.totalPoints || 0) + args.amount;
            const newIdeasCreated = (userLevel.ideasCreated || 0) + counterDelta.ideasCreated;
            const newCommentsCount = (userLevel.commentsCount || 0) + counterDelta.commentsCount;
            const newCollabRecruited = (userLevel.collaboratorsRecruited || 0) + counterDelta.collaboratorsRecruited;
            const newCollabJoined = (userLevel.collaboratorsJoined || 0) + counterDelta.collaboratorsJoined;

            // Level-up: must satisfy BOTH titlePoints threshold AND task gates
            // (Lv 1–6 task-gated; Lv 7+ pure points). Loops only matters past Lv 7.
            const projectedUserLevel = {
                ...userLevel,
                titlePoints: newTitlePoints,
                totalPoints: newTotalPoints,
                ideasCreated: newIdeasCreated,
                commentsCount: newCommentsCount,
                collaboratorsRecruited: newCollabRecruited,
                collaboratorsJoined: newCollabJoined,
            };
            let newLevel = userLevel.currentLevel || 1;
            while (newLevel < 50) {
                const nextDef = LEVEL_DEFINITIONS.find((l) => l.level === newLevel + 1);
                if (!nextDef) break;
                const pointsOk = newTitlePoints >= nextDef.titlePoints;
                const gateOk = meetsLevelRequirements(nextDef.level, projectedUserLevel);
                if (pointsOk && gateOk) {
                    newLevel = nextDef.level;
                } else {
                    break;
                }
            }

            await db.patch(userLevel._id, {
                titlePoints: newTitlePoints,
                totalPoints: newTotalPoints,
                ideasCreated: newIdeasCreated,
                commentsCount: newCommentsCount,
                collaboratorsRecruited: newCollabRecruited,
                collaboratorsJoined: newCollabJoined,
                currentLevel: newLevel,
                updatedAt: now,
            });
        } else {
            await db.insert("userLevels", {
                userId: args.userId,
                currentLevel: 1,
                titlePoints: args.amount,
                totalPoints: args.amount,
                goldCheckpoints: 0,
                fullLifecycles: 0,
                helpfulFlareResponses: 0,
                flaresResolved: 0,
                menteesCount: 0,
                menteeCheckpointAdvances: 0,
                menteeLevelAchievements: 0,
                ideasLaunched: 0,
                ideasScaled: 0,
                collaboratorsRecruited: counterDelta.collaboratorsRecruited,
                collaboratorsJoined: counterDelta.collaboratorsJoined,
                commentsCount: counterDelta.commentsCount,
                upvotedCommentsCount: 0,
                ideasCreated: counterDelta.ideasCreated,
                ideasWithStage6: 0,
                ideasWithStage8: 0,
                activeIdeaTypes: [],
                updatedAt: now,
            });
        }
    },
});