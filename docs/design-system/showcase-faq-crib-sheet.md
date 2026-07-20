# FAQ Crib Sheet — Say-It-Out-Loud Answers

Companion to [leadership-showcase-script.md](./leadership-showcase-script.md). Every answer is written to be **spoken**, in plain language a non-technical listener follows on first hearing. Each has an *If pushed:* line for the follow-up.

Golden rules: never promise a date or a percentage before the pilots · never say "production-ready" · "converge into LiquidSky," never "replace."

---

## Big picture

**1. "Is this the real product? What am I actually looking at?"**

> It's a working copy of it. The screens are real, the buttons really work, the flows behave like the real thing. The only fake part is the data — the customers and orders are made up, on purpose. Think of it as the product's stunt double: does everything the real one does, and nobody gets hurt.

*If pushed:* "Real screens, pretend data. That split is exactly what makes it safe to move fast here."

**2. "Is it production-ready?"**

> No — and honestly, that's by design. "Production-ready" means real customer data, security, permissions, support — a long list this deliberately doesn't have. This is the *reference*: it shows what right looks like, so the real product can be built to match it.

*If pushed:* "The pilots are exactly the step where 'looks right here' becomes 'works right there.'"

**3. "What exactly are we approving today?"**

> Two small things. First, the look and behavior you saw — agreeing that's the direction. Second, the next step: a two-week review with two named people to check what fits into LiquidSky. Not a rewrite, not a budget, not a migration date.

*If pushed:* "If you leave agreeing on the direction and the review, today was a success."

**4. "Why a working sandbox instead of design mockups?"**

> Because mockups are always on their best behavior. They never show a slow connection, an empty table, a long German word, or a small laptop screen. Running software shows all of that — the stuff that actually trips customers up. And engineers get something they can copy, instead of a picture they have to interpret.

*If pushed:* "Reviews here happen against a link you can click, not a PDF — that alone changed our decision speed."

---

## For the PM

**5. "What does this actually speed up?"**

> Three things. Trying ideas: a new screen can be clickable in a day, because the parts already exist. Reviewing: every change gets a private web link, so you click the real flow on your own laptop instead of squinting at a picture in a meeting. And building: engineers start from a working example instead of guessing from a mockup.

*If pushed:* "Most of what you saw today was assembled from the kit in days, not quarters — that speed is the product here."

**6. "Can we user-test or stakeholder-review with it?"**

> Yes — that's its day job. It's live on the web, it's clickable, and flows behave like the real thing. Perfect for "does this make sense?" tests and "which of these two?" questions. One caveat: the data is made up, so we test whether people *understand* the screens, not whether the numbers are right.

*If pushed:* "We can put two versions of a flow behind two links and watch which one people get through faster — without touching the real product."

**7. "Can sales use it for demos?"**

> Nearly. Today it would technically work; to do it responsibly we'd want a small pass first — a tidy demo account, and a short list of what to click and what to skip. Worth doing on purpose rather than letting it happen by accident.

*If pushed:* "Let's park it as a fast follow — it's a cheap win once we agree on the main plan."

**8. "How will we know the new design is succeeding?"**

> We measure things we can actually count, starting from the pilots: how long it takes to build a typical page, how many screens use the shared parts with no local tweaks, how many duplicate patterns we retire, and accessibility checks passing. I'm deliberately not inventing target percentages today — first we measure where we are, then we set targets.

*If pushed:* "The Sales Orders pilot is where the first real numbers come from."

**9. "What does maintaining this cost us?"**

> Modest, and mostly time we already spend. There's no server and no real data to look after. The honest cost is keeping it in sync with our decisions — which is design work we do anyway; now it lands somewhere clickable instead of in a slide nobody reopens. And the convergence plan exists precisely so this never becomes a second product to maintain.

*If pushed:* "The expensive option is the status quo: every team re-deciding what a Save button looks like, forever."

---

## For engineering

**10. "Are we replacing LiquidSky?"**

> No — the opposite. LiquidSky stays the shared foundation and the destination. The sandbox is the evidence: worked examples, tested patterns, written-down requirements. Where LiquidSky already covers a need, we use it. Where there's a genuine gap, we contribute through its normal process.

*If pushed:* "My sixth ask is literally 'no separate library ever ships from this sandbox.' I'm volunteering the constraint."

**11. "Why not just publish this sandbox as the library?"**

> Because then we'd have two of everything — two button sets, two documentation sites, two release schedules — and every team stuck choosing between them while they slowly drift apart. One supported path beats two half-supported ones. This project earns its keep as the reference, not as a second library.

*If pushed:* "The graveyard of internal platforms is full of 'temporary second libraries.' Not adding a headstone."

**12. "Can we lift components straight into the product?"**

> Some, nearly as-is — the simple, self-contained ones like page headers, dialogs, and empty states. That's exactly why they're the first pilot. Others are tangled up with the sandbox's fake data and need their edges cleaned first. The compatibility review sorts every part into one of four buckets: use as-is, wrap, contribute, or keep local.

*If pushed:* "That sorting is a two-week review, not a leap of faith — that's ask number three."

**13. "Are we locked into Vuetify?"** *(Vuetify = the off-the-shelf component toolkit underneath)*

> The look and behavior live in *our* rules and *our* parts; Vuetify just supplies raw material underneath. Teams build against our parts, so if the raw material ever had to change, the repair happens inside the kit — not across every page of the product. Also worth saying: the product already uses Vuetify today. This adds discipline; it doesn't add lock-in.

*If pushed:* "The riskier lock-in is what we have now — the same toolkit configured differently on every page."

**14. "AI wrote chunks of this — why should we trust the code?"**

> The same way we trust human code: rules and review, not vibes. The AI works inside tight guardrails — the written-down design rules, strict type checking, and a documentation page required for every part — and everything passes automated checks plus a human read. And remember what this repo is: the reference. Anything promoted into LiquidSky goes through LiquidSky's full review like any other contribution.
>
> The honest headline is the opposite of scary: those guardrails are *why* one team could cover 171 screens. That capability is the thing I want the org to inherit.

*If pushed:* "Judge the artifact, not the author — it's all in the repo, and I'd genuinely welcome a skeptical code review."

**15. "What's the accessibility story — really?"**

> Baseline done, honestly incomplete. The core parts work with a keyboard, have proper labels, and every documentation page carries an automated accessibility check. What's *not* true yet: those checks don't block releases automatically, and the long tail of screens hasn't all been audited. Anything shared through LiquidSky ships with automated plus manual accessibility checks — that's in its quality gates.

*If pushed:* "For shared parts the gate list is real: automated checks, keyboard review, both themes, three screen sizes, visual snapshots."

---

## For design

**16. "Why doesn't every page look identical?"**

> Because consistency belongs at the right level. List pages, detail pages, settings — those follow strict recipes. But a flow-builder isn't a table, and forcing it to look like one is how you get consistent-but-unusable. Specialist screens share the deeper layers — colors, fields, statuses, keyboard behavior — so they're clearly the same family without wearing the same uniform.

*If pushed:* "You saw it live: the journey builder's side panel uses the same fields and status colors as the orders table."

**17. "Where does Figma fit?"**

> For this initiative, the running screens and their documentation are the source of truth — because running software can't lie about how it behaves. Figma stays wonderful for early sketching and exploring; it's just not the contract we build against. That way we avoid maintaining a parallel picture-library that slowly drifts away from reality.

*If pushed:* "We can sync design values out to Figma when needed — truth just flows from the working screens outward."

**18. "What's the dark-mode story for the real product?"**

> You watched it: one keypress, 297 written-down values flip to their dark versions, every screen updates. What the sandbox proves is the *method* — every color is looked up from the shared list, nothing hard-wired. Getting dark mode into the real product then becomes careful bookkeeping and testing, not a redesign.

*If pushed:* "The flip you saw had no special-cased screens — that's the point."

---

## The spicy ones

**19. "How long will the migration take?"**

> The only honest answer today: the pilots tell us. Anyone who gives you a total migration date before running one real page through the process is guessing with confidence. Phase one is measured in weeks, and it converts my unknowns into an estimate you can actually hold me to.

*If pushed:* "I'll trade you: names for the review this week, an evidence-based estimate at the end of it."

**20. "Two sets of design values exist right now — the sandbox's and LiquidSky's. Which wins?"**

> Long-term there's exactly one list, and it lives with LiquidSky. The sandbox's values are the approved design *input* to that list — not a competitor. Every difference gets triaged one by one: fix it, theme it, or record it as a deliberate exception. The central design-system team approves anything shared.

*If pushed:* "That value-by-value mapping is deliverable number one of the compatibility review."

**21. "Isn't this throwaway work? Aren't we building things twice?"**

> Fair question — and mostly no. The expensive part of this work was never typing the code; it's the hundreds of decisions — spacing, hierarchy, behavior, what happens when a table is empty. Those decisions are made, tested, and written down here, and they transfer whole. Some glue code is disposable by design — cheap insurance against rebuilding the *product* wrong. And part of it is never thrown away at all: the reference and prototyping environment is this project's permanent job.

*If pushed:* "A film set isn't the building — but nobody calls the set 'throwaway' while it's saving the movie."

**22. "What if the LiquidSky review says most of it can't merge?"**

> Then we learned that for the price of a two-week review instead of a two-quarter rewrite — which is exactly why the review comes first. Even in the worst case, the design decisions, the page recipes, and the working reference stay valid; only the delivery route changes — more wrapping, slower merging. The decisions survive any of those outcomes.

*If pushed:* "The review has four outcomes per part, and 'keep it local' is a legitimate one, not a failure."

**23. "Who owns what, going forward?"**

> Clean lines. Product design owns how things should look and behave, and what counts as done. The central design-system team owns LiquidSky — the shared parts, their releases. Product engineering owns putting the parts to work in the product. Leadership owns priorities. Nobody's job moves to my laptop — the sandbox just gives everyone the same picture to point at.

*If pushed:* "That's why ask three is two named people — ownership starts with names, not org charts."

---

*Parking-lot phrase for anything unanswerable:* "Great question — I don't want to hand-wave it. Let me take it into the compatibility review and come back with evidence instead of adjectives."
