// Shared definitions for the Exposure Tracker: the per-broker removal
// checklist and the status vocabularies used by broker_exposures rows.

export const REMOVAL_CHECKLIST_STEPS = [
  {
    id: 'locate',
    label: 'Locate your listing',
    description:
      'Search the broker site for your name, phone, and past addresses. Copy the exact URL of your profile.'
  },
  {
    id: 'document',
    label: 'Document the exposure',
    description:
      'Screenshot the listing and note what is exposed (address, phone, relatives) before requesting removal.'
  },
  {
    id: 'masked_email',
    label: 'Use a masked email',
    description:
      'Submit the opt-out from an alias/forwarding address so the broker cannot harvest your real email.'
  },
  {
    id: 'submit',
    label: 'Submit the opt-out request',
    description:
      'Use the broker’s opt-out form or privacy email. Paste your listing URL where required.'
  },
  {
    id: 'verify_identity',
    label: 'Complete verification',
    description:
      'Confirm any verification email, code, or phone call the broker requires to process the request.'
  },
  {
    id: 'record_confirmation',
    label: 'Record the confirmation',
    description:
      'Save the confirmation number or email in this broker’s notes so you can follow up.'
  },
  {
    id: 'confirm_removal',
    label: 'Confirm removal (7–14 days)',
    description:
      'Re-search the broker to verify your listing is gone, then mark the status as Removed.'
  },
  {
    id: 'schedule_recheck',
    label: 'Schedule a 90-day recheck',
    description:
      'Brokers re-list data from fresh public records. Set a recheck date so it surfaces in your reminders.'
  }
]

export const EXPOSURE_STATUSES = {
  unchecked: { label: 'Unchecked', badgeVariant: 'outline' },
  found: { label: 'Found Me', badgeVariant: 'destructive' },
  not_found: { label: 'Not Listed', badgeVariant: 'secondary' }
}

export const REMOVAL_STATUSES = {
  not_started: { label: 'Not Started', badgeVariant: 'outline' },
  in_progress: { label: 'In Progress', badgeVariant: 'secondary' },
  submitted: { label: 'Opt-Out Submitted', badgeVariant: 'default' },
  removed: { label: 'Removed', badgeVariant: 'default' },
  reappeared: { label: 'Reappeared', badgeVariant: 'destructive' }
}

// Days until a confirmed removal should be re-verified
export const RECHECK_INTERVAL_DAYS = 90
