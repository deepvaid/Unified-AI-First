# Data Journeys — parity checklist

Rebuilt 2026-09-01 against `AUDIT.md` / `FLOWS.md`. Sandbox surfaces:
[DataJourneys.vue](../../../src/views/Marketing/DataJourneys.vue) ·
[DataJourneyInstances.vue](../../../src/views/Marketing/DataJourneyInstances.vue) ·
[JourneyBuilder.vue](../../../src/views/Marketing/JourneyBuilder.vue) (`flowDomain: 'data'`) ·
[useDataJourneys.ts](../../../src/stores/useDataJourneys.ts)

## List — `/accounts/:accountId/data_journeys`

- [x] Breadcrumb "My Journeys" (eyebrow) + H1 "Data Journeys"
- [x] Filter select: All · Recently Modified · Draft · Enabled · Disabled ("Recently Modified" sorts by updated-at, matching production's behavior)
- [x] Primary CTA "New data journey"
- [x] Table: select-all + row checkboxes · Name · Journey status (toggle) · Instances (right-aligned) · Updated at · Created at · Actions
- [x] Name links to the builder
- [x] Instance count links to the instances page (0 renders as plain text)
- [x] Status toggle flips Enabled ↔ Disabled (Draft switched on becomes Enabled); toast confirms
- [x] Timestamps in "MMM DD, YYYY at HH:MM AM" format
- [x] Kebab: Edit / Duplicate / Delete data journey
- [x] Bulk select → bulk delete (with confirm) + clear selection
- [x] Pagination: rows-per-page + range + prev/next (v-data-table footer)
- [x] Empty state when the filter matches nothing
- [ ] Row drag handle ("Move Data Journey") — NOT reproduced; UAT semantics unverified (flagged in FLOWS §10, see GAPS)

## New / Edit dialogs

- [x] Fields: Data journey name * · End date · End time · ☐ Enabled data journey · ☐ Allow multiple instances
- [x] "Name is required" validation (message renders un-clipped — UAT defect fixed)
- [x] Edit shows the ℹ "last disabled at …" note (as MpAlert, not a bare strip)
- [x] Cancel / Confirm (edit) · Cancel / Create (new)
- [x] Create lands in the new journey's builder (inferred landing — flagged unverified in FLOWS §1)
- [x] Duplicate appends " copy" and creates a Draft (UAT naming pattern; execution unverified in UAT)
- [x] Delete confirms with consequences (confirm presence unverified in UAT — sandbox always confirms destructive actions)

## Builder — `/data_journeys/:id/builder`

- [x] Palette: 8 triggers (Scheduled, Recurring, Import Finished, Export Finished, Campaign Sent, Report Generated, File Uploaded, API Event)
- [x] Palette: 7 actions (FTP Upload, Send Campaign, Start Import, Start Export, Send to Facebook, Secure List Import, **Generate Report** — added this slice)
- [x] Node select → configure / duplicate-equivalent (add from palette) / delete; end node present
- [x] Node config panel with Apply / **Detach** / **Remove** (same three actions as the legacy modal footer)
- [x] Send Campaign config carries every legacy field: Subject, Preheader, From name, From email, Reply to, Brand, Content, Preview link, Address, Language (Campaign section) · Lists, Segments, Suppress lists, Suppress secure lists, Suppress segments, Suppress journeys, Tables (Recipients section) · Campaign tags section — the legacy 3-tab modal flattened into one sectioned panel
- [x] Toolbar parity: Save as Draft → **Save** (persists as draft, toast) · Save/enable → **Enable/Disable** · **Clear** (with confirm, data domain only) · Exit → builder shell back
- [x] Enabled/Disabled vocabulary in the builder (chip + toggle button), not Active/Paused
- [ ] Free-form node placement / hand-drawn edges — the sandbox builder is a structured vertical flow (deliberate; the shared builder shell is the system pattern)

## Instances — `/data_journeys/:id/instances`

- [x] One row per run: name · status · Finished at · Updated at · Created at
- [x] Status values Finished (and Running for the newest active run)
- [x] "—" for a running instance's finished-at
- [x] Page header with back link + journey context (UAT dead-end fixed — see IMPROVEMENTS)
- [x] Pagination + empty state ("No runs yet")
- [ ] Instance-name link behavior — UAT behavior unverified; the sandbox renders it as plain text

## States

- [x] Loading: not applicable (mock store is synchronous); table renders instantly
- [x] Empty (filtered + no-runs) · not-found (journey missing)
- [x] Success toasts on create/update/duplicate/delete/toggle
- [x] Validation error on the name field
