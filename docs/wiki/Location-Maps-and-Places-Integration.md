# Location, Maps, and Places Integration

## Scope
This page defines location capture, reverse geocoding, map behavior, Google Places integration, and fallback rules.

## Location Service Contract
Source: `src/services/locationService.ts`.

`captureCurrentLocation()` returns one of:
- `status: "granted"` with `coordinates`, `cityArea`, optional `addressLine`.
- `status: "denied"` with localized user-facing message.
- `status: "error"` with error message.

Flow:
1. Request foreground permission.
2. If denied, return actionable fallback message.
3. If granted, read current position (`Accuracy.Balanced`).
4. Reverse geocode coordinates for area/address metadata.

## Reverse Geocode Rules
City-area derivation precedence:
1. `district`
2. `subregion`
3. `city`
4. `region`
5. `"Unknown area"`

Address-line derivation:
- Join available `street` and `name` values with comma.
- If none, omit address line.

## Places API Integration Contract
Source: `src/services/placesService.ts`.

Key concepts:
- `search-enabled`: API key available and search path active.
- `pin-only`: search disabled, map pin/manual selection remains available.

Pin-only reasons:
- `missing-key`
- `request-failed`
- `quota-exceeded`
- `request-denied`

API calls:
- Autocomplete endpoint: `POST https://places.googleapis.com/v1/places:autocomplete`
- Details endpoint: `GET https://places.googleapis.com/v1/places/{placeId}`

Search behavior:
- Empty query returns empty result set.
- Missing key returns empty result set.
- HTTP/network errors raise `PlacesApiError` with normalized reason.

## Place-Picker Feature State Behavior
Sources:
- `src/features/placePicker/store/createPlacePickerStore.ts`
- `src/features/placePicker/hooks/usePlacePickerController.ts`

Behavior:
- Debounce: 350ms after query change (`PLACE_SEARCH_DEBOUNCE_MS`).
- Search executes only when `apiStatus.mode === "search-enabled"`.
- Suggestions clear on empty query or pin-only mode.
- Quota/denied failures downgrade mode to pin-only with normalized reason.
- Search/details/location async behavior is orchestrated by controller + scoped store actions (not component-local state).

## Native vs Web Map Behavior
### Native (`PlacePickerModal.native.tsx`, `StoreMap.native.tsx`)
- Full-screen modal with interactive `MapView`.
- Place marker syncs from feature-selected coordinates.
- Current-location action can center map and update user marker state.
- Search suggestions can update marker via place details.

### Web (`PlacePickerModal.web.tsx`, `StoreMap.web.tsx`)
- Full-screen modal with interactive Google Maps JavaScript API map in place picker.
- Selected-place marker and current-location marker are managed via map refs.
- Current location action can re-center map and keep search/pin-only fallback behavior.
- `StoreMap.web.tsx` remains a non-interactive list fallback for compare screen.

## Environment and Key Setup
Environment variable:
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY`

Resolution:
- `src/config/env.ts` trims and exposes keys.
- `hasGooglePlacesApiKey()` gates search-enabled mode.
- `hasGoogleMapsWebApiKey()` gates web map script loading.

Without key:
- Missing Places key: app still functions using pin/manual location path.
- Missing web Maps key: web map surfaces fail gracefully and do not crash the app.

## Failure Mode Matrix
| Failure | System Behavior | User Path |
|---|---|---|
| Location permission denied | `captureCurrentLocation` returns `denied` | User continues with manual place selection |
| Location fetch error | `captureCurrentLocation` returns `error` | UI shows status; user can retry or map-pick |
| Missing Places key | Initial mode becomes `pin-only/missing-key` | Search input disabled, pin/manual selection active |
| Places quota exceeded | Mode downgrades to `pin-only/quota-exceeded` | User continues with pin/manual selection |
| Places request denied | Mode downgrades to `pin-only/request-denied` | User continues with pin/manual selection |
| Places network failure | Error surfaced, may remain search-enabled | User can retry search or continue manually |

## Observability Signals
Current logs:
- Places/location failures surface as feature-state error/status messages in the picker.
- No dedicated telemetry pipeline yet; console logging should be added only with actionable context.

Guideline:
- Keep logs structured and actionable (include reason + context).

## Related Pages
- [Screen Flows and UX States](./Screen-Flows-and-UX-States.md)
- [State, i18n, and Platform Variants](./State-I18n-and-Platform-Variants.md)
- [Release Runbook and Troubleshooting](./Release-Runbook-and-Troubleshooting.md)
