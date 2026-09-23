# Streetwear Studio — AI Custom Streetwear (Demo)

A web app where customers design their own streetwear with AI: pick a
garment → type a prompt or pick a style preset → AI generates the graphic →
live mockup preview (change colour, add custom text) → order.

**Local demo only.** Not pushed to GitHub, not deployed. The user approves
before anything ships.

## What was built

- `/` — Landing: hero, "Design your own drop" pitch, 3-step how-it-works,
  drops teaser, FAQ, footer. Dark streetwear aesthetic.
- `/studio` — The designer (core): product picker (Oversized Tee / Regular
  Tee / Hoodie, hand-drawn SVG templates), 4 colour variants, prompt box +
  5 style preset chips, custom text layer (Devanagari-capable font, size
  slider, 3 position presets), live mockup with print-style blending,
  regenerate, PNG preview download, order button.
- `/gallery` — Pre-made drops grid (6 AI-generated designs); each opens in
  the studio.
- `/checkout` — Order flow with **Manual UPI** (for Indian buyers:
  placeholder UPI ID/QR area, customer enters their 12-digit UTR) and
  **PayPal** (for international buyers: "Pay with PayPal" button to a
  configurable PayPal.Me link, customer enters PayPal transaction ID +
  payer email). Both end at an honest "order received, payment pending
  verification" state — no fake "payment successful" screens. Orders are
  saved to localStorage in this demo.
- `/api/generate` — POST `{ prompt, stylePreset, seed }`. Default provider
  is **Pollinations.ai (free, keyless)**; the client falls back to bundled
  sample artwork if the remote image fails to load. Optional `FAL_KEY`
  upgrade path to fal.ai is stubbed in the route.

Tech: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, structured
for later Vercel deployment.

## How to run

```bash
cd ~/workspace/streetwear-studio
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

## Product decisions baked in

1. **AI generation is 100% free via Pollinations.ai** — no key, no signup.
   `GET https://image.pollinations.ai/prompt/{prompt}?width=1024&height=1024&nologo=true&model=flux`.
   Bundled sample designs are the instant fallback. `FAL_KEY` is an
   optional future upgrade to fal.ai, not required.
2. **No payment gateway at launch** (owner cannot do video KYC right now).
   Two manual methods, both verified by hand:
   - **Manual UPI** (Indian buyers): customer pays to the owner's UPI ID
     shown at checkout, enters their 12-digit UTR; order is marked
     "payment pending verification" until the owner confirms it.
   - **PayPal** (international buyers): a "Pay with PayPal" button links to
     the owner's PayPal.Me URL; the customer pays on PayPal, then enters
     their PayPal transaction ID + payer email so the owner can match the
     payment. PayPal cannot take UPI or domestic INR payments, so it is
     explicitly labelled for international orders.
   Razorpay — which would cover UPI + domestic/international cards +
   PayPal wallet in one checkout — is deferred to later, when volume
   justifies the KYC. (Standalone PayPal was considered and kept only as
   the manual international option: no UPI/domestic INR, 5–8% effective
   cost.)

## Env vars

| Var | Required | Purpose |
| --- | -------- | ------- |
| `FAL_KEY` | No | Optional upgrade: route `/api/generate` through fal.ai instead of free Pollinations |
| `NEXT_PUBLIC_OWNER_UPI_ID` | Before launch | Real UPI ID shown at checkout (currently a labelled placeholder) |
| `NEXT_PUBLIC_PAYPAL_ME_URL` | Before launch | Owner's PayPal.Me link for the "Pay with PayPal" button (currently a labelled placeholder). **The owner must create a PayPal business account and supply their PayPal.Me link before launch** |
| `QIKINK_API_KEY` | Later | Auto-push confirmed orders to Qikink's API (currently manual via their dashboard) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Later | Online payments, when volume justifies KYC |

## What's stubbed / unresolved

- **Payments:** Manual UPI + PayPal only, both hand-verified. No gateway,
  no webhooks, no automatic charging.
- **PayPal.Me link:** placeholder until the owner creates a PayPal business
  account and supplies their real link via `NEXT_PUBLIC_PAYPAL_ME_URL`.
- **UPI QR/ID:** placeholder box until the owner provides their real UPI ID
  via `NEXT_PUBLIC_OWNER_UPI_ID`.
- **Fulfillment:** Qikink has an open API and supports custom/API orders,
  but wiring is manual for now — confirmed orders are placed through the
  Qikink dashboard until `QIKINK_API_KEY` is set.
- **Order storage:** demo uses browser localStorage (`ss-orders`). Needs a
  real database before launch.
- **fal.ai:** stubbed (`generateWithFal` returns null); free Pollinations
  path is the default.
- **UPI QR:** placeholder box until the owner provides their real UPI ID.
- The mockup is a front-view flat template; back-print view is not
  implemented yet.
