'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Loader2, ExternalLink } from 'lucide-react'

const TIER_LABEL = { 1: 'T1 – Crucial', 2: 'T2 – High', 3: 'T3 – Standard' }

export default function AdminBrokersPage() {
  const brokers = useQuery(api.dataSources.list)

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-outfit text-foreground">Broker Catalog</h1>
        <p className="text-muted-foreground mt-1">{brokers.length} active brokers in the catalog.</p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
