# Database and Repositories

## Storage Strategy
- Native (`iOS`/`Android`): `expo-sqlite` database file `japan-price-tracker.db`.
- Web: JSON-like `WebDb` persisted in `localStorage` key `japan-price-tracker-web-db-v1`; in-memory fallback when storage unavailable.

## SQLite Migration Model
Source: `src/db/migrations.ts`.

Current migration version:
- `LATEST_DB_VERSION = 1`.

Flow:
1. Read `PRAGMA user_version`.
2. Apply migration blocks for versions above current.
3. Set `PRAGMA user_version = LATEST_DB_VERSION`.
4. Skip entirely on web platform.

## Schema (v1)
### `products`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `normalized_name TEXT NOT NULL UNIQUE`
- `created_at TEXT NOT NULL`

### `stores`
- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `latitude REAL NOT NULL`
- `longitude REAL NOT NULL`
- `city_area TEXT NOT NULL`
- `address_line TEXT`
- `created_at TEXT NOT NULL`

### `price_entries`
- `id TEXT PRIMARY KEY`
- `product_id TEXT NOT NULL`
- `store_id TEXT NOT NULL`
- `price_yen INTEGER NOT NULL`
- `observed_at TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- Foreign keys:
- `product_id -> products(id) ON DELETE CASCADE`
- `store_id -> stores(id) ON DELETE CASCADE`

## Indexing Rationale
- `idx_products_normalized_name`: fast product dedupe lookups.
- `idx_stores_identity`: fast store identity checks on `(name, city_area, latitude, longitude)`.
- `idx_price_entries_product_time`: fast latest-by-product reads.
- `idx_price_entries_store_product`: fast store/product retrieval ordering.
- `idx_stores_city_area`: efficient area filtering.

## Repository Contracts
### `productsRepo`
- `getOrCreateProduct(name)`:
- Rejects blank names.
- Normalizes before lookup.
- Returns existing row if normalized identity exists.
- `listProductOptions(query?)`:
- Returns sorted by `entryCount DESC`, then `name ASC`.
- Supports fuzzy filter by display name or normalized value.
- `getProductById(id)`: nullable lookup.

### `storesRepo`
- `getOrCreateStore(input)`:
- Rejects blank store name/city area.
- Dedupes by case-insensitive name + city area + coordinate tolerance.
- `listCityAreas()`:
- Returns grouped areas sorted by count desc, then name asc.
- `listStores(cityArea?)`:
- Optional exact city-area filter.
- Sorts alphabetically by store name.

### `priceEntriesRepo`
- `createPriceEntry(input)` inserts immutable observation row.
- `getLatestStorePricesByProduct(productId, cityArea?)`:
- One row per store for given product.
- Row selection ordered by latest observed then latest created.
- Output sorted by lowest price then store name.
- `listHistoryEntries(filters)`:
- Optional product/store filters.
- Sort descending by observed date, then created date.
- Safe limit clamped to range `1..500`.
- `selectLatestByStore(rows)`:
- Pure helper to keep newest row per store; covered by tests.

## Web Store Behavior
Source: `src/db/webStore.ts`.

Rules:
- Parse failures reset to empty safe default structure.
- Updates are copy-on-write (`updateWebDb`) to avoid mutating shared references.
- `createWebEntryId()` uses shared ID generation utility.

## Query and Ordering Guarantees
- Latest-store logic always applies observed-date precedence over created timestamp.
- History ordering always deterministic by timestamps.
- Product/stores option lists are intentionally stable sorted outputs.

## Constraints for Future Migrations (Required)
- Increment `LATEST_DB_VERSION` for every schema change.
- Add additive/compatible migration blocks when possible.
- Never alter existing migration SQL in-place once released.
- Keep web fallback model behaviorally compatible with native schema semantics.
- Preserve ordering and dedupe contracts in repository output.

## Related Pages
- [Domain Model and Data Lifecycle](./Domain-Model-and-Data-Lifecycle.md)
- [Architecture Overview](./Architecture-Overview.md)
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
