# Steady

Steady is a mobile-first medication reminder designed for seniors and the people who care for them. The senior experience answers three questions at a glance: what medicine is next, when is it due, and has it been taken? The caregiver experience adds schedule management and a lightweight adherence history without turning daily care into surveillance.

## Who it is for

- Seniors who benefit from large text, simple language, generous touch targets, and one obvious action at a time.
- Family caregivers who want reassurance that scheduled medication was taken without having to call every day.

## What the demo includes

- A senior home screen with the next dose, a large **I took it** action, camera capture, photo review, confirmation, and spoken reminder support.
- A clear daily medication schedule using both text and icons for status.
- A caregiver dashboard with today’s schedule, adherence summaries, missed-dose indicators, medication management, history, and a senior-device link.
- Seeded demo data for Evelyn and her caregiver Maya.
- Durable medication and dose records in Cloudflare D1, with confirmation photos stored in R2 when deployed through Sites.

## Accessibility decisions

The senior view uses an 18px base font, high-contrast ink and cream colors, 48px-or-larger touch targets, visible keyboard focus, semantic headings, and status icons paired with text. It never uses color as the only status signal. Camera confirmation is a full-screen step with explicit actions instead of a small modal. Text remains usable at 200% zoom, motion is reduced when requested, and the reminder can be read aloud with the browser’s text-to-speech support.

Steady is an adherence and communication tool. It does not provide medical advice, check interactions, or recommend dosages.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. The senior experience is at `/`; the caregiver experience is at `/caregiver`.

Useful checks:

```bash
npm run build
npm run lint
```
