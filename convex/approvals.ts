import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./users";

export const listBySow = query({
  args: { sowId: v.id("sows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("sowApprovals")
      .withIndex("by_sow", (q) => q.eq("sowId", args.sowId))
      .collect();
  },
});

export const submitForReview = mutation({
  args: {
    sowId: v.id("sows"),
    assignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sow = await ctx.db.get(args.sowId);
    if (!sow) throw new Error("SOW not found");

    if (sow.status !== "draft" && sow.status !== "approved") {
      throw new Error(
        `Cannot submit for review: SOW is currently "${sow.status}"`
      );
    }

    // Set SOW status to in_review
    await ctx.db.patch(args.sowId, { status: "in_review" });

    // Create pending approval
    const approvalId = await ctx.db.insert("sowApprovals", {
      sowId: args.sowId,
      requestedBy: userId,
      assignedTo: args.assignedTo,
      status: "pending",
    });

    return approvalId;
  },
});

export const updateApproval = mutation({
  args: {
    id: v.id("sowApprovals"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("changes_requested")
    ),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const approval = await ctx.db.get(args.id);
    if (!approval) throw new Error("Approval not found");

    if (approval.assignedTo !== userId) {
      throw new Error("Only the assigned reviewer can update this approval");
    }

    if (approval.status !== "pending") {
      throw new Error("Approval has already been decided");
    }

    // Update the approval record
    await ctx.db.patch(args.id, {
      status: args.status,
      comments: args.comments,
      decidedAt: Date.now(),
    });

    // Update SOW status accordingly
    const sow = await ctx.db.get(approval.sowId);
    if (!sow) throw new Error("SOW not found");

    if (args.status === "approved") {
      await ctx.db.patch(approval.sowId, { status: "approved" });
    } else if (
      args.status === "rejected" ||
      args.status === "changes_requested"
    ) {
      await ctx.db.patch(approval.sowId, { status: "draft" });
    }

    return args.id;
  },
});
