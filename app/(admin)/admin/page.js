'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Loader2,
  ChevronRight,
  ShieldCheck,
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  ListTodo,
  Search
} from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <Card className="glass-card border-warning-yellow/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-yellow/10">
            <Icon className="h-5 w-5 text-warning-yellow" />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit text-foreground leading-none">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
        {sub && <div className="text-xs text-muted-foreground mt-3">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listUsers)
  const [query, setQuery] = useState('')

  // Fleet aggregates stay computed over every client; only the table is filtered.
  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !users) return users ?? []
    return users.filter((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ')
      return (
        name.toLowerCase().includes(q) ||
        (u.name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      )
    })
  }, [users, query])

  if (users === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-warning-yellow" />
      </div>
    )
  }

  // Fleet-wide aggregates — what makes this an admin console rather than a
  // single-user dashboard.
  const totalUsers = users.length
  const totalRemoved = users.reduce((s, u) => s + u.removed, 0)
  const totalSubmitted = users.reduce((s, u) => s + u.submitted, 0)
  const totalOpenTasks = users.reduce((s, u) => s + u.openTasks, 0)
  const avgProgress = totalUsers
    ? Math.round(users.reduce((s, u) => s + u.progressPct, 0) / totalUsers)
    : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Console identity banner — visually distinct from the user dashboard */}
      <div className="mb-8 rounded-xl border border-warning-yellow/30 bg-warning-yellow/5 p-5">
        <div className="flex items-center gap-2 text-warning-yellow">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Admin Console</span>
        </div>
        <h1 className="text-3xl font-bold font-outfit text-foreground mt-1">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Oversee every client's removal progress, update their records, and run the per-user SOP.
        </p>
      </div>

      {/* Fleet overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Clients" value={totalUsers} icon={UsersIcon} />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={ShieldCheck} />
        <StatCard label="Confirmed Removed" value={totalRemoved} icon={CheckCircle2} />
        <StatCard label="Opt-Outs Submitted" value={totalSubmitted} icon={Clock} />
        <StatCard label="Open Tasks" value={totalOpenTasks} icon={ListTodo} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold font-outfit text-foreground">
          All Clients ({query.trim() ? `${visibleUsers.length} of ${totalUsers}` : totalUsers})
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients by name or email…"
            className="pl-8"
          />
        </div>
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
              {visibleUsers.map((u) => {
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
              {visibleUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {totalUsers === 0
                      ? 'No users yet.'
                      : `No clients match “${query.trim()}”.`}
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
