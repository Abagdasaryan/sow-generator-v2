import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check that the requesting user is an admin
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User not found");
    if (currentUser.role !== "admin") {
      throw new Error("Only admins can list all users");
    }

    return await ctx.db.query("users").collect();
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    return user;
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("consultant"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Only admins can change roles
    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User not found");
    if (currentUser.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    const targetUser = await ctx.db.get(args.id);
    if (!targetUser) throw new Error("Target user not found");

    await ctx.db.patch(args.id, { role: args.role });
    return args.id;
  },
});
