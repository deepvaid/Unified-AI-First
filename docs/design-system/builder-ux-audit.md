# Builder Flows — UX Audit

> Audited 2026-07-17 from a busy merchant's perspective: every builder flow in the product, evaluated for usability, task speed, cognitive load, IA, hierarchy, discoverability, error prevention, design-system consistency, and accessibility. Evidence: source analysis of all 15 builder surfaces plus a live walkthrough of each flow in the running app.
>
> Companion docs: [builder-persistence.md](./builder-persistence.md) (persistence glossary, in flight), `docs/design-system.md` (component reference).

## How to read this

Every recommendation carries: **Issue → Friction → Improvement → Benefit → Priority (Critical/High/Medium/Low) → Effort (S/M/L)**. Benchmarks reference Shopify, HubSpot, Mailchimp, Klaviyo, Webflow, Notion, Canva, Figma, Framer, and Linear — as interaction-pattern references, not designs to copy.

**Already in flight (credited, not re-recommended):** the builder-persistence program — `MpBuilderShell`, `MpBuilderPreviewDialog`, `useDirtyLeaveGuard`, the three persistence modes, single-primary-CTA rule, and Apply-vs-Save wording. EmailContentEditor is the reference adopter. This audit builds on that work.

**Fixed in this audit's "Now" batch:** items marked ✅ below were implemented alongside this report.

---

## Executive summary

The product's builders are individually competent but collectively inconsistent. A merchant who learns one builder learns almost nothing transferable about the next: four different shell strategies, three save models with four different "unsaved" indicators, drag-and-drop in exactly one surface, undo in exactly one surface, and unsaved-work protection that exists in eleven builders but is silently absent in the three drawer-based ones — where closing with Escape destroys work with no warning.

The good news: the hardest problems are already solved in isolation somewhere in the codebase. The persistence primitives exist and are documented; the landing-page cluster shows what a token-driven, accessible, drag-capable editor looks like; StoreThemeBuilder has the best keyboard support; Segments has the best plain-language feedback. The core recommendation of this audit is **convergence**: promote the best existing pattern in each dimension to the standard, and retire the bespoke variants.

### Top 5 themes

1. **Data loss is still possible** in drawer builders (Segments, SQL Queries, Collection editor) — Escape/X/scrim discard silently. *Critical.* ✅ Fixed.
2. **One shell, fifteen chromes.** `MpBuilderShell` is adopted by 1 of 15 builders; the two largest (JourneyBuilder 930 lines, FormBuilder 945 lines) hand-roll everything. *High, Large — roadmap.*
3. **False and missing direct manipulation.** Grip handles that don't drag (ChatbotBuilder ✅ fixed), chevron-only reordering in a canvas editor (StoreThemeBuilder), no drag anywhere except landing pages. *High.*
4. **No undo outside landing pages** — and even there, no redo. Block editors (Form, Email) that most need it have none. *High, Medium effort — roadmap.*
5. **Hover-only controls and suppressed skip-links** undermine keyboard/touch users on exactly the most complex screens. *High.* (Skip-link ✅ fixed.)

### Priority matrix

| Priority | Count | Examples |
|---|---|---|
| Critical | 3 | Drawer data loss (✅), publish-only persistence in ChatbotBuilder, no validation gate on ProductWizard publish |
| High | 14 | Shell divergence, no undo, false grips (✅), dead My Templates tab (✅), hover-only block controls |
| Medium | 16 | Toolbar crowding, nested accordions, mixed token systems, row-click vs kebab navigation |
| Low | 8 | Inline style cleanup, copy nits, redundant controls |

---

## Cross-cutting findings

### X1. Fifteen builders, four shell strategies — Priority: High · Effort: Large (roadmap)

- **Issue:** Coexisting chromes: `MpBuilderShell` (EmailContentEditor only); bespoke top bar + `MpBuilderPreviewDialog` (LandingPageEditor); fully bespoke toolbars (JourneyBuilder, FormBuilder, StoreThemeBuilder, StoreThemeCode, ChatbotBuilder); `MpPageHeader`-based wizards (CreateCampaign, ProductWizard, EngineEditor, LandingPageTemplates); bespoke wizard toolbar (CreateJourney).
- **Friction:** Back button position, dirty indicator style, and primary-CTA placement change per builder. Merchants re-orient on every surface; muscle memory never forms. (Shopify's editors — theme, email, flow — share one chrome; Klaviyo's flow/email/form builders share save/exit conventions.)
- **Improvement:** Phased `MpBuilderShell` adoption for the canvas builders (JourneyBuilder → FormBuilder steps 2/4 → StoreThemeBuilder → ChatbotBuilder → LandingPageEditor), keeping each builder's canvas and panels as slot content. Wizards standardize on `MpPageHeader` + `MpWizardSteps` (CreateJourney is the outlier to migrate).
- **Benefit:** One learned chrome; deleting ~1,000 lines of duplicated toolbar code; every future persistence/preview improvement lands everywhere at once.

### X2. Unsaved-work protection had a hole in every drawer — Priority: **Critical** · Effort: Small · ✅ Fixed

- **Issue:** `useDirtyLeaveGuard` covers route navigation, but the drawer builders (Segments, SQL Queries; also WidgetWizardDrawer's own guard) could be dismissed via **Escape, the X button, or a scrim click** with zero warning — verified live: typing a segment name and pressing Escape silently destroyed it. CollectionEditor (a routed page) had no guard at all.
- **Friction:** A merchant mid-way through a 6-criteria segment loses everything to a stray Escape. This is the single worst outcome a builder can produce, and it was concentrated in the flows merchants use most casually.
- **Improvement (shipped):** `MpFormDrawer` gains an opt-in `guarded` prop — when the host marks the form dirty, all three close paths route through a confirm instead of discarding. Segments and SQL Queries adopt it; CollectionEditor wires the existing `dirty` computed into `useDirtyLeaveGuard`.
- **Benefit:** Zero-data-loss guarantee now holds across all 15 builders, matching rule 1 of builder-persistence.md.

### X3. Save-state signals: one concept, four visuals — Priority: High · Effort: Medium (roadmap)

- **Issue:** The dirty indicator renders as the MpBuilderShell chip (Email), a custom dot-chip (Landing), a `v-chip` (Journey, Chatbot), and a plain text span (FormBuilder). ChatbotBuilder further **conflates saving with publishing** — the only way to keep changes is to push them live (Critical for that builder; see per-builder section). FormBuilder shows "Unsaved" on a pristine, untouched new form (verified live) — the signal cries wolf before the merchant has done anything.
- **Improvement:** As builders adopt MpBuilderShell (X1), the chip comes for free. Independent quick win: baseline FormBuilder's dirty snapshot after defaults load so a pristine form reads clean. ChatbotBuilder needs a Save-draft path separated from Publish (Medium).
- **Benefit:** "Am I safe to leave?" gets one answer style everywhere; trust in the indicator recovers.

### X4. Direct manipulation: promised but not delivered — Priority: High · Effort: Medium (roadmap; grips ✅ fixed)

- **Issue:** Only LandingPageEditor supports drag (palette→canvas, reorder, layers). StoreThemeBuilder — a Shopify-genre theme editor where drag-to-reorder is the category convention — reorders sections one chevron-click per position. ChatbotBuilder rendered `grip-vertical` handles that did nothing (✅ removed). JourneyBuilder's palette is click-only while the landing palette drags — same app, opposite affordances.
- **Improvement:** Near-term: never show a grip without drag (now policy; enforced by removal). Mid-term: add drag-to-reorder to StoreThemeBuilder's section list and FormBuilder/EmailContentEditor block lists, reusing the landing editor's insertion-point pattern. Keep chevrons as the keyboard-accessible fallback (Linear does exactly this pairing).
- **Benefit:** Reordering a 10-section page drops from ~9 clicks to one drag; affordances become honest.

### X5. Undo/redo — Priority: High · Effort: Medium (roadmap)

- **Issue:** Only LandingPageEditor has undo (20 snapshots, ⌘Z, no redo, silent cap). FormBuilder and EmailContentEditor — block editors where a mis-click deletes content — have none; JourneyBuilder deletes nodes with Delete/Backspace and offers no way back.
- **Friction:** Merchants hesitate before destructive actions they can't reverse; confidence (and speed) drops. Every benchmark builder (Canva, Figma, Webflow, Mailchimp) treats ⌘Z as table stakes.
- **Improvement:** Extract the landing editor's snapshot stack into a `useUndoHistory` composable (add redo); adopt in the three block/canvas editors. Surface it as a toolbar button pair + shortcuts, as landing already does.
- **Benefit:** Deletion stops being scary; per-action confirm dialogs can eventually thin out (error recovery replaces error prevention friction).

### X6. Accessibility — Priority: High · Effort: Small–Medium (partially ✅ fixed)

- **Issue:** (a) The "Skip to main content" link was suppressed on **all** fullPage routes — keyboard users lost it on exactly the most complex screens (✅ fixed, 1 line). (b) Block hover-controls (`display:none` until `:hover`) in EmailContentEditor/LandingBlockView/FormBuilder are invisible to touch and only partly rescued by `:focus-within`. (c) JourneyBuilder's rename was a `div role="button"` (✅ converted to a native button). Credit where due: roving tabindex on StoreThemeBuilder's rails/swatches, real `<button>`s with aria-labels across the landing and journey-flow components.
- **Improvement (remaining):** Reveal block controls on selection, not hover — the block is already click-to-select, so show the controls whenever selected (touch-friendly, discoverable, one condition). Medium effort across three files; roadmap.
- **Benefit:** WCAG 2.1 (2.4.1, 2.5.x) coverage on builder screens; touch/iPad merchants can operate block controls at all.

### X7. Styling drift — Priority: Medium · Effort: Medium (roadmap)

- **Issue:** FormBuilder hardcodes hex (`#ff5f56`, `#ffbd2e`, `#27c93f` device-chrome dots, `#e5e5e5` device backgrounds, forced `#fff` text); JourneyBuilder scatters inline `style="width:320px"`; LandingPageTemplates mixes `--cloud-*` and `--v-theme-*` token systems. The landing block cluster, by contrast, is ~100% token-driven — proof the codebase can do it.
- **Improvement:** Sweep the two big offenders during their MpBuilderShell migrations (piggyback, don't dedicate a project). Extract the device-preview chrome (used by FormBuilder and MpBuilderPreviewDialog toolbar consumers) into one tokenized component.
- **Benefit:** Dark-mode correctness, single-place theme changes.

### X8. Duplicated block editor — Priority: Medium · Effort: Large (roadmap)

- **Issue:** FormBuilder's Content step re-implements EmailContentEditor's palette/canvas/settings block editor without sharing code (~350 duplicated lines, subtle behavior differences: Email has a canvas empty state, Form didn't ✅; Email wires preview, Form inlines its own).
- **Improvement:** Extract a `MpBlockEditor` (palette + canvas + settings, block-type-agnostic) consumed by both, and by future block surfaces. Do it when either file is next touched substantially.
- **Benefit:** One block-editing behavior to learn; features (undo, drag, empty states) land in both at once.

---

## Per-builder findings

### 1. Journey Builder (`src/views/Marketing/JourneyBuilder.vue`, 930 lines)

**What works:** clean 3-pane layout; searchable inline "+" step menu; strong keyboard nav (arrows walk the flow, Delete removes, Escape closes); zoom/pan/fit; Apply-vs-Save wording now aligned with builder-persistence.md; validation menu gates activation. The flow column's branch rendering and aria labels are excellent.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| J1 | Two-tier save (node **Apply** → live store, canvas **Save** → snapshot) with one dirty chip reflecting only the snapshot | Merchant applies a node edit, chip still says "Saved" — is my work safe? Trust erodes | Chip should go "Unsaved" on Apply too (derive dirty from full flow diff, already computed); tooltip explaining Apply vs Save | Honest signal; fewer redundant saves | High | S |
| J2 | Rename affordance was a `div role="button"` | Screen-reader/keyboard users get a non-native control | Native `<button>` with inherited typography | Correct semantics, focus ring for free | High | S ✅ |
| J3 | Palette is click-only while the landing palette drags | Cross-builder inconsistency; drag-expecting users stall | Add drag from palette to insertion points (reuse landing pattern); keep click-to-add | Same mental model across canvas builders | Medium | M |
| J4 | Mock per-node contact stats with a refresh button (hash-seeded) | Merchants make decisions on fake numbers styled as real telemetry | Label as sample data or remove the refresh affordance | No false confidence | Medium | S |
| J5 | No undo; Delete/Backspace removes nodes instantly | One key-slip destroys a configured node | `useUndoHistory` adoption (X5) | Fearless editing | High | M |
| J6 | Inline width styles (`320px` × several) and bespoke toolbar | Drift from tokens; duplicated chrome | Fold into MpBuilderShell migration (X1) | — | Medium | M |

**Benchmark:** Klaviyo's flow builder — single save model, drag + click both supported, undo, and real analytics clearly separated from config.

### 2. Create Journey wizard (`CreateJourney.vue`, 427 lines)

**What works:** template gallery with live mini-previews, double-click to choose+continue, AI path with chip-based brief, dirty guard.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| CJ1 | Bespoke toolbar/footer while sibling CreateCampaign uses MpPageHeader | Two wizard chromes in one module | Migrate to MpPageHeader + `#tabs` MpWizardSteps | Consistency, less code | Medium | S–M |
| CJ2 | Two overlapping step models in code (`wizardSteps` vs `step`) | Maintenance risk → future UX bugs | Collapse to one source of truth | — | Low | S |

### 3. Create Campaign wizard (`CreateCampaign.vue`, 721 lines)

**What works:** the best-modeled wizard — MpPageHeader, autosave-on-step, Save & exit, draft chip, arrow-key type gate, single sticky footer.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| CC1 | Step 2 buries 5 required sender fields inside a collapsed accordion | Merchant hits Continue, wonders why it's disabled — the reason is hidden | Auto-expand the Sender panel when its fields block progression; error count on the panel header | Self-explaining validation | High | S |
| CC2 | Nested accordions (Sender, Suppression) on one dense step | Scanning cost; skipped settings | Split step 2 into Audience / Sender sub-groups shown flat (780px column has room) | Faster completion | Medium | M |

**Benchmark:** Mailchimp's campaign checklist — every blocking requirement is a visible checklist row with inline "Resolve" actions, never hidden in a collapsed panel.

### 4. Form Builder (`FormBuilder.vue`, 945 lines)

**What works:** 5-step structure now in logical order (Setup→Content→Display→Style→Review, in-flight fix); locked email block prevents breaking the form; in-page device preview with fullscreen; style presets.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| F1 | Thank You tab canvas rendered totally blank when emptied (verified live) | "Is it broken?" — no guidance to recover | Canvas empty-state hint pointing at the palette | Self-recovery | High | S ✅ |
| F2 | No Save & exit in the top bar; exit only on step 5 | Mid-flow merchants must abandon via Back + guard dialog | Top-bar "Save & exit" (persist → clean → leave), as CreateCampaign has | Safe mid-task exit in 1 click | High | S ✅ |
| F3 | "Unsaved" shows on a pristine new form (verified live) | False alarm from the first second; signal devalued | Baseline the snapshot after defaults are seeded | Honest dirty signal | Medium | S |
| F4 | 3-level nested accordions in Style → Advanced | Fields buried; long tab order | Flatten one level; move rare options behind a single "Advanced" section | Fewer decisions per screen | Medium | M |
| F5 | Hardcoded device chrome hex + forced `#fff` preview text | Breaks dark mode | Tokenize with the shared device-frame extraction (X7) | — | Medium | S–M |
| F6 | Duplicate of Email's block editor; no undo; hover-only controls | See X8/X5/X6 | Shared `MpBlockEditor` | — | Medium | L |
| F7 | Template renders steps out of source order (1,3,4,2,5) | Maintenance trap in a 945-line SFC | Reorder blocks during next substantial edit | — | Low | S |

**Benchmark:** Mailchimp's form builder — persistent Save & exit, single-level style options with progressive disclosure, drag + click block insertion.

### 5. Email Content Editor (`EmailContentEditor.vue`, 426 lines) — reference implementation

**What works:** full MpBuilderShell + MpBuilderPreviewDialog + useDirtyLeaveGuard adoption; explicit-save chip; canvas empty state; clean 600px document canvas.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| E1 | Block controls hover-only (`display:none` → flex) | Invisible on touch; discoverability tax | Show controls when block is selected (X6) | Touch usability | High | S–M |
| E2 | Preview dialog has no device toggle (landing's does) | Can't sanity-check mobile email | Add the same `#toolbar` device toggle landing uses | Mobile confidence | Medium | S |
| E3 | Panel-only text editing (no on-canvas editing) | Eyes bounce canvas↔panel per edit | Roadmap: inline text editing on canvas with panel for structure (Canva/Webflow model) | Faster copy tweaks | Medium | L |
| E4 | No undo | Mis-delete = rebuild | X5 composable | — | High | M |

### 6. Landing Page Editor (`LandingPageEditor.vue`, 690 lines) — richest editor

**What works:** real drag-and-drop everywhere (palette, canvas, layers); debounced autosave with flush-on-exit; undo + ⌘Z; device toggles (canvas and preview); publish gating on URL validity; quick-start block groups; token-driven styling; keyboard-focusable layers panel.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| L1 | Page-level settings split across 3 surfaces (right panel page-style, MpFormDrawer SEO/URL, top-bar URL chip) | "Where do I change X?" requires trial and error | Merge page style + SEO into one tabbed drawer; keep the URL chip as a shortcut into it | One place for page-level things | Medium | M |
| L2 | Undo but no redo; 20-step cap silent | Over-undo can't be un-done | Add redo to the X5 composable; disable button at stack ends | Symmetric safety | Medium | S–M |
| L3 | Toolbar crowding — 11 controls; title truncates to "Spri…" at laptop width (verified live) | Orientation loss; cramped touch targets | Collapse Structure/device/undo into grouped segments; move Unpublish into overflow (Framer's approach) | Calmer chrome | Medium | M |
| L4 | Bespoke top bar (pre-dates MpBuilderShell) | Chrome divergence | Migrate in the X1 wave (autosave mode chip already specced) | — | Medium | M |

**Benchmark:** Webflow/Framer — one settings surface per scope (element/page/site), disciplined toolbars, undo/redo pairs.

### 7. Landing Page Templates (`LandingPageTemplates.vue`, 356 lines)

**What works:** MpPageHeader + filter tabs; keyboard-activatable cards; URL validation with touched state; template → details → editor funnel is short (~3 clicks).

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| T1 | "My Templates" tab hardcoded to 0 — permanently empty even though the store supports saved templates and the editor has "Save as Template" (verified live) | A visible feature that can never work; merchants who save a template can't find it | Wire the tab to `savedTemplates`, render saved cards with "Use template" | The existing feature becomes real | High | S–M ✅ |
| T2 | Step indicator only appears on step 2 of 2 | "Step 1" is invisible while choosing | Show the stepper in the gallery stage too | Orientation | Low | S |
| T3 | Mixed `--cloud-*` / `--v-theme-*` tokens in card previews | Theme drift | Normalize to `--v-theme-*` | — | Low | S |

### 8. Store Theme Builder (`StoreThemeBuilder.vue`, 1456 lines)

**What works:** live canvas with device clamp; schema-driven inspector shared by sections and blocks; draft/publish model with discard; MpConfirmDialog used consistently; the best keyboard a11y in the app (roving tabindex rails, radiogroup swatches); AI panel scoped per-turn undo.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| S1 | Chevron-only section reordering | Moving a section 5 positions = 5 clicks + focus loss; category convention (Shopify) is drag | Drag-reorder in the section list, chevrons kept for keyboard (X4) | 1-gesture restructuring | High | M |
| S2 | "Add block" buried in a nested menu inside an expanded tree row | Low discoverability of the primary composition act | Persistent "+ Add block" row inside each expanded section (Shopify pattern) | Faster composition | Medium | S–M |
| S3 | No editor-wide undo (only per-AI-turn) | Manual edits irreversible | X5 | — | High | M |
| S4 | 1456-line SFC, bespoke chrome | Slows every future change | X1 migration + extract panels | — | Medium | L |

**Benchmark:** Shopify theme editor — drag-first section list with visible add affordances at every level, global undo.

### 9. Store Theme Code (`StoreThemeCode.vue`, 523 lines)

**What works:** explorer + tabs + dirty dots; `beforeunload` guard; Tab inserts spaces; honest "No file opened" state.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| C1 | No ⌘S — Save is button-only in a VS-Code-styled editor | The one shortcut every developer tries first opens the browser save dialog | Global ⌘/Ctrl+S → saveAll, preventDefault | Muscle-memory save | High | S ✅ |
| C2 | Decorative, non-functional icon rail styled as active | False affordance | Remove or make it functional | Honest chrome | Low | S |
| C3 | Two "back to visual editor" controls in one toolbar | Redundancy | Keep the labeled one | — | Low | S |

### 10. Chatbot Builder (`ChatbotBuilder.vue`, 1294 lines)

**What works:** section nav with deep-linking; live preview with scenario tabs that follow the section you're editing (genuinely clever); dirty chip + leave guard (in-flight).

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| B1 | **Publish-only persistence** — no save-draft; keeping changes means pushing them live to the storefront widget | Merchant halfway through a reconfiguration must either go live with half-done work or discard | Split "Save draft" from "Publish" (live-draft mode per builder-persistence.md, as StoreThemeBuilder does) | Safe iteration on a live bot | **Critical** | M |
| B2 | Grip handles on prompts/fields implied drag; only chevrons work | False affordance | Remove grips | Honest UI | High | S ✅ |
| B3 | Publish dialog is a bespoke v-dialog | Confirm-pattern divergence | MpConfirmDialog (or a small shared publish dialog) | Consistency | Medium | S |
| B4 | 1294-line SFC with widget CSS inline | Change risk | Extract preview widget component | — | Low | M |

**Benchmark:** Intercom/HubSpot bot builders — draft state always separable from the live bot; publish is a deliberate promotion step.

### 11. Product Wizard (`ProductWizard.vue`, 536 lines)

**What works:** best design-system citizenship (MpPageHeader + MpWizardSteps + gated step clicks); Save-as-Draft from any step; variant matrix generation; dirty-aware Cancel.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| P1 | Only step 1 validates — **Publish is reachable with no price/SKU** | Broken products reach the (mock) catalog; in the real product this is a data-integrity incident | Per-step validity gates like step 1's; disable Publish until price present, with inline reasons | Error prevention at the source | **Critical** | S–M |
| P2 | Media dropzone is visual-only | Merchants drop files, nothing happens | Wire file input or label as coming-soon | Honest affordance | Medium | S |
| P3 | Cancel duplicated (header + footer) | Minor noise | Keep header Cancel only | — | Low | S |

### 12. Collection Editor (`CollectionEditor.vue`, 229 lines)

**What works:** compact tabbed config; Save disabled until dirty; MpErrorState on missing id.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| M1 | No leave guard — silent loss of filter edits on navigation | Data loss; diverges from sibling EngineEditor | `useDirtyLeaveGuard` + MpConfirmDialog | Zero-loss guarantee | **Critical** | S ✅ |
| M2 | No preview while sibling EngineEditor has a live device-toggled one | Can't see what a filter change does | Reuse EngineEditor's preview card pattern | Confidence before save | Medium | M |

### 13. Engine Editor (`EngineEditor.vue`, 773 lines)

**What works:** 4-step wizard with persistent live preview + device toggle (the best "see what you're building" in the app); gated step clicks; leave guard.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| G1 | Delete confirm is a bespoke v-dialog while leave-guard uses MpConfirmDialog (verified live: no danger iconography) | Two confirm styles in one file; destructive action under-signaled | Replace with MpConfirmDialog `danger` | Pattern consistency | High | S ✅ |
| G2 | Engines list rows aren't clickable — edit only via kebab menu (verified live) | Row click is the learned convention everywhere else in the app | Row click → edit; kebab keeps secondary actions | 1 click saved per edit, consistency | Medium | S |
| G3 | Name field floats above the wizard + "Step X of 4" duplicated | Mild redundancy | Fold name into step flow or header subtitle | Calmer layout | Low | S |

### 14. Widget Wizard Drawer (`WidgetWizardDrawer.vue`, 237 lines + wizard/)

**What works:** 2-click add (pick → auto-advance → Add); live preview in edit step; discard confirm on dirty new widgets; good library empty state.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| W1 | "Create with Da Vinci" closes the drawer entirely and opens copilot | Merchant loses their place mid-wizard | Hand off and return: reopen the drawer in edit stage when Da Vinci produces a draft (plumbing exists — drafts already enter at edit stage) | Continuity | Medium | M |
| W2 | Text step counter while ProductWizard/EngineEditor use MpWizardSteps | Stepper inconsistency | MpWizardSteps compact variant for drawers | Consistency | Low | S |
| W3 | Escape/X/scrim bypass its discard guard (only footer Cancel guards) | Same data-loss class as X2 | Adopt MpFormDrawer `guarded` | Complete protection | High | S |

### 15. Segments & SQL Queries (`Segments.vue` 324 lines, `SQLQueries.vue` 237 lines)

**What works:** Segments' live plain-language summary ("Contacts who Email contains …") is the best comprehension aid in the app; SQL's example chips + "what this returns" explainer lower the barrier for non-technical merchants.

| # | Issue | Friction | Improvement | Benefit | Priority | Effort |
|---|---|---|---|---|---|---|
| D1 | No dirty guard on either drawer (verified live: Escape discards typed work) | Worst-case data loss in high-frequency flows | MpFormDrawer `guarded` + discard confirm | Zero loss | **Critical** | S ✅ |
| D2 | No match-count feedback — segments save with `count: 0` | Merchant can't sanity-check a segment before trusting it with a campaign | Live "≈ N contacts match" estimate in the summary alert (deterministic mock in this prototype); persist estimate as the count | Confidence + honest list data | High | S ✅ |
| D3 | Example chip overwrites typed SQL instantly | One click destroys hand-written SQL | Confirm before replacing non-empty SQL | No clobbering | High | S ✅ |
| D4 | Category/Field selects are independent (Category doesn't constrain Field) | Invalid combinations possible; choice overload | Filter Field options by Category | Fewer decisions | Medium | S–M |
| D5 | SQL editor is a plain textarea; no validation/run | Errors discovered only after save (list shows "Failed" runs) | Roadmap: syntax highlight + dry-run preview | Error prevention | Medium | L |

**Benchmark:** Klaviyo's segment builder — live estimated size beside the definition, dependent condition dropdowns.

---

## Roadmap

### Now — shipped with this audit ✅

| Fix | Files |
|---|---|
| MpFormDrawer `guarded` close (foundation) | `src/components/MpFormDrawer.vue` |
| Segments drawer guard + live match estimate | `src/views/Contacts/Segments.vue` |
| SQL Queries drawer guard + chip-overwrite confirm | `src/views/Contacts/SQLQueries.vue` |
| CollectionEditor leave guard | `src/views/Merchandising/CollectionEditor.vue` |
| EngineEditor delete → MpConfirmDialog | `src/views/Merchandising/EngineEditor.vue` |
| FormBuilder canvas empty state + Save & exit | `src/views/Marketing/FormBuilder.vue` |
| ChatbotBuilder false grips removed | `src/views/Service/ChatbotBuilder.vue` |
| StoreThemeCode ⌘/Ctrl+S | `src/views/SalesChannels/StoreThemeCode.vue` |
| JourneyBuilder rename → native button | `src/views/Marketing/JourneyBuilder.vue` |
| Skip-link restored on fullPage routes | `src/App.vue` |
| My Templates tab wired to saved templates | `src/views/Marketing/LandingPageTemplates.vue` |

### Next (Medium effort, high leverage)

1. **ChatbotBuilder save-draft/publish split** (B1 — the remaining Critical).
2. **ProductWizard per-step validation** (P1 — the other remaining Critical).
3. **`useUndoHistory` composable** extracted from LandingPageEditor (+redo), adopted by Email/Form/Journey (X5).
4. **Selected-state block controls** replacing hover-only reveal (X6, three files).
5. **CreateCampaign sender-panel auto-expand** (CC1) and **FormBuilder pristine-dirty baseline** (F3).
6. **WidgetWizardDrawer `guarded` adoption + Da Vinci round-trip** (W1/W3).
7. **Engines list row-click edit** (G2).

### Later (Large, sequenced)

1. **MpBuilderShell adoption wave** (X1): JourneyBuilder → FormBuilder → StoreThemeBuilder → ChatbotBuilder → LandingPageEditor; token sweeps ride along (X7).
2. **Drag-to-reorder** in StoreThemeBuilder sections and block editors, chevrons retained for keyboard (X4/S1).
3. **`MpBlockEditor` extraction** unifying Email + Form block editing (X8).
4. **Landing settings consolidation** (L1) and inline canvas text editing (E3).
