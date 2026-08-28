# Steady

An accessible medication reminder for seniors and the people who care for them.

[![Live website](https://img.shields.io/badge/Live_Website-Open_Steady-215445?style=for-the-badge)](https://steady-medication-reminder.jsing138.workers.dev/)
[![Caregiver dashboard](https://img.shields.io/badge/Caregiver_Dashboard-View_Demo-3d7564?style=for-the-badge)](https://steady-medication-reminder.jsing138.workers.dev/caregiver)

![Steady medication reminder preview](public/og.png)

## About Steady

Medication schedules can be difficult to follow, especially when they involve several medicines, different times, or changing routines. Steady gives seniors a calm, focused reminder experience while helping caregivers manage schedules and review dose activity.

The senior view answers three questions at a glance:

1. What medicine comes next?
2. When should it be taken?
3. Has it already been confirmed?

The caregiver dashboard adds flexible scheduling and adherence visibility without making daily care feel like surveillance.

## Live demo

- **Senior experience:** [steady-medication-reminder.jsing138.workers.dev](https://steady-medication-reminder.jsing138.workers.dev/)
- **Caregiver dashboard:** [steady-medication-reminder.jsing138.workers.dev/caregiver](https://steady-medication-reminder.jsing138.workers.dev/caregiver)

The public demo is seeded with sample medication data for Baljit Singh and caregiver Japjot Singh.

## Features

### Senior experience

- Large, high-contrast medication cards with one clear primary action
- Today's medication schedule and dose status
- Contextual **Next dose**, **Due now**, and **Overdue** messaging
- Browser text-to-speech for reading medication instructions aloud
- Optional camera confirmation with a photo-review step
- Responsive layouts for phones, tablets, and desktop screens

### Caregiver experience

- Daily dose overview and recent medication activity
- Medication schedules for selected weekdays and multiple times per day
- Start dates, optional end dates, and automatic schedule expiration
- Controls to edit, pause, or resume medications
- Dose-confirmation history and adherence summaries
- Direct access to preview the connected senior experience

## Accessibility

Steady was designed around clarity and ease of use:

- 18px base text in the senior experience
- 48px-or-larger interactive targets
- Strong contrast with calm, low-distraction colors
- Semantic headings, visible keyboard focus, and descriptive labels
- Text and icons used together so status never relies on color alone
- Reduced-motion support and layouts that remain usable at 200% zoom
- Full-screen photo confirmation instead of a small, crowded dialog

## Privacy model

Medication schedules and dose records are stored in Cloudflare D1. Confirmation photos remain in the senior device's browser using IndexedDB and are not uploaded to permanent cloud storage.

This keeps the portfolio demo inexpensive and limits photo exposure. A caregiver using another device can see that a dose was confirmed but cannot retrieve the original photo.

## Technology

- **Frontend:** Next.js, React, TypeScript, CSS
- **Runtime and hosting:** Cloudflare Workers
- **Database:** Cloudflare D1 with Drizzle ORM migrations
- **Build tooling:** Vinext, Vite, Wrangler
- **Icons:** Lucide React

```text
Senior or caregiver browser
            |
            v
    Cloudflare Worker
       |           |
       v           v
 Static app     D1 database

Photos stay in browser IndexedDB
```

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm

### Setup

```bash
git clone https://github.com/japjotsingh18/steady-medication-reminder.git
cd steady-medication-reminder
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed in the terminal:

- `/` - senior experience
- `/caregiver` - caregiver dashboard

Steady currently requires no API keys. Cloudflare D1 is connected through the `DB` binding in `wrangler.jsonc`. The database ID identifies the resource but does not authorize access.

Keep local values in `.env.local`, which is ignored by Git. Add future production secrets with `wrangler secret put NAME`; never commit credentials.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Deploy to Cloudflare

Authenticate Wrangler, apply the D1 migrations, and deploy:

```bash
npx wrangler login
npx wrangler d1 migrations apply steady-db --remote
npm run deploy
```

Pushing to GitHub does not automatically modify the live Worker. Production changes only when an authenticated maintainer runs the deployment command.

## Medical disclaimer

Steady is an adherence and communication tool. It does not provide medical advice, check drug interactions, diagnose conditions, or recommend dosages. Users should follow medication labels and guidance from qualified healthcare professionals.

## Author

Built by [Japjot Singh](https://github.com/japjotsingh18).
