// Promote (or demote) a Clerk user to admin by email, by setting
// publicMetadata.role. The app reads this for admin access.
//
// Usage:
//   node scripts/set-admin.mjs you@example.com           # make admin
//   node scripts/set-admin.mjs you@example.com --remove   # remove admin
//
// Requires CLERK_SECRET_KEY in .env.local (already present).

import { config } from 'dotenv'
config({ path: '.env.local' })

const SECRET = process.env.CLERK_SECRET_KEY
const email = process.argv[2]
const remove = process.argv.includes('--remove')

if (!SECRET) {
  console.error('Missing CLERK_SECRET_KEY in .env.local')
  process.exit(1)
}
if (!email) {
  console.error('Usage: node scripts/set-admin.mjs <email> [--remove]')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${SECRET}`,
  'Content-Type': 'application/json',
}

const lookup = await fetch(
  `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
  { headers }
)
if (!lookup.ok) {
  console.error('Lookup failed:', lookup.status, await lookup.text())
  process.exit(1)
}
const users = await lookup.json()
if (!users.length) {
  console.error(`No Clerk user found with email ${email}`)
  process.exit(1)
}
const user = users[0]

const patch = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ public_metadata: { role: remove ? null : 'admin' } }),
})
if (!patch.ok) {
  console.error('Update failed:', patch.status, await patch.text())
  process.exit(1)
}
const updated = await patch.json()
console.log(
  `${remove ? 'Removed admin from' : 'Made admin:'} ${email} (${user.id}) -> role=${updated.public_metadata?.role ?? 'none'}`
)
console.log('Sync to Convex happens via the user.updated webhook. If it did not,')
console.log('have the user sign out/in, or re-save the user to re-fire the webhook.')
