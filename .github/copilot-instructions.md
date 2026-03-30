# Project Guidelines

## Code Style

- Use Angular 20+ modern style: standalone components, signals (`signal`, `computed`), and built-in control flow (`@if`, `@for`, `@switch`).
- Do not set `standalone: true` in Angular decorators; standalone is default in Angular 20+.
- Keep strict TypeScript discipline: avoid `any`, prefer explicit types for public APIs, and preserve existing strict compiler behavior.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` for components.
- Use `input()` and `output()` APIs instead of decorator-based `@Input`/`@Output` where applicable.
- Use `inject()` for dependency injection instead of constructor injection.
- Do not use `@HostBinding` or `@HostListener`; define host bindings in the decorator `host` object.
- Use class/style bindings instead of `ngClass`/`ngStyle`.
- Keep component structure split by responsibility: logic in `.ts`, template in `.html`, styles in `.scss`.
- Do not write arrow functions in templates.
- Maintain accessibility baseline: changes should pass AXE checks and WCAG AA requirements.

## Architecture

- This is a standalone Angular app rooted at `src/app`.
- The app includes a React-based integration boundary for JBrowse (`@jbrowse/react-linear-genome-view2`) and must remain interoperable with `react`/`react-dom`.
- Feature boundaries:
  - `src/app/home`: landing page feature.
  - `src/app/taxonomy`: taxonomy search/details/statistics feature.
  - `src/app/logo`: reusable logo UI.
- Routing uses lazy loading via `loadComponent()` in `src/app/app.routes.ts`.
- Application-wide providers are configured in `src/app/app.config.ts` and include zoneless change detection; prefer signal-driven state updates.
- Keep service responsibilities narrow and colocated with their feature when possible (for example `src/app/taxonomy/taxonomy.service.ts`).

## Build and Test

- Preferred package manager: `pnpm`.
- Install deps: `pnpm install`.
- Dev server: `pnpm start` (or `mise run dev`).
- Build: `pnpm build`.
- Unit tests: `pnpm test`.
- Lint: `pnpm lint`.
- Format: `pnpm format`.
- SCSS lint/fix: `pnpm lint:scss`.

## Conventions

- Keep routes and matcher behavior intact unless the task explicitly changes navigation semantics (see `src/app/app.routes.ts`).
- API calls currently target `/api/v1/`; in local dev this depends on `proxy.config.json` forwarding to backend at `localhost:8000`.
- Import Angular Material/CDK dependencies directly in standalone component `imports` arrays.
- Prefer reactive forms for non-trivial forms.
- Use `NgOptimizedImage` for static images; do not use it for inline base64 images.
- Treat React/JBrowse as a dependency boundary during Angular-focused tasks:
  - Do not remove, replace, or downgrade `react`, `react-dom`, `@types/react`, `@types/react-dom`, or `@jbrowse/react-linear-genome-view2` unless the task explicitly requests React/JBrowse migration work.
  - Do not change TypeScript JSX settings (for example `compilerOptions.jsx`) in Angular-only tasks.
  - Keep Angular-to-React integration code minimal and isolated; avoid spreading React-specific patterns into general Angular components.
  - If a task requires cross-framework changes, update Angular and React integration points together and verify `pnpm build` still passes.

## Git Commit Messages

- Always follow Conventional Commits format: `type(scope): subject`.
- Allowed `type` values: `build`, `ci`, `chore`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
- Keep header length within 72 characters.
- Use lower-case for `type`.
- Use imperative present tense in `subject` (for example `add`, `fix`, `refactor`).
- Start `subject` with lower-case and do not end `subject` with a period.
- Keep commit message language concise and technical; avoid vague text like `update code`.
- Prefer adding a scope when it is clear (for example `taxonomy`, `home`, `logo`, `ci`, `deps`).

Examples:

- `feat(taxonomy): add rank filter for search results`
- `fix(home): handle empty hero image metadata`
- `chore(deps): update angular material to 20.2.12`

## References

- Project overview and tooling notes: `README.md`.
- Angular style guide: https://angular.dev/style-guide
- Angular essentials: https://angular.dev/essentials
- Signals guide: https://angular.dev/guide/signals
