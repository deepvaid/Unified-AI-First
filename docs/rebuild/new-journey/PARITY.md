# New Journey — parity checklist

Rebuilt 2026-09-02 against `AUDIT.md` / `FLOWS.md`. Sandbox surfaces:
[JourneySelection.vue](../../../src/views/Marketing/JourneySelection.vue) ·
[JourneyTemplateWizard.vue](../../../src/views/Marketing/JourneyTemplateWizard.vue) ·
[CreateJourneyScratch.vue](../../../src/views/Marketing/CreateJourneyScratch.vue) ·
components [JourneyTemplateDialog](../../../src/components/marketing/JourneyTemplateDialog.vue) ·
[JourneySettingsForm](../../../src/components/marketing/JourneySettingsForm.vue) ·
[JourneyTemplateSetup](../../../src/components/marketing/JourneyTemplateSetup.vue) ·
data [journeyTemplateSetup.ts](../../../src/stores/journeyTemplateSetup.ts) + the `journeyTemplates`
graphs in [journeyFlowData.ts](../../../src/stores/journeyFlowData.ts).

```
/accounts/:accountId/journeys/new                         JourneySelection        (route name CreateJourney — unchanged)
/accounts/:accountId/journeys/new/scratch[?buildWithAI]   CreateJourneyScratch
/accounts/:accountId/journeys/new/template?template=<id>  JourneyTemplateWizard   (no template → back to selection)
```

The previous `CreateJourney.vue` (a two-step gallery + Da Vinci brief/draft generator) was an
invented design with no production counterpart and has been deleted. The copilot deep link
`/journeys/new?ai=1` still works — it lands on the Build-with-AI path.

## Journey Selection — `/journeys/new`

- [x] Breadcrumb/back to Journeys + H1 "Journey selection" + lead "Select your journey experience."
- [x] BUILD WITH AI → `/journeys/new/scratch?buildWithAI=true` (header primary action)
- [x] Seven cards: Create from scratch + Welcome · Abandoned Cart · Nurture · Advocacy · Email Re-Engagement · Lapsed Buyer, UAT descriptions verbatim, one icon each
- [x] 4-up ≥ lg / 3-up md / 2-up sm / 1-up xs grid
- [x] Create from scratch → `/journeys/new/scratch` (no dialog)
- [x] Template card → detail dialog (title, flow preview, full `details` copy incl. the two inline links, Create)
- [x] Dialog Create → `/journeys/new/template` with the template selected; ✕ / Esc / Cancel close it
- [x] CANCEL → `/journeys`
- [x] Cards keyboard-operable (Enter/Space) and announced as buttons that open a dialog — UAT defect fixed
- [x] Dialog traps focus and returns it to the card on close (MpDialog) — UAT defect fixed
- [ ] "New" chip on every template — dropped (accepted in Phase 2; carried no information)
- [ ] Loading spinner while templates load — not applicable, templates are local data
- [ ] Da Vinci-disabled account (`isDaVinciEnabled=false`) — unverified in UAT; sandbox always shows the button

## Template wizard step 1 — "Settings for <Template> journey"

- [x] Stepper ① ② (labelled Settings / Setup — labels added, UAT shows numbers only)
- [x] Journey name * — required · no emoji ("You cannot use emojis in this field.") · unique ("Name has already been taken", inline instead of toast)
- [x] End date (min today, clearable) · End time (96 × 15-min slots, past slots disabled for today, clearable)
- [x] Date ⇄ time auto-fill / clear-both behaviour
- [x] Past end date+time → "Selected time is earlier than the current time" (on the field, not a toast)
- [x] ☐ Enable journey · ☐ Retrigger journey with their explanatory copy
- [x] NEXT disabled until valid; CANCEL → `/journeys/new`; Back link → `/journeys/new`
- [x] Values survive Back from step 2

## Template wizard step 2 — "Setup for <Template> journey"

- [x] Template description + live flow preview (replaces the PNG)
- [x] Prerequisites checklist with ✓ / ✗ and the verbatim success / error copy; store tooltip
- [x] Missing prerequisite → warning alert + "create it" action (List → new list, Content → templates, Store → integrations, Segment → segment chooser); Finish blocked. Demonstrated by Abandoned Cart (no connected webstore in the sandbox)
- [x] From name * / From email address * with required + format validation and the sending-domains link
- [x] Welcome: Lists * multi-select with contact counts and a selection counter
- [x] Abandoned Cart: Store * select (empty state "No connected stores")
- [x] Nurture: Product / Product categories radio · Products * multi with "Trigger for all products (N)" · Source * / Brands / Product categories · Filter by order status + Order status * + ⓘ tooltip copy
- [x] Advocacy · Email Re-Engagement · Lapsed Buyer: Segment * select
- [x] Lapsed Buyer: "Set up the filter" second Segment * bound to all four Yes/No gates; Email 5 content copied onto the four thank-you emails; product-recommendations link under Email 4
- [x] Email Re-Engagement: "Set up the Do Not Mail list" General / Brand radio → Brand * (All Brands + brands)
- [x] One Content * pick per email (2 / 3 / 4 / 5 per template) with the UAT step titles and descriptions
- [x] FINISH disabled until every required control is valid
- [x] BACK → step 1 with values kept; stepper step 1 shows ✓; clicking a not-yet-reached step does nothing
- [x] FINISH → journey created with every pick written into the template nodes (trigger, per-email sender + content, filter segment, DNM list) → toast "Journey created successfully" → builder
- [x] Template graphs match the UAT thumbnails (Welcome 3 emails · Abandoned Cart 2 · Nurture 3 · Advocacy 3 · Re-Engagement percent split + 4 filters + DNM · Lapsed Buyer 4 Yes/No gates + Email 5 on every Yes)
- [ ] Return-to-wizard after creating a missing prerequisite elsewhere — UAT's `returnFrom*` flag was unverified; not built (see GAPS)
- [ ] Percent-split branch percentages / pre-built Yes-No segment definitions — not editable in UAT step 2 either; carried as node config only

## Scratch form — `/journeys/new/scratch`

- [x] Same settings form; H1 "Journey settings" + "Enter the details of your journey."; Back → Journey selection
- [x] CANCEL → `/journeys/new` · CREATE disabled until valid
- [x] CREATE → journey created → toast → `/journeys/:id/builder` (empty trigger + End)
- [x] `?buildWithAI=true` → "Build with AI" chip + info alert on the form; after CREATE the Da Vinci panel opens in wide mode beside the builder with a build prompt (stand-in for UAT's `JourneyBuilderAIDrawer`, whose contents were unverified)
- [x] Duplicate-name check on this path too (UAT only checked the template path)

## States

- [x] Validation: required / emoji / duplicate name / past time / invalid email / required picks — all inline
- [x] Success: toast on create, landing in the builder with the bound flow
- [x] Missing prerequisite (Abandoned Cart) · empty store select
- [x] Dirty-leave confirm on both forms
- [ ] Network-failure states — not applicable (synchronous mock store)

## Verification

- `npm run type-check` clean · `npm run build` green
- axe-core (WCAG 2.0/2.1 A + AA) scoped to page content: **0 violations** on Journey selection, the
  scratch form, wizard step 1 and step 2 (Abandoned Cart and Nurture variants). A whole-document
  run with the template dialog open adds only pre-existing shell findings (sidebar option roles,
  unnamed tooltips, app-store link) plus two shared-component findings logged in GAPS §8–9
  (`MpDialog` scroll region, `JourneyMiniPreview` pill contrast)
- Walked end to end in the sandbox: Welcome template → Finish → builder shows the bound flow;
  scratch → Create → builder; Build with AI → Create → builder + Da Vinci panel
