'use client'

import { useQuery } from 'convex/react'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

// Brand hex values (recharts fills can't read Tailwind classes / CSS vars reliably).
const C = { blue: '#0044FF', yellow: '#FFD60A', green: '#00FF88', gray: '#A3B0C2' }

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

// The five cumulative funnel stages, painted as proportional bars.
const FUNNEL_STAGES = [
  { key: 'total', label: 'Total brokers', bar: 'bg-muted-foreground/40', text: 'text-foreground' },
  { key: 'searched', label: 'Searched', bar: 'bg-nuclear-blue', text: 'text-nuclear-blue' },
  { key: 'found', label: 'Found exposed', bar: 'bg-warning-yellow', text: 'text-warning-yellow' },
  { key: 'submitted', label: 'Opt-out submitted', bar: 'bg-nuclear-blue', text: 'text-nuclear-blue' },
  { key: 'removed', label: 'Verified removed', bar: 'bg-success-green', text: 'text-success-green' }
]

// Mutually-exclusive slices carved from the cumulative funnel so every broker lands
// in exactly one bucket and the slices sum to the total.
function donutSlices(funnel) {
  return [
    { name: 'Verified removed', value: funnel.removed, fill: C.green },
    { name: 'Submitted · awaiting', value: funnel.submitted - funnel.removed, fill: C.blue },
    { name: 'Found · needs opt-out', value: funnel.found - funnel.submitted, fill: C.yellow },
    { name: 'Searched · clean', value: funnel.searched - funnel.found, fill: C.gray },
    { name: 'Not started', value: funnel.total - funnel.searched, fill: 'rgba(163,176,194,0.18)' }
  ].filter((s) => s.value > 0)
}

function FunnelDonut({ funnel }) {
  const slices = donutSlices(funnel)
  const pct = funnel.total ? Math.round((funnel.removed / funnel.total) * 100) : 0
  return (
    <div className="relative h-48 w-48 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            startAngle={90}
            endAngle={-270}
            paddingAngle={slices.length > 1 ? 2 : 0}
            stroke="none"
            isAnimationActive={false}
          >
            {slices.map((s) => (
              <Cell key={s.name} fill={s.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-outfit text-3xl font-bold text-success-green leading-none">{pct}%</span>
        <span className="text-xs text-muted-foreground mt-1">removed</span>
      </div>
    </div>
  )
}

function RemovalFunnel({ funnel }) {
  const total = funnel.total || 1
  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row">
      <FunnelDonut funnel={funnel} />
      <div className="w-full flex-1 space-y-2">
        {FUNNEL_STAGES.map((s, i) => {
          const n = funnel[s.key]
          const pct = Math.round((n / total) * 100)
          const prevN = i === 0 ? n : funnel[FUNNEL_STAGES[i - 1].key]
          const conv = i === 0 ? null : prevN === 0 ? 0 : Math.round((n / prevN) * 100)
          return (
            <div key={s.key}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="flex items-baseline gap-2 text-sm font-medium text-foreground">
                  {s.label}
                  {conv !== null && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {conv}% of previous
                    </span>
                  )}
                </span>
                <span className={`text-sm font-semibold ${s.text}`}>
                  {n}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">{pct}%</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className={`h-full rounded-full ${s.bar} transition-all`}
                  style={{ width: `${n > 0 ? Math.max(pct, 2) : 0}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
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

  const { total, tierCounts, funnel, summary, byTier, byCategory, tier1, lastUpdated } = data

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

        {/* Removal funnel — the visual centerpiece */}
        <Card className="glass-card border-nuclear-blue/20 mb-8">
          <CardHeader>
            <CardTitle className="font-outfit text-lg">Removal Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <RemovalFunnel funnel={funnel} />
          </CardContent>
        </Card>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Brokers" value={total} sub="In your tracker" accent="nuclear-blue" icon={ShieldCheck} />
          <StatCard label="Not Started" value={summary.notStarted} sub="Pending search" accent="muted-gray" icon={CircleDashed} />
          <StatCard label="Opt-Outs Submitted" value={summary.submittedAwaiting} sub="Awaiting confirmation" accent="warning-yellow" icon={Clock} />
          <StatCard label="Confirmed Removed" value={summary.removed} sub="Verified clean" accent="success-green" icon={CheckCircle2} />
        </div>

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
            <CardTitle className="font-outfit text-lg">Progress by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Not Started</TableHead>
                  <TableHead className="text-right">Searched</TableHead>
                  <TableHead className="text-right">Found</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">Removed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byTier.map((row) => (
                  <TableRow key={row.tier}>
                    <TableCell className="font-medium">{TIER_LABEL[row.tier]}</TableCell>
                    <TableCell className="text-right">{row.total}</TableCell>
                    <TableCell className="text-right">{row.notStarted}</TableCell>
                    <TableCell className="text-right">{row.searched}</TableCell>
                    <TableCell className="text-right">{row.found}</TableCell>
                    <TableCell className="text-right">{row.submitted}</TableCell>
                    <TableCell className="text-right text-success-green">{row.removed}</TableCell>
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
