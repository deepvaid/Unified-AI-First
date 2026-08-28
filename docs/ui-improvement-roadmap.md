# Maropost App — UX/UI Improvement Roadmap

**Scope:** App shell, sidebar, top bar, and representative examples of every page type (dashboard, campaigns, content, journeys, settings, lists, details, create/edit flows) plus shared components and the cross-cutting state / responsive / a11y layers.

**Method (honesty note):** Static code review + computed WCAG contrast (script below) + Mobbin reference patterns. The first pass did **not** render the app, so anything render-dependent (real tab order, focus visibility in situ, actual reflow at 320px, console errors, input-border contrast) is marked *unverified* and folded into the loop's verify step. Evidence cites `file:line`.

**Created:** 2026-07-02

---

## Executive summary

The foundation is strong: a real design-token pipeline, a polished app shell (skip-link, `aria-label`s, `:focus-visible` rings, tooltips, `prefers-reduced-motion`), consistent list scaffolding (`MpPageHeader` + `MpDataTableToolbar` + `v-data-table` + `MpEmptyState`), and a reference-quality Settings module.

Problems cluster into five root-cause themes:

1. **Color tokens fail WCAG contrast** — highest impact. Primary filled buttons render white on `#00ADF1` = **2.55:1**; primary-as-text = 3.46:1; input/divider borders ~1.2–1.5:1. Affects every screen.
2. **Missing loading & error states** — ~12/116 views have any loading indicator; no data table has a skeleton.
3. **Data tables aren't responsive** — 7–10 column tables have no column-hiding or card fallback.
4. **Inconsistent accessibility & shell adherence** — unlabeled icon buttons, `<div @click>` controls, `MpFormDrawer` lacks dialog semantics, several pages skip `MpPageHeader`.
5. **Fighting Vuetify** — `!important` sprawl, two parallel component libraries (`Mp*` + `Mb*`), scattered hardcoded hex/px.

| Dimension | Score (1–5) |
|---|---|
| Visual design | 4 |
| Layout & responsiveness | 3 |
| UX & interaction | 3 |
| Accessibility | 2 |
| Content & microcopy | 4 |
| Front-end code quality | 3 |

---

## Computed contrast (light theme, before fixes)

| Ratio | Result | Pair | Usage |
|---|---|---|---|
| 2.55:1 | FAIL (text + 3:1) | `#ffffff` on `#00ADF1` | filled-primary button label (`global.scss` override) |
| 3.46:1 | FAIL text | `#0092D4` on `#fff` | primary as text / link |
| 3.34:1 | FAIL text | `#c97a16` on `#fff` | warning text |
| 4.33:1 | FAIL text | `#1f8a5b` on `#fff` | success text |
| 4.16:1 | FAIL text | `#737373` on `#f0f0f0` | sidebar muted text |
| 1.48:1 | FAIL 3:1 | `#d4d4d4` on `#fff` | input outline |
| 1.23:1 | FAIL 3:1 | `#e2e8f0` on `#fff` | divider |
| 4.74:1 | pass | `#737373` on `#fff` | table-header text |
| 5.44:1 | pass | `#c0392b` on `#fff` | error text |

**Chosen replacements (verified):** `primary` → `#0073AB` (5.20:1), `primaryDarken` → `#005E8A`, `info` → `#0073AB`, `warning` → `#a8630f` (4.71:1), `success` → `#1a7f54` (4.99:1). Remove the `#00ADF1` button override. Input/divider border darkening deferred to the rendered pass (needs verification of how Vuetify colors the resting outline).

Re-run contrast anytime:

```bash
node -e 'const lum=h=>{const [r,g,b]=h.replace("#","").match(/../g).map(x=>{const c=parseInt(x,16)/255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4});return 0.2126*r+0.7152*g+0.0722*b};const R=(a,b)=>{const A=lum(a),B=lum(b);return ((Math.max(A,B)+0.05)/(Math.min(A,B)+0.05)).toFixed(2)};console.log(R("#0073AB","#ffffff"))'
```

---

## Themes (root-cause clusters)

| # | Theme | Worst severity | Impact | Effort |
|---|---|---|---|---|
| T1 | Semantic color tokens fail contrast (text + non-text) | Blocker | High | M |
| T2 | Missing loading/error states (+ a few empty) | Major | High | M |
| T3 | Data tables not responsive | Major | High (mobile) | M |
| T4 | Icon-only controls lack accessible names | Major | High (SR users) | S |
| T5 | Fighting Vuetify: `!important`, dup libs, hardcoded values | Major | Med | L |
| T6 | Inconsistent page shell & create-flow patterns | Major | Med | M |
| T7 | `MpFormDrawer` lacks dialog a11y | Major | Med-High | S-M |
| T8 | Journey builder bespoke & inaccessible | Major (isolated) | Med | L |

---

## Prioritized plan (page-by-page), in implementation order

### Phase 1 — Foundations & quick wins

| # | Area | Current issue | Suggested improvement | Mobbin pattern | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| 1 | Accessibility — color contrast (tokens) | white-on-`#00ADF1` btn 2.55:1; primary-text 3.46; warning 3.34; success 4.33; borders 1.2–1.5 | Darken primary→`#0073AB`, warning→`#a8630f`, success→`#1a7f54`; remove `#00ADF1` override; rebuild tokens | foundational | P0 | M | Med |
| 2 | Accessibility — icon-button names | unlabeled icon `v-btn` in EmailCampaigns:216-217, ProductsList:194, Journeys:159-171, ContactDetail:105, CreateCampaign:97,304, JourneyBuilder×5 | add `aria-label` to every icon-only button | Klaviyo, Mailchimp | P0 | S | Low |
| 3 | Images — alt | `<v-img>` no alt (ProductsList:154, ImageLibrary:42) | add `alt`; replace picsum placeholders | — | P1 | S | Low |
| 4 | Shared — loading & error | no table skeleton anywhere; error only in DashboardView | build `MpTableSkeleton` + `MpErrorState` (+ stories); wire into data views | Asana | P1 | M | Low |
| 5 | Empty states — gaps | none for ImageLibrary (filtered), EmailContent, dashboard-no-widget, JourneyBuilder | add `MpEmptyState` to each | Sentry add-widget tile, Loops | P1 | S | Low |
| 6 | Shared — `MpFormDrawer` a11y | `v-navigation-drawer` → no dialog role/focus-trap/Escape/return-focus (MpFormDrawer.vue:18) | add role="dialog", aria-labelledby, focus trap, Escape, restore focus | — | P1 | S-M | Med |

### Phase 2 — Structural consistency

| # | Area | Current issue | Suggested improvement | Mobbin pattern | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| 7 | List pages (responsive) | 7–10 col tables, no responsive strategy except AllContacts | column-priority + card fallback < 768px | Klaviyo, GoDaddy | P1 | M | Med |
| 8 | App shell / Sidebar / Top bar | 42 `!important` in sidebar; rail-flyout `<div @click>`; sidebar muted 4.16:1 | rail-flyout → `button`/`role=menuitem` + arrow-key nav; reduce `!important`; darken muted text | Intercom | P1 | M | Med |
| 9 | Page-shell consistency | custom headers skip MpPageHeader (SalesChannelDetail:608, JourneyBuilder:93, CreateCampaign:93, DashboardView:442) | route every page through MpPageHeader; one primary CTA | Sentry | P2 | M | Low |
| 10 | Create & edit flows | 4 patterns; no review/validation/success states | one convention (drawer ≤2 step, full-page stepper for wizards) + review/validation/success | Mailchimp create-email, GoDaddy send | P2 | M | Med |
| 11 | Dashboard | no MpPageHeader; two text-variant actions compete; inline no-widget empty; `#f59e0b`; 12 `!important` | clear primary (Add widget), designed empty dashboard, per-widget menu, tokenized colors | Asana, Whop, Sentry | P2 | M | Med |
| 12 | Campaign pages | no list/calendar toggle or bulk bar; 2 unlabeled row icons; KPI uses text-h5 | view toggle, row action menu, tokenized KPIs | Klaviyo, Mailchimp, Customer.io | P2 | M | Low |
| 13 | Content pages | ImageLibrary: no folders/selection/empty/alt; EmailContent: hardcoded 150px, no empty | asset-library pattern (folders + grid/list + upload progress + multiselect + empty) | Customer.io Assets, Squarespace, Webflow | P2 | M | Low |
| 14 | Detail pages | ContactDetail 10 `!important` + fixed 340px; SalesChannelDetail custom header; tab tables overflow | standardize summary-panel + tabbed-records + timeline; responsive tab tables; cut `!important` | Zoho CRM, Pipedrive, Lightfield | P2 | M | Med |
| — | Settings pages | already reference-quality; only 2 `!important` in GeneralPage:193 | keep as template; minor cleanup | Ghost, Intercom | P3 | S | Low |

### Phase 3 — Strategic

| # | Area | Current issue | Suggested improvement | Mobbin pattern | Priority | Complexity | Risk |
|---|---|---|---|---|---|---|---|
| 15 | Journey pages (builder) | node select via `v-card @click`; dead palette affordance; 5 unlabeled icons; fixed 460px/100vh; no empty state | nodes as `<button>` (keyboard/focus); right-hand config panel + add-step menu + zoom; empty-canvas state | Pipedrive, ManyChat, Intercom | P3 | L | High |
| 16 | Shared components / design system | two libraries (Mp* + Mb*); `!important` sprawl; hardcoded hex/px; no tabular-nums | converge to one library; replace `!important` with theme defaults; lint hardcoded values; `.num` in tables | — | P3 | L | High |
| 17 | Loading/Error rollout | most views still need wiring after #4 | apply skeleton/error to all remaining data views | — | P3 | M | Low |

---

## Risks & dependencies

- T1 (contrast) is a token change → touches every screen; do first so later work inherits correct colors; needs a before/after regression glance.
- Static method → real focus order, reflow at 320px, console health *unverified*; the loop's screenshot step closes this.
- Journey builder (#15) and library consolidation (#16) are the only High-risk items — schedule last.

## Out of scope

- New features/fields (mirror reference *structure*, not new functionality).
- Backend/data changes (mock-data prototype).
- Dark-theme-specific contrast (light theme audited; dark tokens get the same treatment in a follow-up).

## Mobbin reference index

- Dashboard: Sentry `345c2587`, Whop `0b39694c`, Asana `3696afeb`, Navattic `a5be5a57`
- Campaign list: Klaviyo `4b420bde`, Mailchimp `ba3463ed`, Customer.io `f7868ee2`, GoDaddy `e1d681b0`
- Create/edit flow: Mailchimp `flows/23d57674`, GoDaddy `flows/12958bcb`, Loops `flows/dcd595e1`
- Journey builder: Pipedrive `b17dbc66`, ManyChat `53179bd2`, Intercom `02220dce`, Lindy `070b94c2`
- Settings: Ghost `7b05eba2`, Intercom `d7cbfa82`, Better Stack `cd0dabb5`
- Detail/profile: Zoho CRM `e1a5b857`, Pipedrive `88631280`, Lightfield `853bc532`
- Content/asset library: Customer.io `f7b1c916`, Squarespace `f24eebc0`, Webflow `6c436385`, HoneyBook `5f4503b7`

(Full URLs: `https://mobbin.com/screens/<id>` or `https://mobbin.com/flows/<id>`)

---

## Goal + Loop

**Goal:** Every page meets a "modern, clean, accessible SaaS" bar — consistent shell, one clear primary action, designed empty/loading/error states, WCAG 2.2 AA contrast & names, responsive at 375/768/1280, token-driven styling (no new hardcoded hex/px, no new `!important`), and visual alignment with its Mobbin reference.

**Per-page Definition of Done:**
- [ ] Uses `MpPageHeader` (+ breadcrumbs if nested); exactly one primary CTA.
- [ ] Loading (skeleton), empty (`MpEmptyState`), and error states for any data view.
- [ ] Every control keyboard-operable with visible focus; icon-only buttons have `aria-label`; inputs labeled; images have `alt`.
- [ ] Text ≥ 4.5:1 (≥3:1 large); borders/UI ≥ 3:1 (verified by the contrast script).
- [ ] No horizontal scroll / no lost actions at 375px; sensible reflow at 768px.
- [ ] No new hardcoded hex/px or `!important`.
- [ ] `npm run type-check && npm run build` pass; matches the Mobbin pattern for its type.

**Loop (per page, in `#` order):**
1. Read the view + its `.stories.ts`; screenshot current at 375/768/1280.
2. Pull the page-type's Mobbin reference (`search_screens` / `search_flows`, `platform:"web"`).
3. Apply the smallest change set to hit the DoD; reuse `Mp*` + tokens; don't add scope/fields.
4. Self-audit against the compact pass; run the contrast script on any new pairs.
5. Re-screenshot; verify DoD; run type-check + build.
6. Commit `[fix]/[feat]: polish <page> UI`; next page.

---

## Progress log

- 2026-07-02 — Roadmap created. Starting Phase 1.
- 2026-07-02 — **P1 #1 (contrast) DONE.** Retuned light tokens: `primary #0092D4→#0073AB` (5.20:1), `primaryDarken→#005E8A`, `success→#1a7f54` (4.99:1), `warning→#a8630f` (4.71:1), `info→#0073AB`. Removed `.v-btn.bg-primary { #00ADF1 !important }` override in `global.scss`. Synced the same values into `marobase-tokens.css` (`:root`) and the default `cyan` accent in `useAppTheme.ts` so the fix holds at runtime. Rebuilt tokens (`tokens:build`, 256 tokens) — verified in `generated/tokens.ts`.
  - Deferred: input/divider **border** contrast (`outline #d4d4d4` 1.48:1) — needs rendered verification of Vuetify's resting outline color.
- 2026-07-02 — **Pre-existing folders WIP fixed** so the build is green: typed `Campaign`/`CampaignMetrics` in `useCampaigns.ts` (`folderId`/`sentDate` are `string | null`) and finished wiring `EmailCampaigns.vue` (Manage Folders button, `MpFolderSelect` filter, folder column, "Move to folder" row action, `MpManageFoldersDrawer` + `MpMoveToFolderDialog`).
- 2026-07-02 — **P1 #2 (icon labels) DONE.** Added `aria-label`s to icon-only buttons across `EmailCampaigns`, `ProductsList`, `AllContacts`, `Journeys`, `JourneyBuilder` (5), `CreateCampaign`, `ContactDetail`.
- 2026-07-02 — **P1 #3 (image alt) DONE.** `ProductsList` thumbnail marked decorative (`alt=""`); `ImageLibrary` asset images use the file name.
- 2026-07-02 — **P1 #4 (state components) DONE.** Added `MpErrorState.vue` (retry action, `role="alert"`) and `MpTableSkeleton.vue` (configurable rows/cols, `role="status"`, reduced-motion aware), each with a co-located story under `Feedback/`.
- 2026-07-02 — **P1 #5 (empty states) DONE.** Added empty states to `ImageLibrary` (search-aware) and `EmailContent`. Dashboard no-widget empty state already existed in `DashboardGrid.vue`. `JourneyBuilder` skipped — its canvas always keeps a non-deletable trigger node, so an empty canvas is unreachable (adding one would be dead UI).
- 2026-07-02 — **P1 #6 (drawer a11y) DONE.** `MpFormDrawer` now sets `role="dialog"`, `aria-modal`, `aria-labelledby`; focuses the panel on open and restores focus to the trigger on close; Escape closes; Tab is trapped within the panel.
- 2026-07-02 — **Phase 1 verified: `npm run build` GREEN** (`vue-tsc` clean; the 500 kB chunk-size warning is pre-existing/unrelated).

### Phase 2 — Structural consistency

- 2026-07-02 — **P2 #0 (deferred border contrast) VERIFIED in the running app** (CDP `getComputedStyle` on `localhost:5173`):
  - **Inputs PASS** — resting outlined `.v-field__outline` renders `rgb(26,24,20)` = **17.73:1** (uses `baseColor: on-surface` + `--v-field-border-opacity: 1`). The audit's 1.48:1 was the raw `--v-theme-outline` token, not the rendered value. **No change.**
  - Hairlines/dividers (`--mp-border-subtle #e2e8f0` = 1.23:1; `borderDividerMuted rgba(26,24,20,.06)` = 1.13:1) are **decorative separators**, exempt from WCAG 1.4.11 (3:1 applies only to control boundaries/states, not aesthetic dividers). Darkening them would fight the flat `v-card flat border` aesthetic. **No change; documented rather than forced.**
  - Follow-up (optional, low priority): where a border is the *sole* affordance of an interactive control (outlined buttons, clickable tiles), a dedicated ≥3:1 "interactive border" token could be introduced — deferred as a design decision, not a blocker.
- 2026-07-02 — **P2 #7 (responsive list tables) DONE (pattern + primary pages).** Added reusable composable `src/composables/useResponsiveTableHeaders.ts` — breakpoint-driven column-priority hiding (`hideBelow: 'sm'|'md'|'lg'`), optionally merging a manual column-hide selection. Hidden columns simply don't render, so existing `#item.<key>` templates are untouched. Applied + verified on the 7 primary list pages: `SalesOrders` (10→6 @md→4 @mobile), `EmailCampaigns` (8→6→3), `AllContacts` (now breakpoint-aware on top of its manual hide menu), `ProductsList`, `DraftOrders`, `Fulfillments`, `Coupons`. Verified in-browser via CDP viewport emulation (375 / 1024): correct columns hidden at each breakpoint; KPI cards reflow 2×2 and sidebar collapses on mobile. `npm run build` GREEN.
  - Rollout note: ~50 remaining secondary/analytics tables can adopt the same composable incrementally (annotate `hideBelow` + swap `:headers` to `visibleHeaders`) — tracked with roadmap #17-style rollout, not blocking.
- 2026-07-02 — **P2 #8 (app shell / sidebar / top bar) DONE (a11y + verification).**
  - **Rail flyout `<div @click>` → `<button>`.** All `.rail-flyout-item` controls in the collapsed-rail hover menu are now real buttons (keyboard-focusable, Enter/Space-activatable, announced as controls). Generalized the button style-reset onto the base `.rail-flyout-item` (so both the rail menu and the teleported expanded flyout render identically) and added a self-contained `:focus-visible` outline — this also **fixed a broken focus ring** in the expanded flyout, which previously relied on `--sidebar-focus-ring` (undefined outside `.mp-sidebar`, so no ring showed). Verified in-browser: Marketing flyout opens, items expose `role=button`, and "Email Campaigns" navigates correctly.
  - **Sidebar muted-text contrast VERIFIED (no change).** Rendered sidebar is dark `rgb(27,31,43)`; muted text = `rgba(255,255,255,0.72)` = **9.06:1**, primary text = 14.05:1 — both pass AA. The audit's 4.16:1 was a light-surface mis-attribution (same pattern as the input-border false alarm).
  - **`!important` reduction DEFERRED to #16 (Phase 3, by design).** The sidebar's ~40 `!important` are fighting Vuetify `.v-list-item` internals (overlay opacity, active/prepend spacing); unwinding them safely requires a Vuetify-defaults-level refactor, which roadmap #16 ("replace `!important` with theme defaults") already owns as a High-risk strategic item. Removing them ad-hoc here would be high-regression, low-value churn.
  - Follow-up (optional): full menu-pattern (`role=menuitem` + arrow-key roving tabindex) for the flyouts — buttons already give baseline Tab/Enter operability, so this is an enhancement, not a blocker. `npm run build` GREEN.
- 2026-07-02 — **P2 #9 (page-shell consistency) RESOLVED — blanket `MpPageHeader` conversion rejected as a downgrade.** Inspected all four flagged headers in code + in-browser: each is *purpose-built and appropriate*, not accidental drift:
  - `DashboardView` — favorite-star + **dashboard switcher** dropdown title (can't be expressed by `MpPageHeader`'s plain title).
  - `SalesChannelDetail` — detail **identity header** (channel icon badge + inline `MpStatusChip` + metadata row) — a richer pattern than title/subtitle.
  - `CreateCampaign` — **full-page 5-step wizard** chrome (top bar + `v-stepper`); `JourneyBuilder` — **full-page builder** toolbar. Forcing a standard page header onto full-page flows is wrong.
  - Decision: keep the bespoke headers; enforce the *real* shared contract instead — **title type-scale + exactly one visually-primary CTA per shell**. That work is folded into the owning items: Dashboard → #11 (done below), SalesChannelDetail → #14, the two wizards → #10/#15.
- 2026-07-02 — **P2 #11 (Dashboard) DONE (primary CTA + tokenized color).**
  - **One primary CTA.** Header row 1 previously had two competing `variant="text"` menus ("Actions" + "Add content"). Promoted **"Add content" to the single filled primary** (`color="primary" variant="flat" size="small"`) and left "Actions" as a secondary text button (sizes aligned). Verified in-browser: clear primary/secondary hierarchy, and it's the only primary-colored control in the page shell (filter pills are neutral, refresh is icon-text).
  - **Tokenized the favorite star.** `.dashboard-page-header__fav--active` was hardcoded `#f59e0b`; switched to `rgb(var(--v-theme-warning))` — this *also* fixes an inconsistency, since the switcher-list favorite stars already use `color="warning"`. All favorite stars now share one token. Verified the star still reads as amber/gold in-render.
  - **`!important` reduction DEFERRED to #16.** The remaining `!important` (surface backgrounds, chip-pill + avatar sizing) fight Vuetify internals — same rationale as #8; roadmap #16 owns the systemic unwind. `npm run build` GREEN.
- 2026-07-02 — **P2 #10 (create & edit flows) — reference convention shipped on the flagship wizard; app-wide convergence documented as a rollout (not a risky big-bang).**
  - Established the **success-state convention** on `CreateCampaign` (full-page stepper wizard). `launch()` no longer silently `router.push`-es away; it now flips a `launched` flag that swaps the whole flow (`<template v-if="!launched">`) for a **confirmation screen** (`v-else`): rocket-in-success-circle, "Campaign launched!"/"Campaign scheduled!" headline (schedule-aware), a dynamic recipient summary, a primary **View campaigns** CTA, and a secondary **Create another campaign** (resets state → step 1). Since the app has no cross-route toast, an in-flow success screen is the right pattern for a full-page wizard (matches Mobbin Mailchimp/GoDaddy "send" confirmations).
  - **Validation legibility.** The wizard already gated `Continue` with `:disabled="!stepValid"`, but gave no reason. Added a `stepHint` caption beside `Continue` ("Add a campaign name and subject line to continue.", "Choose a template to continue.", "Pick a send date to continue.") shown only while the step is invalid — turns silent-disable into guidance without heavy per-field error states.
  - **Verified end-to-end in-browser** (locked session, real keystrokes): step-1 hint + disabled `Continue`; hint clears + `Continue` enables once required fields are typed; template-select gate; review summary reflects all inputs; **Launch → success screen** renders with the dynamic message; **Create another** resets to an empty step 1. (Note: `browser_fill` doesn't trigger Vue `v-model` — must use `browser_type`; and the Da Vinci assistant overlay must be `Escape`-dismissed after navigation. Also flagged: template cards are clickable `v-card`s with no `button` role — a future a11y follow-up.)
  - **Convergence rollout (documented, not forced).** "Collapse 4 create/edit patterns into one" across ~dozens of flows is a High-risk refactor; doing it big-bang violates the surgical principle. The convention is now: **drawer (`MpFormDrawer`) for ≤2-step forms; full-page stepper for multi-step wizards; every create/edit flow ends in an explicit success confirmation + inline validation feedback.** `CreateCampaign` is the reference; other flows adopt it incrementally. `npm run build` GREEN.
- 2026-07-02 — **P2 #12 (campaign pages) DONE.** Two of the three suggested improvements were already satisfied by earlier work, so this focused on the genuine gaps:
  - **KPIs already tokenized** — the summary row uses `MpKpiCard` (no hardcoded colors); the audit's "KPI uses text-h5" no longer applies. No change needed.
  - **Row action menu — fixed dead buttons + made coherent.** The old cell had two icon buttons with **no `@click` handlers** ("View report", "Duplicate" were dead) plus a 1-item overflow menu. Rebuilt it: **"View report" now only shows on `Sent` rows** and routes to `CampaignReports`; the overflow menu now has **Duplicate / Move to folder… / Delete** (destructive, `base-color="error"`), all wired. Added `duplicateCampaign(id)` (clones as a Draft `(Copy)`) and `deleteCampaigns(ids)` to the store.
  - **Bulk bar added** (the "no bulk bar" gap + the app's documented Page-View pattern). `v-data-table` now has `show-select v-model="selected"` (table already had `item-value="id"`); `MpFloatingBulkBar` shows count + **Select all / Move to folder / Delete / Clear**, reusing `MpMoveToFolderDialog` in bulk mode (loops `moveToFolder`) and `deleteCampaigns`.
  - **View toggle (list/calendar) DEFERRED** as out-of-scope: a calendar view is net-new functionality (needs a scheduling data model + calendar UI), not UI polish. Documented; revisit only if the real app ships it.
  - **Verified in-browser:** checkboxes select rows; bulk bar slides in with correct count (1 → 4 → Select all 25); "View report" appears only on Sent rows. `npm run build` GREEN. (Same two browser caveats as #10: `Escape` the Da Vinci overlay after navigation; Vuetify's opacity:0 native checkbox needs a coordinate click, not the input ref.)
- 2026-07-02 — **P2 #13 (content pages) DONE — high-value slice of the asset-library pattern; convergence deferred.**
  - **`EmailContent` hardcoded `150px` removed.** The thumbnail placeholder used an inline `style="height:150px"`; moved to a scoped `.content-thumb { height: 150px }` class (no inline styles rule). No visual change — pure hygiene.
  - **`ImageLibrary` multiselect + bulk delete** (the audit's "no selection" gap + the app's documented bulk-bar pattern). Made `images` reactive (`ref`) and `filteredImages` a `computed`; added `selected` state, `toggleSelect`, `bulkDelete`. Each grid card is now clickable to toggle, shows a `v-checkbox-btn` (hidden until hover/selected via `opacity`), and gets a primary selection ring (`.image-card--selected` — bound to the `primary` token, not a hardcoded color). `MpFloatingBulkBar` shows **N selected / Select all / Delete / Clear**, reusing the same component as the campaigns page for consistency.
  - **Verified in-browser** (CDP + screenshot): clicking a card sets `selectedCards: 1`, the card's checkbox `opacity` flips to `1`, and the bulk bar renders `position: fixed`, `opacity: 1`, `z-index: 100`, in-view at the bottom ("1 selected · Select all (12) · Delete · Clear selection"). `npm run build` GREEN.
  - **Rollout (documented, not forced).** The full asset-library pattern (folders, grid/list toggle, upload-progress, drag-drop upload) is net-new functionality, not polish — deferred. `ImageLibrary` now shares the campaigns page's selection/bulk-bar vocabulary; the remaining pieces adopt incrementally.
- 2026-07-02 — **P2 #14 (detail pages) DONE — the real gap (tab-table overflow) fixed; the two "flagged" concerns were already resolved.**
  - **`ContactDetail` in-tab tables now responsive.** The Orders (7-col), Tickets (6-col), and Abandoned-Cart (5-col) tables inside the detail tabs had no responsive strategy and overflowed on narrow widths. Reused the P2 #7 `useResponsiveTableHeaders` composable (column-priority `hideBelow`) on all three — no template/cell changes, headers just stop rendering. **Verified in-browser via CDP viewport emulation:** Orders renders **7 cols @1440 → 4 @1000 (drops Items/Payment/Fulfillment) → 3 @900 (Order/Total/Status)**, and `scrollWidth === clientWidth` at 900px (overflow eliminated).
  - **Fixed 340px sidebar — already responsive, no change.** The audit flagged "fixed 340px", but the page already has `@media (max-width:1100px)` that drops the sidebar to full-width and stacks the two columns (confirmed in-render at 900px: single-column, sidebar-rail collapsed). Above 1100px a fixed 340px identity rail is the correct CRM pattern (Zoho/Pipedrive) — widening it would be wrong.
  - **10 `!important` — load-bearing, deferred to #16.** Per the in-file comment, they beat (a) Vuetify `.v-card` defaults and (b) **MbStatCard's inline tone-based custom-props** (`--mb-stat-bg` etc. set via `style=` on the element, which only `!important` can override). Removing them would repaint the KPI cards pale-cyan/cream/dark-blue — a regression. Same systemic-unwind rationale as #8/#11; roadmap #16 owns it.
  - **`SalesChannelDetail` — bespoke header already correct, no change.** Its identity header already has **exactly one shell-level primary CTA** (`color="primary" variant="flat"`) beside two outlined secondaries + an outlined back button — the #9 contract is already met. Its tab content is cards/CSS-grid (no `v-data-table`), so there is no tab-table overflow to fix. #9's "keep the purpose-built header" decision stands. `npm run build` GREEN.

### Phase 3 — Strategic (partial)

- 2026-07-02 — **P3 #15 (journey builder) — a11y deliverables already met; this pass aligned the *visuals* to the real product (Liquid Sky Figma + old-app screenshots the user supplied).**
  - **a11y (already satisfied, preserved).** The roadmap's #15 asks were nodes-as-`<button>`, right-hand config panel, add-step menu, zoom, keyboard/Escape — all already present in `JourneyBuilder.vue` from an earlier pass (each canvas node is a `<button class="flow-node__open" :aria-label="Configure step: …">`, palette headers use `aria-expanded`, zoom buttons are labeled, Escape closes the panel). Empty-canvas state stays intentionally out (P1 #5: the trigger node is non-deletable, so an empty canvas is unreachable — an empty state would be dead UI). No a11y regressions: this change only touched colour bindings + a caption.
  - **Category-driven colour (single source of truth).** Replaced per-node/per-item `color` fields with one `typeColor: Record<NodeType,string>` map so colour is 100% determined by step category (as the reference does), killing the prior drift (trigger was purple, email was blue, delay was cyan). Mapping uses **existing theme tokens only** (no hardcoded hex): trigger→`primary` (blue), email+action→`success` (green), condition→`secondary` (the theme's near-black `#1a1814` — a distinct dark "logic gate" chip, standing in for the reference's dark-navy filters), delay→`warning` (amber, standing in for the reference's pink). Verified in-render via CDP — all 8 nodes resolve to the intended token colours (`rgb(0,115,171)` / `rgb(26,127,84)` / `rgb(168,99,15)` / `rgb(26,24,20)`); palette avatars + section dots + add-step menu + config-panel avatar all read from the same map.
  - **Reference node-card treatment.** Header tint went from a near-invisible 8% to a legible **12% category tint + a matching 24% colour-coded bottom divider** (via `headerStyle(type)`), so a node's type is obvious at a glance (matches the Liquid Sky coloured header band). Added the reference's **"N contacts" caption** under each title (a `users` icon + count) driven by a new optional `FlowNode.contacts` funnel on the seed flow (1,240 → 1,235 → 1,180 → 1,170 → 690/480). Newly-added steps carry no count (no traffic yet).
  - **Scope boundaries (deliberate, to stay surgical).** Kept the **vertical** top-to-bottom flow (the reference is horizontal, but vertical reads better in a narrow prototype canvas and a layout rewrite is high-risk for no UX gain); did **not** reproduce the full ~30-node catalogue (net-new step types = new functionality, not polish); skipped decorative edge **connection-ports** (the card uses `overflow:hidden`; overhanging ports would need a layout change for a purely cosmetic gain — the connector lines + add-buttons already convey flow). `npm run type-check` + `npm run build` GREEN.
- 2026-07-02 — **P3 #17 (loading / error rollout) DONE for the primary surfaces; remaining tables documented as incremental.** (User opted into the low-risk Phase 3 item only; #15/#16 High-risk items deferred.)
  - **Reusable first-load pattern.** Added `src/composables/useInitialLoad.ts` — returns a `loading` ref that flips false ~450 ms after mount. The app is mock-data (synchronous), so this mimics an initial fetch, **matching the app's existing simulated-async convention** (`Analytics/LiveView` already does `await setTimeout(450)`). Centralizing it means one place to swap for a real fetch later, and it only fires on mount (filter/search reuse loaded data — no reload flicker).
  - **`MpTableSkeleton` wired into the 7 primary list pages** (same set as #7): `SalesOrders`, `EmailCampaigns`, `AllContacts`, `ProductsList`, `DraftOrders`, `Fulfillments`, `Coupons`. Skeleton shows while `loading`, real `v-data-table` after. **Verified in-browser via CDP** (SPA router round-trip, since the skeleton is short-lived): on `SalesOrders` mount the skeleton renders with the accessible `role="status"` / `aria-label="Loading"`, then the real table replaces it after the delay (`skeletonSeen: true` → `tableAfter: true`).
  - **Error / not-found state fixed where genuinely reachable.** `ContactDetail` previously **silently `router.replace`-d away** on a bad/stale id (blank flash → bounce). Replaced with an explicit `MpErrorState` ("Contact not found", `role="alert"`, **Back to all contacts** action) — verified in-browser (renders on `/contacts/999999`, stays on route, screenshot confirmed). The other detail pages (`SalesChannelDetail`, `SalesChannelLocationDetail`) **already had** proper not-found states; the two `DashboardView` `router.replace` calls are legitimate dashboard-switch navigation, not silent 404s — left as-is.
  - **Rollout (documented, not forced).** ~40 remaining secondary/analytics tables can adopt `useInitialLoad` + `MpTableSkeleton` the same mechanical way (add the two imports, `const { loading } = useInitialLoad()`, wrap the table in `v-if="loading"` skeleton / `v-else`). Not blanket-applied to avoid adding first-load latency to every deep view at once — same incremental philosophy as #7. `npm run build` GREEN.
  - **Not done (by user's scope choice):** #16 (design-system convergence + systemic `!important` unwind; **High risk**) remains open for a later pass. (#15 completed in the entry above.)
- 2026-07-02 — **P3 #16 (design-system convergence / `!important` unwind) — shipped the safe, high-value slices; sequenced the genuinely high-risk remainder instead of a big-bang.** (This item is **High-risk / Large**; a wholesale library merge + `!important` purge would regress. Measured the real surface first, then shipped only what's provably safe.)
  - **Tabular figures shipped (the one DoD line that's purely additive).** `.num` already existed but wasn't on tables. Added `font-variant-numeric: tabular-nums` to **all `v-data-table` body cells + the pagination footer** (`global.scss`, extending the existing `tbody td` rule) and to **`MpKpiCard`'s value** — so money/counts/dates align by digit everywhere. Safe by construction (affects digit glyph width only; a no-op on letters). **Verified in-browser via CDP:** SalesOrders `td` + footer both compute `tabular-nums` (15 rows), and `MpKpiCard__value` computes `tabular-nums` (ContactDetail, 8 cards) — plus a screenshot showing the TOTAL column digits now line up.
  - **Dead cross-library CSS removed (real convergence, zero risk).** Discovered `MbStatCard` (the Mb* library's stat card) is **no longer used anywhere in `src/`** — `ContactDetail` and `LiveView` both migrated to `MpKpiCard`, but each left behind `:deep(.mb-stat-card …)` override blocks. Since `MpKpiCard` emits **no** `.mb-stat-card` markup, those rules matched nothing. **Proven in-browser before deleting:** `document.querySelectorAll('.mb-stat-card').length === 0` while `.mp-kpi-card === 8` on ContactDetail. Removed both blocks → **−7 `!important`** (ContactDetail 10→5, LiveView 20→18), ~50 lines of dead CSS gone, and **zero `mb-stat` references remain in `src/`**. Screenshot confirms the KPI cards + page render identically. `npm run type-check` + `npm run build` GREEN.
  - **Correction to the P2 #14 log:** that entry called ContactDetail's 10 `!important` "load-bearing… they beat MbStatCard's inline tone props." That was **wrong** — the view no longer renders MbStatCard, so 5 of them were dead. Now removed. (The remaining 5 are legit `.v-card` surface/border overrides.)
  - **Remaining convergence — sequenced plan (deferred, High-risk, by design):**
    1. **Retire `packages/marobase-ui`. — DONE (2026-07-18, branch `refactor/storybook-cleanup`).** `packages/marobase-ui` deleted entirely; its foundation token CSS relocated to `src/styles/mb-foundation.tokens.css`.
       - **Deviation:** the `--mb-*` bridge in `global.scss` was **kept**, not dropped as originally planned — `src/views/Commerce/CommerceCloudLanding.vue` still consumes `--mb-*` vars directly, so removing the bridge would break that view.
       - **Follow-up:** migrate `CommerceCloudLanding.vue` to `--mp-*` tokens, then remove the `--mb-*` bridge from `global.scss` and delete `src/styles/mb-foundation.tokens.css`.
    2. **Systemic `!important` unwind (~240 remain).** Concentrated in `AppSidebar` (42), `LiveView` (18), `AppBar` (13), `DashboardView` (12), `Merchandising`/`DvWidgetDraftCard`/`DashboardWidgetCard` (7–10 each). Most fight Vuetify component internals (overlay opacity, field outline, list-item spacing). The correct fix is to push these into Vuetify **global `defaults` + theme + component SASS variables** in `plugins/maropostTheme.ts`, not per-file `!important`. *Effort L, risk High — do it per cluster with in-browser regression checks; start with the self-contained sidebar cluster, then the `global.scss` table-header cluster.*
    3. **Hardcoded hex/px triage + guardrail.** Bulk of the hex lives in **intentional** components (POS device preview ×58, DaVinci orb/voice canvases, chart series colours) where raw hex is legitimate; the fixable subset is view-level one-offs. Add a **stylelint `color-no-hex` rule with an allowlist** for `copilot/voice`, `Retail/PosPreview`, and chart dirs to stop *new* drift, then migrate flagged views. *Effort M, risk L–M.*
    4. **Tabular figures — DONE (this pass).**

### Follow-ups (post-Phase 3)

- 2026-08-27 — **Toolbar search border aligned *down* to `--mp-border-subtle` (consistency over contrast).** `MpDataTableToolbar`'s search field drew its own 1px border at the A11Y-001 compliant `color-mix(in srgb, var(--text-secondary) 75%, transparent)` (~3.5:1), while the Filter button, column-toggle and `MpFolderSelect` beside it in the same row use `--mp-border-subtle` (`#e2e8f0`, ~1.2:1) via `global.scss`'s `.v-btn--variant-outlined` rule. Verified in-browser (`getComputedStyle`): identical 1px / solid / 9999px on both, differing **only** in colour — one row reading as two control families. The search field now references the **same custom property** as the buttons (not a copied hex), so the two cannot drift apart in either theme (`#e2e8f0` light / `#33373D` dark, both confirmed rendered). Focus state untouched and still compliant (2px `--focus-ring` + accent border, confirmed `rgb(0,115,171)`).
  - **This is a deliberate reversal of the A11Y-002 correction**, recorded as accepted risk in `docs/ui-system-audit/03-accessibility-audit.md` rather than dropped silently. Scope is the toolbar only; outlined fields elsewhere keep the compliant A11Y-001 `color-mix`.
  - **Bearing on the deferred "interactive border token" item above:** this is a data point *against* introducing it as a ≥3:1 value — the product direction here is the faint hairline. If that token is ever adopted, it must move outlined **buttons** and this field together, in one pass.
  - Known, deliberately not addressed in the same change: the search field renders **46px** (`density="comfortable"`) against the buttons' **40px** in the same row.
  - *(Later same-day correction, see below: "outlined fields elsewhere keep the compliant A11Y-001 color-mix" is no longer true as of the field-baseline restyle — that rule was removed.)*

- 2026-08-27 — **Field baseline restyled platform-wide to a Flowbite-style floating label** (flowbite.com/docs/forms/floating-label — the outlined variant), on principal-design direction that inputs read "heavy and basic": transparent fill (was a `color-mix(--surface-secondary)` tint, darkening further on hover), resting border lightened from the A11Y-001 `color-mix(in srgb, var(--text-secondary) 75%, transparent)` (~3.5:1) to `--border-strong` (`#d4d4d4`/`#4D535B`, ~1.5:1), focus/error borders changed from 1px + a 3px glow ring to a plain 2px border with **no ring**, and the floating label — rendered natively by Vuetify's `label` prop on every field already, previously completely unstyled — restyled to 12px/500 weight with state-matched color (muted → primary on focus → error-color on error). Single-owner change in `src/styles/settings-form.scss`; the old `global.scss` A11Y-001 override that used to out-specify it was deleted (see that file's replacement comment) so `settings-form.scss`'s own header contract — "this file owns field chrome" — is true again.
  - **Real bug caught mid-build, not shipped:** the floating-label color rules for focus/error/disabled were first written as plain base-specificity rules and silently lost a tie against Vuetify's own built-in `.v-field--error .v-label { color: error }` rule (both (0,4,0), and this file loads after Vuetify's component CSS) — verified via `getComputedStyle` per state in the browser, not visible from reading the CSS. Fixed by chaining `.v-field--variant-outlined` into each state selector to reach (0,5,0), the same technique the border rules already used. Documented in `settings-form.scss` as a standing caution for the next person adding a label-color rule there.
  - **This is a second deliberate A11Y-001-adjacent reversal**, recorded as accepted risk in `docs/ui-system-audit/03-accessibility-audit.md`. Mitigation: focus/error both render a 2px colored border (up from 1px) plus a colored floating label, so the resting hairline is never the field's only affordance.
  - **Converted the platform's second label language.** 29 Settings fields (`AccountDefaultsPage.vue` ×15, `GeneralPage.vue` ×9, `ServicePage.vue` ×5) used an external uppercase `<label class="settings-field__label">` above an unlabeled field, competing with the 508 fields already using Vuetify's floating `label` prop. Moved each label's text into the field's `label` prop (mechanical, one field at a time, slot content on the readonly Account ID field preserved) and deleted the now-dead `.settings-field__label` CSS rule (confirmed zero remaining references first). One label language platform-wide.
  - **⚠️ Correction (same day):** this entry originally claimed a screenshot showing a giant label "turned out to have zero DOM footprint on inspection and was discounted." **That was wrong — it was a real regression** (`scale(12)` on the floating label, see the next entry). The inspection that "cleared" it scanned computed `font-size`, which a `transform: scale()` does not change. Treat the verification claim below as covering the *settled* state only.
  - **Verified in-browser**, both themes, via `getComputedStyle`: resting transparent/`#d4d4d4`/40px unchanged in height; hover darkens; focus is 2px primary with `box-shadow: none` and a 12px primary floating label; error is 2px error-color, no ring; disabled border lightens further. Storybook `Forms/Form Fields` gained a `FloatingLabelStates` story (+ dark pin) — no prior story rendered a *focused* field; `autofocus` doesn't work here because it races Vuetify's own focus listener (input becomes `document.activeElement` but `.v-field--focused` never gets set), worked around with a template ref + `onMounted(() => nextTick(() => ref.value?.focus()))`, documented inline as it's a reusable gotcha. Regression-checked against this session's earlier toolbar-border and badge work — both unaffected (sanctioned overrides, own specificity). `npm run type-check` clean; zero console/server errors.
  - **Not done (explicitly out of scope, flagged in code review rather than fixed):** the 64 placeholder-only fields (mostly search/toolbar) are unchanged — no label to float, so they read the same as before minus the tint. A future sweep could give the more form-like ones among these an actual `label`.

- 2026-08-27 — **Fix: floating label flashed at 12x size on every field focus (regression from the entry above).** `--v-field-label-scale` looks like a font-size token but Vuetify uses it twice: `VField.css` reads it as the floating label's `font-size`, and `VField.js:145` does `parseFloat(getPropertyValue('--v-field-label-scale'))` to build the label's float animation, `transform: scale(<that number>)`. The restyle set it to `12px`, so `parseFloat` returned **12** and every labelled outlined field animated its label to `scale(12)` — a page-wide flash on click, live in the app (all ~620 labelled field instances), not just Storybook. Fixed by setting `font-size: 12px` directly and leaving `--v-field-label-scale` at Vuetify's `0.75em` default: the direct rule out-specifies Vuetify's `font-size: var(...)` ((0,4,0) vs (0,2,0)) so the rendered size is unchanged, while `parseFloat` gets the correct 0.75. Note deleting the override *alone* is not enough — `0.75em` resolves against the notch's 14px parent (our `.v-field--variant-outlined { font-size: 14px }`) = 10.5px, a silent size regression; both halves are required. 12px is also exactly 0.75 x the 16px resting label, so the animation's end state lands on the real floating label with no size pop and matches Vuetify's hardcoded `targetWidth / 0.75` width math.
  - **Why it shipped — two verification failures worth internalising.** (1) The defect *was* visible in a dark-mode screenshot during the restyle and was explained away: the check scanned every element for computed `font-size > 30px`, found none, and concluded "screenshot artifact" — but a `transform: scale()` leaves `font-size` untouched. Wrong property. (2) The giant label exists only during the ~150ms WAAPI animation (the resting label is `visibility: hidden` once settled), so every `getComputedStyle` probe — all of which ran after a `wait` — saw a perfectly correct field. **A settled-state assertion cannot see a transition-state bug.**
  - **How this fix was verified differently:** a per-frame `requestAnimationFrame` sampler recording max `scaleX` across all labels, armed on `focusin` and driven by a *real* click (programmatic `.focus()` does not register when the tab lacks focus). Critically, the sampler was **validated against the broken state first** — the bug was temporarily re-injected in-page and the sampler correctly reported `scaleX: 12`, proving it could detect the defect before its clean result was trusted. Then: bug removed, re-armed, re-clicked → max 1x over 24 frames (light, app) and 1x (dark, Storybook), with settled state unchanged (2px primary border, `box-shadow: none`, 12px primary label) and the earlier toolbar work unaffected.
  - **Scope-checked:** audited every Vuetify custom property this file sets against every `getPropertyValue` call in `node_modules/vuetify/lib`. `--v-field-border-opacity` and `--v-field-border-width` (the 2px focus/error borders) are CSS-only and never JS-parsed, so `--v-field-label-scale` was the only instance — a single-line fix, not a class of bugs. The footgun is documented in `settings-form.scss` at the point of reuse; a static Storybook story cannot guard it, since the defect only exists mid-transition.
