# Deployment Guide

Step-by-step instructions to take this app from a local clone to a live
production deployment on Vercel, backed by Neon Postgres, Resend email, and
Google OAuth. Follow these in order — later steps assume earlier ones are
done.

## Architecture recap

| Piece | Choice | Why |
|---|---|---|
| Hosting | Vercel | Needs a real Node.js server (server actions, `bcryptjs`) — Vercel runs Node natively, unlike Cloudflare Workers' restricted edge runtime. |
| Database | Postgres on [Neon](https://neon.tech) | Serverless Postgres, generous free tier, works well with Vercel's ephemeral function instances. SQLite (used in local dev) cannot work here — Vercel functions get a fresh, throwaway filesystem per invocation. |
| Email | [Resend](https://resend.com) | Transactional email API, simple REST integration, generous free tier. |
| Auth | Hand-rolled Google OAuth + session cookies | See `PLAN.md` for why NextAuth wasn't used. |

## Prerequisites

- A GitHub repo with this code pushed (this project already has one:
  `Prestonpro/church-linkedin`).
- Accounts on [neon.tech](https://neon.tech), [resend.com](https://resend.com),
  [console.cloud.google.com](https://console.cloud.google.com), and
  [vercel.com](https://vercel.com) (all have free tiers sufficient for this).

## 1. Provision Postgres (Neon)

1. Create a project at [neon.tech](https://neon.tech) — name it something
   like `church-linkedin-prod`. Pick a region close to where you'll deploy
   (Vercel's default region is `iad1`/us-east, so `us-east-2` on Neon is a
   good match).
2. Once created, open **Connection Details** and copy **both** connection
   strings:
   - The **pooled** string (hostname contains `-pooler`) → this becomes
     `DATABASE_URL`. The running app and `prisma.config.ts` use this one.
   - The **direct/unpooled** string (identical, just drop `-pooler` from the
     hostname) → this becomes `DIRECT_URL`, needed only for running
     migrations (see the gotcha below).
3. Apply the existing schema to this fresh database. From your local machine,
   with the repo checked out:
   ```bash
   DATABASE_URL="<your direct connection string>" npx prisma migrate deploy
   ```
   **Use the direct string here, not the pooled one** — `prisma migrate`
   takes a Postgres advisory lock, and Neon's PgBouncer transaction-pooling
   mode (what the `-pooler` string connects through) can't reliably support
   that lock. This has been verified directly against this database: the
   migration will hang or behave inconsistently against the pooled
   connection. `prisma.config.ts` only reads `DATABASE_URL` regardless of
   name, which is why the direct string is passed as `DATABASE_URL` on this
   one command rather than as `DIRECT_URL`.

**Do not point production at the same database you use for local
development.** Local dev accumulates test accounts and sample data; keep
production's database separate and clean from day one. (If you're migrating
an existing dev database to production instead of starting fresh, clean out
any test data first.)

## 2. Set up Resend (email)

1. Sign up at [resend.com](https://resend.com) — the free tier (100
   emails/day, 3,000/month) is enough for a single church's usage.
2. Create an API key: dashboard → **API Keys** → **Create API Key**. Copy it
   immediately — you won't be able to see it again.
3. **The domain catch**: until you verify your own sending domain, you're on
   Resend's shared test domain (`onboarding@resend.dev`), and Resend will
   **only actually deliver to the email address on your own Resend
   account** — every other recipient gets silently accepted by the API but
   never delivered (a 403 from Resend, logged server-side, not shown to the
   user — see `src/lib/email.ts`). This is fine to launch with if you want
   to verify the app works before setting up a domain, but **no real user
   will receive a real email until you do this**:
   - Dashboard → **Domains** → **Add Domain**, then add the DNS records
     Resend gives you (a few TXT/CNAME records at your domain registrar).
     Usually propagates within a few minutes, sometimes up to a few hours.
   - Update `EMAIL_FROM` to use that domain, e.g.
     `EMAIL_FROM="Church LinkedIn <hello@yourdomain.org>"`.
   - Until you do this, `EMAIL_FROM` must stay on `onboarding@resend.dev` or
     Resend rejects the send outright.

## 3. Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) →
   create a project (or reuse one) → **APIs & Services** → **Credentials**.
2. **Create Credentials** → **OAuth client ID**. If prompted, configure the
   **OAuth consent screen** first: choose **External**, fill in the app name
   and your contact email. Leaving it in **Testing** publish status is fine
   to start — it caps sign-in to test users you explicitly add in the
   consent screen config; switch to **Production** publish status when
   you're ready for anyone to sign in.
3. Application type: **Web application**.
4. Under **Authorized redirect URIs**, add one entry per environment you'll
   use, exactly:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://<your-vercel-domain>/api/auth/callback/google` (production —
     you'll know the exact domain after step 4 below; come back and add it)
5. Save, then copy the **Client ID** and **Client secret**.

Google matches the redirect URI **exactly** — a trailing slash or wrong
scheme (`http` vs `https`) mismatch will fail with `redirect_uri_mismatch`.

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and
   **Import** the repo.
2. Set **Project Name** — this determines your `<project-name>.vercel.app`
   domain (shown to you before you deploy; note the exact domain if your
   preferred name is taken).
3. Before deploying, add these **Environment Variables**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string from step 1 |
   | `DIRECT_URL` | Neon **direct** connection string from step 1 (not read at runtime, but keep it set for running future migrations against production via the same pattern as step 1) |
   | `SESSION_SECRET` | A fresh secret — `openssl rand -hex 32`. **Do not reuse your local dev secret.** |
   | `APP_URL` | `https://<your-vercel-domain>` (the exact domain from step 2) |
   | `RESEND_API_KEY` | From step 2 |
   | `EMAIL_FROM` | From step 2 (`onboarding@resend.dev` until you verify a domain) |
   | `GOOGLE_CLIENT_ID` | From step 3 |
   | `GOOGLE_CLIENT_SECRET` | From step 3 |

4. Click **Deploy**.
5. Once deployed, confirm the assigned production domain matches what you
   used for `APP_URL` in step 3. If Vercel assigned something different
   (e.g. your preferred name was taken), update the `APP_URL` env var to
   match and redeploy.
6. Go back to Google Cloud Console (step 3) and add
   `https://<actual-domain>/api/auth/callback/google` to the OAuth client's
   authorized redirect URIs — Google sign-in will fail with
   `redirect_uri_mismatch` until this is done.

Every push to `master` auto-deploys from here on — no further manual steps
for routine code changes. `package.json`'s `postinstall: "prisma generate"`
regenerates the Prisma client automatically on every deploy.

### Future schema changes

When you add a new Prisma migration, apply it to production the same way as
step 1: `DATABASE_URL="<production direct connection string>" npx prisma
migrate deploy` from your local machine before or right after deploying the
code that depends on it. Vercel's build step does not run migrations for
you.

## 5. Post-deploy verification checklist

Before considering the deployment done, confirm on the **production URL**
(not localhost):

- [ ] Landing page loads, manifest/icons resolve (`/manifest.json`,
      `/icon-192.png`, `/icon-512.png` all return 200)
- [ ] Sign up creates a church + admin account
- [ ] `/api/auth/google` redirects to Google's real consent screen with the
      correct `client_id` and `redirect_uri` (check the URL it redirects to)
- [ ] Clicking through Google sign-in actually completes and creates/links
      an account (this one needs a real browser + real Google account — the
      redirect-URL check above only confirms the request is well-formed)
- [ ] A volunteer can RSVP to help at an event; a student can RSVP to attend
- [ ] A student can request a mentor connection, and the mentor's email is
      **not** visible anywhere before the mentor accepts
- [ ] After the mentor accepts, both parties can see each other's email
- [ ] Password reset request returns the same generic response whether or
      not the email exists, and (once a Resend domain is verified) the email
      actually arrives

## 6. Custom domain (optional)

1. Vercel project → **Settings** → **Domains** → add your domain.
2. Add the DNS records Vercel gives you at your domain registrar (usually a
   `CNAME` for a subdomain, or an `A`/`ALIAS` record for an apex domain).
3. Once verified, update `APP_URL` to the custom domain and redeploy.
4. Add `https://<custom-domain>/api/auth/callback/google` to Google's
   authorized redirect URIs (keep the old `.vercel.app` one too, or remove it
   once you've confirmed the new domain works).
5. If you verified a Resend domain matching your custom domain, no change
   needed there — otherwise, consider verifying it now for a consistent
   `EMAIL_FROM` address.

## Troubleshooting

- **`prisma migrate deploy` hangs or the advisory lock never releases**:
  you're almost certainly running it against the pooled (`-pooler`)
  connection string instead of the direct one. Neon's PgBouncer
  transaction-pooling mode doesn't reliably support the advisory lock
  Prisma's migration engine takes.
- **Google sign-in redirects back to `/login?error=google_oauth_failed`**:
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are missing or wrong in that
  environment's env vars — this is a caught error, not a crash (see
  `src/app/api/auth/google/route.ts`), so check Vercel's function logs for
  the underlying error.
- **Google sign-in fails with `redirect_uri_mismatch`**: the exact
  `APP_URL` your deployment is running with doesn't have a matching entry
  in Google Cloud Console's authorized redirect URIs. Check for scheme
  (`http` vs `https`), trailing slashes, and that you added the URI to the
  same OAuth client whose `GOOGLE_CLIENT_ID` you're actually using.
- **Emails aren't arriving for real users**: expected until you verify a
  sending domain in Resend (see step 2) — check Vercel's function logs for
  `[email] Resend rejected message...`, which confirms this is the cause
  (a delivery failure like this is logged, never thrown, so it won't
  otherwise be visible to the user or crash the action that triggered it).
- **Running two `npm run dev` / e2e runs against the same project
  directory**: Next.js locks per project directory, not per port — if you
  see "Another next dev server is already running" pointing at a PID, that
  process needs to be stopped (even if it's on a different port) before a
  new one can start in the same directory.
