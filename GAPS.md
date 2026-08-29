# GAPS — flagged during the 2026-08 polish pass, deliberately not fixed

Things the polish pass surfaced that need either a design-system addition, a functional
decision, or a separate effort. Each entry says what exists today and what the proposed fix is.

## 1. Menu primitive — `role="menuitem"` is a call-site convention
`MpRowActionsMenu` now sets `role="menu"` on its list, but items arrive through a slot, so
`role="menuitem"` must be written on every `v-list-item` by hand (done across the app in this
pass, documented in the story). **Proposed spec:** a thin `MpMenuItem` wrapping `v-list-item`
with `role="menuitem"` baked in (props: `title`, `icon?`, `danger?` — `danger` renders the
text-error treatment and asserts it is the last group), letting the component own the contract
instead of a convention. Low urgency while the convention holds.

## 2. `guarded` coverage on dirty-state drawers (behavioral — out of scope)
Only 3 of ~59 `MpFormDrawer` instances set `guarded`, so most long create/edit forms discard
unsaved work on Escape/scrim without confirmation: `CustomGiftCards`, `PurchasableGiftCards`,
`ContactFields`, `SearchRules`, `Tickets`, `InviteUsersDrawer`, `UserAccessDrawer` (and most
others). Adding it changes close behavior (needs a confirm flow per host), so it was excluded
from this visual-only pass. **Proposed fix:** a follow-up slice wiring `guarded` + an
`MpConfirmDialog` per dirty form.

## 3. Shared toast API
~96 per-view `v-snackbar`s with no shared component (only the copilot has `DvToastStack`).
Already scoped in `docs/overlay-audit/01-overlay-component-audit.md`. Separate effort.

## 4. Focus-trap / float-CSS duplication in the copilot
- `DvHistoryDrawer.vue` re-implements `MpFormDrawer`'s focus trap, Escape and focus-restore
  verbatim (it is position-absolute inside the copilot panel, so it can't compose the drawer).
- The copilot dock (`App.vue` `.copilot-drawer`) and `MpFormDrawer` duplicate the floating-shell
  CSS, including the closed-state `translateX(calc(100% + 32px))` hack.
**Proposed fix:** extract a `useFocusTrap` composable + a shared float-shell mixin/class.

## 5. Retail "Deactivate" severity (copy/behavior call)
`Retail/Registers.vue` row menu's "Deactivate" carries no danger/warning styling while the
bulk-bar twin uses `color="warning"`. Whether deactivation is destructive-adjacent is a product
call — flagged, not styled.

## 6. `AudienceView.vue` is dead code
No route, no imports anywhere in `src/`. Excluded from the polish sweep. Delete when convenient.

## 7. AppBar mobile search overlay (recorded exemption)
`AppBar.vue` fullscreen raw `v-dialog` remains the one sanctioned raw dialog (DESIGN_AUDIT
P6-7). Closest future fix: `MpDialog fullscreen flush` with `#headerActions`.

## 8. Retail widget-skin hover elevation
The polish pass removed the resting `--elevation-raised` from `.retail-widget-card` (border-only
per the containment rule) but kept the hover lift as an interactive affordance. If the no-shadow
rule is meant absolutely, drop the hover shadow too — one-line change in
`src/styles/retail-widgets.scss`.

## 9. `.jb-panel` drawer width off the ramp
`JourneyBuilder.vue`'s in-flow builder panel is 380px — not on the 440/480/640 drawer ramp. It
is an in-layout aside, not a modal drawer, so it was left; noting the stray width for the next
token sweep.

## 10. Pre-existing page-level axe findings (shared chrome)
The polish-pass axe runs surfaced a recurring set of violations that predate the pass and live
in shared chrome, identical across pages: Vuetify select/autocomplete internals rendering
`role="option"` items outside a listbox (`aria-required-parent`/`aria-allowed-attr`), unlabeled
`v-data-table` row checkboxes (`label`), unnamed tooltips (`aria-tooltip-name`), widget toggle
names, and landmark structure (`landmark-*`, `heading-order`, `nested-interactive`). These are
framework-level or shell-level, out of the four problem areas — the natural next a11y slice.
