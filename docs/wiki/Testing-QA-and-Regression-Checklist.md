# Testing, QA, and Regression Checklist

## Test Philosophy
- Protect deterministic business behavior first (ranking, latest-row selection, fallback handling).
- Validate cross-platform functional parity (native and web) for core workflows.
- Use targeted unit tests plus manual scenario checks before release.

## Current Automated Test Coverage
### `src/services/__tests__/rankingService.test.ts`
Protects:
- Haversine distance sanity range.
- Deterministic score ordering.
- `BEST` tag assignment.
- No-location fallback behavior.

### `src/db/repositories/__tests__/priceEntriesRepo.test.ts`
Protects:
- Latest-row selection by `observedAt`.
- Tie-break by `createdAt`.
- One-row-per-store selection invariant.

### `src/services/__tests__/placesService.test.ts`
Protects:
- Status-to-failure-reason mapping.
- Empty query search behavior.

### `src/utils/__tests__/placeAutofill.test.ts`
Protects:
- Suggested store-name autofill guard behavior when users manually edit.

## Required Tests by Change Type
### Ranking changes
- `MUST` add/update tests for score weighting, ordering, tags, and tie handling.

### Repository query changes
- `MUST` add/update tests for ordering, dedupe, and latest-row semantics.

### Location/Places changes
- `MUST` add/update tests for failure mapping and fallback-mode transitions.

### Capture autofill/date/validation changes
- `SHOULD` add unit tests for utility behavior and edge cases.

## Manual Regression Checklist
## Capture
- [ ] Open Capture and verify initial defaults load.
- [ ] Verify product suggestion chips appear for typed text.
- [ ] Attempt save without map selection and confirm blocked with status message.
- [ ] Complete place selection and confirm city area/coordinates populate.
- [ ] Save valid entry and confirm success alert + form reset.

## Compare
- [ ] Compare opens as default route.
- [ ] Product chips and city area chips populate from repository data.
- [ ] Empty state appears when no product/comparison data.
- [ ] Location refresh updates status message for granted/denied/error outcomes.
- [ ] Top recommendation, bar chart, map/list, and score cards render with entries.

## History
- [ ] Product/store filters update timeline results.
- [ ] Entry count reflects filtered output.
- [ ] Empty state appears for no matching data.
- [ ] Timeline order is newest observed date first.

## Platform Parity
- [ ] Native place picker map interactions work (press/drag/select/confirm).
- [ ] Web place picker provides functional non-map fallback.
- [ ] Native store map pins and web store list both reflect ranked comparison data.

## Definition of Done Matrix
| Change Type | Unit Tests | Manual Regression | Wiki Update |
|---|---|---|---|
| UI-only copy/layout change | SHOULD | MUST (affected screen) | SHOULD |
| Ranking/service logic change | MUST | MUST (Compare) | MUST |
| Repository/schema change | MUST | MUST (Capture/Compare/History) | MUST |
| Platform-variant change | SHOULD | MUST (both platforms) | MUST |
| Localization key change | SHOULD | MUST (language checks) | SHOULD |

## Test Commands
From project root:
```bash
npm test
```

## Related Pages
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
- [Release Runbook and Troubleshooting](./Release-Runbook-and-Troubleshooting.md)
- [Contributing Workflow](./Contributing-Workflow.md)
