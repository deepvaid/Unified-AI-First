# Motion & Flow Composition Research

Research pass for the "confident editorial" motion evolution — signature easing `cubic-bezier(0.2, 0.8, 0.2, 1)`, staggered entrances, no playful/bouncy motion. Sources: Mobbin flow/screen captures (static frames — motion is inferred from what changes between frames, not observed directly) plus published motion specs from Material Design 3, IBM Carbon, and reverse-engineered Linear/Stripe conventions.

Current MB_Option2 ramp for reference (`src/design-tokens/tokens.json` → `motion`):
`instant 80ms · fast 140ms · base 200ms · slow 320ms · entrance 400ms` · easing `standard cubic-bezier(0.2,0.8,0.2,1)` / `exit cubic-bezier(0.4,0,1,1)` · stagger step `40ms`.

---

## 1. Linear — creating a new issue

Flows: [Creating an issue](https://mobbin.com/flows/b49200b2-cfac-4c16-aae9-55aecdb91d09) · [Creating a new issue](https://mobbin.com/flows/3528703d-a543-414c-8f6e-ccf2442bff2f) · [Creating an issue (from comment)](https://mobbin.com/flows/8f7ac78d-938d-44b2-a43e-b746bc6beda4)

- The "new issue" surface is a small, centered floating card (~380×220px) over an **undimmed** background — no scrim. It reads as a lightweight overlay, not a heavyweight modal — consistent with a fast, keyboard-first tool.
- Fields are compact and inline: title → description → a single row of small pill controls (status, priority, assignee, project, labels, estimate). Adding a sub-issue or attachment appends to the bottom of the same card rather than opening a nested screen — the card grows in place.
- There is no dedicated success toast on create: the modal closes and the new row appears at the top of the relevant group in the list instantly. **The appearing row is the confirmation.**
- Reverse-engineered from Linear's own stylesheet (via [performance.dev's breakdown](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)): `--speed-quickTransition: .1s` (100ms), `--speed-highlightFadeOut: .15s` (150ms), `--speed-regularTransition: .25s` (250ms), `--speed-slowTransition: .35s` (350ms); background-color transitions at `0.12s`, transform at `0.15s`. Linear also uses **asymmetric timing**: hover highlights and panels appear instantly, then fade out over 150ms on dismissal — entrance is free, exit is animated.

## 2. Stripe — creating an invoice

Flows: [Sending an invoice](https://mobbin.com/flows/baa5d966-eaef-4fa7-b515-2a4ccd9b6832) · [Creating an invoice](https://mobbin.com/flows/03c71446-31eb-497b-b715-3419cf8cd922) · [Creating a product](https://mobbin.com/flows/f981c3df-02a1-47aa-a22f-dfa488aae554)

- The invoice editor is a **full-screen takeover** (explicit "X" close, top-left) with a two-column layout: form on the left, a live-updating invoice preview on the right that re-renders as fields change. This is the enterprise pattern for a task substantial enough to warrant leaving the list context, but it still isn't a hard page navigation.
- Autosave feedback is **textual only**, in the header: "Draft saved 8 seconds ago" — no icon, no toast, no color change. This is the calmest possible confirmation tier, reserved for high-frequency background persistence.
- On send, a small dark **toast** appears bottom-center ("Invoice sent to [email]...") and auto-dismisses — this is the one moment in the flow that gets a toast, because it's a discrete, user-initiated, terminal action (vs. the continuous autosave).
- The subscription/product-creation flow (a heavier, multi-entity task) uses a **stepper pattern** instead: right-side preview panel stays fixed while the left panel's step content swaps (Customer → Pricing → Review), with Back/Next controls pinned to the panel footer. Adding a line item opens as a secondary panel sliding over the same column — nested overlay, not a new page.

## 3. Wise — sending money with a review step

Flow: [Sending money](https://mobbin.com/flows/77c0a951-fd82-4d40-8146-e54549e9319b) · [Scheduling a transfer](https://mobbin.com/flows/122348e0-58f9-4f48-9559-cbc9baae89d8)

- A persistent top **stepper bar** (Recipient → Amount → Review → Pay) stays visible for the entire task — filled/solid for completed steps, bold for current, light gray for upcoming. Unlike Stripe's stepper (which swaps step content in place), this one keeps the whole recipient/amount summary rebuilding underneath it as you move forward.
- The **Review** step re-lists every prior decision as a row with an inline "Change" link — edits happen in place, no back-navigation required.
- The **one true modal** in the entire flow is the passkey/biometric confirmation — a centered card over a dimmed backdrop, reserved specifically for the security-critical, irreversible step. Every other transition in the flow is inline, panel-based, or full-bleed — this confirms modals-with-scrim should be reserved for genuinely blocking, high-stakes moments, not routine steps.
- Completion is a **full-bleed, inverted-color takeover** ("YOUR TRANSFERS ARE SCHEDULED" on a dark green background, large icon, oversized headline) — distinctly different chrome from the rest of the app, used once, at the very end.
- After completion, a lightweight in-app **micro-survey modal** appears, and submitting it triggers a small toast ("Thanks! We appreciate your feedback.") — a secondary, lower-stakes action gets the lightweight toast treatment even inside an otherwise high-ceremony flow.

## 4. Notion — opening a page from a database table

Flows: [Adding a button property](https://mobbin.com/flows/804e66f2-d438-4a86-889d-26ac255b6d25) · [Creating a database table](https://mobbin.com/flows/4892e6e0-7b24-40b0-bd6e-f89160746b62)

- Clicking a database row does **not** perform a page navigation — it opens a "center peek": a floating card that overlays the table (slightly dimming it) showing the page's full properties and content, closable back to the exact same table scroll position. This is Notion's dedicated table→detail pattern, purpose-built to avoid a full context switch for what is still fundamentally "look at this row in more detail."
- Property edits (dropdowns, adding a column, adding a button property) happen via small **anchored popovers** near the clicked cell — never a modal for a single-field edit.
- There is no toast for property edits — the value updating in place, optimistically, **is** the confirmation. Same principle as Linear's row-appears-in-list pattern.

## 5. Intercom — resolving a conversation

Flows: [Adding a macro](https://mobbin.com/flows/0b2bd43c-00fc-4cd6-a962-43f85c8a96bc) · [Replying to a conversation](https://mobbin.com/flows/51f89d7e-720a-460c-94b6-9bb849e5c77c) · [Filtering and sorting inbox](https://mobbin.com/flows/6211d06a-abe1-4112-92c9-a37a676704f4)

- The three-pane workspace (inbox list | thread | detail panel) never restructures. Resolving/closing a conversation is a single top-right button; the conversation animates out of the "Open" list and the **count decrements** — that shrinking counter is the primary confirmation, not a toast.
- Macros and search open as **floating command-palette panels** anchored near the compose box or triggered by ⌘K — fast, keyboard-driven, inserting content directly into the composer rather than requiring a separate confirm step.
- Status/system messages that do need to surface (e.g., a macro applying a reply) appear as small **inline messages within the thread itself**, not as toasts layered over the UI chrome.

## 6. Screens — success confirmation after completing setup

[Fresha](https://mobbin.com/screens/eb4e6fca-6168-448b-88c0-f09b1748d2a4) · [Customer.io](https://mobbin.com/screens/51f50d54-9d14-49ad-9451-00ee3f8ee5d3) · [incident.io (confetti)](https://mobbin.com/screens/8c2d772c-0f84-4c51-bcae-2e8840a51271) · [incident.io (settled)](https://mobbin.com/screens/e637f80b-cf6c-4aa7-865c-598c3514b25d) · [HubSpot](https://mobbin.com/screens/7a5b53b9-c97d-4eb3-b39e-a51d9d93a42f) · [Upwork](https://mobbin.com/screens/d4958696-74b8-4ede-845d-574c6fa848c9)

Two recurring patterns:
- **Full takeover** (Fresha's purple checkmark orb, incident.io's confetti + "All set!", Upwork's illustration + headline): centered icon, one-line headline, at most one CTA, no persistent nav chrome. The highest-ceremony confirmation, reserved for the true end of an onboarding/setup wizard. incident.io's confetti is a one-off decorative burst that settles to a static state within roughly a second — it's a flourish, not a loop, and it appears exactly once per lifetime action.
- **In-context completion** (Customer.io's "Congratulations, you did it!" rendered inside the existing setup-guide layout with sidebar still visible; HubSpot's step-4-of-4 with progress dots still present + a "Done" button): the wizard shell stays, only the step content changes to a celebratory message. Lower ceremony than a full takeover, appropriate when the setup is one part of a larger persistent surface (not the whole app).

## 7. Screens — toast notification confirming save

[Sora](https://mobbin.com/screens/7d21ca74-eb92-4e2a-a325-18e5b796ef15) · [June](https://mobbin.com/screens/6fd18454-3ac0-4deb-bd6b-75fe5862f5a8) · [Maze](https://mobbin.com/screens/30545233-1c08-436f-959b-253654674e61) · [Preply](https://mobbin.com/screens/45e17072-c050-4473-b293-3e2dda2a6f0b) · [Workable](https://mobbin.com/screens/3fb4c8f8-ca3e-426d-9527-a73c4522f259) · [Lovable](https://mobbin.com/screens/3d6804ac-999b-446c-ba5c-ce03fc3803cc)

- Toasts are consistently **small, corner-anchored (top-right or bottom-right), single-line, icon + text**, auto-dismissing, and never block underlying content (Sora's "Saved username", Maze's "Confirmed!", Lovable's "Email verified").
- Workable shows a **two-tier escalation**: a routine save gets a plain toast, but a bigger event ("Survey created") pairs a toast with a **modal** offering next-step actions (include in a message, add to templates, automate). Toast = ambient acknowledgment; modal = only when there's a meaningful next decision to offer.
- Lovable pairs a toast with a secondary status line ("Redirecting…") for a transitional confirmation ahead of an automatic navigation — the toast confirms what happened, the caption tells you what happens next.

---

## Published motion specs (sanity check)

**Material Design 3** ([easing-and-duration spec](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)) publishes a granular duration scale and two easing families:
- Durations run `short1–4 (50/100/150/200ms)` → `medium1–4 (250/300/350/400ms)` → `long1–4 (450/500/550/600ms)` → `extraLong1–4 (700/800/900/1000ms)`.
- **Standard** family (no overshoot): `standard cubic-bezier(0.2,0,0,1)`, `standard-decelerate cubic-bezier(0,0,0,1)`, `standard-accelerate cubic-bezier(0.3,0,1,1)`.
- **Emphasized** family (spatial motion, overshoots into place — M3's "expressive" register): a multi-point path curve for the full transition, plus `emphasized-decelerate cubic-bezier(0.05,0.7,0.1,1)` and `emphasized-accelerate cubic-bezier(0.3,0,0.8,0.15)`.
- M3 explicitly separates **spatial** tokens (movement/size — the ones allowed to overshoot) from **effects** tokens (opacity/color — never overshoot). Source: [material-components-android Motion.md](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md).

**IBM Carbon** ([motion overview](https://carbondesignsystem.com/elements/motion/overview/)) publishes two named motion *styles* rather than a spring/standard split:
- **Productive** motion — fast, efficient, minimal, for repetitive/utilitarian interactions (data tables, form controls). **Expressive** motion — slower, used sparingly for moments that benefit from more perceptual weight (onboarding, empty states).
- Six duration tokens (`fast-01/02`, `moderate-01/02`, `slow-01/02`) on a **non-linear scale** — the guidance explicitly ties duration to distance/size traveled ("the larger the change... the longer the animation takes") rather than a single flat number for everything.
- Carbon's docs did not expose exact per-token millisecond values through the pages fetched in this pass (JS-rendered site); the durable takeaway is the *shape* of the system — two registers, non-linear scale, distance-aware duration — not a specific number to copy.

**Our ramp vs. these systems:**
- `instant 80ms` sits below M3's `short1 (50ms)`–`short2 (100ms)` band and below Linear's fastest (100ms) — appropriate for hover-only, continuous-interaction feedback.
- `fast 140ms` and `base 200ms` land inside M3's `short3–short4` band and match Linear's `150–250ms` transform/regular-transition range almost exactly — this is the safe, well-precedented "standard UI transition" zone.
- `slow 320ms` and `entrance 400ms` sit inside M3's `medium` band (250–400ms) — appropriate for drawer/panel and page-entrance work, still comfortably under Stripe's informal "stay under 500ms" ceiling.
- Our two easing tokens (`standard cubic-bezier(0.2,0.8,0.2,1)`, `exit cubic-bezier(0.4,0,1,1)`) both belong to the **non-overshooting** family in every system referenced above — there is no precedent in any of Linear, Stripe, Wise, Notion, Intercom, M3-standard, or Carbon-productive for a spring/bounce curve in a professional B2B surface. M3's overshooting "emphasized" family is explicitly the *expressive*, consumer-app register — not the one to borrow from.

---

## Motion spec recommendations

### Page entrance stagger
- **Order:** top-to-bottom, primary-content-first. Page header (`MpPageHeader`) does not animate — it's structural chrome, present instantly. Below it, sections stagger in reading order: KPI/summary row first, then the main table/card, then secondary panels/sidebars. Within a row of equal-weight items (KPI cards, section rail groups), stagger left-to-right.
- **Distance:** `translateY(8px)` for small repeating units (table rows, KPI cards, list items); `translateY(12–16px)` for larger single blocks (a whole card, a whole section). Never exceed ~16px — anything larger reads as "flying in" rather than "settling into place," which is the M3-expressive/spatial-spring register we're explicitly not using.
- **Opacity:** `0 → 1`, paired with the translate (never opacity-only for entrances — the tiny vertical settle is what reads as "editorial," a pure fade reads as "loading spinner replacement").
- **Durations:** `fast (140ms)` per item for small repeating units, `base (200ms)` for larger single blocks; stagger delay = existing `stagger.step (40ms)` between siblings. Cap total stagger spread at ~5–6 items (≈200–240ms of spread); beyond that, animate the remainder in as one simultaneous group rather than continuing the cascade — a 50-row table staggering row-by-row reads as an AI-generated demo, not confident software.
- **Easing:** `motion.easing.standard` on entry, always.

### Drawer / panel open + close
- **Open:** slide from the trailing edge, `translateX(24–32px) → 0` + `opacity 0 → 1`, duration `slow (320ms)`, `easing.standard`. Backdrop/scrim (when present) fades in in parallel at `fast (140ms)` — the panel should feel like it arrives slightly ahead of the dimming, not after it.
- **Close:** reverse the transform, but faster and with the accelerate-style curve — duration `fast–base (140–200ms)`, `easing.exit (cubic-bezier(0.4,0,1,1))`. This asymmetry (slower, gentler open; quicker, sharper close) matches Linear's own asymmetric in/out timing and Carbon's productive register for dismissal.
- **Content inside the drawer moves as one unit** with the shell — do not nest a second stagger inside the drawer's own entrance. One motion event per surface; the drawer is not the place to also cascade its form fields in.
- Reserve a **dimming scrim** for panels that are genuinely blocking/modal (confirm dialogs, security-critical steps — see Wise's passkey modal). Non-blocking side panels (`MpFormDrawer` for routine create/edit) can open without a scrim, consistent with Notion's undimmed peek and Linear's undimmed create-issue card.

### Table row hover / selection
- **Hover:** `background-color` transition only, `instant (80ms)`, `easing.standard`. No movement, no scale, no shadow. This is the fastest tier because it fires continuously as a cursor sweeps down a list.
- **Selection (checkbox row):** `background-color` + left border-accent transition, `fast (140ms)`.
- **`MpFloatingBulkBar`:** enters on first selection via `translateY(16px) → 0` + opacity, `base (200ms)`, `easing.standard`; exits when the count returns to zero via the same distance at `fast (140ms)`, `easing.exit`.
- Never scale or elevate a selected/hovered row — consistent with the existing "flat border, no elevation" card rule; a bouncing/lifting row is exactly the kind of motion this evolution is moving away from.

### Confirmation feedback placement — toast vs. inline vs. full-screen
- **Inline first, always.** If the result of an action is already visible in the current view — a new row appearing (Linear), a counter decrementing (Intercom), a value updating in a cell (Notion) — let *that* be the confirmation. Do not layer a redundant toast on top of something the user can already see change. This is the single biggest lever for feeling "confident" rather than "chatty."
- **Toast** (small, corner-anchored — bottom-right by convention in this system, single line, icon + text, auto-dismiss ~3–4s, never blocking): use for actions whose result is *not* visible in the current view — background/bulk operations, actions taken from a drawer that then closes, autosave-adjacent discrete events (e.g., "Coupon duplicated," "Folder deleted"). Matches the universal pattern across Sora/June/Maze/Preply/Lovable.
- **Toast + modal combo:** reserve for actions that unlock a meaningful next decision (Workable's "Survey created" → include in message / add to template / automate). Don't reach for this for routine saves — it should feel like an occasional, earned escalation, not standard weight.
- **Muted inline text** (Stripe's "Draft saved 8 seconds ago"): the correct tier for high-frequency autosave/background persistence inside a form or editor. No toast, no icon, just quiet text near the action it relates to, updating in place.
- **Full-screen/full-bleed completion state** (centered icon + headline, optional single CTA, no persistent nav chrome): reserve exclusively for the true end of a multi-step onboarding or setup wizard — a once-per-lifetime moment. Never use it for a routine save, publish, or create action; that would be disproportionate to the action and undercut the "confident, not performative" tone.

### Explicitly do NOT do
- **No bounce, overshoot, or spring easing anywhere.** Both current easing tokens are non-overshooting cubic-beziers; any future easing token added must stay in that family. This rules out M3's "expressive" spatial-spring tokens by design — that register belongs to consumer apps, not this system.
- **No parallax or multi-layer depth-scroll effects.**
- **No confetti, particle bursts, or emoji animation** for confirmations of any kind — incident.io's confetti pattern is explicitly excluded, even for a first-run "all set" moment; default to a static checkmark + headline instead.
- **No long staggered cascades on large tables/lists.** Cap stagger at ~5–6 visible items; anything past that fades in as one group. A table that visibly "types itself in" row by row reads as an AI-generated demo, which is precisely the vibe-coded impression this evolution is meant to move away from.
- **No animating layout properties** (`width`, `height`, `top`, `left`). Animate only `transform` (translate) and `opacity`, per Stripe's own performance guidance — this keeps every transition GPU-accelerated and consistent with Vuetify's existing rendering model.
- **Respect `prefers-reduced-motion`:** when set, collapse all entrance/stagger/drawer motion to an instant (or near-instant, opacity-only) state — never disable the underlying interaction, only the motion around it.
- **No shake/flash/emphasis motion on error or destructive states.** Errors stay calm — color, icon, and text only (`MpErrorState`'s existing tone) — never a jolt to grab attention.
