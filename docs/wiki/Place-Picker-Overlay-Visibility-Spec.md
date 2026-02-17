# Place Picker Overlay Visibility Spec

## Summary
Interactive overlay visibility is state-managed in the existing Place Picker Zustand store across native and web.

Scope:
- Place info sheet visibility.
- Search suggestion panel request visibility.

## 1) State Definitions
- `ui.isPlaceInfoVisible: boolean`
- `ui.isSearchFocused: boolean`
- `ui.keepSuggestionPanelVisible: boolean`
- `ui.suppressNextSearchBlur: boolean`
- `ui.suppressMapTapUntilMs: number`

## 2) Derived Visibility Rules
- `isSuggestionPanelRequested = apiStatus.mode === 'search-enabled' && (ui.isSearchFocused || ui.keepSuggestionPanelVisible)`
- `isSuggestionPanelRendered = isSuggestionPanelRequested && (isSearchLoading || suggestions.length > 0)`
- `isPlaceInfoSheetRendered = ui.isPlaceInfoVisible`
- `shouldIgnoreMapTap(nowMs) = nowMs < ui.suppressMapTapUntilMs`

## 3) Place Info Sheet Cases
| Case | Trigger | Preconditions | Result |
|---|---|---|---|
| P1 | Session initialize | `showPlaceInfoInitially=true` | `isPlaceInfoVisible=true` |
| P2 | Session initialize | `showPlaceInfoInitially=false` | `isPlaceInfoVisible=false` |
| P3 | Marker press | `hasPlaceInfo=true` | `isPlaceInfoVisible=true`, search UI hidden |
| P4 | Marker press | `hasPlaceInfo=false` | no change |
| P5 | Suggestion selected (new or same place) | details fetch success or fallback | `isPlaceInfoVisible=true`, search UI hidden |
| P6 | Map press | `shouldIgnoreMapTap=false` | `isPlaceInfoVisible=false`, search UI hidden |
| P7 | Map press | `shouldIgnoreMapTap=true` | no change |
| P8 | Search submit | always | `isPlaceInfoVisible=false` |
| P9 | Sheet close button | always | `isPlaceInfoVisible=false` |
| P10 | Sheet drag release | hide threshold met | `isPlaceInfoVisible=false` |
| P11 | Sheet drag release | hide threshold not met | `isPlaceInfoVisible=true` |
| P12 | Modal close/back | always | reset to closed for next mount |
| P13 | Re-open modal | new session start | visibility follows P1/P2 only |

## 4) Search Suggestion Panel Cases
| Case | Trigger | Preconditions | Result |
|---|---|---|---|
| S1 | Search focus | API search-enabled | `isSearchFocused=true`, `keepSuggestionPanelVisible=false` |
| S2 | Search submit | API search-enabled | `keepSuggestionPanelVisible=true` |
| S3 | Search blur | `suppressNextSearchBlur=false` | `isSearchFocused=false` |
| S4 | Search blur | `suppressNextSearchBlur=true` | blur ignored once, `suppressNextSearchBlur=false` |
| S5 | Search clear | always | `keepSuggestionPanelVisible=false` |
| S6 | Hide search UI action | map press/marker press/suggestion selected/back | `isSearchFocused=false`, `keepSuggestionPanelVisible=false`, `suppressNextSearchBlur=false` |
| S7 | Suggestion press-in | always | `suppressNextSearchBlur=true`, `suppressMapTapUntilMs=now+350ms` |
| S8 | API mode changes to pin-only | always | panel forced hidden via derived selector |
| S9 | Requested visible but no data | `!isSearchLoading && suggestions.length===0` | not rendered (requested=true, rendered=false) |
| S10 | Loading | `isSearchLoading=true` and requested | rendered with loader |
| S11 | Suggestions available | `suggestions.length>0` and requested | rendered with list |
| S12 | Modal close/reopen | new session start | `isSearchFocused=false`, `keepSuggestionPanelVisible=false` |

## 5) Cross-Case Guarantees
- Selecting the same suggestion repeatedly must still reopen/keep the place info sheet visible (P5).
- Suggestion tap must not be immediately canceled by touch-through map tap (S7 + P7).
- Visibility rules must match on native and web.
