# Contributing Workflow

## Contribution Principles
- Keep changes minimal, explicit, and aligned with existing architecture boundaries.
- Prefer root-cause fixes over UI-level patching.
- Keep storage, ranking, and platform parity behavior deterministic.

## Branch and PR Conventions
- Use focused branches per change theme (feature/fix/docs).
- Keep PR scope narrow enough for reliable review and regression testing.
- Include clear title and summary:
- problem statement
- approach
- risk/impact areas
- validation performed

## Commit Hygiene
- Keep commits logically grouped and reviewable.
- Avoid mixing unrelated refactors with behavior changes.
- Ensure commit messages state intent, not only files changed.

## Required PR Content
- What changed and why.
- Which layers were touched (`app`, `services`, `repositories`, `db`, `components`).
- Test evidence (`npm test` and manual regression notes).
- Any migration impact.
- Any translation key additions.
- Wiki page updates for architecture or behavior changes.

## Code Ownership Hints by Area
- `app/*`: screen orchestration and user flows.
- `src/components/*`: reusable UI blocks and platform variants.
- `src/services/*`: ranking/location/places business logic.
- `src/db/repositories/*`: query semantics and contracts.
- `src/db/*`: storage runtime and migration discipline.
- `src/i18n/*`: language keys and translation behavior.
- `src/state/*`: shared filter state and cross-screen coordination.
- `src/theme/*`: design tokens and global visual primitives.

## When to Update Which Wiki Page
| Change | Wiki Pages to Update |
|---|---|
| New route/screen behavior | `Screen-Flows-and-UX-States.md`, `Architecture-Overview.md` |
| Repository query/ordering/schema change | `Database-and-Repositories.md`, `Domain-Model-and-Data-Lifecycle.md` |
| Ranking/model formula changes | `Ranking-Engine-and-Decision-Logic.md`, `Testing-QA-and-Regression-Checklist.md` |
| Location/search/map behavior changes | `Location-Maps-and-Places-Integration.md`, `Release-Runbook-and-Troubleshooting.md` |
| Shared state/i18n/token updates | `State-I18n-and-Platform-Variants.md` |
| Process/policy updates | `Developer-Rules-and-Engineering-Standards.md`, this page |

## Review Expectations
- Reviewers should verify architecture boundary compliance first.
- Reviewers should challenge hidden coupling, non-deterministic ordering, and missing tests.
- Reviewers should reject PRs that bypass migration/test/wiki requirements for affected areas.

## Merge Gate (Minimum)
- [ ] Tests pass.
- [ ] Manual checklist for affected flow completed.
- [ ] `MUST` rules satisfied.
- [ ] Wiki updated where applicable.

## Related Pages
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
- [Testing, QA, and Regression Checklist](./Testing-QA-and-Regression-Checklist.md)
- [GitHub Wiki Publish Guide](./GitHub-Wiki-Publish-Guide.md)
