'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  Search,
  ScanSearch,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  Inbox
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'searched_not_found', label: 'Searched – Not Found' },
  { value: 'searched_found', label: 'Searched – Found' },
  { value: 'submitted', label: 'Opt-Out Submitted' },
  { value: 'removed', label: 'Removal Confirmed' },
  { value: 'reappeared', label: 'Re-appeared' },
  { value: 'handled_by_service', label: 'Handled by Service' },
  { value: 'skipped', label: 'Skipped / N/A' }
]

const FOUND_OPTIONS = [
  { value: 'unchecked', label: 'Not Checked' },
  { value: 'found', label: 'Found' },
  { value: 'not_found', label: 'Not Found' }
]

const TIER_LABEL = { 1: 'T1', 2: 'T2', 3: 'T3' }

// status -> how far along the 4-step pipeline (Search · Find · Submit · Verify)
// and what tone to paint the stepper / status pill with.
const STATUS_META = {
  not_started: { label: 'Not started', reached: 0, tone: 'neutral' },
  searched_not_found: { label: 'Clean', reached: 1, tone: 'good' },
  searched_found: { label: 'Found', reached: 2, tone: 'warn' },
  submitted: { label: 'Submitted', reached: 3, tone: 'active' },
  removed: { label: 'Removed', reached: 4, tone: 'good' },
  reappeared: { label: 'Reappeared', reached: 2, tone: 'bad' },
  handled_by_service: { label: 'Handled', reached: 4, tone: 'good' },
  skipped: { label: 'Skipped', reached: 0, tone: 'muted' }
}

const TONE_TEXT = {
  neutral: 'text-muted-foreground',
  muted: 'text-muted-foreground',
  good: 'text-success-green',
  warn: 'text-warning-yellow',
  active: 'text-nuclear-blue',
  bad: 'text-destructive'
}
const TONE_DOT = {
  neutral: 'bg-muted-foreground/40',
  muted: 'bg-muted-foreground/40',
  good: 'bg-success-green',
  warn: 'bg-warning-yellow',
  active: 'bg-nuclear-blue',
  bad: 'bg-destructive'
}

const DAY = 86400000
const PROFILE_REQUIRED = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'addressLine1',
  'city',
  'state',
  'zipCode'
]

const msToDateInput = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '')
const dateInputToMs = (s) => (s ? new Date(s + 'T00:00:00').getTime() : undefined)

const relTime = (ms) => {
  if (!ms) return null
  const diff = Date.now() - ms
  if (diff < DAY) return 'today'
  const days = Math.floor(diff / DAY)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const lastActivity = (e) =>
  Math.max(0, e?.searchedAt ?? 0, e?.submittedAt ?? 0, e?.removedAt ?? 0, e?.foundAt ?? 0) || null

const isRecheckDue = (e) =>
  !!e?.recheckAt && e.recheckAt <= Date.now() + 7 * DAY

function patchForStatus(status, exposure) {
  const patch = { removalStatus: status }
  const now = Date.now()
  if (status === 'submitted' && !exposure?.submittedAt) patch.submittedAt = now
  if (status === 'removed' && !exposure?.removedAt) {
    patch.removedAt = now
    patch.verifiedRemoved = true
  }
  return patch
}

// ---- Autosaving field primitives (no save button; commit on blur/change) ----

function AutoText({ value, placeholder, onCommit }) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => setV(value ?? ''), [value])
  const commit = () => {
    const next = v.trim() === '' ? undefined : v.trim()
    if ((value ?? undefined) !== next) onCommit(next)
  }
  return (
    <Input
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )
}

function AutoArea({ value, placeholder, rows = 2, onCommit }) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => setV(value ?? ''), [value])
  const commit = () => {
    const next = v.trim() === '' ? undefined : v.trim()
    if ((value ?? undefined) !== next) onCommit(next)
  }
  return (
    <Textarea
      value={v}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
    />
  )
}

function AutoDate({ valueMs, onCommit }) {
  return (
    <Input
      type="date"
      value={msToDateInput(valueMs)}
      onChange={(e) => onCommit(dateInputToMs(e.target.value))}
    />
  )
}

function AutoCheck({ checked, label, accent = 'accent-nuclear-blue', onCommit }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onCommit(e.target.checked)}
        className={`h-4 w-4 ${accent}`}
      />
      {label}
    </label>
  )
}

// ---- Pipeline stepper: Search · Find · Submit · Verify ----

function StageStepper({ exposure }) {
  const status = exposure?.removalStatus ?? 'not_started'
  const meta = STATUS_META[status] ?? STATUS_META.not_started
  const dot = TONE_DOT[meta.tone]
  return (
    <div
      className="flex items-center"
      title={`Search · Find · Submit · Verify — ${meta.label}`}
    >
      {[0, 1, 2, 3].map((i) => {
        const filled = i < meta.reached
        return (
          <div key={i} className="flex items-center">
            <span
              className={`h-2.5 w-2.5 rounded-full ${filled ? dot : 'bg-muted-foreground/20'}`}
            />
            {i < 3 && (
              <span
                className={`h-0.5 w-4 ${i < meta.reached - 1 ? dot : 'bg-muted-foreground/20'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusPill({ exposure }) {
  const status = exposure?.removalStatus ?? 'not_started'
  const meta = STATUS_META[status] ?? STATUS_META.not_started
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${TONE_TEXT[meta.tone]}`}>
      {meta.tone === 'warn' && <AlertTriangle className="h-3 w-3" />}
      {meta.tone === 'bad' && <RotateCw className="h-3 w-3" />}
      {meta.label}
    </span>
  )
}

// Context-aware single action for the broker's current stage.
function nextAction(broker, exposure) {
  const status = exposure?.removalStatus ?? 'not_started'
  switch (status) {
    case 'not_started':
      return { label: 'Search', href: broker.searchUrl }
    case 'searched_found':
    case 'reappeared':
      return { label: 'Submit opt-out', href: broker.optOutUrl }
    case 'submitted':
      return { label: 'Verify', href: broker.searchUrl }
    case 'searched_not_found':
    case 'removed':
    case 'handled_by_service':
      return isRecheckDue(exposure) ? { label: 'Re-check', href: broker.searchUrl } : null
    default:
      return null
  }
}

// ---- The unified broker row (collapsed spine + inline expanded record) ----

function BrokerRow({
  broker,
  exposure,
  tasks,
  userId,
  setExposure,
  createTask,
  updateTask,
  deleteTask
}) {
  const commit = (patch) => setExposure({ userId, dataSourceId: broker._id, ...patch })
  const action = nextAction(broker, exposure)
  const activity = lastActivity(exposure)
  const [open, setOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')

  const addBrokerTask = async () => {
    if (!taskTitle.trim()) return
    await createTask({
      userId,
      title: taskTitle.trim(),
      relatedDataSourceId: broker._id
    })
    setTaskTitle('')
  }

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/30" onClick={() => setOpen(true)}>
        <TableCell>
          <Badge variant="outline">{TIER_LABEL[broker.tier ?? 3]}</Badge>
        </TableCell>
        <TableCell>
          <div className="font-medium text-foreground">{broker.name}</div>
          <div className="text-xs text-muted-foreground">
            {broker.category}
            {broker.alsoCovers && <span className="opacity-70"> · also {broker.alsoCovers}</span>}
          </div>
        </TableCell>
        <TableCell>
          <StageStepper exposure={exposure} />
        </TableCell>
        <TableCell>
          <StatusPill exposure={exposure} />
          {isRecheckDue(exposure) && (
            <div className="text-[11px] text-warning-yellow">re-check due</div>
          )}
          {exposure?.followUpNeeded && (
            <div className="text-[11px] text-muted-foreground">follow-up</div>
          )}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
          {activity ? relTime(activity) : '—'}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          {action?.href && action.href.startsWith('http') ? (
            <Button variant="outline" size="sm" asChild>
              <a href={action.href} target="_blank" rel="noreferrer">
                {action.label} <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ) : action ? (
            <span className="text-xs text-muted-foreground">{action.label}</span>
          ) : null}
        </TableCell>
        <TableCell>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </TableCell>
      </TableRow>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{TIER_LABEL[broker.tier ?? 3]}</Badge>
              <DialogTitle>{broker.name}</DialogTitle>
            </div>
            <DialogDescription>
              {[broker.category, broker.optOutMethod, broker.estProcessingDays && `est. ${broker.estProcessingDays} days`]
                .filter(Boolean)
                .join(' · ')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <StatusPill exposure={exposure} />
            {action?.href?.startsWith('http') && (
              <Button variant="outline" size="sm" asChild>
                <a href={action.href} target="_blank" rel="noreferrer">
                  {action.label} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>

          {/* Playbook (read-only catalog) */}
          <section className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Playbook
            </h4>
            <dl className="space-y-1 text-sm">
              <RefRow k="Method" v={broker.optOutMethod} />
              <RefRow k="Difficulty" v={broker.difficulty} />
              <RefRow
                k="Est. time"
                v={broker.estProcessingDays ? `${broker.estProcessingDays} days` : undefined}
              />
              <RefRow k="Parent" v={broker.parentCompany} />
              <RefRow k="Also covers" v={broker.alsoCovers} />
            </dl>
            {broker.instructions && (
              <p className="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                {broker.instructions}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {broker.searchUrl?.startsWith('http') && (
                <Button variant="outline" size="sm" asChild>
                  <a href={broker.searchUrl} target="_blank" rel="noreferrer">
                    Search page <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              {broker.optOutUrl?.startsWith('http') && (
                <Button variant="outline" size="sm" asChild>
                  <a href={broker.optOutUrl} target="_blank" rel="noreferrer">
                    Opt-out page <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </section>

          {/* Search log (editable) */}
          <section className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Search log
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date searched">
                <AutoDate valueMs={exposure?.searchedAt} onCommit={(v) => commit({ searchedAt: v })} />
              </Field>
              <Field label="Data found?">
                <Select
                  value={exposure?.exposureStatus ?? 'unchecked'}
                  onValueChange={(v) => {
                    const patch = { exposureStatus: v }
                    if (v !== 'unchecked' && !exposure?.searchedAt) patch.searchedAt = Date.now()
                    if (v === 'found') patch.foundAt = exposure?.foundAt ?? Date.now()
                    commit(patch)
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FOUND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Search term used">
              <AutoText
                value={exposure?.searchTerm}
                placeholder="e.g. Jane A Doe, Austin TX"
                onCommit={(v) => commit({ searchTerm: v })}
              />
            </Field>
            <Field label="What was found">
              <AutoArea value={exposure?.whatWasFound} onCommit={(v) => commit({ whatWasFound: v })} />
            </Field>
            <Field label="Profile / listing URL">
              <AutoText
                value={exposure?.listingUrl}
                placeholder="https://…"
                onCommit={(v) => commit({ listingUrl: v })}
              />
            </Field>
            <AutoCheck
              checked={exposure?.screenshotTaken}
              label="Screenshot taken"
              onCommit={(v) => commit({ screenshotTaken: v })}
            />
          </section>

          {/* Remediation (editable) */}
          <section className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remediation
            </h4>
            <Field label="Status">
              <Select
                value={exposure?.removalStatus ?? 'not_started'}
                onValueChange={(v) => commit(patchForStatus(v, exposure))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Confirmation # / ref">
              <AutoText
                value={exposure?.confirmationRef}
                onCommit={(v) => commit({ confirmationRef: v })}
              />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Submitted">
                <AutoDate valueMs={exposure?.submittedAt} onCommit={(v) => commit({ submittedAt: v })} />
              </Field>
              <Field label="Verified">
                <AutoDate valueMs={exposure?.removedAt} onCommit={(v) => commit({ removedAt: v })} />
              </Field>
              <Field label="Re-check">
                <AutoDate valueMs={exposure?.recheckAt} onCommit={(v) => commit({ recheckAt: v })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4">
              <AutoCheck
                checked={exposure?.verifiedRemoved}
                label="Verified removed"
                accent="accent-success-green"
                onCommit={(v) => commit({ verifiedRemoved: v })}
              />
              <AutoCheck
                checked={exposure?.followUpNeeded}
                label="Follow-up needed"
                accent="accent-warning-yellow"
                onCommit={(v) => commit({ followUpNeeded: v })}
              />
            </div>
            <Field label="Notes">
              <AutoArea value={exposure?.notes} rows={3} onCommit={(v) => commit({ notes: v })} />
            </Field>
          </section>

          {/* Broker-scoped tasks */}
          <section className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tasks for this broker
            </h4>
            <div className="space-y-1">
              {tasks.map((t) => (
                <div key={t._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={t.status === 'done'}
                    onChange={(e) =>
                      updateTask({ taskId: t._id, status: e.target.checked ? 'done' : 'open' })
                    }
                    className="h-4 w-4 accent-success-green"
                  />
                  <span className={t.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                    {t.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-7 w-7"
                    onClick={() => deleteTask({ taskId: t._id })}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a task for this broker…"
                onKeyDown={(e) => e.key === 'Enter' && addBrokerTask()}
                className="h-8"
              />
              <Button size="sm" onClick={addBrokerTask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RefRow({ k, v }) {
  if (!v) return null
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right text-foreground">{v}</dd>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

// ---- Pipeline funnel: counts that double as filters ----

function PipelineFunnel({ counts, filter, setFilter }) {
  const segs = [
    { key: 'all', label: 'Total', n: counts.total },
    { key: 'searched', label: 'Searched', n: counts.searched },
    { key: 'found', label: 'Found', n: counts.found },
    { key: 'submitted', label: 'Submitted', n: counts.submitted },
    { key: 'removed', label: 'Verified', n: counts.removed }
  ]
  return (
    <div className="flex flex-wrap items-center gap-1">
      {segs.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <button
            onClick={() => setFilter(s.key)}
            className={`rounded-lg px-3 py-1.5 text-left transition-colors ${
              filter === s.key ? 'bg-nuclear-blue/15 ring-1 ring-nuclear-blue' : 'hover:bg-muted/50'
            }`}
          >
            <div className="text-lg font-semibold leading-none text-foreground">{s.n}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </button>
          {i < segs.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
        </div>
      ))}
    </div>
  )
}

// ---- Action Queue rail: derived work + manual tasks ----

function ActionQueue({ userId, counts, filter, setFilter, openTasks, brokerNames, createTask, updateTask, deleteTask }) {
  const [title, setTitle] = useState('')
  const add = async () => {
    if (!title.trim()) return
    await createTask({ userId, title: title.trim() })
    setTitle('')
  }

  const alerts = [
    { key: 'reappeared', label: 'Reappeared', n: counts.reappeared, tone: 'bad' },
    { key: 'recheck_due', label: 'Re-checks due', n: counts.recheckDue, tone: 'warn' },
    { key: 'found_unsubmitted', label: 'Found · not submitted', n: counts.foundUnsubmitted, tone: 'warn' },
    { key: 'followup', label: 'Follow-up flagged', n: counts.followUp, tone: 'neutral' }
  ].filter((a) => a.n > 0)

  return (
    <Card className="glass-card lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="font-outfit text-lg">Action queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing needs attention. 🎉</p>
          )}
          {alerts.map((a) => (
            <button
              key={a.key}
              onClick={() => setFilter(filter === a.key ? 'all' : a.key)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                filter === a.key ? 'border-nuclear-blue bg-nuclear-blue/10' : 'border-border hover:bg-muted/40'
              }`}
            >
              <span className={TONE_TEXT[a.tone]}>{a.label}</span>
              <Badge variant={a.tone === 'bad' ? 'destructive' : 'secondary'}>{a.n}</Badge>
            </button>
          ))}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task…"
              onKeyDown={(e) => e.key === 'Enter' && add()}
              className="h-8"
            />
            <Button size="sm" onClick={add}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {openTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No open tasks.</p>
          )}
          {openTasks.map((t) => (
            <div key={t._id} className="flex items-start gap-2 rounded-lg border border-border p-2">
              <input
                type="checkbox"
                checked={t.status === 'done'}
                onChange={(e) =>
                  updateTask({ taskId: t._id, status: e.target.checked ? 'done' : 'open' })
                }
                className="mt-0.5 h-4 w-4 accent-success-green"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{t.title}</div>
                {t.relatedDataSourceId && brokerNames[t.relatedDataSourceId] && (
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {brokerNames[t.relatedDataSourceId]}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => deleteTask({ taskId: t._id })}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Profile editor (PII used to run searches) ----

function ProfileEditDialog({ userId, user, profile }) {
  const updateProfile = useMutation(api.admin.updateUserProfile)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    addressLine1: profile?.addressLine1 ?? '',
    addressLine2: profile?.addressLine2 ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    zipCode: profile?.zipCode ?? ''
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    await updateProfile({
      userId,
      ...Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim() === '' ? undefined : v.trim()])
      )
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1" /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>{user.email} — used to run broker searches.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="First name"><Input value={form.firstName} onChange={set('firstName')} /></Field>
            <Field label="Last name"><Input value={form.lastName} onChange={set('lastName')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date of birth"><Input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></Field>
            <Field label="Phone"><Input value={form.phoneNumber} onChange={set('phoneNumber')} /></Field>
          </div>
          <Field label="Address line 1"><Input value={form.addressLine1} onChange={set('addressLine1')} /></Field>
          <Field label="Address line 2"><Input value={form.addressLine2} onChange={set('addressLine2')} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
            <Field label="State"><Input value={form.state} onChange={set('state')} /></Field>
            <Field label="ZIP"><Input value={form.zipCode} onChange={set('zipCode')} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Promote/revoke admin for this user. Writes Clerk publicMetadata.role (source of
// truth, via /api/admin/set-role) then mirrors it into Convex for instant feedback.
function AdminRoleToggle({ userId, user, isSelf }) {
  const setUserRole = useMutation(api.admin.setUserRole)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isAdmin = user.role === 'admin'

  const apply = async () => {
    const nextRole = isAdmin ? null : 'admin'
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.clerkId, role: nextRole })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update role')
      }
      await setUserRole({ userId, role: nextRole })
      setConfirmOpen(false)
    } catch (e) {
      setError(e.message?.replace(/^.*Error:\s*/, '') ?? 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <ShieldCheck
          className={`h-4 w-4 ${isAdmin ? 'text-warning-yellow' : 'text-muted-foreground'}`}
        />
        <span className="text-sm text-foreground">Admin access</span>
        <Switch
          checked={isAdmin}
          disabled={saving || (isSelf && isAdmin)}
          onCheckedChange={() => setConfirmOpen(true)}
        />
      </div>
      {isSelf && isAdmin && (
        <span className="text-[11px] text-muted-foreground">
          You can&apos;t revoke your own access
        </span>
      )}
      {error && <span className="max-w-xs text-right text-[11px] text-destructive">{error}</span>}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAdmin ? 'Revoke admin access?' : 'Grant admin access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? `${user.email} will lose access to the admin console and every client's records.`
                : `${user.email} will be able to view and edit every client's records and grant admin access to others.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <Button onClick={apply} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {isAdmin ? 'Revoke' : 'Grant admin'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BaselineScanButton({ userId }) {
  const runScan = useAction(api.scanner.runBaselineScan)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const run = async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      setResult(await runScan({ userId }))
    } catch (e) {
      setError(e.message?.replace(/^.*Error:\s*/, '') ?? 'Scan failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={run} disabled={running}>
        {running ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <ScanSearch className="h-4 w-4 mr-1" />
        )}
        {running ? 'Scanning…' : 'Run baseline scan'}
      </Button>
      {result && (
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          {result.found
            ? `Found ${result.recordCount} record(s) across ${result.brokersUpdated} brokers — ${result.categories.join(', ')}`
            : `No records found · ${result.brokersUpdated} brokers marked searched`}
        </p>
      )}
      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  )
}

function ProfileMeter({ profile }) {
  const missing = PROFILE_REQUIRED.filter((k) => !profile?.[k]?.toString().trim())
  const pct = Math.round(((PROFILE_REQUIRED.length - missing.length) / PROFILE_REQUIRED.length) * 100)
  if (missing.length === 0) return null
  return (
    <div className="mt-2 max-w-xs">
      <div className="mb-1 flex items-center gap-2 text-xs text-warning-yellow">
        <AlertTriangle className="h-3.5 w-3.5" />
        Profile {pct}% — missing {missing.join(', ')} (weakens scans)
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  )
}

// Proxy address the admin pastes into broker opt-out forms. Generated lazily for
// users who pre-date the feature.
function ProxyEmailRow({ userId, proxyEmail }) {
  const ensure = useMutation(api.users.ensureProxyEmail)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const copy = async () => {
    if (!proxyEmail) return
    await navigator.clipboard.writeText(proxyEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!proxyEmail) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" />
        <span>No opt-out email yet.</span>
        <Button
          variant="outline"
          size="sm"
          className="h-6"
          disabled={generating}
          onClick={async () => {
            setGenerating(true)
            try {
              await ensure({ userId })
            } finally {
              setGenerating(false)
            }
          }}
        >
          {generating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Generate
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
      <code className="rounded bg-muted/60 px-2 py-0.5 text-xs text-foreground">
        {proxyEmail}
      </code>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy} title="Copy">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success-green" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
      <span className="text-[11px] text-muted-foreground">
        use in broker opt-out forms
      </span>
    </div>
  )
}

// Verification emails that arrived at the user's proxy address.
function InboxPanel({ userId, brokerNames }) {
  const messages = useQuery(api.inbox.listForUser, { userId })
  const markRead = useMutation(api.inbox.markRead)

  if (messages === undefined) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">Opt-out inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const unread = messages.filter((m) => !m.isRead).length

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-outfit text-lg">
          Opt-out inbox
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {messages.length} message{messages.length === 1 ? '' : 's'}
            {unread > 0 && <span className="text-nuclear-blue"> · {unread} unread</span>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Inbox className="h-4 w-4" />
            No verification emails yet. Paste the opt-out email into broker forms;
            confirmations will appear here.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m._id}
            className={`rounded-lg border p-3 ${
              m.isRead ? 'border-border' : 'border-nuclear-blue/50 bg-nuclear-blue/5'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!m.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-nuclear-blue" />}
                  <span className="truncate text-sm font-medium text-foreground">
                    {m.subject || '(no subject)'}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {m.fromAddress}
                  {m.dataSourceId && brokerNames[m.dataSourceId] && (
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {brokerNames[m.dataSourceId]}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                  {relTime(m.receivedAt)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => markRead({ messageId: m._id, isRead: !m.isRead })}
                >
                  {m.isRead ? 'Mark unread' : 'Mark read'}
                </Button>
              </div>
            </div>

            {m.text && (
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                {m.text}
              </p>
            )}

            {m.extractedLinks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.extractedLinks.map((href, i) => (
                  <Button
                    key={href}
                    variant={i === 0 ? 'default' : 'outline'}
                    size="sm"
                    className="h-7"
                    asChild
                    onClick={() => !m.isRead && markRead({ messageId: m._id, isRead: true })}
                  >
                    <a href={href} target="_blank" rel="noreferrer">
                      {i === 0 ? 'Open verification link' : 'Link'}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function UserDetailPage() {
  const { userId } = useParams()
  const detail = useQuery(api.admin.getUserDetail, { userId })
  const me = useQuery(api.users.current)
  const setExposure = useMutation(api.admin.setExposure)
  const createTask = useMutation(api.admin.createTask)
  const updateTask = useMutation(api.admin.updateTask)
  const deleteTask = useMutation(api.admin.deleteTask)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const records = detail?.records ?? []

  const counts = useMemo(() => {
    const c = {
      total: records.length,
      searched: 0,
      found: 0,
      submitted: 0,
      removed: 0,
      reappeared: 0,
      recheckDue: 0,
      foundUnsubmitted: 0,
      followUp: 0
    }
    for (const { exposure } of records) {
      const s = exposure?.removalStatus ?? 'not_started'
      if (s !== 'not_started' && s !== 'skipped') c.searched++
      if (['searched_found', 'submitted', 'removed', 'reappeared'].includes(s)) c.found++
      if (['submitted', 'removed'].includes(s)) c.submitted++
      if (s === 'removed' || exposure?.verifiedRemoved) c.removed++
      if (s === 'reappeared') c.reappeared++
      if (s === 'searched_found') c.foundUnsubmitted++
      if (isRecheckDue(exposure)) c.recheckDue++
      if (exposure?.followUpNeeded) c.followUp++
    }
    return c
  }, [records])

  const matchesFilter = (exposure) => {
    const s = exposure?.removalStatus ?? 'not_started'
    switch (filter) {
      case 'all': return true
      case 'searched': return s !== 'not_started' && s !== 'skipped'
      case 'found': return ['searched_found', 'submitted', 'removed', 'reappeared'].includes(s)
      case 'submitted': return ['submitted', 'removed'].includes(s)
      case 'removed': return s === 'removed' || !!exposure?.verifiedRemoved
      case 'reappeared': return s === 'reappeared'
      case 'recheck_due': return isRecheckDue(exposure)
      case 'found_unsubmitted': return s === 'searched_found'
      case 'followup': return !!exposure?.followUpNeeded
      default: return true
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return records
      .filter(({ broker, exposure }) => {
        if (!matchesFilter(exposure)) return false
        if (!q) return true
        return (
          broker.name.toLowerCase().includes(q) ||
          (broker.category ?? '').toLowerCase().includes(q)
        )
      })
      // needs-attention floats to the top, then tier, then name
      .sort((a, b) => {
        const att = (r) => {
          const s = r.exposure?.removalStatus
          if (s === 'reappeared') return 0
          if (isRecheckDue(r.exposure)) return 1
          if (s === 'searched_found') return 2
          if (r.exposure?.followUpNeeded) return 3
          return 9
        }
        const d = att(a) - att(b)
        if (d !== 0) return d
        const t = (a.broker.tier ?? 3) - (b.broker.tier ?? 3)
        return t !== 0 ? t : a.broker.name.localeCompare(b.broker.name)
      })
  }, [records, query, filter])

  const tasksByBroker = useMemo(() => {
    const m = {}
    for (const t of detail?.tasks ?? []) {
      if (t.relatedDataSourceId) (m[t.relatedDataSourceId] ??= []).push(t)
    }
    return m
  }, [detail])

  const brokerNames = useMemo(() => {
    const m = {}
    for (const { broker } of records) m[broker._id] = broker.name
    return m
  }, [records])

  const openTasks = (detail?.tasks ?? []).filter((t) => t.status !== 'done')

  if (detail === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-warning-yellow" />
      </div>
    )
  }
  if (detail === null) {
    return <div className="container mx-auto px-4 py-8">User not found.</div>
  }

  const { user, profile } = detail
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user.name || user.email

  return (
    <div className="container mx-auto max-w-[1400px] space-y-6 px-4 py-8">
      {/* Command bar */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-outfit text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1 text-sm text-muted-foreground">
                {[profile?.addressLine1, profile?.city, profile?.state, profile?.zipCode]
                  .filter(Boolean)
                  .join(', ')}
                {profile?.dateOfBirth && <span> · DOB {profile.dateOfBirth}</span>}
                {profile?.phoneNumber && <span> · {profile.phoneNumber}</span>}
              </div>
              <ProfileMeter profile={profile} />
              <ProxyEmailRow userId={userId} proxyEmail={user.proxyEmail} />
            </div>
            <div className="flex flex-col items-end gap-2">
              <AdminRoleToggle userId={userId} user={user} isSelf={me?._id === user._id} />
              <ProfileEditDialog userId={userId} user={user} profile={profile} />
              <BaselineScanButton userId={userId} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main: funnel + filter + unified tracker */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="glass-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <PipelineFunnel counts={counts} filter={filter} setFilter={setFilter} />
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter brokers…"
                  className="w-56 pl-8"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-outfit text-lg">
                Master tracker
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {visible.length} of {records.length}
                </span>
              </CardTitle>
              {filter !== 'all' && (
                <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                  Clear filter
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Tier</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead className="w-32">Stage</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-20">Activity</TableHead>
                    <TableHead className="w-36">Next</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map(({ broker, exposure }) => (
                    <BrokerRow
                      key={broker._id}
                      broker={broker}
                      exposure={exposure}
                      tasks={tasksByBroker[broker._id] ?? []}
                      userId={userId}
                      setExposure={setExposure}
                      createTask={createTask}
                      updateTask={updateTask}
                      deleteTask={deleteTask}
                    />
                  ))}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        No brokers match this filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Rail: opt-out inbox + action queue */}
        <div className="space-y-6 lg:col-span-1">
          <InboxPanel userId={userId} brokerNames={brokerNames} />
          <ActionQueue
            userId={userId}
            counts={counts}
            filter={filter}
            setFilter={setFilter}
            openTasks={openTasks}
            brokerNames={brokerNames}
            createTask={createTask}
            updateTask={updateTask}
            deleteTask={deleteTask}
          />
        </div>
      </div>
    </div>
  )
}
