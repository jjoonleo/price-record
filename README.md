# Japan Price Tracker

React Native (Expo + TypeScript) app to record merchandise prices across Japanese stores and compare best buying options by price + distance.

## Features

- Quick capture flow for `product`, `price (JPY)`, `store`, `city area`, `observed time`
- GPS-assisted location capture with manual fallback
- Local SQLite storage (`expo-sqlite`)
- Comparison dashboard with:
  - ranked store cards (`BEST`, `CHEAPEST`, `CLOSEST`)
  - bar chart of latest prices
  - view-only map pins
- History timeline with product/store filtering

## Tech Stack

- Expo Router + TypeScript
- SQLite (`expo-sqlite`)
- Location (`expo-location`)
- Maps (`react-native-maps`)
- Charts (native React Native custom bar chart)
- State (`zustand`)
- Validation (`zod`)

## Local Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run start
   ```
3. Open on iOS/Android via Expo.

## Storybook (Native + Web)

Native Storybook uses an environment switch:

- App mode (default): `npm run start`
- Storybook mode: `EXPO_PUBLIC_STORYBOOK_ENABLED=true npm run start`

Convenience commands:

```bash
npm run storybook:native
npm run storybook:ios
npm run storybook:android
npm run storybook:web
npm run storybook:build
npm run storybook:test
```

Output paths:

- Web Storybook static build: `storybook-static/`

Notes:

- Storybook setup is local-only in this phase (no hosted deployment flow configured).
- Core stories live under `src/components/**/*.stories.tsx`.
- Shared story fixtures live under `src/storybook/fixtures/`.
- First-time interaction tests require Playwright browser install:
  - `npx playwright install chromium`

## Webapp PWA Build

Use the webapp build pipeline for installable/offline-ready web output:

```bash
npm run build:webapp
```

Build artifact:

- `web-build/`

Versioned cache invalidation:

- Bump `version` in `package.json` before production deploy.
- The service worker cache namespace is tied to package version.

Static-host deployment requirements:

- Serve `sw.js` with `Cache-Control: no-cache`.
- Serve `manifest.json` with JSON/manifest content type.
- Keep long-cache headers enabled for hashed static assets.

Expected runtime behavior:

- First-ever load requires network.
- Repeat visits (and installed app shell) work offline after initial successful load.

## Google Place Search Setup

Map selection works without a key (pin-only mode).  
To enable place search/autocomplete, create `.env` in project root:

```bash
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
```

Then start Expo normally:

```bash
npx expo start --tunnel --clear
```

## Test

```bash
npm test
```

## Project Layout

- `/app/capture.tsx` quick entry screen
- `/app/compare.tsx` main decision screen
- `/app/history.tsx` timeline/audit screen
- `/src/db` SQLite client, migrations, repositories
- `/src/services` location + ranking logic
- `/src/components` reusable visual components
