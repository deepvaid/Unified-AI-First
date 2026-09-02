# Aesthetic Recipe

The **look** layer of the polish loop. [polish-playbook.md](polish-playbook.md) makes a page *correct*
(states, a11y, responsive, Mp\* composition, no new hex/px). This recipe makes it *ours*: calm
spacing on tokens, one type hierarchy, one icon ramp, tonal states, no legacy-shaped chrome. Both
apply to every page; where they overlap, the playbook's rule wins and this file says how it should look.

**Authority order:** `src/design-tokens/tokens.json` → `CLAUDE.md` conventions → this recipe →
`polish-playbook.md`. **Reference implementation:** `src/views/Service/Tickets.vue` and
`src/components/service/TicketWorkspace.vue` (commits `bd542c8`, `8d265b7`, 2026-09-02) — open them
side by side with the page you are polishing.

Every item below is written as a check → fix. An audit lists findings as `(item letter.number) →
planned fix`; a page with zero findings is marked done with no commit.

---

## A. Page frame

- **A1.** The page root is never `pa-6` (or any padding) on top of the shell — `.mp-main-shell`
  already pads 32/36 (28 ≤1024, 22 ≤640). Ordinary pages use the convention root
  `<div class="h-100 d-flex flex-column gap-5">` (see `Commerce/SalesOrders.vue`, `Contacts/AllContacts.vue`).
- **A2.** Full-height workspaces (split views, editors, builders that are not `builderShell`) use
  `.mp-frame-fill` with a head band (`padding: var(--mp-space-24) var(--mp-space-32) var(--mp-space-16)`;
  `var(--mp-space-16)` gutters below `$mp-layout-breakpointSplit`) — the CreatePromotion / Tickets
  idiom. Every `calc(100vh - …px)` constant in a view is a finding; delete it.
- **A3.** One `MpPageHeader` (`density="compact"` inside a frame-fill head band), one visually
  primary CTA (`color="primary" variant="flat"`). Secondary actions are `variant="outlined"` or `text`.

## B. Spacing rhythm (tokens only)

- **B1.** Card root insets come from `component.card.*`: `padding` 20 (standard), `paddingCompact` 12
  (list headers, dense panels), `paddingSpacious` 32 (empty/marketing surfaces). Gaps `card.gap` 16 /
  `gapCompact` 8. **Never a `pa-*` utility on a card root.** A card needing a fourth value is a design bug.
- **B2.** Forms: `MpFormGrid` owns the field rhythm (`field.groupGap` 16); `MpFormSection` owns the
  air around headings (`sectionGap` 24). Any `mb-*`/`mt-*` on a field or heading inside those is a finding.
- **B3.** Rows sit on `component.listItem.*` (min 40, padding-block 8, padding-inline 12, gap 12);
  tables on `component.table.*` floors; every control in a toolbar row is `control.height` 40.
- **B4.** Hairlines are `1px solid var(--border-subtle)` and earn their place: prefer whitespace,
  never nest a bordered box inside a bordered box, never a border plus a background to separate.
- **B5.** Between sibling blocks use `ga-4` (16) inside a card and `gap-5`/`ga-6` (20/24) between
  cards. When in doubt between two paddings, pick the more generous one.

## C. Typography

- **C1.** Page title only via `MpPageHeader`. Section or pane titles use `.mp-section-title`
  (`text.sectionTitle`, 16/650). No ad-hoc `text-h6`/`text-subtitle-1` headings.
- **C2.** Labels: `var(--mp-text-label-fontSize)` / `var(--mp-text-label-fontWeight)` (13/500).
  Eyebrows: `.mp-meta-label` (11/600 uppercase) **sparingly** — one per surface. Inline labels next
  to a value (property chips, key/value rows) are sentence-case muted 12px, not uppercase.
- **C3.** Body 14, caption 12; nothing below 11. Weights via `var(--mp-fontWeight-medium|semibold|bold)`.
  Vuetify has no `font-weight-semibold` utility — add one scoped class (`.x-strong`) rather than `600`.
- **C4.** Numbers, dates and counts are `tabular-nums`; author/meta rows put the name in bold 12 and
  the time in a muted `<time>` (MpChatBubble's `author` + `time` props, never packed into one string).
- **C5.** Muted text uses `text-medium-emphasis` in templates or `var(--on-surface-muted)` in CSS;
  never a literal opacity.

## D. Icons (Lucide, kebab-case)

- **D1.** One size ramp: **16** in rows, meta lines and chips · **18** in headers, rails and toolbars ·
  **20** in buttons (Vuetify default). The only exception is a 14 chevron inside a 32px chip.
  Any 12/13/14 elsewhere is a finding.
- **D2.** Icon-only buttons carry `aria-label` **and** a `v-tooltip`. Toggles carry `aria-pressed`;
  their active look is `variant="tonal" color="primary"`, never a bare `color` swap on a text button.
- **D3.** Icons mean something: status `circle-dot`, agent/owner `user`, type/category `tag`,
  history/activity `history` or `activity`, inbox `inbox`, sort `arrow-up-down`, back `chevron-left`.
  Replace decorative or generic (`circle`, `dots`, `mdi-*`) icons.
- **D4.** Priority/severity dots are 8px (`--mp-space-8`) on the theme colour, paired with text.

## E. Colour and states

- **E1.** Hover `background: var(--surface-secondary)`; selected `background: var(--accent-soft)`;
  no inset bars, no `rgba(…, 0.04)` literals.
- **E2.** Focus is `outline: 2px solid var(--focus-ring)` (offset 2, or −2 inside a bordered box).
- **E3.** Status chips are `MpStatusChip` in the default tonal variant inside lists and tables, so
  colour carries the state; `variant="outlined"` only inside dense chrome where tint would shout.
- **E4.** Every painted surface names its own foreground (`on*` pairs in `mp-theme-aliases.css`);
  `npm run contrast:check` must stay green. Check the page in dark theme
  (`localStorage.setItem('app-theme-mode','dark')` + reload).
- **E5.** Priority tints for warm/soft surfaces: `--warn-soft`/`--warn-ink`, `--pos-soft`/`--pos-ink`,
  `--neg-soft`/`--neg-ink`; the primary tint is `--accent-soft` with `--accent-on-container`.

## F. Composition patterns

- **F1. Lists.** Two-line rows: line 1 title (semibold if unread) + right-aligned tabular date;
  line 2 `owner · snippet` muted + right-aligned `MpStatusChip size="sm"`. Bulk checkboxes reveal on
  row hover / `:focus-within` / checked / while any selection exists, column always reserved.
  The list header holds views/scope · a sort menu (`arrow-up-down`, `MpMenuItem role="menuitemradio"`)
  · a search field (`placeholder` + `aria-label`, `hide-details`, no label) · `MpFilterTabs` as the
  one promoted quick filter (the promoted field leaves the Filters drawer). Empty state is search-aware
  with a "Clear search" action.
- **F2. Tables.** `MpDataTableToolbar` above every `v-data-table` (search, quick filter, Filter
  button); `MpEmptyState`/`MpTableSkeleton`/`MpErrorState` states; kebab via `MpRowActionsMenu` with
  `itemLabel`.
- **F3. Master–detail.** The detail pane has a title band (eyebrow `#id · channel · scope` +
  subject in `.mp-section-title`) and a property row of field-chips: height `field.height.sm` 32,
  `background: var(--surface-secondary)`, `border-radius: var(--mp-component-chip-radius)`,
  `padding-inline: var(--mp-space-10)`, icon 16 + muted label + value 13/semibold + chevron 14.
  The actions cluster (toggle · expand · kebab) is one `ms-auto` flex group so a kebab never orphans.
- **F4. Composers and footers** dock below the scroller (`v-if` composer / `v-else` action bar in a
  `flex-shrink-0` footer, `max-height: 60%`); the scroller gets `flex: 1 1 0; min-height: 0` and
  scrolls to its end on open/send. Inert controls (disabled toolbars for out-of-scope features) are
  removed in favour of one muted hint.
- **F5. Panels and drawers.** Label/value pairs use `<dl class="mp-label-value">` (single column via a
  scoped `grid-template-columns: 1fr`). Transcript surfaces use `MpChatBubble`, re-skinned through the
  `--mp-bubble-*` custom properties on a host class — never `:deep`.
- **F6. Responsive.** Two-pane layouts collapse below `$mp-layout-breakpointSplit` (960) to one pane
  at a time, keyed on a state class (`…--has-selection`) rather than `useDisplay()`. Media queries use
  the Sass variable, so the block is `<style scoped lang="scss">`. Side panels overlay the content
  below the breakpoint instead of reserving width. Verify `document.documentElement.scrollWidth === innerWidth` at 375.
- **F7. Widths** come from tokens: `layout.inboxListWidth` 380, `layout.inboxRailPanelWidth` 300,
  `layout.sectionRailWidth` 260, `component.drawer.width.*`, `component.toolbar.searchWidth` 300.
  A new layout width is a new `layout.*` token first (`npm run tokens:build`), never a literal.

## G. Don'ts

- No `:deep()` into an `Mp*` component; use its props, slots and documented custom-property seams.
- No new `px`, hex, or `!important` (allowlist: `Retail/PosPreview` device mock, DaVinci orb/voice
  canvases, chart series palettes — see playbook §2).
- No feature additions beyond F1's three list controls where a list lacks them. A redesign keeps every
  function, field and state of the original — diff the functional inventory before committing.
- No `d-flex`/`d-block` utility on an element a media query must hide (Vuetify's `!important` wins).
- No restating theme defaults on fields (`variant="outlined"`, `density="comfortable"`, `color="primary"`).
- Don't touch builder chrome on `builderShell`/flush routes (playbook §3): apply C, D, E and G only.

## H. Per-page procedure (delta over playbook §4)

1. **Before-capture** at 1440×900, 1024×768 and 375×812 (screenshots to the scratchpad) plus a
   `read_page` of the interactive tree and `read_console_messages` (errors only). Reload after each
   `resize_window` before reading column visibility — `useDisplay()` does not re-evaluate under
   viewport emulation without a real resize event.
2. **Static audit** of the view and its non-`Mp*` children against A–G; write findings as
   `(item) where → fix`. Zero findings → mark done, no commit.
3. **Fix** with the smallest change set; tokens and Mp\* only; page files only (shared-component
   findings are *proposed*, not applied — see the orchestrator prompt).
4. **Verify**: `npm run type-check`; zero new console errors; after-captures at the three widths;
   dark theme once; keyboard walk of new controls; functional inventory unchanged.
5. **Commit** `[fix]: aesthetic pass — <PageName>` (page files only, bulleted body: finding → change).
6. **Tracker row**: status, commit, one-line note in `aesthetic-tracker.md`.
