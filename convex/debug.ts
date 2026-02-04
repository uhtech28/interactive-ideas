import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. Get current Clerk ID (to copy-paste)
export const getMyIdentity = query({
    handler: async ({ auth }) => {
        const identity = await auth.getUserIdentity();
        return identity ? identity : "Not Logged In";
    },
});

// 2. Force reassign a username to the current logged-in user
// WARNING: distinct administration tool for dev use only
export const claimUsername = mutation({
    args: { username: v.string() },
    handler: async ({ db, auth }, { username }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const normalizedUsername = username.toLowerCase().trim();

        // Find the "zombie" user
        const existingUser = await db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
            .first();

        if (!existingUser) {
            return "Username not found. Nothing to claim.";
        }

        // Update the Clerk ID to the current user's ID
        await db.patch(existingUser._id, {
            clerkId: identity.subject,
            isActive: true, // Reactivate if dormant
        });

        return `Successfully reclaimed username '${normalizedUsername}' for Clerk ID ${identity.subject}`;
    },
});
