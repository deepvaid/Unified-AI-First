# Service Tickets — improvements over UAT

Each change stays inside the allowed lanes (hierarchy, labels, feedback, a11y); no features added.

1. **Bulk actions moved to the floating bulk bar** (`MpFloatingBulkBar`) — UAT empties the
   detail pane and hides the page header while anything is selected; the sandbox keeps the
   open ticket and header visible, and the bar names the count and offers select-all/clear.
2. **Delete confirm reads in full** — "Deleted tickets move to the Trash view, where you can
   restore them later." (UAT truncates its own sentence with an ellipsis.)
3. **Status vocabulary humanized** — `on_hold` renders as "On Hold" everywhere (UAT leaks the
   raw enum into the filter drawer).
4. **Assign dialog shows selection context** — "N tickets selected" subtitle instead of a raw
   ticket id the agent doesn't recognize.
5. **Agent shown by full name** — property bar shows "Chris Parker", not the bare initials
   "C P"; unassigned reads "Unassigned".
6. **Send split-menu always legible** — system menu component; no blank-item paint glitch.
7. **Expand navigates in the same tab** with a back link on the full page (UAT spawns a new
   browser tab with no way back).
8. **Ticket rows are real controls** — each row is a button with an accessible name; the
   unread dot carries `aria-label="Unread"`; checkboxes are labelled per ticket.
9. **One label strategy on the create form** — every field uses the static top label (UAT
   mixes floating labels with placeholder-only fields that lose their label once filled).
10. **Internal notes are self-describing** — noted with a lock and "Internal note — not
    visible to the customer" (UAT renders notes like any other message).
11. **Restore is a first-class action in Trash** — selected trashed tickets offer Restore,
    making the delete → restore promise from the confirm copy actually walkable.
12. **Focus management** — drawers/dialogs are `MpFormDrawer`/`MpDialog`: focus trapped,
    Escape closes, focus returns to the trigger.
13. **Property changes leave a trail** — every inline property edit appends a system
    activity, so the Show-activities feed stays truthful to what the agent did.
