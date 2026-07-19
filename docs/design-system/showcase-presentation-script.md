# Design System Showcase — Presenter Script (45 minutes)

**Presenter:** Deepak (UX manager) · **Audience:** PM, team leads, technology team leads
**Deck:** `/deck?s=1&theme=light` — 16 slides, self-advancing.

**Deck controls**
- **Start** button on slide 1, or **`P`** anywhere = play / pause the auto-advance.
- **`Space`** pauses. Arrow keys (or a clicker) move manually and pause the autoplay.
- **`L` / `D`** switch light / dark. Slide 11 switches themes by itself during autoplay.
- Add `&play=1` to the URL if you want it running while people join.

**Language reminders:** say "working prototype environment," not "production-ready." Say "converge into LiquidSky," not "replace." Don't commit to dates before the pilots.

---

## Slides 1–2 · Opening — 0:00–0:04

> Thanks for the time, everyone. Quick setup before we start: nothing I'm showing today is a mockup. Every screen is live, running code — if you doubt one, tell me and I'll click on it.
>
> Here's the agenda: a short intro video, a before-and-after of our own dashboard, a live walkthrough of five screens, a plain-language explanation of how the system works, the implementation plan, and then your questions.

**Do:** click **Start** and let slides 1–2 advance on their own while you talk. Pause with Space whenever you need more time.

---

## Slide 3 · Our dashboard, before and after — 0:04–0:09

The slide shows a gray recreation of our current UAT dashboard, which then wipes into the same screen rebuilt in the sandbox.

> On the left is our dashboard as it looks today — this is recreated from my actual UAT account, this morning. It works, but it's not telling me much, and every widget looks a bit different.
>
> And this is the same screen in the sandbox. Same account, same numbers. The difference is that every card here comes from one shared set of components. Nothing on this slide is an image — these cards are the real thing.

**Do:** let the wipe run twice. Then the credibility step: ⌘-Tab to your logged-in UAT tab — "and this is the real product, live, so you can compare for yourself" — and back.

---

## Slide 4 · The problem — 0:09–0:12

> How did we get here? Our screens were built at different times, by different teams, without shared UI standards. Here are five Save buttons from our current patterns — five different shapes and colors for the same action.
>
> On top of that, prototyping something new took weeks, so most design decisions got made from static mockups. The result is an experience our customers notice — even if they can't name it.

---

## Slide 5 · The intro video — 0:12–0:15

> Before the live walkthrough, here's a 75-second summary.

**Do:** play the MP4 from the desktop; ⌘-Tab back afterwards. Fallback: `/reel` has the same content as live cards — arrow through them. Pause briefly after it ends before speaking.

---

## Slides 6–7 · Scope and current state — 0:15–0:21

> To be clear about what this is: a working prototype environment. 171 real screens on the same front-end stack our product uses. One set of shared components and design tokens across all of it.
>
> Just as important, what it isn't: it's not a production rewrite — nothing changes for customers. It's not connected to real data. And it's not a second library for teams to maintain — the plan is to converge it into LiquidSky, and I'll show you exactly how.
>
> The numbers on this slide are counted from the repository, not estimates: 89 components, 84 of them documented, 171 screens, 297 design tokens. And one detail worth pointing out — these six stat cards are the actual dashboard component. This deck itself runs on the system.

---

## Slide 8 + live walkthrough — 0:21–0:33

**Do:** show the map slide briefly, then switch to the pre-opened tabs. Since last week, all of these screens — including the builders — sit inside the product's own navigation frame, so it already feels like one product.

1. **Dashboard (3 min).** "KPI widgets, drag-and-drop layout, date comparisons. Notice how calm it is — that's the spacing and type doing the work." Drag one widget.
2. **Orders (4 min).** "This is our standard list pattern: tabs, search, filters, bulk actions. The same pattern runs on campaigns, contacts, products — learn it once, you know them all." Switch a tab, open the filter drawer, select a row.
3. **Contact detail (2 min).** "Detail pages share the same header and card structure, and every edit in the product opens this same side drawer." Open Edit, close it.
4. **Journey builder (3 min).** "Builders get their own layout — a canvas makes sense here — but look at the fields and statuses: same components underneath." Select a node.
5. **Da Vinci (2 min).** "And the AI surface runs on the same tokens and theme." One click, let it greet; if audio is quiet on the room machine, say so and move on.

Guardrails: open and close things, don't save, don't delete.

---

## Slides 9–12 · How it works — 0:33–0:39

> The structure is five layers. Design tokens — colors, spacing, type — defined once. Base components built from those tokens. Shared patterns like page headers and toolbars. Page templates assembled from the patterns. And product areas like dashboards and builders that keep their own layouts but stay consistent.
>
> Every component is documented in Storybook — 84 pages, and because the docs render the same code as the app, they can't go stale. Our rule: no documentation, no component.
>
> *(slide 11 — the theme switch)* Here's the clearest demonstration of the token idea. One change — 297 values update everywhere, including this deck. No screen-by-screen rework.
>
> And the practical payoff for everyone in this room: an idea can become a clickable prototype in a day, because the parts already exist. You review a live link instead of a static mockup. That's the process we used to build this sandbox — and this presentation.

---

## Slides 13–14 · Plan and asks — 0:39–0:42

> The implementation plan is deliberately boring. First, a compatibility review against LiquidSky — sort every component into reuse, wrap, contribute, or keep local. Then a pilot with the low-risk components. Then one full page — Sales Orders. Then incremental adoption, area by area, shell last.
>
> You'll notice no dates on this slide. The two pilots will give us real numbers; after that, my estimates will be based on evidence. I'd rather be accurate than fast with a guess.
>
> What I need today is six decisions — *(walk through them)* — none of which need budget or headcount this quarter.

---

## Slide 15 · Q&A — 0:42–0:44

Keep [showcase-faq-crib-sheet.md](./showcase-faq-crib-sheet.md) at hand. If the room is quiet, open with: "The question I'd ask in your seat is whether we're building everything twice — so let me answer that one first." (Crib sheet #21.)

## Slide 16 · Close — 0:44–0:45

> One more thing. This deck isn't PowerPoint — it's a page inside the sandbox, built from the same components and tokens I've been showing you. That's the level of reuse this system makes possible.
>
> Thanks, everyone. The links stay on screen — the sandbox is open if you want to click around after.

**Do:** let the "built with" list scroll, press **`L`** to reset light mode, stop talking.

---

# Pre-meeting checklist

1. `npm run dev` and `npm run storybook` running — or present from the deployed site (Storybook at `/storybook/`).
2. Tabs in order: ① `/deck?s=1&theme=light` ② real UAT dashboard (logged in — the comparison proof after slide 3) ③ dashboard ④ orders ⑤ a contact ⑥ `/accounts/2000290/journeys/1/builder` ⑦ Da Vinci ⑧ Storybook ⑨ `/showcase`.
3. Reel MP4 on the desktop, paused at frame zero.
4. Click the Da Vinci page once beforehand and allow the microphone.
5. One rehearsal with autoplay on (`P`) — practice pausing with Space when people react.
6. Notifications off, browser zoom 100%, end rehearsal on `L`.

**20-minute version:** slides 1–3 + UAT comparison, the video, Orders + Journey builder live, slides 13–14, questions.
