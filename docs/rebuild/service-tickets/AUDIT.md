# Service Tickets — UAT audit

Read-only crawl of `uat.maropost.com`, account `116000`, 2026-09-01.
Modern Vue 3 MFE (`mfe-outlet-service-desk`) in the top document — no legacy iframe.
No tickets were created, sent, closed, or deleted.

Surfaces in scope:

| # | URL | Working title |
|---|-----|---------------|
| 1 | `/service/116000/tickets` | Ticket inbox (master/detail split) |
| 2 | `/service/116000/tickets?selected=:id` | Same page, ticket selected in detail pane |
| 3 | `/service/116000/tickets/:id` | Ticket Details (full page, opens in new tab) |
| 4 | `/service/116000/tickets/create-new` | New Ticket (full page) |

Related but out of slice: "New Contact" routes to the CDP page
`/accounts/116000/contact/new?ticket=true` (already rebuilt — `docs/rebuild/new-contact/`).

---

## 1. Ticket inbox — `/service/116000/tickets`

### Page purpose & primary user task

The support agent's working inbox: triage incoming tickets (email/webstore/call/walk-in),
read the conversation, reply, and manage status/priority/assignment. Primary loop:
pick view → scan list → open ticket → reply/update properties → next.

### Layout structure and hierarchy

```
H1 "Tickets"   [≓ FILTERS]   [+ NEW ▾]
┌ list panel (~38%) ──────────────┬ detail pane (~62%) ─────────────────────┐
│ [🖥 All Inboxes · All Tickets ▾] │ empty state: 🎫 "Select a ticket to     │
│ ticket rows (infinite scroll)   │ view its details"                        │
└─────────────────────────────────┴──────────────────────────────────────────┘
        ↑ draggable separator, aria-label "Resize the list and detail panes"
```

### Components → design-system mapping

| UAT element | Closest Mp equivalent |
|---|---|
| H1 + actions | `MpPageHeader` + `#actions` (FILTERS = outlined btn, NEW = primary split menu) |
| Views dropdown | closest is `MpFolderSelect` (grouped single-select menu) — see GAPS |
| Ticket row | `MpListRow` (lead checkbox+dot, title, eyebrow/meta, trailing chip+date) |
| Status chip (New/Open/…) | `MpStatusChip type="ticket" size="sm"` |
| Filter drawer | `MpFormDrawer` (or `MpDataTableToolbar #filter-content` pattern) |
| Bulk action surface | detail-pane empty-state variant + `v-btn`s (see GAPS: not `MpFloatingBulkBar`) |
| Assign dialog | `MpDialog size="sm"` |
| Delete confirm | `MpConfirmDialog danger` |
| Detail thread | `MpChatBubble` (+ activity rows = `MpListRow`/timeline) |
| Property bar dropdowns | inline select menus (`v-menu` + `MpMenuItem`) |
| Right rail panels | icon rail + panel — closest `MpSectionRail` is nav, not this; see GAPS |
| Composer | bespoke (rich-text) — CKEditor-class editor, see GAPS |

### List panel

- **Views dropdown** (label = "<inbox> · <view>", e.g. "All Inboxes · All Tickets"):
  grouped menu — group per inbox (**ALL INBOXES**, **NEW INBOX**), each with:
  All Tickets · My Tickets · High Priority Tickets · then custom saved views
  (Abhinav, My Filter, Abhisheks Ticket, HubSpot, ss, Multi AV, SC 2017, Type Problem,
  Low Open WalkIn, Harpreet_Tickets) · **Trash** as the last root item.
- **Row anatomy**: checkbox (visible always) · unread **blue dot** before subject ·
  subject (semibold) · contact name · one-line snippet (ellipsized) · relative/short date
  (top right: "Yesterday", "Aug 30") · status chip bottom-right (`New`, `Open` observed;
  vocabulary: new/open/pending/on_hold/closed).
- One row showed a **red dot** in the chip slot instead of a chip (meaning unverified —
  likely high-priority or failed-send marker).
- Selected row: light blue background + 3px left accent bar. Unread rows keep the dot.
- **Infinite scroll** with bottom spinner (no pagination controls).
- **No text search anywhere** (neither in the list nor the filter drawer).

### Detail pane (ticket selected; URL gains `?selected=:id`)

```
Property bar (above pane, page-level): Priority ●Low ▾ · Type -- ▾ · Status Open ▾ · Agent C P ▾
Pane header: breadcrumb "New inbox > 1524 > Need help" · [Show Activities ⃝] · [⧉ expand] · [⋮]
Thread (scrolls):
  requester card: "Rajan Bhanot reported via Email Yesterday, 8:25 AM / To: sushant@maropost.com"
                  + body (light blue bg) + ↪ forward icon
  agent/bot card: "Automated Bot replied on Aug 31, 2026, 8:25 AM / To: …" + body (grey bg) + ↪
  (with Show Activities ON) grey system cards inline:
                  "System executed an automation on Aug 31 … / Status updated to Open"
                  "Rajan Sushant Aug 31 … / Ticket viewed by Rajan Sushant"
Right icon rail (3): 👤 Customer Info · 🏷 Tags · 📦 Customer Orders
Bottom action bar: [↰ REPLY] [↱ FORWARD] [🗎 NOTE]
```

- **Property bar** is inline-editable: each is a dropdown (Priority shows a colored dot —
  low = blue/teal; vocabulary low/medium/high. Status: new/open/pending/on_hold/closed.
  Type: ticket types list. Agent: agent list). ⚠ Changing any is a mutation — not executed.
- **Kebab (⋮)**: `Edit Ticket Details` · `Mark as unread`.
- **Expand (⧉)**: opens `/service/116000/tickets/:id` in a **new tab**.
- **Right rail panels** (one at a time, panel replaces pane width, ✕ to close):
  - **Customer Info**: Name (link out to contact ⧉) · Email · Mobile no. · ✎ edit.
  - **Tags**: single Tags multiselect.
  - **Customer Orders**: search box + table `Order ID | Store | Order Date`, "No data
    available" empty state (plain text row — no illustration).

### Composer (REPLY / FORWARD / NOTE)

- Opens docked at the bottom of the thread. Header: `Reply ▾` (mode switch) ·
  `From: sushant@maropost.com ▾` · right icons: ⤢ expand · 📎 attach · 🗎 (canned/template).
- Fields: `To:` (prefilled requester) · `Cc` · `Bcc` toggles.
- Rich-text editor (CKEditor badge visible): B, I, link, blockquote, undo/redo, bullet,
  numbered, paragraph-style select, indent/outdent. Signature auto-inserted
  ("Best Regards, Deepak Vaidya" + image). "…" collapsed-quote toggle.
- Footer: `Cancel` · **`Send` split-button** ▾ → `Send and set as Pending` ·
  `Send and set as On hold` · `Send and set as Closed`. ⚠ Not sent.
- Glitch: the split menu painted blank (white-on-white) until re-render; DOM text/colors
  were correct — flaky paint in UAT.

### Bulk selection

Checking ≥1 row **replaces the detail pane** with a bulk surface:
icon + "1 ticket selected" + "Choose an action to apply to the selected ticket." +
buttons `ASSIGN` · `CLOSE` · `MARK AS UNREAD` · `DELETE`. The FILTERS/NEW header row
disappears while in bulk mode.

- **Assign** → dialog "Assign Ticket (#1523)": `Select Agent` dropdown; `Assign` disabled
  until a pick; Cancel. ⚠ not executed.
- **Delete** → confirm "Delete Ticket — Are you sure you want to delete the selected
  ticket? You can restore fro…" (message clipped in the dialog — UAT defect); Cancel /
  Delete. ⚠ not executed. (Copy implies restore from Trash view.)
- Close / Mark as unread: ⚠ not executed, no confirm observed before stopping.

## 2. Ticket Details full page — `/tickets/:id`

Same anatomy as the detail pane, plus:
- Breadcrumb `All Tickets > #1524`, H1 = subject + ✎ (inline title edit).
- Thread messages get **avatars** (RB / AB initials discs).
- **Customer Info panel is open by default** on the right (still closable).
- Property bar, Show Activities, REPLY/FORWARD/NOTE identical.

## 3. New Ticket — `/tickets/create-new`

- Breadcrumb `All Tickets > New Ticket`, H1 "New Ticket", top-right `+ Add New Contact`.
- Two-column form: `Inbox ▾` | `Contacts ▾` ("-- -" placeholder) · `Type ▾` | `Channel ▾`
  · `Status ▾` | `Priority ▾` (pre-filled "low") · `Agent ▾` | `Tags ▾` ·
  `Subject` (full width) · `Description *` (same rich-text editor) · `+ Attach File` ·
  footer `Cancel` / `Create` (**disabled** until required fields valid).
- Label style is inconsistent: some fields show floating labels (Contacts, Channel,
  Status, Priority), others placeholder-only (Inbox, Type, Agent, Tags, Subject).
- `Add New Contact` **navigates away** to `/accounts/116000/contact/new?ticket=true`
  (CDP New Contact page; shows toast "Email or Phone Number is required to create a
  contact"). Any typed ticket-form state is at risk — not verified whether it survives.
- File uploader accepts (from component constants) images/docs/word/archives
  (.zip .rar .7z .tar .gz .bz2 .xz .cab).

## Filter drawer (FILTERS)

Right-side drawer "Filters" with ✕; stacked selects:
`Status` (new/open/pending/on_hold/closed) · `Priority` (low/medium/high) ·
`Channel` (email/webstore/inbound_call/walk_in) · `Type` (Customer Request, Bug (Primary),
Technical Support, Service Request, Pricing, Payment, Product Enquiry, Incident, + test
noise) · `Group` (General) · `Agent` (agent lookup) · `Contacts` (contact lookup) ·
`Tags` (tag list) · `Created date range` (date range picker) · `Read status` (Read/Unread).
Footer: `Clear Filter` · `Save as View` (creates the custom views seen in the views
dropdown) · `Apply` (disabled until dirty).

---

## Accessibility issues observed

1. Ticket list rows are click targets without link/button semantics (whole-row div click).
2. Unread state carried by a colored dot only (no accessible name/text equivalent).
3. Red-dot row marker has no label at all and its meaning is not discoverable.
4. Property-bar dropdowns are text+chevron with no visible labels for their current
   values' meaning (e.g. "C P" agent initials as the only text).
5. Delete confirm clips its own explanation text (ellipsis mid-sentence).
6. Send split-menu painted blank (contrast/paint flake) — items unreadable at first open.
7. Status vocabulary leaks raw enum casing (`on_hold`) into filter UI.
8. Composer From/To rows rely on placeholder-grey text below 4.5:1.
9. New Ticket form mixes floating-label and placeholder-only fields — placeholder-only
   fields lose their label once filled.
10. Bulk mode removes the page header (FILTERS/NEW) — context loss with no announcement.

## UX friction points worth fixing

1. **No keyword search** for tickets anywhere (list, filters) — find-by-subject requires scanning.
2. Bulk actions live in the emptied detail pane rather than a persistent bar — pattern
   is surprising and hides the ticket you had open.
3. `Add New Contact` abandons the half-completed New Ticket form.
4. Views dropdown repeats every saved view under every inbox group — long, redundant menu.
5. Snippet + status chip + date compete in a cramped row; status chip sometimes missing.
6. "Show Activities" default-off hides the audit trail agents usually need.
7. Assign dialog shows the ticket id (#1523), not the subject the agent recognizes.
8. Composer signature image renders as a broken-image placeholder in UAT.
9. Two "edit" entry points (kebab → Edit Ticket Details vs. property bar) split the same job.
