'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Reference content for the admin console, plus the standard operating procedure
// the admin / data remover follows for each user. Static — no per-user data.
// Mirrors the live Status dropdown and per-user workflow in the User detail page.

const STATUS_VALUES = [
  ['Not Started', 'You have not yet searched this broker or submitted an opt-out.'],
  ['Searched – Not Found', 'You searched and the data was NOT present. No action needed now.'],
  ['Searched – Found', 'Data IS present. Opt-out has not yet been submitted.'],
  ['Opt-Out Submitted', 'Opt-out request submitted; waiting for processing.'],
  ['Removal Confirmed', 'Verified that the data has been removed from this broker.'],
  ['Re-appeared', 'Data was removed but has re-appeared. Re-submit the opt-out.'],
  ['Handled by Service', 'Covered by an automated removal service subscription.'],
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
  ['Subsidiaries matter', 'Many brokers own others. Opting out of Intelius, for example, covers ~20 subsidiary sites. Check the "Also covers" row in each broker’s Playbook.'],
  ['Credit freeze is separate', 'Freezing credit (Equifax, Experian, TransUnion, Innovis, ChexSystems) is a separate action from data-broker opt-outs. Both are necessary.']
]

// Step-by-step SOP the data remover repeats for every user, mapped to the
// User detail page in the admin console.
const SOP = [
  {
    title: 'Step 1 — Confirm the user profile',
    body: 'Open the user. The command bar shows their name, address, DOB, phone, and a profile completeness meter. Click “Edit profile” and fill the required fields — first/last name, date of birth, address, city, state, ZIP. These drive every broker search, and missing fields weaken the automated scan, so fix gaps before you start.'
  },
  {
    title: 'Step 2 — Run the baseline scan',
    body: 'Click “Run baseline scan” in the command bar. This runs the automated skip-trace across the catalog, marks brokers as searched, and pre-populates “Found” exposures with what it located. Use the result as your starting point — it does the first pass so you can focus manual effort where data was found.'
  },
  {
    title: 'Step 3 — Work the Master tracker, Tier 1 first',
    body: 'In the Master tracker table, rows float needs-attention to the top, then sort by tier. Use the pipeline funnel (Total · Searched · Found · Submitted · Verified) and the filter box to focus. Always work Tier 1 (T1) brokers manually, even when a paid service covers them — they are the most visible.'
  },
  {
    title: 'Step 4 — Open the record, search and log',
    body: 'Click a broker row to open its record. Read the Playbook (method, difficulty, est. time, parent, also-covers, and the Search / Opt-out page links). In the Search log section set Date searched, Data found?, Search term used, What was found, the Profile / listing URL, and tick Screenshot taken. This is the evidence trail.'
  },
  {
    title: 'Step 5 — Submit the opt-out',
    body: 'Use the row’s “Submit opt-out” action or the Opt-out page link. After submitting, in the Remediation section set Status to “Opt-Out Submitted” (this stamps the Submitted date), record the Confirmation # / ref, and note what you did in Notes.'
  },
  {
    title: 'Step 6 — Verify removal',
    body: 'After the broker’s processing time, use the “Verify” action to re-search. When the listing is gone, set Status to “Removal Confirmed” — this stamps the Verified date and ticks Verified removed. If it is still present, leave it submitted and tick Follow-up needed.'
  },
  {
    title: 'Step 7 — Schedule the re-check',
    body: 'Set the Re-check date 3–4 months out (sooner for high-visibility brokers). Data reappears from public records, so every confirmed removal needs a future re-check. The Action queue surfaces re-checks once they fall due (within 7 days) and flags any listings that have re-appeared.'
  },
  {
    title: 'Step 8 — Work the Action queue',
    body: 'The right-hand Action queue lists everything that needs attention — Reappeared, Re-checks due, Found · not submitted, Follow-up flagged — and each is a one-click filter on the tracker. Add manual tasks there (or per-broker inside a record) for email confirmations, mailed forms, and phone calls, and check them off so the user’s queue stays clean.'
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
