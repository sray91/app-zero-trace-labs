# Per-user proxy inbox — setup

Gives every user a unique alias (e.g. `u-ab12cd34@mail.0tracelabs.com`) that the
admin types into broker opt-out forms. Broker verification emails are routed here and
appear in the admin user-detail page, where the admin clicks the verification link.

Flow: broker → alias → Cloudflare Email Routing (catch-all → this Worker) →
`POST /inbound-email` on Convex → `inboxMessages` → admin UI.

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

## 3. Cloudflare: add the `mail` subdomain

Email Routing is already enabled on `0tracelabs.com`. Keep the root for real mail and
add a subdomain for the proxy aliases:
1. **Email → Email Routing → Settings → Subdomains** → add `mail`.
2. Confirm it provisions MX records (`route*.mx.cloudflare.net`) for
   `mail.0tracelabs.com`. Without those, mail to the subdomain won't be delivered.

## 4. Deploy the Worker

`wrangler.toml` already targets the prod URL, so no edit needed.

```sh
cd scripts/cloudflare-email-worker
npm i postal-mime
npx wrangler login
npx wrangler secret put INBOUND_EMAIL_SECRET   # paste the SAME value as Convex
npx wrangler deploy
```

## 5. Route subdomain mail to the Worker

Cloudflare → **Email → Email Routing → Routing rules** → set the catch-all (or a
custom address `*@mail.0tracelabs.com`) → Action **Send to a Worker** →
`zerotrace-inbound-email` → Save & enable.

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
