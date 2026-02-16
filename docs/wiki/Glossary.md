# Glossary

## Domain Terms
## Product
A merchandise item being tracked (for example a snack or household good).  
Identity is normalized by trimmed, lowercased, whitespace-collapsed name.

## Store
A place where products are observed.  
Identity is based on store name + city area + near-equal coordinates.

## Price Entry
An immutable observation record linking one product and one store with:
- observed date
- price in JPY
- created timestamp

## Observed Date (`observedAt`)
The day the price was seen.  
Used as the primary ordering key for “latest” logic.

## Created Timestamp (`createdAt`)
Insertion timestamp used for tie-breaks when observed date matches.

## Latest Price by Store
For a product, one selected row per store:
1. greatest `observedAt`
2. then greatest `createdAt`

## Compare
Screen that ranks store candidates for a selected product and optional city-area filter.

## History
Screen that lists captured entries in reverse chronological order.

## Capture
Screen used to record a new price entry with required place selection.

## City Area
Human-readable location bucket used for filtering and context.
Derived from reverse geocode precedence (`district`, `subregion`, `city`, `region`, fallback).

## Place Selection
Payload returned from place picker:
- coordinates
- city area
- optional address line
- optional suggested store name

## Store Comparison
Derived output model containing:
- latest price
- distance from user (or zero in no-location mode)
- score
- tags

## Score
Composite ranking metric:
- `0.75 * normalizedPrice + 0.25 * normalizedDistance`
- Lower is better.

## Tags
## `BEST`
Top ranked store after sorting by score (then price tie-break).

## `CHEAPEST`
Store with minimum latest price.

## `CLOSEST`
Store with minimum distance when user location is available.

## Pin-Only Mode
Places-search-disabled mode where map/manual location selection is still available.

## Platform Variants
Parallel component files for platform-specific UI:
- `.native.tsx`
- `.web.tsx`

## Related Pages
- [Domain Model and Data Lifecycle](./Domain-Model-and-Data-Lifecycle.md)
- [Ranking Engine and Decision Logic](./Ranking-Engine-and-Decision-Logic.md)
- [Location, Maps, and Places Integration](./Location-Maps-and-Places-Integration.md)
