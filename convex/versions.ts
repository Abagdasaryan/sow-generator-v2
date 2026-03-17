import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listBySow = query({
  args: { sowId: v.id("sows") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const versions = await ctx.db
      .query("sowVersions")
      .withIndex("by_sow", (q) => q.eq("sowId", args.sowId))
      .collect();

    // Sort by versionNumber descending
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  },
});

export const getVersion = query({
  args: { id: v.id("sowVersions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const version = await ctx.db.get(args.id);
    if (!version) throw new Error("Version not found");

    return {
      ...version,
      snapshot:
        typeof version.snapshot === "string"
          ? JSON.parse(version.snapshot)
          : version.snapshot,
    };
  },
});

export const createSnapshot = mutation({
  args: {
    sowId: v.id("sows"),
    changeSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sow = await ctx.db.get(args.sowId);
    if (!sow) throw new Error("SOW not found");

    const snapshot = {
      title: sow.title,
      status: sow.status,
      clientInfo: sow.clientInfo,
      integrationDetails: sow.integrationDetails,
      scopeDeliverables: sow.scopeDeliverables,
      pricingTerms: sow.pricingTerms,
      generatedContent: sow.generatedContent,
    };

    const versionNumber = sow.currentVersion + 1;

    const versionId = await ctx.db.insert("sowVersions", {
      sowId: args.sowId,
      versionNumber,
      snapshot: JSON.stringify(snapshot),
      changeSummary: args.changeSummary,
      createdBy: userId,
    });

    await ctx.db.patch(args.sowId, { currentVersion: versionNumber });

    return versionId;
  },
});

export const revert = mutation({
  args: {
    sowId: v.id("sows"),
    versionId: v.id("sowVersions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sow = await ctx.db.get(args.sowId);
    if (!sow) throw new Error("SOW not found");

    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");
    if (version.sowId !== args.sowId) {
      throw new Error("Version does not belong to this SOW");
    }

    const snapshot =
      typeof version.snapshot === "string"
        ? JSON.parse(version.snapshot)
        : version.snapshot;

    // Apply the snapshot back to the SOW
    await ctx.db.patch(args.sowId, {
      title: snapshot.title,
      status: snapshot.status,
      clientInfo: snapshot.clientInfo,
      integrationDetails: snapshot.integrationDetails,
      scopeDeliverables: snapshot.scopeDeliverables,
      pricingTerms: snapshot.pricingTerms,
      generatedContent: snapshot.generatedContent,
    });

    // Create a new version noting the revert
    const newVersionNumber = sow.currentVersion + 1;

    // Read the reverted state to snapshot it
    const revertedSow = await ctx.db.get(args.sowId);
    if (!revertedSow) throw new Error("SOW not found after revert");

    const revertSnapshot = {
      title: revertedSow.title,
      status: revertedSow.status,
      clientInfo: revertedSow.clientInfo,
      integrationDetails: revertedSow.integrationDetails,
      scopeDeliverables: revertedSow.scopeDeliverables,
      pricingTerms: revertedSow.pricingTerms,
      generatedContent: revertedSow.generatedContent,
    };

    await ctx.db.insert("sowVersions", {
      sowId: args.sowId,
      versionNumber: newVersionNumber,
      snapshot: JSON.stringify(revertSnapshot),
      changeSummary: `Reverted to version ${version.versionNumber}`,
      createdBy: userId,
    });

    await ctx.db.patch(args.sowId, { currentVersion: newVersionNumber });

    return newVersionNumber;
  },
});
