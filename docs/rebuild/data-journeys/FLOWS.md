# Data Journeys — header/action flows

Crawled 2026-09-01 on UAT account 116000. ⚠ = not executed (mutating/destructive), stopped
at the last safe step.

## 1. NEW DATA JOURNEY (primary CTA)

1. Click `NEW DATA JOURNEY` → centred modal **"New Data Journey"**.
2. Fields: `Data Journey Name *` (text) · `End Date` (date picker) · `End Time` (time picker)
   · ☐ `Enabled Data Journey` · ☐ `Allow multiple instances`.
3. Validation: clearing/blurring the name → red 2px border + "Name is required"
   (message clipped by the field box — UAT defect).
4. Footer: `CANCEL` (closes, no changes) · `CREATE`.
5. ⚠ `CREATE` not executed. Expected landing (from list link anatomy): the new journey's
   builder. **Unverified.**

## 2. Row kebab → Edit Data Journey

1. Kebab (Actions column) → menu: Edit / Duplicate / Delete Data Journey.
2. `Edit Data Journey` → centred modal **"Edit Data Journey"**, same fields as New,
   pre-filled; plus a grey info strip: ℹ "This Data Journey was last disabled at
   Feb 12, 2026 at 12:00 AM".
3. Same name validation. Footer `CANCEL` / `CONFIRM`.
4. ⚠ `CONFIRM` not executed (would mutate). Success/failure states unverified.
5. Defect: the kebab menu remains open behind the modal.

## 3. Row kebab → Duplicate Data Journey ⚠

Not executed (creates a record). Unknown whether it duplicates silently or opens a dialog.
**Unverified.**

## 4. Row kebab → Delete Data Journey ⚠

Not executed (destructive). Confirm-dialog presence unverified.

## 5. Journey Status toggle ⚠

Flips enabled ↔ disabled directly in the row. Not executed. No confirm/toast could be
verified. The Edit modal's info strip ("last disabled at …") implies the platform records
toggle timestamps.

## 6. Bulk select → bulk delete ⚠

1. Header checkbox selects the current page (10) → header control row is replaced by
   `🗑  ✕  10 selected`.
2. ⚠ 🗑 not executed. Confirm presence unverified. ✕ clears selection (verified).

## 7. Filter select

`All ▾` → options All / Recently Modified / Draft / Enabled / Disabled. Selection applies
immediately (list reload). Options captured; each filter's result set not individually
verified.

## 8. Name link → Builder

1. Click name → `/data_journeys/:id/builder` (legacy iframe).
2. Canvas with existing graph; palette drag-drop to add nodes (⚠ not dropped onto canvas).
3. Click node → select + duplicate/delete controls. **Verified**: duplicate control clones
   the node on the canvas immediately (no dialog); delete ✕ removes it. Canvas state is
   unsaved until Save.
4. Double-click node → config modal (Send Campaign documented in AUDIT §2; footer
   Save / Detach / Remove — ⚠ none executed).
5. Toolbar: `Save as Draft` ⚠ · `Save` ⚠ · `Clear` ⚠ (presumably empties canvas; no confirm
   verified) · `Exit` (returns to list — not clicked; navigated directly instead).
6. Back path: browser back / `Exit`. **Exit landing unverified.**

## 9. Instances link

1. Click instance count → `/data_journeys/:id/instances` (legacy iframe).
2. Bare list of runs (see AUDIT §3). No pagination controls observable; scrolling broken
   inside the shell.
3. Instance-name link behavior **unverified** (click produced no navigation).
4. No back affordance — browser back only.

## 10. Row drag handle ("Move Data Journey") ⚠

Tooltip confirms the affordance; drag not performed. Reorder vs move-to-position semantics
**unverified**.
