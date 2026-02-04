import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Helper to get consistent date string (UTC)
function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

// Get user's current streak
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

// Update streak logic - usually called on session start
export const updateStreak = mutation({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const today = getTodayString();

        // Get existing streak record
        const streakRecord = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        if (!streakRecord) {
            // First time streak creation
            await db.insert("userStreaks", {
                userId: user._id,
                currentStreak: 1,
                longestStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
                recoveryAvailable: true,
            });
            return { status: "started", streak: 1 };
        }

        // Already logged in today?
        if (streakRecord.lastLoginDate === today) {
            return { status: "maintained", streak: streakRecord.currentStreak };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (streakRecord.lastLoginDate === yesterdayString) {
            // Logged in yesterday -> Increment streak
            const newStreak = streakRecord.currentStreak + 1;
            await db.patch(streakRecord._id, {
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streakRecord.longestStreak),
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });
            return { status: "incremented", streak: newStreak };
        } else {
            // Missed a day (or more) -> Reset streak
            // Check if recovery is available? (Future feature: Streak Freeze)
            await db.patch(streakRecord._id, {
                currentStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });
            return { status: "reset", streak: 1 };
        }
    },
});
