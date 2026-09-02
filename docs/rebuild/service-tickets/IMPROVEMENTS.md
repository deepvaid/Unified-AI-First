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

## Aesthetic pass (2026-09-02)

Deliberate departures from the legacy layout, made after the parity rebuild so the surface reads as
Maropost's own. Function is preserved; three list controls were added on request.

14. **The pane has a title** — number · channel · inbox eyebrow plus the subject sit above the
    property row (UAT opens straight onto `PRIORITY ● Low`).
15. **Properties read as field-chips**, on the 32px field ramp, with an icon and a sentence-case
    label; the activities switch became an `aria-pressed` toggle beside expand/kebab.
16. **The composer is docked** below the thread and replaces the Reply/Forward/Note bar while open;
    the thread scrolls to its latest message on open, send and ticket change (UAT renders the
    composer at the end of the scrolling thread). The inert formatting toolbar is gone — a single
    "Plain text" hint says what the box does.
17. **Avatars for every role** and a tinted internal-note bubble, so who-said-what scans without
    reading the meta line.
18. **Mobile layout stacks** — below the split breakpoint one pane shows at a time; `?selected`
    decides which and a back control returns to the list (UAT scrolls horizontally).
19. **List search, sort and status tabs** — search covers number, subject, customer, email and
    message bodies; sort offers last-updated / newest / oldest / priority; status is a
    quick-filter tab row with counts and therefore no longer lives in the Filters drawer.
20. **Two-line rows with quiet checkboxes** — subject + date, then customer · snippet + status;
    checkboxes appear on hover, focus, or while a selection is in progress.
