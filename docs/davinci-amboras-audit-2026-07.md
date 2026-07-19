# Amboras admin audit → Da Vinci copilot learnings (2026-07-19)

Live audit of `admin.amboras.com` (AI-first "store that runs itself" commerce admin), focused on
what its assistant flow does better than — or worse than — our Da Vinci copilot, and what is worth
adopting in the design sandbox.

Audited hands-on in a logged-in session — **all modules**: home, store/theme editor, orders,
customers, products, collections, content (files), discounts, analytics + reports + live view +
finance + attribution, emails (templates + flows), A/B testing (plan-gated), integrations, support,
settings (+ plan/pricing) — plus several assistant conversations including an agentic "check my
store setup" run and the Visual Edits element-editing flow.

---

## How Amboras structures its assistant

### 1. Persistent co-surface, not an overlay drawer
The "Amboras Business Assistant" is a permanently docked right panel on **every** page. It never
covers content, never closes, and **keeps its conversation + in-flow state across route
navigation** (a guided flow started on Home was still mid-flow on /products). The panel header also
carries workspace context (current theme chip + "LIVE" status + edit/expand).

Our copilot is a `temporary` `v-navigation-drawer` overlay (App.vue) — it dims/covers the page,
closes on outside click, and reopening starts you visually from scratch.

### 2. Expand-in-place instead of route handoff
Their expand button swaps the panel to a full-width chat (content area taken over) with a
conversation-history rail — same container, same state, one click back. Our equivalent ("Open full
screen") is a route change to `DaVinciCopilot` with a 60s-stale `localStorage` snapshot handoff.

### 3. Visible agency: named tool steps
Agentic replies show a collapsible **"2 steps"** disclosure above the answer, expanding to named
steps ("Check store setup", "Suggest next steps") with tool icons. While running it shows a
"Working on it" status line. This is the single biggest trust affordance we lack — our intent layer
answers instantly with no visible work, and Gemini answers show only a skeleton.

### 4. Composer stays alive during generation
While generating: placeholder flips to **"Queue follow-up…"**, a **stop button** replaces send.
Text chat in `MpDaVinciBot` has neither stop nor queued follow-ups (voice mode does).

### 5. Deep grounding in live account state
First reply already knew: store name, "last 7 days show 0 sessions, 0 orders, ₹0 sales", "your
store is 20% set up", "Shipping is set up with 1 delivery zone", currency (₹), market (India
shipping). Recommendations are sequenced from that state ("Add products first, because your catalog
is currently empty"). Our Gemini brain gets chat history only — no route, account, or store-state
context (the deterministic intents fake this per-surface).

### 6. Guided flows (wizard-in-chat) launched from the page
Home has a **"To Do for the AI"** card — setup tasks each carrying an **ASK AI** chip. Clicking one:
- highlights the source card on the page (orange outline = page↔panel linkage), and
- starts a structured elicitation in the panel: option cards ("Add manually" / "Import from
  Shopify") → inline micro-form ("How many products do you want to add?" with an input, helper
  text "Up to 10 per session — for more, use CSV import") → "← Back" navigation within the flow.

We have multi-turn slot-filling via free text + quick-reply pills, but no option cards, no inline
forms, no back navigation, and no page-side ASK AI affordance pattern.

### 7. Context chips in the composer
In the theme editor, selecting an element pins an **"h1" chip inside the composer** — the next
message is scoped to that element. Generalizable far beyond visual editing: "On: Sales Orders",
"Widget: Revenue by channel", "Campaign: Summer sale" chips.

### 8. Visual Edits (their flagship surface, /online-store)
Live storefront preview + chat side-by-side. "Visual edits" toggle in the composer enters a picker
(overlay toolbar: "Click to edit · Esc to exit"; ⌘ keeps selecting). Clicking an element gives
**both**: a structured inspector (Content textarea, Typography, Colors) **and** an inline "Ask
Amboras…" mini-composer floating on the element, plus the composer context chip. Direct
manipulation and AI instruction are the same flow, not competing modes.

### 9. Ambient assistant furniture
- **NEXT STEPS** chips row above the composer (setup checklist, collapses from list → compact chip
  when chatting).
- Rotating merchant tips under the composer ("email campaigns drive 4x more revenue than social
  media") — the idle state teaches.
- Auto-titled conversations by intent ("Add Campaign Request", "Define your niche and target
  audience.") — titles update as the topic evolves.
- Timestamps under user bubbles; scroll-to-bottom pill.
- Even "Request a Feature" (top bar) routes through assistant conversations — the assistant is the
  universal intake surface.

---

## Full-app sweep — patterns beyond the copilot

### AI as the product's spine (not a feature)
- Home frames onboarding as **"To Do for the AI"** — every setup task carries an ASK AI chip.
- **Pricing is sold on AI**: 4 tiers (Basic/Grow/Advanced/Enterprise, monthly/yearly toggle with
  "SAVE 20%" badge, verb CTAs "Create store / Start selling / Start scaling / Talk to team",
  "Cancel anytime" under each). Bullets: "Unlimited AI usage", "AI Store Designer", "2x
  higher-converting stores out of the box with AI", "A/B/n testing autonomously", "Custom AI
  fine-tuning on your brand voice", "Custom agentic analytics — your data restructured so AI agents
  can reason over it, not just charts on a dashboard".
- Even **"Request a Feature"** (top bar) is an assistant conversation ("Add Product Feature
  Request" threads in history) — the assistant is universal intake.
- Human **Support** is deliberately separate: a floating chat popover anchored to the sidebar
  ("New Conversation"), never mixed with the AI panel.

### Plan gating done well (PLG-relevant)
A/B Testing (locked feature) renders the **full feature UI as a ghosted/blurred preview** —
Variant A vs Variant B product pages, a "LEAD" chip, a lift percentage — behind a small centered
"🔒 LOCKED · Try A/B testing by upgrading to the Grow plan · Upgrade plan" card. You *see* what
you're buying. (Note: the AI panel is dropped on gated pages — full-width teaser.)
→ Direct fit for the sandbox's PLG entitlements: `DaVinciAI`'s "Not included" grid and any
`davinci`-gated surface could use ghost-preview lock screens instead of plain cards.

### Roadmap-in-product teasers
Customers page ends with dashed **"COMING SOON"** cards: "Segment query editor — SQL-like editor:
'FROM customers SHOW… WHERE… ORDER BY' with an AI-powered 'Describe your segment' field", and
"Edit columns". Upcoming features advertised exactly where they'll live. (Also validates our
Contacts SQL-segments direction — theirs adds a natural-language→SQL field.)

### List/table conventions
- Orders: **KPI strip above the table** (Orders/Unfulfilled/Unpaid/Returns/Avg. fulfillment) with a
  **"Hide analytics"** toggle in the header; filter dropdown + search + refresh + filter + sort +
  column-visibility icon cluster.
- Customers: segmented tabs **in the page header** (Customers / Groups / Segments).
- Discounts: "Create discount" opens a **type-picker modal** first (Amount off products / Buy X get
  Y / Amount off order / Free shipping), then the form.
- Integrations: marketplace with segmented **Built-in 33 / Explore 138 / Installed 0** control +
  category chips with counts.
- Module-level status in page headers: Emails shows an "Inactive" chip + "7 templates" + a yellow
  "Setup required" badge.

### Email automation as a timeline, not a canvas
Emails > Flows renders each automation group ("order lifecycle", "refund", "cart recovery") as a
**vertical timeline list**: icon-on-a-connector-line, step name, "trigger · timing" subline
("order confirmation · immediately"), per-step edit link + active chip. Templates tab: toggle
cards with trigger label + `{{variable}}` subject preview; Abandoned Cart shows "2 reminders · 1h
· 1d" inline. A lightweight complement to our JourneyBuilder canvas — a "list view" of a journey.

### Educational empty states
- Attribution: numbered 1–4 setup-steps card (add UTMs → Google Campaign URL Builder link →
  how capture works → refresh) with 24h/7d/30d/90d range tabs already live.
- Finance: single connect-gate ("No payment provider connected → Go to Payment Settings").
- Analytics Live View: Shopify-style live globe with location search, legend chips, zoom/fullscreen.

### Settings as a URL-addressed sheet
Settings opens as a **full-screen sheet over the current page** (`?settings=general`, drag handle +
X), so context isn't lost. Left rail groups ACCOUNT / STORE / COMMERCE; content uses
definition-list rows (NAME/SLUG/STATUS/REGION) with inline Edit, and **cross-link hint cards**
("Want to group countries for shipping? Go to Shipping & Delivery…").

### Nav
Icon-only left rail that expands to a labeled flyout on hover, with inline submenu trees
(Analytics → Analytics/Reports/Live View/Finance/Attribution). Account email pinned at bottom.

### Their misses (counter-examples worth noting)
- Nav "Discounts" points at `/promotions`, but `/discounts` serves a **raw black Next.js 404** —
  no branded 404 in the admin.
- Copy-paste bug: "Buy X get Y" discount type reuses the "Amount off products" description.
- "Element selected" toast never auto-dismisses; storefront preview leaked the Next.js dev error
  overlay; KPI strips flash unlabeled skeletons.

---

## Where we're already ahead (don't regress)

- **Actionable draft cards.** Amboras returned a welcome email as *plain prose in a bubble* — no
  "use this", no editable draft, nothing to apply. Our `DvContentCard` / `DvWidgetDraftCard`
  (Add/Refine/Expand/Undo, source labels) is a strictly better pattern — the gap is wiring more
  asks into cards, not the cards themselves.
- **Voice.** Amboras has a mic button; we have a full voice conversation loop, orb state machine,
  streamed cloud TTS. No contest.
- **Provenance labels.** Our widget drafts carry "Analytics · Last 30 days" source labels; their
  answers cite nothing.
- Polish bugs on their side worth avoiding: "Element selected" toast never auto-dismissed; the
  storefront preview leaked a Next.js dev-mode error overlay (red "2 issues" chip opening a
  Turbopack console-error panel) into the admin.

Neither product has message feedback (👍/👎), per-message copy, regenerate, or citations — open
field.

---

## Prioritized improvements for the sandbox

> **Status — P0 shipped 2026-07-19.** All four P0 items below are implemented and
> verified end-to-end (type-check, Storybook build, live drive). Conversation now lives in
> `useCopilot` (survives navigation + close/reopen); "Full width" grows the panel in place
> with a history rail; `DvToolSteps` shows live/collapsed named steps; the Gemini brain is
> grounded (verified — a reply cited the account name "Scooter Village" from the context
> block); text chat has a Stop button + "Queue a follow-up…". One guard fix along the way:
> open-ended questions now route to Gemini off dashboard *routes* (was gated on the default
> dashboard's existence, which made grounding nearly unreachable). P1/P1.5/P2 remain open.

### P0 — the flow-level gaps
1. **Docked (non-modal) copilot mode.** Make the drawer a persistent right co-surface that squeezes
   content (like the Settings rail does) instead of a temporary overlay; keep conversation + flow
   state across route changes. Expand should grow in place (400 → 720 → full content width), not
   route-hop via localStorage.
2. **Tool-step disclosure component (`DvToolSteps`).** Collapsible "N steps" header + named steps
   with icons, running/done states, "Working on it" status. Even with our deterministic intents,
   *staging* the reply ("Checking Analytics · Last 30 days" → "Drafting widget") buys believability;
   for Gemini calls it's honest UI.
3. **Ground the Gemini brain.** Send a compact context block with each `/api/gemini` call: route
   name, active account/dashboard, key mock-store stats (revenue, orders, top segment), and
   subscription clouds. This is what made Amboras feel like *my* assistant instead of a chatbot.
4. **Stop + queued follow-up in text chat.** Abort control on generate; composer stays enabled with
   a "Queue follow-up…" placeholder.

### P1 — the patterns that make it feel AI-native
5. **Wizard-in-chat primitives.** `DvOptionCards` (2–3 selectable cards) and `DvInlineForm` (1–2
   fields + helper text + back link) rendered as chat turns, feeding the existing intent
   slot-filling. Our campaign/journey intents already ask follow-ups — give them structure.
6. **"Ask Da Vinci" page affordances.** A small chip/button pattern on empty states, setup cards,
   and KPI cards that calls `copilot.openWithPrompt(...)` — plus highlight-the-source-card linkage
   when the panel opens. (`ModuleLandingPage` setup cards and `MpEmptyState` are natural hosts.)
7. **Composer context chips.** Auto-attach current page/entity as a dismissible chip in
   `MpDaVinciBot`'s composer ("On: Sales Orders"); the chip travels with the message to the intent
   layer / Gemini context.
8. **Next-steps strip above the composer.** Surface per-account setup/next-best-actions as compact
   chips (we have PLG entitlements + mock onboarding state to drive it).

### P1.5 — full-app patterns (non-copilot)
- **Ghost-preview plan gates.** Reusable "locked feature" treatment: blurred mock of the real
  feature + centered lock card + upgrade CTA, driven by `usePlg` entitlements. Apply to
  Da Vinci-gated surfaces and PLG demo flows.
- **COMING SOON teaser cards** (dashed variant of `MpOptionCard`/setup card) for roadmap items on
  module landing pages.
- **Journey list view.** A vertical-timeline read view of a journey (step icon on connector line,
  "trigger · timing" subline, per-step status toggle) alongside the canvas.
- **Educational empty states.** Extend `MpEmptyState` usage with an optional numbered-steps variant
  (Attribution-style) for setup-heavy pages.
- **NL→SQL helper** on the Contacts SQL segments editor ("Describe your segment" field feeding the
  SQL textarea) — ties the copilot into an existing sandbox surface.

### P2 — polish and delight
9. **Idle tips** rotating under the composer (merchant best-practice one-liners; we already have
   the disclaimer line slot).
10. **Auto-titled conversations** in `useDaVinciHistory` (derive from first intent, update on
    topic shift) — we already infer icons by keyword.
11. **Message affordances**: timestamps, scroll-to-bottom pill, per-message copy, 👍/👎 (beats both
    products).
12. **Visual-edits story for a demo surface** — e.g. email/content preview with element-picker +
    inline "Ask Da Vinci" mini-composer + inspector. Big build; showcase-worthy but only after
    P0/P1.

---

## Reference map (sandbox files these land in)

| Improvement | Files |
|---|---|
| Docked mode / expand-in-place | `src/App.vue` (drawer host), `src/stores/useCopilot.ts` |
| Tool steps, stop, queue, chips, tips | `src/components/MpDaVinciBot.vue` + new `src/components/copilot/DvToolSteps.vue`, `DvOptionCards.vue`, `DvInlineForm.vue` |
| Gemini grounding | `src/services/geminiClient.ts`, `src/server/gemini.ts`, callers in `src/composables/useDaVinciIntents.ts` |
| Page ASK-AI affordances | `ModuleLandingPage.vue`, `MpEmptyState.vue`, `MpKpiCard.vue` → `copilot.openWithPrompt` |
| Auto-titles | `src/composables/useDaVinciHistory.ts` |
