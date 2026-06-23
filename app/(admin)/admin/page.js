'use client'

import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Loader2, ChevronRight } from 'lucide-react'

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listUsers)

  if (users === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-warning-yellow" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">
          {users.length} {users.length === 1 ? 'user' : 'users'} — track and update each user's removal progress.
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="w-48">Progress</TableHead>
                <TableHead className="text-right">Removed</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
                <TableHead className="text-right">Open Tasks</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const displayName =
                  [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || u.email || 'Unknown'
                return (
                  <TableRow key={u._id} className="cursor-pointer hover:bg-warning-yellow/5">
                    <TableCell>
                      <Link href={`/admin/users/${u._id}`} className="block">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {displayName}
                          {u.role === 'admin' && <Badge variant="secondary">admin</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={u.progressPct} className="h-2" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{u.progressPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-success-green">{u.removed}</TableCell>
                    <TableCell className="text-right text-warning-yellow">{u.submitted}</TableCell>
                    <TableCell className="text-right">{u.openTasks}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/users/${u._id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
