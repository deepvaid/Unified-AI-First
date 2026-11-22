# Da Vinci Catalog Management — prototype decisions

Companion to the PRD *Da Vinci Catalog Management* (Confluence PROD, 16 September 2026) and its child page *Epics and User Stories*. This file records what the prototype decided where the PRD was open or collided with the repository, how to demo it, and what stays out of scope. Updated 29 September 2026.

## What it is

Da Vinci drafts; the merchant applies; the form's own Save persists. The Unified Co-Pilot drawer gains a **catalog context** opened from the Products module. It drafts a whole product from a brief (create), suggests improvements for a saved product (enrich) or drafts one field (description, SEO). **Apply** fills the create stepper or the edit page in memory. Nothing reaches the catalog until the merchant clicks Save as Draft, Publish or Save. One applied draft uses one AI action (10 credits). Publish and Discard use none.

## Where it lives

| Concern | File |
|---|---|
| Draft generator (create, enrich, field) | `src/composables/useCatalogGenerator.ts` |
| Types, credit constants, presets, demo scenarios | `src/composables/catalogCopilotConfig.ts` |
| PRD event taxonomy on the local event bus | `src/composables/useCatalogCopilotAnalytics.ts` |
| Context, gate, credit ledger, Apply bridge | `src/stores/useCatalogCopilot.ts` |
| Drawer lane, cards in the thread, gated composer | `src/components/MpDaVinciBot.vue` |
| CTA, context bar, draft card, gate card | `src/components/copilot/DvCatalog*.vue` (+ stories under `Product/Da Vinci`) |
| Create with Da Vinci | `src/views/Products/ProductsList.vue` |
| Apply into the stepper, search listing card, description / SEO generate | `src/views/Products/ProductWizard.vue` |
| Edit with Da Vinci, subset apply, description / SEO generate | `src/views/Products/ProductEditor.vue` |
| `?catalog=` scenarios · user-menu demo control | `src/App.vue` · `src/components/layout/AppBar.vue` |
| Generator tests | `tests/davinci-catalog/generator.test.ts` (`npm run test:catalog`) |

## Decisions

| # | Decision | Why |
|---|---|---|
| D1 | **The brain is a deterministic local generator** with the same shape as `useThemeGenerator`: synchronous, `\b`-anchored rules, no network. Its two entry points can later delegate to AI Gateway structured output without changing their signatures. | Repeatable demos with no API keys. The existing Gemini schema has no structured product draft. |
| D2 | **SEO applied on create lands in the stepper.** Step 1 gains a *Search engine listing* card (SEO title, meta description, URL handle, snippet preview) with its own Generate with Da Vinci. `buildDetail()` now carries `seo`. | Applied SEO has to be visible and editable before Publish. This also fixed an existing bug: the edit wizard used to drop SEO saved on the product editor. |
| D3 | **One tag and one collection per draft.** `ProductDetail.tag` and `.collection` are single values, so the draft mirrors the model and Apply fills exactly what the card shows. The stepper's Brand and Tag became comboboxes, matching the editor, so drafted values display. | Honest apply, no model change. A multi-tag model is a separate change. |
| D4 | **Wallets in live mode:** an active trial gets 50 credits (5 actions). A paid account with the Da Vinci subscription or the `davinci_tokens` add-on gets the 500-credit Starter pack. A paid account with neither has no credits. On the Build tier the CTA is hidden. An account without Commerce Cloud sees the CTA and a `no_commerce` gate. | Seed account 2000290 demos the happy path with no setup. 2000293–2000302 demo the credit gate, and 2000303 (retail only) demos `no_commerce`. |
| D5 | **Cards emit events; the drawer navigates.** The draft and gate cards never import the router or a store. | Stories render without app context. |
| D6 | **Card status lives in the thread**, in the message props: `draft`, `applied`, `discarded`, `superseded` or `inactive`. | The full-page copilot remounts the drawer, and an applied draft must still read as applied. |
| D7 | **Entering catalog context never clears the conversation.** The greeting is pushed straight into the thread. | `queueResume` would log a Da Vinci onboarding event. |
| D8 | **Product Created and Product Published keep their names** and gain `created_via`, `davinci_applied`, `published_via` and `time_since_apply_ms`. The edit page adds *Product Saved After Apply*, because no save event existed. | The PRD says to extend these events, not fork them. |
| D9 | **The global header Da Vinci icon stays general-purpose.** Catalog context opens only from the Products CTAs, the field CTAs and a chat request to add a product. | The PRD leaves this open for the Da Vinci team and names this as its own fallback. |
| D10 | **The context belongs to its page.** Create mode lives on Products and the create stepper. Enrich and field modes live on the page they were opened from. Leaving that page, changing account, starting a new chat or clicking × ends the context, and any open drafts turn *Inactive*. Closing the drawer keeps the context. | Apply can never land on the wrong product, and closing the drawer to look at the form loses nothing. |
| D11 | **A field-level CTA runs its default ask straight away.** Create and Edit with Da Vinci open with presets. | "Generate" is a one-click promise. Enrich needs the merchant to say what to improve. |
| D12 | **Credits move when the form confirms the hydrate.** The target page takes the pending payload, fills its fields, then calls `confirmApplied`. If a leave guard cancels the navigation, nothing is billed and the card stays open. | This is the PRD's "if Apply did not complete, do not bill". |
| D13 | **Asking for a product in chat opens catalog create mode.** "Add a product called …" on any page enters create mode and drafts for real. Before, a canned description was copied to the clipboard and `ProductNew?source=davinci` opened blank. Inside the context, another job entirely (revenue, a segment, a campaign) leaves the context and routes normally. | The honest-card-actions rule from the September copilot audit. |
| D14 | **Da Vinci files products into categories, and only ever adds.** Categories are a field-level ask (*Suggest with Da Vinci* on the Categories field in the stepper and the editor, `CatalogField = 'categories'`), a starting point (*Add categories*), and part of *Improve the whole listing*. A suggestion is what the product has plus what fits, so a merchant's filing is never removed. The fit comes from the product's kind, or from cues in its name when no kind matches ("Air Max" → Apparel, "QLED" → Electronics). A category named in the prompt wins: "put it in Home & Kitchen" uses the catalog's casing; "in a new Gifts category" or "category: Gifts" creates one, with a note to check the name. "Also add …" keeps the suggestion and adds the named one. A new name shows up in the field's options, so it stays selectable. | Products the kind table didn't know got no category at all, and a product that already had one could never gain a second. Adding without removing keeps Apply safe to accept as is. |

## UI refinements (design review, 29 September 2026)

A principal-design review of the built flow, measured live at 1280px with the drawer docked and at 375px.

| Finding | Change |
|---|---|
| The create draft was 896px tall in a 473px drawer, with Apply 776px down | The card is a spec sheet: title and subtitle, a 3-line description, a two-column `<dl>` of drafted facts, the search listing, and *Left for you*. It measures 589px. The footer is **sticky** inside the drawer's scroll body, so Apply is always in reach. The drawer publishes its bottom padding as `--dv-sticky-bottom`, and the card uses `overflow: clip` rather than `hidden`, which would trap sticky. |
| Retired drafts were dimmed to `opacity: .6`, putting text at 2.55:1, and kept their full height | Applied, Replaced, Discarded and Inactive drafts collapse to one line (94–111px) with *Show draft*, which expands at full contrast. |
| A 6-line explanation above every card, with the gaps buried in it | The bubble carries one sentence (`intro`). The card shows `gaps` (price and brand left blank on purpose) and `notes` (assumptions such as the default size run). Speech keeps the full `explanation`. |
| Diff rows centred their checkbox on multi-line rows; "Now Empty" read like a second label | The checkbox aligns with the field label. Each row says **New** or **Replaces current**, the current value is behind *Show current*, and SEO lengths sit on the label line. |
| Presets and refinements stacked as ragged 40px pills | Starting points are full-width rows with a hint of what each drafts (`layout: 'list'`). Refinements are compact 32px pills (`layout: 'compact'`). Other intents keep their pills. |
| The same success said three times (toast, page notice, card) | The success toast is gone. The page notice and the card's Applied state remain. |
| The header CTAs broke two headers: Save orphaned at 375px, three rows on Products, and the title squeezed to about 150px with the drawer docked | Header CTAs use the Da Vinci **tint** (the context bar's surface) and go icon-only on phones. `MpPageHeader` wraps its actions by content width: the title keeps `component.pageHeader.titleMinWidth` (280px) before the actions drop under it. This was checked on Campaigns, Contacts, Orders and Segments, which are unchanged. |
| The field CTA floated on its own row under Description | `DvCatalogCta variant="link"` sits in the field's label row, with a 24px hit area. |

### Second pass (8 October 2026)

Measured at 1100px with the drawer docked, at 375px, and in dark mode.

| Finding | Change |
|---|---|
| With the drawer docked, the table toolbar squeezed "All products" to one letter per line, the header actions clipped *New product*, and SKUs wrapped | `MpDataTableToolbar` is a query container. Its title keeps `component.toolbar.titleMinWidth` (160px) before the controls wrap, and it stacks when the card is narrower than `layout.breakpointCompact`, not only on a narrow viewport. `MpPageHeader` actions wrap inside the header instead of running past it. SKU cells don't wrap. |
| The stacked toolbar never left-aligned its controls on phones | Alignment moved from the `justify-end` utility, which is `!important`, to `.mp-toolbar-controls`. |
| *New product* ended up alone on a second header row while the drawer was open | The header CTA shows only its mark while the drawer it opens is already open, as it does on phones. |
| The drawer header wrapped "Da Vinci" on phones and truncated its status line at every width | The five header icons are one tight cluster (2px apart), and the header gap is 6px; the orb's halo already pads it. On phones *Expand* is hidden, since the drawer already spans the viewport. |
| Stale replies stayed live: refinements under a replaced draft, starting points after the session ended, and "Compare to YoY" under a catalog reply | Quick replies hide once their draft leaves `draft` or their session ends (`IntentCardsProps.retired`). The composer's analytics pills don't follow a catalog reply. |

## PRD → prototype

| PRD | Prototype |
|---|---|
| Index: Create with Da Vinci left of Add Product, same row as Export / Import | Export · Import · **Create with Da Vinci** · New product |
| Create stepper stays Details → Organise → Variants; Apply hydrates, never creates | Apply navigates to the stepper if needed, fills Details, Organise and Variants plus the search listing, unlocks every step and returns to step 1. An info alert says nothing is saved. Cancel and leave-page prompts still fire because the form is dirty. |
| Edit: Edit with Da Vinci left of Cancel / Save; field CTAs on description and SEO; status control untouched | Header CTA plus Generate with Da Vinci under Description and beside Search engine listing. Enrich returns a current-vs-suggested diff with a checkbox per row. Apply patches only the ticked fields. Status, options, prices and inventory are never touched. |
| Variant prices only if the merchant stated one | The generator drafts `price` only from an explicit "$129" or "priced at 129". The explanation says pricing is left to the merchant. |
| Required fields left empty stay invalid | A brief with neither a recognisable product nor a name returns *Tell me a little more* instead of inventing one. SEO without a title returns *Add a product title first*, and no credit is used. |
| Gate reasons `no_commerce`, `no_credits`, `trial_exhausted`, `kill_switch`, `role` | One gate card per reason with non-technical copy, a usage meter where one exists, and Upgrade (Plans), Buy credits (Billing add-ons), Talk to sales (the PLG sales dialog) or Add product manually. The composer is disabled while gated. |
| Trial: 50 credits / 5 actions, CTA stays visible at zero | Context bar reads "4 of 5 trial actions left". At zero the gate appears; manual create still works. An expired trial reads "Your free trial has ended". |
| Feature flag `davinci.catalog_management`; kill switch | Scenarios `flag_off` (every CTA hidden, no catalog events) and `kill_switch` (gate offering only Add product manually). |
| View-only roles see the CTA disabled | Scenario `view_only`: CTAs disabled with the reason on hover or focus. Chat entry shows the `role` gate. |
| Discard / refine free; failures free | Discard marks the card and logs Discarded. A follow-up that doesn't name a new product refines the brief ("Set the price to $129", "make it for women"), and the older draft reads *Replaced*. Timeouts show an error card with Try again. |
| Amplitude events, ids and enums only | See *Analytics* below. The property types are closed, so prompt text, titles and copy can't be sent. |

## Demo guide

**Happy path** on account 2000290:

1. Products → **Create with Da Vinci** → *Men's trail running shoe*.
2. Review the draft: sizes 7–13, no price, no brand.
3. Click *Set the price to $129*. The draft updates and the old one reads Replaced.
4. **Apply to form**. The stepper is filled, and step 3 shows seven sized variants at $129.00. The allowance drops by 10 credits.
5. **Publish**. The product is listed and the allowance doesn't change.
6. Open any product → **Edit with Da Vinci** → *Improve the whole listing*.
7. Untick a row → **Apply N selected** → **Save**.
8. On the same page, click **Suggest with Da Vinci** on *Categories*, then type *Also add it to Sports & Outdoors and a new Gifts category*. The card marks the additions and notes that Gifts is new. In a narrow field (half-width column, docked drawer) the action shows only its mark, with the label as a tooltip.

Created products live in memory like the rest of the prototype catalog. Navigate in-app rather than reloading.

**Entitlement scenarios.** Add `?catalog=<key>` to any URL, or use *Catalog Co-Pilot demo* in the user menu. Reset returns the account to live.

| Key | What you see |
|---|---|
| `auto` | Live: from the PLG plan, the account's subscriptions and the role |
| `trial` | A fresh 5-action trial allowance; the sixth apply gates |
| `trial_exhausted` | Gate: *You've used all 5 trial actions* |
| `no_pack` | Gate: *Add Co-Pilot credits to draft products* |
| `pack_exhausted` | Gate: *You're out of Co-Pilot credits* |
| `kill_switch` | Gate: *Catalog Co-Pilot is unavailable right now* |
| `flag_off` | No Da Vinci CTAs anywhere; New product unchanged |
| `view_only` | CTAs disabled with the reason on hover |

The same states can be reached through real data: `?plg=trial-d3` (a live trial), `?plg=trial-expired`, `?plg=paid-build` (CTA hidden), account 2000293 (no credits) and account 2000303 (no Commerce Cloud).

**Fault injection.** Any prompt containing the word `timeout` simulates an AI Gateway timeout. Try again re-sends the prompt without the word.

## Analytics

Events go to `window` as `mp:product-event`, the bus the Da Vinci onboarding tracker already uses, and the last 100 are kept in `localStorage` under `mp.davinci.catalog-events.v1`. Every event carries the PRD user properties: `mcc_plan`, `davinci_entitlement`, `davinci_copilot_pack`, `davinci_catalog_flag`, `trial_catalog_actions_remaining` and `user_role`.

| Event | Fired from |
|---|---|
| CTA Viewed · CTA Clicked | Products index, edit page and stepper (surface `index`, `edit`, `field`) |
| Drawer Opened | Entering catalog context, or reopening the drawer while it is live |
| Prompt Submitted · Draft Returned · Draft Failed | The drawer's catalog lane |
| Apply Clicked · Discarded | Draft card actions; Discarded also when the merchant leaves the context or starts a new chat |
| Gate Viewed · Upgrade Clicked | A gate card being shown · its Upgrade, Buy credits or Talk to sales action |
| Credit Consumed · Apply Completed | The target form confirming the hydrate |
| Product Created · Product Published · Product Saved After Apply | Stepper and editor saves |

## Limitations and production gaps

- **No model.** Drafts come from rules and templates. Copy is plausible but generic. Unrecognised products get neutral copy, never "a product".
- **Server events.** The PRD fires Draft Returned, Draft Failed and Credit Consumed from the backend. The prototype fires them from the client because there is no backend.
- **One pack size.** The Starter pack (500 credits) is the only pack modelled. Growth and Scale, pack purchase and trial-to-pack replacement belong to billing.
- **Not simulated:**
  - two users applying the last action at the same time;
  - save conflicts;
  - audit logging of prompts and responses;
  - platform, capability and account kill-switch levels (one switch stands for all).
- **Roles.** RBAC's signed-in user is fixed, so the view-only role is demoed through the scenario rather than a role switch.
- **Kits.** No Da Vinci entry points in the kit wizard, which is a PRD non-goal. Bulk enrich (Phase 2) is also out.
- **Global header icon.** It stays general-purpose (D9) until Unified Co-Pilot routing exists.
