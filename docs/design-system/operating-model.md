# Design System Operating Model

**Status:** proposal — shared after the leadership showcase (2026-07-20) · **Owner:** Deepak (UX)
**Companions:** [leadership-showcase-script.md](./leadership-showcase-script.md) · [showcase-faq-crib-sheet.md](./showcase-faq-crib-sheet.md) · [monday-showcase-talk-track.md](./monday-showcase-talk-track.md) (convergence strategy)

This is the "how we'll actually work" document behind the showcase: how teams contribute, how design hands over to engineering, how QA and UAT fit, how AI-assisted contributions are governed, and how the timing works alongside the Vue 2 → Vue 3 migration. It's written to be pasted into Confluence and argued with — every section ends with what needs a decision.

Ground rules carried over from the showcase (unchanged): the sandbox is a **working prototype environment**, not production. Everything shared converges **into LiquidSky** — no second library ever ships from the sandbox. **No dates** until the two pilots produce evidence.

---

## 1 · How teams work on the system — own your area, share the commons

Nobody's roadmap moves, and no team stops owning its product area:

| Team | Keeps owning | Draws from the commons |
|---|---|---|
| **Commerce** | Store builder, orders, catalog screens | Kit parts, list/detail recipes, **builder kit** |
| **Marketing** | Campaign screens, journey/email/landing-page builders | Kit parts, recipes, **builder kit** |
| **Service** | Ticketing, chatbots, transactional SMS screens | Kit parts, recipes, status/queue patterns |

**The commons** are two things:

1. **The shared kit** — the base parts and page recipes everyone saw in the showcase (buttons, fields, tables, page headers, list/detail patterns).
2. **The builder kit** — the parts every builder-type screen shares: the builder shell (top bar, save/status area, exit guard), the canvas frame, the inspector/settings panel, node cards, add-step menus. This is not speculative: **17 builder screens in the sandbox — store, landing pages, email, journeys and the rest — already run inside one shared builder shell.** A store builder, a landing-page builder, and an email builder are the same skeleton wearing different clothes.

**So: can a team work "in its own silo"?** On its product area — yes, that's the design. On the shared skeleton — no, and that's the point. When commerce improves the inspector panel, marketing's builders get better for free, and the reverse. Silo work on shared parts is how we got five Save buttons.

**How a team contributes** (same four-bucket path as the LiquidSky convergence plan):

1. Team identifies a need → checks the kit/builder kit first.
2. Exists? **Use** it. Close but not quite? **Wrap** it (thin team-local layer). Missing and generally useful? **Contribute** it through LiquidSky's normal process. Genuinely team-specific? **Keep local**, documented as such.
3. Disagreements and "is this general or local?" calls go to the council (below).

**The design-system council** — the only new meeting, and it's 30 minutes every two weeks:

- One engineer from each cloud team (commerce, marketing, service)
- One product designer (design authority)
- One LiquidSky maintainer (foundation authority)

It triages contribution proposals, resolves use/wrap/contribute/keep-local disputes, and reviews what's drifting. It is not a approval bottleneck for day-to-day work — teams build freely inside their areas; the council only touches the commons.

**Decisions needed:** one named engineer per cloud team for the council · confirmation that the builder kit is treated as commons from day one.

---

## 2 · Design → build handover — the new workflow

**Figma is not going away.** It stays what it's best at: exploring, moodboards, early concepts, quick options. What changes is the **acceptance artifact** — the thing everyone signs off on stops being a picture and becomes the working screen.

| Step | What happens | Who owns it | What it replaces |
|---|---|---|---|
| ① Explore | Sketch directions, options, flows in Figma | Product design | (unchanged) |
| ② Assemble | Build the chosen direction in the sandbox from kit parts — AI-assisted, typically days | Product design (+ AI tooling) | Weeks of high-fidelity mockup polishing |
| ③ **Accept** | PM + stakeholders click the real flow on a shared link; feedback on the real thing; sign-off happens **here** | PM decides, design facilitates | Redline handoff, spec PDFs, "final_v3" decks |
| ④ Build | Engineering builds in the product from the accepted working reference, using LiquidSky parts | Product engineering | Reverse-engineering a picture |
| ⑤ Verify | QA checks the product against the accepted reference | QA | "Does it match the mockup?" arguments |

Why not Figma-to-Figma like before: a picture can't show loading, empty tables, keyboard access, small screens, or long text — which is exactly where quality used to leak in translation. The working reference removes the translation step.

What design still delivers in Figma: early exploration, flows/IA diagrams, brand and illustration work, anything pre-direction. What design stops delivering: pixel-perfect replicas of every screen state — the sandbox holds those, and they can't drift.

**Decisions needed:** agree that step ③ (sandbox link) is the acceptance gate for new UX work · pick the first feature to run through this pipeline end-to-end (suggestion: whatever the Sales Orders pilot ships next).

---

## 3 · QA in this model — test the parts once, test the flows always

The shift: today QA re-verifies the same visual and interaction details on every screen, because every screen is bespoke. With a shared kit, those details are tested **once, centrally**, and page-level QA shrinks to what is actually new on that page.

**Component level (central, once):** every shared part passes a gate before it counts — type-check and build, tests on public behavior, a documentation page with required states, keyboard + automated accessibility checks, both themes, three screen sizes, approved visual snapshots. (This is the same gate list quoted in the showcase FAQ #15.)

**Page level (per team, per feature):** flow logic, data correctness, integration, permissions. Visual/interaction consistency is inherited from the parts — QA spot-checks it, not re-proves it.

**Regression:** approved screenshots of accepted screens become the baseline; changes that alter them must be intentional (a design decision, not a side effect). The sandbox reference screen is QA's answer to "what is this page supposed to look like?"

**QA joins the pilots** — the two pilot projects co-author the final gate checklist with QA so the bar is theirs, not imposed on them afterwards.

**Decisions needed:** one QA representative named to the pilots · agreement that the accepted sandbox screen is the acceptance reference for pilot pages.

---

## 4 · UAT plan for the design sandbox

**Already done (say this in the room):** pilot user testing ran during the build — task-based sessions on early versions of the core screens shaped the direction that was shown today. UAT-style testing is **ongoing now**, and results will be shared openly, including the misses.

**The ongoing program, per round (roughly monthly, calendar set after the pilots start):**

1. **Who:** recruited against our four personas (admin, store owner, marketing manager, support agent — `docs/personas/`), ~5 participants per persona per round. Internal proxies (CS, sales engineers) are acceptable for early rounds; customers join once the consent/logistics path is set.
2. **What:** task-based scenarios on the core flows, e.g. *find yesterday's unfulfilled orders · create a draft order · build a two-step welcome journey · edit a contact and undo it · find where to change the store's shipping rate*. Tasks come from real support tickets and PM top-tasks, not from what demos well.
3. **How:** moderated 30-minute remote sessions on the deployed sandbox link (mock data means zero risk), plus unmoderated first-click/findability tests between rounds. Where a comparable flow exists in the current product, we run the same task there for a **before/after comparison** (task success, time, misclicks).
4. **Output:** a one-page readout per round on the Confluence page — what we tested, task success, top 3 findings, what we changed because of it. Findings triage into the same three feedback lanes as section 5.
5. **Honesty rule:** results are published whether they flatter the sandbox or not; a finding that kills a pattern is the program working, not failing.

**Decisions needed:** access to recruit internal proxies from CS/sales · a PM per cloud to contribute top-tasks for the scenario bank.

---

## 5 · Feedback and change governance — including AI-coded contributions

### Feedback intake (everyone)

One Confluence page (shared after the showcase), one intake, three lanes:

- **Flow / UX** — "this flow confuses me," "this step is missing" → triaged by product design, tested in UAT where disputed.
- **Technical** — "this pattern won't survive our data volumes," "this conflicts with LiquidSky's roadmap" → triaged by the engineering pilot pair.
- **Visual** — "I'd prefer a different blue" → logged and answered by product design, which holds design authority. The direction is signed off at leadership level; genuine issues get fixed, preferences get a reply and a decision, not a redesign.

Everything gets an answer. Not everything gets an action. Silence is the only prohibited outcome.

### Contribution lanes (the sandbox is open — including to PMs and AI-assisted building)

The sandbox is open like a **workshop**, not like a wall: anyone can build in it; nothing becomes "the reference" without review. Three lanes:

| Lane | Who | What it means | Gate |
|---|---|---|---|
| **Explore** | Anyone — PMs, designers, engineers | Build on a branch, share the auto-generated preview link, argue with a clickable thing | None. Branches never merge themselves. |
| **Propose** | Author + reviewers | "This should become part of the sandbox" — opens a review | Product-design review (UX) + engineering review (code). The repo's written rails apply: kit parts only, no hardcoded styles, strict types. |
| **Promote** | Council-aware | "This should be part of the reference / a LiquidSky candidate" | Full component gate (section 3) + product-design sign-off. LiquidSky candidates then go through LiquidSky's own process like any contribution. |

Rules that make this safe:

- **The reference is protected.** The main branch — the thing stakeholders see and QA measures against — only changes through Propose/Promote. Exploration lives on branches and preview links, visible but clearly not canon.
- **AI-coded work is judged like all work** — by the artifact, not the author. The same rails that let AI-assisted building cover 171 screens (written conventions, kit-parts-only, type checks, documentation-required, human review) are the same gates a human contribution passes. There is no separate "AI lane" and no AI exemption.
- **PM prototypes are proposals, not product.** A PM's explored branch is a brilliant way to communicate intent — it enters the same Propose gate if it wants to live longer than the conversation.

**Decisions needed:** confirm the three-lane model · confirm product design as the UX gate and the pilot engineering pair as the code gate for Propose.

---

## 6 · Timing — starting alongside the Vue 2 → Vue 3 migration

The honest sequencing question: marketing still has legacy screens moving from Vue 2 to Vue 3. Does design-system work wait? **No — it starts now, away from the migration, then rides it.**

1. **Now:** the LiquidSky compatibility review (two named people, ~two weeks of work) touches no product code at all — it's analysis. The sandbox itself is already on the new stack.
2. **Pilots:** run in areas that are already Vue 3 — the component pilot and the Sales Orders page — so the migration isn't a dependency.
3. **Marketing converges as it migrates.** Every legacy screen has to be rebuilt for Vue 3 *anyway*. Rebuilding it onto system parts at the same time means each screen is paid for **once**, not twice — migrate-then-redesign would touch every screen a second time. The migration stops being a blocker and becomes the adoption vehicle for marketing.
4. **No combined dates** until the pilots report — same evidence-first rule as everything else.

**Decisions needed:** agreement in principle that migrated marketing screens land on system parts (per-screen calls stay with the marketing team) · the two compatibility-review names, which starts the clock on everything above.

---

## Decision summary (one screen)

| # | Decision | From section |
|---|---|---|
| 1 | One engineer per cloud team + confirm builder kit as commons | 1 |
| 2 | Sandbox link = acceptance gate; pick the first end-to-end feature | 2 |
| 3 | QA rep on the pilots; accepted screens = acceptance reference | 3 |
| 4 | Recruiting access + a PM per cloud for UAT top-tasks | 4 |
| 5 | Three contribution lanes + named gates | 5 |
| 6 | Converge-as-you-migrate in principle; two review names | 6 |

None of these need budget or new headcount this quarter — they need names and agreement.
