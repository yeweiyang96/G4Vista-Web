---
name: Build and Test Workflow
description: 'Use when: running, debugging, building, linting, formatting, or testing this workspace.'
---

- Preferred package manager: `pnpm`.
- Install dependencies: `pnpm install`.
- Dev server: `pnpm start` (or `mise run dev`).
- Build: `pnpm build`.
- Unit tests: `pnpm test`.
- Lint: `pnpm lint`.
- Format: `pnpm format`.
- SCSS lint/fix: `pnpm lint:scss`.
- API calls currently target `/api/v1/`; in local dev this depends on `proxy.config.json` forwarding to backend at `localhost:8000`.
