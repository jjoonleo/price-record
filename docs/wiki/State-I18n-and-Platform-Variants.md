# State, i18n, and Platform Variants

## Shared UI State (`zustand`)
Sources:
- `src/state/useFiltersStore.ts`
- `src/features/placePicker/store/createPlacePickerStore.ts`
- `src/features/placePicker/store/placePickerStoreContext.tsx`

Global store shape (`useFiltersStore`):
- `selectedProductId: string | null`
- `selectedCityArea: string | null`
- `selectedStoreId: string | null`
- Setters for each value.
- `clearHistoryStoreFilter()`

Global usage contracts:
- Compare screen owns `selectedProductId` and `selectedCityArea`.
- History screen owns `selectedStoreId` filter chips.
- Compare actions intentionally clear history-store filter when product changes.

Scoped place-picker store shape (`createPlacePickerStore`):
- Session state for search (`apiStatus`, `searchQuery`, `suggestions`, loading/error).
- Selected place state (`coordinates`, `cityArea`, `addressLine`, `suggestedStoreName`, `websiteUri`).
- Location state (`currentLocationCoordinates`, initializing/locating flags, status message).
- Modal/session orchestration (`initialSelectionQuery`, hydration flag, map error).

Scoped usage contracts:
- `PlacePickerModal.native.tsx` and `PlacePickerModal.web.tsx` create a store per modal scope via `PlacePickerStoreProvider`.
- Components keep UI-only state local (sheet animation, map refs, focus panels).
- Feature actions and async orchestration live in `usePlacePickerController` + store actions.

## i18n Model
Sources:
- `src/i18n/translations.ts`
- `src/i18n/useI18n.ts`

Language support:
- `en`, `ko`.

Language detection:
1. Prefer `expo-localization` primary locale.
2. Fallback to `Intl.DateTimeFormat().resolvedOptions().locale`.
3. Default to `en`.
4. Any locale prefix `ko*` maps to Korean, else English.

Translation behavior:
- `t(key, params?)` fetches active language value.
- Missing key in active language falls back to English key.
- Interpolation uses `{{token}}` replacement with provided params.

## Translation Key Lifecycle Requirements
- Every user-facing string in screens/components/services must come from translation keys.
- Add new keys to both `en` and `ko` dictionaries.
- Preserve key names once shipped unless migration/update is coordinated.
- Avoid string concatenation patterns that bypass interpolation.

## Formatting and Locale Behavior
Locale-dependent formatting:
- Currency and date output adapts from current language:
- `ko -> ko-KR`
- `en -> en-US`

Utilities:
- `formatYen`
- `formatObservedAt`
- Date preview formatting inside capture flow.

## Platform Variant Pattern
Variant files used in this project:
- `PlacePickerModal.native.tsx` and `.web.tsx`
- `StoreMap.native.tsx` and `.web.tsx`
- `ObservedDateInput.native.tsx` and `.web.tsx`

Required parity rules:
- Props must stay equivalent across variants.
- Functional output must stay equivalent (same business intent, different platform UX).
- Variant-only behavior must be documented in component-level notes and this wiki where relevant.

## Theme and Design Tokens
Source: `src/theme/tokens.ts`.

Token groups:
- `colors`
- `gradients`
- `radius`
- `spacing`
- `typography`
- `shadows`

Guidelines:
- Reuse tokens instead of one-off hardcoded values.
- Keep semantic color intent aligned (`ink`, `sea`, `coral`, `amber`, `sky`, `slate` families).
- Maintain typography consistency for display/body/mono purposes.

## Related Pages
- [Screen Flows and UX States](./Screen-Flows-and-UX-States.md)
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
- [Glossary](./Glossary.md)
