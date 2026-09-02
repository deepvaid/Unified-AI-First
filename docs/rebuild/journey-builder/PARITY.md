# Journey Builder — PARITY

Checked against [AUDIT.md](AUDIT.md) and [FLOWS.md](FLOWS.md). Rebuild:
[`JourneyBuilder.vue`](../../../src/views/Marketing/JourneyBuilder.vue) (route
`/accounts/:accountId/journeys/:id/journey-builder`, old `/builder` redirects) on
[`JourneyFlowColumn.vue`](../../../src/components/marketing/JourneyFlowColumn.vue) with the catalog
in [`journeyFlowData.ts`](../../../src/stores/journeyFlowData.ts).

Legend: ✅ parity · ✅≈ parity with a documented design-system translation · ⚠️ deviation (reason)

## Layout and chrome

| Audited | Rebuild |
|---|---|
| App shell stays around the builder | ✅ `MpBuilderShell` inside the app frame (`builderShell` route meta) |
| Journey name label top-centre, read-only | ✅≈ Name in the shell title; inline rename kept (sandbox improvement) |
| Palette card "Build your journey", Drag & Drop switch, 5 collapsible sections, Triggers open | ✅ heading + 5 sections in production order, Triggers open · ⚠️ Drag & Drop switch replaced by the collapsible-palette toggle (decision 7; the switch only made the panel movable) |
| 18 palette items in production order (9/5/2/1/1) | ✅ `nodeCatalog` — every label, in order |
| Palette item double-click adds at viewport centre; drag to position | ✅≈ click inserts after the selected step / at the end of the main path (tree layout has no free position) |
| Top-right: Zoom In · % input · Zoom Out · Search toggle | ✅ zoom cluster bottom-right with the same controls plus Fit-to-view; % input digits-only, Enter/blur applies, 20–400 %, ±10 % |
| Contact search field "Email, Phone No. or Contact ID" | ✅ toolbar toggle + field, Enter highlights the step, toggle-off clears |
| Mini-map | ⚠️ not built — no design-system component (GAPS §1) |
| Fixed bottom-right: SAVE AS DRAFT · SAVE · DELETE ALL · EXIT | ✅ toolbar: Clear canvas · Save as draft · Save; Exit = shell back button "Exit to Journeys" (copy approved) |
| Grid background | ✅ dot grid |

## Nodes

| Audited | Rebuild |
|---|---|
| Collapsed face below ~75 %: 54px swatch tile + label | ✅ `face="compact"` below 75 %: 64px tile + title |
| Expanded card ≥ 75 %: tinted header, icon swatch, title, trash + menu, body rows | ✅≈ 320px card: spine + tile + eyebrow + title + subtitle + contacts; actions in `MpRowActionsMenu` |
| Positions re-laid-out between modes | ⚠️ deliberately stable (decision 1) |
| Hover delete / duplicate badges; menu Edit · Duplicate · (Flip Yes/No) | ✅ menu: Configure · Duplicate · Flip Yes/No (Yes/No only) · Delete |
| Inline rename by clicking the label/title | ✅≈ "Step name" field in the details panel |
| Double-click opens details; single click selects | ✅≈ single click opens the panel (selection = open); keyboard ↑/↓ walks steps |
| Placeholders "Yes"/"No", "50%"/"50%" on new filters | ✅ empty-branch "Add step" targets with branch chips Yes / No / 30% / 70% |
| Edges with arrow, branch text labels | ✅ connectors + branch chips |
| Connection rules (trigger never a target, …) | ✅≈ enforced structurally by the tree (a trigger is always the root) |
| node-invalid on Save failure, node-highlighted on search | ✅ flash + selection on both; issues pill lists every error |
| Delete restores branch placeholder; filter delete removes subtree (confirmed) | ✅ |
| Duplicate | ✅ (not for triggers/filters — same as production's tree-safe subset) |

## Node details panel (drawer)

| Audited | Rebuild |
|---|---|
| Right drawer "Node details", 800px, close X | ✅≈ in-canvas 380px panel (`component.builder.panelWidth`), h2 title, close |
| Intro paragraph per node type | ✅ `description` on every catalog item (verbatim; three truncated sentences completed — flagged in GAPS §5) |
| "N contact(s) entered through this trigger" / "… waiting in this delay" + View Contacts + Refresh | ✅ pluralised copy; View contacts → All Contacts; refresh re-rolls the mock count |
| Footer Save · Detach · Remove (API Event no Save; End Remove only) | ✅≈ Apply · Detach · Remove; Apply always present because the panel also owns the step name; Detach only for action/delay; Remove disabled on the trigger (tree needs a root) |
| Every form — 18 types, labels verbatim | ✅ see table below |
| Tabs (Send Email / Send Test Email, Message / Compliance, General / Brand, Product / Product categories) | ✅≈ flattened into `MpFormSection` groups |
| Send Test button | ✅ mock toast (validates emails or lists) |
| View Journey Campaign Report link | ✅ → Journey Reports |
| Field hints | ✅ `hint` on the field |

| Node | Fields in rebuild |
|---|---|
| New Subscription | Select List * |
| Product Purchased | Select Products *, Trigger for all products · Order status, Enter Order Status (⚠️ "Product categories" tab content unverified, GAPS §4) |
| API Event | five POST URLs with the account/journey ids |
| Segment Event | Segments *, Days * (Everyday…), Hours * (00–23) |
| Abandoned Cart | Select Store * |
| Total Revenue | Total Revenue |
| Form Event | Select SignUp * |
| Subscription Changed | Select List * |
| Contact Field Updated | Contact Fields * |
| Send Email | Name *, Subject *, Preheader, From Name *, From Email *, Reply To *, Content *, Preview Link, Address *, Brand, Campaign Tags, Secure Suppression List, Language *, View Journey Campaign Report · Send test email: Subject, Enter Emails, Select List(s), Send Test |
| Send SMS | Name *, From Number *, SMS/MMS, Message *, Enable click tracking, Mobile keywords, Contact tags · Quiet Hours: Recipient Timezone, Pause/Send Anyway · Compliance: Organization Name, Company Information Link, Opt-Out Text |
| Add to Do Not Mail | Add contacts to General Do Not Mail list · Select Brand, Add all brands to DNM |
| Change Contact Field | Contact field, New field value (label "Contact Tags" in production looked like a defect — flagged) |
| Change Table Field | Table Field, New Field Value |
| Yes/No | Segment * |
| Percent Split | Split Percentage (10–50, drives both branch labels) |
| Delay | Months, Days, Hours, Minutes |
| End | — |

## Actions and states

| Flow | Rebuild |
|---|---|
| A. Save — validate, mark invalid, "Cannot save journey" + message, fallback "Journey is incomplete." | ✅ error toast with title; first invalid step flashed; issues menu opens · success "Journey saved" (Draft → Active) |
| B. Save as draft — no validation, status draft | ✅ "Draft saved", status Draft |
| C. Delete all — "Confirm Delete" dialog, clears nodes | ✅ "Clear the canvas?" / "All steps will be removed immediately. Do you wish to continue?" (`MpConfirmDialog danger`) → empty state "Start with a trigger" |
| D. Exit — confirm always, → journeys list | ✅≈ confirm only when dirty (same copy), → Journeys |
| E. Zoom 20–400, ±10, % input | ✅ |
| F. Contact search highlight | ✅ mock deterministic pick + toast |
| G. Drag & Drop switch (movable palette) | ⚠️ replaced (decision 7) |
| H. Add from palette / filters spawn placeholders | ✅ |
| I. Connect | ✅≈ structural |
| J. Drawer, tabs, Save/Detach/Remove | ✅≈ see above |
| K. Delete node | ✅ (filters confirm — improvement) |
| L. Duplicate | ✅ |
| M. Rename | ✅≈ panel field |
| N. Flip Yes/No | ✅ |
| Loading / empty / error / success | ✅ not-found empty state, empty canvas state, toasts, dirty chip, leave guard |

## Verification (2026-09-02)

- `npm run type-check` clean; `npm run build` green.
- axe-core 4.12.1 (WCAG 2.0/2.1 A + AA) scoped to `main` with the Send Email panel open: **0 violations**.
- Walked in the browser: apply step · clear canvas → empty state → palette re-seeds trigger · Save with errors → titled toast + issues menu · Save as draft → Draft chip · contact search → flash + toast · Yes/No → chips + Flip menu item + swap toast · End insertable from the edge menu · Percent Split 30 → "30% / 70%" · zoom input 999 → 400 %, 5 → 20 % (compact face), 100 → cards.
- Toolbar actions collapse to icons below 1024px; the palette becomes an overlay drawer as before.
