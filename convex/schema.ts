import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// NOTE: This schema is the single source of truth for the Convex deployment shared
// with the iOS app. `users` and `subscriptions` mirror what the iOS client expects;
// reconcile field names with the live deployment when you first run `npx convex dev`.
export default defineSchema({
  // Identity, populated/kept in sync by the Clerk webhook (see convex/http.ts).
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  // Entitlement state, kept in sync by the RevenueCat webhook (see convex/http.ts).
  // `revenueCatAppUserId` equals the Clerk user id so iOS and web resolve to the
  // same entitlement.
  subscriptions: defineTable({
    userId: v.optional(v.id("users")),
    revenueCatAppUserId: v.string(),
    status: v.string(), // active | trialing | past_due | cancelled | expired
    isPaid: v.boolean(),
    plan: v.string(), // slug, e.g. "pro" or "free"
    planLabel: v.string(),
    provider: v.string(), // "revenuecat"
    entitlementId: v.optional(v.string()),
    productId: v.optional(v.string()),
    store: v.optional(v.string()), // app_store | play_store | stripe (web billing)
    currentPeriodEnd: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_rc_app_user_id", ["revenueCatAppUserId"]),

  // Web onboarding profile (mirrors the old Supabase user_profiles table).
  userProfiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    welcomeCompleted: v.boolean(),
    welcomeStep: v.optional(v.number()),
    privacyConsentGiven: v.optional(v.boolean()),
    privacyConsentDate: v.optional(v.number()),
    termsAccepted: v.optional(v.boolean()),
    termsAcceptedDate: v.optional(v.number()),
    tourCompleted: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  dataSources: defineTable({
    name: v.string(),
    url: v.string(),
    apiEndpoint: v.optional(v.string()),
    riskLevel: v.string(), // low | medium | high
    description: v.optional(v.string()),
    dataTypes: v.array(v.string()),
    isActive: v.boolean(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  brokerExposures: defineTable({
    userId: v.id("users"),
    dataSourceId: v.id("dataSources"),
    exposureStatus: v.string(), // unchecked | found | not_found
    removalStatus: v.string(), // not_started | in_progress | submitted | removed | reappeared
    listingUrl: v.optional(v.string()),
    confirmationRef: v.optional(v.string()),
    checklist: v.optional(v.any()),
    foundAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()),
    recheckAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_source", ["userId", "dataSourceId"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    results: v.optional(v.any()),
  }).index("by_user", ["userId"]),

  removalRequests: defineTable({
    userId: v.id("users"),
    dataSourceId: v.optional(v.id("dataSources")),
    fullName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    status: v.string(), // pending | submitted | completed | failed
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
