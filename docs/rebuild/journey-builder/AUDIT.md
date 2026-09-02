# Journey Builder — AUDIT

Source: `https://uat.maropost.com/accounts/116000/journeys/612/journey-builder` (journey "weewew", an
Abandoned Cart template instance). Crawled 2026-09-02 via the claude-in-chrome extension. The tab
rendered at a 0×0 viewport, so screenshots were unavailable; everything below was read from the live
Vue 3 component tree (`#mfe-outlet-marketing`), the DOM, computed styles and handler source
(see `uat-crawl-vue-tree-technique`). The two user-supplied screenshots (70 % and 98 % zoom) were used
to confirm the visual reading.

## 1. Purpose and primary task

Edit an existing marketing journey as a flow graph: add steps from a palette, connect them, configure
each step in a right-hand drawer, then **Save** (validated, becomes live payload) or **Save as draft**.
Secondary: delete everything, exit to the journeys list.

## 2. Architecture (real app)

Modern micro-frontend, **Vue 3 + Vuetify 3 + `@vue-flow/core`**, mounted in `#mfe-outlet-marketing`
(the shell — top bar, left nav, chat widget — stays on screen). Component tree:

```
AppLayout
└─ CanvasPage                       page state: workflow, workflowName, mode ('collapsed'), confirmation dialog
   ├─ Sidebar                       floating palette (280px, absolute top-left)
   ├─ Canvas
   │  ├─ VueFlow (class basic-flow, default zoom 0.7, min 0.2, max 4, ConnectionMode.Strict)
   │  │  ├─ CustomEdge ×N            smoothstep, arrow marker, branch text label
   │  │  ├─ CustomNode ×N            → JourneyExpandedNodeCard | JourneyCollapsedNodeFace | placeholder
   │  │  ├─ DropzoneBackground       grid + "Drop here" tint while dragging
   │  │  ├─ MiniMap                  bottom-right, 200×154
   │  │  ├─ Panel top-right          Zoom In · zoom % input · Zoom Out · Search toggle (+ 200px field)
   │  │  └─ A11yDescriptions         Vue Flow keyboard hints
   │  └─ FormDrawer → AppDrawerWrapper (title "Node details", width 800, right, temporary) → FormBuilder (JSON schema per nodeType)
   ├─ ActionBtn ×4                   SAVE AS DRAFT · SAVE · DELETE ALL · EXIT (fixed bottom-right)
   ├─ AppConfirmationDialog          Delete-all / Exit confirmations
   └─ AppSnackbar                    type error|success, title, message, timeout 3000
```

## 3. Layout structure and hierarchy

| Region | Observed |
|---|---|
| Canvas | Full content area; 21px line-grid pattern (`#E8E8E8`, 1px). Pan by dragging, wheel-zoom per Vue Flow. |
| Journey name | `workflow-name-overlay`, absolute `top:16px`, centred, `text-body-1 font-weight-medium`, truncates. **Read-only** — no rename here. |
| Palette ("Build your journey") | White card 280px wide, `box-shadow 0 2px 12px rgba(0,0,0,.12)`, absolute top-left over the canvas. Heading "Build your journey" → row "Drag & Drop" + `v-switch` (color `#1976d2`) → `v-expansion-panels multiple` (Triggers open by default, others collapsed): Triggers / Actions / Filters / Delay / End. |
| Palette item | Full-width `v-btn` (`node-btn`), 36px tall, radius 6px, 13px/500, letter-spacing 1.16px, white text on the category swatch. `draggable="true"` (drag onto canvas) and **double-click** adds at viewport centre. |
| Top-right tools | `vue-flow__panel top right` 248×62: `Zoom In` (+) · `Zoom percentage` text input (digits/% only, Enter applies) · `Zoom Out` (−) · `Search` icon toggle → 200px text field, placeholder "Email, Phone No. or Contact ID". |
| Mini map | `vue-flow__minimap` bottom-right 200×154. |
| Action bar | `position:fixed; bottom:8px; right:8px`: **SAVE AS DRAFT** (outlined) · **SAVE** (elevated) · **DELETE ALL** (elevated, `mdi-delete`) · **EXIT** (elevated, `mdi-exit-to-app`). Uppercase Vuetify default. |
| Node details drawer | Right temporary `v-navigation-drawer`, 800px, header card with close (`mdi-close`) and, on trigger/delay nodes, a "Refresh contacts count" icon button; body = FormBuilder; footer **Save · Detach · Remove**. |

### Category swatches (CSS custom props on the sidebar)

| Category | Swatch | Expanded header tint |
|---|---|---|
| trigger | `#03b6fc` | `#E1F5FE` |
| action | `#29993e` | `#E8F5E9` |
| filter | `#2127a5` | `#E8EAF6` |
| delay | `#ea1397` | `#FCE4EC` |
| end | `#c22337` | `#FFEBEE` |

## 4. Palette catalogue (verbatim, in order)

| Section | Items (`nodeType`, mdi icon) |
|---|---|
| Triggers (9) | New Subscription (`new_subscription`, account-plus-outline) · Product Purchased (`product_purchased`, cart-outline) · API Event (`api_event`, webhook) · Segment Event (`segment_event`, chart-pie-outline) · Abandoned Cart (`abandoned_trigger`, cart-arrow-right) · Total Revenue (`total_revenue`, currency-usd) · Form Event (`form_event`, list-box-outline) · Subscription Changed (`subscription_changed`, account-edit) · Contact Field Updated (`contact_field_updated`, file-document-edit-outline) |
| Actions (5) | Send Email (`send_email`, email-outline) · Send SMS (`send_message`, message-processing-outline) · Add to Do Not Mail (`add_to_do_not_mail`, email-open) · Change Contact Field (`change_contact_field`, account-plus) · Change Table Field (`change_table_field`, usb-c-port) |
| Filters (2) | Yes/No (`yes_no`, call-split) · Percent Split (`percent_split`, percent-outline) |
| Delay (1) | Delay (`delay`, clock-outline) |
| End (1) | End (`workflow_end`, location-exit) |

Note: the older `docs/uat-parity/marketing-flow-specs.md` §8 lists a smaller palette (6 triggers, Send
Email only). The live builder has the 18 items above.

## 5. Nodes

### 5.1 Two faces, switched by zoom (the "cards change at 100 %" FYI)

`CustomNode` renders **`JourneyCollapsedNodeFace`** below ~75 % zoom and **`JourneyExpandedNodeCard`**
at ≥ 75 % (tested: 72 % collapsed, 75/80/90/95/99/100 % expanded). Default viewport zoom is 70 %, so
the page opens collapsed; one Zoom-In click (step 10 %) flips it to cards. Positions are **re-laid
out** between the two modes (a canonical collapsed-space `originalLocation` plus an expanded
translation) — e.g. "Email 1" sits at (400, 240) collapsed and (736, 336) expanded — so nodes jump
when the mode flips.

**Collapsed face** — 54×54 rounded tile filled with the swatch, 30px white mdi icon; label below the
tile (`collapsed-node-label`, 110px wide, `text-body-2 font-weight-semibold`, absolute `top: calc(100% + 8px)`).
Clicking the label swaps it for an inline input (rename; Enter commits, Esc cancels). On hover: red
circular `delete-btn` (24px, `#ff4444`, top-right, title "Delete node"), green `duplicate-btn`
(`#4caf50`, top-left, title "Duplicate node"), and for Yes/No a purple bottom-centre `flip-btn`.

**Expanded card** — 240×120 (`.node`: radius 8, `elevation-2`, 12px base font). Header (min 48px,
tinted): 36×36 swatch with white icon · title (`card-title text-body-small font-weight-bold`, click →
inline rename) · trash icon (title "Delete node") · `mdi-dots-horizontal` menu → **Edit · Duplicate**
(+ **Flip Yes/No** on a Yes/No filter). Body (white, `pa-3`): `field-label` (600, rgba 0,0,0,.87) +
`field-value` (500, rgba 0,0,0,.65) rows:

| Node | Body rows |
|---|---|
| Abandoned Cart trigger | Web Store Trigger: myShop.neto.com.au |
| Send Email | Name: weewew-Email 1 · Subject line: You left something in your cart |
| Delay | Day: 1 Day |
| End | End: Exit |
| Yes/No, Percent Split, SMS, DNM, Change fields (unconfigured) | empty body (percent shows a split summary once configured) |

**Handles** (10px circles): trigger `out-right` only · action `in-top in-left out-bottom out-right`
(collapsed: `in-left out-right`) · delay `in-left out-right` · Yes/No `in-top in-left out-yes out-no` ·
Percent `in-top in-left out-split-0 out-split-1` · end `in-left`.

**State classes**: `node-invalid` (2px `#d32f2f` outline + red glow, set by Save validation),
`node-highlighted` (2px `#2e7d32` outline + green glow, set by contact search), `node-hovered`, `selected`.

### 5.2 Placeholders

Adding a filter also adds one **placeholder** node per branch (60×32, `border: 2px dashed #8e44ad`,
`background rgba(142,68,173,.08)`, radius 8) labelled "Yes"/"No" (or "50%"/"50%"), wired with a
branch edge whose SVG `<text class="edge-branch-label">` repeats the label. Placeholders are the drop
/ connect target for the branch, are excluded from the saved payload, and are re-created when the
node terminating a branch is deleted.

### 5.3 Edges

`smoothstep`, `stroke #B1B1B7 2px`, `marker-end: arrowclosed`, 20px invisible interaction path.
Groups are announced "Edge from 1 to 2". `isValidConnection`: no self-loops; a **trigger can never be
a target**; trigger→placeholder forbidden; a placeholder is never a source; a placeholder may only be
targeted from its own filter branch; a Yes/No source cannot connect both branches to the same target;
handle pairing must be valid (`isValidJourneyConnectionHandles`).

## 6. Node details drawer — every form (verbatim labels)

Opened by **double-clicking a node** or **Edit** in the card menu (single click only selects). Loads a
JSON form per `nodeType`; footer **Save** (local — writes `item_data` on the node, nothing persists
until the bottom SAVE) · **Detach** · **Remove**. `*` = required mark as rendered.

| Node | Intro copy (first line) | Fields / controls |
|---|---|---|
| Abandoned Cart | "0 contact(s) entered through this trigger" · View Contacts · link "Abandoned Cart Triggers" | Select Store * (value shown: myShop.neto.com.au) |
| New Subscription | "This trigger initiates when a new subscriber is added to the list selected in the trigger…" · contacts count · View Contacts | Select List * |
| Product Purchased | "…initiates the Journey for contacts who are purchasing single or multiple products…" · count · View Contacts | Tabs **Product / Product categories**; Select Products* · checkbox "Trigger for all products" · checkbox "Order status" · Enter Order Status |
| API Event | "…add a contact to a Journey by making a POST API call…" · count · View Contacts | Read-only: "Use any of the following POST requests to trigger journey" + 5 sample URLs (`…/journeys/612/trigger/<id>(.:format)?contact_id=12345`, `?email=…`, `?phone_number=…`, `?uid=…`, `?table=users&where[user_id]…`). **No Save** — Detach · Remove only |
| Segment Event | "…based on segments. The trigger is not instantaneous. You need to select a time frame…" · count · View Contacts | Segments * · Days * (default "Everyday") · Hours * (default "00") |
| Total Revenue | "…initiated when a contact's revenue equals to what is set in the trigger…" · count · View Contacts | Total Revenue (default 0) |
| Form Event | "…initiated when a subscriber fills the form selected in the trigger. You can select multiple fo…" · count · View Contacts | Select SignUp * |
| Subscription Changed | "…initiated when a subscription of a contact changes, for example, from unsubscribed t…" · count · View Contacts | Select List * |
| Contact Field Updated | "…contains all the default and custom fields created in your account…" · count · View Contacts | Contact Fields * |
| Send Email | "The Send Email action enables you to send an email campaign." | Tabs **Send Email / Send Test Email**. Send Email: Name * · Subject * · Preheader · From Name * · From Email * · Reply To * · Content * (autocomplete; shows "Email Content for order_confirmation - Sales Channel 9") · Preview Link (switch) · Address * · Brand · Campaign Tags · Secure Suppression List · Language * · link "View Journey Campaign Report". Send Test Email: "Select contacts to send test email. You can send test email to a maximum 10 emails and a total of 20 contacts…" · Subject · Enter Emails(0) · Select List(s) · button **Send Test** |
| Send SMS | — | Tabs **Message / Compliance**. Message: Name * · From Number * · radio SMS / MMS · Message * (textarea) · switch "Enable click tracking" (hint "If you disable Click Tracking, none of your links for this campaign will be tracked.") · Mobile keywords (ph "Add keyword to message") · Contact tags (ph "Add contact tag to message") · **Quiet Hours**: Recipient Timezone · note "Your expected delivery schedule may lie outside permitted hours. Permitted Sending Hours Settings" (link) · radio Pause / Send Anyway. Compliance: link "Settings>SMS Campaign Compliance Settings." · Organization Name (hint "Include your organization name at the start of every message…") · Message Content · Company Information Link (hint "Includes a link with sender information after message content.") · Opt-Out Text (hint "Adds instructions on how users can opt-out…") |
| Add to Do Not Mail | "The Move to DNM action allows you to move inactive contacts to 'Do Not Mail' (DNM)…" | Tabs **General Do Not Mail List / Brand Do Not Mail List**. General: checkbox "Add Contacts to General Do Not Mail List" + "This will unsubscribe contacts from all future communications across your entire account". Brand: Select Brand · checkbox "Add all brands to DNM" |
| Change Contact Field | — | Contact Tags (field select) · value input |
| Change Table Field | "…enables you to change the table field for a contact in a table…" | Table Field · New Field Value |
| Yes/No | "The Yes/No filter is based on segments and requires you to select a segment. If contact comes into this filter…" | Segment * |
| Percent Split | "The % Split filter enables you to split into a group of minimum 10% and a maximum of 50%…" | Split Percentage (default 50) |
| Delay | "This delay can be set for any amount of time." · "0 contact(s) are waiting in this delay" · View Contacts | Months · Days · Hours · Minutes (persisted defaults 0/0/0/1; this node 0/1/0/0) |
| End | "This ends the Journey. Your customers will exit the Journey now. Having multiple end points helps you know whi…" | **Remove** only |

## 7. Data shape (persisted `workflow_data`)

```
{ "<nodeType>_<index>": {
    location: [x, y],                 // collapsed-space position
    next: { default: "<key>" } | { yes: …, no: … } | { "split-0": …, … },
    title: ["<catalog label or nodeType>", "<display label>"],
    item_data: { … per type … },      // e.g. send_email: name, subject, preheader, from_name, from_email,
                                      //   reply_to, brand_id, content_id, email_preview_link, address, language, campaign_id
                                      //   delay: months, days, hours, minutes (strings) · abandoned_trigger: id, name, store_type
    meta: { index, item_id?, contacts_count?, title?, description?, tooltip? } } }
```
Journey 612: `abandoned_trigger_0 → send_email_1 → delay_2 → send_email_3 → workflow_end_4`.

## 8. Interactions and behaviours

- **Zoom**: default 70 %; +/− step 10 %; clamp **20 %–400 %**; % input sanitises to digits/%, Enter applies; wheel/pinch via Vue Flow. Face switch at ~75 %.
- **Pan**: drag empty canvas; mini-map reflects viewport.
- **Add step**: drag a palette button onto the canvas (drop at pointer; "Drop here" tint) or double-click it (adds at viewport centre). Filters arrive with branch placeholders.
- **Connect**: drag from a source handle to a target handle, rules in §5.3.
- **Select**: click a node (Vue Flow selection; Enter/Space + arrows move it per the a11y hints).
- **Edit**: double-click or menu → drawer.
- **Delete node**: hover delete badge (collapsed) / header trash (card). Removes the node and its edges; if the node terminated a filter branch, a placeholder is restored on that branch; child placeholders of a deleted filter are removed too.
- **Duplicate**: hover badge / menu → `duplicateNode(id, type, data)` places a copy next to the original.
- **Rename**: click the label (collapsed) or title (card) → inline input.
- **Flip Yes/No**: swaps the yes/no branch targets.
- **Drag & Drop switch**: toggles `sidebar--movable` — the **palette panel itself** becomes draggable by its header (grab cursor), clamped to the canvas. Palette items are draggable regardless.
- **Search**: icon toggles a field; Enter runs a contact lookup and green-highlights the node the contact is currently in (`focusWorkflowStep`); toggling off clears the query and highlight.
- **SAVE**: validates (`validateJourney(nodes, edges)`) → on failure marks the offending node(s) `node-invalid` and shows an error snackbar titled "Cannot save journey" with the validation message (fallback "Journey is incomplete."); on success PUTs the payload and shows the API success message; API validation errors are formatted per step; network errors → "Cannot save journey" + axios message.
- **SAVE AS DRAFT**: no validation; sends `{ workflow_data, status: 'draft' }`.
- **DELETE ALL**: confirm dialog **"Confirm Delete"** / "All items will be immediately removed. Do you wish to continue?" / **Delete** · Cancel → clears nodes and edges on the canvas (client-side; persists only on a later save).
- **EXIT**: confirm dialog **"Exit journey"** / "Changes which are not saved will be lost. Do you wish to continue?" / **Ok** · Cancel → `/:accountId/journeys`. Shown even when nothing changed (no dirty tracking).
- **Snackbar**: bottom, 3 s, error or success.

## 9. Component mapping (real → sandbox design system)

| Real | Sandbox |
|---|---|
| App shell + fixed action bar + name overlay | `MpBuilderShell` (`persistence-mode="explicit"`, `#title`, `#actions`) — actions move to the toolbar; back = Exit |
| Floating palette card + expansion panels + swatch buttons | `MpBuilderShell` left region: search + collapsible sections of `palette-item` buttons (existing `JourneyBuilder.vue` pattern) |
| Vue Flow canvas, zoom panel, mini-map | `JourneyFlowColumn` on a scrollable stage with the existing `.jb-zoom` control (fit · − · % · +) |
| CustomNode expanded card / collapsed face | `JourneyFlowColumn` node card (320px) — collapsed face = new density (GAPS) |
| Placeholder branch nodes | `JourneyAddStepMenu` "Add step" slot on empty branches |
| `<i>` header actions + dots menu | `MpRowActionsMenu` + `MpMenuItem` (Configure · Duplicate · Delete, + Flip Yes/No) |
| Node details drawer (800px, FormBuilder) | `MpFormDrawer size="lg"` (or the in-canvas `jb-panel`) with `MpFormSection` / `MpFormGrid` / bare Vuetify fields; tabs = `v-tabs` |
| AppConfirmationDialog | `MpConfirmDialog` (`danger` for Delete all) |
| AppSnackbar | `useToast` |
| Contact search field | toolbar `v-text-field` with `aria-label` (chrome pattern) |
| Drag & Drop switch (movable palette) | no equivalent — see GAPS |

## 10. Accessibility issues observed

1. Card header actions are `<i class="v-icon">` with `title` only — not focusable, no `role=button`, no accessible name for the dots menu.
2. Collapsed hover badges (delete/duplicate/flip) appear only on mouse hover — unreachable by keyboard.
3. `header-action-icon` colour `rgba(0,0,0,.4)` on the tinted header ≈ 2.8:1 (fails 3:1 for UI icons).
4. Trigger palette button: white 13px text on `#03b6fc` ≈ 2.3:1 — fails AA text contrast. Delay `#ea1397` ≈ 3.9:1 also fails for 13px text.
5. Node type is conveyed by colour + icon only; no text category on the collapsed face.
6. "Drag & Drop" switch has no programmatic label (read as checkbox "true").
7. Nine top-bar / palette icon buttons expose no name (sidebar collapse, palette section toggles read as unnamed `button`).
8. Journey name is a `span`, not a heading; the page has no `h1` for the builder.
9. Edge arrows `#B1B1B7` on white ≈ 2.1:1 (decorative, but the only cue of flow direction).
10. Uppercase, letter-spaced button labels (`SAVE AS DRAFT`) reduce legibility; the destructive **DELETE ALL** sits between SAVE and EXIT with no separation.
11. Drawer tabs/fields use floating Vuetify labels; required is marked by `*` only, no `aria-required`.
12. Zoom % input accepts free typing but has no visible label (aria-label only) and no hint of the 20–400 range.

## 11. UX friction worth fixing

- Two save buttons with different semantics and no dirty indicator; Exit always warns even when clean.
- Cards **reflow and jump position** when the zoom crosses ~75 % (the FYI in the brief): the 70 % default means the very first Zoom-In rearranges the whole graph.
- Double-click-to-add and double-click-to-edit are undiscoverable; single click does nothing visible beyond selection.
- "Drag & Drop" toggle actually makes the *palette panel* movable — the label suggests it enables dragging steps.
- Hover-only node actions; the trash sits 4px from the menu button on every card.
- No empty state after DELETE ALL (blank grid, no guidance to add a trigger).
- Palette copy inconsistencies: "Percent Split" (button) vs "% Split filter" (drawer); "Add to Do Not Mail" vs "Move to DNM action"; "End" vs "Workflow End" (title fallback).
- The drawer's local **Save** reads like a persist action; the real persist is the bottom bar.
- Contact search is an icon that reveals an unlabeled field; no result/empty feedback beyond a highlight.
