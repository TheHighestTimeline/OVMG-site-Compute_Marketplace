# OneVibe Compute Marketplace

Public catalog for reserving frontier AI compute — Blaize QOS GSPs and RTX Pro 6000
Blackwell GPUs across OneVibe's contracted capacity. Next.js 14 (App Router) + Clerk
auth, with Airtable, Resend, Stripe (ACH), and optional Middesk EIN verification.

## Stack

- **Next.js 14.2** (App Router, TypeScript)
- **Clerk** — authentication & business onboarding gate
- **Airtable** — reservation records
- **Resend** — transactional email (LOI confirmations)
- **Stripe** — ACH deposit checkout
- **Middesk** *(optional)* — EIN / business verification

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real keys
npm run dev                  # http://localhost:3000
```

## Environment variables

See `.env.example` for the full list. At minimum you need the two Clerk keys for the
app to boot. The marketplace catalog renders without any other integration; Airtable,
Resend, Stripe, and Middesk all soft-fail when their keys are absent, so the site
stays usable while you wire them up.

## Project structure

```
app/
  layout.tsx                     ClerkProvider + metadata
  page.tsx                       Marketplace catalog (hero, stats, grid)
  globals.css                    Full theme + component styles
  onboarding/page.tsx            Business verification form
  sign-in/[[...sign-in]]/        Clerk sign-in
  sign-up/[[...sign-up]]/        Clerk sign-up
  api/
    reserve/route.ts             LOI submission → Airtable + Resend
    loi/route.ts                 Authenticated LOI status check
    verify-ein/route.ts          Onboarding submit → Middesk + Clerk metadata
    payment/create-checkout/     Stripe deposit checkout session
    payment/webhook/             Stripe webhook handler
components/
  ComputeCard.tsx                Listing card
  Sidebar.tsx                    Filters
  LOIModal.tsx                   Reserve / pre-order flow (auth + onboarding gated)
lib/
  inventory.ts                   Listings data + helpers
middleware.ts                    Clerk route protection
```

## Deploying to Netlify

Connect this repo (branch `main`). `netlify.toml` is already configured:

- Build command: `npm install && npm run build`
- Publish: `.next` (via `@netlify/plugin-nextjs`)
- Node 20

Set every variable from `.env.example` under **Site settings → Environment variables**
before the first deploy.

## Notes on this rebuild

The original source tree was lost; this codebase was reconstructed from the deployed
build artifacts. The frontend (`page.tsx`, components, `inventory.ts`, `globals.css`)
and `middleware.ts` were recovered verbatim from build sourcemaps. The backend API
routes and the onboarding/sign-in pages were re-implemented to match the frontend's
expected contracts.
