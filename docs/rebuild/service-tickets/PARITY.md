# Service Tickets — parity checklist

Rebuilt 2026-09-01 against `AUDIT.md` / `FLOWS.md`. Sandbox surfaces:
[Tickets.vue](../../../src/views/Service/Tickets.vue) ·
[TicketDetail.vue](../../../src/views/Service/TicketDetail.vue) ·
[TicketCreate.vue](../../../src/views/Service/TicketCreate.vue) ·
[TicketWorkspace.vue](../../../src/components/service/TicketWorkspace.vue) ·
[useTickets.ts](../../../src/stores/useTickets.ts)

Routes moved to production paths: `/service/:accountId/tickets` (+ `?selected=:id`),
`/tickets/:id`, `/tickets/create-new`; the old `/accounts/:accountId/service` redirects.

## Inbox — `/service/:accountId/tickets`

- [x] Header: "Tickets" + FILTERS + NEW split menu (New ticket / New contact)
- [x] Master/detail split; empty detail state "Select a ticket to view its details"
- [x] Views dropdown labelled "<inbox> · <view>": groups per inbox (ALL INBOXES + one per mailbox), each with All Tickets / My Tickets / High Priority Tickets + saved views; Trash last
- [x] Saved views are real filter sets (selecting one applies its filters)
- [x] Row anatomy: checkbox · unread blue dot · subject · contact · snippet · relative date · status chip
- [x] Selected row: tinted background + left accent bar; opening marks read; URL carries `?selected=:id`
- [x] Status vocabulary: New / Open / Pending / On Hold / Closed (chips via `MpStatusChip type="ticket"`)
- [ ] Infinite scroll — the mock list (14 tickets) renders fully; no paging needed at this size
- [ ] Red-dot row marker — meaning unverified in UAT; not reproduced (see GAPS)

## Filters drawer

- [x] Status · Priority · Channel · Type · Group · Agent · Contacts · Tags · Created date range (from/to) · Read status
- [x] Vocabularies match UAT (priorities low/medium/high; channels email/webstore/inbound call/walk in; the type list; Read/Unread)
- [x] Clear Filter · Save as View (names + persists the filter set, appears in the views menu) · Apply (disabled until dirty)

## Detail pane & full page

- [x] Property bar: Priority (colored dot) / Type / Status / Agent — inline dropdowns that update with toast + activity entry
- [x] Breadcrumb context (pane: property bar header; page: "All Tickets · #id" + subject title)
- [x] Show Activities toggle interleaves system events ("Status updated to …", "Ticket created") in the thread
- [x] Expand opens the full-page route (same tab — see IMPROVEMENTS)
- [x] Kebab: Edit Ticket Details / Mark as unread
- [x] Thread: requester card ("reported via Email · time" + To: line, accent tint), bot/agent replies (neutral), internal notes (lock footer); avatars on the full page
- [x] Right rail: Customer Info (name→contacts link, email, mobile, edit pencil) · Tags (multiselect) · Customer Orders (search + Order ID/Store/Order date table + "No data available")
- [x] Full page opens Customer Info by default
- [x] Edit Ticket Details drawer: Subject · Description · Contacts · Attach file · Cancel/Save

## Composer

- [x] Modes Reply / Forward / Note with a mode switch in the composer header
- [x] From select · To (prefilled on reply, empty on forward) · Cc · Bcc
- [x] Signature auto-inserted; attach adds file chips
- [x] Send split-button: Send · Send and set as Pending / On Hold / Closed — updates status, thread and list chip, with toast
- [x] Note mode: internal-only (no recipients), "Add note", lock-labelled in the thread
- [ ] Rich-text formatting — toolbar rendered inert, plain-text body (see GAPS)

## Bulk actions

- [x] Row selection → bulk bar with Assign / Close / Mark as unread / Delete (+ count, select-all, clear)
- [x] Assign dialog: agent select, Assign disabled until picked
- [x] Delete: confirm explains restore-from-Trash (full sentence — UAT clipped it); soft-deletes to Trash
- [x] Trash view lists deleted tickets; bulk Restore brings them back (restore flow inferred — flagged)

## Create — `/tickets/create-new`

- [x] Breadcrumb + "New Ticket" + top-right Add new contact (routes to the CDP New Contact page)
- [x] Two-column form: Inbox* | Contacts* · Type | Channel · Status | Priority (default Low) · Agent | Tags · Subject* · Description* · Attach file
- [x] Create disabled until required fields are set (required set inferred: inbox, contact, subject, description — flagged)
- [x] Create → toast + lands on the inbox with the new ticket selected (landing inferred — flagged)
- [x] Cancel → back to the inbox

## States

- [x] Empty list / empty trash / no ticket selected / ticket not found / orders empty
- [x] Toasts on every mutation; disabled buttons gate invalid submits
- [x] Unread ↔ read transitions visible in the list
