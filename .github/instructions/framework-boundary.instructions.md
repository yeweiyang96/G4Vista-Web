---
name: Framework Boundary
description: 'Use when: changing Angular code that may affect React/JBrowse integration, dependencies, or TS config.'
applyTo: 'src/app/**,package.json,tsconfig*.json'
---

- The app includes a React-based integration boundary for JBrowse (`@jbrowse/react-linear-genome-view2`) and must remain interoperable with `react` and `react-dom`.
- Do not remove, replace, or downgrade `react`, `react-dom`, `@types/react`, `@types/react-dom`, or `@jbrowse/react-linear-genome-view2` unless the task explicitly requests React/JBrowse migration work.
- Do not change TypeScript JSX settings (for example `compilerOptions.jsx`) in Angular-only tasks.
- Keep Angular-to-React integration code minimal and isolated; avoid spreading React-specific patterns into general Angular components.
- If a task requires cross-framework changes, update Angular and React integration points together and verify `pnpm build` still passes.
