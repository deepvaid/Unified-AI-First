# Maropost Design System

A Vue 3 + Vuetify 3 playground that mirrors the Maropost Commerce + Marketing platform, paired with a Storybook that documents the `Mp*` component library. It exists for UX prototyping, design-system development, and stakeholder review.

**This is not a production app.** It runs on mock data from Pinia stores and has no backend API.

> **New to this repo? Start with [ONBOARDING.md](ONBOARDING.md)** — the engineering handover guide: setup, how the design system is put together, and how to work in Storybook.

## Quick start

Use **npm** (not pnpm — see [ONBOARDING.md](ONBOARDING.md#package-manager)).

```bash
npm install --legacy-peer-deps
```

```bash
npm run tokens:build
```

```bash
npm run dev
```

App runs on http://localhost:5173. In a second terminal:

```bash
npm run storybook
```

Storybook runs on http://localhost:6006.

## What's inside

- **29 top-level `Mp*` components** plus 9 domain component folders (copilot, dashboards, layout, marketing, merchandising, plg, rbac, saleschannels, settings) — 82 component files in total
- **122 Storybook stories** covering the library and composed product surfaces
- **252 page views** across Analytics, Commerce, Contacts, Marketing, Products, Service, Settings and more, wired to 204 routes
- **Design token system** — `src/design-tokens/tokens.json` is the source of truth, generating SCSS, CSS custom properties, and TypeScript
- **42 Pinia stores** of mock data, 24 composables
- **Light and dark themes** plus four accent palettes, switchable from the Storybook toolbar

## Stack

Vue 3.5 · Vuetify 3.12 · TypeScript 5.9 (strict) · Vite 7 · Pinia 3 · Vue Router 5 · Storybook 9.1 · Lucide icons

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | App dev server on :5173 |
| `npm run storybook` | Storybook on :6006 |
| `npm run build` | Type-check (`vue-tsc`) then production build |
| `npm run build-storybook` | Static Storybook into `dist-storybook/` |
| `npm run type-check` | TypeScript check only |
| `npm run tokens:build` | Regenerate token outputs from `tokens.json` |
| `npm run tokens:watch` | Watch `tokens.json` and regenerate on save |
| `npm run preview` | Serve the production build locally |
| `npm run audit:ui` | UI visibility/contrast audit script |

Scripts prefixed `supernova:*`, `tokens:*-figma`, and `design-kit:*` drive external integrations that are **not currently wired up** — they need credentials this repo does not carry. See [ONBOARDING.md](ONBOARDING.md#deferred-integrations).

## Documentation

| File | Content |
|------|---------|
| [ONBOARDING.md](ONBOARDING.md) | **Start here** — engineering handover guide |
| [docs/development.md](docs/development.md) | Local dev workflow and new-component recipe |
| [docs/design-system.md](docs/design-system.md) | Token and component API reference |
| [docs/design-system/storybook-structure.md](docs/design-system/storybook-structure.md) | Storybook taxonomy and story conventions |
| [docs/design-system/vuetify-mapping.md](docs/design-system/vuetify-mapping.md) | How `Mp*` components map onto Vuetify defaults |
| [docs/design-system/duplication-report.md](docs/design-system/duplication-report.md) | Known duplication, resolved and deferred |
| [docs/deployment.md](docs/deployment.md) | Vercel setup |
| [docs/personas/](docs/personas/) | 4 merchant user personas |
| [CLAUDE.md](CLAUDE.md) | AI agent context — architecture, component APIs, conventions |
| [.cursorrules](.cursorrules) | Cursor IDE rules |
| [CLAUDE_CODE_PROMPT.md](CLAUDE_CODE_PROMPT.md) | Original product spec, captured from the live app |

## Deploy

Vercel serves the app at `/` and Storybook at `/storybook` from a single deploy.

```bash
npx vercel --prod
```

Or connect the repo in Vercel and it deploys on push. See [docs/deployment.md](docs/deployment.md).
