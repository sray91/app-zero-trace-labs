'use client'

import { useQuery } from 'convex/react'
import { format } from 'date-fns'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Loader2, ShieldCheck, Clock, CheckCircle2, CircleDashed } from 'lucide-react'

const TIER_LABEL = {
  1: 'Tier 1 – Crucial',
  2: 'Tier 2 – High',
  3: 'Tier 3 – Standard'
}

const STATUS_LABEL = {
  not_started: 'Not Started',
  searched_not_found: 'Searched – Not Found',
  searched_found: 'Searched – Found',
  submitted: 'Opt-Out Submitted',
  removed: 'Removal Confirmed',
  reappeared: 'Re-appeared',
  handled_by_service: 'Handled by Service',
  skipped: 'Skipped'
}

function statusVariant(status) {
  if (status === 'removed' || status === 'handled_by_service') return 'default'
  if (status === 'submitted' || status === 'searched_found') return 'secondary'
  return 'outline'
}

// Static class strings (Tailwind JIT can't see dynamically built class names).
const ACCENTS = {
  'nuclear-blue': { border: 'border-nuclear-blue/20', text: 'text-nuclear-blue' },
  'muted-gray': { border: 'border-muted-gray/20', text: 'text-muted-gray' },
  'warning-yellow': { border: 'border-warning-yellow/20', text: 'text-warning-yellow' },
  'success-green': { border: 'border-success-green/20', text: 'text-success-green' }
}

function StatCard({ label, value, sub, accent, icon: Icon }) {
  const a = ACCENTS[accent] ?? ACCENTS['nuclear-blue']
  return (
    <Card className={`glass-card ${a.border}`}>
      <CardContent className="pt-6">
        <div className="text-center">
          {Icon && <Icon className={`h-5 w-5 mx-auto mb-2 ${a.text}`} />}
          <div className={`text-3xl font-bold font-outfit ${a.text} mb-1`}>
            {value}
          </div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const data = useQuery(api.dashboard.forCurrentUser)

  if (data === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-nuclear-blue" />
      </div>
    )
  }

  const { total, tierCounts, summary, completion, byTier, byCategory, tier1, lastUpdated } = data

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-outfit text-foreground">
            Data Removal Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Tracking {total} data brokers
            {lastUpdated
              ? ` · Last updated ${format(new Date(lastUpdated), 'MMM d, yyyy')}`
              : ' · No activity yet'}
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Brokers" value={total} sub="In your tracker" accent="nuclear-blue" icon={ShieldCheck} />
          <StatCard label="Not Started" value={summary.notStarted} sub="Pending action" accent="muted-gray" icon={CircleDashed} />
          <StatCard label="Opt-Outs Submitted" value={summary.submitted} sub="Awaiting confirmation" accent="warning-yellow" icon={Clock} />
          <StatCard label="Confirmed Removed" value={summary.removed} sub="Verified clean" accent="success-green" icon={CheckCircle2} />
        </div>

        {/* Overall completion */}
        <Card className="glass-card border-nuclear-blue/20 mb-8">
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Overall Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Confirmed removed</span>
                <span className="font-medium text-success-green">{completion.removedPct}%</span>
              </div>
              <Progress value={completion.removedPct} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Opt-outs submitted</span>
                <span className="font-medium text-warning-yellow">{completion.submittedPct}%</span>
              </div>
              <Progress value={completion.submittedPct} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Not yet started</span>
                <span className="font-medium text-muted-foreground">{completion.notStartedPct}%</span>
              </div>
              <Progress value={completion.notStartedPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Tier counts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((tier) => (
            <Card key={tier} className="glass-card">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold font-outfit text-foreground">{tierCounts[tier] ?? 0}</div>
                <div className="text-sm text-muted-foreground">{TIER_LABEL[tier]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status breakdown by tier */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Status Breakdown by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Not Started</TableHead>
                  <TableHead className="text-right">Searched – Found</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">Removed</TableHead>
                  <TableHead className="text-right">Handled by Service</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byTier.map((row) => (
                  <TableRow key={row.tier}>
                    <TableCell className="font-medium">{TIER_LABEL[row.tier]}</TableCell>
                    <TableCell className="text-right">{row.total}</TableCell>
                    <TableCell className="text-right">{row.notStarted}</TableCell>
                    <TableCell className="text-right">{row.searchedFound}</TableCell>
                    <TableCell className="text-right">{row.submitted}</TableCell>
                    <TableCell className="text-right text-success-green">{row.removed}</TableCell>
                    <TableCell className="text-right">{row.handledByService}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Brokers by category */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Brokers by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Confirmed Removed</TableHead>
                  <TableHead className="text-right">% Complete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">{row.category}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">{row.removed}</TableCell>
                    <TableCell className="text-right">{row.pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tier 1 quick reference */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Tier 1 – Crucial Brokers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broker</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="text-right">Est. Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tier1.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.difficulty ?? '—'}</TableCell>
                    <TableCell className="text-right">{row.estProcessingDays ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.verified ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
