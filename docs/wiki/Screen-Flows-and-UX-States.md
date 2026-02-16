# Screen Flows and UX States

## Navigation and Entry
Routes:
- `app/index.tsx`: immediate redirect to `/compare`.
- `app/_layout.tsx`: tab shell and bootstrap guard.
- Tabs: `capture`, `compare`, `history`.

Startup states before tabs render:
- Loading state: migration in progress.
- Error state: migration/init failed or timed out.
- Retry action re-runs bootstrap sequence.

## Capture Screen (`app/capture.tsx`)
Primary responsibility:
- Create a valid local price observation with required location context.

Key flow:
1. User enters product/price/store/date.
2. User opens place picker and confirms map-based selection.
3. Save validates `hasMapSelection` and `entrySchema`.
4. Repositories resolve product/store identity then insert price entry.
5. UI resets form and shows saved success feedback.

Required states:
- Idle editing.
- Suggestion chips visible when product query has results.
- Save-in-progress (`Saving...`).
- Validation/status message region.
- Modal open/closed state for place picker.

Validation boundaries:
- UI requirement: map selection is mandatory.
- Schema requirement: non-empty product/store/city area, positive integer price, valid coordinates/date.
- Repository requirement: product/store data checks still enforce non-empty constraints.

## Compare Screen (`app/compare.tsx`)
Primary responsibility:
- Recommend the best store now for selected product and area.

Key flow:
1. On focus, load product options and city area options.
2. Auto-select first product if none selected.
3. Fetch latest store prices for selected product and area.
4. Build ranked comparisons with optional user location.
5. Render top recommendation, chart, map/list, and ranked score cards.

Required states:
- No selected product state.
- Loading spinner while comparisons fetch.
- Error message state.
- No-comparisons empty state when product exists but insufficient data.
- Location status line for permission/granted/error outcomes.

Important transitions:
- Product change clears history store filter and reloads comparisons.
- Area change reloads comparisons.
- Location refresh updates `userLocation`, then affects ranking output.

## History Screen (`app/history.tsx`)
Primary responsibility:
- Display chronological audit trail for captured entries.

Key flow:
1. On focus, load products and stores for filter chips.
2. Keep selected filters valid; clear stale IDs if removed.
3. Query filtered history entries with max row limit.
4. Render timeline cards sorted by most recent observation.

Required states:
- Product and store filter chips.
- Entry count summary.
- Empty-history state when no records match filters.
- Timeline list state when entries exist.

## Place Picker Modal Behavior
Capture screen delegates location selection to platform-specific modal:
- Native: interactive map with draggable/press marker and optional Places search.
- Web: search + summary/card flow with current-location action, non-interactive map alternative.

Selection contract:
- Confirm returns `PlaceSelection` payload:
- `latitude`
- `longitude`
- `cityArea`
- optional `addressLine`
- optional `suggestedStoreName`

## UX State Rules
- Every async fetch path must expose clear loading and error states.
- Empty states must include actionable next step guidance.
- Status lines should communicate source of limitation (permission denied, key missing, quota, unavailable).
- Screen-local state and shared filter state must not drift; focus refreshes rehydrate from repositories.

## Related Pages
- [Location, Maps, and Places Integration](./Location-Maps-and-Places-Integration.md)
- [State, i18n, and Platform Variants](./State-I18n-and-Platform-Variants.md)
- [Testing, QA, and Regression Checklist](./Testing-QA-and-Regression-Checklist.md)
