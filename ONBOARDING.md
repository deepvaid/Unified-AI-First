# Engineering Handover

Everything you need to run this repo, understand how the design system is put together, and start contributing to it. Read this once end to end; after that, [Storybook](#storybook) is where you'll actually live.

---

## 1. What this is

A **Vue 3 + Vuetify 3 playground** that mirrors the Maropost Commerce + Marketing platform, paired with a **Storybook** documenting the `Mp*` component library.

It was built for UX prototyping and stakeholder review, so two things follow:

- **There is no backend.** Every screen reads mock data from Pinia stores in `src/stores/`. Nothing persists beyond `localStorage`.
- **Breadth over depth.** 252 views exist so flows can be walked end to end. Not all of them are equally finished, and some are demo-only (see [Known gaps](#8-known-gaps-and-rough-edges)).

The part that is meant to be durable is the **design system**: the tokens, the `Mp*` components, and the conventions that hold them together. That's the handover.

---

## 2. Quick start

Node 18+ required. Node 20+ recommended (CI uses 24).

### Package manager

**Use npm.** The repo ships a `package-lock.json`. An earlier pnpm setup was removed because it never had a lockfile and its workflows were failing.

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is needed because Storybook 9's docs addon pulls React peers into a Vue project. This is expected and harmless.

### Then

```bash
npm run tokens:build
```

Generates SCSS/CSS/TS from `tokens.json`. The generated files *are* committed, so a fresh clone builds without this — but run it once so you know the pipeline works.

```bash
npm run dev
```

App on http://localhost:5173.

```bash
npm run storybook
```

Storybook on http://localhost:6006.

Most people run three terminals: `dev`, `storybook`, and `tokens:watch` when touching tokens.

### Optional AI keys

`api/gemini.ts` and `api/tts.ts` power the "Da Vinci" assistant. **Both degrade gracefully with no key** — Gemini falls back to canned answers, TTS falls back to the browser voice. Copy `.env.example` to `.env.local` only if you want the live versions. Nothing else in the app needs a key.

---

## 3. Where the design system lives

| Path | What's there |
|---|---|
| `src/design-tokens/tokens.json` | **Source of truth** for every color, space, radius, shadow, and layout value |
| `src/design-tokens/build.mjs` | Zero-dependency generator, run by `npm run tokens:build` |
| `src/design-tokens/generated/` | Output: `_variables.scss`, `variables.css`, `tokens.ts`. **Never hand-edit** |
| `src/components/Mp*.vue` | The 29 top-level library components |
| `src/components/<domain>/` | 9 domain folders: copilot, dashboards, layout, marketing, merchandising, plg, rbac, saleschannels, settings |
| `src/plugins/vuetify.ts` + `maropostTheme.ts` | Themes (light/dark) and `maropostDefaults` — see below, this is the important one |
| `src/plugins/lucideIcons.ts` | Lucide icon bridge for Vuetify |
| `src/styles/app-styles.ts` | **Ordered manifest of every global stylesheet** — see [render parity](#render-parity-the-one-rule-that-bites) |
| `.storybook/` | `main.ts` (one story glob), `preview.ts` (decorators + toolbars), `theme.ts` (manager branding) |
| `src/stores/` | 42 Pinia stores of mock data |

### The `maropostDefaults` layer

The single most non-obvious thing about this codebase: **`Mp*` components are thin because Vuetify has already been restyled underneath them.**

`createVuetify({ defaults: maropostDefaults })` sets house defaults globally — `VBtn` is flat with pill radius, `VCard` is flat + `rounded="lg"`, inputs are outlined + comfortable, `VDialog` is `rounded="xl"`, and so on. A plain `<v-btn>` already looks correct.

So when you write a new component, **don't restyle primitives**. If a button looks wrong, the fix usually belongs in `maropostDefaults` or in tokens, not in your component's scoped CSS. Full table: [docs/design-system/vuetify-mapping.md](docs/design-system/vuetify-mapping.md).

---

## 4. Storybook

122 story files. `.storybook/main.ts` uses a **single glob** (`src/**/*.stories.@(ts|tsx)`) — there is no second package contributing stories.

### Sidebar

Order is pinned by `storySort` in `.storybook/preview.ts`:

**Introduction** → **Foundations** (colors, typography, spacing, radius & shadows, icons, buttons, tooltips — all rendered live from `tokens.ts`) → component groups (**Layout, Navigation, Forms, Data Display, Feedback, Overlays, Patterns**) → feature groups (**AI, Copilot, Dashboards, Marketing, Merchandising, PLG, RBAC, Sales Channels, Settings**).

Component groups are the design system. Feature groups are composed product surfaces that consume it.

### Toolbars

Two globals in the toolbar, both wired through the preview decorator:

- **Theme** — light / dark
- **Accent** — cyan / blue / gray / purple

Use them instead of forking a story per theme. There's also a `mobile375` viewport preset.

### Render parity: the one rule that bites

Storybook loads the app's full stylesheet set via `src/styles/app-styles.ts`, the ordered manifest imported by **both** `src/main.ts` and `.storybook/preview.ts`. That's what makes components render identically in both places.

> **Add new global stylesheets to `src/styles/app-styles.ts` — never directly to `main.ts` or `.storybook/preview.ts`, and don't reorder it.**

This isn't hypothetical: Storybook once loaded 6 of 15 stylesheets, so form fields rendered as raw Vuetify and sidebar stories lost their skins, while the docs described the styling as if it were active. The manifest fixed it. Bypassing it reintroduces the drift.

### Adding a story

1. Co-locate `<Name>.stories.ts` next to the component. CSF3, `tags: ['autodocs']`.
2. `title:` = sidebar group + component name, e.g. `'Forms/MpNewThing'`. A new feature area gets its own top-level group; extend `storySort` if order matters.
3. Pinia, router, and Vuetify are pre-registered in `preview.ts`. Store-coupled stories seed account `2000290` — copy the pattern from `DvWidgetDraftCard.stories.ts`. Any stylesheet the app imports outside the manifest must be imported story-side.
4. **Tokens only.** Import from `@/design-tokens/generated/tokens`; Lucide kebab-case icon names; never `mdi-*`, never a raw hex.
5. Before committing: `npm run type-check` and `npm run build-storybook` both green, and check the a11y addon panel on new stories.

### Documentation tiers

- **P0 (top-level `Mp*`, `ModuleLandingPage`, `layout/`)** — full treatment: Overview, *Use when / Don't use when*, usage snippet, do's and don'ts, an explicit **A11y** section (Provides / Consumer must / Gaps), `argTypes` for every prop/slot/emit, and state-matrix stories (default, hover, focus, disabled, loading, error; data containers add empty/selection; overlays add open/long-content/mobile).
- **P1 (copilot, dashboards, marketing, settings, merchandising, `MpDaVinciBot`)** — key states plus wired controls; prose optional.

Full taxonomy with per-group counts: [docs/design-system/storybook-structure.md](docs/design-system/storybook-structure.md).

---

## 5. Component conventions

These are house rules. Following them is most of what "matches the design system" means here.

**Never hardcode** colors, spacing, radius, or shadows. Use Vuetify utilities (`d-flex`, `pa-4`, `gap-3`, `text-medium-emphasis`) or token variables.

**Cards** are always `flat border rounded="lg"` — borders, not elevation shadows.

**Icons** are Lucide, kebab-case: `<v-icon>chevron-down</v-icon>`, `prepend-icon="plus"`. The name maps to the PascalCase Lucide export. `mdi-*` strings survive only as a temporary bridge fallback — don't add new ones.

**Always `<style scoped>`** in components. Globals go in the manifest.

### Reach for the `Mp*`, not the primitive

| Don't | Use | Why |
|---|---|---|
| `v-dialog` for confirmations | `MpConfirmDialog` | Standard icon/danger treatment, Escape/backdrop close, a11y labelling |
| `v-dialog` for create/edit forms | `MpFormDrawer` | Forms live in the right-side 480px drawer, never modals |
| Bare `v-chip` for workflow state | `MpStatusChip` | Central status→color maps per domain `type` |
| Ad-hoc "no results" markup | `MpEmptyState` / `MpErrorState` | Empty = nothing to show; error = something failed (`role="alert"`). They are not interchangeable |
| Per-view kebab `v-menu` in rows | `MpRowActionsMenu` | Enforces an accessible name |
| Hand-rolled selectable cards | `MpOptionCard` | Keyboard operability + selection ring |

### The data-table pattern

Every list view composes the same way:

```
MpPageHeader
  MpFilterTabs               (All / Status A / Status B)
  v-card flat border
    MpDataTableToolbar       (search, debounced 300ms, + filter drawer)
    v-data-table
    MpEmptyState             (when items.length === 0)
  MpFloatingBulkBar          (appears on selection)
```

There's a live version under **Patterns → Data Table** in Storybook.

### New component checklist

1. `src/components/MpThing.vue` with `<script setup lang="ts">`
2. Props typed via `defineProps<T>()` + `withDefaults()`; emits via `defineEmits<T>()`
3. `<style scoped>`
4. Co-located `MpThing.stories.ts`
5. `npm run type-check` green

`docs/development.md` has a fuller recipe with a file template.

---

## 6. Token pipeline

```
src/design-tokens/tokens.json   ← edit here
        │  npm run tokens:build
        ▼
src/design-tokens/generated/    ← _variables.scss · variables.css · tokens.ts
        │
        ▼
Vue components + Storybook Foundations stories
```

Key scales: spacing on a 4px base (4→64), radius sm=4 / md=8 / lg=12 / xl=16, layout constants (sidebar 260px, appbar 56px, drawer 480px, content max 1280px).

`npm run tokens:watch` regenerates on save.

> **When a doc and `tokens.json` disagree about a value, the tokens win.** Some prose in `docs/` still quotes older hex values from earlier design rounds. Trust the pipeline, and fix the doc when you notice.

---

## 7. Deferred integrations

Present in the repo, **not currently working**, and deliberately left untouched during this handover. Nothing in the app depends on any of it.

| What | State |
|---|---|
| **Supernova sync** (`scripts/supernova*`, `supernova:*` npm scripts, `.github/workflows/supernova-storybook-sync.yml`) | Needs `SUPERNOVA_TOKEN` + `SUPERNOVA_DESIGN_SYSTEM_ID` org secrets. Also: `scripts/supernova-sync.mjs` still reads `supernova-config.json`, which was retired — **verify config and credentials before any run.** Runbook: [docs/integrations/supernova-storybook.md](docs/integrations/supernova-storybook.md) |
| **Figma token sync** (`tokens:sync-figma`, `tokens:push-figma`, `.github/workflows/tokens-sync.yml`) | Needs `FIGMA_TOKEN`. [docs/figma-integration.md](docs/figma-integration.md) is ~4 months old and contains placeholder repo names — treat it as a sketch, not instructions |
| **`design-kit/`** | A separate, unlinked npm project (its own `package-lock.json`) serving a light-only token gallery plus Figma export tooling. Reached via `npm run design-kit:dev` |
| **GitHub Actions generally** | All three workflows were bound to secrets on the previous personal repo and will no-op after transfer. `deploy-storybook.yml` additionally triggers on `main` while this repo's default branch is `master`, so it never fires — add `master` to its trigger if you want Pages deploys |

Decide whether you want these before investing in them. The scripts are kept so the option stays open.

---

## 8. Known gaps and rough edges

Stated plainly so you find them on your terms rather than by surprise.

- **No linter or formatter.** No ESLint, no Prettier, no `.editorconfig`. Style consistency is currently by convention only. Worth adding early.
- **No tests.** No unit tests, no visual regression, no Playwright config.
- **Stories are excluded from type-checking.** `tsconfig.app.json` excludes `src/stories/**` and `**/*.stories.ts`, so those 122 files never get checked. `src/` itself is strict (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- **Vercel deploys skip type-checking.** `vercel.json` runs `npx vite build` directly rather than `npm run build`, so `vue-tsc` doesn't gate a deploy. Keeps previews unblocked; means a broken type can ship. Run `npm run build` locally before you rely on a preview.
- **Known duplication.** [docs/design-system/duplication-report.md](docs/design-system/duplication-report.md) is a full-repo crawl with Resolved and Deferred sections — the right starting point for a views audit. There is real overlap between `Dashboards`, `DashboardGradient`, and `ShadcnDashboard`.
- **Demo-only routes.** `/showcase`, `/deck`, `/reel`, `/chart-lab`, `/evil-dashboard` were built for presentations, not as product surfaces. `/reel/fly` in particular loads screens from a gitignored directory and will render empty on a fresh clone.
- **`.git` is ~262MB.** Inflated by screenshot churn (one PNG was recommitted 11 times). Clones are slow but correct; history was left intact rather than rewritten so existing clones stay valid.
- **Nine TODOs**, all in `src/composables/useWidgetData.ts`. The rest of `src/` is clean.

---

## 9. Deployment

Vercel serves both surfaces from one deploy: the **app at `/`** and **Storybook at `/storybook`**.

```bash
npx vercel --prod
```

The build runs `vite build`, then `build-storybook`, then copies `dist-storybook` into `dist/storybook`. SPA rewrites exclude `storybook`, `assets`, `main-landing`, and `api`.

If you use the AI features in production, set `GEMINI_API_KEY` and `OPENAI_API_KEY` in the Vercel project settings — the same server-side names from `.env.example` (not `VITE_`-prefixed, so they never reach the client bundle).

More detail: [docs/deployment.md](docs/deployment.md).

---

## 10. Where to go next

- **Browse Storybook first.** `npm run storybook`, start at Foundations, then Patterns → Data Table. That's the system in ten minutes.
- **[docs/design-system/storybook-structure.md](docs/design-system/storybook-structure.md)** — taxonomy, tiering, story conventions.
- **[docs/design-system/vuetify-mapping.md](docs/design-system/vuetify-mapping.md)** — what every primitive inherits.
- **[docs/development.md](docs/development.md)** — dev workflow and the new-component recipe.
- **[docs/design-system/operating-model.md](docs/design-system/operating-model.md)** — the proposed contribution and governance model (a proposal, open to argument).
- **[CLAUDE.md](CLAUDE.md)** — component-by-component API reference. Written for AI assistants, but it's the most current inventory in the repo and reads fine for humans.
- **[docs/personas/](docs/personas/)** — the four merchant personas the UX decisions are aimed at.
