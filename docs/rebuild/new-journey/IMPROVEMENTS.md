# New Journey — improvements over UAT

Each change stays inside the allowed lanes (hierarchy, labels, feedback, a11y); no features added.
🔤 marks a copy change that needs sign-off.

## Journey Selection

1. **Cards are real buttons** — `MpOptionCard` gives every card `role="button"`, Enter/Space
   activation and `aria-haspopup="dialog"`; UAT cards were focusable but mouse-only.
2. **Dialog focus discipline** — `MpDialog` moves focus in, traps it, labels the close button and
   returns focus to the card on close (UAT dropped focus on `<body>`).
3. **Live flow preview instead of a PNG** — the dialog (and step 2) render the template graph with
   `JourneyMiniPreview`, so the structure is readable, scales, and is not an unlabeled image.
4. **Header actions consolidated** — Cancel and Build with AI sit in the page header; UAT had the
   AI button glued to a lead sentence and Cancel as a lone outlined button under the grid.
5. **"New" chips dropped** — all six templates carried one, so it conveyed nothing (Phase-2 decision).
6. 🔤 Sentence case: "Journey selection", "Select your journey experience.", "Build with AI",
   "Create" (UAT: Title Case + ALL CAPS buttons).
7. 🔤 Light copy-edit of the template essays: typos fixed ("helps built trust" → "helps build
   trust", "will sent" → "will be sent", "dependant" → "dependent", "ISP's" → "ISPs"), and
   "Journey" lower-cased mid-sentence. Content and links otherwise verbatim.

## Wizard (both steps)

8. **Stepper with labels and state** — `MpWizardSteps` shows "Settings / Setup", `aria-current`,
   a ✓ on the finished step and a footer counter; UAT showed bare numbers and a dead click target.
9. **Page title follows the step** — "Settings for … journey" → "Setup for … journey", with a
   "Step 2 of 2 — Setup" subtitle.
10. **Footer hint explains the disabled button** — "Name the journey to continue" / "Complete every
    required field to finish" instead of a silently grey NEXT / FINISH.
11. **Dirty-leave confirmation** on Back-link / sidebar navigation once a name is typed (UAT lost
    the draft silently).
12. **Reload-safe** — the template travels in the URL (`?template=welcome`); UAT kept it in a Vuex
    store and bounced to the selection page on refresh.

## Step 1 — Settings

13. **Duplicate name is an inline field error** ("Name has already been taken") on both the
    template and the scratch path; UAT showed a vanishing toast on the template path only.
14. **Past end time is a field error** on End time instead of a toast, and it is checked live.
15. **Static top labels + short hints** — the design-system field baseline; UAT's long hints sat in
    11px grey `v-messages`.
16. 🔤 "Journey name is required", "Selected time is earlier than the current time", "Enable
    journey" / "Retrigger journey" (sentence case); Enable hint now says "When you finish, the
    journey is live" because the saving button is Finish, not Save.

## Step 2 — Setup

17. **Sections have headings and cards** — Prerequisites · Sender · Set up the trigger · Set up the
    filter · Set up content · Set up the Do Not Mail list, each an `MpFormSection` in its own card;
    UAT ran one long unstructured column with inconsistent heading text ("Set Up Trigger" / "Set up
    the Trigger" / "Set Up the Trigger").
18. **Prerequisite rows are a list** with icon + text; the missing state is an `MpAlert` warning
    with the create action as a real button, and the store tooltip is a focusable info button.
19. **"Email Content is required." only when it is** — UAT showed it permanently under every filled
    content select; here it is a validation message.
20. **Distinct labels per content select** — "Content for Email 1 *" … "Content for Email 5 *";
    UAT's seven identical "Select Content *" labels were indistinguishable to assistive tech.
21. **Selection counters moved out of the label** — "0 selected" is a hint under Lists / Products;
    UAT mutated the label text ("Select List* (1)").
22. **List and segment options show contact counts**; products search by name; multi-selects use
    closable chips.
23. **Order status field is disabled until its checkbox is on**, and the ⓘ tooltip is a labelled
    button; UAT left the field editable with the filter off.
24. **From-email hint keeps its link** — "View your account's sending domains" is a standalone
    link, not a link inside a collapsible hint.
25. **Product recommendations link** under Lapsed Buyer's Email 4 is an in-app link (UAT used a
    relative `../product_recommendations` path).
26. 🔤 "From name *", "From email address *", "Lists *", "Store *", "Segment *", "Products *",
    "Trigger for all products (N)", "Filter by order status", "Order status *", "Brand *"
    (sentence case, no asterisk-in-the-middle labels).

## Scratch form / Build with AI

27. **The AI path says so** — a "Build with AI" chip and an info alert ("Da Vinci joins you in the
    builder") on the form; UAT's AI form was pixel-identical to the plain one.
28. **Da Vinci opens after the route settles**, in wide mode, pre-seeded with a build prompt.

## Flow preview (`JourneyMiniPreview`, shared)

29. **Preview redesigned as a miniature canvas** — nodes are surface cards with a hairline border, a
    category-tinted icon disc and a primary-ink title (was a tinted pill with 10px coloured text);
    connectors are 2px rails with rounded elbows on the outer branches; YES / NO labels are small
    outcome-coloured chips and percent-split labels read as logic; End nodes are dashed, quiet
    tiles. Fixes the contrast finding and makes the dialog and setup-step previews legible at
    thumbnail size. Also benefits every other preview site (data-journey pickers, stories).

## Fidelity notes

- Template flows now mirror the UAT thumbnails node-for-node (the previous sandbox templates were
  invented). The richer seeded demo journeys are untouched — they moved to `demoTemplates`.
- Toast copy: "Journey created successfully" (UAT: " Journey created successfully !" with a
  leading space on one path and "Journey Created Successfully!" on the other).
