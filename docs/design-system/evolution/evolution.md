# Design System Evolution — Confident Editorial

> A personality pass for the Maropost design system. The brand kept (Picton blue `#0073AB`, Inter); the execution grew a point of view. Nothing here changes what the product *does* — it changes how confidently it says it.

**Personality pole:** CONFIDENT EDITORIAL. Typography, rhythm, whitespace, and one-accent discipline carry the personality. No gradients, no mascots, no decoration for its own sake. The system should read like considered software, not a template.

This document is the full write-up of that direction: what we found, what we changed, why each move is usable and scalable, and how the remaining ~80 views inherit it. Every major claim traces to a file, a screenshot pair, or a cited source.

---

## 1. Audit of the existing system

The honest gap in the `before/` state was not a lack of ambition in the tokens — it was that the ambition never reached the screen.

**The tokens promised more than the UI delivered.** `tokens.json` already carried a display scale climbing to 80px/800, an OKLCH-derived palette, and navy-tinted shadows. In practice the pages rendered as competent-but-generic Material 3: a 22px/600 page title, 28px KPI numbers, mid-gray Material chrome, and pill-shaped status chips with heavy tonal fills. The distance between "what the tokens could express" and "what the components actually used" was the core finding.

**All the personality was hoarded in one room.** The only surface with a real point of view was Da Vinci — the voice orbit, the particle ring, the monospace `TAP TO TALK` label (`before/da-vinci-experience--1440--light.png`). Everywhere else — orders, contacts, campaigns, settings — the app was quiet to the point of anonymous. A user could not have told a Maropost table from any other Vuetify table.

**Fragmented radii.** Three different corner systems were live at once: dialogs at the 28px token, drawers at a 24px default, and CSS-injected surfaces at 12px. Cards ran on a "chunky Wise-inspired" scale (sm 14 / md 20 / lg 28 / xl 36) that fought the tighter chrome the type wanted.

**Mono-accent, but muddy.** The intent was one accent (Picton blue). The reality was one accent *plus* a near-black secondary doing quasi-accent duty, so the hierarchy between "this is interactive" and "this is just dark text" blurred.

**Utilitarian motion outside AI.** Motion existed as ad-hoc `120ms ease` transitions on hover states. There was no shared ramp, no easing token in use, no entrance choreography — again, except inside Da Vinci, which had bespoke animation the rest of the app never borrowed.

| Symptom (before) | Root cause |
|---|---|
| Generic Material look despite rich tokens | Components consumed the safe/small end of the token scale |
| Personality concentrated in Da Vinci only | No "branded moment" vocabulary for non-AI surfaces |
| Corner radii visibly inconsistent across overlays | Three uncoordinated radius sources (28-token / 24-default / 12-CSS) |
| Accent color read weakly | Near-black secondary competing with the true accent |
| Motion felt incidental | No shared duration/easing/stagger system |

---

## 2. Mobbin & web research findings

Three research passes underpin the direction. Full notes: [`research/patterns-and-ink.md`](research/patterns-and-ink.md), [`research/motion-and-flows.md`](research/motion-and-flows.md), [`research/published-writeups.md`](research/published-writeups.md).

### Product observations (Mobbin)

| Source | What we took | Link |
|---|---|---|
| Stripe payment detail | Large amount + demoted currency suffix; strict 2-col label/value; one accent for links, semantic color confined to chips | [screen](https://mobbin.com/screens/f3244c8a-43d2-486f-a824-ec19460c23ed) |
| Attio record | Reusable "muted label / value" atom across records, panels, dashboards; timeline as icon + text + right-aligned timestamp, no card chrome | [screen](https://mobbin.com/screens/c6047b75-c73d-4c86-a8ce-0b73b8becd4f) |
| Ramp-adjacent fintech (Airwallex / Navan / Monarch) | Ink confined to nav chrome, white content canvas; flat hairline KPI cards, label small then one big number; **date/status run-in group headers instead of a repeated column** | [Monarch](https://mobbin.com/screens/531c7584-3778-4fbd-b447-9be37b68b06e) |
| Linear settings | Zero card chrome for rows; whitespace demarcates sections; generous row rhythm | [screen](https://mobbin.com/screens/1157983e-78fc-4e00-90e9-d768580517fc) |
| Revolut Business (ink validation) | A single dark panel holding **one message** reads rich not heavy — *only* when it's the only dark surface and matches the card radius | [screen](https://mobbin.com/screens/480acc51-97cd-45f9-b0dc-8feb37488e77) |
| ClickUp / Aboard / LangChain (bulk bar) | Floating compact pill (44–52px), count-first, destructive action separated by color; an inverted near-black bar reads *more* deliberate than mid-gray | [ClickUp](https://mobbin.com/screens/e9639493-e0a6-46c9-93d1-d3189cbdc3c7) |
| komoot / GitBook (masthead) | Small label over a very large tight title, minimal gap; the **size ratio (~1:2.5–3)** does the editorial work, not uppercasing | [komoot](https://mobbin.com/screens/4c174d59-41a6-41e5-b64b-c5118277daf8) |
| Linear / Stripe / Wise / Notion / Intercom (motion) | Non-overshooting easing only; entrance = tiny translate + fade; the appearing row / decrementing counter *is* the confirmation; modal-with-scrim reserved for blocking/irreversible steps | [Linear flow](https://mobbin.com/flows/b49200b2-cfac-4c16-aae9-55aecdb91d09) |

### Published design thinking

- **Linear** — *"Inter Display for headings, regular Inter for text elements"* and *"define three variables: base color, accent color, and contrast instead of [nearly] 98"* ([redesign write-up](https://linear.app/now/how-we-redesigned-the-linear-ui)). Direct precedent for the Inter / Inter Display split and one-accent discipline. LCH-based, perceptually-uniform palette.
- **Wise** — APCA as primary contrast method, WCAG as baseline; type scale pruned 22 → 14 → 12; *tight display line-height, looser body* ([Wise Design, Medium](https://medium.com/transferwise-design/accessible-but-never-boring-part-1-ec8222f1f364)). Grounds the tighten-at-display / relax-at-body split.
- **Intercom** — *"edit ruthlessly"*; empty states should *offer reassurance… setting expectations* rather than report emptiness ([9 fundamentals](https://www.intercom.com/blog/fundamentals-good-interaction-design/)). Grounds terse microcopy and the `MpEmptyState` doctrine.
- **Stripe** — color system built for *consistent visual weight across hues* in a perceptually-uniform space ([accessible color systems](https://stripe.com/blog/accessible-color-systems)). Backs building any semantic/status color so no status reads "louder" than another.
- **Mailchimp** — *use active voice, plain English, positive framing*; *"more important to be clear than entertaining"* ([style guide](https://styleguide.mailchimp.com/voice-and-tone/)).

### Corrections (do not misattribute)

1. **The "no exclamation marks" rule is ours, not Mailchimp's.** Mailchimp's guide mandates active voice / plain English / positive framing — it states no punctuation ban. Cite the exclamation rule as house style.
2. **Inter Display threshold confirmed at ~24–28px.** Published guidance: regular Inter to ~24px, switch to Inter Display *"at 28px and above"* — exactly the masthead size. Tabular figures are Inter's **default**, not an opt-in, so silent-table alignment is free ([rsms.me/inter](https://rsms.me/inter/)).
3. **APCA-over-WCAG is Wise's stance** (a citable precedent), not a universal standard — we still ship to WCAG AA.
4. **The "editorial, scientific-journal" framing around Anthropic is third-party** (Studio Siraj), not Anthropic-published; treat as secondary commentary. Geist (the studio) is the closer-to-primary source.

---

## 3. Personality & visual direction

**Confident editorial.** The product should feel like it was set by someone who reads type for a living: a strong masthead on every page, generous rhythm, numerals treated as a brand asset, tables that whisper, and motion that settles rather than performs. Personality comes from *arrangement and restraint*, never from ornament.

We keep the brand — Picton blue `#0073AB` and Inter — and lean into Inter's optical-size axis so display sizes get Inter Display's tighter cut (the Linear precedent). We commit to a single accent and let semantic color live only where it means something (status). Everything decorative that a template would add — gradients, mascots, illustrated blobs, drop shadows for drama — is out of scope by design.

The bet: a system this disciplined is *cheaper to scale* than a decorative one, because the personality lives in shared tokens and utilities that every view inherits for free.

---

## 4. Design principles

Numbered so they're quotable in review.

1. **Every page opens with a masthead.** Eyebrow, then a 28px/750 title, then a standfirst. The reader always knows where they are and that someone designed the entrance.
2. **One branded moment per screen.** At most one ink panel, at most one hero number. Scarcity is what makes them read as deliberate.
3. **Numerals are a brand asset.** Tabular figures everywhere; hero metrics at display scale; cents demoted. Numbers should look *engineered*.
4. **Tables whisper.** No header fill, no zebra, hairline rows, uppercase micro-headers. The data is the interface; the chrome disappears.
5. **One accent, earned color.** Picton blue is the only accent. Semantic color appears only to encode state, and never louder than its neighbors.
6. **Motion settles, never bounces.** One easing family (non-overshooting), a five-step ramp, a 40ms stagger, and reduced-motion always respected.
7. **The visible result is the confirmation.** If the row appears or the count changes, don't also fire a toast. Confidence is not chatty.
8. **Declarative voice.** Headlines state; bodies start with a verb; working UI carries no exclamation marks.
9. **Additive, never disruptive.** Every component change is opt-in via a new prop or CSS; existing call sites keep working untouched.

---

## 5. Bold signature moves

Five deliberate departures. Each: what was generic → what changed → why it's usable and scalable → the reference that informs it.

### Move 1 — The Masthead
- **Generic:** a 22px/600 page title, sometimes a caption subtitle, no eyebrow.
- **Changed:** `MpPageHeader` gained an `eyebrow` prop (uppercase, tracked, `on-surface-variant`) and a `variant="display"` two-tone masthead for landings — title in ink, standfirst in muted at the same display size (`.mp-headline-duo`). Default pages get eyebrow + 28px/750 title + 15px standfirst.
- **Usable / scalable:** additive props; the 80 unedited views keep their current header and adopt the eyebrow one string at a time.
- **Reference:** komoot's small-label-over-large-tight-title, calibrated to the ~1:2.5 size ratio the research validated (not uppercasing for its own sake).

### Move 2 — Ink panels as THE branded surface
- **Generic:** a lavender-tinted "Da Vinci" card and a full marketing hero with a floating dashboard mock.
- **Changed:** a single ink surface (`#1a1814`, `.mp-ink-panel` / `inkPanel` tokens) holds one message + one action, capped at **one per screen**. Live instances: Marketing's Da Vinci card (`after/marketing-landing`), the Commerce upsell (`after/commerce-cloud-landing`), and the floating bulk bar.
- **Usable / scalable:** one utility class + a token group; consumers add padding only. Dark theme reuses the same values (the ink panel is already "dark," so it's theme-stable).
- **Reference:** Revolut Business — a lone dark panel carrying a single message reads rich, not heavy; it fails the moment a second dark surface competes or it's asked to hold dense content, so we hard-cap it.

### Move 3 — Numerals as a brand asset
- **Generic:** 28px/600 KPI values, full-size cents, revenue shown in green.
- **Changed:** KPI value role bumped to 32px/700 tabular; a new `kpiValueHero` role at 48px/800 for the single headline metric (`emphasis="hero"` on `MpKpiCard`, `#value` slot); `.mp-money` + `.mp-money__cents` demote cents to 0.72em / 55% opacity; `formatMoneyParts()` splits currency for that markup.
- **Usable / scalable:** utility classes and a formatter; any money cell or KPI adopts them without touching layout.
- **Reference:** Stripe's demoted currency suffix; Inter's tabular figures being the default; Wise's tighten-at-display line-height.

### Move 4 — The silent table
- **Generic:** Material header fill, medium-weight status pills, per-row date column, full-size totals.
- **Changed (global, in `global.scss`):** transparent `thead`, 11px uppercase tracked micro-headers, hairline row borders, no zebra, a 2%-opacity hover wash, tabular figures on every cell, a slightly stronger first "identity" column. Quieter tonal status chips (`MpStatusChip`, underlay 0.12 → 0.072). Typographic states: `.mp-strike` for voided/refunded totals and out-of-stock counts. Flagship: **SalesOrders**, rendered as Linear-style status-grouped rows (`CANCELLED / COMPLETED / ON HOLD / PROCESSING / REFUNDED` run-in headers with a dot + count) instead of a flat list.
- **Usable / scalable:** the table styling is global CSS on `v-table` / `v-data-table` — *every* table in the app inherits it with zero per-page work.
- **Reference:** Monarch's run-in group headers; Attio's chrome-free rows; Stripe's promoted-total-with-hairline.

### Move 5 — Choreographed motion
- **Generic:** ad-hoc `120ms ease` hovers, bespoke Da Vinci animation.
- **Changed:** a `motion` token group — durations `80 / 140 / 200 / 320 / 400ms`, easing `standard cubic-bezier(0.2,0.8,0.2,1)` + `exit cubic-bezier(0.4,0,1,1)`, stagger `40ms`. `.mp-enter` / `.mp-enter-stagger` entrance utilities (translateY 6px + fade), the bulk bar's transform/opacity transition, and a global `prefers-reduced-motion` collapse.
- **Usable / scalable:** tokens flow to CSS vars (`--dur-*`, `--ease`, `--stagger-step`) via `mp-theme-aliases.css`; any component opts into the ramp by name.
- **Reference:** Linear's asymmetric timing and 100–350ms band; M3 "standard" (non-overshooting) family; the research's explicit ban on spring/bounce in B2B.

---

## 6. Token changes

All values in `src/design-tokens/tokens.json`; regenerated into `generated/_variables.scss`, `variables.css`, `tokens.ts` via `npm run tokens:build`.

### Motion (new group)

| Token | Value |
|---|---|
| `duration.instant` | `80ms` |
| `duration.fast` | `140ms` |
| `duration.base` | `200ms` |
| `duration.slow` | `320ms` |
| `duration.entrance` | `400ms` |
| `easing.standard` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `easing.exit` | `cubic-bezier(0.4, 0, 1, 1)` |
| `stagger.step` | `40ms` |

### Semantic type roles (retuned)

| Role | Before | After |
|---|---|---|
| `pageTitle` | 22px / 600 / -0.3px | **28px / 750 / -0.02em / lh 1.15** |
| `pageSubtitle` | — (new) | 15px / 450 / lh 1.5 |
| `kpiValue` | 28px / 600 / -0.5px | **32px / 700 / -0.025em** |
| `kpiValueHero` | — (new) | **48px / 800 / -0.03em / lh 1.0** |
| `sectionTitle` | 14.5px / 600 | 16px / 650 / -0.01em |
| `eyebrow` | 11px / 500 / 1px | 11px / 600 / 0.06em |
| `metaLabel` | — (new) | 11px / 600 / 0.06em / uppercase |
| `metaValue` | — (new) | 14px / 550 / lh 1.4 |

### Ink panel (new group, light + dark identical)

| Token | Value |
|---|---|
| `inkPanel.bg` | `#1a1814` |
| `inkPanel.fg` | `#f7f5f2` |
| `inkPanel.mutedFg` | `rgba(247,245,242,0.64)` |
| `inkPanel.accent` | `#2CC4FF` (bright Picton that reads on dark) |
| `inkPanel.border` | `rgba(247,245,242,0.14)` |

### Radius unification

| Token | Before | After |
|---|---|---|
| `card.radius.sm` | 14 | **10** |
| `card.radius.md` | 20 | **12** |
| `card.radius.lg` | 28 | **16** |
| `card.radius.xl` | 36 | **20** |
| `dialog.radius.default` | 28 | **16** |

Dialogs and drawers now share the 16px card-lg radius, so overlays and the surfaces behind them read as one system.

### Deliberately NOT changed

- **The color palette and Picton blue.** The audit gap was execution, not hue. Changing brand color would have been scope creep.
- **Pill buttons.** The rounded button geometry is recognizably Maropost; this is a type/rhythm pass, not a control-shape pass.

### Legacy-injection discovery (leave until a migration)

`src/styles/tokens.scss` still hard-codes a few pre-evolution values — notably `$mp-radius-xl: 28px`. The floating-bulk-bar's *base* rule in `global.scss` uses `$mp-radius-xl`, so it would inject the old 28px were it not overridden by the component's own `9999px` pill. Motion and ink vars are correctly wired through `mp-theme-aliases.css` to the generated tokens; the SCSS legacy layer is the remaining island. It is not causing a visible regression today, so it stays until a dedicated `tokens.scss` → generated-tokens migration retires it.

---

## 7. Component changes

All changes are **additive** — new props default to prior behavior, new CSS is scoped or opt-in. The ~145 `MpPageHeader` and ~110 other call sites compile and render unchanged.

| Component | Change | Compatibility |
|---|---|---|
| **MpPageHeader** | `eyebrow?` prop; `variant: 'default' \| 'display'` two-tone masthead; level-2 stays a modest 18px title | Both props default off; existing headers unchanged |
| **MpEmptyState** | `variant: 'default' \| 'expressive' \| 'launcher'`; `illustration?` + `#illustration` slot; expressive = 22px/750 editorial headline + illustration, launcher = vertical menu of starting points | Defaults to prior icon+text |
| **MpKpiCard** | `emphasis: 'default' \| 'hero'`; `#value` slot; ghost icon (no tile); label uses `.mp-meta-label`; value tabular | Default renders the prior 32px value |
| **MpFloatingBulkBar** | Restyled as ink pill (`--ink-panel-*`), 48px, `9999px` radius, tabular count in accent, transform+opacity entrance on base tokens | Same props/slots |
| **MpStatusChip** | Quieter: 11.5px/600 tracked label, tonal underlay 0.12 → 0.072, text kept full-strength so contrast only improves | Drop-in |
| **MpFilterTabs** | Accent lives only in the 2px slider; count is a plain tabular figure, not a pill; unselected 500 / selected 600 | CSS only |
| **MpDataTableToolbar** | Ghost search (transparent until focus, hairline resting outline); count uses meta-label | CSS only |
| **MpFormDrawer** | 17px/700 title; slide retimed to `--dur-base` / `--ease`; hairline footer divider | CSS only |
| **MpTableSkeleton** | Tighter bars (radius 6→4), calmer pulse (1.4s→1.6s) | CSS only |
| **MpIllustration** *(new)* | 8-piece monochrome line set (`no-results`, `empty-orders`, `empty-contacts`, `empty-campaigns`, `empty-products`, `empty-generic`, `start-here`, `error`), single-accent, inlined `?raw` SVG, `currentColor` | New component |
| **Shell** (AppBar / AppSidebar) | Light-touch: type/spacing alignment to the new roles; no structural redesign | Minimal |

Supporting global utilities added in `global.scss`: `.mp-display-*`, `.mp-page-title`, `.mp-kpi-value(--hero)`, `.mp-section-title`, `.mp-meta-label` / `.mp-meta-value`, `.mp-label-value` (dl grid), `.mp-headline-duo`, `.mp-money(__cents)`, `.mp-strike`, `.mp-ink-panel`, `.mp-enter(-stagger)`.

---

## 8. Page-by-page before/after

The eleven pages that received bespoke adoption work (commit `a8f0c85`). All references are 1440px light; dark and 820px variants exist alongside each in `before/` and `after/`.

### 1. Sales Orders — the flagship
The flat list of 30 rows with heavy status pills becomes a Linear-style status-grouped table: run-in headers (`CANCELLED`, `COMPLETED`, `ON HOLD`, `PROCESSING`, `REFUNDED`) with a color dot and count, hairline rows, uppercase micro-headers, quieter chips, demoted cents, and `.mp-strike` on voided/refunded totals. The eyebrow `COMMERCE · ORDERS` sits above a 28px/750 title. This is the single clearest demonstration of the silent-table move.
[before](before/sales-orders--1440--light.png) · [after](after/sales-orders--1440--light.png)

### 2. Order Detail
Net Payable is promoted to a hero numeral (`$743` with a demoted `.47`) in the summary rail; every metadata field switches to uppercase meta-labels over values; line-item prices demote their cents; the activity timeline sheds its card chrome for icon + text + right-aligned timestamp. Reads like a Stripe record.
[before](before/order-detail--1440--light.png) · [after](after/order-detail--1440--light.png)

### 3. Commerce Cloud Landing
The marketing-style hero with a floating dashboard mock and a light-blue brand band collapses to an eyebrow + two-tone display masthead, a *single* ink upsell panel (`UPGRADE` → one line → Talk to Sales), a flattened trusted-by strip, and hairline capability rows with ghost icons (the beige image placeholders are gone). One branded moment, everything else quiet.
[before](before/commerce-cloud-landing--1440--light.png) · [after](after/commerce-cloud-landing--1440--light.png)

### 4. Products List
Silent-table treatment plus numeral discipline: prices demote cents with the compare-at price struck beneath; out-of-stock inventory shows `.mp-strike` zeros; a `Low Stock` amber state joins the quieter chip set; eyebrow `COMMERCE · PRODUCTS`.
[before](before/products-list--1440--light.png) · [after](after/products-list--1440--light.png)

### 5. Marketing Landing
The lavender Da Vinci card becomes the page's one ink panel — `DA VINCI AI · MARKETING` → *"Let Da Vinci draft your next move"* → a single `Open Da Vinci` action — and the header becomes a two-tone masthead (*"Marketing"* / *"Campaigns, journeys, and the people they reach."*). Section cards flatten to hairline chrome.
[before](before/marketing-landing--1440--light.png) · [after](after/marketing-landing--1440--light.png)

### 6. Email Campaigns
Four equal KPI cards become one hero metric (`TOTAL REVENUE $499,819.00`, 48px/800, demoted cents) plus three quiet supporting KPIs. Revenue in the table drops its green and reads as neutral tabular ink — color no longer shouts where it isn't encoding state. This page also carries the launcher empty-state doctrine for its creation surface.
[before](before/email-campaigns--1440--light.png) · [after](after/email-campaigns--1440--light.png)

### 7. Journey Builder
The canvas editor carries tracked uppercase node-type eyebrows (`TRIGGER`, `ACTION`, `DELAY`, `FILTER`) on left-accented node cards, tidy `YES`/`NO` branch pills, and motion retimed to the shared ramp. Editorial rhythm applied to a spatial tool without disturbing the flow logic.
[before](before/journey-builder--1440--light.png) · [after](after/journey-builder--1440--light.png)

### 8. All Contacts
Eyebrow `AUDIENCES · CONTACTS`; silent table with uppercase micro-headers; quieter tonal `Subscribed` / `Bounced` / `Spam` chips; tabular score column with a status dot. A dense operational list made calm without losing scan-speed.
[before](before/all-contacts--1440--light.png) · [after](after/all-contacts--1440--light.png)

### 9. Dashboard Home
KPI widget labels become uppercase meta-labels, values bump to 32px/700 tabular, trend deltas move to tonal chips, the setup-guide progress reads as an uppercase micro-label, and charts hold to single-accent restraint. A `DASHBOARDS` eyebrow tops the `Overview` title. Lighter-touch, but every widget now speaks the system.
[before](before/dashboard-home--1440--light.png) · [after](after/dashboard-home--1440--light.png)

### 10. Da Vinci Experience
Intentionally near-unchanged. Da Vinci was already the app's most expressive surface; the evolution's job was to raise the *rest* of the app to meet it, so Da Vinci stops being the only place with personality. The voice orbit and monospace state labels stay; they now read as one member of a consistent family rather than an outlier.
[before](before/da-vinci-experience--1440--light.png) · [after](after/da-vinci-experience--1440--light.png)

### 11. Settings — General
A restraint case study. The masthead gains an eyebrow (`SETTINGS · YOUR PREFERENCES`) and form field labels adopt uppercase micro-labels — but there is no ink panel and no hero numeral. Personality lives only at the entrance; the form itself stays deliberately neutral.
[before](before/settings-general--1440--light.png) · [after](after/settings-general--1440--light.png)

**Inherited without bespoke work:** `analytics-orders-report`, `contact-lists`, and `coupons` were captured but not hand-edited. They still visibly improve from the global table / type / chip changes alone — evidence that the system carries itself.

---

## 9. Branded moments vs neutral surfaces

Personality is a resource to be spent, not sprayed.

| Surface | Treatment |
|---|---|
| Page mastheads | **Branded** — eyebrow + 28/750 title; display duo on landings |
| Hero KPI (one per page) | **Branded** — 48/800 tabular numeral |
| Empty states (zero-data) | **Branded** — illustration + editorial headline + one CTA |
| Empty states (creation) | **Branded** — launcher menu of starting points |
| Module / cloud landings | **Branded** — one ink panel |
| AI home (Da Vinci) | **Branded** — the anchor expressive surface |
| Floating bulk bar | **Branded** — ink pill |
| Table bodies | **Neutral** — silent table, hairlines, no personality |
| Forms & form drawers | **Neutral** — quiet fields, meta-labels only |
| Dialogs & confirms | **Neutral** — plain surface, 16px radius |
| Filters & toolbars | **Neutral** — ghost search, slider-only accent |
| Settings | **Neutral** — masthead aside, everything quiet |
| Nav (sidebar / appbar) | **Neutral** — structural chrome, unchanged |

---

## 10. Motion language

**Ramp:** `instant 80` (continuous hover feedback) · `fast 140` (small entrances, selection, drawer close) · `base 200` (larger blocks, bulk-bar entrance) · `slow 320` (drawer open) · `entrance 400` (page-level `.mp-enter`).

**Easing:** `standard cubic-bezier(0.2,0.8,0.2,1)` on entry and hover; `exit cubic-bezier(0.4,0,1,1)` on dismissal. Both non-overshooting. Asymmetric timing (gentle open, quicker close) follows Linear.

**Stagger:** 40ms step, top-to-bottom in reading order, left-to-right within an equal-weight row. Cap at ~5–6 items; beyond that the remainder fades in as one group. Never cascade a 50-row table — that reads as an AI demo.

**Properties:** animate only `transform` and `opacity` (GPU-friendly, per Stripe). Never `width/height/top/left`. Entrances pair a ≤16px translate with a fade; a pure fade reads as a loading spinner, a big translate reads as "flying in."

**Confirmation decision ladder:**
1. **Visible result** — a row appears, a count decrements, a cell updates → *that is the confirmation.* No toast.
2. **Toast** (bottom-corner, single line, ~3–4s) — only when the result isn't visible: bulk / background ops, actions from a drawer that then closes.
3. **Muted inline text** — high-frequency autosave (Stripe's "Draft saved…").
4. **Toast + modal** — only when there's a meaningful next decision to offer (rare, earned).
5. **Full-bleed completion** — reserved for the true end of a multi-step wizard, once per lifetime.

**Reduced motion:** `prefers-reduced-motion: reduce` collapses all animation/transition to ~0ms globally; the interaction itself is never disabled, only the motion around it.

**Non-goals:** no bounce / overshoot / spring; no parallax or depth-scroll; no confetti / particles / emoji animation; no shake / flash on error (errors stay calm — color, icon, text).

---

## 11. Voice & microcopy

Rules, with before/after drawn from the actual pages.

| Rule | Before | After |
|---|---|---|
| **Declarative headlines** (state, don't describe) | "Smart suggestions tuned to your audience and recent campaigns." | *"Let Da Vinci draft your next move"* (Marketing ink panel) |
| **Two-tone standfirst on landings** | "Plan, send, and automate every customer touch…" | *"Campaigns, journeys, and the people they reach."* (Marketing masthead) |
| **Verb-first actions** | "Reusable email content and dynamic blocks…" | lead actions with a verb — "Talk to Sales", "Open Da Vinci", "Create Draft Order" |
| **Numbers, not adjectives** | "$17,126.91 lifetime revenue" (label carried the weight) | hero numeral carries it; label demotes to a meta-label |
| **No exclamation marks in working UI** | copy occasionally reached for "!" | banned in product surfaces (house rule — *not* Mailchimp's; see §2) |

Grounding: Intercom's *"edit ruthlessly,"* Mailchimp's active-voice / plain-English / positive-framing, and *"more important to be clear than entertaining."* The exclamation ban is explicitly our own.

---

## 12. Quick wins vs larger improvements

**Quick wins — ship alone, lift every page (Phases 1–2, the first two commits):**
- Token foundation (`6f6bbb5`) — motion group, retuned type roles, ink tokens, radius unification.
- Global chrome (`ad728cd`) — editorial type utilities, silent tables, `.mp-enter`, ink-panel utility, chart restraint.

These two are self-contained: merged on their own they visibly improve **every** table, KPI, header, and overlay in the app with zero per-page edits. This is the highest-leverage, lowest-risk slice.

**Larger — deliberate, per-surface:**
- Component variants (`de5a84d`) — masthead props, empty-state variants, ink bulk bar, hero KPIs.
- Illustration set (`0afd54a`) — 8-piece monochrome SVG system + `MpIllustration`.
- Page polish (`a8f0c85`) — the 11 bespoke pages.

**Deferred (intentionally out of scope):**
- Sidebar / appbar structural redesign — light-touch only for now.
- Snackbar centralization — the toast tier is documented (§10) but not yet a single shared component.
- The remaining ~80 views' bespoke polish — they already inherit the system; hand-tuning is optional, not required.
- Figma token sync — regenerate and push once the direction is signed off.

---

## 13. Rollout guidance

**How the other ~80 views inherit automatically.** The table styling, type utilities, chip quieting, motion ramp, and reduced-motion handling are global (`global.scss`) or token-driven (`mp-theme-aliases.css` → generated tokens). Any view using `v-data-table`, `MpKpiCard`, `MpStatusChip`, `MpPageHeader`, or `MpEmptyState` picks up the new look on next build without edits — as `analytics-orders-report`, `contact-lists`, and `coupons` already demonstrate.

**What per-page adoption looks like (opt-in, incremental):**
1. Add an `eyebrow` to the page's `MpPageHeader` (one string).
2. Pick the right empty-state variant — `expressive` (illustration + headline + CTA) for zero-data, `launcher` for creation surfaces.
3. Mark the page's single headline metric `emphasis="hero"`.
4. Wrap money in `.mp-money` / `formatMoneyParts()` so cents demote and figures align.
5. For heavy lists, consider status/date run-in grouping (the SalesOrders pattern).

**Guardrails:**
- **One ink panel per screen.** A second dark surface kills the hierarchy (Revolut evidence).
- **One hero number per page.** More than one and none of them are the hero.
- **No new accent colors.** Picton blue only; semantic color encodes state, nothing else.
- **No decoration.** No gradients, mascots, or shadow-for-drama.
- **No exclamation marks** in working UI.

**Verification checklist (run before merge):**
- [ ] `npm run type-check` clean.
- [ ] `npm run tokens:build` is idempotent (no uncommitted diff in `generated/`).
- [ ] Dark theme reviewed — ink panels are theme-stable; verify text/chip contrast.
- [ ] `prefers-reduced-motion` collapses entrances / stagger / drawer motion.
- [ ] Money/KPI cells align (tabular figures) and cents demote.
- [ ] WCAG AA contrast holds on quieter chips and meta-labels (chip text kept full-strength, so contrast improved — confirm anyway).
- [ ] Every table has an `MpEmptyState`; every error path an `MpErrorState`.
