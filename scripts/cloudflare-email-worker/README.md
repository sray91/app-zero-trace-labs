# Per-user proxy inbox — setup

Gives every user a unique alias (e.g. `u-ab12cd34@mail.0tracelabs.com`) that the
admin types into broker opt-out forms. Broker verification emails are routed here and
appear in the admin user-detail page, where the admin clicks the verification link.

Flow: broker → alias → Cloudflare apex catch-all → this Worker →
`POST /inbound-email` on Convex → `inboxMessages` → admin UI.

**Why the apex catch-all:** Cloudflare's catch-all is zone-wide only — there is no
per-subdomain catch-all and custom address rules don't support wildcards. Since aliases
are random, the only way to match them is the apex catch-all. The Worker then splits by
recipient domain:
- `<alias>@mail.0tracelabs.com` → parsed and sent to Convex (proxy inbox)
- anything else (real `@0tracelabs.com` mail) → forwarded to `FALLBACK_EMAIL` so it's
  never lost.

Deployment is prod-only: `standing-swordfish-884` (HTTP base
`https://standing-swordfish-884.convex.site`). There is no active dev deployment.

## 1. Deploy the Convex code to prod

```sh
npx convex deploy
```

## 2. Convex prod env vars

```sh
openssl rand -hex 32   # one secret; reuse for the Worker in step 4
npx convex env set --prod PROXY_EMAIL_DOMAIN mail.0tracelabs.com
npx convex env set --prod INBOUND_EMAIL_SECRET <paste the secret>
```

| Var | Value |
| --- | --- |
| `PROXY_EMAIL_DOMAIN` | the mail domain, `mail.0tracelabs.com` |
| `INBOUND_EMAIL_SECRET` | a long random string (shared with the Worker) |

## 3. Cloudflare: add the `mail` subdomain + verify a fallback inbox

Email Routing is already enabled on `0tracelabs.com`.
1. **Email → Email Routing → Settings → Subdomains** → add `mail`. Confirm it
   provisions MX records (`route*.mx.cloudflare.net`) for `mail.0tracelabs.com` —
   without those, alias mail won't be delivered.
2. **Email → Email Routing → Destination addresses** → add and **verify** the real
   inbox you want non-alias apex mail forwarded to (click the verification email).
   This is the `FALLBACK_EMAIL`.

## 4. Deploy the Worker

Edit `wrangler.toml` and set `FALLBACK_EMAIL` to the verified address from step 3.
`CONVEX_INBOUND_URL` and `PROXY_EMAIL_DOMAIN` are already set.

```sh
cd scripts/cloudflare-email-worker
npm i postal-mime
npx wrangler login
npx wrangler secret put INBOUND_EMAIL_SECRET   # paste the SAME value as Convex
npx wrangler deploy
```

## 5. Point the apex catch-all at the Worker

Cloudflare → **Email → Email Routing → Routing rules → Catch-all address** → Edit →
Action **Send to a Worker** → `zerotrace-inbound-email` → Save & enable.

(Do **not** create a custom-address rule — those need an exact local part and can't
match random aliases. The Worker handles the apex-vs-subdomain split itself, so you
don't need per-address forward rules for your real mail either.)

## 6. Provision aliases

Open any user in the admin console and click **Generate** next to the opt-out email
(or run `users.backfillProxyEmails` once for everyone). New users get one
automatically via the Clerk webhook.

## Test

Send an email to any active alias and confirm it shows up in that user's
**Opt-out inbox** card in the admin console.

## Notes

- Receive-only. Replies/outbound aren't supported (would need a sending provider).
- Deliverability: SPF/DKIM/DMARC on the domain matter or broker mail may not arrive.
- Aliases are random/non-enumerable; treat the inbox as identity-verification data and
  keep it behind the admin role (already enforced in `convex/inbox.ts`).
