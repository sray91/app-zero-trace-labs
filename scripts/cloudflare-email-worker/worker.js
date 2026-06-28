// Cloudflare Email Worker — per-user proxy inbox for broker opt-out verification.
//
// Catch-all on the mail domain routes every incoming message to this Worker. We parse
// the MIME, then POST a small JSON payload to the Convex /inbound-email HTTP endpoint,
// which looks up the user by the recipient alias and stores it in `inboxMessages`.
//
// Deploy:
//   cd scripts/cloudflare-email-worker
//   npm i postal-mime
//   npx wrangler deploy
// Then in Cloudflare dashboard: Email -> Email Routing -> Routes -> Catch-all
//   -> Action: "Send to a Worker" -> this worker.
//
// Required Worker vars/secrets (see wrangler.toml + `wrangler secret put`):
//   CONVEX_INBOUND_URL   e.g. https://standing-swordfish-884.convex.site/inbound-email
//   INBOUND_EMAIL_SECRET must match INBOUND_EMAIL_SECRET on the Convex deployment

import PostalMime from 'postal-mime'

export default {
  async email(message, env, ctx) {
    const parsed = await PostalMime.parse(message.raw)

    const payload = {
      to: message.to, // the alias it was addressed to (e.g. u-ab12cd34@mail.0tracelabs.com)
      from: message.from,
      subject: parsed.subject ?? undefined,
      text: parsed.text ?? undefined,
      html: parsed.html ?? undefined,
      receivedAt: Date.now(),
    }

    const res = await fetch(env.CONVEX_INBOUND_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-inbound-secret': env.INBOUND_EMAIL_SECRET,
      },
      body: JSON.stringify(payload),
    })

    // If Convex is down, reject so Cloudflare retries rather than silently dropping.
    if (!res.ok) {
      throw new Error(`Convex inbound returned ${res.status}`)
    }
  },
}
