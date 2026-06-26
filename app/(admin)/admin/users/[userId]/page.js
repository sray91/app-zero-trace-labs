'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Loader2, ExternalLink, Plus, Trash2, Pencil, Check, ScanSearch } from 'lucide-react'

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

// Search Log "Data Found?" column.
const FOUND_OPTIONS = [
  { value: 'unchecked', label: 'Not Checked' },
  { value: 'found', label: 'Found' },
  { value: 'not_found', label: 'Not Found' }
]

const TIER_LABEL = { 1: 'T1', 2: 'T2', 3: 'T3' }

const msToDateInput = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '')
const dateInputToMs = (s) => (s ? new Date(s + 'T00:00:00').getTime() : undefined)

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

// Full record editor — exposes every Master Tracker and Search Log column so the
// admin can update any field for the user.
function BrokerEditDialog({ broker, exposure, onSave }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    removalStatus: exposure?.removalStatus ?? 'not_started',
    exposureStatus: exposure?.exposureStatus ?? 'unchecked',
    listingUrl: exposure?.listingUrl ?? '',
    confirmationRef: exposure?.confirmationRef ?? '',
    submittedAt: msToDateInput(exposure?.submittedAt),
    removedAt: msToDateInput(exposure?.removedAt),
    verifiedRemoved: exposure?.verifiedRemoved ?? false,
    recheckAt: msToDateInput(exposure?.recheckAt),
    notes: exposure?.notes ?? '',
    searchedAt: msToDateInput(exposure?.searchedAt),
    searchTerm: exposure?.searchTerm ?? '',
    whatWasFound: exposure?.whatWasFound ?? '',
    screenshotTaken: exposure?.screenshotTaken ?? false,
    actionTaken: exposure?.actionTaken ?? '',
    followUpNeeded: exposure?.followUpNeeded ?? false
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }))

  const handleSave = async () => {
    await onSave({
      removalStatus: form.removalStatus,
      exposureStatus: form.exposureStatus,
      listingUrl: form.listingUrl || undefined,
      confirmationRef: form.confirmationRef || undefined,
      submittedAt: dateInputToMs(form.submittedAt),
      removedAt: dateInputToMs(form.removedAt),
      verifiedRemoved: form.verifiedRemoved,
      recheckAt: dateInputToMs(form.recheckAt),
      notes: form.notes || undefined,
      searchedAt: dateInputToMs(form.searchedAt),
      searchTerm: form.searchTerm || undefined,
      whatWasFound: form.whatWasFound || undefined,
      screenshotTaken: form.screenshotTaken,
      actionTaken: form.actionTaken || undefined,
      followUpNeeded: form.followUpNeeded
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit record">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{broker.name}</DialogTitle>
          <DialogDescription>
            {broker.optOutMethod ?? 'Update this broker record'} · est. {broker.estProcessingDays ?? '—'} days
          </DialogDescription>
        </DialogHeader>

        {broker.instructions && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{broker.instructions}</p>
        )}

        {/* ---- Master Tracker ---- */}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Master Tracker</h4>
        <div className="grid gap-3">
          <div>
            <Label>Status</Label>
            <Select value={form.removalStatus} onValueChange={setVal('removalStatus')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Confirmation # / Ref</Label>
            <Input value={form.confirmationRef} onChange={set('confirmationRef')} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Submitted</Label>
              <Input type="date" value={form.submittedAt} onChange={set('submittedAt')} />
            </div>
            <div>
              <Label>Date Verified</Label>
              <Input type="date" value={form.removedAt} onChange={set('removedAt')} />
            </div>
            <div>
              <Label>Re-check Due</Label>
              <Input type="date" value={form.recheckAt} onChange={set('recheckAt')} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.verifiedRemoved}
              onChange={setBool('verifiedRemoved')}
              className="h-4 w-4 accent-success-green"
            />
            Verified removed
          </label>
        </div>

        {/* ---- Search Log ---- */}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-2">Search Log</h4>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Date Searched</Label>
              <Input type="date" value={form.searchedAt} onChange={set('searchedAt')} />
            </div>
            <div>
              <Label>Data Found?</Label>
              <Select value={form.exposureStatus} onValueChange={setVal('exposureStatus')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOUND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Search Term Used</Label>
            <Input value={form.searchTerm} onChange={set('searchTerm')} placeholder="e.g. Jane A Doe, Austin TX" />
          </div>
          <div>
            <Label>What Was Found</Label>
            <Textarea value={form.whatWasFound} onChange={set('whatWasFound')} rows={2} />
          </div>
          <div>
            <Label>Profile / Listing URL</Label>
            <Input value={form.listingUrl} onChange={set('listingUrl')} placeholder="https://…" />
          </div>
          <div>
            <Label>Action Taken</Label>
            <Input value={form.actionTaken} onChange={set('actionTaken')} placeholder="e.g. Submitted opt-out form" />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.screenshotTaken}
                onChange={setBool('screenshotTaken')}
                className="h-4 w-4 accent-nuclear-blue"
              />
              Screenshot taken
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.followUpNeeded}
                onChange={setBool('followUpNeeded')}
                className="h-4 w-4 accent-warning-yellow"
              />
              Follow-up needed
            </label>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={set('notes')} rows={3} />
          </div>
        </div>

        <DialogFooter>
          {broker.optOutUrl && broker.optOutUrl.startsWith('http') && (
            <Button variant="outline" asChild className="mr-auto">
              <a href={broker.optOutUrl} target="_blank" rel="noreferrer">
                Opt-out page <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
            <div>
              <Label>First name</Label>
              <Input value={form.firstName} onChange={set('firstName')} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Date of birth</Label>
              <Input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phoneNumber} onChange={set('phoneNumber')} />
            </div>
          </div>
          <div>
            <Label>Address line 1</Label>
            <Input value={form.addressLine1} onChange={set('addressLine1')} />
          </div>
          <div>
            <Label>Address line 2</Label>
            <Input value={form.addressLine2} onChange={set('addressLine2')} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={set('city')} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={set('state')} />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input value={form.zipCode} onChange={set('zipCode')} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Runs the Apify baseline scan for this user. Writes searchHistory +
// brokerExposures, so the Search Log / Master Tracker tables update reactively.
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
      <Button variant="outline" size="sm" onClick={run} disabled={running}>
        {running ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <ScanSearch className="h-4 w-4 mr-1" />
        )}
        {running ? 'Scanning…' : 'Run baseline scan'}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground text-right max-w-xs">
          {result.found
            ? `Found ${result.recordCount} record(s) across ${result.brokersUpdated} brokers — ${result.categories.join(', ')}`
            : `No records found · ${result.brokersUpdated} brokers marked searched`}
        </p>
      )}
      {error && <p className="text-xs text-destructive text-right max-w-xs">{error}</p>}
    </div>
  )
}

function TasksPanel({ userId, tasks }) {
  const createTask = useMutation(api.admin.createTask)
  const updateTask = useMutation(api.admin.updateTask)
  const deleteTask = useMutation(api.admin.deleteTask)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const add = async () => {
    if (!title.trim()) return
    await createTask({ userId, title: title.trim(), priority })
    setTitle('')
    setPriority('medium')
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-outfit text-lg">Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={add}><Plus className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
          {tasks.map((t) => (
            <div key={t._id} className="flex items-center gap-3 rounded-lg border border-border p-2">
              <input
                type="checkbox"
                checked={t.status === 'done'}
                onChange={(e) =>
                  updateTask({ taskId: t._id, status: e.target.checked ? 'done' : 'open' })
                }
                className="h-4 w-4 accent-success-green"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {t.title}
                </div>
                {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
              </div>
              {t.priority && (
                <Badge variant={t.priority === 'high' ? 'destructive' : 'secondary'}>{t.priority}</Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => deleteTask({ taskId: t._id })} title="Delete">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MasterTrackerTable({ userId, records, setExposure }) {
  const quickStatusChange = (broker, exposure) => (value) =>
    setExposure({ userId, dataSourceId: broker._id, ...patchForStatus(value, exposure) })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Tier</TableHead>
          <TableHead>Broker</TableHead>
          <TableHead className="w-56">Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="w-16">Verified</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map(({ broker, exposure }) => (
          <TableRow key={broker._id}>
            <TableCell><Badge variant="outline">{TIER_LABEL[broker.tier ?? 3]}</Badge></TableCell>
            <TableCell>
              <div className="font-medium text-foreground">{broker.name}</div>
              <div className="text-xs text-muted-foreground">{broker.category}</div>
            </TableCell>
            <TableCell>
              <Select
                value={exposure?.removalStatus ?? 'not_started'}
                onValueChange={quickStatusChange(broker, exposure)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {exposure?.submittedAt ? msToDateInput(exposure.submittedAt) : '—'}
            </TableCell>
            <TableCell>
              {exposure?.verifiedRemoved ? (
                <Check className="h-4 w-4 text-success-green" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <BrokerEditDialog
                broker={broker}
                exposure={exposure}
                onSave={(patch) => setExposure({ userId, dataSourceId: broker._id, ...patch })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SearchLogTable({ userId, records, setExposure }) {
  const quickFoundChange = (broker, exposure) => (value) => {
    const patch = { exposureStatus: value }
    if (value !== 'unchecked' && !exposure?.searchedAt) patch.searchedAt = Date.now()
    if (value === 'found') patch.foundAt = exposure?.foundAt ?? Date.now()
    setExposure({ userId, dataSourceId: broker._id, ...patch })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Tier</TableHead>
          <TableHead>Broker</TableHead>
          <TableHead>Searched</TableHead>
          <TableHead className="w-40">Data Found?</TableHead>
          <TableHead>Profile URL</TableHead>
          <TableHead className="w-16">Follow-up</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map(({ broker, exposure }) => (
          <TableRow key={broker._id}>
            <TableCell><Badge variant="outline">{TIER_LABEL[broker.tier ?? 3]}</Badge></TableCell>
            <TableCell>
              <div className="font-medium text-foreground">{broker.name}</div>
              <div className="text-xs text-muted-foreground">{broker.category}</div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {exposure?.searchedAt ? msToDateInput(exposure.searchedAt) : '—'}
            </TableCell>
            <TableCell>
              <Select
                value={exposure?.exposureStatus ?? 'unchecked'}
                onValueChange={quickFoundChange(broker, exposure)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOUND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="max-w-[180px] truncate">
              {exposure?.listingUrl ? (
                <a href={exposure.listingUrl} target="_blank" rel="noreferrer" className="text-nuclear-blue inline-flex items-center text-sm">
                  Link <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {exposure?.followUpNeeded ? (
                <Badge variant="secondary">Yes</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <BrokerEditDialog
                broker={broker}
                exposure={exposure}
                onSave={(patch) => setExposure({ userId, dataSourceId: broker._id, ...patch })}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function UserDetailPage() {
  const { userId } = useParams()
  const detail = useQuery(api.admin.getUserDetail, { userId })
  const setExposure = useMutation(api.admin.setExposure)

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

  const { user, profile, records, tasks } = detail
  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || user.name || user.email

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Profile header */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-outfit text-foreground">{displayName}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-sm text-muted-foreground space-y-0.5 text-right">
                {profile?.phoneNumber && <div>{profile.phoneNumber}</div>}
                {(profile?.addressLine1 || profile?.city || profile?.state) && (
                  <div>
                    {[profile.addressLine1, profile.city, profile.state, profile.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {profile?.dateOfBirth && <div>DOB: {profile.dateOfBirth}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <ProfileEditDialog userId={userId} user={user} profile={profile} />
                <BaselineScanButton userId={userId} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tracker">
        <TabsList>
          <TabsTrigger value="tracker">Master Tracker</TabsTrigger>
          <TabsTrigger value="searchlog">Search Log</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Master Tracker ({records.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MasterTrackerTable userId={userId} records={records} setExposure={setExposure} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="searchlog">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-outfit text-lg">Search Log ({records.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SearchLogTable userId={userId} records={records} setExposure={setExposure} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <TasksPanel userId={userId} tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
