# Data Journeys — UAT audit

Read-only crawl of `uat.maropost.com`, account `116000`, 2026-09-01.
No records were mutated (one node duplicated on the builder canvas during probing was
removed before leaving; nothing was saved).

Three surfaces in scope:

| # | URL | Working title | Runtime |
|---|-----|---------------|---------|
| 1 | `/accounts/116000/data_journeys` | Data Journeys list | Vue MFE in the Vuetify 3 shell (top document) |
| 2 | `/accounts/116000/data_journeys/:id/builder` | Data Journey Builder | **Legacy iframe** (`uat-web.maropost.com`, Drawflow-style canvas) |
| 3 | `/accounts/116000/data_journeys/:id/instances` | Journey Instances | **Legacy iframe** (bare list, page title "Legacy Page") |

---

## 1. `/accounts/116000/data_journeys` — list

### Page purpose & primary user task

Data Journeys are **data-operations automations** (not marketing journeys): a trigger
(schedule, import/export finished, campaign sent, API event…) drives a chain of actions
(FTP upload, send campaign, start import/export, generate report…). The list is where an
operator finds a journey, enables/disables it, checks how many times it ran (instances),
and starts a new one. 38 journeys exist in this account.

### Layout structure and hierarchy

```
Breadcrumb "My Journeys"
H1 "Data Journeys"                       ← left
  [All ▾]  [NEW DATA JOURNEY]            ← right-aligned control row
Table card
  header: ☐ select-all | Name | Journey Status | Instances | Updated At | Created At | Actions
  rows ×10
  footer: Rows per page: 10 ▾ · 1-10 of 38 · ‹ ›
```

### Components → design-system mapping

| UAT element | Closest Mp equivalent |
|---|---|
| Breadcrumb + H1 | `MpPageHeader` (`eyebrow`/`backTo` not needed; plain title) |
| "All" filter select | `MpDataTableToolbar` `quickFilter` (single-select) — or `MpFilterTabs`, see Phase-2 question |
| NEW DATA JOURNEY | `MpPageHeader` `#actions` primary `v-btn` |
| Table | `v-data-table` in `v-card flat border` |
| Journey Status toggle | `v-switch` cell (closest existing: `MpStatusToggle`, but that is Active/Paused/Draft — see GAPS) |
| Instances count link | link cell → instances route |
| Row kebab | `MpRowActionsMenu` + `MpMenuItem` |
| Bulk header ("10 selected" + 🗑 + ✕) | `MpFloatingBulkBar` |
| Pagination | `v-data-table` footer |

### Data fields, labels, copy

- Filter options: **All · Recently Modified · Draft · Enabled · Disabled** (single select; "All" default).
- Columns: `Name`, `Journey Status` (toggle: on = enabled, off = disabled/draft), `Instances`
  (integer, right-aligned; **links to `/data_journeys/:id/instances`**), `Updated At`,
  `Created At` (both "MMM DD, YYYY at HH:MM AM"), `Actions`.
- Name cell links to `/data_journeys/:id/builder`.
- Sample rows: "sk datajrny 116000" (enabled, 1 instance), "start export testing 116000"
  (disabled, 30), "sk25may" (2), "AAA" (0), "data beta" (2), "www", "10_nov", "8u",
  "delay until test", "timezone revert test copy copy".
- Kebab items: **Edit Data Journey · Duplicate Data Journey · Delete Data Journey**
  (pencil / copy / trash icons; delete is NOT visually separated or red).
- Row hover reveals, at the left edge: a **drag handle** (tooltip "Move Data Journey <name>")
  and the row checkbox.
- Select-all → header control row is replaced by: 🗑 (bulk delete) · ✕ (clear) · "10 selected"
  (selects current page only; underlined text link style).

### Interactions & behaviors

- **Filter select**: plain dropdown; "Recently Modified" is a sort masquerading as a filter option.
- **Status toggle**: flips enabled/disabled in place (mutation — not executed; no confirm observed
  before flip could be verified → unverified).
- **Edit** (kebab): opens centred modal — see FLOWS.
- **New Data Journey**: opens centred modal — see FLOWS.
- **Row drag handle**: reorder/move (semantics unverified — not dragged).
- **Pagination**: classic rows-per-page + range + prev/next.
- No text search anywhere on the list.

## 2. Builder (`/:id/builder`) — legacy iframe

```
Canvas header: journey name (plain text, centred)
Left palette (its own scroll):
  TRIGGERS (blue):  Scheduled · Recurring · Import Finished · Export Finished ·
                    Campaign Sent · Report Generated · File Uploaded · API Event
  ACTIONS (green):  Ftp Upload · Send Campaign · Start Import · Start Export ·
                    Send To Facebook · Secure List Import · Generate Report
Canvas: drag-drop node graph. Observed graph: API Event → Send Campaign → End (red node).
Bottom-right toolbar: [💾 Save as Draft] [💾 Save] [◪ Clear] [⇥ Exit]
```

- Node interactions: click selects and reveals two floating controls — **duplicate**
  (top-left) and **delete ✕** (top-right); output port dot on the right edge; edges are
  hand-drawn bezier connectors. **Double-click opens the node's config modal.**
- "End" node is always present (red, gear/power icon).

### Send Campaign node config modal (representative action config)

Legacy modal, grey title bar "Send Campaign", description paragraph, then tabs:

1. **Create Campaign**: Subject · Preheader · From name · From email · Reply to ·
   Brand (select) · Content (select + preview 👁) · Preview link (checkbox) ·
   Address (textarea) · Language (select, English).
2. **Select Recipients**: sub-tabs with counts — Lists 1 · Segments 0 · Suppress Lists 0 ·
   Suppress Secure Lists 0 · Suppress Segments 0 · Suppress Journeys 0 · Tables 0.
   Each: search box · "Select All" · checkbox list ("0903 (71)", "116000_integration1 (325)" …).
3. **Select Campaign Tags**: sub-tab "Campaign Tags 0", checkbox list of tags.

Footer: **Save · Detach · Remove**; ✕ close at bottom-right of modal frame (odd placement).

(Other triggers/actions have their own config forms — not individually crawled; the
Send Campaign modal is documented as the representative shape. Flagged in FLOWS.)

## 3. Instances (`/:id/instances`) — legacy iframe

- **No page header, no back link, no title** — the iframe starts directly with rows.
- Row anatomy: journey-name link (blue) + status text below ("Finished"); three timestamp
  columns, each showing the value with a small grey label **below** it: `FINISHED AT` ·
  `UPDATED AT` · `CREATED AT`.
- Only status value observed: "Finished". (Running/failed states not observable in this account.)
- The name link's behavior could not be verified (click did not navigate in the iframe).
- List renders all instances; page scrolling inside the shell was effectively broken
  (wheel/keys did nothing — 30-row journey could not be scrolled to its end).

---

## Accessibility issues observed

1. **Kebab menu contrast**: menu item text renders ~grey-on-white (legacy `theme--light`
   muted style) and looks disabled even though items are active. Fails 4.5:1.
2. **Edit/New dialog validation clipping**: "Name is required" renders half-clipped under
   the field border — literally cut off mid-glyph.
3. **Overlay stacking**: the row kebab menu stays open *behind* the Edit dialog; the filter
   select reopened underneath a menu during interaction. No focus trap discipline.
4. **Status toggle has no accessible label** (bare switch; column header is the only context).
5. **Instances page**: no heading structure at all, no back affordance; label-under-value
   timestamp pattern is read backwards by screen readers.
6. Builder is mouse-only (drag-drop, double-click to configure, hover-revealed node
   controls); no keyboard path.
7. Legacy iframe pages don't scroll with the wheel/keyboard inside the shell.

## UX friction points worth fixing

1. "Recently Modified" (a sort) mixed into a status filter select.
2. Instances is a **dead end**: no header, no back, no journey context, no pagination.
3. Kebab items all look disabled (grey); Delete not visually distinguished as destructive.
4. No search on a 38-row (growing) list.
5. Status change is silent — no confirmation or toast observed on the toggle.
6. New/Edit dialog: "Enabled Data Journey" + "Allow multiple instances" checkboxes are
   unexplained; End Date/Time purpose is unexplained.
7. Bulk mode exposes only Delete — and swaps the entire header row (filter + NEW disappear).
8. Builder toolbar sits bottom-right, half covered by the HubSpot chat bubble at common
   window sizes.
9. Kebab "Edit" opens a *metadata* dialog while clicking the name opens the *builder* —
   two different "edit" ideas with one word.
