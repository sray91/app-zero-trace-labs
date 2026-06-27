import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

/**
 * Promote/revoke admin access for a user.
 *
 * Clerk's publicMetadata.role is the source of truth for the `admin` role (the
 * Convex webhook syncs it into the `users` table). Updating it here makes the
 * change durable; the admin console also patches Convex directly for instant UI.
 *
 * Body: { clerkId: string, role: 'admin' | null }
 */
export async function POST(request) {
  try {
    const { userId: callerId } = await auth()
    if (!callerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clerkId, role } = await request.json()
    if (!clerkId || (role !== 'admin' && role !== null)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const client = await clerkClient()

    // Only an existing admin may change roles.
    const caller = await client.users.getUser(callerId)
    if (caller.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Guard against self-lockout.
    if (callerId === clerkId && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot revoke your own admin access' },
        { status: 400 }
      )
    }

    // Setting a publicMetadata key to null removes it; Clerk merges the rest.
    await client.users.updateUserMetadata(clerkId, {
      publicMetadata: { role },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('set-role error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}
