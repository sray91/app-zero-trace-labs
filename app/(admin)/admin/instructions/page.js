'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mirrors the "📋 Instructions" tab of the Data Broker Removal Tracker workbook,
// plus a standard operating procedure for the admin / data remover to follow for
// each user. Static reference content — no per-user data.

const STATUS_VALUES = [
  ['Not Started', 'You have not yet visited this broker or submitted an opt-out.'],
  ['Searched – Not Found', 'You searched and the data was NOT present. No action needed now.'],
  ['Searched – Found', 'Data IS present. Opt-out has not yet been submitted.'],
  ['Opt-Out Submitted', 'Opt-out request submitted; waiting for processing.'],
  ['Removal Confirmed', 'Verified that the data has been removed from this broker.'],
  ['Re-appeared – Action Needed', 'Data was removed but has re-appeared. Re-submit opt-out.'],
  ['Handled by Paid Service', 'Covered by an automated removal service subscription.'],
  ['Skipped / N/A', 'Not applicable, or chosen to skip this broker.']
]

const TIERS = [
  ['Tier 1 – Crucial (16 brokers)', 'Highest visibility — appear on page 1 of Google for name searches. Do these FIRST, manually, regardless of paid-service coverage.'],
  ['Tier 2 – High (19 brokers)', 'Major marketing, financial, and background-check brokers. Critical for reducing spam, insurance impacts, and employer background checks.'],
  ['Tier 3 – Standard (58 brokers)', 'Remaining people-search sites, specialty databases, and direct-mail lists. Work after Tiers 1 and 2.']
]

const NOTES = [
  ['Data reappears regularly', 'Opt-out is NOT permanent. Most brokers re-add data within 3–6 months from public records. This is ongoing maintenance, not a one-time project.'],
  ['Use a secondary email', 'When opt-outs require email confirmation, use a secondary or masked email (SimpleLogin, Apple Hide My Email). Some brokers reuse confirmation emails for marketing.'],
  ['Paid services are not complete', 'No single service covers all brokers. Best strategy: 1 automated service + manual Tier 1 opt-outs + periodic manual sweeps of the full list.'],
  ['Subsidiaries matter', 'Many brokers own others. Opting out of Intelius, for example, covers ~20 subsidiary sites. Check the "Also Covers" column in the broker catalog.'],
  ['Credit freeze is separate', 'Freezing credit (Equifax, Experian, TransUnion, Innovis, ChexSystems) is a separate action from data-broker opt-outs. Both are necessary.']
]

// Step-by-step SOP the data remover repeats for every user.
const SOP = [
  {
    title: 'Step 1 — Confirm the user profile',
    body: 'Open the user, click Edit profile, and confirm legal name, any aliases, date of birth, current and recent addresses, and phone. These are the search terms you will use on every broker site. Fix anything missing before you start.'
  },
  {
    title: 'Step 2 — Work Tier 1 first',
    body: 'In the Master Tracker tab, work top-down starting with Tier 1 brokers. They are the most visible and must be done manually even when a paid service is active.'
  },
  {
    title: 'Step 3 — Search and log every broker',
    body: 'For each broker, open its search URL, search using the user’s name/location, and record the result in the Search Log tab: set Data Found?, fill Search Term Used, What Was Found, the Profile URL, and tick Screenshot taken. This is the evidence trail.'
  },
  {
    title: 'Step 4 — Submit the opt-out',
    body: 'Follow the broker’s opt-out method (shown in the record and the Broker Catalog). After submitting, set Status to “Opt-Out Submitted”, set the Submitted date, and record the Confirmation # / Ref. Note the Action Taken.'
  },
  {
    title: 'Step 5 — Verify removal',
    body: 'After the broker’s processing time, re-search the site. When the listing is gone, set Status to “Removal Confirmed”, tick Verified removed, and set the Date Verified. If it is still present, leave it submitted and flag Follow-up needed.'
  },
  {
    title: 'Step 6 — Schedule the re-check',
    body: 'Set the Re-check Due date 3–4 months out (sooner for high-visibility brokers). Data reappears from public records, so every confirmed removal needs a future re-check.'
  },
  {
    title: 'Step 7 — Track loose ends as tasks',
    body: 'Use the Tasks tab for anything that needs a human follow-up — email confirmations, mailed opt-out forms, phone calls. Close them as you go so the user’s queue stays clean.'
  }
]

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 py-2 border-b border-border last:border-0">
      <div className="font-medium text-foreground">{label}</div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

export default function AdminInstructionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-foreground">Instructions &amp; SOP</h1>
        <p className="text-muted-foreground mt-1">
          How to use the tracker and the standard procedure to follow for each user.
          US-focused · 93 data brokers.
        </p>
      </div>

      {/* SOP */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">SOP — Per-User Removal Procedure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SOP.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <Badge variant="outline" className="h-6 shrink-0">{i + 1}</Badge>
              <div>
                <div className="font-medium text-foreground">{s.title}</div>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Status field values */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">Status Field Values</CardTitle>
        </CardHeader>
        <CardContent>
          {STATUS_VALUES.map(([label, desc]) => (
            <Row key={label} label={label}>{desc}</Row>
          ))}
        </CardContent>
      </Card>

      {/* Priority tiers */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">Priority Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          {TIERS.map(([label, desc]) => (
            <Row key={label} label={label}>{desc}</Row>
          ))}
        </CardContent>
      </Card>

      {/* Important notes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-outfit text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {NOTES.map(([label, desc]) => (
            <Row key={label} label={label}>{desc}</Row>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
