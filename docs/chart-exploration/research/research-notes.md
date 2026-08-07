# Chart Visual-System Research Notes

> Internal mood-board / design-direction use only. Third-party product screenshots
> are cited for study, not for external publication.
> Sources: Mobbin MCP sweep (11 queries, 2026-08-07) + SCOP-312 heritage references.
> Files live in `refs/`; the machine-readable citation map is `refs.json`.

## Citation table

| # | Product | Screen / pattern | Local file | Informs |
|---|---------|------------------|-----------|---------|
| 1 | Shopify | Analytics grid — single blue, dashed dotted previous period | refs/shopify--analytics-grid--01.webp | A |
| 2 | Shopify | Fullscreen density — sparse $ labels, near-invisible grid | refs/shopify--analytics-dense--02.webp | A |
| 3 | Shopify | Home compare row — dashed comparison + period pills | refs/shopify--home-compare--03.webp | A |
| 4 | Vercel | Hairline area + dashed projection + crosshair tooltip | refs/vercel--analytics-area--01.webp | A, D |
| 5 | Vercel | Usage table with per-row spark charts | refs/vercel--usage-sparkrows--02.webp | B |
| 6 | Chatbase | Ultra-flat blue-gray area — floor of restraint | refs/chatbase--minimal-area--01.webp | A |
| 7 | Stripe | Overview — one indigo accent, thin pale previous, segmented status bar | refs/stripe--overview--01.webp | B |
| 8 | Stripe | Recovery — neutral gray-blue stacked bars + overlay dotted line | refs/stripe--recovery-bars--02.webp | B, A |
| 9 | Stripe | Radar — multi-hue dot legends over muted fills | refs/stripe--radar-legends--03.webp | B |
| 10 | Customer.io | Indigo/orange/teal multi-series + dashed variants | refs/customerio--multiseries--01.webp | B |
| 11 | Peec AI | Vivid controlled multi-hue lines + donut | refs/peec--sources-lines--01.webp | B |
| 12 | Gorgias | Violet/orange/green trio, per-point markers | refs/gorgias--volume-trio--01.webp | B |
| 13 | Zendesk | Teal/violet/amber stacked area | refs/zendesk--stacked-area--01.webp | B |
| 14 | Mixpanel | **ANTI**: cycled rainbow multi-series | refs/mixpanel--rainbow--anti.webp | B |
| 15 | Monarch | Dark tooltip — per-series rows, deltas, total | refs/monarch--dark-tooltip--01.webp | B, D |
| 16 | Klaviyo | Deliverability metric rows — blue/teal/yellow dots, right axis | refs/klaviyo--deliverability-rows--01.webp | C, A |
| 17 | Mailchimp | Accent bars with **gray** de-emphasis | refs/mailchimp--accent-funnel--01.webp | A, C |
| 18 | Base44 | Blue→green gradient as a product identity | refs/base44--blue-green-identity--01.webp | C |
| 19 | Expensify | Two-hue blue/green pie | refs/expensify--blue-green-pie--01.webp | C |
| 20 | Wrike | Donut anatomy — outside labels, %, classic/donut/ring | refs/wrike--donut-anatomy--01.webp | B, C |
| 21 | GitBook | Saturated gradient area — direction ref AND caution | refs/gitbook--gradient-area--01.webp | D |
| 22 | Posh | Dark teal gradient area, crosshair, pinned tooltip | refs/posh--dark-gradient-area--01.webp | D |
| 23 | Later | Light-mode soft gradient areas — depth without neon | refs/later--soft-gradient-light--01.webp | D |
| 24 | beehiiv | **ANTI**: pastel wash flattens hierarchy | refs/beehiiv--pastel-gauges--anti.webp | D |
| 25 | Basedash | Muted ring on dark, big center total | refs/basedash--dark-ring--01.webp | C, D |

Heritage (not downloadable, cited from SCOP-312 history): **Hyper Charts UI kit**
(Setproduct) — through-mark vertical gradients, rounded caps, floating labels, no
gridlines; the direction Ross responded to in round 3. **Polaris Viz** — the grammar
the current `shopify` baseline already borrows.

## What the references teach (pattern takeaways)

1. **Previous-period grammar is a settled convention.** Shopify (dashed dotted),
   Stripe (thin pale line), Vercel (dashed projection): comparison = *same hue,
   reduced weight or dash* — never a second full-strength hue. Our baseline already
   does this; all four options keep it and only restyle it.
2. **De-emphasis uses neutrals, not paler brand tints.** Mailchimp's empty funnel
   stages are *gray*, Stripe's context bars are *gray-blue*, Stripe Radar's "no data"
   is *gray*. The baseline instead uses pale blues (`#6FD1F5`, `#A9E3E0`) as low-rank
   series slots — they read as "faded data" rather than "secondary data". Every
   option should carry a true neutral/muted-series token.
3. **Multi-color works when hues are spaced, desaturated one notch, and fixed to
   entities.** Customer.io, Zendesk, Gorgias, Stripe Radar use 3–5 hue-spaced,
   slightly muted hues and never cycle. Mixpanel's default rainbow (ref 14) is the
   failure mode: adjacent cycled hues + full saturation = noise. Rule for Option B:
   ≤5 chromatic slots + 1 neutral, fixed order, saturation held down.
4. **Gradients read premium under three constraints** (Posh, Later vs GitBook,
   beehiiv): (a) vertical fade-to-transparent that encodes "area under the line",
   (b) a thin *solid* stroke on top keeping the data edge crisp, (c) one gradient
   family per chart. Saturated multi-hue stops or pastel-washing everything reads
   decorative. Option D's discipline: gradients encode, never paint.
5. **Tooltips come in two credible families**: minimal light (Vercel, GitBook — dot
   + value, hairline border) and dark inverse (Monarch, Posh — per-series rows,
   total, strong contrast). A dark tooltip is the single cheapest "designed" signal
   a chart system can send — candidate differentiator for B and D.
6. **Crosshair + hover-revealed marker is the modern hover grammar** (Vercel, Posh).
   Persistent markers on every data point (Gorgias) read dated; the baseline's
   hover-only markers are already right.
7. **Donut anatomy**: strong center total + value-bearing legend beside/below
   (Wrike, Basedash); data labels on slices only when few and large. Consistent
   ring thickness matters more than slice color count.
8. **Axis restraint**: Shopify shows two $ labels; Vercel three gridlines; Klaviyo
   right-edge axis. Fewer, lighter, *consistent across every chart on the page* —
   the baseline's per-widget axis policy (area shows, bar hides) is the tell that
   there's no system.

## Direction seeds

### Option A — Restrained Blue
- **Philosophy**: calm precision — one blue, weighted by importance, neutrals do the
  supporting work. The safest, most enterprise direction (Shopify, Vercel, Chatbase).
- **Signature moves**: disciplined single-hue ramp with a *true neutral* for
  low-priority series (takeaway 2); hairline grid; sparse consistent axes; unified
  minimal-light tooltip; comparison as pale dashed.
- **Risk**: reads as "the baseline, again". Mitigation: this option is where the
  *system* discipline shows — unified legend anatomy, one axis policy, neutral slot,
  fixed adjacency-safe ramp. It must look like the baseline after a principal
  designer systematized it.

### Option B — Sophisticated Multi-Color
- **Philosophy**: color is meaning — one hue per data family, used intentionally
  (Stripe, Customer.io, Zendesk).
- **Signature moves**: 5 hue-spaced editorial hues + neutral 6th slot, saturation
  held one notch down; dark inverse tooltip (Monarch); dot/round legend markers;
  crisp 2px lines with no fills on multi-series.
- **Risk**: rainbow drift (ref 14). Mitigation: fixed assignment, desaturation,
  neutral slot, validator-enforced spacing.

### Option C — Maropost Blue → Teal → Green
- **Philosophy**: an ownable connected family — Maropost blue flowing through teal
  into green, one temperature (Base44 identity, Expensify, Klaviyo).
- **Signature moves**: analogous 6-slot ramp interleaving lightness so neighbors
  differ by hue AND lightness; green kept deep so the family doesn't collide with
  the semantic positive; soft family-tinted area fills.
- **Risk**: adjacent-hue confusability (teal vs green) under CVD. Mitigation:
  lightness interleave + validator CVD gate; semantic positive gets its own
  reserved green, distinct from series green.

### Option D — Modern Gradient / Progressive
- **Philosophy**: data with presence — depth and light without noise (Posh, Later,
  Hyper Charts heritage; the gradient direction Ross already responded to in round 3,
  matured: subtle, light-mode-first, zero neon).
- **Signature moves**: vertical fade-to-transparent area fills under thin solid
  strokes; axis-ramp gradient bars with rounded caps; gradient donut arcs; dark
  tooltip; slightly stronger KPI spark fill.
- **Risk**: decoration / "AI-generated dashboard" smell (refs 21, 24). Mitigation:
  every gradient encodes (fade = area, ramp = magnitude); grid stays; labels stay
  quiet; saturation capped; no glow beyond a 1px-blur shadow on the lead stroke.
