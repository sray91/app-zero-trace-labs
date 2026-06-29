'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Loader2, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react'

const TIER_LABEL = { 1: 'T1 – Crucial', 2: 'T2 – High', 3: 'T3 – Standard' }

const EMPTY_FORM = {
  name: '',
  category: '',
  tier: '3',
  difficulty: '',
  estProcessingDays: '',
  searchUrl: '',
  optOutUrl: '',
  optOutMethod: '',
  alsoCovers: '',
  parentCompany: '',
  instructions: ''
}

function brokerToForm(b) {
  return {
    name: b.name ?? '',
    category: b.category ?? '',
    tier: String(b.tier ?? 3),
    difficulty: b.difficulty ?? '',
    estProcessingDays: b.estProcessingDays != null ? String(b.estProcessingDays) : '',
    searchUrl: b.searchUrl ?? '',
    optOutUrl: b.optOutUrl ?? '',
    optOutMethod: b.optOutMethod ?? '',
    alsoCovers: b.alsoCovers ?? '',
    parentCompany: b.parentCompany ?? '',
    instructions: b.instructions ?? ''
  }
}

// Strip empty strings; convert numeric/typed fields. Returns the mutation payload.
function formToArgs(form) {
  const clean = (s) => {
    const v = s.trim()
    return v === '' ? undefined : v
  }
  const days = form.estProcessingDays.trim()
  return {
    name: form.name.trim(),
    category: clean(form.category),
    tier: Number(form.tier),
    difficulty: clean(form.difficulty),
    estProcessingDays: days === '' ? undefined : Number(days),
    searchUrl: clean(form.searchUrl),
    optOutUrl: clean(form.optOutUrl),
    optOutMethod: clean(form.optOutMethod),
    alsoCovers: clean(form.alsoCovers),
    parentCompany: clean(form.parentCompany),
    instructions: clean(form.instructions)
  }
}

function BrokerForm({ open, onOpenChange, broker }) {
  const create = useMutation(api.dataSources.create)
  const update = useMutation(api.dataSources.update)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(broker)

  // Reset the form whenever the dialog opens (for add or for a specific broker).
  const handleOpenChange = (next) => {
    if (next) setForm(broker ? brokerToForm(broker) : EMPTY_FORM)
    onOpenChange(next)
  }

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }))

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const args = formToArgs(form)
      if (isEdit) {
        await update({ id: broker._id, ...args })
        toast.success(`Updated ${args.name}`)
      } else {
        await create(args)
        toast.success(`Added ${args.name}`)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Broker' : 'Add Broker'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this broker in the catalog.' : 'Add a new broker to the catalog.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="BeenVerified" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={form.category} onChange={set('category')} placeholder="People Search" />
          </div>
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select value={form.tier} onValueChange={set('tier')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">T1 – Crucial</SelectItem>
                <SelectItem value="2">T2 – High</SelectItem>
                <SelectItem value="3">T3 – Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={form.difficulty || undefined} onValueChange={set('difficulty')}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estProcessingDays">Est. Processing Days</Label>
            <Input id="estProcessingDays" type="number" value={form.estProcessingDays} onChange={set('estProcessingDays')} placeholder="5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="optOutMethod">Opt-Out Method</Label>
            <Input id="optOutMethod" value={form.optOutMethod} onChange={set('optOutMethod')} placeholder="Online Form" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="searchUrl">Search URL</Label>
            <Input id="searchUrl" value={form.searchUrl} onChange={set('searchUrl')} placeholder="https://…" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="optOutUrl">Opt-Out URL</Label>
            <Input id="optOutUrl" value={form.optOutUrl} onChange={set('optOutUrl')} placeholder="https://…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentCompany">Parent Company</Label>
            <Input id="parentCompany" value={form.parentCompany} onChange={set('parentCompany')} placeholder="PeopleConnect" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alsoCovers">Also Covers</Label>
            <Input id="alsoCovers" value={form.alsoCovers} onChange={set('alsoCovers')} placeholder="PeopleLooker, PeopleSmart" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea id="instructions" value={form.instructions} onChange={set('instructions')} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Broker'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminBrokersPage() {
  const brokers = useQuery(api.dataSources.list)
  const remove = useMutation(api.dataSources.remove)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (brokers === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-warning-yellow" />
      </div>
    )
  }

  const sorted = [...brokers].sort((a, b) => {
    const t = (a.tier ?? 3) - (b.tier ?? 3)
    return t !== 0 ? t : a.name.localeCompare(b.name)
  })

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setFormOpen(true)
  }

  const confirmDelete = async () => {
    const b = deleting
    setDeleting(null)
    try {
      await remove({ id: b._id })
      toast.success(`Removed ${b.name}`)
    } catch (err) {
      toast.error(err.message ?? 'Remove failed')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground">Broker Catalog</h1>
          <p className="text-muted-foreground mt-1">{brokers.length} active brokers in the catalog.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Broker
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Broker</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-right">Est. Days</TableHead>
                <TableHead>Opt-Out</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((b) => (
                <TableRow key={b._id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{b.name}</div>
                    {b.parentCompany && (
                      <div className="text-xs text-muted-foreground">{b.parentCompany}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{b.category ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline">{TIER_LABEL[b.tier ?? 3]}</Badge></TableCell>
                  <TableCell className="text-sm">{b.difficulty ?? '—'}</TableCell>
                  <TableCell className="text-right text-sm">{b.estProcessingDays ?? '—'}</TableCell>
                  <TableCell>
                    {b.optOutUrl && b.optOutUrl.startsWith('http') ? (
                      <a href={b.optOutUrl} target="_blank" rel="noreferrer" className="text-nuclear-blue inline-flex items-center text-sm">
                        Link <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">{b.optOutUrl ?? '—'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)} aria-label={`Edit ${b.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(b)} aria-label={`Remove ${b.name}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BrokerForm open={formOpen} onOpenChange={setFormOpen} broker={editing} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the broker from the catalog. Existing per-user removal records are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
