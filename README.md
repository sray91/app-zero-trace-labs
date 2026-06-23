# 0TraceLabs — Data Broker Search & Removal

A Next.js app that lets users find their personal information across data broker sites
and manage removal requests. Auth, billing, and data are powered by the same stack as
the companion iOS app: **Clerk**, **RevenueCat**, and **Convex**.

## Features

- 🔍 Search across data broker sites and track exposure per broker
- 🔐 Authentication via Clerk
- 💳 Subscriptions via RevenueCat Web Billing (entitlements shared with the iOS app)
- 📝 Search history and removal-request tracking (paid plans)
- 📱 Responsive UI built with TailwindCSS + shadcn/ui

## Technology Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: TailwindCSS + shadcn/ui, Lucide icons
- **Auth**: [Clerk](https://clerk.com)
- **Billing**: [RevenueCat Web Billing](https://www.revenuecat.com/docs/web/web-billing/overview)
- **Backend/DB**: [Convex](https://convex.dev) (queries, mutations, and webhook handlers)

## Architecture

- `convex/` — the Convex backend (shared deployment with the iOS app):
  - `schema.ts` — tables (`users`, `subscriptions`, `userProfiles`, `dataSources`,
    `brokerExposures`, `searchHistory`, `removalRequests`)
  - `users.ts`, `subscriptions.ts` — queries/mutations + internal webhook mutations
  - `http.ts` — webhook routes: `/clerk-webhook` (user sync) and
    `/revenuecat-webhook` (entitlement sync)
  - `dataSources.ts`, `brokerExposures.ts`, `searchHistory.ts`, `removalRequests.ts`
- `components/providers/ConvexClientProvider.jsx` — wires Clerk + Convex on the client
- `lib/contexts/AuthContext.js` — `useAuth()` shim (Clerk identity + Convex entitlement)
- `middleware.js` — `clerkMiddleware()` route protection
- The welcome-completion gate runs in `components/AppLayout.jsx` (Convex isn't reachable
  from Edge middleware)

Entitlements are keyed by RevenueCat `app_user_id` == the Clerk user id, so iOS and web
resolve to the same Convex user.

## Quick Start

### Prerequisites

- Node.js 18+
- Accounts: Clerk, RevenueCat (Web Billing enabled), and access to the shared Convex project

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy env vars and fill them in (see `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

3. Link the Convex deployment and generate types. This sets `CONVEX_DEPLOYMENT` and
   `NEXT_PUBLIC_CONVEX_URL` in `.env.local` and creates `convex/_generated/`:
   ```bash
   npx convex dev
   ```

4. (First run only) seed the data broker list:
   ```bash
   npx convex run dataSources:seed
   ```

5. Configure webhooks:
   - **Clerk** → `https://<your-convex-deployment>.convex.site/clerk-webhook`
     (events: `user.created`, `user.updated`, `user.deleted`; set
     `CLERK_WEBHOOK_SIGNING_SECRET`)
   - **RevenueCat** → `https://<your-convex-deployment>.convex.site/revenuecat-webhook`
     (set the Authorization header to `REVENUECAT_WEBHOOK_AUTH_HEADER`)

6. Start the dev server (run `npx convex dev` in a second terminal alongside it):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Environment Variables

See `.env.example` for the full list. Key groups: Convex (`NEXT_PUBLIC_CONVEX_URL`),
Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
`CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_CLERK_FRONTEND_API_URL`), and RevenueCat
(`NEXT_PUBLIC_REVENUECAT_WEB_BILLING_KEY`, `REVENUECAT_WEBHOOK_AUTH_HEADER`). Third-party
data/email services (Apify, SearchBug, SendGrid) keep their existing keys.

## Deployment

Deploy the frontend to Vercel and the backend with `npx convex deploy`. Point the Clerk
and RevenueCat webhooks at the production Convex `.convex.site` URL.

## License

MIT — see [LICENSE](LICENSE).
