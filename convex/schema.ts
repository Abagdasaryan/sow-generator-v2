import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  sows: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("final"),
      v.literal("archived")
    ),
    title: v.string(),
    currentVersion: v.number(),
    templateId: v.optional(v.id("sowTemplates")),
    clientInfo: v.any(),
    integrationDetails: v.any(),
    scopeDeliverables: v.any(),
    pricingTerms: v.any(),
    generatedContent: v.any(),
    duplicatedFrom: v.optional(v.id("sows")),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  sowVersions: defineTable({
    sowId: v.id("sows"),
    versionNumber: v.number(),
    snapshot: v.any(),
    changeSummary: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_sow", ["sowId"]),

  sowApprovals: defineTable({
    sowId: v.id("sows"),
    requestedBy: v.id("users"),
    assignedTo: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("changes_requested")
    ),
    comments: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
  })
    .index("by_sow", ["sowId"])
    .index("by_assigned", ["assignedTo", "status"]),

  sowTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    clientInfo: v.any(),
    integrationDetails: v.any(),
    scopeDeliverables: v.any(),
    pricingTerms: v.any(),
    createdBy: v.id("users"),
    isDefault: v.boolean(),
  }),

  sowComments: defineTable({
    sowId: v.id("sows"),
    section: v.string(),
    userId: v.id("users"),
    content: v.string(),
    resolved: v.boolean(),
  }).index("by_sow", ["sowId"]),
});
