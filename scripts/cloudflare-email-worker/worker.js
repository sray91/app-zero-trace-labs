// Cloudflare Email Worker — per-user proxy inbox for broker opt-out verification.
//
// Cloudflare's catch-all is zone-wide (apex only) — there's no per-subdomain catch-all
// and no wildcard custom addresses. So the APEX catch-all on 0tracelabs.com points
// here, and this Worker splits by recipient:
//   - u-<token>@<a domain in PROXY_EMAIL_DOMAIN> -> parse + POST to Convex
//     /inbound-email (proxy inbox). Aliases live on the apex; the legacy
//     mail.0tracelabs.com domain stays listed so addresses already registered
//     with brokers keep working.
//   - anything else (real apex mail) -> forward to FALLBACK_EMAIL so it isn't lost
//
// Deploy:
//   cd scripts/cloudflare-email-worker
//   npm i postal-mime
//   npx wrangler deploy
// Then Cloudflare -> Email -> Email Routing -> Routing rules -> Catch-all address
//   -> Action "Send to a Worker" -> this worker.
//
// Required vars/secrets (see wrangler.toml + `wrangler secret put`):
//   PROXY_EMAIL_DOMAIN   comma-separated alias domains, first one must match Convex's
//                        PROXY_EMAIL_DOMAIN; later entries are legacy domains still accepted
//   FALLBACK_EMAIL       a VERIFIED Email Routing destination for real apex mail
//   CONVEX_INBOUND_URL   https://standing-swordfish-884.convex.site/inbound-email
//   INBOUND_EMAIL_SECRET must match INBOUND_EMAIL_SECRET on the Convex deployment

import PostalMime from 'postal-mime'

export default {
  async email(message, env, ctx) {
    const to = (message.to || '').toLowerCase()
    const aliasDomains = (env.PROXY_EMAIL_DOMAIN || '')
      .toLowerCase()
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
    // Aliases are minted as u-<10 chars of a-z0-9> (convex/users.ts makeProxyEmail),
    // so real apex addresses like support@ can never be mistaken for one.
    const isAlias = aliasDomains.some((d) => new RegExp(`^u-[a-z0-9]{10}@${d.replace(/\./g, '\\.')}$`).test(to))

    // Real mail to the apex (or any non-alias address) -> hand off to a human inbox.
    if (!isAlias) {
      if (env.FALLBACK_EMAIL) {
        await message.forward(env.FALLBACK_EMAIL)
      }
      // No fallback configured -> silently accept (drop) rather than bounce.
      return
    }

    // Proxy alias -> parse the MIME and ship it to Convex.
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
