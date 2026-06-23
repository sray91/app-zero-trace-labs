'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Loader2, ExternalLink, Plus, Trash2, Pencil } from 'lucide-react'

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

const TIER_LABEL = { 1: 'T1', 2: 'T2', 3: 'T3' }

const msToDateInput = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '')
const dateInputToMs = (s) => (s ? new Date(s + 'T00:00:00').getTime() : undefined)

function patchForStatus(status, exposure) {
  const patch = { removalStatus: status }
  const now = Date.now()
  if (status === 'submitted' && !exposure?.submittedAt) patch.submittedAt = now
  if (status === 'removed' && !exposure?.removedAt) patch.removedAt = now
  return patch
}

function BrokerEditDialog({ broker, exposure, onSave }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    removalStatus: exposure?.removalStatus ?? 'not_started',
    listingUrl: exposure?.listingUrl ?? '',
    confirmationRef: exposure?.confirmationRef ?? '',
    submittedAt: msToDateInput(exposure?.submittedAt),
    removedAt: msToDateInput(exposure?.removedAt),
    recheckAt: msToDateInput(exposure?.recheckAt),
    notes: exposure?.notes ?? ''
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    await onSave({
      removalStatus: form.removalStatus,
      listingUrl: form.listingUrl || undefined,
      confirmationRef: form.confirmationRef || undefined,
      submittedAt: dateInputToMs(form.submittedAt),
      removedAt: dateInputToMs(form.removedAt),
      recheckAt: dateInputToMs(form.recheckAt),
      notes: form.notes || undefined
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{broker.name}</DialogTitle>
          <DialogDescription>
            {broker.optOutMethod ?? 'Update this broker record'} · est. {broker.estProcessingDays ?? '—'} days
          </DialogDescription>
        </DialogHeader>

        {broker.instructions && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{broker.instructions}</p>
        )}

        <div className="grid gap-3">
          <div>
            <Label>Status</Label>
            <Select value={form.removalStatus} onValueChange={(v) => setForm((f) => ({ ...f, removalStatus: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Listing / Profile URL</Label>
            <Input value={form.listingUrl} onChange={set('listingUrl')} placeholder="https://…" />
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
              <Label>Removed</Label>
              <Input type="date" value={form.removedAt} onChange={set('removedAt')} />
            </div>
            <div>
              <Label>Re-check</Label>
              <Input type="date" value={form.recheckAt} onChange={set('recheckAt')} />
            </div>
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

  const quickStatusChange = (broker, exposure) => (value) =>
    setExposure({ userId, dataSourceId: broker._id, ...patchForStatus(value, exposure) })

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
            <div className="text-sm text-muted-foreground space-y-0.5 text-right">
              {profile?.phoneNumber && <div>{profile.phoneNumber}</div>}
              {(profile?.city || profile?.state) && (
                <div>{[profile.city, profile.state, profile.zipCode].filter(Boolean).join(', ')}</div>
              )}
              {profile?.dateOfBirth && <div>DOB: {profile.dateOfBirth}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <TasksPanel userId={userId} tasks={tasks} />

      {/* Broker tracker */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">Broker Tracker ({records.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Tier</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead className="w-56">Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(({ broker, exposure }) => (
                <TableRow key={broker._id}>
                  <TableCell>
                    <Badge variant="outline">{TIER_LABEL[broker.tier ?? 3]}</Badge>
                  </TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
