# Release Runbook and Troubleshooting

## Local Runbook
## Prerequisites
- Node.js and npm installed.
- Expo tooling available through project scripts.
- Device simulator/emulator or Expo Go-compatible device.

## Install
```bash
npm install
```

## Run App
```bash
npm run start
```

Additional scripts:
```bash
npm run ios
npm run android
npm run web
```

## Test
```bash
npm test
```

## Configuration
Environment variable for Places search:
```bash
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
```

Behavior without key:
- App remains functional in pin/manual location mode.
- Place search/autocomplete is disabled.

## Release Readiness Checklist
- [ ] Automated tests pass.
- [ ] Manual regression checklist completed for affected screens.
- [ ] Localization keys updated in both languages.
- [ ] Any schema/data change includes migration and compatibility review.
- [ ] Wiki pages updated for changed behavior.

## Common Failures and Fixes
## Startup initialization failed / timeout
Symptoms:
- Bootstrap error state shown before tabs.

Checks:
- Confirm local environment is stable and app restarted.
- Re-run app and use retry action.
- Check migration code path for recent schema edits.

## Compare shows no results
Symptoms:
- Empty comparison state despite expected data.

Checks:
- Confirm selected product has entries captured.
- Confirm city area filter is not over-restrictive.
- Verify latest-row query semantics if repository changes were made.

## Location not available
Symptoms:
- Distance status shows denied/error.

Checks:
- Confirm OS permission granted for location.
- Retry location refresh in Compare.
- Continue with no-location ranking fallback (price-dominant model).

## Place search disabled
Symptoms:
- Search input disabled and pin-only message shown.

Checks:
- Verify `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` is configured and non-empty.
- Validate API key restrictions/billing if request denied.
- Handle quota limits by continuing with pin/manual path.

## History missing expected entries
Symptoms:
- Timeline appears empty or incomplete.

Checks:
- Clear product/store filters.
- Confirm entries saved successfully in Capture.
- Verify filter IDs are still valid (screen auto-clears stale IDs on focus).

## Incident Response (User-Facing Regression)
1. Reproduce with exact route and filter state.
2. Identify whether issue is UI state, service logic, or repository/query path.
3. Add/adjust targeted test before fix merge where possible.
4. Validate both native and web behavior if shared logic was touched.
5. Update wiki page(s) impacted by behavior change.

## Related Pages
- [Testing, QA, and Regression Checklist](./Testing-QA-and-Regression-Checklist.md)
- [Database and Repositories](./Database-and-Repositories.md)
- [Location, Maps, and Places Integration](./Location-Maps-and-Places-Integration.md)
