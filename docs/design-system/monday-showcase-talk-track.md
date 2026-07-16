# Monday Design Sandbox Showcase

**Audience:** Product, product design, engineering, and design-system maintainers  
**Duration:** 45 minutes — 30-minute walkthrough, 15-minute discussion  
**Purpose:** Show the final visual direction, explain what the sandbox proves, and align on a safe implementation approach.

## The outcome to seek

By the end of the meeting, the teams should understand and broadly agree that:

1. The visual direction and core product patterns are final from product design's perspective.
2. The sandbox is the code-first visual reference and interaction prototype, not a production component package.
3. `@maropost-ui/liquidsky-ui` remains the shared foundation.
4. Reusable patterns will be compared with LiquidSky and contributed incrementally instead of creating a competing library.
5. Product-specific builders, dashboards, AI surfaces, and domain rules remain in the product layer.
6. The immediate next step is a LiquidSky compatibility review followed by a small pilot.

## One-minute executive summary

> We have built a working Vue 3 and Vuetify design sandbox that demonstrates the final product design direction across dashboards, data-heavy pages, detail views, forms, and builder experiences. The sandbox lets us validate the design as a real interface rather than a collection of static screens.
>
> We are not proposing another standalone component library. LiquidSky should remain the shared Maropost foundation. We will compare the reusable patterns proven here with LiquidSky, reuse what already exists, propose missing generic compounds through the normal LiquidSky contribution process, and keep product-specific behavior in the product application.
>
> The result should be one shared library, one ownership model, and an incremental implementation path—not a second design system that teams must maintain.

## Language to use consistently

- Say **“approved visual direction”**, not “production-ready library.”
- Say **“code-first reference and acceptance environment”**, not “the new package.”
- Say **“converge into LiquidSky”**, not “replace LiquidSky.”
- Say **“generic compound”** for reusable multi-primitive behavior.
- Say **“page recipe”** for repeatable composition that does not need another component.
- Say **“product-specific surface”** for builders, dashboards, AI, and domain workflows.
- Say **“Vuetify is the implementation foundation”**, not “Vuetify is the design system.”

---

# 45-minute talk track

## 0:00–0:02 — Open with the purpose

### Say

> Today is a visual and implementation-direction review. I will show what we have designed and validated in the sandbox, explain how the system is structured, and propose how we move it into the product without creating another competing library.
>
> I am not asking the team to approve a big-bang rewrite or publish this repository as a production package today. I want us to align on the direction and the next technical validation step.

### Set expectations

- The design direction is final from product design's perspective.
- The mock data and interactions exist to prove patterns, not backend behavior.
- Some engineering work is intentionally unresolved until LiquidSky is reviewed.

## 0:02–0:05 — Explain what has been built

### Say

> This is an end-to-end design sandbox for the Maropost product. It covers the application shell, dashboards, list and report pages, detail pages, forms, settings, builders, marketing workflows, commerce, contacts, service, and AI-assisted surfaces.
>
> The important output is not the number of screens. It is that common jobs now share a coherent visual language: hierarchy, spacing, typography, cards, tables, status, actions, forms, empty and error states, responsive behavior, and accessibility expectations.

### Emphasize

- It is implemented in the same general frontend stack: Vue 3, TypeScript, Vuetify 3, Pinia, and Vue Router.
- The sandbox uses realistic product data and interactions.
- Common patterns have Storybook stories and documented usage rules.
- The value is the validated system and product behavior—not the mock backend.

## 0:05–0:17 — Visual walkthrough

Use the seeded account `2000290`. Keep the walkthrough focused on four representative experiences.

### 1. Dashboard — 3 minutes

**Route:** `/accounts/2000290/dashboard`

### Show

- The calm neutral canvas and clear card hierarchy.
- KPI, chart, table, and setup content coexisting without excessive decoration.
- Date/filter controls and dashboard-level actions.
- How information density is handled through spacing, typography, and progressive detail.

### Say

> The dashboard demonstrates the visual language at its most data-heavy: restrained surfaces, clear numbers, consistent widget framing, and room for charts to breathe. The dashboard runtime itself is product-specific; the reusable opportunity is in lower-level cards, states, controls, and tokens.

### Do not

- Spend time editing the grid or creating a dashboard.
- Claim the charting or widget runtime belongs in the shared library.

### 2. Sales Orders — 4 minutes

**Route:** `/commerce/2000290/orders`

### Show

1. Switch between **All Orders** and **Processing**.
2. Open the filter drawer, then close it without changing data.
3. Open the column-visibility control.
4. Select one row to reveal the floating bulk-action bar.
5. Expand one order to show progressive disclosure.

### Say

> This is our strongest repeatable page recipe: page header, status tabs, data toolbar, responsive table, row actions, loading and empty states, and a bulk-action surface. This pattern appears across commerce, contacts, campaigns, products, and settings.
>
> It is also the best technical pilot. We can compare this recipe with LiquidSky's table capabilities and decide which parts are existing primitives, which need small variants, and which are genuinely reusable compounds.

### Do not

- Trigger cancel, delete, or bulk fulfillment.
- Present the whole page as one component. It is a recipe composed from smaller contracts.

### 3. Contact Detail — 2 minutes

**Route:** `/accounts/2000290/contacts/1`

### Show

1. Identity and status treatment.
2. KPI summary and section hierarchy.
3. Move briefly between the overview and a data tab.
4. Open **Edit Contact** to show the form-drawer pattern, then close it.

### Say

> Detail pages use the same foundations without forcing every page into the same layout. The shared contracts are the page header, KPI cards, status, section headings, form drawer, confirmation behavior, and responsive table priorities. The contact data model and actions stay with the product.

### 4. Journey Builder — 3 minutes

**Route:** `/accounts/2000290/journeys/1/builder`

### Show

1. The full-page workspace and custom toolbar.
2. Search or expand a palette category.
3. Select an existing node to reveal its configuration panel.
4. Point out consistent status, color, fields, and confirmation patterns.

### Say

> A system should create consistency without making every experience look like a table page. Builders need purpose-built workspaces. We reuse the foundations and interaction rules, but the journey canvas, node model, and configuration behavior remain product-specific.

### Close the visual section

> These four examples show the intended range: common system language, repeatable product recipes, and room for specialized workflows.

## 0:17–0:22 — Explain the code-first system

Open Storybook at `http://localhost:6006`.

Recommended Storybook pages:

- `http://localhost:6006/?path=/docs/foundations-colors--docs`
- `http://localhost:6006/?path=/docs/layout-mppageheader--docs`
- `http://localhost:6006/?path=/docs/data-display-mpdatatabletoolbar--docs`
- `http://localhost:6006/?path=/docs/overlays-mpformdrawer--docs`

If Storybook is unavailable, use `/accounts/2000290/design-system`.

### Say

> Storybook is the design contract for this work. It shows the component in code, its API, supported states, usage guidance, accessibility responsibilities, and light/dark behavior. The product sandbox then proves those contracts in realistic workflows.
>
> The token file drives generated CSS, SCSS, TypeScript values, and the Vuetify theme. Components are built primarily as thin Vuetify-based compounds rather than reimplementing every primitive.

### Explain the layers

1. **Foundations:** color, spacing, typography, radius, motion, and semantic tokens.
2. **LiquidSky/Vuetify primitives:** buttons, fields, menus, dialogs, tables, and layout foundations.
3. **Generic compounds:** page headers, table toolbars, form drawers, confirmation, empty/error states, and similar repeatable behavior.
4. **Page recipes:** list pages, report pages, settings pages, detail pages, and module landings.
5. **Product surfaces:** dashboards, builders, AI, merchandising, and domain workflows.

### Be transparent

> The sandbox currently contains both the actively used `Mp*` layer and an older experimental `Mb*` package. The product does not use the `Mb*` components directly, and we are not proposing that package as the destination. It will be excluded from the target architecture so we do not introduce another namespace or token source.

## 0:22–0:28 — Present the implementation approach

### Say

> The lowest-risk approach is convergence, not extraction of the entire sandbox. We preserve the validated product behavior while moving shared ownership to LiquidSky one capability at a time.

### Phase 1 — Compatibility review

- Review the LiquidSky source, public APIs, tokens, theme configuration, peer dependencies, tests, and release process.
- Map every portable `Mp*` component into one of four outcomes:
  - Use an existing LiquidSky capability.
  - Wrap LiquidSky temporarily to preserve the current product-facing API.
  - Propose a missing generic compound or variant to LiquidSky.
  - Keep the capability in the product because it contains domain behavior.
- Resolve theme, token, icon, router, and table architecture differences before estimating migration.

**Exit criterion:** central design-system and product engineering reviewers approve the compatibility matrix and pilot scope.

### Phase 2 — Small facade pilot

Start with low-coupling capabilities such as:

- Page header.
- Confirmation dialog.
- Form drawer.
- Empty and error states.

Keep existing `Mp*` imports in the sandbox while delegating internally to LiquidSky where APIs align. This proves compatibility without touching dozens of pages.

**Exit criterion:** pilot components pass Storybook, accessibility, responsive, interaction, and consumer smoke checks with no visual regression in representative pages.

### Phase 3 — One list-page pilot

Use Sales Orders to compare the current table recipe with LiquidSky's supported table architecture.

Validate:

- Search, filters, active-filter removal, and column visibility.
- Responsive column priority.
- Loading, empty, error, and partial-data states.
- Selection, bulk actions, row actions, and expandable rows.
- Keyboard and screen-reader behavior.

**Exit criterion:** the team chooses a standard table recipe and documents the migration path for other list pages.

### Phase 4 — Incremental contribution and adoption

- Add approved generic capabilities through LiquidSky's normal review and pull-request process.
- Release and adopt them incrementally by product area.
- Keep domain mappings and product-specific workflows local.
- Deprecate temporary facades only after consumers migrate.

**Exit criterion:** shared capabilities are released, documented, versioned, and consumed by at least one representative product workflow.

### Phase 5 — Shell and navigation last

The app shell has the highest integration risk because it includes account context, routing, permissions, subscriptions, notifications, search, and responsive navigation. Migrate it only after the lower-level component model is proven.

## 0:28–0:30 — State the immediate asks

### Say

> The decision today is not “approve every component.” The immediate alignment I need is:

1. Confirm LiquidSky as the destination for shared capabilities.
2. Confirm that this sandbox and Storybook are the visual acceptance reference.
3. Nominate one LiquidSky maintainer and one product frontend owner for the compatibility review.
4. Provide the LiquidSky source and contribution requirements.
5. Agree to use the low-coupling component pilot followed by the Sales Orders table pilot.
6. Confirm that no parallel package will be published from this sandbox.

Then transition to questions:

> I will answer product questions first, then implementation and ownership questions.

---

# Anticipated Q&A

## Product and design questions

### What exactly are we approving?

The visual direction, interaction principles, common page recipes, and the proposed convergence approach. We are not approving every current component API or committing to a full migration estimate before reviewing LiquidSky.

### Is the design final?

The visual direction and product patterns are final from product design's perspective. Engineering validation can still change internal APIs, implementation details, and migration sequencing. A change required for accessibility, performance, or platform compatibility should preserve the design intent and be reviewed with product design.

### Is the sandbox production-ready?

No. It is a high-fidelity reference application with mock data. It proves visual and interaction behavior, but production readiness also requires integration with real APIs, permissions, analytics, error handling, automated tests, release governance, and the existing shared library.

### Why build a working sandbox instead of static designs?

It exposes issues that static screens hide: responsive behavior, realistic content density, keyboard flow, loading and error states, overlay behavior, reusable APIs, and cross-page consistency. It also gives engineering copyable examples rather than requiring interpretation from screenshots.

### Why does every page not use the same layout?

Consistency is applied at the correct level. List, report, settings, and detail pages use repeatable recipes. Builders and editors use specialized workspaces because their tasks are materially different. They still share tokens, fields, status, menus, dialogs, focus behavior, and accessibility rules.

### Are we redesigning the whole product at once?

No. The sandbox shows the coherent destination. Implementation should be incremental and organized around shared capabilities and product priorities.

### How will we know the new design is successful?

We will define baselines during the pilot, then track:

- Time required to build a representative page with approved components.
- Percentage of the pilot implemented without local visual overrides.
- Accessibility and visual-regression pass rates.
- Number of duplicate patterns or token sources retired.
- Adoption of released shared capabilities across product areas.
- Product usability measures for the workflows being migrated.

Do not promise a percentage improvement before those baselines exist.

## Architecture and library questions

### Are we replacing LiquidSky?

No. LiquidSky is the intended shared foundation. This sandbox contributes validated requirements, visual direction, compounds, recipes, and acceptance examples.

### Why not publish this sandbox as a new component library?

That would create duplicate primitives, tokens, documentation, release processes, and ownership. Teams would have to choose between libraries, and fixes would drift. Extending the existing central library gives the organization one supported path.

### Why not simply discard the sandbox and use LiquidSky as it is?

We should reuse LiquidSky wherever it already satisfies the validated product need. The compatibility review is necessary because the sandbox also proves product patterns and compound behavior that may not exist in the shared package today. Those gaps should become explicit contribution proposals, not silent local forks.

### What is the role of Vuetify?

Vuetify provides the implementation primitives and behavior. LiquidSky should provide Maropost's supported public contracts, theme, and shared compounds. Product teams should not need to recreate the design language by configuring raw Vuetify differently on every page.

### Which components should become shared?

Only generic, repeatable, low-domain capabilities. Likely candidates include page framing, table controls, form drawers, confirmation, empty/error states, selection patterns, and common status presentation. Final decisions require comparison with LiquidSky to avoid duplicates.

### What remains product-specific?

- Dashboard runtime, widget registry, and data sources.
- Journey and content builders.
- Da Vinci and other AI workflows.
- Product-specific navigation and account behavior.
- Folder, campaign, order, contact, ticket, and merchandising domain logic.
- Page recipes whose composition is useful but whose state belongs to the product.

### Why keep temporary `Mp*` facades?

They isolate migration risk. Existing views keep a stable import and API while the implementation underneath moves toward LiquidSky. Facades are removed only when doing so is cheaper and safer than keeping them.

### What about the local `@marobase/ui` or `Mb*` package?

It is an older experimental layer and is not directly consumed by product views. It is not the proposed destination and should not be published alongside LiquidSky. Any useful evidence can inform the compatibility review; the duplicate package and token story should then be retired.

### Are all `Mp*` components ready to move?

No. Many low-level components are portable, but several import product stores, router state, domain catalogs, browser APIs, or mock data. Shared-library candidates must receive data and behavior through neutral props, slots, models, and events.

### What is the first implementation pilot?

First, a small group of low-coupling facades: page header, confirmation, form drawer, and empty/error states. Second, Sales Orders as the representative table-page pilot.

### Why migrate the shell last?

The shell coordinates routing, account selection, subscriptions, permissions, search, notifications, and responsive navigation. It has a much larger blast radius than a page-level component.

## Tokens and visual consistency

### Which token source wins?

The target architecture must have one centrally owned token contract. The sandbox token set is the approved design requirement and migration input; it should be mapped into LiquidSky's token and theme model rather than copied into a parallel production pipeline.

### What happens if LiquidSky's current tokens differ from the new visual direction?

Document each difference and decide whether it is:

- A correction to the central semantic token.
- A supported theme or mode.
- A component-specific token.
- A product-only exception.

The central design-system team should approve shared changes because they can affect multiple products.

### Will teams still use raw Vuetify values?

Only for behavior or layout where no Maropost contract is needed. Shared visual decisions—color, typography, spacing, radius, status, fields, overlays, and interaction states—should come from LiquidSky tokens, defaults, or components.

### Why are we not using Figma?

For this initiative, the working interface and Storybook are the source of truth. They show actual responsive behavior, interactions, states, APIs, and accessibility responsibilities. Reviews happen against running code, and approved visual snapshots protect the result. This avoids maintaining a separate Figma library that can drift from implementation.

### How will designers review changes without Figma?

Through deployed Storybook previews and representative product routes. Every shared change should include stories for required states and a consumer example. Product design approves the rendered result before release.

## Quality, accessibility, and testing

### Is accessibility complete?

The primary `Mp*` set has documented baseline work for keyboard access, focus, names, labels, dialog semantics, and common state components. It is not complete for every product-specific surface, and the current axe panel is not an automated release gate. LiquidSky contributions must include automated and manual accessibility checks.

### What quality gates should shared components pass?

At minimum:

1. Type checking and package build.
2. Unit or component tests for public behavior.
3. Storybook build with required states.
4. Automated axe checks plus keyboard review.
5. Light and dark theme review where supported.
6. Mobile, tablet, and desktop review.
7. Visual snapshot comparison against approved Storybook references.
8. A smoke test in a real consuming page.
9. Versioning, release notes, and a deprecation path for breaking changes.

### What states must be documented?

As applicable: default, hover, focus, active, disabled, loading, empty, error, partial data, selection, long content, responsive behavior, and destructive confirmation.

### What are the known technical risks?

- Unknown API and token overlap until LiquidSky source is reviewed.
- Duplicate token and component layers currently present in the sandbox.
- Product-store and router coupling in some `Mp*` components.
- Different table and shell architecture may require composition changes rather than direct swaps.
- Icon and theme ownership must be reconciled.
- Current automated accessibility and visual-regression gates are incomplete.
- A broad rewrite would create regressions; the migration must remain incremental.

## Delivery, ownership, and timing

### Who owns what?

**Product design**

- Visual intent, interaction requirements, content hierarchy, usage guidance, and acceptance review.

**Central design-system team**

- LiquidSky public APIs, shared tokens and theme, implementation, accessibility baseline, package quality, releases, and deprecation.

**Product frontend team**

- Facades, page recipes, domain behavior, integration, real-data states, and consumer testing.

**Product and engineering leadership**

- Priorities, staffing, sequencing, and adoption expectations.

### How long will implementation take?

Do not give a total migration date before the compatibility review. Provide estimates after the team has:

1. Reviewed LiquidSky's source and contribution model.
2. Classified the portable components.
3. Resolved token/theme and router compatibility.
4. Completed the first facade and table pilots.

The pilots are intended to turn uncertainty into evidence before estimating the wider rollout.

### Will existing pages need to be rewritten?

Not all at once. Temporary facades can preserve view APIs, and page recipes can migrate incrementally. Specialized product surfaces should remain untouched unless a shared dependency changes.

### How will breaking changes be handled?

Through LiquidSky's versioning and deprecation policy. New APIs should be additive where practical. Consumers receive migration guidance, and facades remain until the product has adopted the released contract.

### What support is needed immediately?

- Read access to the LiquidSky source and Storybook.
- Its current token/theme and component documentation.
- Its contribution, review, test, release, and deprecation requirements.
- A named central maintainer and product frontend owner.
- Agreement on the first facade and Sales Orders pilots.

---

# Live-demo runbook

## Before the meeting

1. Run the app with `pnpm dev`.
2. Run Storybook with `pnpm storybook`.
3. Use a desktop viewport around 1440px wide at 100% browser zoom.
4. Confirm the active account is **Scooter Village (All access)**, ID `2000290`.
5. Open every route in a separate tab before screen sharing.
6. Reload each route to restore the seeded mock state.
7. Close Da Vinci overlays, menus, drawers, and browser developer tools.
8. Turn off notifications and hide bookmarks or personal browser chrome.
9. Capture one current screenshot of each demo stop as a fallback.
10. Keep this document open on a second screen or printed.

## Pre-open these tabs in order

1. `/accounts/2000290/dashboard`
2. `/commerce/2000290/orders`
3. `/accounts/2000290/contacts/1`
4. `/accounts/2000290/journeys/1/builder`
5. `http://localhost:6006/?path=/docs/foundations-colors--docs`
6. `http://localhost:6006/?path=/docs/layout-mppageheader--docs`
7. `http://localhost:6006/?path=/docs/data-display-mpdatatabletoolbar--docs`
8. `http://localhost:6006/?path=/docs/overlays-mpformdrawer--docs`
9. `/accounts/2000290/design-system` as the Storybook fallback

## Demo interaction guardrails

- Prefer opening and closing controls over saving changes.
- Do not run destructive actions.
- Do not improvise deep navigation.
- If an interaction fails, describe the intended behavior once and move to the next tab.
- Keep the walkthrough to four product routes and three or four Storybook examples.

## Fallback plan

### If the app fails

- Use the five pre-captured screenshots.
- Continue the architecture and implementation discussion from this document.

### If Storybook fails

- Use `/accounts/2000290/design-system`.
- Explain the Storybook contract verbally and show the product routes as consumer evidence.

### If a chart or external image fails

- State that the sandbox uses mock data and some external media.
- Continue with the table, detail, and builder routes; they carry the core story.

### If route state was changed

- Reload the page.
- If local state remains unexpected, switch to a private browser window before the meeting and reopen the seeded routes.

### If time is reduced to 20 minutes

1. Deliver the one-minute executive summary.
2. Show Sales Orders for five minutes.
3. Show Journey Builder for three minutes.
4. Show one Storybook component and foundations for three minutes.
5. Present the convergence phases and asks for five minutes.
6. Reserve the remaining time for questions.

---

# Post-meeting actions

## Within one business day

1. Record decisions, owners, objections, and unresolved questions.
2. Share the sandbox preview, Storybook preview, and this talk track.
3. Request or confirm access to the LiquidSky source.
4. Schedule the compatibility review with the named owners.

## Compatibility-review deliverables

- Per-component outcome: reuse, facade, contribute, or product-local.
- Token and theme mapping.
- Icon and router compatibility.
- Table architecture decision.
- Quality and release requirements.
- Pilot scope, risks, acceptance criteria, and evidence-based estimate.

## Definition of done for the decision package

- No parallel component library is proposed.
- LiquidSky ownership is confirmed.
- The old `Mb*` layer is excluded from the target architecture.
- Shared and product-specific boundaries are documented.
- The pilot has named owners and exit criteria.
- Estimates are based on source review and pilot evidence rather than assumptions.
