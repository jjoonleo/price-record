# Domain Model and Data Lifecycle

## Canonical Types
Source: `src/types/domain.ts`.

### Core Entities
- `Product`: `id`, `name`, `normalizedName`, `createdAt`.
- `Store`: `id`, system `name`, optional user `nickname`, `latitude`, `longitude`, `cityArea`, `addressLine`, `createdAt`.
- `PriceEntry`: `id`, `productId`, `storeId`, `priceYen`, `observedAt`, `createdAt`.

### Read Models / UI Models
- `ProductOption`: product option + `entryCount` for chips and suggestions.
- `HistoryEntry`: denormalized timeline row with product/store names.
- `LatestStorePrice`: repository-level latest row per store for selected product.
- `StoreComparison`: ranked store output with `distanceKm`, `score`, and `tags`.

### Support Types
- `Coordinates`: latitude/longitude tuple.
- `PlaceSelection`: map-picked place payload (`cityArea`, required `addressLine`, optional `suggestedStoreName`).
- `StoreComparisonTag`: `BEST | CHEAPEST | CLOSEST`.

## Entity Lifecycle
## 1. Capture Input
`app/capture.tsx` collects:
- Store/place selection first (saved stores or new place).
- System store name (auto-set from saved store or selected place).
- Optional store nickname.
- Product name.
- Price JPY.
- Place/map selection (required before save).
- Observed date.

Validation boundaries:
- Zod schema enforces non-empty text values.
- `priceYen` must be positive integer.
- latitude/longitude range must be valid.
- system store name and address must exist after location selection.
- location selection (`hasMapSelection`) is mandatory before schema parse.

## 2. Normalization and Deduplication
### Product identity
- `normalizeProductName(input)`:
- Trim.
- Lowercase.
- Collapse whitespace to single spaces.
- Unique key stored as `normalized_name` in SQLite.

### Store identity
Store dedupe key:
- Case-insensitive system store name (`lower(name)`).
- Exact city area string.
- Coordinate proximity tolerance (`abs(lat diff) < 0.0001` and `abs(lon diff) < 0.0001`).

Nickname is metadata and does not affect identity.

## 3. Persistence
Save sequence:
1. `getOrCreateProduct`.
2. `getOrCreateStore`.
3. `createPriceEntry`.

`observedAt` is saved as date-only ISO string derived from local calendar date in capture flow.

## 4. Read Paths
### Compare path
- Query latest observation per store for a selected product (and optional area filter).
- Convert rows into `StoreComparison` by applying ranking logic.

### History path
- Query timeline rows with optional product/store filters.
- Sort descending by observed date, then created timestamp.
- Limit to safe max (`<= 500`, default smaller per caller).

## Latest-Per-Store Semantics
When multiple entries exist for one store+product, latest row selection uses:
1. Most recent `observedAt`.
2. If equal `observedAt`, most recent `createdAt`.

This is implemented both:
- In SQL (`ROW_NUMBER ... ORDER BY datetime(observed_at) DESC, datetime(created_at) DESC`).
- In web fallback selection logic.

## Comparison and Tag Model
`StoreComparison` fields are derived, not persisted:
- `distanceKm`: user-location based or `0` without location.
- `score`: weighted normalized metric.
- `tags`: assigned by ranking service:
- `CHEAPEST` for min price row.
- `CLOSEST` for min distance row when user location exists.
- `BEST` for sorted rank #1 row.

## Invariants
- Every `PriceEntry` references existing `Product` and `Store` (foreign keys in native DB).
- Product names are normalized consistently before insert.
- Store display label uses nickname when present; otherwise system name.
- Store comparisons are deterministic for same inputs.
- History output always includes user-readable product/store labels (fallback to “Unknown ...” in web missing-reference edge cases).

## Related Pages
- [Database and Repositories](./Database-and-Repositories.md)
- [Ranking Engine and Decision Logic](./Ranking-Engine-and-Decision-Logic.md)
- [Screen Flows and UX States](./Screen-Flows-and-UX-States.md)
