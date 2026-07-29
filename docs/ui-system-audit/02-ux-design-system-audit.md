# 02 — UX / Design-System Audit (live)

**Scope:** UX and design-system quality on representative live screens — dashboard + Add-widget wizard, contacts data table, campaigns/journeys, settings, a form drawer, a confirm dialog, `v-select`/`v-menu` behaviour, icon-only button tooltip coverage, and 768px/375px responsive behaviour. Both themes were sampled on the starred (★) screens.

**Method:** Live app driven at `http://localhost:5173` (account `2000290`) via browser automation — screenshots, the accessibility tree, and direct DOM/computed-style/`getAnimations()` queries to verify anything a screenshot alone couldn't prove. Every finding below was cross-checked against the source file, not asserted from a screenshot alone. One environment quirk is worth flagging for whoever runs this again: the automated tab reports `document.hidden = true` (Page Visibility API), which freezes CSS/WAAPI animations mid-flight and produces misleading transient-opacity readings — I hit this once (the floating bulk-action bar briefly looked stuck at ~60% opacity) and discounted it after confirming it was a frozen animation clock, not application state.

**Does not duplicate:** `docs/overlay-audit/01-overlay-component-audit.md` (overlay inventory + locked decision 2A), `docs/dark-mode/07-final-verification.md` (dark mode is done/verified — I only spot-checked it and found no new defects), `docs/ui-system-audit/03-accessibility-audit.md` (semantic/contrast/keyboard specifics), and `docs/ui-system-audit/00-reference-research.md` (pattern benchmarks — several findings below are the live confirmation of gaps that doc already flagged from static research, e.g. "selected state = trailing checkmark" and the tooltip guidance naming `MpRowActionsMenu`/`AppBar.vue`/table toolbars).

**Constraint:** every recommendation below is implementable via tokens, Vuetify defaults, `global.scss`, or edits to an existing Mp*/domain component — no new wrapper components, per decision 2A.

**Read-only:** no source files were modified to produce this report.

---

## Severity counts

| Severity | Count |
|---|---|
| Blocker | 0 |
| High | 3 |
| Medium | 5 |
| Low | 1 |
| **Total** | **9** |

This app has had recent, real polish (dark mode, overlay tokens). I did not manufacture findings to hit a quota — several screens (MpConfirmDialog, MpFormDrawer/Add Contact, the widget-wizard chart-type step, JourneyAddStepMenu, the bulk-selection bar, dark mode on every starred screen) had nothing worth reporting and are listed under "What already works" below.

---

## What already works (not re-reported as findings)

| Area | Screen | Note |
|---|---|---|
| MpConfirmDialog | Contacts → row kebab → Delete | Correct icon/copy/danger button; "This cannot be undone" framing |
| MpFormDrawer (Add Contact) | Contacts → Add Contact | Clean 2-step layout, sensible field grouping, Cancel/Next footer |
| Widget-wizard Step 2 (chart type) | Dashboard → Add widget → pick a chart | Radio-card selection with border + tint + focus-ring — this is the "selected = border + faint tint" pattern the reference research recommends; use it as the template when fixing UX-008 |
| JourneyAddStepMenu | Journey builder → "+" between steps | Has real section headers ("Common", "Actions") with colored per-type icons — better grouping than the widget library (see UX-002) |
| Bulk selection bar | Contacts → select 2 rows | Count, "Select all (60)", Export/Delete, Clear selection all correct once driven by a real pointer click |
| Dashboard grid reflow | Dashboard, Da Vinci panel open | `grid-layout-plus` genuinely reflows KPI card width to the available container (not just viewport breakpoints) — the container reflows correctly; the problem is what happens *inside* the narrowed card (UX-001) |
| Responsive at 768px/375px | Dashboard | Sidebar auto-collapses to rail, KPI grid drops to 2 cols / 1 col, no page-level horizontal overflow (`scrollWidth === clientWidth` confirmed at both widths) |
| Dark mode | Dashboard, Add-widget wizard, Contacts | No new defects found; consistent with the closed-out dark-mode program |
| Console | All screens visited | Zero console errors/warnings the entire session |

---

## Findings

### UX-001 — Dashboard widget footer/legend content overflows when the card narrows below ~250px

| Field | Detail |
|---|---|
| **Severity** | High |
| **Component** | `src/components/dashboards/widgets/DashboardKpiWidget.vue` (footer: lines 162-177 template, 453-464 CSS) and `src/components/dashboards/widgets/DashboardChartWidget.vue` (legend) |
| **Screen/URL** | `/accounts/2000290/dashboard`, both themes, triggered by opening the Da Vinci copilot panel (or any viewport where the widget grid column drops below ~250-300px) |
| **Existing behaviour** | The KPI widget already has a container query at `max-width: 260px` that hides the icon chip and shrinks the value font (`DashboardKpiWidget.vue:188-196`), but the **footer row** (`.dashboard-kpi-widget__foot`, source chip + "Updated Xh ago", both `white-space: nowrap`, `justify-content: space-between`) has no matching narrow-width rule. Verified by opening the copilot drawer and measuring: card width dropped to 196px, footer `scrollWidth` (218px) exceeded `clientWidth` (196px) by 22px — text is clipped by the card's overflow. The same narrowing also crowds `DashboardChartWidget`'s legend ("Revenue by channel" legend truncates to "Paid Sea…", "Traffic mix" percentage labels overlap the donut). |
| **UX impact** | The very first thing a user sees (dashboard + Da Vinci panel open together, which the app opens by default on load) shows clipped "Updated …" timestamps and a garbled chart legend — reads as broken, not just tight. |
| **Recommended direction** | Add a matching container-query breakpoint (e.g. `max-width: 220px`) that truncates the "Updated …" label with ellipsis or drops it in favor of the source chip alone (icon-only), mirroring the existing icon-hide breakpoint. For the chart legend, cap legend item width with `text-overflow: ellipsis` or reduce to icon+abbreviated label below a matching container width. Fully within tokens/CSS — no new component. |
| **Storybook implication** | `MpKpiCard`/dashboard widget stories have no "narrow container" state — add one pinned at ~200px to catch regressions. |
| **A11y implication** | Minor — truncated text should keep the full string in a `title`/`aria-label` so the info isn't lost for anyone who can't see the clipped visual. |

### UX-002 — Add-widget library (Step 1) has no category grouping in the default "All" view

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Component** | `src/components/dashboards/wizard/WidgetLibraryStep.vue` (lines 36-46 filter logic, 105-136 flat list render) |
| **Screen/URL** | `/accounts/2000290/dashboard` → Add widget → Step 1 |
| **Existing behaviour** | 28 widgets across 5 clouds (Commerce, Marketing, Service, Retail, Merchandising) render as one flat list under "Existing widgets" with no section headers — confirmed via DOM query (no heading/section elements match inside the list) and via source (`filteredEntries` is a single filtered array, rendered with no `v-for` grouping). The only way to see one cloud at a time is the category filter chips above the list; the default "All" state is 28 undifferentiated rows distinguished only by icon. |
| **UX impact** | Scanning 28 items with only an icon (not a label) to tell "Commerce" from "Retail" apart is slow; a new user has to either guess or click through 5 filter chips one at a time. `JourneyAddStepMenu` (same drawer family, "+" menu in the journey builder) already solves this correctly with labeled section headers — this component is the outlier. |
| **Recommended direction** | Add a small muted category label per row (reusing the existing `CATEGORIES` label set already defined in the component) or group `filteredEntries` under repeated section headers when `activeCategory === 'all'`, styled like `JourneyAddStepMenu`'s "Common"/"Actions" headers. No new component — same file. |
| **Storybook implication** | `WidgetWizardDrawer` stories should add a "library grouped" state once fixed. |
| **A11y implication** | Grouping with real `<h3>`/`role="group"` headers would also give screen-reader users landmarks currently missing from the flat list. |

### UX-003 — Timeseries/bar chart x-axis labels aren't decimated, overlap at narrow widths

| Field | Detail |
|---|---|
| **Severity** | High |
| **Component** | `src/components/dashboards/widgets/DashboardChartWidget.vue` (lines 262-269, `xaxis.categories`) and `src/plugins/chartPalette.ts` (lines 398-402, shared `xaxis` base — no `tickAmount`/rotation/decimation anywhere) |
| **Screen/URL** | `/accounts/2000290/dashboard` → Add widget → pick "Revenue over time" → Step 2 preview; also visible (less severely) on the full-width "Revenue Over Time" dashboard card |
| **Existing behaviour** | The x-axis is configured as a **category** axis (`categories: props.data.labels`), not `type: 'datetime'`, so ApexCharts renders every label with no auto-decimation. The underlying label data itself repeats the same day multiple times (e.g. `07-28` appears 8 times, `07-29` 7 times, from the accessibility tree dump), so even the full-width dashboard card is crowded; in the ~480px-wide widget-wizard preview it's actively illegible — confirmed visually, labels render as a solid smear like "07-12-13-14-15-15-16-16-17-17-18-18-19-19-…-29". |
| **UX impact** | The one place a merchant checks their work before adding a widget (the live preview) is unreadable for every time-series chart type. |
| **Recommended direction** | Either switch to `xaxis.type: 'datetime'` (lets Apex auto-decimate/format based on available width) or add an explicit `tickAmount` (e.g. 6-8) with rotation as a fallback, in the shared `chartPalette.ts` base so every chart widget benefits at once. Token/config-level fix, no new component. |
| **Storybook implication** | Add a "narrow container" chart story to catch this regression class going forward. |
| **A11y implication** | None beyond the existing chart a11y baseline (charts already expose data via the accessibility tree per the earlier read_page dump). |

### UX-004 — `MpRowActionsMenu` gives every row in a table the same accessible name

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Component** | `src/components/MpRowActionsMenu.vue` (lines 3-5 prop doc, line 22 `:aria-label="ariaLabel"`) |
| **Screen/URL** | `/accounts/2000290/contacts` (and ~30 other list views — see systemic patterns) |
| **Existing behaviour** | The component's own contract is a single static string per view (its doc comment literally says `e.g. "Journey actions"`). On Contacts, every one of the 60 row kebabs announces as "Contact actions" — confirmed via `document.querySelectorAll('button[aria-label]')`, all identical. Grepping `MpRowActionsMenu ariaLabel=` across `src/views` shows the same one-static-label-per-view pattern in every consumer (Orders, Products, Segments, Journeys, Chatbots, etc.) — this is systemic, not a Contacts-specific bug. Contrast with the journey builder's own node kebabs, which *do* interpolate the row's identity (`"Actions for Send: Welcome Email"`, `"Actions for Wait 2 Days"`) — proving the pattern is easy and already used elsewhere in the same app. |
| **UX impact** | A keyboard/screen-reader user tabbing through a 60-row table hears "Contact actions, button" 60 times with no way to tell which row they're on without also reading the preceding cell content — meaningfully slower table navigation for assistive-tech users. Noted as a **Pass** in `03-accessibility-audit.md` because the prop is non-empty (it satisfies the letter of "required ariaLabel"); this finding is the scanability layer on top of that — the label exists but doesn't identify the row. |
| **Recommended direction** | Add an optional `itemLabel` prop to `MpRowActionsMenu` (e.g. `ariaLabel="Contact actions"` + `itemLabel="James Anderson"` → computed `"Contact actions for James Anderson"`), matching the pattern `DashboardWidgetActionMenu` already uses (`` `Actions for ${widgetTitle}` ``). One component change fixes it everywhere it's threaded through; consumers can adopt it incrementally. |
| **Storybook implication** | Add an `itemLabel` variant to the existing MpRowActionsMenu story. |
| **A11y implication** | Directly improves table navigation efficiency for screen-reader/keyboard users; doesn't change anything visual. |

### UX-005 — Journey builder zoom controls: 2 of 4 icon buttons lack a hover tooltip

| Field | Detail |
|---|---|
| **Severity** | Low |
| **Component** | `src/views/Marketing/JourneyBuilder.vue` (lines 657-671) |
| **Screen/URL** | `/accounts/2000290/journeys/1/builder`, bottom-right zoom cluster |
| **Existing behaviour** | In the same 4-button cluster: "Fit to view" (line 658) and "Reset to 100%" (line 665) are wrapped in `<v-tooltip>`; "Zoom out" (line 664) and "Zoom in" (line 671) are bare `v-btn`s with only `aria-label`, no visible tooltip — confirmed via `aria-describedby` presence (set for the first two, `null` for these two). |
| **UX impact** | Small, but the inconsistency is visible within a single 4-button toolbar — a sighted user gets a hint for 2 of the 4 controls and not the other 2, which reads as unfinished rather than intentional. |
| **Recommended direction** | Wrap the `zoom-out`/`zoom-in` buttons in `<v-tooltip text="Zoom out"|"Zoom in" location="top">` exactly like their siblings in the same file. |
| **Storybook implication** | None dedicated; would show up if a journey-builder toolbar story is ever added. |
| **A11y implication** | None — `aria-label` already covers the accessible name; this is purely the sighted-hover affordance. |

### UX-006 — AppBar "Quick create" (+) icon button lacks a tooltip; adjacent icons in the same cluster have one

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Component** | `src/components/layout/AppBar.vue` (lines 433-445 vs. 476-497) |
| **Screen/URL** | Every page — global AppBar, `appbar-utilities` cluster |
| **Existing behaviour** | The "+" (Quick create) button (lines 435-445) is a bare `<button aria-label="Quick create">` with no `v-tooltip`. Its immediate neighbors in the same `.appbar-utilities` row — Notifications (line 476) and Settings (line 491) — are both wrapped in `<v-tooltip>`. |
| **UX impact** | The "+" glyph is less universally self-explanatory than a bell or gear; it's the one icon in this row that would benefit most from a hover label, and it's the one missing it. Present on literally every screen in the app. |
| **Recommended direction** | Wrap the Quick-create trigger in `<v-tooltip text="Quick create" location="bottom">` matching the Notifications/Settings pattern immediately below it in the same file. |
| **Storybook implication** | AppBar stories (9 present) should get a hover-state pin once fixed. |
| **A11y implication** | None — `aria-label="Quick create"` already exists; this is the sighted-hover affordance only. |

### UX-007 — MpDataTableToolbar's column-visibility button has no tooltip at all

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Component** | `src/components/MpDataTableToolbar.vue` (lines 86-106) |
| **Screen/URL** | Every data-table list view (Contacts confirmed live; same toolbar per `CLAUDE.md`'s documented "Data Table Pattern" on ~40 list pages) |
| **Existing behaviour** | The `icon="columns-3"` button (toggle column visibility) has an `aria-label` but is not wrapped in any `v-tooltip` — confirmed by grepping the whole file for `v-tooltip` (zero matches). Its sibling "Filter" button doesn't need one because it has a visible text label ("Filter"); the columns button is icon-only with a less universally recognized glyph. |
| **UX impact** | New users are unlikely to guess "a grid of 3 columns" means "show/hide columns" without a hint, and this button appears on essentially every list page in the product. |
| **Recommended direction** | Wrap the button in `<v-tooltip text="Toggle visible columns" location="bottom">` in `MpDataTableToolbar.vue` — a single-file fix that reaches every consumer at once. |
| **Storybook implication** | None currently cover toolbar tooltips; worth a hover-state pin once added. |
| **A11y implication** | None — the `aria-label` (with hidden-count suffix) is already correct; this is the sighted-hover affordance only. |

### UX-008 — `v-select`/`v-menu` selected option is shown by background tint alone, no checkmark

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **Component** | No single file — Vuetify's default `VListItem`/`VSelect` behavior; no `maropostDefaults` override exists for it (`src/plugins/vuetify.ts` / `src/styles/global.scss` — confirmed no `.v-list-item--active` rule outside `AppSidebar`) |
| **Screen/URL** | `/accounts/2000290/settings` → Account Defaults → Industry select (representative of ~90 `v-select` usages app-wide per the overlay audit's inventory) |
| **Existing behaviour** | Opening the Industry dropdown shows "E-Commerce" (the current value) distinguished only by a light primary-tinted row background — no check icon, no bold weight difference beyond what the tint implies. |
| **UX impact** | At a glance (especially scanning quickly, or in dark mode where tint deltas read as subtler), it's easy to miss which option is currently selected versus merely hovered. `00-reference-research.md`'s own pattern research (Family 1) explicitly calls this out: "selected state = trailing checkmark, never a filled row" — this live check confirms the app doesn't yet follow that guidance anywhere. |
| **Recommended direction** | Add a trailing check icon for the active item via a small global rule targeting Vuetify's `.v-list-item--active` inside menu/select overlays (`global.scss`, alongside the existing menu chrome rules), or a shared `#item` slot convention — no new component, consistent with decision 2A. |
| **Storybook implication** | Expand `Forms/Form Fields` stories to include an "open menu, item selected" state so the checkmark (once added) is pinned. |
| **A11y implication** | `aria-selected`/`aria-activedescendant` are Vuetify defaults and already correct per `03-accessibility-audit.md`; this is a purely visual redundant-cue improvement (helps low-vision users who rely on shape, not just color/tint, to find the selected row). |

### UX-009 — Data tables push Status/Score/row-actions off-screen at phone widths with no scroll affordance

| Field | Detail |
|---|---|
| **Severity** | High |
| **Component** | General `v-data-table` pattern (no responsive column-priority logic anywhere) — confirmed on `src/views/Contacts/AllContacts.vue`, no `mobile`/`smAndDown` handling found in that file or its toolbar |
| **Screen/URL** | `/accounts/2000290/contacts` at 375×812 |
| **Existing behaviour** | At 375px the table wrapper (`.v-table__wrapper`) measures `scrollWidth: 503` vs. `clientWidth: 311` — a genuine 192px of horizontally-scrolled content containing Company, Tags, Status, Score, Last Active, and the row kebab. The row kebab is present and functional in the DOM (confirmed clickable off-screen) but nothing in the UI hints the row scrolls — no shadow/gradient fade at the trailing edge, no visible scrollbar in the screenshot, no "swipe to see more" affordance. A phone user sees only Contact name/email per row and has no visual cue that Status, Score, or the edit/delete action exist. |
| **UX impact** | On a real phone, discovering "there are more columns, including the delete action" requires an accidental horizontal swipe inside the table — most users won't find it. This is a discoverability blocker for an entire class of actions (edit/delete/status) on mobile, not just a cosmetic squeeze. |
| **Recommended direction** | Either (a) add a subtle trailing-edge scroll-shadow/gradient via `global.scss` on `.v-table__wrapper` so overflow is visually signaled everywhere it occurs (cheap, systemic, no new component), or (b) for the highest-traffic tables define a mobile column priority (Contact + Status only, collapse the rest behind the existing kebab) using Vuetify's `useDisplay().smAndDown` the same way `DashboardGrid.vue` already does. (a) is the lower-effort, decision-2A-aligned fix; (b) is the fuller solution if mobile table use is a real workflow. |
| **Storybook implication** | Add a 375px-pinned story for `MpDataTableToolbar` + a representative table to catch this class of regression. |
| **A11y implication** | Keyboard-only users tabbing through the row can still reach the off-screen kebab (browser auto-scrolls focused elements into view), so this is primarily a discoverability issue for pointer/touch users, not a hard keyboard-access failure. |

---

## Systemic patterns

| Pattern | Rough count | Findings it produced |
|---|---|---|
| Icon-only buttons with inconsistent tooltip coverage (some siblings tooltipped, some not, within the same cluster) | 3 confirmed clusters (journey-builder zoom, AppBar utilities, data-table toolbar) across an app with ~119 `v-tooltip` openings total (per overlay audit) | UX-005, UX-006, UX-007 |
| `MpRowActionsMenu` consumers using one static label for every row | ~30 views grepped (`Order actions`, `Contact actions`, `Journey actions`, `Product actions`, etc.), 0 exceptions found | UX-004 |
| Widget/dashboard content with no matching narrow-width fallback despite an existing container-query breakpoint one step wider | 2 confirmed (KPI footer, chart legend) inside 1 shared container-query pattern | UX-001 |
| Selected-state affordance = tint only, no icon | ~90 `v-select` openings (per overlay audit's primitive-usage count); same gap likely applies to any custom `#item` slot menus that don't add their own check icon | UX-008 |
| No responsive column-priority strategy for `v-data-table` | Systemic — every list view built on the documented "Data Table Pattern" in `CLAUDE.md` inherits the same mobile overflow behavior | UX-009 |

---

## Console

Zero console errors or warnings across every screen visited (dashboard, widget wizard both steps, contacts + filters + bulk selection + confirm dialog + add-contact drawer, campaigns, campaign reports, journeys list, journey builder + add-step menu, settings, both themes, both narrow viewports).

---

## Hard-stop

Live audit complete. 9 findings (3 High, 5 Medium, 1 Low), all traced to source with exact line numbers, all implementable via tokens/Vuetify defaults/global.scss/existing-component edits per decision 2A. Recommend prioritizing UX-001 and UX-003 first (both are foundation-level dashboard/chart-widget fixes with the broadest blast radius), then UX-009 (mobile action discoverability), then the tooltip/aria-label consistency cluster (UX-004, 006, 007) since each is a single-file, low-risk fix that reaches many screens at once.
