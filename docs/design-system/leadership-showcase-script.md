# Leadership Showcase — Presenter Script (45 minutes, PowerPoint + live demo)

**Presenter:** Deepak (UX manager)
**Audience:** Product managers, team leaders, technology team leaders
**Deck:** `docs/design-system/leadership-showcase.pptx` (PowerPoint — present full-screen)
**Live demo:** the sandbox, in a browser with tabs pre-opened (see checklist at the end)

This is the plain-language version. Every technical idea is said in everyday words first.
The `>` blocks are what you say. The **Do:** lines are what you do.

**Three language rules — never break these:**
1. Say **"working prototype environment"** — never "production-ready."
2. Say **"converge into LiquidSky"** — never "replace LiquidSky."
3. **No dates and no made-up percentages** before the pilots. "The pilots will give us real numbers" is the answer.

---

## Slide 1–2 · Welcome — 0:00–0:03

> Thanks for making the time, everyone. Forty-five minutes, and I'll keep us on schedule.
>
> Here's the one sentence I want you to remember from today: **we built a full working copy of our product, where every screen follows one shared set of rules.** It looks like our product, it clicks like our product — but it runs on pretend data, so it's completely safe to play with.
>
> And one promise before we start: nothing I show you today is a picture. Every screen is real, running software. If at any point you think "that must be a mockup" — say so, and I'll click on it.
>
> Here's the plan for our time: first, why we did this. Then a short video. Then the part that matters most — I'll walk through five real screens, live. After that I'll explain how it all works in plain terms, show you the plan from here, and we'll finish with your questions. Ask them as they come up, though — this works better as a conversation.

**Do:** slide 2 (agenda) up while you say the last paragraph. Keep it moving — the demo is the star, not the slides.

---

## Slide 3 · The problem — 0:03–0:06

The slide shows five Save buttons, all different.

> So why did we do this? Let me show you the problem in one image.
>
> These are five Save buttons. All five are from patterns in our current product. Five different shapes, five different blues, five different fonts — for the exact same action.
>
> Nobody chose this. Our screens were built at different times, by different teams, and there was no shared rulebook. Each team made sensible decisions — they just each made *different* sensible decisions.
>
> And there's a second problem hiding behind the first one. Trying out a new idea took weeks of build time. So most design decisions were made from static pictures — and pictures are always on their best behavior. Real screens have loading spinners, empty tables, long German words, and small laptops. Pictures don't.
>
> Our customers feel the result. They may not be able to name it, but they feel it: the product doesn't feel like one product.

---

## Slide 4 · Before and after — 0:06–0:09

Side by side: our current dashboard (left) and the same screen in the sandbox (right).

> Here's what that adds up to, using our own dashboard.
>
> On the left: our dashboard as it looks today. This is a faithful recreation of my actual account. It works — but it isn't telling me much, and every box on it looks a little different.
>
> On the right: the same screen, same account, same numbers — rebuilt in the sandbox. Every card comes from one shared kit of parts. Same spacing, same type, same colors, everywhere.
>
> That's the whole idea of a design system, by the way — and it's the only piece of jargon I'll use today. A design system is just a shared kit of parts and a rulebook for using them. Build every screen from the same kit, and everything matches — automatically.

**Do:** if the room leans in, ⌘-Tab briefly to the logged-in UAT tab — "and this is the real product, live, so you can compare for yourself" — then back to the deck. This is a credibility moment, not a detour; ten seconds.

---

## Slide 5 · The video — 0:09–0:11

> Before I start clicking around, here's the whole story in 75 seconds.

**Do:** play the reel MP4 from the desktop, full-screen. When it ends, pause a beat before speaking — let it land. Fallback if the file misbehaves: the `/reel` tab shows the same cards live; arrow through them.

---

## Slides 6–7 · What this is — and the honest numbers — 0:11–0:14

> So what exactly is this thing? Three things it **is**, three things it **isn't**.
>
> It **is** a working prototype environment — 171 real screens, built with the same technology our product uses. It **is** one shared kit of parts behind all of them. And it **is** live on the web right now — every one of you can click through it after this call.
>
> Now the "isn't" list, because this is where the reasonable worries live. It **isn't** a rewrite of our product — nothing changes for customers tomorrow. It **isn't** connected to real data — everything you'll see is pretend data, on purpose, so nothing can break. And it **isn't** a second system for engineering to maintain forever — the plan is to fold the good parts into LiquidSky, our shared component foundation, and I'll show you exactly how before we're done.
>
> One more slide of honesty: the numbers. 89 shared components — think of those as the parts in the kit. 84 of them fully documented. 171 screens built from those parts. 297 design decisions — every color, every spacing size — written down once, in one place. These aren't estimates; they're counted from the actual project. If the count changes, this slide changes.

---

## Slide 8 · Demo map, then the live demo — 0:14–0:27

> Now the part I actually came here to do. Five screens, all live. Here's the route.

**Do:** show slide 8 for ten seconds, then ⌘-Tab to the browser. Demo rules: open and close things freely — never save, never delete. If a screen misbehaves, say "I'll come back to that one" and move on; every stop has a backup screenshot in the deck's appendix.

### Stop 1 — Dashboard (3 min)

> This is the same dashboard from the slide, live. These number cards, the chart, the setup guide — all from the shared kit.
>
> Notice how calm it feels. That's not one big design decision; it's three hundred tiny ones — spacing, type, color — all made once and applied everywhere.

**Do:** drag one widget to a new position. Change the date range.

### Stop 2 — Sales Orders (4 min)

> This is a list screen — and I'm showing it because half our product is list screens.
>
> Tabs to filter, search, filters, bulk actions when I select rows. Here's the important part: this exact pattern runs on campaigns, contacts, products, tickets — everywhere. **Learn this screen once, and you already know how half the product works.** That's what consistency buys our customers.

**Do:** switch a tab, open the filter panel, tick a row so the bulk bar appears, then clear it.

### Stop 3 — Contact detail (2 min)

> Detail pages all share one shape: name at the top, facts on the left, activity on the right.
>
> And when I hit Edit — this side panel is the *same* side panel every edit in the product uses. One way to edit things, not thirty.

**Do:** open Edit Contact, close it without saving.

### Stop 4 — Journey builder (3 min)

> Now something deliberately different. This is where marketers build automated flows — and it's a canvas, not a table, because a flow chart shouldn't be forced to look like a spreadsheet.
>
> But look closer: the fields, the buttons, the status colors — same kit underneath. Same family, different room. Consistency where it helps, freedom where it matters.

**Do:** click a node so its settings open. Point at a field: "same fields as the orders screen."

### Stop 5 — Da Vinci + the finale (2 min)

> And our AI assistant lives on the same foundations — same colors, same rules, nothing special-cased.
>
> One last trick before I go back to the slides. Watch the whole screen.

**Do:** press **`D`** — the entire app flips to dark mode. Pause. Press **`L`** to flip back.

> That was not a second design. That's those 297 written-down decisions flipping to their dark values, all at once. One change, every screen updates. This is why writing decisions down once matters — you saw a whole product change its clothes in half a second.

**Do:** ⌘-Tab back to the deck.

---

## Slides 9–11 · How it works, in plain terms — 0:27–0:32

Slide 9 is a five-layer stack.

> Back to the slides for four minutes of "how does this actually work" — no jargon, I promise.
>
> Think of it as five layers, bottom to top. At the bottom: the **decisions** — every color, every spacing size, written down once. Layer two: the **parts** — buttons, fields, cards — built from those decisions. Layer three: **patterns** — bigger assemblies, like the page header or the search-and-filter bar, snapped together from parts. Layer four: **page recipes** — a list page, a detail page — assembled from patterns. And on top: the **product areas** — dashboards, builders — which get their own layouts but stand on the same four layers below.
>
> Change a decision at the bottom, and it flows up through everything. That's what you saw in the dark-mode flip.

Slide 10 — Storybook.

> Every part in the kit has its own instruction page — what it's for, when to use it, when *not* to. Here's the clever bit: those pages render the **actual part**, the same one the screens use — not a drawing of it. So the documentation physically can't go out of date. Our rule is simple: if a part has no instruction page, it doesn't exist yet.

Slide 11 — why this matters.

> And here's what all of it buys you, whatever your role: **an idea can become a clickable prototype in a day**, because the parts already exist. Instead of debating a static picture in a meeting, you click a link on your own laptop and try the real flow.
>
> I can vouch for this personally — this sandbox, and the deck you're looking at, were built exactly that way.

---

## Slides 12–13 · The plan, and what I need — 0:32–0:37

> So what happens next? The plan is deliberately boring, and I mean that as a compliment.
>
> Step one: a **compatibility review**. Two people — one from the LiquidSky side, one product engineer — go through the kit, part by part, and sort every piece into four buckets: use LiquidSky's version as-is, wrap it, contribute ours to LiquidSky, or keep it local to the sandbox. About two weeks of work.
>
> Step two: a small pilot with the low-risk parts. Step three: one full page — Sales Orders — built the new way in the real product. Step four: area by area from there, at whatever pace the evidence supports.
>
> You'll notice there are **no dates on this slide** — and that's deliberate. Anyone who quotes you a migration date before those pilots is guessing. The pilots turn my guesses into numbers you can hold me to. I'd rather be accurate than fast.
>
> Which brings me to what I need from this room today. Six decisions — and notice none of them costs budget or headcount this quarter:
>
> One — **sign off on the visual direction** you saw today.
> Two — **agree the sandbox and its documentation are our shared reference** — when we discuss design, this is what we point at.
> Three — **two names for the compatibility review** — one LiquidSky maintainer, one product engineer.
> Four — **access to the LiquidSky repository** and its normal contribution process.
> Five — **approval to run the two pilots** — parts first, then the Sales Orders page.
> Six — and this one is me volunteering a constraint — **agreement that no separate component library ever ships from this sandbox.** One shared foundation. No second one.

---

## Slide 14 · Questions — 0:37–0:44

**Do:** keep [showcase-faq-crib-sheet.md](./showcase-faq-crib-sheet.md) open on your phone or a second screen. If the room is quiet, open with:

> The question I'd be asking in your seats is: "aren't we building everything twice?" Let me answer that one first, because it's fair.

(Then crib sheet #21.) For anything you can't answer:

> Great question — I don't want to hand-wave it. Let me take it into the compatibility review and come back with evidence instead of adjectives.

---

## Slide 15 · Close — 0:44–0:45

> Last thing. Everything I showed you today is live right now, and the links are on this slide. The sandbox stays open — go click the things I didn't get to. Try to break it; it's pretend data, you can't hurt anything.
>
> Thank you, everyone.

**Do:** leave slide 15 (the links) on screen while people drop off.

---

# Pre-meeting checklist

1. **PowerPoint** open full-screen on `leadership-showcase.pptx`, presenter view on, notes visible to you only.
2. **Browser tabs, in demo order:** ① real UAT dashboard (logged in — the credibility moment after slide 4) ② sandbox dashboard ③ Sales Orders ④ a contact detail page ⑤ `/accounts/2000290/journeys/1/builder` ⑥ Da Vinci ⑦ `/reel` (video fallback) ⑧ `/showcase` (for after).
3. **Reel MP4** on the desktop, cued at frame zero.
4. Click the Da Vinci page once beforehand and allow the microphone.
5. Rehearse the dark-mode flip (`D` / `L`) once on the dashboard tab so you trust it.
6. Notifications off. Browser zoom 100%. Phone with the FAQ crib sheet within reach.
7. If the live demo dies entirely: the appendix slides at the back of the deck are full screenshots of all five stops — narrate over those and say so plainly: "the demo gods said no, so here are this morning's screenshots."

# 20-minute version

Slides 1–4 (welcome, problem, before/after) → video → live demo of **Sales Orders + Journey builder + the dark-mode flip only** → slides 12–13 (plan + asks) → questions. Skip the layer model entirely; it survives in the FAQ.
