# Data Journeys — design-system gaps & out-of-scope notes

1. **Row drag-to-reorder** — UAT rows expose a drag handle ("Move Data Journey <name>"); exact
   semantics unverified (reorder vs move). No design-system pattern exists for draggable
   table rows. *Suggested spec:* a `draggable` option on the standard data-table row that
   shows a `grip-vertical` lead handle on hover, keyboard-movable via Alt+↑/↓, emitting
   `move(id, newIndex)`. Not built this slice.

2. **Enabled/Disabled status toggle component** — `MpStatusToggle` speaks Active/Paused/Draft
   and disables on Draft, which doesn't fit data journeys (a Draft can be switched on).
   Used a bare `v-switch` with a per-row aria-label instead. *Suggested spec:* generalize
   `MpStatusToggle` to accept an `on/off` value pair + optional label, or bless the labelled
   `v-switch` cell as the pattern.

3. **Free-form canvas** — the legacy builder is a Drawflow canvas (nodes anywhere,
   hand-drawn edges, wheel zoom). The sandbox reuses the structured vertical flow builder
   (`MpBuilderShell` + `JourneyFlowColumn`) shared by all 17 builders. Functional parity is
   kept (add/configure/duplicate/remove/connect steps); free spatial layout is deliberately
   not reproduced.

4. **Legacy per-node modal chrome** — the Send Campaign modal's sub-tab counts
   ("Lists 1 · Segments 0 …") aren't reproduced; the sectioned config panel shows selected
   values as chips instead. Field parity is complete.
