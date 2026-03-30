---
name: App Architecture
description: 'Use when: modifying routing, providers, app structure, or feature boundaries.'
applyTo: 'src/app/**'
---

- This is a standalone Angular app rooted at `src/app`.
- Keep feature boundaries intact unless the task explicitly changes them:
  - `src/app/home`: landing page feature.
  - `src/app/taxonomy`: taxonomy search/details/statistics feature.
  - `src/app/logo`: reusable logo UI.
- Routing uses lazy loading via `loadComponent()` in `src/app/app.routes.ts`.
- Application-wide providers are configured in `src/app/app.config.ts` and include zoneless change detection; prefer signal-driven state updates.
- Keep service responsibilities narrow and colocated with their feature when possible (for example `src/app/taxonomy/taxonomy.service.ts`).
- Keep routes and matcher behavior intact unless the task explicitly changes navigation semantics.
