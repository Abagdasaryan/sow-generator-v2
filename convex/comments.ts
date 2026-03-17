import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listBySow = query({
  args: { sowId: v.id("sows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comments = await ctx.db
      .query("sowComments")
      .withIndex("by_sow", (q) => q.eq("sowId", args.sowId))
      .collect();

    // Enrich comments with user names
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          userName: user?.name ?? user?.email ?? "Unknown User",
        };
      })
    );

    return enrichedComments;
  },
});

export const create = mutation({
  args: {
    sowId: v.id("sows"),
    section: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sow = await ctx.db.get(args.sowId);
    if (!sow) throw new Error("SOW not found");

    const commentId = await ctx.db.insert("sowComments", {
      sowId: args.sowId,
      section: args.section,
      userId,
      content: args.content,
      resolved: false,
    });

    return commentId;
  },
});

export const update = mutation({
  args: {
    id: v.id("sowComments"),
    content: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");

    const patch: Record<string, unknown> = {};
    if (args.content !== undefined) {
      // Only the comment owner can edit content
      if (comment.userId !== userId) {
        throw new Error("Only the comment author can edit content");
      }
      patch.content = args.content;
    }
    if (args.resolved !== undefined) {
      patch.resolved = args.resolved;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error("No fields to update");
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("sowComments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");

    if (comment.userId !== userId) {
      throw new Error("Only the comment author can delete this comment");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
