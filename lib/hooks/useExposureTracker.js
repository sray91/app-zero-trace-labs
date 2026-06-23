'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConvex } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/lib/contexts/AuthContext'
import { RECHECK_INTERVAL_DAYS } from '@/lib/removal-checklist'

const toIso = (ms) => (ms != null ? new Date(ms).toISOString() : null)

// Convex (camelCase) exposure doc -> the snake_case row shape the pages consume.
const mapExposure = (d) => ({
  id: d._id,
  data_source_id: d.dataSourceId,
  exposure_status: d.exposureStatus,
  removal_status: d.removalStatus,
  listing_url: d.listingUrl ?? null,
  confirmation_ref: d.confirmationRef ?? null,
  checklist: d.checklist ?? {},
  found_at: toIso(d.foundAt),
  submitted_at: toIso(d.submittedAt),
  removed_at: toIso(d.removedAt),
  recheck_at: toIso(d.recheckAt),
  notes: d.notes ?? null,
})

const mapSource = (d) => ({
  id: d._id,
  name: d.name,
  url: d.url,
  api_endpoint: d.apiEndpoint,
  risk_level: d.riskLevel,
  description: d.description,
  data_types: d.dataTypes,
  is_active: d.isActive,
})

// Patches from the UI use snake_case (and ISO timestamps); the mutation wants
// camelCase with epoch-millisecond timestamps.
const FIELD_MAP = {
  exposure_status: 'exposureStatus',
  removal_status: 'removalStatus',
  listing_url: 'listingUrl',
  confirmation_ref: 'confirmationRef',
  found_at: 'foundAt',
  submitted_at: 'submittedAt',
  removed_at: 'removedAt',
  recheck_at: 'recheckAt',
}
const TIME_FIELDS = new Set(['foundAt', 'submittedAt', 'removedAt', 'recheckAt'])

const toMutationArgs = (patch) => {
  const out = {}
  for (const [k, value] of Object.entries(patch)) {
    const key = FIELD_MAP[k] || k
    if (TIME_FIELDS.has(key) && typeof value === 'string') {
      out[key] = new Date(value).getTime()
    } else {
      out[key] = value
    }
  }
  return out
}

// Loads all active data sources plus the current user's broker exposures,
// and exposes mutation helpers that upsert on (user, data source).
export function useExposureTracker() {
  const { user } = useAuth()
  const convex = useConvex()
  const [dataSources, setDataSources] = useState([])
  const [exposures, setExposures] = useState({}) // keyed by data_source_id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) {
      setDataSources([])
      setExposures({})
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [sources, rows] = await Promise.all([
        convex.query(api.dataSources.list, {}),
        convex.query(api.brokerExposures.listForUser, {}),
      ])

      const sorted = [...(sources || [])]
        .map(mapSource)
        .sort((a, b) => a.name.localeCompare(b.name))
      setDataSources(sorted)

      const map = {}
      for (const row of rows || []) {
        const mapped = mapExposure(row)
        map[mapped.data_source_id] = mapped
      }
      setExposures(map)
      setError(null)
    } catch (err) {
      console.error('Error loading exposure tracker data:', err)
      setError(err.message || 'Failed to load exposure data')
    } finally {
      setLoading(false)
    }
  }, [user, convex])

  useEffect(() => {
    load()
  }, [load])

  const saveExposure = useCallback(
    async (dataSourceId, patch) => {
      if (!user) return { error: new Error('Not signed in') }
      try {
        const doc = await convex.mutation(api.brokerExposures.upsert, {
          dataSourceId,
          ...toMutationArgs(patch),
        })
        const mapped = mapExposure(doc)
        setExposures((prev) => ({ ...prev, [dataSourceId]: mapped }))
        return { data: mapped }
      } catch (err) {
        console.error('Error saving exposure:', err)
        setError(err.message)
        return { error: err }
      }
    },
    [user, convex]
  )

  const setExposureStatus = useCallback(
    (dataSourceId, exposureStatus) => {
      const patch = { exposure_status: exposureStatus }
      if (exposureStatus === 'found' && !exposures[dataSourceId]?.found_at) {
        patch.found_at = new Date().toISOString()
      }
      return saveExposure(dataSourceId, patch)
    },
    [saveExposure, exposures]
  )

  const setRemovalStatus = useCallback(
    (dataSourceId, removalStatus) => {
      const now = new Date()
      const patch = { removal_status: removalStatus }
      if (removalStatus === 'submitted' && !exposures[dataSourceId]?.submitted_at) {
        patch.submitted_at = now.toISOString()
      }
      if (removalStatus === 'removed') {
        patch.removed_at = now.toISOString()
        const recheck = new Date(now)
        recheck.setDate(recheck.getDate() + RECHECK_INTERVAL_DAYS)
        patch.recheck_at = recheck.toISOString()
      }
      return saveExposure(dataSourceId, patch)
    },
    [saveExposure, exposures]
  )

  const toggleChecklistStep = useCallback(
    (dataSourceId, stepId) => {
      const current = exposures[dataSourceId]?.checklist || {}
      const checklist = { ...current, [stepId]: !current[stepId] }
      return saveExposure(dataSourceId, { checklist })
    },
    [saveExposure, exposures]
  )

  const stats = useMemo(() => {
    const rows = Object.values(exposures)
    const found = rows.filter((r) => r.exposure_status === 'found')
    const removed = found.filter((r) => r.removal_status === 'removed')
    const inProgress = found.filter((r) =>
      ['in_progress', 'submitted'].includes(r.removal_status)
    )
    const reappeared = rows.filter((r) => r.removal_status === 'reappeared')
    const now = new Date()
    const recheckDue = rows.filter(
      (r) => r.recheck_at && new Date(r.recheck_at) <= now
    )
    const checked = rows.filter((r) => r.exposure_status !== 'unchecked')
    return {
      totalBrokers: dataSources.length,
      checkedCount: checked.length,
      foundCount: found.length,
      inProgressCount: inProgress.length,
      removedCount: removed.length,
      reappearedCount: reappeared.length,
      recheckDue,
      removalPercent:
        found.length > 0 ? Math.round((removed.length / found.length) * 100) : 0,
    }
  }, [exposures, dataSources])

  return {
    dataSources,
    exposures,
    stats,
    loading,
    error,
    reload: load,
    saveExposure,
    setExposureStatus,
    setRemovalStatus,
    toggleChecklistStep,
  }
}
