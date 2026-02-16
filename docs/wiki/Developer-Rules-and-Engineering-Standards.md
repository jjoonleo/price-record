# Developer Rules and Engineering Standards

## Scope
These are project policy rules for all contributors.  
Keywords:
- `MUST` = required for approval.
- `SHOULD` = strong default; deviations require explicit rationale.

## Architecture Guardrails
- UI layers (`app/*`, `src/components/*`) `MUST NOT` execute SQL directly.
- UI layers `MUST NOT` bypass repository contracts for persisted data access.
- Business logic `MUST` live in services/utilities and remain unit-testable.
- Repository functions `MUST` encapsulate storage differences (native SQLite vs web fallback).
- Shared state shape changes `MUST` be reflected in all dependent screens.

## Data and Persistence Rules
- Schema changes `MUST` include migration updates in `src/db/migrations.ts`.
- Schema changes `MUST` increment `LATEST_DB_VERSION`.
- Existing released migration SQL blocks `MUST NOT` be rewritten in-place.
- New data access behavior `MUST` preserve deterministic ordering semantics or document intentional changes.
- Cross-platform persistence behavior `MUST` remain semantically compatible between native and web implementations.

## Localization Rules
- New user-facing strings `MUST` be added to both `en` and `ko` translation dictionaries.
- New interpolation placeholders `MUST` use `{{placeholder}}` style consistently.
- Screens/components `MUST NOT` hardcode final user-facing text except temporary debug instrumentation.

## Platform Parity Rules
- Features available on one platform `MUST` have a defined behavior on others.
- If using split files (`.native`/`.web`), prop contracts `MUST` remain equivalent.
- Platform-specific UX differences `SHOULD` preserve the same underlying business outcome.

## Code Placement and Naming
- New screen-level logic `SHOULD` stay in `app/*`; reusable logic `SHOULD` move into `src/*`.
- Data access functions `SHOULD` be named as clear intent verbs (`getOrCreate`, `list`, `create`, `getLatest`).
- Domain models `SHOULD` be declared/extended in `src/types/domain.ts` unless truly feature-local.
- Utilities `SHOULD` be pure where practical and free of UI framework coupling.

## Error Handling and Observability
- User-facing async failures `MUST` surface in an explicit UI state (status text, empty state, or error message).
- Service-layer recoverable failures `SHOULD` include structured logging context (`reason`, query/id where relevant).
- Silent catch blocks `MUST` be avoided unless fallback behavior is intentional and documented.

## Testing Standards
- Logic changes in ranking/repositories/location/place search `MUST` include or update tests.
- Deterministic ordering and tie-break behavior `MUST` have automated coverage.
- New critical branch paths `SHOULD` be validated with both automated and manual regression checks.

## Security and Privacy
- API keys `MUST` stay in environment variables, never committed.
- Local data `SHOULD` remain device/browser local unless architecture changes explicitly introduce sync.
- Debug logging `SHOULD NOT` include sensitive user identifiers or raw secret values.

## PR Readiness Checklist (Pass/Fail)
- [ ] No direct SQL in UI/component layers.
- [ ] Repository/service boundaries are respected.
- [ ] New strings exist in both language dictionaries.
- [ ] Platform parity behavior defined for web and native.
- [ ] Schema/data model changes include migration and compatibility notes.
- [ ] Automated tests updated for modified logic.
- [ ] Manual regression checklist run for affected flows.
- [ ] Wiki pages updated for architecture or behavior changes.

## Related Pages
- [Contributing Workflow](./Contributing-Workflow.md)
- [Testing, QA, and Regression Checklist](./Testing-QA-and-Regression-Checklist.md)
- [Database and Repositories](./Database-and-Repositories.md)
