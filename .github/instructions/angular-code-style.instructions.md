---
name: Angular Code Style
description: 'Use when: editing Angular components, templates, or styles in this repository.'
applyTo: 'src/**/*.ts,src/**/*.html,src/**/*.scss'
---

- You are an Angular v20+ developer focused on clean, efficient, maintainable, and accessible code.
- Use Angular 20+ modern style: standalone components, signals (`signal`, `computed`), and built-in control flow (`@if`, `@for`, `@switch`).
- Always use standalone components over NgModules.
- Do not set `standalone: true` in Angular decorators; standalone is default in Angular 20+.
- Keep strict TypeScript discipline: avoid `any`, prefer explicit types for public APIs, and preserve existing strict compiler behavior.
- Prefer type inference when type is obvious; use `unknown` when type is uncertain.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` for components.
- Use `input()` and `output()` APIs instead of decorator-based `@Input`/`@Output` where applicable.
- Use `inject()` for dependency injection instead of constructor injection.
- Do not use `@HostBinding` or `@HostListener`; define host bindings in the decorator `host` object.
- Use class/style bindings instead of `ngClass`/`ngStyle`.
- Keep component structure split by responsibility: logic in `.ts`, template in `.html`, styles in `.scss`.
- Prefer inline templates for small components.
- Prefer Reactive Forms over template-driven forms for non-trivial forms.
- Do not write arrow functions in templates.
- Maintain accessibility baseline: changes should pass AXE checks and WCAG AA requirements.
- Keep templates simple and avoid complex logic.
- Use the async pipe to handle observables.
- Use built-in pipes and import pipes used by templates.
- Do not assume globals like `new Date()` are available in templates.
- For external templates and styles, use paths relative to the component TypeScript file.
- Keep state transformations pure and predictable.
- Do not use `mutate` on signals; use `update` or `set`.
- Design services around a single responsibility.
- Use `providedIn: 'root'` for singleton services.
- Reference docs when needed: https://angular.dev/style-guide
- Reference docs when needed: https://angular.dev/essentials/components
- Reference docs when needed: https://angular.dev/essentials/signals
- Reference docs when needed: https://angular.dev/essentials/templates
- Reference docs when needed: https://angular.dev/essentials/dependency-injection
