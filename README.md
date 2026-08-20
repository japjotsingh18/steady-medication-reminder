# Steady

Steady is a mobile-first medication reminder designed for seniors and the people who care for them. The senior experience answers three questions at a glance: what medicine is next, when is it due, and has it been taken? The caregiver experience adds schedule management and a lightweight adherence history without turning daily care into surveillance.

## Who it is for

- Seniors who benefit from large text, simple language, generous touch targets, and one obvious action at a time.
- Family caregivers who want reassurance that scheduled medication was taken without having to call every day.

## What the demo includes

- A senior home screen with the next dose, a large **I took it** action, camera capture, photo review, confirmation, and spoken reminder support.
- A clear daily medication schedule using both text and icons for status.
- A caregiver dashboard with today’s schedule, adherence summaries, missed-dose indicators, medication management, history, and a senior-device link.
- Seeded demo data for Baljit Singh and caregiver Japjot Singh.
- Durable medication and dose records in Cloudflare D1. Confirmation photos stay in the browser’s IndexedDB storage and are only visible on that device.

## Accessibility decisions

The senior view uses an 18px base font, high-contrast ink and cream colors, 48px-or-larger touch targets, visible keyboard focus, semantic headings, and status icons paired with text. It never uses color as the only status signal. Camera confirmation is a full-screen step with explicit actions instead of a small modal. Text remains usable at 200% zoom, motion is reduced when requested, and the reminder can be read aloud with the browser’s text-to-speech support.

Steady is an adherence and communication tool. It does not provide medical advice, check interactions, or recommend dosages. In this portfolio deployment, caregivers on another device can see that a dose was confirmed but cannot retrieve the senior device’s photo.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Steady currently requires no API keys. Cloudflare D1 is provided through the
`DB` binding in `wrangler.jsonc`; the database ID in that file identifies the
resource but does not authorize access. Keep local values in `.env.local`,
which is ignored by Git. If a future server-side secret is needed in
production, add it with `wrangler secret put NAME` rather than committing it.

Open the local URL shown in the terminal. The senior experience is at `/`; the caregiver experience is at `/caregiver`.

Useful checks:

```bash
npm run build
npm run lint
```

## Deploy to Cloudflare

Authenticate Wrangler, apply the D1 migrations, and deploy:

```bash
npx wrangler login
npx wrangler d1 migrations apply steady-db --remote
npm run deploy
```

Pushing to GitHub does not deploy or modify the live Worker. This repository
does not include an automatic GitHub deployment workflow, so production only
changes when `npm run deploy` is run by an authenticated maintainer.
