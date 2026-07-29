# Reference Research — Enterprise SaaS Pattern Library

**Purpose:** Ground truth for the Maropost design-system consolidation. Single reference for
implementation agents working on dropdowns, command palettes, widget pickers, wizards, modals/drawers,
toasts, tooltips, KPI/settings cards, and the Da Vinci copilot. Agents should **not** browse Mobbin —
everything needed is here as anatomy + principles + concrete Vuetify/token-level recommendations.

Sources prioritized: **Sana AI** and **Intercom** first, then **Linear, Notion, Slack, Stripe**
(Whop/Wrike/ClickUp/Google Analytics/Skillshare/WRITER appear only where they show something the
priority set didn't).

**Hard constraints for every recommendation:** keep Maropost's cyan/blue accent, Inter font, flat-border
card language (`flat border rounded="lg"`, no elevation); no new wrapper component libraries —
recommendations are Vuetify-default tweaks, CSS/token changes, or behavior changes inside existing Mp*
components, except the already-planned shared toast API; never copy a cited product's literal visual
identity.

---

## Summary Table

| Family | Top 3 takeaways | Target Maropost component/file |
|---|---|---|
| 1. Dropdowns & searchable selectors | Search box only past ~8 items, not every menu · selected state = trailing checkmark, never a filled row · group headers are small, muted, non-interactive with a hairline above | `v-select`/`v-autocomplete` defaults in `src/plugins/vuetify.ts` |
| 2. Command/search palettes | Results grouped by entity type via tabs, not a flat list · empty-query shows recents/suggestions, never blank · one footer keyboard-hint row, not per-item shortcuts | `src/components/layout/AppBar.vue` universal search |
| 3. Widget/gallery selection | Selected = border + faint tint, never a checkbox overlay on enterprise cards · persistent counter + single "Apply" beats per-card confirm · category rail left, search always visible above grid | `WidgetLibraryStep.vue`, `WidgetWizardDrawer.vue` |
| 4. Setup/wizard flows | Vertical numbered stepper scales better than horizontal past ~4 steps or with sub-steps · completed = green check, active = filled ring only · progress-as-fraction ("Q4 of 6") for short in-context flows | `MpWizardSteps.vue`, `WidgetWizardDrawer.vue` |
| 5. Modals & drawers | Destructive dialogs grade by blast radius: sentence → consequence bullets → type-to-confirm · confirm button disabled until precondition met · full-height drawers put Cancel/Save in header, not footer | `MpConfirmDialog.vue`, `MpFormDrawer.vue` |
| 6. Toasts/notifications | Bottom-right, one at a time, stacks upward, ~4-6s · icon + title + one-line detail + max one text-link action · manual close always present even with auto-timeout | New shared toast composable (planned); reconciles with `useDaVinciToasts.ts` |
| 7. Tooltips & icon-only actions | Tooltip text = the accessible name, shortcut shown as a `kbd` chip beside it · icon-only reserved for universally recognized icons · shortcut-reference modals use tabs + dense rows + right-aligned key chips | Icon buttons in `MpRowActionsMenu`, `AppBar.vue`, table toolbars |
| 8. KPI/settings cards | One hero element per card (the number); everything else recedes · quiet "Updated Xh ago" meta line builds trust · settings checklist rows are single-action, never multi-button | `MpKpiCard.vue`, Settings checklist patterns |
| 9. AI-assistant surfaces | Sources: dimmed, collapsible row under the answer, never inline · feedback icons in a quiet detached strip below the answer · config-list beside live-preview pane makes abstract settings tangible | `MpDaVinciBot.vue`, `copilot/` Dv* (lower priority) |

---

## 1. Dropdown / select menus + searchable selectors

**Studied:** [Intercom — condition dropdown](https://mobbin.com/screens/a24ee811-2300-45a9-b512-76ebe6024a88) · [Intercom — operator dropdown](https://mobbin.com/screens/b265f489-d2de-45a6-9f4a-e57aa4d006b1) · [Intercom — emoji picker, grouped+searchable](https://mobbin.com/screens/622051f5-441e-4107-958d-2e1b249ad6b8) · [Notion — select property, search + "create one"](https://mobbin.com/screens/0fd15513-eb9f-4407-b3cc-ae27db947a8b) · [Notion — person multi-select](https://mobbin.com/screens/bb37c98b-4f9a-4fef-967c-40225bc2e9b6) · [Notion — property-type picker, grouped](https://mobbin.com/screens/4e6e1f98-a567-4370-b392-ac28802481c7) · [Notion — filter dropdown w/ checkboxes](https://mobbin.com/screens/d8abbe0b-4c55-4316-91b7-2e6b4baecb52) · [Linear — assignee dropdown, avatars+checkmark](https://mobbin.com/screens/af9cc8d7-aea7-4a3a-9021-5edc74d80ad8)

**Anatomy:** Trigger is plain text/chip inline, bordered only in form contexts. Search input pinned to
menu top only once the list is long/open-ended (Notion property picker skips it under ~8 grouped
items; Linear assignee always has it since users are user-generated/unbounded). Selected item = a
**trailing checkmark**, never a filled row — hover is a separate light tint. Group headers: small,
muted, no background, tight to their own items, loose to the group above. "Create new" is the last row
behind a hairline, never mixed into options. Multi-select shows chosen items as removable chips above
the search box. Footer commit buttons ("Done") appear only for multi-select/staged menus — single-select
commits and closes on click.

**Spacing/density:** Compact row height (~one line + 6-8px padding). Tight icon-label gap (~8px);
generous label-to-checkmark gap (checkmark hugs the menu's right edge). Menus sit 4-8px below trigger.

**Interaction principles:** Reserve in-menu search for long/open-ended lists, skip it for small closed
enumerations. Checkmark (not background fill) as the selected signal so it composes with hover/focus.
Group headers never clickable, always visually recessed.

**Maropost should adapt:** Verify `v-select`/`v-autocomplete` menu items right-align the selected
checkmark rather than placing it beside the label (override via `v-list-item` slot if Vuetify's default
differs) — template-level fix, no new component. Match the "hairline before group header, none between
header and its own items" rule in any new grouped select (future filter drawers, `MpFolderSelect`).
`MpFolderSelect`'s "Manage" footer already matches the "footer only for staged/multi-part menus" rule —
keep it, don't add footers to plain single-selects.

**Should NOT copy:** Intercom's menu tinting, Notion's colored tag palette (Maropost's status colors
already live in `MpStatusChip` type maps — don't add a second color system), Linear's dark chrome.

---

## 2. Command / search palettes

**Studied:** [Linear — ⌘K teaser](https://mobbin.com/screens/1e783aca-8b8e-4ae5-994d-284a8ddae491) · [Linear — grouped search results](https://mobbin.com/screens/a2f96ae5-202c-4747-a959-d33d7e5c0f72) · [Linear — empty-query state](https://mobbin.com/screens/dba91946-d147-4b2f-ad92-4195eae017fc) · [Linear — "Ask Linear" AI entry in same palette](https://mobbin.com/screens/3e4c96cc-b973-44eb-a665-c1045c5a39c4) · [Linear — no-results state](https://mobbin.com/screens/d0b98680-66e2-47d4-9dc4-28bc9450c27f) · [Slack — quick switcher w/ message preview](https://mobbin.com/screens/df404c7a-864b-422c-ad12-8222f2d064cc) · [Slack — search recents](https://mobbin.com/screens/a76efa2c-9d1b-4a6a-81c6-68997794a92c) · [Slack — search empty/help state](https://mobbin.com/screens/66ae4225-32aa-4d7a-823c-ea85f520488d)

**Anatomy:** A tab row above results (All/Issues/Projects/Documents) narrows without retyping. Result
row = leading type-icon, title, trailing muted relative-time/breadcrumb. Empty-query state always shows
something (recents, shortcuts) — never a blank box. No-results is one quiet centered sentence, no
illustration/CTA. Slack previews the matched message body under the top hit (reassuring, costs vertical
space). One footer hint row (↑↓ / ↵ / Tab) for the whole palette, not per-row shortcuts.

**Spacing/density:** Narrow fixed width (~500-600px), capped height with internal scroll, rows denser
than the app's normal list rows (keyboard-first, not touch-first).

**Interaction principles:** Type-ahead scoping via tabs beats relying purely on fuzzy-match quality.
Give "ask AI" rows a distinct leading icon/tint from plain navigation rows.

**Maropost should adapt:** `AppBar.vue`'s `PaletteItem` builder (~lines 249-330) already separates nav
items from AI actions — add a **type tab row** above results sourced from the existing `searchSources`
categories so results don't blend Orders/Campaigns/Settings into one flat list as sources grow. When
`searchQuery` is empty, label the current static `searchSources.value.slice(0, 6)` fallback as
"Suggested" (or swap for genuinely recent routes if cheaply available) rather than showing an
unlabeled slice. Keep the single footer-hint-row style — don't add per-item shortcut chips.

**Should NOT copy:** Slack's inline message-preview-under-result (too heavy for a search spanning
orders/contacts/settings), Linear's dark chrome.

---

## 3. Widget/gallery selection experiences

**Studied:** [Whop — "Select widgets" modal, counter+Apply](https://mobbin.com/screens/826ea025-7546-4a1b-8e09-a4ab056c55ad) · [Wrike — two-pane picker (facets + cards)](https://mobbin.com/screens/b79f9ed7-a0fd-466f-941f-7bbb94d72a44) · [ClickUp — "Add Card" gallery w/ category rail](https://mobbin.com/screens/36caf732-142f-4398-8824-4a46337d7490) · [Google Analytics — checkbox multi-select gallery](https://mobbin.com/screens/730645b2-c4d2-4aa5-b5f6-516f542f8480) · [Skillshare — onboarding gallery, checkmark+counter CTA](https://mobbin.com/screens/40f77d32-9118-436d-a9bd-4d8dcc04825f) · [WRITER — template gallery w/ hover preview/edit](https://mobbin.com/screens/7c997169-30bb-4efc-894e-b7caddc2b8dc)

**Anatomy:** Consistent layout: left rail (category/data-source facets) + right scrollable card grid,
search pinned above the grid. Selected-state options seen: border+tint only (Wrike, WRITER — most
restrained, closest to Maropost's `MpOptionCard`); corner checkbox (Google Analytics — explicit
multi-select); full-card checkmark overlay (Skillshare — too playful for enterprise). A **persistent
counter + single commit button** ("8 widgets selected · Apply") dominates multi-select galleries,
decoupling browse/toggle from commit. Recommended/featured items get a small badge, not a different card
shape. Unavailable cards stay in-grid at reduced opacity rather than being hidden.

**Spacing/density:** Generous grid gap relative to card padding — tiles read as distinct, not packed.
Category rail is single-line, tight rhythm, contrasting with richer card body text.

**Interaction principles:** Decide up front whether a gallery is single-select-and-advance or
multi-add-then-commit; only the latter needs the counter+Apply pattern. Keep search + category filter
simultaneously visible, not nested. Use opacity + a microcopy line for degraded/promoted states, not a
separate card variant.

**Maropost should adapt:** `WidgetLibraryStep.vue`'s current `.widget-library__item` (border+tint on
active, no checkbox) already matches the restrained end of this spectrum — keep it. Consider a subtle
"Recommended" left-edge accent or reordering recommended items first, instead of only the inline
`v-chip` badge, matching how Wrike/GA promote featured templates without extra visual weight. If
`WidgetWizardDrawer.vue` ever needs staging multiple widgets before applying, add a sticky counter+Apply
header bar to the existing drawer — no new component.

**Should NOT copy:** ClickUp's saturated multi-color thumbnails, Skillshare's full-card checkmark
overlay, any vendor's card radius/shadow depth.

---

## 4. Setup / wizard flows

**Studied:** [Stripe — "Activate Payments" onboarding flow](https://mobbin.com/flows/ebb9460b-1b61-422f-a3a5-08ddaf020102) · [Stripe — "Verifying a business" flow, vertical stepper+sub-steps](https://mobbin.com/flows/46860e68-4922-421b-8cf9-06e6953a61f5) · [Stripe — subscription setup flow](https://mobbin.com/flows/bfa4b190-4b87-42e2-8f6d-968d7c382630) · [Intercom — full onboarding flow](https://mobbin.com/flows/92a46138-ae24-4c57-a4e1-f257b126cac7) · [Intercom — "Completing a tutorial" flow](https://mobbin.com/flows/a7c7326a-2959-4472-a6f7-ed6beaba83e1)

**Anatomy:** Stripe's dominant pattern is a **left-column vertical step list** (not horizontal):
numbered circles — filled/active, green-check/done, grey-outline/pending — with indented sub-steps
visible only under the active parent. Scales far better than a horizontal bar once a wizard has
sub-steps or exceeds ~5 steps. Each screen repeats the same shell: stepper pinned left, single-focus
form right, one primary "Continue →." Intercom's onboarding instead uses a **modal question sequence**
("Question 4 of 6") with a segmented dash-bar — right for short, low-stakes personalization layered on
the main app, not a dedicated full-page setup. On completion, Intercom collapses the whole stepper into
one checked summary line plus a secondary "Go further" section — chrome disappears once done. A
persistent, low-emphasis help affordance stays visible throughout (never buried in a menu).

**Spacing/density:** Step items compact (one line + optional description), thin connecting rail between
circles — same idea as Maropost's own `mp-wizard-step__rail`. Content column stays narrow (~400-480px)
even on wide viewports.

**Interaction principles:** Vertical stepper for >~4 steps or sub-steps; horizontal chip row is fine
below that. Fraction-style progress ("Q4 of 6") for short in-context prompts; full numbered stepper for
dedicated setup flows. Collapse a completed wizard to one done-state line rather than leaving all-green
steps on screen.

**Maropost should adapt:** `MpWizardSteps.vue` is correct as-is for `WidgetWizardDrawer.vue`'s current
shallow step count. If a future wizard needs sub-steps, add an `orientation="vertical"` variant reusing
the existing `.mp-wizard-step__num`/`.mp-wizard-step__rail` classes stacked, rather than a new stepper
component. For short, low-stakes prompts (not full wizards), a fraction-style progress label is a usage
choice, not a new component.

**Should NOT copy:** Stripe's purple step-circle color, Intercom's illustrated onboarding hero art,
gradient step backgrounds.

---

## 5. Modals + drawers

**Studied:** [Linear — delete team, type-to-confirm+consequence list](https://mobbin.com/screens/b1d9a761-cf3b-4070-afd5-c8063ad60c3e) · [Linear — delete workspace, verification code+checkbox](https://mobbin.com/screens/7833c5d5-299e-415f-adf4-7f53e586e11a) · [Linear — simple delete-document confirm](https://mobbin.com/screens/c4e6a99e-5c6f-4d93-894a-f566b758608b) · [Intercom — full-height form drawer, header Cancel/Save](https://mobbin.com/screens/cce60a0b-40ac-4520-af74-e4c6e8808ccf) · [Intercom — workflow-step drawer](https://mobbin.com/screens/c6d91c47-3708-42c3-8d26-346662de3edd) · [Intercom — timed-wait config drawer](https://mobbin.com/screens/50d22be3-0991-4279-a97e-832cc321f38e) · [Intercom — article editor drawer, Cancel/Save-as-draft/Publish](https://mobbin.com/screens/52b5405f-ff27-45e7-8c88-afdfbed0b815)

**Anatomy:** Confirm-dialog severity is a graded ladder, not binary: (1) simple delete = title + one
sentence + Cancel/red Delete — matches `MpConfirmDialog`'s current shape; (2) higher blast-radius =
adds a **bullet list restating exactly what's lost** ("30 issues, 3 projects...") before the confirm
control; (3) irreversible/account-level = adds a type-to-confirm field or emailed code plus a mandatory
acknowledgement checkbox. Every destructive dialog disables its confirm button until any required
precondition is met. Full-height Intercom drawers put **Cancel+Save in the header row**, not a footer —
Maropost's `MpFormDrawer` footer-slot pattern is a deliberate, good divergence for its narrower 480px
width, not a gap. Multi-outcome forms (Cancel / Save as draft / Publish) order low→high commitment
left-to-right, heaviest visual weight on the most committing action.

**Spacing/density:** Confirm dialogs stay narrow (~400-440px, matching `MpConfirmDialog`'s existing
`max-width="440"`) regardless of content — they grow taller, not wider. Form drawers reserve generous
padding for the header only; body reverts to normal field spacing.

**Interaction principles:** Grade destructive-confirmation friction to actual blast radius — a row
delete stays one-line; a "delete this and all its children" action gets the consequence bullet list.

**Maropost should adapt:** Add an **optional `consequences?: string[]`** prop to `MpConfirmDialog.vue`
rendering a bullet list between message and actions (reuses existing `v-card-text` styling) — covers
tier-2 severity, zero changes to existing simple-delete call sites since the prop is optional. Do not
add a type-to-confirm/checkbox tier speculatively — only build it against a named irreversible,
workspace-level action. Keep `MpFormDrawer`'s footer action ordering low→high commitment wherever a
drawer exposes more than Cancel/Save.

**Should NOT copy:** Linear's dark-mode chrome, vendor microcopy wording, Intercom's near-full-screen
drawer width — Maropost's 480px `MpFormDrawer` stays narrower by design.

---

## 6. Toasts / notifications

**Studied:** [Linear — "Copied message" toast](https://mobbin.com/screens/e4104890-7660-4557-851b-57b499125ea4) · [Linear — "Project created" toast w/ action link](https://mobbin.com/screens/ed4e73ad-17cf-49b1-a651-ad48b8514bfc) · [Linear — "Cycles enabled" toast](https://mobbin.com/screens/c7223b87-8318-4848-8453-2ac4b1e1a0a9) · [Linear — "Document duplicated" toast](https://mobbin.com/screens/673aa399-f54e-42d6-b962-e8b833c0c190) · [Notion — "Invite sent" toast w/ Undo](https://mobbin.com/screens/77bf884f-8c9b-478c-a3c0-dfec8d462e80) · [Notion — "Changes published" pill toast](https://mobbin.com/screens/2f1cef88-df7a-4c03-ad7a-da0ebc6ba822) · [Slack — "Feedback sent" pill toast](https://mobbin.com/screens/2218b546-fcc4-498b-aa35-1293f2166f9c) · [Intercom — full-width green save banner](https://mobbin.com/screens/6f9662bc-7b08-465e-9d3b-72a14cd0084c)

**Anatomy:** Two placements exist: **bottom-right floating card** (Linear — most common, stacks upward,
never competes with page header/tabs) vs. **top full-width banner** (Intercom — reads as system status,
fits a save confirmation tied to an active editing session, less so ambient background events). For a
dense, table-heavy app, bottom-right is the safer default. Linear's toast anatomy: small tinted status
icon + bold one-line title + muted one-line detail + optional single text-link action + close `×`,
inside a flat bordered card matching the app's own card language — already close to Maropost's
conventions. Notion adds an **Undo** action for reversible ops — a second legitimate action type beyond
"navigate to result." No example showed more than one action per toast. Manual close is always present
regardless of auto-dismiss.

**Spacing/density:** Narrow fixed width (~280-340px), long messages wrap rather than widen the card.
Stack gap ≈ one toast's own padding unit.

**Interaction principles:** One toast = one event, one optional action — never bundle. Icon+tint (green/
red/neutral) communicates severity before text is read. Always pair auto-dismiss with manual close.

**Maropost should adapt (shared toast API, planned):** Build the composable around `show(message,
{ title?, type: 'success'|'error'|'info', action?: { label, onClick }, duration? })`, rendering a
bottom-right stack of flat-bordered cards (`flat border rounded="lg"`, matching every other Maropost
card), Lucide icons per type (`check`, `triangle-alert`, `info`), and a close `×`; cap actions to
exactly one. `useDaVinciToasts.ts`/`DvToastStack.vue` in `copilot/` currently own a Da Vinci-scoped
pattern — when the shared API ships, either have Da Vinci consume it, or explicitly document why
copilot toasts stay separate (e.g. rendered inside drawer bounds, not viewport-fixed); flagged here so
it isn't missed. Default duration ~4-6s for success/info; errors should persist until manually
dismissed — a standard enterprise default, since static screenshots can't evidence timing.

**Should NOT copy:** Intercom's full-width colored banner for routine saves (reserve full-width banners,
if any, for real system-level states — trial countdowns, outages), any vendor's corner-radius/shadow
depth beyond Maropost's flat-border convention.

---

## 7. Tooltips + icon-only actions

**Studied:** [Sana AI — keyboard-shortcuts reference modal](https://mobbin.com/screens/cdd5147b-b244-4f90-a2ff-b08bfbc720a9) · [Notion — categorized shortcuts modal](https://mobbin.com/screens/49ebf525-3275-423a-9dda-725fdb0c1d68) · [Notion — hover tooltip on icon-only action](https://mobbin.com/screens/de0a5768-86d1-4daa-ab66-b79e82776fcc) · [Notion — hover flyout on "More settings"](https://mobbin.com/screens/a674b30c-c77b-4ff1-83ae-3436e01982af)

**Anatomy:** Hover tooltips are short (2-6 words, sentence case, no period), appear just above/below the
trigger without obscuring it. Shortcuts render as a `kbd`-style chip beside the tooltip text, never
concatenated into the same string. Full shortcut-reference modals organize by category (tabs), dense
one-line rows, label left / key-chips right-aligned. Icon-only buttons are reserved for
near-universally-recognized icons (search, close, kebab, add); anything domain-specific pairs the icon
with a visible label instead of relying on a tooltip alone.

**Spacing/density:** Tight tooltip padding (small pill); shortcuts-modal rows are dense (~32-36px) since
the surface exists purely for fast scanning.

**Interaction principles:** Tooltip text should equal the button's accessible name, not separate
marketing copy — keeps `aria-label` and tooltip in sync by construction. Reserve icon-only for icons a
user already recognizes; label anything domain-specific on first encounter.

**Maropost should adapt:** Audit existing icon-only buttons (`MpRowActionsMenu` trigger, `AppBar.vue`
icon actions, table toolbar icon buttons) for tooltip coverage — wrap every icon-only `v-btn` in
`v-tooltip` with text equal to its `aria-label`; a targeted attribute/content pass, not a new component.
Where a Maropost icon action has a shortcut (e.g. `⌘K` already shown via the `appbar-search-cmd` chip
class in `AppBar.vue`), reuse that same chip styling rather than introducing a second treatment.

**Should NOT copy:** Sana AI/Notion's specific shortcuts-modal chrome — not needed unless a shortcuts
reference is explicitly requested; this section's actionable item is the tooltip-coverage audit, not
new UI.

---

## 8. Metric/KPI cards + settings cards

**Studied:** [Stripe — KPI card grid, row 1](https://mobbin.com/screens/673e89af-fe9e-4ab9-ac27-435dedf21888) · [Stripe — KPI card grid, row 2](https://mobbin.com/screens/54ef3db8-2b9e-4ef3-a91a-cad15de1e1c9) · [Stripe — Billing overview, period-comparison controls](https://mobbin.com/screens/02176a39-e453-4570-af73-6af00fbe681b) · [Stripe — Billing overview, "Setup is complete" + KPI quadrant](https://mobbin.com/screens/3f9d51f3-22e4-414e-b277-2727a8f7efea) · [Stripe — Billing overview, subscribers tab](https://mobbin.com/screens/d61c0f22-6d42-4616-851e-d3bfe67b8e34)

**Anatomy:** Card, top to bottom: label (+ optional info-icon tooltip) and a card-level remove `×` →
big number → small delta/comparator chip → tiny full-bleed sparkline/bar → "View more" text link →
muted "Updated <time>" meta line last. Stripe's dashboard uses **no card border/shadow at all** —
grid gutter alone separates cards (Maropost's `flat border rounded="lg"` is a deliberate, reasonable
divergence for a denser, more heterogeneous app — not a gap to close). Comparator controls ("All
time"/"Monthly") live once above the whole grid, never repeated per card. Settings-checklist rows (from
the family-4 wizard research): check/empty-circle + bold one-line task + muted one-liner + single
right-aligned action — never more than one action per row. Trend/delta uses green/red exactly for
positive/negative, consistent with `MpKpiCard`'s existing `--pos`/`--neg` classes.

**Spacing/density:** The number carries all the visual weight; label/trend/meta are deliberately small
and low-contrast — one hero element per card. The "Updated" meta line is the smallest, most muted text
present but never competing with the number.

**Interaction principles:** Global filters (date range, comparison) belong once above a KPI grid, never
duplicated per card. A quiet "Updated Xh ago" line is cheap trust-signal real estate. Settings rows stay
single-action even under pressure to surface more.

**Maropost should adapt:** `MpKpiCard.vue` already follows the one-hero-element rule (label+icon → value
→ trend → substat → sparkline). Add an **optional `updatedAt?: string` prop** rendered via the existing
`text-caption text-medium-emphasis` utility at the card's bottom edge — purely additive, no call site
breaks. Where multiple `MpKpiCard`s share a date range (dashboards), verify the range control lives once
above the row, not duplicated — a verification item, not a guaranteed gap. Future Settings checklist UI
should follow the single-action-per-row shape using existing `v-list-item`/`v-btn`/`v-icon` — no new
component.

**Should NOT copy:** Stripe's borderless/shadowless cards (Maropost's flat-border convention stays),
Stripe's purple accent on progress elements.

---

## 9. AI-assistant surfaces (lower priority)

**Studied:** [Sana AI — answer w/ feedback-icon row](https://mobbin.com/screens/67047d63-2ae6-44e0-a2a2-8d6989a14819) · [Sana AI — long answer w/ collapsible Sources link](https://mobbin.com/screens/9098947d-d197-4f05-a54d-de310aa638be) · [Sana AI — generated table rendered inline](https://mobbin.com/screens/24dd3fb3-0f9d-4cc4-8e81-6040e88bd9ca) · [Sana AI — cited source in side preview + download toast](https://mobbin.com/screens/6a147880-1be5-4101-9bc0-d4beacf0b130) · [Intercom Fin — config list beside live customer-view preview](https://mobbin.com/screens/6f9662bc-7b08-465e-9d3b-72a14cd0084c) · [Intercom Fin — intro-message editor, Add message/Reset intro footer](https://mobbin.com/screens/d33a797e-ebba-4be2-aac3-ddd2f134d6f9) · [Intercom Fin — inline chip editing in a flow message](https://mobbin.com/screens/f3ab5928-7e53-4982-ad94-9104f581fc85) · [Intercom Fin — knowledge-source list w/ enabled chips](https://mobbin.com/screens/d8348d76-729f-4377-8854-15a5d593de8a)

**Anatomy:** Sana AI's answer block: prose → thin divider → a low-emphasis, collapsed **"Sources"** row
(expands to cited docs) → a quiet ghost-styled icon row (thumbs up/down, copy, flag, share) below
everything, detached from the answer by extra top-margin. Inline generated artifacts (an action-item
table) render as a real formatted table in the chat stream, not plain text. Mid-sentence citations
appear as small chips attached to the specific claim, not a bare hyperlink. Intercom Fin's config screen
is a **two-pane layout**: left = plain ordered settings list, right = a live, updating preview of what
the end customer sees — pairing abstract config with a concrete preview. Chat input stays plain in both:
single-line growable textarea, one send affordance, a couple of small utility icons — no heavy toolbar.

**Spacing/density:** Feedback-icon row is small, tightly grouped, with noticeably more top-margin from
the answer than between the icons themselves — reads as a detached utility strip. Citation chips are
small enough not to disrupt line height.

**Interaction principles:** Keep sources secondary and collapsible by default. Render structured AI
output as real components, not markdown-ish text. A config-list/live-preview split is the most
transferable idea here, relevant only if Da Vinci grows a dedicated configuration surface.

**Maropost should adapt:** If `copilot/` Dv* components ever add source citations or feedback to Da
Vinci answers, follow the "dimmed collapsible sources row + quiet detached feedback strip" anatomy —
buildable with existing `v-icon`/`v-btn` ghost variants and `v-expand-transition`, no new component.
Keep `MpDaVinciBot`'s chat input minimal per the observed pattern — a "don't regress" note, not a
change.

**Should NOT copy:** Sana AI's illustrated empty/loading states, Intercom's amber tutorial-tip styling,
either product's AI-avatar iconography (Da Vinci has its own identity).

---

## Cross-cutting notes for implementation agents

- Every recommendation is an additive prop or CSS-level change — none require a new shared component
  beyond the already-planned toast API. Optional props (`MpKpiCard.updatedAt`,
  `MpConfirmDialog.consequences`) mean zero changes at existing call sites.
- Items marked "verification item, not guaranteed gap" (global date-range filters, form-drawer footer
  ordering) should be checked against current behavior before assuming a gap exists.
- Items explicitly flagged **not to build yet** (shortcuts-reference modal, vertical `MpWizardSteps`
  orientation, Da Vinci config↔preview split pane) should only be picked up against a concrete future
  task — do not build ahead of need.
