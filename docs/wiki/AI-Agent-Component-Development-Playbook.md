# AI Agent Component Development Playbook

## Purpose
Use this page when asking an AI coding agent to refactor or build UI components with strong architecture boundaries, high readability, and reliable test coverage.

This playbook mirrors the place-picker micro-component refactor pattern used in this repository.

## When to Use
- Large UI file is hard to read or review.
- UI and business logic are coupled in the same component.
- Native and web variants need parity with platform-specific map/input behavior.
- You want an "at-a-glance" structural blueprint for fast onboarding.

## Non-Negotiable Rules for the Agent
- Keep external component contracts unchanged unless explicitly requested.
- Split business state/effects into feature/store/controller layers.
- Keep presentational components callback-driven and side-effect free.
- Use small semantic components that map directly to visible screen regions.
- Keep platform parity between `.native` and `.web` variants.
- Add or update deterministic tests for changed behavior.
- Update wiki pages for new architecture boundaries and discoverability.

## Recommended Prompt Template
Use this template as-is and replace placeholders:

```md
PLEASE IMPLEMENT THIS PLAN:

# [Feature Name] UI Micro-Componentization

## Goal
Refactor [target files] into small semantic UI components.
Keep feature state and async orchestration in [store/controller files].

## Hard Constraints
1. No external API changes for:
   - [public component files + props/callbacks]
2. UI/feature split:
   - Feature owns business state, async calls, fallback mode transitions.
   - UI owns animation, focus, refs, keyboard, platform map primitives.
3. Keep behavior parity across native and web.
4. Add tests for new presentational components and key orchestration regressions.

## File Plan
- Create `src/components/[feature]/*` micro-components (1 screen region per file).
- Keep wrapper components thin and composition-focused.
- Add `LayoutBlueprint.web.tsx` that represents semantic anatomy at a glance.
- Export all UI parts via `src/components/[feature]/index.ts`.

## Test Plan
1. Rendering states for status/suggestions/details components.
2. Composition test for info sheet + confirm callback.
3. Blueprint structure test.
4. Existing feature/store tests remain green.

## Acceptance Criteria
- External props and callback contracts unchanged.
- New UI components are readable and semantically named.
- `npx tsc --noEmit` passes.
- `npm test -- --runInBand` passes.
- Wiki updated with blueprint path and usage guidance.
```

## Execution Checklist for Agent
1. Inspect current wrappers and map all UI sections.
2. Identify business logic to keep in feature layer (store/controller).
3. Extract presentational sections into micro-components under `src/components/[feature]/`.
4. Keep composition order in wrapper matching visual screen stack.
5. Add/keep a web layout blueprint file for anatomy scanning.
6. Add/update tests for each new UI section and composition behavior.
7. Run typecheck and full tests before finalizing.
8. Update wiki links so new developers can discover the blueprint and architecture rules quickly.

## Storybook Workflow (Native + Web)
- Add story files beside components as `*.stories.tsx` under `src/components/**`.
- Reuse shared mock data from `src/storybook/fixtures/*` instead of duplicating fixture objects per story.
- For native on-device rendering, run Storybook mode with:
  - `EXPO_PUBLIC_STORYBOOK_ENABLED=true npm run start`
  - or shortcut scripts `npm run storybook:native`, `npm run storybook:ios`, `npm run storybook:android`
- For browser rendering, run `npm run storybook:web`.
- Add `play` functions on interactive stories (buttons/chips/cards) so `npm run storybook:test` validates behavior.
- Keep stories focused on reusable components first; add screen-level stories only when intentionally requested.

## Anti-Patterns to Avoid
- Reintroducing API/service calls inside presentational UI components.
- Adding cross-cutting styles in one mega stylesheet.
- Coupling map-click handlers to suggestion-click flow without propagation guards.
- Refactoring without regression tests for suggestion/select/confirm flows.

## Place Picker Reference (Current Repository Pattern)
- Wrappers:
  - `src/components/PlacePickerModal.native.tsx`
  - `src/components/PlacePickerModal.web.tsx`
- Micro UI folder:
  - `src/components/placePicker/`
- Feature/store/controller:
  - `src/features/placePicker/store/createPlacePickerStore.ts`
  - `src/features/placePicker/hooks/usePlacePickerController.ts`
- At-a-glance blueprint:
  - `src/components/placePicker/PlacePickerLayoutBlueprint.web.tsx`

## Related Pages
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
- [State, i18n, and Platform Variants](./State-I18n-and-Platform-Variants.md)
- [Screen Flows and UX States](./Screen-Flows-and-UX-States.md)
- [Testing, QA, and Regression Checklist](./Testing-QA-and-Regression-Checklist.md)
