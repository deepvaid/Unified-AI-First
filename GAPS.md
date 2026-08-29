# GAPS — polish-pass backlog (updated 2026-08-30: follow-up slice closed most items)

Originally flagged during the 2026-08 polish pass. A follow-up slice on 2026-08-30 worked the
list; each entry now carries its outcome.

## 1. Menu primitive — ✅ CLOSED
`MpMenuItem` shipped (`src/components/MpMenuItem.vue` + story): `title` / `icon` / `danger`
props over a `v-list-item` with `role="menuitem"` baked in; attrs and slots pass through.
Every action-menu item in the app was migrated (~150 items across ~60 files), including the
eight Marketing views that carried labels as slot content — their per-item `rounded="lg"` /
`text-body-2` styling was dropped in favor of the panel's central chrome. Items that are not
plain label+icon actions (`v-list-subheader`, embedded controls, the canned-responses picker)
deliberately remain raw.

## 2. `guarded` on dirty-state drawers — ✅ CLOSED
Rolled out to the seven hosts, mirroring the Segments.vue reference (snapshot on open, dirty
computed, `:guarded` + `@close` → MpConfirmDialog "Discard changes"): CustomGiftCards (issue
drawer), PurchasableGiftCards, ContactFields, SearchRules, Tickets (new-ticket drawer),
InviteUsersDrawer, UserAccessDrawer (reused its existing `dirty` computed). Read-only/detail
panes were left unguarded by design. Remaining unguarded form drawers are short create forms —
add the same pattern opportunistically.

## 3. Shared toast API — ✅ CLOSED (finding was stale)
A shared `useToast` + `MpToastStack` already exists and is used by ~100 files; `VSnackbar`
theme defaults are set. The only raw `<v-snackbar>` left is inside the exempt POS simulator
(`Retail/PosPreview.vue`).

## 4. Focus-trap / float-CSS duplication — ✅ CLOSED
`useFocusTrap` composable extracted (`src/composables/useFocusTrap.ts`) and adopted by
`MpFormDrawer` and `DvHistoryDrawer` (rail mode stays inert via `enabled`). The duplicated
closed-state translate hack now lives once in `global.scss` as `.mp-float-drawer`, applied by
both the copilot dock and `MpFormDrawer`; the dock's hardcoded 12px gutters were tokenized.

## 5. Retail "Deactivate" severity — ✅ CLOSED
The row-menu Deactivate now matches the detail drawer's error treatment: last item, divided,
`danger`. (The bulk-bar button keeps its existing `color="warning"` — flag if those two should
also converge.)

## 6. Dead code — ⚠ VERIFIED, DELETION LEFT TO YOU
`src/views/AudienceView.vue`, `src/views/Settings/Users.vue`, `src/views/Settings/Profile.vue`,
`src/views/Settings/Billing.vue` have zero routes, imports, or story references (verified
2026-08-30). File deletion is permission-gated in this session — remove them with:
`git rm src/views/AudienceView.vue src/views/Settings/{Users,Profile,Billing}.vue`

## 7. AppBar mobile search — ✅ EVALUATED, EXEMPTION STANDS
Rebuilding on `MpDialog fullscreen flush` was assessed and rejected: MpDialog's title-led
header cannot host an input-led sheet whose search field must stay fixed while results scroll —
the field would land in the scrolling body. The P6-7 exemption is now documented at the call
site, and the actual a11y gap was closed instead (`aria-label="Universal AI search"` on the
dialog; Vuetify supplies `role="dialog"`/`aria-modal`).

## 8. Retail widget-skin elevation — ✅ CLOSED
Hover shadows removed from `.retail-widget-card` and `.retail-action-tile` (border-step hover
affordance only); orphaned box-shadow transitions trimmed.

## 9. Builder panel width — ✅ CLOSED
New token `component.builder.panelWidth` (380) — in-layout builder asides are deliberately
narrower than the modal drawer ramp; `JourneyBuilder.vue`'s `.jb-panel` consumes it.

## 10. Pre-existing page-level axe findings — ◐ PARTIALLY CLOSED
App-level fixes landed: dashboard widget titles are now `h2` (heading order under the page
`h1`), and the activity-feed scroll region is keyboard-focusable with a named `role="region"`.
Still open, framework-level (Vuetify internals, not fixable app-side without patching Vuetify):
select/autocomplete `role="option"` items outside a listbox, unlabeled `v-data-table` row
checkboxes, empty teleported tooltip containers. Track against Vuetify upgrades.
