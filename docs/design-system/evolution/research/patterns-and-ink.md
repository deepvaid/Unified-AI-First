# Patterns & Ink — Mobbin research for "confident editorial" direction

Research pass for five signature moves: editorial masthead, ink panels, numerals-as-brand, silent tables, signature motion. Screens pulled from Mobbin (web platform), 8 searches, images inspected directly.

---

## 1. Stripe payment detail — record/detail anatomy

- [Stripe payment succeeded](https://mobbin.com/screens/f3244c8a-43d2-486f-a824-ec19460c23ed)
- [Stripe payment with checkout summary](https://mobbin.com/screens/da063812-68ec-4fe5-b927-981be49b86d2)
- [Stripe payment breakdown with net total](https://mobbin.com/screens/ac5a2cc4-2eeb-46f6-b6da-95bba8be303b)

**Observable choices:**
- Header identity block: amount set large (~28-32px bold, currency code demoted to a smaller regular-weight suffix — e.g. "$5.59 SGD" with SGD roughly half the visual weight of the numeral) + status chip (pill, colored fill, small check icon) inline to the right.
- A metadata row directly under the amount: 3-4 label/value pairs in a single horizontal line ("Last update / Customer / Payment method / Risk evaluation"), each label in muted gray small-caps-adjacent text, value in default text weight directly below the label — not side by side.
- Timeline: left-aligned icon column (colored dot/icon per event type — pin, checkmark, lock) + event text + relative/absolute timestamp right-aligned on the same line. Rows separated only by generous vertical spacing, no card chrome, no divider lines between timeline rows except a single hairline before the next section.
- "Payment details" / "Payment breakdown" sections: strict 2-column label-value list, label left in muted gray, value right-aligned, numerals tabular-looking (aligned decimal points), a computed total row ("Net amount") visually promoted with bold weight and a hairline rule above it only.
- Color count: exactly one accent color for interactive links/actions (Stripe purple/blue), everything else neutral gray/black/white plus semantic status colors (green success, red dispute) confined to chips.

## 2. Attio CRM record — attributes panel + activity timeline

- [Attio company record — activity feed](https://mobbin.com/screens/d76ba56f-98c3-463f-9e1d-bbe4831ee47a)
- [Attio person record — details panel](https://mobbin.com/screens/c6047b75-c73d-4c86-a8ce-0b73b8becd4f)
- [Attio company record — team tab](https://mobbin.com/screens/8415dcfb-b1f0-46b2-adf3-278d1aa56b3f)

**Observable choices:**
- Right rail "Record Details" is a stacked label-value list (label small muted gray on its own line implicitly via icon+label, value directly right-aligned or inline), collapsible sections with a chevron and "Show all values →" progressive disclosure link at the bottom — panel never dumps every field at once.
- Activity timeline is grouped by relative time buckets ("This week / This month / 2024") as small uppercase-ish section labels, each entry showing an avatar, an inline diff of what changed ("Stage: Meeting → Prospecting" rendered as strikethrough-old → bold-new inline, not a separate audit table), and a collapsed "Hide/Show all changes" toggle when many fields change at once.
- Lists/pipeline membership rendered as its own mini label-value block nested inside the details panel, visually identical in styling to the record attributes above it — same list pattern reused for different data shapes.
- Icon-per-field-type (globe for domain, person icon for owner, star icons for a rating field) sitting to the left of every label at 14-16px, single gray tone, never colored except semantic status/tag chips.

## 3. Ramp-style fintech — spend cards + table

Direct Ramp screens weren't indexed; nearest editorial-fintech equivalents (Airwallex, Navan, Monarch) show the same composition Ramp is known for.

- [Airwallex cards summary — stat cards above table](https://mobbin.com/screens/871a9a24-673e-4994-9da1-b494114e0ab4)
- [Navan spend overview — KPI card grid](https://mobbin.com/screens/fad1bd88-6a9d-4671-8687-b9f6dec89e91)
- [Monarch spending — donut + transaction table + summary rail](https://mobbin.com/screens/531c7584-3778-4fbd-b447-9be37b68b06e)

**Observable choices:**
- Near-black left sidebar (Airwallex: true near-black, not navy) paired with an all-white content canvas — the ink color is confined to navigation chrome only, never bleeding into content cards.
- KPI/stat cards: flat, hairline border, no shadow, label in small muted gray text top, then one large bold number directly below (no icon inside the number block itself) — 2-3 cards per row max.
- Table rows are dense, numeric columns right-aligned, category values carry a small colored icon chip rather than a text badge, dates group rows under a bold date subheader instead of repeating the date per row (Monarch: "6 December 2023" as a run-in group header, not a table column).
- A right-hand "Summary" rail recaps totals (Total transactions, Largest transaction, Average, Total income/spending) as a vertical label-value stack — same pattern as Attio/Stripe detail panels, reused for a dashboard context instead of a record context.

## 4. Linear settings — sectioned shell rhythm

- [Linear customer request settings](https://mobbin.com/screens/361667c3-4fc5-4d0e-b3f1-6b7e5959054f)
- [Linear preferences — interface and theme](https://mobbin.com/screens/1157983e-78fc-4e00-90e9-d768580517fc)
- [Linear team settings — sectioned rows](https://mobbin.com/screens/e6325df4-b56e-4d43-b2a4-bab4c5f9e359)

**Observable choices:**
- Zero card chrome for settings rows — each row is label (bold, ~14px) + description (muted gray, ~13px) stacked on the left, control (toggle/select/chevron) right-aligned, full-width hairline divider below every row.
- Section headers ("Interface and theme", "Desktop application") are plain bold text with no background, no icon, sitting with roughly 24-32px of clear space above them and ~12-16px below before the first row — the whitespace itself demarcates sections, not a border or fill.
- Left settings rail nests by category with un-bulleted group labels ("Issues", "Projects", "Features", "Administration") in all-caps-adjacent small gray text, active item gets a subtle rounded highlight only, no left border accent.
- Row height is generous (~56-64px effective with description line) — this is a slower, more spacious rhythm than a typical dense enterprise settings table.

## 5. VALIDATION — ink panels inside light enterprise UI

- [Revolut Business — "Activate your account" hero](https://mobbin.com/screens/480acc51-97cd-45f9-b0dc-8feb37488e77)
- [Revolut Business — Treasury "Start earning" panel](https://mobbin.com/screens/643ca6b1-9c32-412e-a495-cdf422fbad48)
- [Modal — dark empty-state card](https://mobbin.com/screens/b7141269-ced2-4ab0-b614-e946824a6e6f)
- [Base44 — dark hero band inside dashboard](https://mobbin.com/screens/a1fff3e9-c0e4-4ea1-a63c-d6fa7df272fe)

**Verdict — where ink panels work:**
Revolut Business is the cleanest real-world proof: a single large dark panel (near-black to navy gradient-free) fills the primary content zone, holding exactly one message (bold uppercase-feeling headline, one line of gray subtext, a thin progress bar, one 3D rendered icon as the only decoration) with a plain white checklist rail beside it carrying the real content. It reads rich, not heavy, because: (a) it is the *only* dark surface on the page — the sidebar stays light/normal in that shell — (b) content inside is minimal — headline + subtext + progress, nothing dense, (c) the one accent (blue link/progress) is the only color note against near-black, and (d) radius and padding match the surrounding card system exactly, so it reads as "a card that's dark" not "a different UI."

**Verdict — where it fails / gets heavy:**
Where two dark surfaces compete on one screen (a dark sidebar *and* a dark hero, as in some Revolut/Airwallex shells) the page loses hierarchy — the eye can't tell which black is "structure" and which is "content." It also gets heavy when a dark panel is asked to hold dense content (a data table, multiple stat rows) rather than a single message — dark backgrounds amplify visual weight, so density that would be fine on white feels cluttered in ink. Base44's dark hero band works only because it's a thin strip carrying a title + 2-line subtitle above an otherwise all-white KPI grid — the moment it tried to hold the KPIs themselves it would fail.

## 6. Bulk actions floating toolbar

- [ClickUp — floating bulk bar, bottom-center](https://mobbin.com/screens/e9639493-e0a6-46c9-93d1-d3189cbdc3c7)
- [Aboard — floating "2 selected / Actions" pill](https://mobbin.com/screens/d5f21cd3-73d2-48ff-b9b9-6ed83ad1f73e)
- [YNAB — inline action bar above table](https://mobbin.com/screens/13e2610f-4a0c-4a66-8c5c-e07d1615eb61)
- [LangChain — floating selection card, bottom-right](https://mobbin.com/screens/6fbcce8e-09c0-47df-b701-da468e82af09)

**Observable choices:**
- Dominant pattern is a floating pill/bar, NOT full-width — margins on both sides, positioned bottom-center (ClickUp, Aboard) or bottom-right (LangChain), with a soft shadow doing the elevation work since the bar itself is only medium-dark gray, not black.
- Content order is consistent: count label first ("3 Tasks selected" / "2 selected"), a divider or "×" to clear, then icon-labeled action buttons in a row, with any destructive action (Delete) visually separated (red text/icon) at the end.
- Height is compact — roughly 44-52px — and the bar never grows taller than a single row regardless of how many actions are available; overflow goes into a "More" menu.

**Verdict — would an inverted dark bar read well:** Yes, and arguably better than ClickUp's mid-gray version — a true near-black bar with white text would read as more deliberate/branded than a generic gray toolbar, provided it stays to this same compact single-row height and floats with margin (not full-bleed) so it reads as a temporary overlay, not a permanent dark footer.

## 7. VALIDATION — masthead: eyebrow + large title

- [komoot — collection detail with breadcrumb + huge title](https://mobbin.com/screens/4c174d59-41a6-41e5-b64b-c5118277daf8)
- [GitBook — icon + title + subtitle masthead](https://mobbin.com/screens/af5bf3e9-fd52-4c1b-bd1d-9367957b188a)
- [Craft — document title over Page Info panel](https://mobbin.com/screens/2eed49ad-a75e-4ea2-9bc8-782c14bdee2d)

**Verdict:** True uppercase-letterspaced eyebrows are rare in enterprise SaaS chrome — most products (Linear, GitBook) skip the eyebrow entirely and jump straight to a bold title, relying on the persistent breadcrumb nav one level up instead. komoot is the closest real analogue: a tiny (~13px), regular-weight, sentence-case breadcrumb ("Vincent Reboul / Collections / Béziers…") sits directly above a very large, tight, bold title (~32-40px) with almost no gap between them — the *size ratio* (roughly 1:2.5–3) between eyebrow and title is doing the "editorial" work, not letterspacing or uppercasing. This validates the masthead's structural bet (small label, big tight title, minimal gap) while suggesting the uppercase+letterspacing treatment is a deliberate stylization beyond what's typically observed — worth keeping as our differentiator, but calibrate size/weight ratio against komoot's proof point rather than assuming uppercase alone reads as "editorial."

## 8. Drawer/panel over table

- [Airwallex — "Create vendor" drawer with tabs + sectioned fields](https://mobbin.com/screens/00a6bb63-fa38-49ea-89f7-17bba3ee1b80)
- [Vapi — dense two-column structured-output drawer](https://mobbin.com/screens/a2f7aa45-977a-43e8-91d4-e0da7e1acf1c)
- [Posh — fully dark-themed create-promo-code drawer](https://mobbin.com/screens/e9f30e15-3d7a-497a-943a-28d2c8bb0f1a)

**Observable choices:**
- Right-side drawer over a dimmed (not dark-tinted, just lowered-opacity) table; drawer itself stays pure white even when the app shell is dark elsewhere.
- Fields grouped under bold section labels ("Vendor contacts", "Bank account details", "Cards") with an "+ Add X" affordance per group rather than one long flat form — matches our MpFormDrawer + section pattern already.
- Footer is sticky, right-aligned, secondary action ("Save as draft") to the left of the primary ("Create") — primary always the rightmost, filled button.
- Vapi shows dense forms can use a 2-column grid (Min length / Max length side by side) without feeling cramped, as long as label-above-input spacing stays consistent with single-column fields.
- Posh proves an entirely dark-themed drawer-on-dark-canvas is viable as a *consistent* theme choice, but that's a different bet than our single-ink-panel-per-screen approach — not directly transferable since our shell is light-default.

---

## Calibration notes

1. **Ink panel: hard cap at one per screen**, and only where content is a single message (headline + short subtext + optional single CTA/stat) — never a table, list, or dense KPI row. If a screen needs more than one branded moment, use color/weight variation on a light surface for the second one instead of a second dark panel.
2. **Ink panel radius/padding should match the surrounding card system exactly** (our `lg` = 12px token) — Revolut's success case reads as "a card that happens to be dark," not a different component; don't give it a bespoke larger radius.
3. **Bulk bar: keep it compact (44-52px) and floating with margin**, bottom-aligned with a visible clear/count on the left and destructive actions visually separated (color, not just position) on the right — do not stretch it full-bleed edge to edge, that reads as a footer, not a transient bar.
4. **Masthead eyebrow-to-title size ratio should be pronounced (~1:2.5 or more)** — komoot's real-world proof point is a tiny breadcrumb-scale label under a title 2.5-3x its size with minimal vertical gap; our 28px title should sit close enough to the eyebrow that they read as one unit, not two stacked blocks.
5. **Label-value grids (record details, KPI summaries) are a reusable atom, not just a Stripe-specific pattern** — Attio, Ramp-adjacent fintechs, and Stripe all reuse the same "muted label above/left, value right or below" primitive across records, dashboards, and settings; worth formalizing as one internal pattern rather than rebuilding per view.
6. **Timeline rows need zero card chrome** — icon column + text + right-aligned timestamp, separated by spacing alone, with only one hairline rule marking a section boundary (e.g. before "Payment details" starts) — don't add per-row borders or alternating backgrounds.
7. **Silent-table numerics should right-align and use grouped date/section run-in headers** (Monarch's "6 December 2023" group label) rather than repeating a date column per row — reduces chrome further and reinforces the tabular-numeral brand move.
8. **Don't over-uppercase**: none of the validated real-world mastheads (komoot, GitBook, Linear) rely on uppercase eyebrow styling — if ours reads too shouty in practice, the fallback that still tested well is small sentence-case gray text at a steep size contrast with the title, not the uppercase treatment itself.
