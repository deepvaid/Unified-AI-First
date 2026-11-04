# Service inbox — improvement tasks from the "MSC and Chatbot Revamp" call

**Sources**
- Teams recording, 3 Nov 2026 (25 min): Abhinav Marla (product), Rajesh Kumar (eng), Samriti Verma
  (design), Deepak Vaidya (design). The team walked through the sandbox Tickets page
  (`/service/:accountId/tickets`) and listed what's different from the live product.
- Teams meeting chat, 12:02–12:32: Abhinav's written action items plus three screenshots from
  Rajesh/Abhinav (UAT New Tag dialog, the sandbox's missing Trash, distorted activities).
- UAT `uat.maropost.com/service/116000/tickets`, checked 4 Nov 2026, including ticket 1549 ("Order
  linking UI" in the chat) and the views menu.
- Sandbox code: [Tickets.vue](../../../src/views/Service/Tickets.vue),
  [TicketWorkspace.vue](../../../src/components/service/TicketWorkspace.vue),
  [TicketCreate.vue](../../../src/views/Service/TicketCreate.vue),
  [TicketDetail.vue](../../../src/views/Service/TicketDetail.vue),
  [useTickets.ts](../../../src/stores/useTickets.ts).
- Mobbin: helpdesks a small store actually uses or compares against (Gorgias, Zendesk, Intercom,
  Klaviyo Helpdesk, Front, Plain, HubSpot) and tag/reorder patterns. Links are inline per task.

**Rule for every task:** don't copy UAT. Add the missing capability in the design system's own
terms (`Mp*` components, tokens, one label strategy), with keyboard and screen-reader support and a
layout that works from 360px up.

---

## Who we're designing for

**Maya, support executive at a 15-person online homeware store.** She and one colleague handle
every ticket: refunds, "where's my order", damaged items, product questions. That's 40–70 tickets
a day across two inboxes (support@ and orders@). The inbox is open **all day** on a 13" laptop.
Some evenings she clears the queue on an iPad.

- She has no admin to set things up for her. Views, tags, notes and templates have to be quick to
  make in the moment.
- Almost every ticket is about **an order**, so the order (items, total, status) has to be one
  glance away, not a trip to Commerce.
- A missed ticket is a lost customer, so she needs to see **what's waiting and for how long**.
- She switches context constantly, so the page has to **remember where she was** (view, filters,
  selected ticket, pane widths).
- She works fast with the keyboard, and every extra click adds to a customer's wait.

Abhinav made the same point in the call: *"Agents will be spending a lot of time on this page."*
So this is a workspace, not a report page.

---

## What was asked → where it stands

| # | Ask (source) | UAT today | Sandbox today | Task |
|---|---|---|---|---|
| 1 | Spam **and** Trash in the inbox selector (call 3:22, chat) | Both, pinned at the foot | Trash only, scrolls away | T1, T3 |
| 2 | Selector must scroll (call, chat) | Scrolls | Scrolls, but the system folders scroll with it | T1 |
| 3 | Inbox → views hierarchy; inbox name more prominent; groups collapsible, all collapsed except the active one, state saved per user (call 5:50–7:23) | Collapsible; inbox names are tiny caps | Flat; every view repeated under every inbox | T1 |
| 4 | Custom views + reordering with a visible drop line (call 5:50, chat) | Hover: edit · delete · drag handle; no drop indicator | No reorder, rename or delete | T2 |
| 5 | Spam is system-driven: no "Mark as spam", only "Not spam"; Trash is manual (call 5:22) | — | No Spam at all | T3 |
| 6 | **Trash** in the ticket's action menu (call 12:17, chat screenshot) | ⋮ Edit ticket details / Trash / Mark as unread | ⋮ has no Trash; bulk "Delete" only | T4 |
| 7 | Show that filters, or a custom view, are applied (call 7:40, chat) | Label only | Label only; Filters button has no badge | T5 |
| 8 | Selected tags shown next to the subject, colour-coded (call 9:44, chat) | Outlined colour chips beside the title, "+1" overflow | Tags only in the rail panel | T6 |
| 9 | UI for creating a tag (call 9:52, chat screenshot) | "+ Create new tag" → New Tag dialog: name, 8 swatches, custom hex, preview chip | Fixed tag list | T7 |
| 10 | "Show activity is distorted, pls fix" (call 11:08, chat screenshot) | Toggle switch | **Bug:** activity rows collapse and overlap | B1, T8 |
| 11 | "Reply buttons are not sticky to the bottom" (chat) | Docked | **Bug:** the composer's Send row scrolls away; other overlaps | B2 |
| 12 | Rich-text reply (call 13:01) | CKEditor | Plain text with a hint | T9 |
| 13 | Back from full-screen keeps the ticket selected (call 13:32) | — | **Bug:** back loses selection, view, filters and search | B3 |
| 14 | Move status/actions from the page header into the pane (call 14:03) | Page header | ✅ Already in the pane | (eng only) |
| 15 | Make inbox sections resizable, remember the width (call 15:38, chat) | Resizable, saved | Fixed 380px list | T11 |
| 16 | **Order linking UI** (chat → UAT 1549) | Customer orders table; picking an order expands Order Details inline | 3-column table (ID/Store/Date); no items, no linking | T13 |
| 17 | Orders dropdown on **New ticket** (chat) | — | No order field; `createTicket` sets `orders: []` | T13 |
| 18 | UI for **order items** and **sticky notes** (chat) | Items table inside Order Details; yellow internal-note card with edit + delete | Notes render as chat bubbles; no edit/delete; no items | T13, T14 |
| 19 | Can't reply until the support email is verified (seen on UAT 1549) | Red banner "Verify Now"; Reply/Forward disabled | No such state | T15 |
| 20 | Status tabs — "a good addition" (call 8:33) | Filter only | ✅ Built | — |
| 21 | Sort — "we don't have sort right now" (call 8:33) | None | ✅ Built | Q7 |
| 22 | Designs for **all UAT Service settings**, split into sections (call 17:18–22:18, chat 12:32) | Separate URL per setting | One flat page | S1 (action item) |
| 23 | Onboarding: easier "set your support email" (call 23:10) | — | — | S2 |

---

## Fix first — the three bugs reviewers hit

These are defects in what the team already reviewed. They come before any new feature.

> **Status 5 Nov 2026: all three fixed in the sandbox** (TicketWorkspace.vue, Tickets.vue,
> TicketDetail.vue, global.scss `.mp-frame-fill` dvh). Verified in the browser at 1280×768 and
> 800×720: no squashed or overlapping activity rows; Send stays on screen with Cc + Bcc +
> attachments + a 30-line reply; the narrow rail panel fills only the thread's cell; the reply bar
> clears the bulk bar; Back from the full page restores inbox, view, status tab, search, sort and
> selection, with focus on the row. B2's PLG trial-banner offset is **not** done (trial mode only).

### B1 · Activities collapse and overlap

**Root cause (in code).** `.tw-feed` is a height-limited, scrolling flex column, so its children
keep the default `flex-shrink: 1`. Chat bubbles have an automatic minimum height and don't shrink.
`MpListRow`'s compact density sets `min-height: 0` (MpListRow.vue:124), so all the shrinking
lands on the activity rows. They collapse to about 10px while their ~36px of content spills over
the next row. It only shows with activities on, and gets worse when the composer opens.

**Fix.** Add `.tw-feed > * { flex-shrink: 0; }` in TicketWorkspace.vue. Keep it local: changing the
global MpListRow rule would also touch three other compact rows. Then restyle activities (T8).

### B2 · Reply / Send not anchored to the bottom

Causes, most likely first:
1. **The Send row scrolls away inside the composer.** `.tw-foot` is capped at `max-height: 60%`
   and `.tw-composer` scrolls, with Send/Cancel as its last child. A long reply, or Cc + Bcc +
   attachments, pushes Send out of view on a 768px-tall laptop. **Fix:** composer =
   header row + **scrolling body (fields + textarea + attachments)** + **fixed action row**; only
   the middle scrolls.
2. **Below 960px the rail panel covers the Reply bar.** It's absolute over the whole `.tw-body`,
   and the full page opens with Customer info by default. **Fix:** under 960 the panel overlays the
   thread only (stop above `.tw-foot`), or opens as a sheet. Don't default-open it on narrow
   screens.
3. **The floating bulk bar sits over the reply bar** while tickets are checked. **Fix:** reserve
   bottom space in the detail pane while `checked.length > 0`, or dock the bulk bar to the list
   panel.
4. **`100vh` frames run past the viewport on mobile and in trial mode** (the PLG banner).
   **Fix:** use `100dvh` and subtract the banner height in `.mp-frame-fill`. This is a shell-level
   fix, so check other frame-fill pages too.

### B3 · Full-page round-trip loses your place

`TicketDetail.vue` back-links to `{ name: 'Tickets' }` with no query. Inbox, view, filters, search
and sort are local refs in `Tickets.vue`, so coming back from the expanded ticket resets to *All
inboxes · All Tickets* with nothing selected. The full page's eyebrow also hard-codes "All
Tickets".

**Fix.** Keep the list context in the URL (`?inbox=&view=&status=&q=&sort=&selected=`), copying
the `LandingPages.vue:50-69` pattern (read `route.query`, write back with `router.replace`, drop
empty values). Expand carries the query along and Back returns it exactly. On return, the selected
row scrolls into view **and gets focus**, and the eyebrow uses the real `<Inbox> · <View>`.
Bonus: views become shareable links.

---

## Tasks

Priority: **P0** = asked for and blocks parity · **P1** = asked for, polish ·
**P2** = from the persona, not asked for. Pitch P2s as proposals, not commitments.

### T1 · Inbox & view selector — restructure (P0)

**Problem.** The sandbox repeats All / My / High-priority + every saved view under every inbox, so
the panel grows by inbox count times view count. Inbox names read as section labels. Spam is
missing, and Trash scrolls out of reach.

**Design.**
- Three zones in the popover. **Header:** "Find a view" search, once there are more than 8 views.
  **Scrolling body:** one group per inbox, *All inboxes* first. **Pinned footer:** Spam and Trash,
  with counts.
- **Inbox group header = a disclosure button:** inbox icon, inbox name in body-2 semibold (not
  caps), open count, chevron. Collapsed by default except the group holding the active view.
  The expanded set is remembered per user (`mp.tickets.viewsExpanded.v1`).
- Under each inbox: built-in views, then that inbox's custom views (Q1). Each view shows its
  count, like Zendesk and Intercom, so Maya sees where the work is without opening every view. The
  active view gets `aria-current="true"` and the selected tint.
- Footer link **Manage views** (Zendesk pattern) opens T2's management mode.

**Accessibility.** The panel is a non-modal dialog (`aria-haspopup="dialog"`), not a `role="menu"`
holding headings. Group headers are `<button aria-expanded aria-controls>`. Focus starts on the
active view, and Escape returns it to the trigger. The search filters with a polite live-region
count.

**Responsive.** Below 960 it becomes a full-width bottom sheet with the same zones, and the footer
stays pinned. There's no general sheet yet: `PosSheet.vue` has the focus trap and drag-to-close,
but would need lifting out of POS.

**Mobbin:** [Gorgias — Shared / Private views + Closed · Trash · Spam pinned](https://mobbin.com/screens/0f53e156-d4c7-4d1c-92ca-3a1d9b8ecf80) ·
[Zendesk — view counts, system views at the foot, Manage views](https://mobbin.com/screens/fb5d552a-428f-4e01-9780-6bb436b9f5cf) ·
[Intercom — collapsible groups with counts](https://mobbin.com/screens/f7a70d0e-bb91-4027-a451-d086766ed416) ·
[Front — show/hide inboxes in the sidebar](https://mobbin.com/screens/e13eb66b-1190-4f79-a548-778337a22c28)

### T2 · Custom views — reorder, rename, delete (P0)

- On hover or focus, a custom view row shows a **drag handle** and a **⋯ menu** (Rename, Edit
  filters, Move up, Move down, Delete). UAT shows pencil + bin + handle on hover. We fold the
  actions into ⋯ so the row stays calm, with the handle visible alongside.
- While dragging: a **2px accent drop line** between rows (the thing Abhinav found missing). The
  dragged row lifts (`shadow.md`). Rows only drop within their own inbox group.
- Delete → `MpConfirmDialog danger`: "Delete 'VIP refunds'? Tickets aren't affected." If it was the
  active view, fall back to that inbox's All Tickets.
- Rename inline (Enter saves, Escape cancels) with a duplicate-name check.
- **Accessibility:** drag is never the only way. Move up / Move down in ⋯, plus Alt+↑/↓ on a focused
  row. Every move is announced: "VIP refunds moved to position 2 of 5."
- **Reuse:** `StoreLineupCard.vue` / `StoreLineupRow.vue` already do native DnD + Move up/down with
  focus return. Add the drop line and the live announcement to that pattern.

**Mobbin:** [Zendesk — drop line while arranging](https://mobbin.com/screens/b283f8ce-10b6-44bb-909c-49f6ac8aea71) ·
[Juicebox — handles on an editable list](https://mobbin.com/screens/01028d24-0e2e-4ae8-81b3-c5f8c09117a0)

### T3 · Spam folder, system-driven (P0)

**Rule from the call:** the system decides what's spam. Agents **cannot mark spam**; they can only
rescue a ticket with **Not spam**. Gorgias and Intercom both offer "Mark as spam", but we
deliberately don't.

- Spam view: an `MpAlert tone="info"` at the top of the list saying the filter put these here, they
  get no SLA or auto-acknowledgement, and *Not spam* moves a ticket back to its inbox.
- Per ticket (pane header) and in bulk: **Not spam** as the primary action, plus Move to trash.
  The toast offers **Undo** (`useToast` already supports `action`, see `EmailContent.vue:164`).
- Spam tickets open read-only (no Reply / Forward / Note until rescued), so nobody replies to a
  phishing mail by accident (Q2). Spam rows get a muted "Spam" marker, not a workflow status chip.
- Store: `Ticket.folder: 'inbox' | 'spam' | 'trash'` replaces `trashed`. Seed spam with
  lottery / "SECURITY ALERT" phishing like UAT's. Check whether `useWidgetData` dashboard counts
  should leave out spam and trash (today they count trashed tickets).

**Mobbin:** [HubSpot — "1 item was marked as spam · Undo"](https://mobbin.com/screens/23cb5a89-93da-4e5e-85cd-86574d8fc913) (the toast pattern, applied to *Not spam*)

### T4 · Trash from the ticket, honest vocabulary (P0)

- Add **Move to trash** to the pane's ⋯ menu as a danger item, last, behind a divider (the red box
  in Rajesh's screenshot).
- Rename bulk **Delete → Move to trash**. It's recoverable, so "delete" scares people for no
  reason. One ticket: no confirm, toast with Undo. Bulk: confirm with the count.
- After trashing the open ticket, **select the next ticket**, not a blank pane.
- Trash view: Restore per ticket and in bulk. Permanent delete waits on retention (Q3).

### T5 · Show applied filters and views (P1)

Chat: *"When filters are selected, there should be an indication… Same for custom ticket view
selection."*

- **Filters button badge** with the active count, plus a **summary row of removable chips** under
  the search ("Priority: High", "Tag: VIP"), then **Clear all**. Reuse `MpDataTableToolbar`'s exact
  pattern (`activeFilters: {key,label}[]`, badge, ≤3 chips + "+N more", Clear) and
  `useTableFilters.ts`. Don't invent a second filter-chip style.
- **Custom view on:** the trigger reads `<Inbox> · <View>` with a "view" icon. The summary row
  shows the view's criteria as chips, so a view never hides what it filters.
- **Edited on top of a view:** trigger shows "VIP refunds · edited"; chips row offers **Save
  changes** / **Save as new view** / **Reset**.
- **Accessibility:** chip remove buttons read "Remove filter Priority: High". Result count changes
  are announced politely ("12 tickets").

### T6 · Colour-coded tags beside the subject (P0)

- **List row:** up to 2 tag chips after the subject, then "+N" with a tooltip listing the rest.
  The subject truncates first; tags never do.
- **Pane title band:** all tags after the subject, wrapping onto a second line if needed (UAT:
  `har_qa` `Cricket` `+1` in the breadcrumb).
- **Colour is a hint, not the meaning.** The tag name is always printed. Style = soft fill + ink
  text (the `DashboardActivityWidget.vue:8-20` recipe), not UAT's outline-only chip, which reads
  weakly at 20px.
- Tag type becomes `{ name, color }`. It touches `TICKET_TAGS` users in TicketWorkspace, TicketCreate,
  Tickets (filter + drawer) and the seed / customViews.

**Mobbin:** [Gorgias — colour-dot tag chip beside the subject + "Add tags"](https://mobbin.com/screens/c1f7e04a-6957-4c63-9b6d-201c98feaa65)

### T7 · Create a tag in the moment (P0)

UAT's New Tag dialog has: description "Create tags so that you can mark tickets.", Tag name, 8
swatches, **Use custom colour** (hex input + swatch), and a preview chip. Keep the capability and fix
what it gets wrong:

- **Entry point:** the tag picker in the rail is a combobox. Type to filter; when nothing matches,
  the last option is **Create "late delivery"**, which opens the dialog prefilled.
- **Dialog (`MpDialog sm`):** Name · Colour as a labelled `role="radiogroup"` of 8 token swatches
  ("Teal", "Amber"…; reuse `CommerceTask.vue:47-64`) · **Custom colour** disclosure (hex field +
  `v-color-picker mode="hex"`, as in `LandingPageStylePanel.vue`) · **live preview** chip.
  Duplicate names get an inline error.
- **Custom colours stay accessible.** The agent picks *one* colour; we derive the chip pair from it
  (soft background + darkened ink, as `color-mix` does for cloud chips). If the result still can't
  reach 4.5:1 in light **and** dark, show an inline warning and nudge the ink darker. UAT's preview
  is a single light-theme outline chip; ours previews the real list chip in both themes.
- Add the 8 swatches as `color.{light,dark}.tag.*` pairs in `tokens.json` + `$contrastPairs` so
  `npm run contrast:check` enforces them.
- **Stable list.** UAT's tag list reflows when "Loading…" resolves, so a click aimed at one row
  lands on another. It tagged ticket 1546 by mistake during this review. Reserve the list height
  with skeleton rows so options never move under the pointer.

**Mobbin:** [Dub — colours offered as named, readable chips](https://mobbin.com/screens/e3b97003-a830-40c5-89cf-5740dc1e40e0) ·
[Buffer — strong + soft swatch rows](https://mobbin.com/screens/49376134-c3d5-4547-93f3-22a49143fc93) ·
[Optimal Workshop — swatches + hex in one dialog](https://mobbin.com/screens/c2290f3f-3be8-484c-a599-a547393ac7f3)

### T8 · Activities — a quiet timeline (P1, after B1)

- One line per event: icon · **"Status Open → Pending"** · actor · time (right-aligned).
  `text-caption`, muted, no box. They sit between messages without competing with them, the way
  Gorgias and Plain do it.
- Runs of 3+ consecutive events collapse to "4 updates · Show" (the reviewers' screenshot had four
  in a row).
- "Show activities" stays a **visible labelled switch**, not an icon-only toggle, remembered per user.
- Every property change logs from → to, not just the new value.

**Mobbin:** [Gorgias — Reopened by / Closed by / Merged by one-liners](https://mobbin.com/screens/3dc49cfa-55d8-4bc7-9d95-b19b93451711) ·
[Plain — quiet status event inside the thread](https://mobbin.com/screens/4d106469-9fb6-4e8e-929b-07eee8b4b27d)

### T9 · Rich-text reply composer (P0 for the new UI)

- **One-row toolbar** (`role="toolbar"`, roving tabindex, `aria-pressed`): Bold, Italic, Underline
  · Lists · Link · Quote · **Insert template** · Attach. On narrow widths, overflow into ⋯.
- **Insert template:** searchable list of the inbox's reply templates; variables
  (`{{customer.first_name}}`, `{{order.number}}`) fill from the ticket and its linked order (T13).
  Footer: "Manage templates", which answers Abhinav's "what if I just want to change one reply
  template".
- **Send split stays** (Send · Send and set as Pending / On hold / Closed). Gorgias's "Send & Close"
  is the same idea. Show shortcut hints: ⌘↵ send, ⌘B/I/K.
- **Prototype:** no editor library is installed. `StoreContentEditor.vue` (contenteditable +
  `execCommand` toolbar, `@mousedown.prevent` to keep selection) is a dependency-free starting point
  for an `MpRichTextArea` (GAPS §1). Adding tiptap or CKEditor is a decision (Q8).

**Mobbin:** [Gorgias — suggested macros + toolbar + Send & Close](https://mobbin.com/screens/a5c055db-6969-4bba-8297-3cf198d63788) ·
[Klaviyo Helpdesk — formatting toolbar in the composer header](https://mobbin.com/screens/ccdbfba0-03ae-4d3d-8fa6-775af9df52bd)

### T10 · (merged into B3)

### T11 · Resizable list/detail split, remembered (P0)

- Separator between list and detail: `role="separator" aria-orientation="vertical"`, focusable,
  `aria-valuenow/min/max` in px. ←/→ move 16px, Home/End jump to min/max, double-click resets to
  `layout.inboxListWidth` (380).
- Limits: list min 320, max 50% of the split; detail always keeps room for the thread plus the rail.
- Saved per user (`mp.tickets.listWidth.v1`). Below 960 there's no separator (stacked stays).
- **Nothing in the repo resizes by drag today**, so build `MpSplitPane` (GAPS §3) with pointer
  events + keyboard. New tokens: `layout.inboxListMinWidth`, `layout.splitHandleWidth`.
  The store editor and other master/detail pages can reuse it.

### T12 · Responsive & touch gaps (P1)

Found while reviewing the sandbox:
- **Row checkboxes are invisible on touch.** They only appear on hover or focus. Under
  `@media (hover: none)`, always show them at a 44px target.
- Property bar: on narrow panes, wrap to two even rows, or a single "Properties" sheet under 600px.
- Composer under 960: full-height sheet over the thread, Send pinned above the keyboard (see B2).
- Bulk bar: full-width; actions collapse into ⋯ under 600px.
- Check at 360 / 768 / 1024 / 1440, light and dark.

### T13 · Orders — link, see items, act (P0)

Chat: *"Order linking UI"* (→ UAT 1549), *"new ticket doesn't have orders dropdown"*, *"couldn't
confirm orders / order items… UI"*. UAT's Customer orders panel lists the customer's orders
(Order ID · Store · Order date). Picking one highlights it and expands **Order details** inline:
items (SKU) · qty · price, total, status. It works, but it's a raw table in a 300px panel and
doesn't say which order the ticket is *about*.

**Design.**
- **Linked order, top of the rail:** an order card showing number (link to Commerce order
  detail), date, total, fulfilment + payment status (`MpStatusChip`), then **line items** as
  `MpListRow`s (name · SKU · qty × price), then shipping/tracking if present. Actions under ⋯:
  Open in Commerce · Change linked order · Unlink.
- **Other orders by this customer:** compact `MpListRow` list below (number · date · total ·
  status), each with **Link to ticket**. Search stays for long histories.
- **Header cue:** the pane title band shows `Order #10241` as a link chip beside the tags, so the
  thread and the order are tied together at a glance.
- **New ticket:** an **Order** field (autocomplete over the chosen contact's orders, disabled with
  hint "Choose a contact first" until one is picked). Editable later in *Edit ticket details*.
- **Composer:** linked order fields feed template variables (T9).
- **Empty states:** "No orders for this customer" (`MpEmptyState` compact), and "No order linked
  yet — link one so replies can reference it".

**Data.** `useCommerce.ts` already has `Order` with `lineItems` (product, SKU, qty, price, status),
statuses, tracking, `timeline`, `notes`. But ticket customers (Rajan Bhanot, Lorem Anderson…)
don't exist in commerce, and ticket order IDs (`ORD-…`) don't match `#100xx`. Reseed ticket
customers/emails to real commerce customers and store `linkedOrderId` on the ticket, rather than
duplicating order data in `useTickets`.

**Mobbin:** [Fiverr — order card in the conversation sidebar](https://mobbin.com/screens/80dd72be-5298-4633-9051-08e096d40817) ·
[Etsy — inline "Order confirmed · View order details" event](https://mobbin.com/screens/fb394f2b-475a-43ae-939f-aaacb4ff7349) ·
[Klaviyo Helpdesk — "2 orders" in the ticket overview](https://mobbin.com/screens/ccdbfba0-03ae-4d3d-8fa6-775af9df52bd)

### T14 · Sticky (internal) notes (P0)

UAT 1549 shows what Abhinav means. An internal note is a yellow card headed "Rahul Rawat added an
internal note – Nov 03, 2026, 4:21 AM", with **edit** and **delete** icons. The sandbox renders
notes as chat bubbles with a lock footer and no way to edit or delete.

**Design.**
- Note card: warm tint (`--warn-soft` / `--warn-ink`, already the note skin), header *"Deepak added
  a note · 2:14 PM"*, a **"Only visible to your team"** line with the lock (Plain/Front wording),
  ⋯ menu **Edit · Pin to top · Delete**. Icons don't float loose in the header.
- Edit is inline in the card (Save / Cancel; "edited" marker after). Delete → `MpConfirmDialog
  danger` since notes carry handover context. Delete is only for the author or an admin (Q9).
- **Pin to top (proposal):** a pinned note shows as a slim sticky strip under the property row on
  every visit, e.g. "Customer prefers phone · refund approved by Sam". That's the literal "sticky
  note", useful when two agents share a ticket. Confirm it matches the product intent (Q9).
- The composer's Note mode keeps its own tinted surface so the agent can never mistake a note for
  a reply (Intercom pattern).

**Mobbin:** [Plain — "You left a note · Not visible to jdoe"](https://mobbin.com/screens/e1cfb6cf-0dd0-4576-b19d-484ad8f8f483) ·
[Hootsuite — note with inline edit / delete](https://mobbin.com/screens/18d44bda-0e28-43e3-9355-82e45ce3cb7f) ·
[Intercom — yellow note composer](https://mobbin.com/screens/59651e9f-01c8-49aa-9a17-c51d58678785) ·
[Front — "Pinned by you" in the thread](https://mobbin.com/screens/e13eb66b-1190-4f79-a548-778337a22c28)

### T15 · "Can't reply yet" state (P1)

UAT 1549: *"You can not reply to this query/ticket because your support email id is not setup or
verified. Verify Now"*, with Reply/Forward greyed out and no reason on the buttons.

- Footer shows an `MpAlert tone="warning"` (it's a setup gap, not an error the agent caused):
  **"Replies are off for this inbox — verify support@yourstore.com to send email."**, action
  **Verify email** (→ the inbox's settings, S1). Note stays available.
- Reply/Forward are disabled *with* the reason via `aria-describedby` pointing at the alert, so a
  screen reader hears why.
- Same component later for other blocked-send reasons (inbox disconnected, customer unsubscribed).

### T16 · Persona proposals — not asked for, worth a conversation (P2)

1. **Keyboard triage.** J/K or ↑/↓ through the list (roving focus, Enter opens), R reply, N note,
   X select, `?` shortcut sheet. Single-key shortcuts can be switched off (WCAG 2.1.4). Plain and
   Gorgias show the key on the button.
2. **Auto-advance.** After "Send and set as Closed", open the next ticket in the view (preference).
3. **Waiting-time cue.** "Waiting 3h" on rows with no agent reply yet, going warning or error as the
   inbox's SLA nears or passes. It uses the per-inbox SLA settings from S1.
4. **Order context in the list.** A small "#10241 · Delivered" line on rows with a linked order, so
   triage doesn't need a click.

---

## Reuse map (for whoever builds it)

| Need | Reuse | Where |
|---|---|---|
| Filter badge + chips | `MpDataTableToolbar` `activeFilters` pattern, `useTableFilters` | MpDataTableToolbar.vue:16, 198-215, 296-330 |
| URL-synced list state | `route.query` read + `router.replace` write | LandingPages.vue:50-69 |
| Reorder + keyboard Move up/down | native DnD + kebab moves, focus return | StoreLineupCard.vue:65-184, StoreLineupRow.vue |
| Swatch radio group | `role="radiogroup"` swatches | TrialLab/tasks/CommerceTask.vue:47-64 |
| Hex picker | `v-color-picker mode="hex"` in a `v-menu` | LandingPageStylePanel.vue:34-75 |
| Soft tag chip colours | `color-mix` soft fill + `-text` ink | DashboardActivityWidget.vue:8-20 |
| Undo toast | `toast.success(msg, { action: { label: 'Undo', onClick } })` | EmailContent.vue:164-167 |
| Orders + line items | `Order`, `OrderLineItem`, `getOrderById` | useCommerce.ts:374-461, 1732+ |
| Rich-text starting point | contenteditable + `execCommand` toolbar | StoreContentEditor.vue:80-238 |
| Mobile sheet | `PosSheet` (focus trap, drag-to-close), needs generalising | components/pos/PosSheet.vue |
| Preferences | direct `localStorage`, key style `mp.<domain>.<thing>.v<N>` | useDashboards.ts:49 |

Nothing exists yet for: resizable panes (T11), a drop-line indicator (T2), a rich-text component
(T9).

---

## Not the inbox page — separate tracks

- **S1 · Service settings, all of them, in sections** (action item from Abhinav, chat 12:32). Crawl
  every Service setting in UAT first, then design. Multiple inboxes; several support emails per
  inbox or sales channel; per-inbox SLA, acknowledgement, reply templates; a secondary Service nav
  (the Account details tabs + left rail pattern). Inbox creation is multi-page with 2 steps, so it
  needs its own flow, not a tab. Reply templates stay reachable from the composer (T9); email
  verification is the target of T15's action.
- **S2 · Onboarding.** Easier "set your support email" in Get Started (links to S1, T15).
- **S3 · Chatbot module.** A separate call is to be scheduled.
- **Process.** Design **both** old-UI and new-UI versions for features in Samriti's tickets. Eng
  builds old UI first (Q4, by December); new-UI rework follows the design-system release (Q4, worst
  case early Q1). Deepak is arranging a usability session with a real support user.

## Open questions for Abhinav / Rajesh

1. **View scope.** Are custom views per inbox, or global? UAT lists every custom view under *All
   inboxes*.
2. **Spam.** Read-only until rescued? Does *Not spam* return the ticket as New, and train the filter?
3. **Retention.** Do Spam and Trash auto-purge, and when? Is there a manual "Delete permanently"?
4. **Preferences.** Are collapse state and pane width saved per user server-side, or per device?
5. **Tags.** Keep free custom colours (UAT has them) with our contrast guard, or palette only? Who
   can create tags?
6. **Activities.** Exactly which events are logged (status, priority, type, agent, tags, order
   linked)?
7. **Sort.** No sort in prod today. Keep it in the new UI (it's built) or drop it?
8. **Editor.** Which editor ships in the new UI (CKEditor 5 as today?), so the prototype mirrors it?
9. **Sticky notes.** Is "sticky" just an editable/deletable internal note (as on UAT 1549), or
   pinned to the top? Who may edit or delete someone else's note?
10. **Orders.** One linked order per ticket, or several? Can the agent unlink? Should linking add an
    activity?

## Suggested order

B1 → B2 → B3 (bugs the team already hit) → T1 + T3 + T4 (folders & selector, one store change) →
T13 + T14 (orders and notes the chat asked for) → T6 + T7 (tags, one token change) → T2 → T11 → T5 →
T8 → T15 → T12 → T9 (after Q8) → T16 (after review).
