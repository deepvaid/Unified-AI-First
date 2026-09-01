# Service Tickets — header/action flows

Crawled 2026-09-01 on UAT account 116000. ⚠ = not executed (mutating/destructive/sending),
stopped at the last safe step.

## 1. NEW ▾ (primary split menu)

Menu: `New Ticket` · `New Contact`.

### 1a. New Ticket

1. → route `/service/116000/tickets/create-new` (full page, breadcrumb back to All Tickets).
2. Fill Inbox/Contacts/Type/Channel/Status/Priority/Agent/Tags/Subject/Description; attach files.
3. `Create` stays disabled until required fields are set (Description is `*`; the full
   required set is unverified — Create not executed ⚠).
4. `Cancel` → back to the inbox (verified path exists; landing after Create unverified ⚠).

### 1b. New Contact

→ `/accounts/116000/contact/new?ticket=true` — the CDP New Contact page (Contact Details,
List Subscription, Contact Tags; toast "Email or Phone Number is required to create a
contact"). Already audited/rebuilt in the CDP slice (`docs/rebuild/new-contact/`).
⚠ Save not executed; return-to-ticket behavior of `?ticket=true` unverified.

## 2. FILTERS

1. → right drawer with 10 filter fields (see AUDIT).
2. `Apply` enables once dirty ⚠ (applying = read-only but left unexecuted to avoid
   changing saved view state; result set unverified).
3. `Save as View` ⚠ (creates a persistent custom view — not executed).
4. `Clear Filter` resets. ✕ closes.

## 3. Views dropdown ("All Inboxes · All Tickets")

1. Grouped menu: per-inbox groups × (All / My / High Priority / custom views), Trash last.
2. Picking a view reloads the list (not executed beyond observing the menu — switching
   views is read-only but was skipped; per-view lists unverified).
3. Trash: holds deleted tickets (delete confirm copy: "You can restore from…"). Contents
   unverified.

## 4. Ticket row → detail pane

1. Click row → detail loads in right pane, URL gains `?selected=:id`, row gets accent.
2. Read thread; toggle `Show Activities` to interleave system events (verified, view-only).
3. Property bar: Priority/Type/Status/Agent inline dropdowns ⚠ (mutations, not executed).
4. Right rail: Customer Info / Tags / Customer Orders panels (verified, read-only;
   Customer Orders shows search + empty table "No data available").
5. Kebab: `Edit Ticket Details` → right drawer (Subject, Description* rich text, Contacts
   select, Attach File; Cancel/Save — Save ⚠). `Mark as unread` ⚠.
6. Expand ⧉ → `/tickets/:id` full page in a new tab (verified).

## 5. REPLY

1. `REPLY` → docked composer: mode `Reply ▾`, `From ▾`, To/Cc/Bcc, rich-text body with
   auto signature, 📎 attach, ⤢ expand, 🗎 canned response icon.
2. `Send ▾` split options: Send and set as Pending / On hold / Closed.
3. ⚠ Nothing sent. `Cancel` closes the composer (verified).

## 6. FORWARD / NOTE

Same composer shell in forward mode (To empty) / internal-note mode. Entered only via the
`Reply ▾` mode switch observation and bottom buttons; not exercised further. Per-message
↪ icon forwards that specific message ⚠ (not executed).

## 7. Bulk selection

1. Check ≥1 row → detail pane becomes bulk surface: "N ticket selected", actions
   ASSIGN / CLOSE / MARK AS UNREAD / DELETE; header row (FILTERS/NEW) hides.
2. `ASSIGN` → dialog "Assign Ticket (#id)": Select Agent; Assign disabled till pick;
   Cancel (verified). Assign ⚠.
3. `DELETE` → confirm "Delete Ticket — Are you sure … You can restore fro…" (clipped);
   Cancel (verified). Delete ⚠ (soft delete to Trash per copy).
4. `CLOSE` / `MARK AS UNREAD` ⚠ — no confirm observed before stopping; unverified.
5. Uncheck → pane returns to empty state/selected ticket.

## 8. List scrolling

Infinite scroll: bottom spinner, next page appends (verified — rows from Jun 16 loaded
after the Aug 27 block).

## Unverified inventory (for Phase 2)

- Create-ticket success path (toast? redirect to new ticket?).
- Property-bar mutations (confirm/toast behavior).
- Send/Send-and-set outcomes; failure/retry states.
- Assign/Close/Delete/Mark-unread outcomes; Trash view content & restore flow.
- Saved-view creation via `Save as View`.
- Red-dot row marker meaning.
- `?ticket=true` round-trip from New Contact back to the ticket form.
- Whether multi-select scales the bulk copy ("N tickets selected" plural).
