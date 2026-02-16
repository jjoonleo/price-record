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

## Search Hook Behavior
Source: `src/hooks/usePlaceSearch.ts`.

Behavior:
- Debounce: 350ms after query change.
- Only executes when `apiStatus.mode === "search-enabled"`.
- Clears suggestions on empty query or pin-only mode.
- On API failure:
- Sets error message.
- Clears suggestions.
- Invokes `onSearchFailure` to allow mode downgrade.

## Native vs Web Map Behavior
### Native (`PlacePickerModal.native.tsx`, `StoreMap.native.tsx`)
- Full-screen modal with interactive `MapView`.
- Marker updates by map press and drag.
- Can center on current location at modal initialization.
- Search suggestions can update marker via place details.

### Web (`PlacePickerModal.web.tsx`, `StoreMap.web.tsx`)
- No interactive map canvas for store picker/map section.
- Uses summary card and list fallback for store display.
- Current location action is still available.

## Environment and Key Setup
Environment variable:
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

Resolution:
- `src/config/env.ts` trims and exposes key.
- `hasGooglePlacesApiKey()` gates search-enabled mode.

Without key:
- App still functions using pin/manual location path.

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
- Place picker logs mode changes and place details failures using `console.warn`.
- Search hook logs API/unknown search errors.

Guideline:
- Keep logs structured and actionable (include reason + context).

## Related Pages
- [Screen Flows and UX States](./Screen-Flows-and-UX-States.md)
- [State, i18n, and Platform Variants](./State-I18n-and-Platform-Variants.md)
- [Release Runbook and Troubleshooting](./Release-Runbook-and-Troubleshooting.md)
