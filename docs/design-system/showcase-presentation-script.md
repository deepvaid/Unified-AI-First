# The Showcase — Conversational Script (45 minutes)

**Audience:** PM, team leads, technology team leads
**Vibe:** friendly, confident, a little playful — you're showing them something you're proud of, not defending a thesis.
**Strategy spine:** unchanged from [monday-showcase-talk-track.md](./monday-showcase-talk-track.md) — approved visual direction, converging into LiquidSky, no second library. This script only changes *how it sounds*.

**Your surfaces** (all in the sandbox):
- `/deck?s=1&theme=dark` — the presentation itself, built from the design system
- `/showcase` — the wow landing page
- `/reel` — recordable title cards (for the film; also a live fallback)
- The product routes (pre-opened tabs, see checklist at the end)

**Deck controls:** `←` `→` navigate (clickers work too) · `L` light · `D` dark · `?s=N` deep-links a slide.

Language discipline (say this, not that): **"approved visual direction"** not "production-ready library" · **"code-first reference"** not "the new package" · **"converge into LiquidSky"** not "replace LiquidSky."

---

## 0:00–0:02 · Warm open — Deck S1–S2

**Say**

> Thanks for making the time. I'm going to keep this fun — no 60-slide deck, I promise. In fact there are exactly fifteen slides, and I'll let you in on a secret about them at the very end.
>
> Here's the shape of the next 45 minutes: I'll show you a 75-second film, then we'll walk through the real thing — live, clickable, no smoke — and I'll finish with the plan for how this reaches the product without anyone rewriting anything. Then I want your hard questions. Deal?

**Do**
- Start on `/deck?s=1&theme=dark`, press `→` for the agenda.
- Smile. Seriously — the whole point of today is that this stuff is *fun to use*.

---

## 0:02–0:04 · The problem — Deck S3

**Say**

> Quick honesty check first. This is what we've all lived with: five blues, three button heights, and no shared truth. Not because anyone did bad work — but because every screen re-interpreted static mockups, and prototypes took so long that decisions ran on screenshots and hope.
>
> That little collage on the left? Dramatization. Painfully accurate.

**Do**
- Let the mismatched buttons get the laugh they deserve. Don't over-explain — the visual does the work.

---

## 0:04–0:06 · Roll the film — Deck S4

**Say**

> So instead of describing the fix for ten minutes — here's 75 seconds.

**Do**
- Play the exported MP4 (it's on the desktop; ⌘-Tab to the player, ⌘-Tab back).
- If the file misbehaves: open `/reel` and walk the title cards live with `→`, narrating the beats. It still lands.
- After it ends, pause one beat before speaking. Confidence lives in that pause.

---

## 0:06–0:09 · "Everything you just saw is real" — /showcase

**Say**

> Everything in that film is real, running code — and I can prove it, because the opening shot is a page in the sandbox.
>
> *(on /showcase)* This is the front door. Eighty-nine live components, a hundred and seventy-one screens, two hundred and ninety-seven design tokens — and those numbers aren't marketing, they're counted from the repo.
>
> And my favourite button in the whole project — *(flip to dark)* — one flip, and every component, every screen, every chart follows. No reload, no second stylesheet. That's what "one source of truth" means when it's real.

**Do**
- Open the `/showcase` tab. Scroll gently — let the token chips settle, let the stats count up.
- Click **Dark**, pause, click **Light**. Do it once each; resist the urge to strobe it.
- Scroll to the component wall: "None of this is a screenshot — poke it later, it's all live."

**If asked** → *"Is this the real product?"* — FAQ #1. Short version: "It mirrors it faithfully — same stack, mock data, on purpose."

---

## 0:09–0:13 · What this is, and isn't — Deck S5–S6

**Say**

> Before the tour, ground rules, because I'd rather set them than have you wonder.
>
> This **is** the approved visual direction, running as real Vue 3 and Vuetify code. It's a proving ground and it's the acceptance reference — when we say "done looks like this," this is the *this*.
>
> It **isn't** a production package, and that's deliberate. LiquidSky stays our shared foundation — I'm not building a rival, I'm building the evidence. And every byte of data is mock. Nobody's revenue was harmed in the making of this sandbox.
>
> *(advance to stats slide)* And a small flex: this slide isn't a table I typed into PowerPoint. These six cards are real MpKpiCards — the same component our dashboards use. The deck eats the dog food.

**Do**
- S5: point at the "isn't" column *first* if you sense skeptics in the room — disarms before they draw.
- S6: hover a KPI card so they see it's a live surface.

**If asked** → *"So what are we approving today?"* — FAQ #3. "Direction and next step. Not APIs, not a migration date."

---

## 0:13–0:25 · The live tour — app tabs (the heart of the show)

Use the pre-opened tabs in order. Glance at Deck S7 first ("Five stops, all real") so the room has a map.

### Stop 1 · Dashboard — 3 min · `/accounts/2000290/dashboard`

**Say**

> First stop, the dashboard — the visual language at its most data-heavy. Calm canvas, clear numbers, room for charts to breathe. Widgets drag, dates compare, and there's even a Black Friday preset because our merchants live and die by Q4.

**Do**
- Drag one widget a short distance and let it settle. Open the date preset menu, point at BFCM, close it.
- Don't build a dashboard from scratch. Charm, don't dwell.

### Stop 2 · Sales Orders — 4 min · `/commerce/2000290/orders`

**Say**

> This page is the workhorse — and the best thing in the whole system, because it's a *recipe*. Header, status tabs, toolbar, table, states, bulk actions. Learn it once and you can read commerce, contacts, campaigns, products, and settings. Same grammar everywhere.

**Do**
1. Switch **All Orders → Processing** and back.
2. Open the **filter drawer**, close it without changing anything.
3. Open **column visibility**, close it.
4. **Select one row** → the floating bulk bar appears. "This little bar shows up anywhere selection exists."
5. **Expand one order** — progressive disclosure.
- Never click cancel/delete/fulfill. Open things, close things.

### Stop 3 · Contact Detail — 2 min · `/accounts/2000290/contacts/1`

**Say**

> Detail pages share the same bones without being forced into the same skeleton — identity, KPIs, sections. And every create-or-edit in the product happens in this drawer. Forms have one home. Muscle memory is a feature.

**Do**
- Open **Edit Contact**, point at the drawer shape, close it. Don't save anything.

### Stop 4 · Journey Builder — 3 min · `/accounts/2000290/journeys/1/builder`

**Say**

> And here's the system flexing. A builder shouldn't look like a table page — consistency at the wrong altitude is just uniformity. The canvas is purpose-built, but look closer: the fields, the statuses, the confirmations — all the same contracts underneath.

**Do**
- Expand a palette category, select an existing node so its config panel opens. Point out familiar fields/status colors. Close cleanly.

**If asked during the tour** → *"Why doesn't every page look identical?"* — FAQ #16.

---

## 0:25–0:27 · The Da Vinci moment — `/accounts/2000290/da-vinci/experience`

**Say**

> One more stop, because it answers a question you haven't asked yet: can this system carry the weird stuff? AI surfaces, voice, an orb that breathes?
>
> *(click once anywhere, let it greet)* This is Da Vinci — voice-first, running on the same tokens and theme as that orders table. The point isn't the demo sparkle: it's that product-specific surfaces stay product-specific, and the system still holds them.

**Do**
- Click once on the page first (browsers require a gesture before audio — the page is built for that).
- Let it speak one line; ask it one seeded question if the room is warm, then move on. Two minutes, not ten.
- If voice is shy on the meeting-room machine: the visual orb + captions still make the point. Say "the voice is better on my desk," grin, continue.

---

## 0:27–0:31 · Under the hood — Deck S8–S11 (+ one Storybook tab)

**Say**

> For the technical folks — here's the machinery, in four beats.
>
> *(S8, layers)* Five layers, one direction of truth. Tokens at the bottom — one JSON file that generates our CSS, SCSS, TypeScript, and the Vuetify theme. Vuetify primitives. Our generic compounds — the Mp components. Recipes. And product surfaces on top. The middle layer is the part that converges into LiquidSky; the top stays ours.
>
> *(S9, contract)* Storybook is the contract: eighty-four stories with docs, states, and an accessibility panel. And one fix I'm genuinely proud of: Storybook loads the *exact* app stylesheets through a single shared manifest. What you review in Storybook is what ships in the sandbox — we fixed drift structurally, not with a memo.
>
> *(S10, flip)* Same flip you saw on the landing page, from inside the deck — because the deck is on the same tokens.
>
> *(S11, workflow)* And this is the loop that changes the org: idea → sandbox → Vercel link. Stakeholders click a URL, not a PDF. Decisions get made against running screens, in hours.

**Do**
- Flash the pre-opened Storybook tab (MpFormDrawer docs) for 20 seconds — enough to prove it's real, not a tour.
- On S10, click **Dark** then **Light** once. Land on Light.

---

## 0:31–0:35 · The plan + the asks — Deck S12–S13

**Say**

> So how does this reach the product? Carefully, and without drama. We converge into LiquidSky — no second library, no big-bang rewrite.
>
> Phase one is a compatibility review: map every portable component to reuse, wrap, contribute, or stays-product-local. Then a tiny facade pilot — page header, confirm dialog, form drawer, empty states. Then one real page — Sales Orders — proves the table recipe. Then we adopt incrementally, and the shell goes last because it has the biggest blast radius.
>
> You'll notice what's missing: a migration date. That's deliberate. The pilots turn unknowns into numbers *first* — I'd rather give you an estimate built on evidence than a guess built on optimism.
>
> *(S13)* Which brings me to my six small yeses. None of them cost headcount this quarter. They're the keys that start the review this week.

**Do**
- Read the six asks out loud, warmly, numbered. Ask #6 with a smile: "and yes, I'm volunteering *not* to publish my own library. Put it in the minutes."

---

## 0:35–0:44 · FAQ — Deck S14 + the crib sheet

**Say**

> That's the show. Now the good part — ask me the hard ones. Production-ready? Vuetify lock-in? The AI question? Who maintains it? Nothing's off the table.

**Do**
- Keep [showcase-faq-crib-sheet.md](./showcase-faq-crib-sheet.md) open on your phone or second screen.
- Seed the room if it's quiet: "The question I'd ask in your seat is *'aren't we building the thing twice?'* — so let me answer it anyway." (FAQ #21 — it's your strongest answer.)
- Product questions first, then implementation and ownership — same rule as always.

---

## 0:44–0:45 · The closer — Deck S15

**Say**

> One more thing. These slides you've been looking at for 45 minutes? They're not Keynote. This deck is a route in the sandbox — slash-deck — built from the same tokens, the same cards, the same chips you just toured.
>
> If the system can carry a keynote, it can carry a product. Thanks, everyone — links are on screen, and the sandbox is yours to wander this afternoon.

**Do**
- Press `L` — leave the lights on for the next meeting. (Yes, it's choreographed. That's the job.)
- Then stop talking. Let them come to you.

---

# Pre-demo checklist (morning of)

**Machine**
1. `npm run dev` (app on :5173) and `npm run storybook` (:6006) — or present from the deployed URL (`ai-first-maropost.vercel.app`) where Storybook is at `/storybook/`.
2. Desktop ~1440px wide, browser at 100% zoom, notifications off, bookmarks bar hidden.
3. Grant mic permission to the site once (for Da Vinci), and do one click on the experience page so audio is unlocked.
4. Reel MP4 on the desktop, player pre-opened and paused at frame 0.
5. Theme: end your rehearsal by pressing `L` in the deck — start light everywhere.

**Pre-open these tabs, in order**
1. `/deck?s=1&theme=dark`
2. `/showcase?theme=light`
3. `/accounts/2000290/dashboard`
4. `/commerce/2000290/orders`
5. `/accounts/2000290/contacts/1`
6. `/accounts/2000290/journeys/1/builder`
7. `/accounts/2000290/da-vinci/experience`
8. Storybook → MpFormDrawer docs (`?path=/docs/overlays-mpformdrawer--docs`)
9. `/accounts/2000290/design-system` (Storybook's understudy)

Reload tabs 3–7 right before you start so seeded state is fresh. Screenshot each stop as a fallback deck.

**Guardrails** (unchanged): open and close controls, never save; no destructive actions; no improvised deep navigation; if something hiccups, describe the intent once and move to the next tab.

**If you lose the room to 20 minutes:** open (1) → reel (2) → /showcase + flip (3) → Sales Orders (5) → Journey Builder (3) → S12–S13 plan + asks (4) → questions (2). Skip the deck beyond S13; the crib sheet still covers you.
