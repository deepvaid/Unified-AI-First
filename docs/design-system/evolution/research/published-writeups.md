# Published Design Thinking — Reference Brands

Research pulled to ground our "confident editorial" direction (Inter + Picton blue `#0073AB`, editorial mastheads, ink panels, tabular numerals, silent tables, restrained motion, verb-first microcopy) in brands' own stated design principles. Each entry: URL(s), stated principles with short quotes, concrete specs, and how it informs our system.

---

## 1. Wise (wise.design)

**URLs:**
- https://wise.design/foundations/colour
- https://wise.design/foundations/typography
- https://medium.com/transferwise-design/accessible-but-never-boring-part-1-ec8222f1f364 (Stephanie Smith, Wise Design)
- https://medium.com/transferwise-design/creating-a-wise-typographic-set-1052503f9f01 (Ness Grixti, Wise Design)

**Note:** wise.design's foundation pages are client-rendered (JS); WebFetch returned only page shells. The Medium engineering/design posts (same team, same system) supplied the substantive quotes and specs instead.

**Stated principles:**
- On accessible color: *"WCAG 2 as our baseline check, and the more nuanced APCA as our primary method for picking colours."* — Stephanie Smith
- WCAG's math is called out as a weakness, not a gold standard: *"doesn't always reflect how people see — especially when backgrounds are darker than text."*
- Color ambition stated as restraint plus boldness together, not a contradiction: *"be bolder with less, and open to all."*
- On typography process: *"Experiment and challenge your designs"* and *"It's important to fix your system before implementing big changes."*
- On simplification as a system goal: *"Semantic naming and a reduction in styles will reduce load on your documentation."*
- On international type: *"Don't give your users a worse experience just because they speak a different language."*

**Concrete specs:**
- Type scale consolidated from 22 styles down to 14 (4 display, 4 title, 6 body), later reduced further to 12 — a deliberate, repeated pruning of the scale.
- Line-height: tight 85% for their display face (Wise Sans) vs. looser 105% for Latin body text — display tightens, body loosens.
- Product typeface is Inter (146–148 languages supported), chosen explicitly for accessibility and load-time reasons, not just aesthetics.
- Colorblind testing covers "the 8 most common types of colour blindness" as a validation gate, not just automated contrast checks.

**How it informs our system:** Wise's APCA-over-WCAG stance and "fix the system before big changes" discipline support treating our tabular-numerals/ink-panel work as a scale-reduction exercise, not an addition. Their tight-display/loose-body line-height split validates our plan to tighten tracking at hero numeral sizes (48–56px) while keeping body relaxed. Their explicit style-count reduction (22→14→12) is a good citable precedent for justifying a small, disciplined type scale rather than an expansive one.

---

## 2. Linear

**URLs:**
- https://linear.app/now/a-design-reset (Part I — process/organizational)
- https://linear.app/now/how-we-redesigned-the-linear-ui (Part II — visual specifics)

**Stated principles (Part II, the substantive one):**
- On hierarchy: Karri Saarinen (co-founder) — *"Reduce visual noise, maintain visual alignment, increase hierarchy."*
- On alignment as a felt quality, not just a rule: Yann-Edern Gillet (design) — *"Alignment you'll feel after a few minutes using the app."*
- On restrained, timeless chrome: Gillet — *"Limit chrome usage in calculations for neutral, timeless appearance."*
- On light/dark contrast handling: Gillet — *"Text and icons darker in light mode, lighter in dark mode."*
- On typography split: Gillet — *"Inter Display for headings, regular Inter for text elements."* (Directly matches our Inter/Inter Display split.)
- On not over-decomposing a redesign: Saarinen — *"A redesign should not completely disassemble the product to atomic parts."*
- On shipping cadence: Saarinen — *"Do a redesign quickly or you'll block almost every project."*

**Color system specs:**
- Built on LCH (perceptually uniform) color space. Andreas Eldh (engineering): *"LCH is perceptually uniform — red and yellow at lightness 50 appear equally light."*
- Radical palette compression: *"Define three variables: base color, accent color, and contrast instead of [nearly] 98."* — i.e., derive an entire theme from 3 inputs rather than hand-picking dozens of values.

**Part I (process) principles:**
- *"Design debt is real"* and should be paid off in deliberate sweeps every 2–3 years rather than continuously patched.
- *"The product experience is holistic and visual... if you update just one module at a time, the overall experience becomes more disjointed"* — an argument for systemic, not piecemeal, redesign.

**How it informs our system:** Linear's explicit Inter/Inter Display split for headings vs. text is the closest published precedent to our masthead-at-28px + hero-numerals plan — it's worth citing directly. Their "3 variables instead of 98" palette philosophy backs our one-accent-color (#0073AB) discipline: derive states from a small base rather than proliferating hex values. Their light/dark contrast rule (darker text in light mode, lighter in dark mode, rather than a single gray scale) is a concrete rule we should adopt for ink panels in dark mode.

---

## 3. Intercom

**URL:** https://www.intercom.com/blog/fundamentals-good-interaction-design/

**Stated principles (9 fundamentals):**
1. Consistency of representation — *"Recognizing is easier than recalling."*
2. Establish clear hierarchy between information levels.
3. Visual rhythm and balance for scannability.
4. Favor convention over cleverness — *"Favor common interaction design patterns over clever bespoke optimizations."*
5. Progressive disclosure — *"Start with simple defaults and gradually reveal flexibility."*
6. Edit ruthlessly — *"Be clear and concise... edit ruthlessly"* to strip unnecessary interface content.
7. Performance as a design feature — *"Performance is a feature that needs to be carefully considered."*
8. Guide users past dead ends — explicitly calls out empty states and error states as places users get stuck.
9. Accessibility by default — reuse accessible components rather than bespoke ones.

**On empty states specifically** (from onboarding-adjacent posts): a well-designed empty state *"offer[s] reassurance by providing context and setting expectations"* rather than reporting "there's nothing to see here" — many products "miss a giant opportunity" by not doing this.

**How it informs our system:** "Edit ruthlessly" is a direct citation for our verb-first, terse microcopy principle — Intercom frames concision as an interaction-design fundamental, not just a writing-style preference. Their empty-state stance (context + expectation-setting + CTA, never a bare "nothing here") is exactly our `MpEmptyState` pattern's justification and should be quoted in the empty-state section of the direction doc.

---

## 4. Stripe

**URL:** https://stripe.com/blog/accessible-color-systems

**Stated principles:**
- Three explicit design goals for the color system: *predictable accessibility, clear/vibrant distinguishable hues, and consistent visual weight* ("no single color appears to take priority over another at each level").
- Rejected HSL for color work: *"There's no such thing as 'very colorful dark yellow'"* — HSL's lightness math doesn't match human perception, so they moved to CIELAB (Lab), a perceptually uniform space.
- On methodology: *"We just needed to change how we thought about color"* and *"This allowed us to validate our intuitions and use numbers to compare."*

**Concrete specs:**
- WCAG 2.0 contrast minimums: 4.5:1 for small text, 3.0:1 for large text.
- Rule of thumb baked into their palette generation: any two colors guaranteed sufficient contrast for small text if separated by 5 palette levels; 4 levels sufficient for icons/large text.
- Their original (pre-redesign) palette failed this bar: none of the default text colors except black met 4.5:1.

**How it informs our system:** Stripe's "consistent visual weight across hues" principle directly supports one-accent-color discipline extended to any semantic/status colors we add — status chips should be built the same perceptually-uniform way so no single status color reads as "louder" than another. Their Lab/HSL argument is useful ammunition if we ever need to justify picking status-chip colors by contrast math rather than by eye.

---

## 5. Anthropic / Claude brand

**URLs:**
- https://www.anthropic.com/news/claude-design-anthropic-labs (product-feature focused; limited brand-philosophy content)
- https://studiosiraj.com/blog/anthropic-brand-identity-case-study (secondary case-study write-up, not an Anthropic-published primary source)
- https://geist.co/work/anthropic (Geist, the studio that built the identity — closest to a primary source)

**Caveat:** Anthropic has not published its own detailed brand-philosophy essay; the richest material here comes from Geist (the design studio, a primary party to the work) and a third-party case study analyzing it. Treat the case-study quotes as secondary commentary, not Anthropic's own words.

**Stated principles (Geist, primary):**
- *"Everything Anthropic does is focused on aligning technology to human values."*
- On the logo: *"A pure, typographic logo with a single standout detail"* — the slash — *"a reference to the code that underlays AI."*
- On typography: pairs *"Styrene family by Commercial Type, and Klim's Tiempos family"* for a system that is *"both technically refined and charmingly quirky."*
- On color: built *"a color system that would bring warmth to the brand while being able to handle the dual needs of marketing communications and product UI."*
- On philosophy: *"Function first without losing the soul of the brand."*

**Secondary case-study framing (Studio Siraj, not Anthropic-attributed):**
- Palette described as *"a warm orange that sits somewhere between amber and terracotta"* with *"weight to it"* rather than consumer-app optimism; *"the broader palette balances warmth against restraint. Muted tones. Careful neutrals."*
- Typography described as *"editorial... closer to a scientific journal than a startup homepage."*
- On restraint in-product: *"Inside Claude's interface, it recedes, letting the conversation take the foreground"* — brand builds trust "in the background."
- Framing line worth quoting for our doc's tone: *"These are not aesthetic choices. They are a theory of how trust works, expressed in color and type."*

**How it informs our system:** The Geist-confirmed typography/color intent ("technically refined and charmingly quirky," warmth balanced against restraint) supports our ink-panel + one-accent approach: warmth and restraint aren't opposites. The "editorial, closer to a scientific journal" framing (secondary source) is a strong parallel to our "confident editorial" name for the direction, but since it's third-party commentary rather than an Anthropic-published statement, cite it as such in the doc rather than as Anthropic's own claim.

---

## 6. Mailchimp Content Style Guide

**URL:** https://styleguide.mailchimp.com/voice-and-tone/

**Stated principles:**
- Voice/tone distinction: *"You have the same voice all the time, but your tone changes"* depending on context and the reader's emotional state.
- Active voice mandate: *"Use active voice. Avoid passive voice."*
- Plain language mandate: *"Write in plain English"* — avoid slang and jargon.
- Positive framing: *"Use positive language rather than negative language."*
- On humor: *"feel free to be funny when it's appropriate and when it comes naturally to you. But don't go out of your way to make a joke"* — forced humor is worse than none.
- Priority ordering, clarity over personality: *"it's always more important to be clear than entertaining."*
- Purpose framing: writing should *"educate users... without patronizing or confusing them, so they can get their work done and get on with their lives."*

**Correction to our assumptions:** We had assumed a "no exclamation marks" rule as part of verb-first microcopy discipline. **The Mailchimp guide does not state this rule anywhere in the voice-and-tone section** — it governs tone via active voice, plain English, and positive framing, not punctuation bans. If we want a no-exclamation-marks rule, it should be sourced as our own house rule, not attributed to Mailchimp.

**How it informs our system:** Mailchimp's "clear over entertaining" priority ordering is a good grounding citation for verb-first, low-decoration microcopy — active voice and plain English map directly onto declarative, verb-first copy. But we should not cite Mailchimp for the exclamation-mark rule specifically.

---

## 7. Inter font family (official)

**URLs:**
- https://rsms.me/inter/ (official Inter site/documentation)
- Cross-referenced against optical-sizing writeups (Nan Xiao, madegooddesigns) since rsms.me's live feature-explorer page didn't surface the Inter Display size guidance in static fetch.

**Stated principles / specs:**
- Tabular figures are Inter's **default** numeral behavior, not an opt-in: *"Fixed-width numbers are useful for tabular data, where comparing columns across rows is desired."* Use `font-feature-settings: "tnum" 1` (or the `tnum` CSS value) for any numeric UI that must align — dashboards, tables, timestamps.
- Stylistic sets: ss01 (open digits), ss02 (disambiguation, incl. slashed zero), ss03 (round quotes/commas), ss04 (disambiguation, no zero), ss05/ss06 (circled/squared characters), ss07/ss08 (square punctuation/quotes).
- Character variants: cv01 (alternate one) through cv13; **cv11 = single-story "a"**, a geometric/modern variant recommended for headings and display/brand text alongside ss03/ss07/ss08.
- Inter Display is a distinct optical cut with **redesigned glyphs** (not just scaled-up regular Inter) — tighter spacing and higher contrast tuned for headline sizes.

**Size threshold (confirms our assumption):** Regular Inter is tuned for roughly **12–24px** (text/UI sizes); Inter Display is intended for roughly **28–80px** (headline/display sizes). Practical guidance found: *"use regular Inter for body text and sizes up to around 24px, and switch to Inter Display for larger headings... at 28px and above."*

**How it informs our system:** This directly validates our plan's numbers — masthead at 28px is exactly the threshold where published guidance says to switch to Inter Display, and hero numerals at 48–56px sit well inside Inter Display's intended range. Tabular numerals being Inter's *default* (not a special mode) also validates "silent tables" — we get column alignment for free by not disabling `tnum`, we don't need to fight the font to get it.

---

## Corrections to our assumptions

1. **No-exclamation-marks rule is not Mailchimp's.** Mailchimp's style guide grounds voice in active voice, plain English, and positive framing — it never states a no-exclamation-marks rule. If we keep this rule, attribute it to our own house style, not to Mailchimp.
2. **Inter Display threshold — confirmed, not corrected.** We assumed Inter Display for sizes above ~24px; published guidance puts the practical switchover at **28px**, matching our masthead spec exactly. No change needed, but cite the range as "24–28px" rather than a single hard number, since sources hedge slightly.
3. **Anthropic's brand rationale is largely third-party, not Anthropic-published.** The richest "warmth + restraint" language (editorial typography, "theory of how trust works") comes from Studio Siraj's case-study commentary, not from Anthropic itself. Cite Geist (the studio that did the actual work) for anything we present as closer to a primary source, and flag the Studio Siraj quotes as secondary analysis in the direction doc.
4. **Wise's own site (wise.design) didn't yield content via static fetch** — it's JS-rendered. All Wise specifics above come from Wise Design team's own Medium posts (same authors, same system), which is a reasonable substitute but worth noting if someone tries to re-verify directly against wise.design later.
