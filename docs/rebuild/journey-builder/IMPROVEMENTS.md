# Journey Builder — IMPROVEMENTS

Each change over the production page, one line of rationale. Copy changes are marked **(copy)** for review.

1. **Stable layout across the zoom threshold** — production re-positions every node when the card face flips at ~75 %; here only the face changes, so the graph never jumps (decision 1).
2. **Dirty state + conditional exit guard** — production has no dirty indicator and confirms every Exit; the shell chip shows Unsaved/Saved and the "Exit journey?" dialog appears only with unsaved work (same wording).
3. **Issues pill before Save** — validation errors are listed and jump-to-step *before* anyone clicks Save, instead of only as a snackbar after.
4. **Save failure names the step** — the "Cannot save journey" toast carries the first concrete message and flashes/selects the offending step; production only outlines it.
5. **Empty canvas guidance** — after Clear canvas an `MpEmptyState` explains how to start; production leaves a blank grid.
6. **Palette items describe themselves** — each item shows a one-line subtitle and a category tile; production shows a coloured label only (white-on-cyan failed contrast).
7. **Palette search** — filters the 18 steps across sections (production has none).
8. **Palette drawer on narrow screens** — replaces the "Drag & Drop" movable panel with the shell's collapsible palette (decision 7); toolbar actions collapse to icons under 1024px.
9. **Keyboard-operable node actions** — Configure / Duplicate / Flip / Delete live in an `MpRowActionsMenu` (`role="menu"`) instead of hover-only badges and unlabelled `<i>` icons.
10. **Filter deletion confirms** — deleting a split removes whole branches, so it asks first; production deletes immediately.
11. **Fit to view** — one click frames the whole journey (production has only ± and a % input).
12. **Zoom input with a range** — same digits-only field, plus disabled ± at the 20 %/400 % ends.
13. **Details panel opens on click** — single click configures a step (production needs a double-click nobody is told about); ↑/↓, Delete and Escape work on the canvas.
14. **Panel intro + live stats first** — the production intro paragraph and "N contacts entered…" line sit at the top; stats copy is pluralised ("1 contact", "3,890 contacts").
15. **Tabs flattened to sections** — Send Email / Send Test Email, Message / Compliance, General / Brand DNM and Product / Order status become `MpFormSection` groups: every field visible, one scroll, consistent with the data-journey Send Campaign step.
16. **Hints under fields** — production's helper sentences (click tracking, DNM consequence, compliance notes) render as field hints, not floating paragraphs.
17. **API URLs as a copyable list** — the five POST examples are a code list filled with the real account/journey ids.
18. **Send Test validates** — asks for an address or a list before "sending"; production's outcome was unverifiable.
19. **Percent Split labels follow the field** — "Split Percentage 30" shows 30 % / 70 % on the branches immediately.
20. **Detached-steps tray** — Detach keeps the step visible and restorable-by-purge instead of an unverified silent action.
21. **(copy)** "DELETE ALL" → **Clear canvas**; dialog "Confirm Delete" → **Clear the canvas?** (same body sentence).
22. **(copy)** "EXIT" → **Exit to Journeys** (back button); "Ok" → **Exit journey**.
23. **(copy)** "% Split filter" → **Percent Split filter**; "Move to DNM action" → **Add to Do Not Mail action**; "Workflow End" → **End**.
24. **(copy)** Drawer "Save" → **Apply** (it never persists; the toolbar Save does).
25. **(copy)** "Contact Tags" label on Change Contact Field → **Contact field** (production label looked like a defect).
26. **(copy)** Sentence-case button labels; "0 contact(s)" → pluralised.
27. **Semantics** — palette is an `aside` with a real `h2`; the details panel is an `aside` "Node details" with an `h2`; zoom cluster is a labelled group; every icon button has a name; alerts use `MpAlert`.
28. **Tokens everywhere** — spacing, radii, font sizes and shadows come from `--mp-*` tokens (the file had a handful of raw px literals).

## Visual polish pass (2026-09-02, references: Klaviyo, Customer.io, HoneyBook, Plain, Zapier via Mobbin)

29. **Quiet node cards** — 300px white surface, hairline border, `shadow-sm` at rest / `shadow-md` on hover; the 4px category spine is gone and the colour lives on a 32px tinted icon tile (how every reference builder draws steps). Selected = soft primary ring. Contacts footer sits on a `surface-secondary` band.
30. **Type on the card** — 14px title, 12px muted subtitle, neutral 10px eyebrow; category no longer shouts from the eyebrow.
31. **Thinner rails** — 2px connectors and branch elbows, tonal Yes/No pills instead of outlined chips, neutral "End of journey" pill.
32. **Palette as a grey well with white step rows** — 260px (`layout.sectionRailWidth`), rows are bordered cards that lift on hover; section headers are quieter (6px dot, smaller radius). Reduced-motion users get no lift.
33. **Canvas dot grid** — 24px dot grid, on-surface at 18% (Klaviyo / Deel / Twenty); dots survive display scaling where 1px hairlines vanished, and the grid scrolls with the content.
34. **Compact tiles use the paired ink** — `categoryOnColor` instead of a hard-coded surface colour (P5.5 pairing rule).
35. **Narrow screens open on the canvas** — the palette starts closed under 1024px instead of covering the graph with its scrim.
