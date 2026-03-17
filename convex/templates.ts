import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./users";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.query("sowTemplates").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    // Direct template data
    clientInfo: v.optional(v.any()),
    integrationDetails: v.optional(v.any()),
    scopeDeliverables: v.optional(v.any()),
    pricingTerms: v.optional(v.any()),
    // Or create from an existing SOW
    fromSowId: v.optional(v.id("sows")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let clientInfo = args.clientInfo;
    let integrationDetails = args.integrationDetails;
    let scopeDeliverables = args.scopeDeliverables;
    let pricingTerms = args.pricingTerms;

    if (args.fromSowId) {
      const sow = await ctx.db.get(args.fromSowId);
      if (!sow) throw new Error("Source SOW not found");

      clientInfo = sow.clientInfo;
      integrationDetails = sow.integrationDetails;
      scopeDeliverables = sow.scopeDeliverables;
      pricingTerms = sow.pricingTerms;
    }

    if (!clientInfo || !integrationDetails || !scopeDeliverables || !pricingTerms) {
      throw new Error(
        "Template data is required. Provide all fields directly or use fromSowId."
      );
    }

    const templateId = await ctx.db.insert("sowTemplates", {
      name: args.name,
      description: args.description,
      clientInfo,
      integrationDetails,
      scopeDeliverables,
      pricingTerms,
      createdBy: userId,
      isDefault: false,
    });

    return templateId;
  },
});

export const update = mutation({
  args: {
    id: v.id("sowTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    clientInfo: v.optional(v.any()),
    integrationDetails: v.optional(v.any()),
    scopeDeliverables: v.optional(v.any()),
    pricingTerms: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.clientInfo !== undefined) patch.clientInfo = args.clientInfo;
    if (args.integrationDetails !== undefined)
      patch.integrationDetails = args.integrationDetails;
    if (args.scopeDeliverables !== undefined)
      patch.scopeDeliverables = args.scopeDeliverables;
    if (args.pricingTerms !== undefined) patch.pricingTerms = args.pricingTerms;

    if (Object.keys(patch).length === 0) {
      throw new Error("No fields to update");
    }

    await ctx.db.patch(args.id, patch);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("sowTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    await ctx.db.delete(args.id);
    return args.id;
  },
});
