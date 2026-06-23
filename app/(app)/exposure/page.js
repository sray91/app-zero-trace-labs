'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  ListChecks,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useExposureTracker } from '@/lib/hooks/useExposureTracker'
import {
  REMOVAL_CHECKLIST_STEPS,
  EXPOSURE_STATUSES,
  REMOVAL_STATUSES
} from '@/lib/removal-checklist'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'found', label: 'Found Me' },
  { id: 'active', label: 'In Progress' },
  { id: 'removed', label: 'Removed' },
  { id: 'unchecked', label: 'Unchecked' }
]

const SignInNotice = () => (
  <Card className="glass-card">
    <CardContent className="py-10 text-center space-y-4">
      <ListChecks className="h-12 w-12 text-nuclear-blue mx-auto" />
      <h2 className="text-2xl font-bold font-outfit text-foreground">Sign In Required</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Sign in to track which data brokers list your information and work through removals.
      </p>
      <Button
        className="btn-nuclear mx-auto"
        onClick={() => window.dispatchEvent(new CustomEvent('openAuthDialog'))}
      >
        Sign In
      </Button>
    </CardContent>
  </Card>
)

function StatCard({ value, label, cardClass, valueClass }) {
  return (
    <Card className={`glass-card ${cardClass}`}>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className={`text-3xl font-bold font-outfit mb-2 ${valueClass}`}>{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function BrokerCard({ source, exposure, onExposureStatus, onRemovalStatus, onToggleStep, onSaveFields }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState(exposure?.notes || '')
  const [listingUrl, setListingUrl] = useState(exposure?.listing_url || '')
  const [saving, setSaving] = useState(false)

  const exposureStatus = exposure?.exposure_status || 'unchecked'
  const removalStatus = exposure?.removal_status || 'not_started'
  const checklist = exposure?.checklist || {}
  const stepsDone = REMOVAL_CHECKLIST_STEPS.filter((s) => checklist[s.id]).length

  const handleSaveDetails = async () => {
    setSaving(true)
    await onSaveFields(source.id, { notes, listing_url: listingUrl })
    setSaving(false)
  }

  const riskVariant =
    source.risk_level === 'high' ? 'destructive' : source.risk_level === 'medium' ? 'default' : 'secondary'

  return (
    <Card className="glass-card border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="font-outfit text-lg">{source.name}</CardTitle>
            <Badge variant={riskVariant} className="capitalize">{source.risk_level} risk</Badge>
            <Badge variant={EXPOSURE_STATUSES[exposureStatus].badgeVariant}>
              {EXPOSURE_STATUSES[exposureStatus].label}
            </Badge>
            {exposureStatus === 'found' && (
              <Badge variant={REMOVAL_STATUSES[removalStatus].badgeVariant}>
                {REMOVAL_STATUSES[removalStatus].label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {source.opt_out_url && (
              <Button asChild variant="outline" size="sm">
                <a href={source.opt_out_url} target="_blank" rel="noopener noreferrer">
                  Opt-Out Page
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                Visit Site
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
          </div>
        </div>
        <CardDescription>{source.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Listed on this site?</span>
            <Select value={exposureStatus} onValueChange={(v) => onExposureStatus(source.id, v)}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPOSURE_STATUSES).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {exposureStatus === 'found' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Removal status</span>
              <Select value={removalStatus} onValueChange={(v) => onRemovalStatus(source.id, v)}>
                <SelectTrigger className="w-44 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REMOVAL_STATUSES).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>{meta.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {exposure?.recheck_at && (
            <span className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Recheck {new Date(exposure.recheck_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {exposureStatus === 'found' && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>
                  Removal Checklist ({stepsDone}/{REMOVAL_CHECKLIST_STEPS.length})
                </span>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              <div className="space-y-3">
                {REMOVAL_CHECKLIST_STEPS.map((step) => (
                  <label
                    key={step.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-nuclear-blue/5 cursor-pointer"
                  >
                    <Checkbox
                      checked={!!checklist[step.id]}
                      onCheckedChange={() => onToggleStep(source.id, step.id)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className={`block text-sm font-medium ${checklist[step.id] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {step.label}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Listing URL
                  </label>
                  <input
                    type="url"
                    value={listingUrl}
                    onChange={(e) => setListingUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Notes / confirmation number
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opt-out confirmation #, dates, follow-ups..."
                    rows={2}
                  />
                </div>
              </div>
              <Button size="sm" onClick={handleSaveDetails} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save Details
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

export default function ExposurePage() {
  const { user, loading: authLoading } = useAuth()
  const {
    dataSources,
    exposures,
    stats,
    loading,
    error,
    reload,
    saveExposure,
    setExposureStatus,
    setRemovalStatus,
    toggleChecklistStep
  } = useExposureTracker()
  const [filter, setFilter] = useState('all')

  const filteredSources = useMemo(() => {
    return dataSources.filter((source) => {
      const exposure = exposures[source.id]
      const exposureStatus = exposure?.exposure_status || 'unchecked'
      const removalStatus = exposure?.removal_status || 'not_started'
      switch (filter) {
        case 'found':
          return exposureStatus === 'found'
        case 'active':
          return exposureStatus === 'found' && ['in_progress', 'submitted'].includes(removalStatus)
        case 'removed':
          return removalStatus === 'removed'
        case 'unchecked':
          return exposureStatus === 'unchecked'
        default:
          return true
      }
    })
  }, [dataSources, exposures, filter])

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-nuclear-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-foreground mb-2 flex items-center">
              <ListChecks className="h-8 w-8 mr-3 text-nuclear-blue" />
              Exposure Tracker
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Track which data brokers list your information and work through the removal checklist for each one.
            </p>
          </div>
          {user && (
            <Button variant="outline" size="sm" onClick={reload}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        {!user && <SignInNotice />}

        {user && (
          <>
            {error && (
              <Alert className="mb-6 border-error-red/30 bg-error-red/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}. If the table is missing, run <code>scripts/create-broker-exposures.sql</code> in the Supabase SQL editor.
                </AlertDescription>
              </Alert>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                value={`${stats.checkedCount}/${stats.totalBrokers}`}
                label="Brokers Checked"
                cardClass="border-nuclear-blue/20"
                valueClass="text-nuclear-blue"
              />
              <StatCard
                value={stats.foundCount}
                label="Found Me"
                cardClass="border-error-red/20"
                valueClass="text-error-red"
              />
              <StatCard
                value={stats.inProgressCount}
                label="Removals In Progress"
                cardClass="border-warning-yellow/20"
                valueClass="text-warning-yellow"
              />
              <StatCard
                value={stats.removedCount}
                label="Confirmed Removed"
                cardClass="border-success-green/20"
                valueClass="text-success-green"
              />
            </div>

            {/* Overall progress */}
            {stats.foundCount > 0 && (
              <Card className="glass-card mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground flex items-center">
                      {stats.removalPercent === 100 ? (
                        <ShieldCheck className="h-4 w-4 mr-2 text-success-green" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 mr-2 text-warning-yellow" />
                      )}
                      Removal Progress
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.removedCount} of {stats.foundCount} removed ({stats.removalPercent}%)
                    </span>
                  </div>
                  <Progress value={stats.removalPercent} />
                </CardContent>
              </Card>
            )}

            {/* Recheck reminders */}
            {stats.recheckDue.length > 0 && (
              <Alert className="mb-6 border-warning-yellow/30 bg-warning-yellow/10">
                <Clock className="h-4 w-4 text-warning-yellow" />
                <AlertDescription className="text-foreground">
                  <strong>{stats.recheckDue.length} broker{stats.recheckDue.length > 1 ? 's are' : ' is'} due for a recheck.</strong>{' '}
                  Removed listings often reappear — re-search those sites and update their status.
                </AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTERS.map((f) => (
                <Button
                  key={f.id}
                  variant={filter === f.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Broker list */}
            {filteredSources.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-10 text-center text-muted-foreground">
                  {dataSources.length === 0
                    ? 'No data brokers loaded. Seed the data_sources table (scripts/insert-comprehensive-brokers.sql) to get started.'
                    : 'No brokers match this filter.'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSources.map((source) => (
                  <BrokerCard
                    key={source.id}
                    source={source}
                    exposure={exposures[source.id]}
                    onExposureStatus={setExposureStatus}
                    onRemovalStatus={setRemovalStatus}
                    onToggleStep={toggleChecklistStep}
                    onSaveFields={saveExposure}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
