# Duplication Report (2026-08-17)

Findings from a full-repo duplicate crawl run during the Storybook gap-closure sweep
(branch `fix/storybook-ds-gaps`). Everything listed under **Resolved** shipped on that branch;
everything under **Deferred** is recorded here with its evidence so it can be scheduled rather
than re-derived.

Method: same-basename scan across `src/**/*.vue`, a 6-gram shingle similarity pass over all 366
`.vue` files, and an import-graph resolution (`@/` + relative, static + dynamic) over every
component to find orphans.

---

## Resolved on this branch

| Item | Action | Effect |
|---|---|---|
| `dotted/DtPieChart.vue` + `pieWedges()` | Deleted — zero non-story importers | −74 lines |
| 5 `Dt*` basename twins in `views/ShadcnDashboard/components/` | Renamed to the `Scn*` prefix used by their siblings | 5 name collisions gone |
| `DOTTED_BLUES` defined twice with **different hex values** | Lab copy renamed `SCN_DOTTED_BLUES` | Correctness hazard removed |
| `DvCampaignOnboardingCard` ↔ `DvSetupOnboardingCard` (68% identical) | Shared chrome extracted to `DvOnboardingCardShell.vue` | −168 duplicated lines |
| `useToast` ↔ `useDaVinciToasts` timer machinery (byte-identical) | Extracted `useToastStackTimers()` | WCAG 2.2.1 pause/resume maintained once |
| `barGradient` computed ×3 widgets; `BAR_GRADIENT*`/`valueToY`/`niceMax` ×2 trees | `useBarGradients()` in `dottedChartMath`; `dottedDemoData` re-exports | −40 lines, one definition each |
| `Retail/RetailSettings.vue` ↔ `Retail/Hardware.vue` (86% identical) | Extracted `MpComingSoonTiles.vue` + story | 203 → 55 lines |
| 48MB of untracked snapshot trees polluting `git status` | Gitignored (`maropost-ds-handoff/`, `keycloak-orb-update*/`, `*.zip`) | Clean `git status` |

---

## Deferred — with evidence

### 1. `DashboardView.vue` ↔ `DashboardGradientView.vue` — the largest duplicate in the repo

- **1290 vs 1317 lines, 96% identical** (Jaccard 0.961, containment 0.991).
- The full `diff` is ~50 lines: a header comment, a 19-line `GRADIENT_PALETTES` pin block, and
  5 route-name swaps (`Dashboard` → `DashboardGradient`). Roughly **1250 lines of verbatim
  copy-paste**. Both are routed (`src/router/index.ts:39-40` and `:338-339`).
- **Proposed fix:** add `meta: { chartPaletteLock: 'socialGradient', routePrefix: 'DashboardGradient' }`
  to routes 338/339, point them at `DashboardView.vue`, and read the lock + route prefix from
  `route.meta`.
- **Why deferred:** `/dashboard-gradient` is a live exploration on prod. The merge is mechanical
  but needs a visual diff of both dashboards across all four gradient palettes before it lands.
- **Cost of waiting:** every Overview fix has to be applied twice, silently.

### 2. `Analytics/*` — one report template repeated 11×

- 11 files (`OrdersReport`, `DispatchedOrders`, `CampaignReports`, `JourneyReports`,
  `ABCampaignReports`, `RecurringCampaignReports`, `TestCampaignReports`, `TransactionalReports`,
  `WebsiteReports`, `LogInspector`, …), ~125–130 lines each, **51–73% pairwise similarity across
  all 55 pairs**. They vary only in columns, fixtures, and KPI set.
- **Proposed fix:** one `AnalyticsReportPage` driven by a report descriptor. ~−900 lines.
- **Why deferred:** largest structural win available, but it is a feature-level refactor, not a
  design-system gap.

### 3. `ScnCard` ↔ `DtCard` — attempted, then rejected

The crawl called these "structurally identical, differences are pure geometry". On inspection
that understates it. They differ in:

- heading level (`h3` vs `h2`) — a semantic difference, not visual
- prop name (`description` vs `subtitle`)
- `ScnCard` has a `heading` slot; `DtCard` does not
- `DtCard`'s footer has `border-top` + `margin-top: auto`; `ScnCard`'s does not
- `ScnCard` wraps the default slot in `.scn-card__content`; `DtCard` renders a bare `<slot />`
- `ScnCard` has a `box-shadow`; `DtCard` does not

A merged component would need `density` + `headingLevel` + `footerBorder` + a slot-shape switch —
more prop surface than the 74 duplicated lines it saves, in throwaway sandbox code, and it would
change the rendered output of pinned mockup references. **Recommendation: leave forked.**

### 4. Other view-level near-duplicates

| Pair | Lines | Shared | Suggested action |
|---|---|---|---|
| `Merchandising/PinningEditor` ↔ `SearchPinningEditor` | 423 / 423 | 77% | Extract `PinPickerPanes` or a `usePinEditor()` composable (~−320 lines) |
| `Merchandising/MerchPromoCards` ↔ `MerchBanners` | 199 / 220 | 75% | Extract the shared list-page body |
| `Contacts/ContactTags` ↔ `SecureLists` | 141 / 143 | 73% | Extract |
| The other ~8 "coming soon" views | — | — | Convert to `MpComingSoonTiles` (shipped this branch for the two Retail views) |

`Settings/pages/*` (7 files, 80% similar) is a **false positive** — those are already correct
10-line `SettingsPlaceholder` wrappers. Leave them.

### 5. Store-layer mirrors

`useDaVinciSetup.ts` ↔ `useDaVinciOnboarding.ts` share 415 shingles (containment 0.571) — the
only TS-module duplicate pair in the repo, mirroring the card pair whose components were merged
this branch. Worth the same treatment.

### 6. `DtRingDonut.vue` — dead, but not deleted

Zero non-story importers (it went dead when the Pie/Donut widgets moved to ApexCharts), and
`ringSegments()` + the `RingSegment` type in `dottedChartMath.ts` exist only for it. It was
**not** deleted because a concurrent session had uncommitted work in the file at the time.
Delete it (and those two exports) once that work lands or is abandoned.

### 7. Housekeeping

- **`.claude/worktrees/reverent-blackburn-18960d`** (89MB, branch `claude/confident-moore-8e4920`)
  has zero unique commits vs `feature/retail-cloud-ia` and is a redundant checkout. It was **not**
  removed: it had live uncommitted work from a concurrent session. Remove with
  `git worktree remove` (never `rm -rf`, which strands `.git/worktrees/` metadata) once that
  session is done.
- **`design-kit/src/sections/Spacing.vue`** has drifted 23 lines from its counterpart in
  `src/views/DesignSystem/sections/`, while `Colors.vue` and `Typography.vue` remain byte-identical.
  `design-kit` is a standalone app so it cannot `@/`-import from the main `src/` — either add a
  sync script (`design-kit/scripts/` exists) or alias `design-kit/vite.config.ts` at the shared
  directory.
- **`Products/Collections.vue` vs `Merchandising/Collections.vue`** — a basename collision, not a
  duplicate (322 of ~350 lines differ; different stores and routes). Optional rename of the
  second to `SmartCollections.vue` to match its route name.
