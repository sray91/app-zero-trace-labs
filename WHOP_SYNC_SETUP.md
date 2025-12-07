# Whop User Sync Setup Guide

This guide explains how to sync Whop users with your Supabase database.

## Overview

The sync system provides:
- **Webhook Handler**: Automatically syncs users when Whop sends events
- **Manual Sync API**: Bulk sync all Whop users on demand
- **Utility Functions**: Helper functions for custom sync logic

## Setup Instructions

### 1. Update Database Schema

Run the SQL script in your Supabase SQL Editor:

```bash
# File: scripts/update-customers-table.sql
```

This creates/updates the `customers` table with:
- `whop_user_id` - Whop's user ID
- `user_id` - Link to Supabase auth.users
- `full_name` - User's name
- `plan_name` - Subscription plan name
- `subscription_status` - active, cancelled, trialing, etc.
- `has_app_access` - Boolean for app access
- Indexes for performance

### 2. Environment Variables

Add to your `.env.local`:

```env
# Existing Whop variables
WHOP_API_KEY=your_whop_api_key
WHOP_API_BASE_URL=https://api.whop.com/api/v2

# New variables for sync
WHOP_WEBHOOK_SECRET=your_webhook_secret_from_whop
SYNC_API_SECRET=your_random_secret_for_manual_sync

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configure Whop Webhook

1. Go to your Whop Developer Dashboard
2. Navigate to Webhooks
3. Create a new webhook with URL:
   ```
   https://yourdomain.com/api/whop/webhook
   ```
4. Select these events:
   - `membership.went_valid`
   - `membership.went_invalid`
   - `membership.created`
   - `membership.updated`
   - `membership.deleted`
   - `payment.succeeded`
   - `payment.failed`
5. Copy the webhook secret and add it to `WHOP_WEBHOOK_SECRET`

## Usage

### Automatic Sync (Webhook)

Once configured, users are automatically synced when:
- New membership created
- Membership status changes
- Payment succeeds/fails
- Membership updated or deleted

The webhook endpoint is at: `/api/whop/webhook`

### Manual Bulk Sync

Sync all Whop users at once:

```bash
curl -X POST https://yourdomain.com/api/whop/sync-users \
  -H "Authorization: Bearer YOUR_SYNC_API_SECRET" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "total": 150,
  "created": 10,
  "updated": 140,
  "failed": 0
}
```

### View Synced Customers

```bash
curl -X GET https://yourdomain.com/api/whop/sync-users \
  -H "Authorization: Bearer YOUR_SYNC_API_SECRET"
```

### Using Utility Functions

In your code:

```javascript
import {
  syncWhopUserToSupabase,
  createSupabaseAuthAccountForWhopUser,
  linkWhopCustomerToAuthUser,
  getWhopMembershipStatus
} from '@/lib/whop-sync'

// Sync a specific user
const result = await syncWhopUserToSupabase({
  email: 'user@example.com',
  id: 'whop_user_123',
  name: 'John Doe',
  status: 'active',
  valid: true,
  plan: { name: 'Pro Plan' }
})

// Create auth account for Whop user
const authResult = await createSupabaseAuthAccountForWhopUser(
  'user@example.com'
)

// Link existing customer to auth user
await linkWhopCustomerToAuthUser(
  'user@example.com',
  'auth_user_uuid'
)

// Check membership status from Whop API
const status = await getWhopMembershipStatus('user@example.com')
console.log(status.hasActiveMembership)
```

## Data Flow

1. **User purchases on Whop** → Webhook fires → User synced to `customers` table
2. **User signs up** → Supabase auth account created → Linked to existing customer record (if any)
3. **Manual sync** → All Whop memberships fetched → Batch sync to database

## Database Relationships

```
auth.users (Supabase Auth)
    ↓ (user_id)
customers (Whop data)
    ↓ (customer_id)
user_profiles (App data)
```

## Troubleshooting

### Webhook not receiving events
- Check Whop webhook configuration
- Verify webhook URL is publicly accessible
- Check logs: webhook signature validation
- Ensure `WHOP_WEBHOOK_SECRET` is set

### Manual sync fails
- Verify `WHOP_API_KEY` is valid
- Check API rate limits
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase table permissions

### Users not linking to auth accounts
- Ensure email matches exactly (case-insensitive)
- Check if user has completed sign-up
- Verify `user_profiles` table exists
- Run `/scripts/create-user-profiles.sql` if needed

## Security Notes

- Webhook signature verification prevents unauthorized requests
- Manual sync endpoint requires `SYNC_API_SECRET` header
- Service role key bypasses RLS (keep secure)
- Never expose secrets in client-side code

## Testing

Test webhook locally with ngrok:

```bash
ngrok http 3000
# Use ngrok URL in Whop webhook configuration
```

Test manual sync:

```bash
# Replace with your local/staging URL and secret
curl -X POST http://localhost:3000/api/whop/sync-users \
  -H "Authorization: Bearer your-sync-secret"
```

## Next Steps

1. Run database migration: `scripts/update-customers-table.sql`
2. Add environment variables
3. Configure Whop webhook
4. Test with a webhook event
5. Run manual sync to backfill existing users
6. Monitor logs for any sync errors

## API Endpoints

- `POST /api/whop/webhook` - Receives Whop events (public, signature-verified)
- `POST /api/whop/sync-users` - Manual bulk sync (authenticated)
- `GET /api/whop/sync-users` - View synced customers (authenticated)
- `POST /api/whop/plan` - Check user's plan (existing)
- `GET /api/check-whop-customer` - Check customer status (existing)
