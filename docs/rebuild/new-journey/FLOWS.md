# New Journey — header-action flows

Crawled 2026-09-02 on `uat.maropost.com/accounts/116000`. One entry per action reachable from the
two pages. "Write" steps (the API call that creates a journey) were **not** executed; everything
before them was walked with real clicks or the page's own handlers.

Legend: ▶ trigger · ◇ decision · ⟶ navigation · ⚠ unverified

---

## A. Journey Selection → template card → CREATE → template wizard

▶ Click any of the six template cards (`Welcome`, `Abandoned Cart`, `Nurture`, `Advocacy`,
`Email Re-Engagement`, `Lapsed Buyer`).

1. **Template dialog** (`JourneyDialog`, centred `v-dialog`, ~800px wide, no scrim click-through)
   - Header: template title (span, bold), ✕ icon button (top-right, no aria-label).
   - Body: full-width flow thumbnail PNG (no alt) · `details` HTML paragraph(s) with `ma-8`.
   - Footer: **CREATE** (black contained button, right-aligned, `data-gs="create-<slug>-journey"`).
   - Exits: ✕, Esc, scrim click → dialog closes, focus lands on `<body>`. No state change.
   - Verbatim `details` per template:
     - **Welcome** — "This Journey will introduce new subscribers to your brand and will restate the
       benefits of being a subscriber. You can use this opportunity to tell them what to expect and
       what to do next."
     - **Abandoned Cart** — "This Journey only works if you have connected your Marketing Cloud
       account with your website that sends Abandoned Cart triggers to Maropost. If a customer
       abandons their cart during a shopping session then this Journey will trigger. ¶ After a delay
       of 30 minutes (or more, or less, this can easily be changed) the customer will receive an
       email. You can include the Abandoned Cart tag within the email to automatically send the
       customer their most recent items. To learn more about the Abandoned Cart tag [please click
       here] ¶ The second email will sent to the customer a day later. In this email you can include
       the Abandoned Cart tag once again, with a content as to why they should come back and
       purchase from your store. The multi-email approach can remind your customers about their
       purchase at a better time." (link → galaxy.maropost.com/s/article/Journey-Triggers, new tab)
     - **Nurture** — "This Journey targets users who just bought a particular product or service.
       This series of emails can provide the customer with information about the product they
       purchased. It helps built trust and allows them to feel comfortable with your brand. ¶ The
       emails can have care instructions or complementary products or services."
     - **Advocacy** — "This Journey targets repeat buyers with the goal of getting them to give a
       positive testimonial about products or services. This is especially good for service based
       industries, such as coaches. This Journey is built to move the relationship between your
       company and your loyal subscribers beyond transactional. Many choose to send advocacy emails
       to people who have just purchased or repeat buyers. ¶ There are no pre-built segments for
       this Journey because the segment of your subscribers that you want to reach is highly
       dependant on your product or service. Some examples could be: • Transactional: Bought in the
       last 30 days • Repeat Buyers: Bought at least 2 products in the last 90 days ¶ You can ask
       your customers for multiple advocacy actions such as: • Leave a product review • Provide a
       quote for the website • Refer someone else with a coupon and get a discount based on the
       referral"
     - **Email Re-Engagement** — "This Journey helps to maintain your deliverability by only keeping
       subscribers that actually want to be there, on your lists. ISP's keep track of open and
       click-through rates. If the click rate goes up then your reputation goes up. If people are
       repeatedly deleting your emails, it will impact your reputation score. ¶ You want to remove
       people from your list that are not interested in your content. With this Journey you can get
       rid of contacts that don't want to receive your emails Additionally you will also re-engage
       subscribers that are interested but have not sought out your content on their own. ¶ This
       Journey should allow for re-triggering, as subscribers might lapse multiple times in the
       future. This Journey includes subscribers that have been inactive with your content for at
       least 90 days. ¶ Each Yes/No segments checks to see if the subscribers have taken action with
       your content. If they continue to be inactive they will continue on the Journey and
       eventually be unsubscribed. If they take action then they will exit the Journey and continue
       to be subscribed."
     - **Lapsed Buyer** — "This Journey helps to connect with subscribers that have purchased
       something over 6 months ago but have not purchased in the last 90 days. It encourages lapsed
       buyers to purchase again. In this Journey, the Yes/No filters check if a subscriber has
       purchased something. If they do, then the Journey sends them a thank you email, with a coupon
       code or a similar benefit for their next purchase. ¶ If a subscriber continues not to
       purchase anything they will experience the entire Journey, which will be a set of emails
       explaining why they should purchase something, show them the best available products and
       develop a relationship with the subscriber. [To create a set of product recommendations to
       use in an email, please click here.] ¶ This Journey should not be re-triggered." (link →
       `../product_recommendations`, new tab)

2. ▶ **CREATE** ⟶ `/journeys/new/template` (store: `journey/journeyTitle = title`). Pure route
   change. ⚠ An orphaned dim scrim stayed over the new page on 2 of 4 runs (shell defect).

3. **Step 1 — Settings for <Template> Journey** (see AUDIT §2)
   - States: NEXT disabled → (name typed + validated) enabled · emoji in name → red field + "You
     cannot use emojis in this field." · empty on submit → "Journey Name is required" · past
     end-date/time → error snackbar "Selected Time is less than the current time", stays.
   - ◇ CANCEL ⟶ `/journeys/new`. ◇ Breadcrumb "Journey Selection" ⟶ same. ◇ "My Journeys" ⟶ `/journeys`.
   - ▶ **NEXT** → spinner → `checkIfJourneyNameExists`
     - ◇ name exists → error snackbar **"Name has already been taken"**, stays on step 1 (verified
       with existing "tester 56").
     - ◇ ok → `journey/workflow` committed → step 2 slides in; stepper ① becomes ✓.

4. **Step 2 — Setup for <Template> Journey** (see AUDIT §2 table for per-template controls)
   - On enter: `init()` → prerequisites re-checked (`getPrerequisites`), lists / segments / stores /
     contents / brands fetched (spinner). Focus is not moved.
   - Prerequisite rows: ✓ + success copy when present; ⚠ ✗ + red error copy + link to create the
     missing item (`redirectTo`: list → `/create_list?folder_id=`, content → `/contents/template`,
     store → `/integrations`, segment → `/segments/types`) — **unverified**, this account has every
     prerequisite. Return path: the destination sets `journey/returnFrom*`; `returnToJourney()`
     pushes back to `New_Journey_Template` — also unverified.
   - Field states verified: From Name blur-empty → "From Name is required." (hint hidden) · From
     Email "bad-email" → "Invalid From Email Address." · Select List opens a checkbox list (20
     items, 10/page infinite scroll), typing filters server-side (`name=` param) · Select Content /
     Segment / Store / Brand single-select lists (10/page) · Nurture radio swaps Product ⇄ Product
     Categories field sets; Order Status checkbox governs "Enter Order Status" requiredness ·
     Re-Engagement DNM radio Brand ⇒ "Select Brand *" appears (default "All Brands").
   - FINISH stays disabled until every required control is valid (`areFormsValid`); verified it
     enables once From Name, From Email, segment(s) and all content selects are filled (Lapsed Buyer).
   - ◇ **BACK** ⟶ step 1 with values intact; ② greys out; clicking ② afterwards does nothing.
   - ▶ **FINISH** (⚠ **not executed — creates a journey**): past-time re-check (same snackbar) →
     `saveDataInTemplate(true)` → `$journey.create({workflow, workflow_data})` → success snackbar
     **"Journey Created Successfully!"** ⟶ `/journeys/:id/journey-builder` (all six templates are
     `isLiquidSkyBuilder`). Failure path: none in code beyond the global error snackbar;
     `overlay=false` in `finally`. Landing page after success: the new journey builder with the
     template pre-wired; back from there = builder's own exit (out of scope).

---

## B. Journey Selection → "Create from scratch" card

▶ Click the first card (no dialog).

1. `journey/journeyTitle = 'create_from_scratch'` ⟶ **`/journeys/new/scratch`** — "Journey
   Settings" (breadcrumb Journeys › Journey Selection › New Journey; identical fields to A.3; footer
   CANCEL + **CREATE**).
2. States: CREATE disabled until valid · same emoji / required / past-time validation as A.3.
   Duplicate-name check is **not** performed on this path (code) ⚠ server behaviour unverified.
3. ◇ CANCEL ⟶ `/journeys/new`.
4. ▶ **CREATE** (⚠ not executed): `$journey.create({workflow})` → snackbar " Journey created
   successfully !" ⟶ `/journeys/:id/builder` (legacy builder, empty canvas with the End node).

---

## C. Journey Selection → BUILD WITH AI

▶ Click the green button (only active when `isDaVinciEnabled`; true on this account).

1. Amplitude `journey-with-ai` · `journey/journeyTitle = 'build_with_ai'` ⟶
   **`/journeys/new/scratch?buildWithAI=true`** — visually identical to flow B (no AI cue).
2. Same validation and CANCEL as B.
3. ▶ **CREATE** (⚠ not executed): create → success snackbar → **right drawer
   `JourneyBuilderAIDrawer` opened at 50% width** (`ui/drawer.right`) ⟶ `/journeys/:id/builder`.
   The AI drawer's content was not reachable without creating a journey → ⚠ unverified.

---

## D. Journey Selection → CANCEL

▶ Outlined CANCEL under the grid ⟶ `/journeys` (list). No confirmation, no state.

## E. Breadcrumb "My Journeys"

⟶ `/journeys`. Available on both pages.

---

## Unverified / blocked (and why)

| Item | Reason |
|---|---|
| A.4 FINISH, B.4 / C.3 CREATE outcomes (toast, builder landing, AI drawer content) | Each writes a journey record. Documented from source (`finish()`, `createJourney()`), stopped before the call. |
| Missing-prerequisite state (✗ rows, red copy, "create" links, return flag) | Account 116000 has lists, content, segments, an active store and Product & Revenue enabled; state cannot be forced (mutating store flags is reverted by the owning effect). Copy taken verbatim from `managePrerequisites()`. |
| Template API failure / empty state | `templateList()` never failed; code has no error branch (spinner clears, six cards simply absent). |
| End Date picker | The date `v-menu` did not open on field or icon click during the crawl (time menu did, after ~1 s). Constraints read from code: `min = today`, `YYYY-MM-DD`. |
| Duplicate name on the scratch path | Only the template path calls `checkIfJourneyNameExists`; the scratch path posts straight to `create`. |
| `isDaVinciEnabled = false` rendering | Account has Da Vinci enabled; button may be hidden or inert. |
| Stepper "②" click feedback (`stepperInfo`) | Flag flips true but nothing rendered in the DOM; possibly a tooltip that needs hover. |
| Orphaned scrim after dialog CREATE | Reproduced intermittently (2/4 runs); shell-level `v-overlay` left behind, not page code. |
