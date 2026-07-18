# FAQ Crib Sheet — Say-It-Out-Loud Answers

Companion to [showcase-presentation-script.md](./showcase-presentation-script.md). Same strategy as the formal Q&A in [monday-showcase-talk-track.md](./monday-showcase-talk-track.md) — these are the *spoken* versions. Each has an answer you can say verbatim and an *if pushed* line for the follow-up.

Golden rules: never promise a date or a percentage before the pilots · never say "production-ready" · "converge into LiquidSky," never "replace."

---

## Big picture

**1. "Is this the real product? What am I actually looking at?"**

> It's a faithful mirror of it — same stack the frontend uses: Vue 3, TypeScript, Vuetify, Pinia. The screens, interactions and states are real; the data behind them is mock, on purpose. Think of it as the product's stunt double: does everything the real one does, just nobody gets hurt.

*If pushed:* "Real code, fake data. That split is exactly what makes it safe to move fast here."

**2. "Is it production-ready?"**

> No — and honestly, that's a feature. Production-ready means real APIs, permissions, analytics, error budgets, release governance. This is the *reference* those things get built against. It proves what right looks like; the product makes right reliable.

*If pushed:* "The pilots are precisely the step where 'looks right here' becomes 'works right there.'"

**3. "What exactly are we approving today?"**

> Two things, both small: the visual and interaction direction — which product design considers final — and the next step, a LiquidSky compatibility review with named owners. Not component APIs, not a migration date, not a rewrite.

*If pushed:* "If you leave agreeing on the direction and the review, today was a success."

**4. "Why a working sandbox instead of Figma mockups?"**

> Because mockups are on their best behavior. They don't have loading states, awkward German translations, 4,000-row tables, or keyboards. Running code exposes what static screens politely hide — responsive truth, empty and error states, focus order. And engineers get something copyable instead of something interpretable.

*If pushed:* "Reviews here happen against a URL, not a PDF — that alone changed our decision speed."

---

## For the PM

**5. "What does this actually speed up?"**

> Three loops. Prototyping: an idea becomes a clickable screen in hours because the components and conventions already exist. Review: every push gets a Vercel URL, so stakeholders click the real flow on their own laptop. And build: engineers start from a working reference instead of reverse-engineering a picture.

*If pushed:* "Most of what you saw today was assembled on system rails in days, not quarters — that loop is the product here."

**6. "Can we user-test or stakeholder-review with it?"**

> Yes — that's its day job. It's deployed, it's clickable, and flows behave like the real thing. Perfect for concept tests, walkthroughs, and 'which of these two' questions. The one caveat: it's mock data, so we test *flows and comprehension*, not data accuracy.

*If pushed:* "We can spin a variant behind a URL flag for an A/B walkthrough without touching production anything."

**7. "Can sales use it for demos?"**

> Technically today, responsibly after a small pass — a seeded 'demo-safe' account, a guardrail list, and a short do-not-click doc. Worth doing deliberately rather than letting it happen by accident.

*If pushed:* "Let's park it as a fast-follow — it's a cheap win once the room agrees on the main plan."

**8. "How will we know the new design is succeeding?"**

> We set baselines during the pilots, then track things we can actually count: time to build a representative page, share of pilot screens with zero local style overrides, accessibility and visual-regression pass rates, duplicate patterns retired, adoption per area. No invented percentages before baselines exist — I'd rather under-promise.

*If pushed:* "The Sales Orders pilot is where the first real numbers come from."

**9. "What does maintaining this cost us?"**

> Modest and mostly absorbed: it's one repo, no backend, mock data, and AI-assisted upkeep on system rails. The honest cost is curation — keeping it in sync with decisions — which is design-team time we already spend, just now it lands somewhere executable. The convergence plan is what keeps it from ever becoming a second product to maintain.

*If pushed:* "The expensive alternative is the status quo: every team re-deciding buttons, forever."

---

## For engineering

**10. "Are we replacing LiquidSky?"**

> No — the opposite. LiquidSky stays the shared foundation and the destination. This sandbox is the evidence pile: validated requirements, proven compounds, acceptance examples. Where LiquidSky already covers a need, we use it. Where there's a real gap, we propose a contribution through its normal process.

*If pushed:* "Ask number six on my list is literally 'no parallel package ships from this sandbox.' I'm volunteering the constraint."

**11. "Why not just publish this sandbox as the library?"**

> Because then we'd have two of everything — primitives, tokens, docs, release trains — and every team choosing between them while the two drift apart. One supported path beats two half-supported ones. This repo earns its keep as the reference, not as a package.

*If pushed:* "The graveyard of internal platforms is full of 'temporary second libraries.' Not adding a headstone."

**12. "Can we lift components straight into the product?"**

> Some, nearly — the low-coupling ones like page header, confirm dialog, form drawer, empty states. That's exactly why they're the facade pilot. Others import stores, router state, or mock catalogs and need their edges cleaned to props-and-events first. The compatibility review classifies every one: reuse, wrap, contribute, or stays-local.

*If pushed:* "That classification is a two-week review, not a leap of faith — that's ask number three."

**13. "Are we locked into Vuetify?"**

> Vuetify is our implementation foundation, not our design system — the distinction matters. The look and behavior live in tokens and our compound APIs; Vuetify supplies primitives underneath. Teams build against *our* contracts, so if the foundation ever had to change, the blast radius is inside the compounds, not across every page. Also worth saying: the product already runs on Vuetify — this adds discipline, not lock-in.

*If pushed:* "The riskier lock-in is raw Vuetify configured differently on every page — which is the world without this."

**14. "AI wrote chunks of this — why should we trust the code?"**

> Same way we trust human code: guardrails and review, not vibes. The AI works inside tight rails — the token contract, documented conventions, strict TypeScript, and stories for every component — and everything lands through type-check, build, and a human pass. And remember what this repo is: the reference. Anything promoted to LiquidSky goes through its full review and test gates like any other contribution.
>
> The honest headline is different, though: with the rails in place, AI-assisted building is why the sandbox covers 171 screens. That's the capability I want the org to inherit.

*If pushed:* "Judge the artifact, not the author — it's all in the repo, and I'd love a skeptical code review. Genuinely."

**15. "What's the accessibility story — really?"**

> Baseline done, honestly incomplete. The core components have keyboard access, focus management, labels, and dialog semantics, and every story carries an axe panel. What's *not* true yet: axe isn't an automated release gate, and long-tail product surfaces haven't all been audited. Anything shared through LiquidSky ships with automated plus manual accessibility checks — that's in the quality gates.

*If pushed:* "Type-check and build, tests on public behavior, stories for required states, axe plus keyboard review, both themes, three breakpoints, visual snapshots, a consumer smoke test — that's the gate list for shared components."

---

## For design

**16. "Why doesn't every page look identical?"**

> Because consistency lives at the right altitude. List pages, detail pages, settings — those follow strict recipes. But a journey builder isn't a table, and pretending otherwise is how you get consistent-but-unusable. Specialized workspaces share the deeper layers — tokens, fields, status colors, focus behavior — so they're unmistakably the same family without wearing the same uniform.

*If pushed:* "You saw it live: the builder's node panel uses the same fields and statuses as the orders table."

**17. "Where does Figma fit?"**

> For this initiative, the running interface and Storybook are the source of truth, because they can't lie about states, responsiveness, or accessibility. Designers review deployed Storybook and real routes; approved visual snapshots protect the result. That avoids maintaining a parallel Figma library that drifts. Figma stays wonderful for early exploration — it's just not the contract.

*If pushed:* "We sync tokens outward when needed — the direction of truth just points from code."

**18. "What's the dark-mode story for the real product?"**

> The system makes it nearly free at the component level — you watched 297 tokens re-resolve in one flip. What the sandbox proves is that the *pattern* works: semantic tokens everywhere, zero hardcoded colors. Shipping dark mode in production is then a token-mapping and QA exercise, not a redesign.

*If pushed:* "The flip you saw included this deck — there is no special-cased surface."

---

## The spicy ones

**19. "How long will the migration take?"**

> The only honest answer today: the pilots tell us. Anyone who gives you a total migration date before reviewing LiquidSky's source and running one real page through it is guessing with confidence. Phase one is scoped in weeks, and it converts unknowns into an estimate you can actually hold me to.

*If pushed:* "I'll trade you: names for the review this week, evidence-based estimate at the end of it."

**20. "Two token sources exist right now. Which wins?"**

> Long-term there's exactly one centrally owned token contract, and it lives with LiquidSky. The sandbox tokens are the approved design *requirement* — the input to that mapping, not a competing pipeline. Every difference gets triaged: correction, theme, component token, or product exception. Central design system approves shared changes.

*If pushed:* "The token mapping is deliverable one of the compatibility review."

**21. "Isn't this throwaway work? Aren't we building things twice?"**

> Fair — and mostly no. The expensive part of design-system work was never typing components; it's the hundreds of decisions — hierarchy, spacing, states, behavior. Those are made, validated, and documented here; they transfer whole. Some glue code is disposable by design — that's the cheapest insurance we ever bought against rebuilding the *product* wrong. And a chunk isn't rebuilt at all: reference, acceptance environment, prototype rig — that's this repo's permanent job.

*If pushed:* "A film set isn't the building — but nobody calls the set 'throwaway' while it's saving the movie."

**22. "What if the LiquidSky review says most of it can't merge?"**

> Then we learned that for the price of a two-week review instead of a two-quarter rewrite — that's the point of doing it first. Even in the worst case, the direction, recipes, and acceptance references stay valid; the delivery mechanism adapts — more wrappers, more variants, slower merge. The design decisions survive any of those outcomes.

*If pushed:* "The review has four outcomes per component, and 'keep it product-local' is a legitimate one, not a failure."

**23. "Who owns what, going forward?"**

> Clean seams: product design owns visual intent, usage rules, and acceptance. The central design-system team owns LiquidSky — APIs, tokens, releases, deprecations. Product frontend owns facades, recipes, and integration. Leadership owns priorities and staffing. Nobody's job moves to my laptop — the sandbox just gives everyone the same picture to point at.

*If pushed:* "That's why ask three is two named people — ownership starts with names, not org charts."

---

*Parking-lot phrase for anything unanswerable:* "Great question — I don't want to hand-wave it. Let me take it into the compatibility review and come back with evidence instead of adjectives."
