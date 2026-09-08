# Da Vinci Copilot — Product & AI Audit (2026-09)

Date: 2026-09-08 · Branch: `master` · Method: live walkthrough on the dev server as a merchant + code trace + docs/prior-audit review.

## Context

Da Vinci is the AI copilot inside the Maropost sandbox: a docked drawer (`MpDaVinciBot`), a full-page voice experience (`DaVinciExperience`), a guided-setup FTUE, and a Gemini brain. It has had three waves of work (Amboras P0 patterns, voice/TTS, guided onboarding) but no product audit since July. The user asked for a principal-level review of the copilot flow and how to improve it for online merchants. This document is the audit plus a sequenced roadmap. Slice 0 (this doc) and Slice 1 (P0 fixes: intent-first routing, whole-word widget matcher, goal-language journey intents, store-backed revenue, real card actions, docked drawer, dead view removed) landed 2026-09-08 — verified live with the eight-prompt script below. Slice 2 (store-snapshot grounding, Gemini card actions, labelled offline fallback, plus question/review guards on the routing) landed the same day; Slices 3–5 are open. Prior audit: `davinci-amboras-audit-2026-07.md`.

## Verdict

The chrome is ahead of the brain. The surface (docked panel, tool-step disclosure, draft cards with Add/Refine/Undo, voice loop, guided setup, honest AI disclosure) is genuinely strong. But a merchant who asks a real business question gets the wrong answer most of the time, because **the dashboard-widget lane intercepts nearly every prompt before the intent layer or Gemini ever see it**, and when Gemini is reached it knows nothing about the store. Today Da Vinci is a good widget builder wearing a copilot costume. The fixes are mostly routing, grounding, and honesty, not new UI.

## What I did

- Walked the live app: opened Da Vinci from the dashboard, Contacts, and Campaigns; asked two merchant-job prompts; opened the landing page and the AI experience; tested drawer persistence and dismissal.
- Traced `processQuery` → `runGeneration` lane order, the intent classifier, the widget matcher, and the Gemini grounding block.
- Reviewed `docs/davinci-amboras-audit-2026-07.md` (the only existing roadmap), the four personas, `DESIGN_AUDIT.md`, and all 25 Dv* stories.

## Findings, ranked

### F1 · CRITICAL · The widget lane hijacks merchant questions
Evidence (live): on the dashboard **and** on Contacts, "I want to win back customers who haven't bought in 90 days" returned *"Here's 1 widget I drafted for Overview"* with a **Customer Count** KPI showing email Sent/Open/Click, rationale *"You asked about customer count · last 30 days. I pulled from Retail…"*. Wrong job, wrong timeframe, invented source. "Which of my products should I put on sale this week and why?" returned the canned **Revenue · last 7 days** card.
Root cause: [MpDaVinciBot.vue:811](src/components/MpDaVinciBot.vue:811) runs the widget lane whenever `targetDashboard` resolves, and [MpDaVinciBot.vue:179](src/components/MpDaVinciBot.vue:179) falls back to `getLastViewedDashboard`, which is always set because the dashboard is the home page. [useDashboards.ts:1070](src/stores/useDashboards.ts:1070) scores metrics by *substring* `includes` with no minimum score, so "customers" → Customer Count. The intent classifier's `\b(this|last) week\b` at [useDaVinciIntents.ts:155](src/composables/useDaVinciIntents.ts:155) grabs any sentence containing "this week". `detectJourneyGoal` already knows `win-back → lapsed-buyer` ([:129](src/composables/useDaVinciIntents.ts:129)) but is only consulted when the sentence also contains a build/create verb + "journey". The July fix at [:863](src/components/MpDaVinciBot.vue:863) moved the *fallback* guard to the route, but left the widget lane on the old guard.

### F2 · CRITICAL · Gemini is grounded in the app, not the store
[useDaVinciContext.ts](src/composables/useDaVinciContext.ts) sends: page name, account name, clouds, plan, setup-guide progress, current dashboard name. No products, orders, inventory, contacts, segments, campaign results. The system prompt then forbids the model from stating any store number not in that block ([gemini.ts:45](src/server/gemini.ts:45)). Result: even when a merchant question reaches the brain, the only honest answer is generic best-practice. Meanwhile `useCommerce`, `useContacts`, `useCampaigns`, `useAnalytics` hold rich mock data the copilot never reads.

### F3 · HIGH · Numbers disagree across surfaces
Live: the Overview dashboard shows Revenue **$24,530 / 43 orders**; the copilot's revenue card in the same session says **$128,420 / 1,284 orders**. Canned in [dvIntentData.ts](src/composables/dvIntentData.ts), decoupled from the dashboards store. For a merchant, one contradiction ends trust in every number the copilot shows.

### F4 · HIGH · The "docked" panel is a dismiss-on-click overlay on laptops
Live at 1115px: the drawer has `v-navigation-drawer--temporary` + a scrim, and a click anywhere on the page closes it (verified: open → click content → closed). [App.vue:225](src/App.vue:225) sets neither `permanent` nor `mobile-breakpoint`, so Vuetify's default (`lg`, 1280px) applies. Every 13" laptop loses the copilot the moment the merchant touches the page it is helping with. The Amboras P0 "persistent co-surface" only exists on wide monitors.

### F5 · HIGH · Card actions lie about what happened
`onIntentCardAction` ([MpDaVinciBot.vue:717](src/components/MpDaVinciBot.vue:717)) answers **Save segment** with a toast "Segment saved", **Use** copy with "Copy ready to use", **Preview** with "Preview coming up…" and writes nothing anywhere. Only widgets and the campaign wizard create real objects. The disclosure says Da Vinci "won't change your account on its own", then the UI claims it did. Pick one.

### F6 · MEDIUM · Suggestions are analytics-only and not contextual
Landing chips on the dashboard: "email campaign performance", "Revenue by channel", "Top campaigns by conversion". On **Contacts**: "open rate trend", "revenue by channel widget", "recent orders table", "ticket volume" — nothing about contacts. Follow-up pills are the same three strings after every reply ("Try a different angle / Compare to YoY / Segment by region", [:194](src/components/MpDaVinciBot.vue:194)). None of the chips express a merchant *job* (recover carts, restock, win back, launch a sale). Sarah's persona quote is "show me what needs my attention, let me act on it fast" — no chip does that.

### F7 · MEDIUM · Two doors and a brochure
The app-bar button opens a menu asking the merchant to choose **Co-pilot** vs **AI experience** before they have asked anything. The sidebar repeats the pair. `/da-vinci` is a marketing page ("The complete AI solution that's easy to use", three feature cards with fake play buttons, hardcoded KPIs "+14.2% Smart Send lift"), not a workspace. `DaVinciDashboard.vue` is unreachable dead code.

### F8 · MEDIUM · Proactive layer exists but is switched off
"Needs your attention" and "Da Vinci insights" widgets exist in the library with good content (cart abandonment up 14% on mobile, low stock on 2 top sellers, DNS unverified) but are **seeded on no dashboard** and driven by literals in `useWidgetData.ts`. The orb has no badge. Nothing from Da Vinci reaches the notification centre. Only four page surfaces hand a prompt to the copilot (`JourneyBuilder`, `CreateJourneyScratch`, `StoreThemeBuilder`, `EngineEditor`); the "Da Vinci AI" cards on Marketing/Content landings link to the brochure instead of seeding a prompt.

### F9 · LOW · Hygiene
- Conversation transcript is not persisted; a reload loses the thread while the history list keeps the title.
- History, read-aloud and analytics keys are global, not account-scoped (onboarding sessions are).
- `window.confirm` for delete-all ([:1004](src/components/MpDaVinciBot.vue:1004)) beside an `MpConfirmDialog` in the history drawer.
- Header subtitle truncates to "Intelligent AI …" at panel width.
- Text transcript has no story or UI for error / rate-limit / Gemini-unavailable; the canned fallback is indistinguishable from a real answer.
- The browser pane reported a microphone-permission request on plain app load after visiting the experience once. Verify on a real browser; a mic prompt on the dashboard is a trust problem.
- Enter-to-send did not fire under synthetic key events; the handler exists ([:1010](src/components/MpDaVinciBot.vue:1010)). Verify manually, likely a tooling artefact.
- `CLAUDE.md` still says 14 Dv* surfaces; there are 18 + 7 voice.

### Keep (do not regress)
Docked width modes with in-place history rail · `DvToolSteps` disclosure · draft cards with Add → Refine → Undo and provenance chips · Stop + queued follow-up · the guided-setup stage machine and its "guidance only" honesty card · the campaign wizard that creates a *real* editable draft and says "Nothing has been sent" · plain-register copy with the butler persona confined to audio · EU AI Act disclosure · voice error copy with "Type instead".

## Merchant-job lens (from `docs/personas/`)

| Persona | Would ask | Today | Should get |
|---|---|---|---|
| Sarah, store owner, moderate tech | "What needs my attention this morning?" | Widget hijack or generic advice | Attention list from store data (failed payments, low stock, unfulfilled >24h) with one-tap actions |
| James, marketing manager | "Was my last campaign good, and what do I do next?" | Canned revenue card | Last-send stats vs list average + suggested next send (segment + subject variants) as a draft card |
| Priya, support agent | "Show me this customer's orders" | Fallback hint about widgets | Contact snapshot card with order status, link into ticket |
| David, ops admin | "Is anything broken with my integrations?" | Generic Gemini reply | Integration/DNS status from store + link to Log Inspector |

## Target experience (five rules)

1. **Jobs first, widgets last.** Route on merchant intent; the widget lane only fires on a dashboard route or an explicit widget verb.
2. **Grounded in the store.** Every reply can cite live store facts (mock stores are the store here). If a fact is unknown, say so.
3. **Draft → Review → Apply, with undo.** Cards either create a real draft object or say "Opening X with these settings". Never a success toast for nothing.
4. **One copilot, one door.** The app-bar button opens the drawer; voice is a mode inside it; the full-page experience is reached from the drawer menu and kept for onboarding/demos.
5. **Proactive with restraint.** One attention surface on the default dashboard, one orb badge, no notification spam.

## Roadmap

### Slice 0 — Deliver the audit (no code risk)
- Write this document to `docs/davinci-copilot-audit-2026-09.md` (same shape as the Amboras audit) and link it from the Amboras doc's status block.
- Fix the `CLAUDE.md` count (14 → 18 Dv*).
- Optional: publish a stakeholder artifact of the audit.

### Slice 1 — P0 routing and honesty (≈1 day, one commit per bullet)
1. **Lane order** in `runGeneration` ([MpDaVinciBot.vue:788](src/components/MpDaVinciBot.vue:788)): setup/campaign flows → pending slot → **intent classifier** → **widget lane only if** `isDashboardRoute` *or* the prompt matches an explicit widget grammar (`/\b(widget|chart|table|kpi|graph)\b|\b(add|show|plot)\b.*\b(trend|over time|by channel)\b/`) → Gemini for fallback. Mirror the same order in `DaVinciExperience.respond` (the memory rule: keep them identical).
2. **Matcher hardening** in `buildAiWidgetDraft` ([useDashboards.ts:1063](src/stores/useDashboards.ts:1063)): word-boundary keyword match, minimum score threshold, return `null` below it.
3. **Goal-language intents** in `classifyIntent` ([useDaVinciIntents.ts:135](src/composables/useDaVinciIntents.ts:135)): any sentence that hits `detectJourneyGoal` (win back, lapsed, re-engage, abandoned cart, welcome) classifies as `journey` without needing "build … journey"; tighten the revenue regex so "this week" alone does not qualify.
4. **Number coherence**: derive the revenue intent's KPIs from the dashboards/commerce store for the active account instead of `dvIntentData` literals (keep the speech template; re-bake lines only if the text changes).
5. **Honest card actions** ([MpDaVinciBot.vue:717](src/components/MpDaVinciBot.vue:717) and the experience twin): Save segment → create a real segment via the CDP store and toast "Segment created — open it"; Use copy → `router.push` to the product/content editor with the draft in query state; Preview → open the real preview or drop the button.
6. **Dock the drawer** ([App.vue:225](src/App.vue:225)): `mobile-breakpoint="md"` (or `permanent` above 1024) so the panel is a co-surface on laptops and an overlay only on tablets/phones. Check the `--copilot-w` reservation still holds.
7. Delete `src/views/DaVinci/DaVinciDashboard.vue`; replace `window.confirm` with `MpConfirmDialog`.
Verify: the eight-prompt script below routes to the expected lane; Storybook `MpDaVinciBot` stories still render; `npm run type-check`.

### Slice 2 — P1 grounding (≈1–2 days)
- Extend `useDaVinciContext` with a compact **store snapshot** (≤ ~1,200 chars): revenue/orders last 7 and 30 days, orders awaiting fulfilment, low-stock top sellers, contact and segment counts, last campaign name + open/click, active journeys, DNS/integration status. Source: `useCommerce`, `useContacts`, `useCdpEntities`, `useCampaigns`, `useAnalytics`, `useOnboarding`. Raise the server cap in `gemini.ts` accordingly.
- Extend the Gemini response schema with an optional `action` (`{ kind: 'navigate' | 'prompt' | 'draft', routeName?, prompt?, label }`) so a reply can carry one CTA card; render via `DvInsightCard.actionLabel`.
- Add transcript states: Gemini unavailable (label the canned fallback), rate-limited, aborted. Stories for each.

### Slice 3 — P1 jobs-first surface (≈1–2 days)
- `DvLandingHero` suggestions from route + store state (Contacts → "Build a win-back segment for 90-day lapsed buyers"; Orders → "Which orders are waiting on fulfilment?"; Campaigns → "How did my last send do?"; Dashboard → "What needs my attention?").
- Follow-up pills derived from the answered intent, not the static trio.
- Composer context chip ("On: Contacts · 60 contacts") that travels into the context block (Amboras P1-7).
- Single entry: app-bar button opens the drawer directly; move "AI experience" into the drawer's overflow menu and the sidebar. Turn `/da-vinci` into a workspace (recent conversations, attention list, usage meter) or redirect it to the copilot page; remove the fake play buttons.

### Slice 4 — P2 proactive (≈1 day)
- Seed **Needs your attention** on the default dashboard for every account; drive its items from store data (failed payments, low stock, unverified DNS, unfulfilled >24h). Each item → `copilot.openWithPrompt`.
- Orb badge = attention count; clears on open.
- `MpKpiCard` / `MpEmptyState` / `ModuleLandingPage` Da Vinci cards seed prompts instead of linking to the brochure (Amboras P1-6).

### Slice 5 — P2 apply-with-undo
- `DvOptionCards` + `DvInlineForm` wizard-in-chat primitives (Amboras P1-5); first consumers: segment builder and coupon draft.
- Per-message affordances: copy, 👍/👎, timestamps (Amboras P2-11).

## Verification (all slices)

Eight-prompt routing script, run in the drawer on the dashboard and on Contacts; expected lane in brackets:
1. "I want to win back customers who haven't bought in 90 days" [journey · lapsed-buyer]
2. "Which of my products should I put on sale this week and why?" [Gemini, grounded: cites top products]
3. "What needs my attention this morning?" [Gemini/attention, grounded]
4. "Show open rate trend for last 30 days" [widget]
5. "Add a recent orders table" [widget]
6. "Run a campaign to VIP customers" [campaign wizard]
7. "Build a VIP segment" [segment card → real segment]
8. "How's revenue this week?" [revenue card, numbers equal the Overview KPIs]

Plus: drawer stays open after clicking page content at 1100px and after in-app navigation; `npm run type-check`; `npm run contrast:check`; Storybook renders `Product/Da Vinci/*`; axe on the drawer.

## Assumptions

- Mock stores stand in for the merchant's live data; grounding means reading them, not adding a backend.
- Guided setup and the campaign wizard stay guidance-only in this pass; "apply" work lands in Slice 5 behind confirm + undo.
- Slice 0 and Slice 1 are the recommended first execution; Slices 2–5 are sequenced for follow-up sessions with a check-in after each (per the one-change-at-a-time feedback rule).
