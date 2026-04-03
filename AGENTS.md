# AGENTS.md

## Purpose
This repository is a Next.js 16 + React 19 + TypeScript frontend for a mobile-first expense-control app.
Agents working here should optimize for visual fidelity, responsiveness, maintainability, and minimal surprise.

## Repo Facts Verified From The Codebase
- Package manager: `npm` (`package-lock.json` exists).
- Framework: Next.js App Router under `src/app/**`.
- Language: TypeScript with `strict: true`.
- Styling: Tailwind CSS v4 via `@import "tailwindcss"` in `src/app/globals.css`.
- Linting: ESLint 9 with `eslint-config-next` core-web-vitals + TypeScript presets.
- Path alias: `@/*` → `src/*`.
- App state: frontend-only, mock-data driven, no backend integration yet.

## Existing Agent Rules Verified
- `.cursor/rules/`: not present
- `.cursorrules`: not present
- `.github/copilot-instructions.md`: not present

## Mandatory Behavior For Agents
- Treat this as a WEB-DESIGN-FIRST repository.
- Prioritize mobile-first UX first, then scale up to tablet/desktop.
- Respect `idea.md` as a constraint, not inspiration.
- Do not invent product behavior that is not specified in `idea.md` or in the user request.
- When behavior is unspecified, keep the UI shell and leave an explicit placeholder.
- Never auto-run builds after edits unless the user explicitly asks.
- For this repo, default to loading design skills on essentially every substantive response/edit:
  - `frontend-design`
  - `responsive-design`
  - any additional relevant design skill such as `ui-ux-pro-max`
- If a task affects layout, styling, interaction, accessibility, or visual hierarchy, load those skills BEFORE editing code.

## Important Project Intent From `idea.md`
- The app should replicate the supplied expense-control screenshots closely.
- The first phase is mock-data UI only.
- The app is mobile-first and later adapted to desktop.
- The shell always includes bottom navigation and a hamburger menu route.
- Missing behavior should be reserved visually, not fabricated logically.

## Source Layout
- `src/app/` — Next.js routes, layouts, metadata, entrypoints.
- `src/app/(shell)/` — main app routes wrapped by the shared shell.
- `src/app/menu/` — overlay/menu route.
- `src/components/screens/` — screen-level UI used by route files.
- `src/components/ui-kit.tsx` — reusable presentational primitives.
- `src/components/app-shell.tsx` — shared navigation shell and FAB/modal behavior.
- `src/lib/mock-data.ts` — mock content until a real data layer exists.
- `src/app/globals.css` — CSS tokens and app-wide utilities.
- `idea.md` — product/design intent; read it before major UI work.

## Commands
### Install
- `npm install`

### Local development
- `npm run dev` — starts Next dev server with webpack.

### Production
- `npm run build` — creates the production build.
- `npm run start` — serves the production build.

### Linting
- `npm run lint` — lint the whole repo.
- `npm run lint -- src/components/app-shell.tsx` — lint a single file.
- `npm run lint -- src/app src/components` — lint selected paths.

### Type checking
- `npx tsc --noEmit` — strict TypeScript verification without emitting files.

### Tests
- There is currently NO test runner configured.
- There is NO `test` script in `package.json`.
- There are NO `*.test.*` or `*.spec.*` files in the repository.
- Therefore:
  - full test command: unavailable
  - single test command: unavailable
- Closest targeted verification available today:
  - `npm run lint -- path/to/file.tsx`
  - `npx tsc --noEmit`

## Architecture And File Conventions
- Keep Next route files thin.
- `page.tsx` files should usually export metadata and delegate rendering to a screen component.
- Use default exports for Next route files (`page.tsx`, `layout.tsx`).
- Use named exports for reusable components and utilities.
- Prefer server components by default.
- Add `"use client"` only when hooks, event handlers, or browser APIs are actually required.
- Keep reusable primitives in `src/components/ui-kit.tsx` or split them into focused files if that kit grows.
- Keep view-specific markup inside `src/components/screens/*`.
- Keep mock/demo content in `src/lib/mock-data.ts` until a real backend exists.

## Code Style
### Imports
- Order imports like this:
  1. framework/external packages
  2. blank line
  3. internal alias imports (`@/...`)
  4. blank line
  5. relative imports only if truly needed
- Prefer alias imports over long relative paths.
- Use `import type` for type-only imports.
- Keep imports grouped, stable, and free of unused entries.

### Formatting
- Match the current codebase style:
  - double quotes
  - semicolons
  - trailing commas where valid
  - multi-line JSX when props/children get dense
- ESLint is the formatter-adjacent source of truth; there is no Prettier config in this repo.
- Prefer readable wrapping over clever one-liners.

### Types
- TypeScript is strict; do not bypass it with `any` unless the user explicitly accepts the tradeoff.
- Prefer explicit prop typing.
- Prefer `type` aliases for component props and small shapes; that matches the repo.
- Use `Readonly<{ ... }>` for layout/page children props when appropriate.
- Use `as const` for intentionally fixed arrays/objects.
- Validate nullable or optional values before rendering.

### Naming
- Components: `PascalCase` (`HomeScreen`, `AppShell`).
- Variables/functions: `camelCase` (`navigationItems`, `actionMap`).
- Route folders: user-facing Spanish names where already established (`/categorias`, `/cuentas`, `/historial`).
- Constants: descriptive names tied to the screen or concern.
- Avoid unnecessary abbreviations.

### React / Next patterns
- Keep page components tiny and composition-focused.
- Extract reusable pieces when repeated 2+ times with stable semantics.
- Memoization is optional; use it only when it improves clarity or avoids real recomputation.
- Add `aria-label` to icon-only controls.
- For buttons that are not form submitters, always set `type="button"`.
- Preserve route-specific metadata exports.

### Styling
- This project is mobile-first: start with the smallest layout, then layer `md:`, `lg:`, and `xl:` enhancements.
- Prefer Tailwind utilities for component styling.
- Reuse tokens from `src/app/globals.css` such as `var(--accent)`, `var(--text-secondary)`, and `var(--line)`.
- Avoid hardcoding new colors if a token already expresses the intent.
- If a hardcoded color is necessary to match the captured design, keep it localized and consistent.
- Preserve the existing dark-theme aesthetic.
- Reuse spacing, radius, shadow, and density patterns already present in the screens.
- Maintain responsive container widths similar to existing `max-w-*` patterns.

### UX / product fidelity
- Replicate the provided visual direction closely.
- The app is mock-first; do not add fake backend behavior.
- If a feature is visually defined but behavior is unspecified, keep the UI ready and label the missing behavior explicitly.
- Prefer polished empty states over filler placeholders.

### Error handling
- Do not swallow errors silently.
- Do not fake success states.
- For missing requirements, show a clear placeholder or TODO-style note in the UI instead of inventing logic.
- For future async/data work, use explicit loading, empty, and error states.
- Keep render logic defensive: check optional values before access.

## What To Verify Before Handing Off
- Lint changed files or the whole repo: `npm run lint -- <paths>` or `npm run lint`.
- Run `npx tsc --noEmit` when changes touch types, props, or data structures.
- If routing/layout behavior changed, sanity-check the affected page structure.
- Do not claim tests passed; there is no test suite configured yet.

## Practical Guidance For Future Agents
- Read `idea.md` before significant UI work.
- Keep route files thin, screen files focused, and shared primitives reusable.
- Use `frontend-design` + `responsive-design` by default because this project lives or dies by UI quality.
- Bring in `ui-ux-pro-max` or another relevant design skill when polishing layout, hierarchy, animation, accessibility, or visual fidelity.
- If a task is purely visual, obsess over spacing, typography, alignment, and breakpoints.
- If a task mixes UI and logic, keep the logic minimal and the interface precise.
