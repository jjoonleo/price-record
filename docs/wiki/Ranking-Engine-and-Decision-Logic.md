# Ranking Engine and Decision Logic

## Scope
Defines how store candidates are ranked in Compare view and which tags are assigned.

Primary source: `src/services/rankingService.ts`.

## Inputs and Outputs
Input:
- `LatestStorePrice[]` from repository (`storeId`, `storeName`, `cityArea`, coordinates, latest price, observed date).
- Optional user `Coordinates`.

Output:
- `StoreComparison[]` sorted for direct UI render.

## Distance Calculation
Distance function:
- `distanceKmBetween(from, to)` implements Haversine formula.
- Earth radius constant: `6371 km`.
- Output unit: kilometers.

No-location mode:
- If user location is absent, all candidate distances are set to `0`.

## Score Formula
Normalization helper:
- `normalizeValue(value, min, max) = (value - min) / max(1, max-min)`.

Per-store score:
- `score = 0.75 * normalizedPrice + 0.25 * normalizedDistance`.

Interpretation:
- Lower score is better.
- Price has 3x relative influence versus distance.

## Sorting and Tie Handling
Sort order:
1. `score` ascending.
2. `latestPriceYen` ascending if score ties.

Implication:
- If two stores have equal composite score, lower price wins.

## Tag Assignment Rules
Tags are assigned in this order:
1. `CHEAPEST` to first candidate with minimum `latestPriceYen`.
2. `CLOSEST` to first candidate with minimum `distanceKm`, only if user location exists.
3. Sort comparisons.
4. `BEST` to rank #1 after sorting.

Properties:
- A store can have multiple tags.
- Duplicate tags are prevented via `attachTag`.

## Determinism Guarantees
For the same input rows and same location context, output ordering and tags are deterministic because:
- Normalization and scoring are pure functions.
- Sorting criteria are fixed.
- Tag selection uses deterministic first-match semantics.

## Test-Backed Invariants
Current tests in `src/services/__tests__/rankingService.test.ts` validate:
- Realistic distance range sanity check.
- Sorted ranking monotonicity by score.
- `BEST` tag assignment on top-ranked candidate.
- No-location fallback emphasizing price and zero distances.

Related latest-row tests:
- `src/db/repositories/__tests__/priceEntriesRepo.test.ts` validates latest-entry tie handling by `observedAt` then `createdAt`.

## Edge Cases
- Empty input returns empty output.
- Single store always becomes `BEST`.
- Equal prices across stores collapse price normalization to denominator `1` guard.
- Equal distances collapse distance normalization to denominator `1` guard.

## Change Safety Requirements
When modifying ranking logic:
- Update this document in same change.
- Add/adjust unit tests for score/tag/tie behavior.
- Keep backward-compatible interpretation unless product decision explicitly changes ranking policy.

## Related Pages
- [Domain Model and Data Lifecycle](./Domain-Model-and-Data-Lifecycle.md)
- [Testing, QA, and Regression Checklist](./Testing-QA-and-Regression-Checklist.md)
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
