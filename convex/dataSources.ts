import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dataSources")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

const SEED = [
  {
    name: "Spokeo",
    url: "https://spokeo.com",
    riskLevel: "high",
    description:
      "Comprehensive people search with detailed personal information",
    dataTypes: ["name", "age", "address", "phone", "email", "relatives", "social_media"],
  },
  {
    name: "WhitePages",
    url: "https://whitepages.com",
    riskLevel: "medium",
    description: "Contact information and address history lookup",
    dataTypes: ["name", "phone", "address", "address_history"],
  },
  {
    name: "BeenVerified",
    url: "https://beenverified.com",
    riskLevel: "medium",
    description: "Background checks and social media profiles",
    dataTypes: ["name", "email", "social_media", "criminal_records", "education"],
  },
  {
    name: "TruePeopleSearch",
    url: "https://truepeoplesearch.com",
    riskLevel: "low",
    description: "Basic public records and contact information",
    dataTypes: ["name", "address", "phone", "relatives"],
  },
  {
    name: "Intelius",
    url: "https://intelius.com",
    riskLevel: "high",
    description: "Deep background searches and public records",
    dataTypes: ["name", "address", "phone", "criminal_records", "court_records", "property_records"],
  },
];

export const add = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    apiEndpoint: v.optional(v.string()),
    riskLevel: v.string(),
    description: v.optional(v.string()),
    dataTypes: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dataSources", {
      name: args.name,
      url: args.url,
      apiEndpoint: args.apiEndpoint,
      riskLevel: args.riskLevel,
      description: args.description,
      dataTypes: args.dataTypes ?? [],
      isActive: args.isActive ?? true,
    });
  },
});

// One-off: `npx convex run dataSources:seed`
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("dataSources").collect();
    const existingNames = new Set(existing.map((d) => d.name));
    let added = 0;
    for (const source of SEED) {
      if (existingNames.has(source.name)) continue;
      await ctx.db.insert("dataSources", { ...source, isActive: true });
      added++;
    }
    return { added };
  },
});
