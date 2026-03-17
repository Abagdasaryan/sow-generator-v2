import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./users";

const sowStatus = v.union(
  v.literal("draft"),
  v.literal("in_review"),
  v.literal("approved"),
  v.literal("final"),
  v.literal("archived")
);

function defaultClientInfo() {
  return {
    company_name: "",
    contact_name: "",
    contact_title: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    project_name: "",
    project_code: "",
    start_date: "",
    end_date: "",
    prepared_by: "",
    prepared_date: "",
  };
}

function defaultIntegrationDetails() {
  return {
    platform: "boomi",
    platform_version: "",
    source_systems: [],
    target_systems: [],
    integrations: [],
  };
}

function defaultScopeDeliverables() {
  return {
    phases: [],
    milestones: [],
    assumptions: [],
    exclusions: [],
    acceptance_criteria: [],
    roles: [],
  };
}

function defaultPricingTerms() {
  return {
    billing_type: "time_and_materials",
    rates: [],
    phases_pricing: [],
    total_amount: 0,
    currency: "USD",
    payment_schedule: [],
    payment_terms_days: 30,
    change_order_rate: 0,
    travel_expenses_included: false,
    travel_cap: 0,
    terms_and_conditions: "",
  };
}

function defaultGeneratedContent() {
  return {
    executive_summary: "",
    scope_narratives: {},
    architecture_description: "",
    deliverables_prose: "",
  };
}

/**
 * List SOWs for the authenticated user.
 * Optionally filter by status. Returns SOWs sorted by _creationTime DESC.
 */
export const list = query({
  args: {
    status: v.optional(sowStatus),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let sows;
    if (args.status) {
      sows = await ctx.db
        .query("sows")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else {
      sows = await ctx.db
        .query("sows")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }

    return sows;
  },
});

/**
 * Get a single SOW by ID. Verifies the authenticated user owns it.
 */
export const get = query({
  args: {
    id: v.id("sows"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const sow = await ctx.db.get(args.id);
    if (!sow || sow.userId !== userId) return null;

    return sow;
  },
});

/**
 * Create a new draft SOW with default values for all JSON fields.
 */
export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sowId = await ctx.db.insert("sows", {
      userId,
      title: args.title,
      status: "draft",
      currentVersion: 1,
      clientInfo: defaultClientInfo(),
      integrationDetails: defaultIntegrationDetails(),
      scopeDeliverables: defaultScopeDeliverables(),
      pricingTerms: defaultPricingTerms(),
      generatedContent: defaultGeneratedContent(),
    });

    return sowId;
  },
});

/**
 * Partial update of a SOW. Auto-increments currentVersion and creates
 * a version snapshot in the sowVersions table on each update.
 */
export const update = mutation({
  args: {
    id: v.id("sows"),
    title: v.optional(v.string()),
    status: v.optional(sowStatus),
    clientInfo: v.optional(v.any()),
    integrationDetails: v.optional(v.any()),
    scopeDeliverables: v.optional(v.any()),
    pricingTerms: v.optional(v.any()),
    generatedContent: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("SOW not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");

    // Build the partial update object
    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.status !== undefined) updates.status = args.status;
    if (args.clientInfo !== undefined) updates.clientInfo = args.clientInfo;
    if (args.integrationDetails !== undefined)
      updates.integrationDetails = args.integrationDetails;
    if (args.scopeDeliverables !== undefined)
      updates.scopeDeliverables = args.scopeDeliverables;
    if (args.pricingTerms !== undefined)
      updates.pricingTerms = args.pricingTerms;
    if (args.generatedContent !== undefined)
      updates.generatedContent = args.generatedContent;

    const newVersion = existing.currentVersion + 1;
    updates.currentVersion = newVersion;

    // Save a version snapshot before applying the update
    await ctx.db.insert("sowVersions", {
      sowId: args.id,
      versionNumber: existing.currentVersion,
      snapshot: {
        title: existing.title,
        status: existing.status,
        clientInfo: existing.clientInfo,
        integrationDetails: existing.integrationDetails,
        scopeDeliverables: existing.scopeDeliverables,
        pricingTerms: existing.pricingTerms,
        generatedContent: existing.generatedContent,
      },
      createdBy: userId,
    });

    await ctx.db.patch(args.id, updates);

    return args.id;
  },
});

/**
 * Soft delete a SOW by setting its status to "archived".
 */
export const remove = mutation({
  args: {
    id: v.id("sows"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const sow = await ctx.db.get(args.id);
    if (!sow) throw new Error("SOW not found");
    if (sow.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { status: "archived" });

    return args.id;
  },
});

/**
 * Deep copy a SOW with a new ID. Resets to draft status and records
 * the original SOW ID in duplicatedFrom.
 */
export const duplicate = mutation({
  args: {
    id: v.id("sows"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("SOW not found");
    if (original.userId !== userId) throw new Error("Unauthorized");

    const newSowId = await ctx.db.insert("sows", {
      userId,
      title: `${original.title} (Copy)`,
      status: "draft",
      currentVersion: 1,
      clientInfo: structuredClone(original.clientInfo),
      integrationDetails: structuredClone(original.integrationDetails),
      scopeDeliverables: structuredClone(original.scopeDeliverables),
      pricingTerms: structuredClone(original.pricingTerms),
      generatedContent: structuredClone(original.generatedContent),
      duplicatedFrom: args.id,
    });

    return newSowId;
  },
});
