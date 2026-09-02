# Journey Builder — FLOWS

One entry per header/bar action and per canvas interaction. Source: live handler source and DOM of
`/accounts/116000/journeys/612/journey-builder` on 2026-09-02. Nothing was saved, sent or deleted on
the server; canvas mutations were made client-side only and the tab was closed without saving.

Legend: ✅ verified by driving the live app · 👁 read from handler source only · ⛔ not executed
(irreversible / server-side) — flagged unverified.

## A. SAVE (primary)

1. Trigger: bottom-right **SAVE** (elevated). 👁
2. `getWorkflowPayload()` collects non-placeholder nodes into the `workflow_data` map (index from `meta.index`, then key suffix, then numeric id). 👁
3. `validateJourney(nodes, edges)` →
   - **invalid**: `markInvalidNode(nodeId, relatedNodeIds)` paints the node(s) `node-invalid` (red outline + glow); error snackbar **title "Cannot save journey"**, message = validation message, fallback **"Journey is incomplete."** Stops. 👁 (message catalogue lives in a composable that could not be read — ⛔ list of exact validation messages)
   - **valid**: `updateWorkflow({ workflow_data, status: <live> })` PUT. 👁
4. Success: success snackbar with the API `message` text; invalid marks cleared. ⛔ exact success copy (server string).
5. API validation errors: error snackbar with `formatValidationErrors` output keyed by step title. ⛔
6. Network/other error: error snackbar title "Cannot save journey", message from axios ("Failed …"). ⛔
7. User stays on the builder in every outcome. No route change.

## B. SAVE AS DRAFT

1. Trigger: bottom-right **SAVE AS DRAFT** (outlined). 👁
2. No validation. Payload `{ workflow_data, status: 'draft' }` → `updateWorkflow`. 👁
3. Same success / error snackbars as A.4–A.6. ⛔ copy.

## C. DELETE ALL

1. Trigger: **DELETE ALL** (elevated, trash icon). ✅ copy read from `CONFIRMATION_COPY`.
2. `AppConfirmationDialog` (maxWidth 500): title **"Confirm Delete"**, subtitle **"All items will be immediately removed. Do you wish to continue?"**, buttons **Cancel** · **Delete**.
3. Confirm → `clearCanvas()` sets nodes and edges to `[]`. Canvas becomes an empty grid (no empty-state message). Nothing is persisted until SAVE / SAVE AS DRAFT. 👁
4. Cancel → dialog closes, no change.

## D. EXIT

1. Trigger: **EXIT** (elevated, exit icon). ✅ copy.
2. Dialog: title **"Exit journey"**, subtitle **"Changes which are not saved will be lost. Do you wish to continue?"**, buttons **Cancel** · **Ok**. Shown unconditionally (no dirty check).
3. Ok → `router.push('/:accountId/journeys')` (the Journeys list). Cancel → stays.

## E. Zoom controls (top-right panel)

1. **Zoom In** / **Zoom Out**: ±10 %, clamped **20 %–400 %** (tested: 500 → 400 %, 5 → 20 %). ✅
2. **Zoom percentage** text input: keystrokes limited to digits and `%`; Enter (or blur) applies `setZoomPercentage`; invalid → ignored and value restored. ✅
3. Crossing ~75 % switches every node between collapsed face (54×54 + label) and expanded card (240×120) and re-lays out positions. ✅ (72 % collapsed, 75 % expanded)
4. Wheel / pinch zoom and drag-pan are Vue Flow defaults. 👁

## F. Contact search (top-right magnifier)

1. Click **Search** → 200px field appears, placeholder **"Email, Phone No. or Contact ID"**. ✅
2. Enter → `performContactSearch` (API lookup) → `focusWorkflowStep(stepKey)` → the node holding that contact gets `node-highlighted` (green outline) and the viewport centres on it. 👁 ⛔ result/no-result feedback not observed (needs a real contact).
3. Click Search again → field hides, query cleared, highlight removed. ✅

## G. Drag & Drop switch (palette header)

1. Off (default): palette is fixed top-left. ✅
2. On: `sidebar--movable` — the palette header becomes a grab handle; pointer-drag moves the whole palette, clamped inside the canvas. ✅ (source) — palette **items** are `draggable="true"` in both states. ⛔ pointer drag itself not exercised (0×0 viewport).

## H. Add a step from the palette

1. **Drag** a palette button onto the canvas → `DropzoneBackground` tints ("Drop here") → drop creates the node at the pointer. 👁 ⛔ pointer drag not exercised.
2. **Double-click** a palette button → `add-node-from-palette` → node created at the viewport centre. ✅ (called the handler directly)
3. Filters (Yes/No, Percent Split) also create two placeholder nodes ("Yes"/"No", "50%"/"50%") with labelled branch edges. ✅
4. A second trigger can be added (no single-trigger guard on add). ✅

## I. Connect steps

1. Drag from a source handle to a target handle (ConnectionMode.Strict). 👁
2. Rejected when: same node; target is a trigger; trigger→placeholder; source is a placeholder; target placeholder belongs to another filter's branch; Yes/No already connects the opposite branch to that target; invalid handle pairing. 👁

## J. Node details drawer (Edit)

1. Trigger: **double-click** a node (single click only selects) or card menu → **Edit**. ✅
2. Right drawer (800px, "Node details"): header card with **close** (X) and on trigger/delay nodes **Refresh contacts count**; body = per-type form (full field lists in AUDIT §6); footer **Save · Detach · Remove** (API Event: Detach · Remove; End: Remove). ✅ all 18 types opened.
3. Tabs inside forms: Send Email (Send Email / Send Test Email), Send SMS (Message / Compliance), Add to DNM (General / Brand), Product Purchased (Product / Product categories). ✅
4. **Save** (drawer): inline Vuetify validation on the active tab; then `updateNodeItemData` → node `item_data` + card body rows update; drawer closes. Local only. 👁
5. **Remove**: removes the node (same as J/K delete). 👁
6. **Detach**: `handleDetach(node)` then close. ⛔ calling it on the delay node changed no edges — semantics unverified (see question).
7. **View Contacts** (trigger/delay): navigates to a contacts list filtered by step. ⛔ not clicked.
8. **Refresh contacts count**: re-fetches `contacts_count`. ⛔ not clicked.
9. **View Journey Campaign Report** (Send Email): link to the journey campaign report. ⛔ not clicked.
10. **Send Test** (Send Email → Send Test Email tab): sends a test email. ⛔ never clicked.
11. Escape / X closes without saving.

## K. Delete a node

1. Collapsed: hover → red **delete** badge (title "Delete node"). Card: header **trash** icon. ✅ (DOM)
2. Immediate, no confirmation. Node + incident edges removed; if it terminated a filter branch, a placeholder is restored on that branch; a deleted filter takes its child placeholders with it. 👁

## L. Duplicate a node

1. Collapsed: hover → green **duplicate** badge (title "Duplicate node"). Card: menu → **Duplicate**. ✅
2. `duplicateNode(id, type, data)` inserts an unconnected copy offset from the original. 👁

## M. Rename a node

1. Click the collapsed label or the card title → inline input pre-filled with the label. ✅ (source)
2. Enter / blur commits `handleLabelUpdate` (updates `data.label`, ignored if unchanged); Esc cancels. 👁

## N. Flip Yes/No

1. Yes/No filter only: collapsed hover **flip** badge or card menu **Flip Yes/No** → `flipYesNoBranches(id)` swaps the two branch targets. 👁

## O. Palette section toggles

1. Triggers / Actions / Filters / Delay / End expansion headers; multiple may be open; Triggers open on load. ✅

## Unverified summary

| Item | Why |
|---|---|
| Save / Save-as-draft success and API-error copy | Server strings; saving would persist my test nodes |
| Exact validation message list (`validateJourney`) | Lives in a composable not reachable from the component tree |
| Detach semantics | Direct call produced no change; UI path not executable without a pointer |
| Pointer drag-and-drop from palette; palette panel drag | Tab rendered at 0×0, no pointer |
| View Contacts / Refresh count / Campaign Report / Send Test | Navigation or sending side effects |
| Contact search result / no-result feedback | Needs a real contact id |
