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
