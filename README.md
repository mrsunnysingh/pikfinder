# Pik Finder

A designer-focused asset discovery platform. Search millions of free, copyright-free
images and use a growing toolkit of in-browser design utilities — all free, no sign-up
required.

## Features

- **Image search** — copyright-free images from public sources, with smart filters
  (orientation, color, style, usage) and infinite scroll.
- **Color palette extractor** — pull a palette (HEX / RGB) from any image, one-click copy.
- **Font pairing** — curated heading + body pairings with copyable CSS.
- **Background Generator** — gradients, mesh gradients, and abstract backgrounds; export PNG.
- **Gradient Generator** — design gradients and export as CSS or SVG.
- **Duotone Studio** — turn any photo into a two-tone graphic.
- **JSON Viewer** — format and explore JSON in a collapsible tree.
- **Accounts** — email/password (with verification) and Google sign-in; save favorites,
  collections, and search/download history.
- **Dashboard** — personalized home, saved items, and history.
- **Light / dark mode**, responsive design, and toast notifications.

## Tech stack

- **React 19** + **Vite**
- **React Router**
- **Firebase** (Authentication + Cloud Firestore)
- **Framer Motion** (animations)
- **Phosphor Icons**

## Getting started

### Prerequisites
- Node.js 18+
- A Firebase project (Authentication + Firestore enabled)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
#    then fill in your Firebase config (and optional keys) in .env

# 3. Run the dev server
npm run dev
```

### Environment variables

All configuration lives in `.env` (never committed). See `.env.example` for the full list:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase web app config (required) |
| `VITE_CONTACT_ENDPOINT` | Optional Google Apps Script URL for the contact form |
| `VITE_PAYPAL_ME` | Optional PayPal.me username for the support page |
| `VITE_SUPPORT_URL` | Optional fallback support/donation URL |

### Firebase setup

1. **Authentication -> Sign-in method:** enable **Email/Password** and **Google**
   (set a support email on the Google provider).
2. **Authentication -> Settings -> Authorized domains:** add your deployment domain.
3. **Firestore Database:** create it, then publish the rules in `firestore.rules`
   (`firebase deploy --only firestore:rules`).

### Contact form (optional)

To receive contact submissions by email and in a spreadsheet, follow the setup guide at
the top of `google-apps-script/Code.gs`, then set `VITE_CONTACT_ENDPOINT` in `.env`.

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build to /dist
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## Deployment

```bash
npm run build
firebase deploy        # hosting + firestore rules
```

## Image licensing

Images are aggregated from third-party public repositories (primarily Wikimedia Commons)
and remain under their own respective licenses. Most are public domain or CC0, but some
carry other Creative Commons terms — always verify an image's source license before
commercial use.

## License

This project is proprietary. **All rights reserved.** See [LICENSE](./LICENSE).
The source code, design, and original assets may not be used, copied, modified, or
redistributed without written permission. Third-party images and libraries retain their
own licenses.
