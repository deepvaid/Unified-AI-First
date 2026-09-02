# New Journey — design-system gaps & out-of-scope notes

1. **Time-slot picker** — production's End time is 96 fifteen-minute slots with past slots
   disabled. Built as a `v-select` of slot items (`props.disabled` per item) inside
   `JourneySettingsForm`; there is no `MpTimeSelect`. *Suggested spec:* an `MpTimeSelect`
   (`step` 15/30/60, `min`/`max`, 12h/24h) so the date+time pair is one pattern across journeys,
   data journeys, campaign scheduling and delay-until steps — the three existing sites each
   hand-roll it.

2. **Prerequisite checklist** — the ✓ / ✗ rows + warning alert + action are composed from
   `MpListRow` + `MpAlert` inside `JourneyTemplateSetup`. It recurs conceptually (store setup
   checklist, campaign pre-flight). *Suggested spec:* `MpChecklist` taking
   `{ label, ok, hint?, action? }[]` with a summary line and status semantics baked in.

3. **Return-to-wizard after fixing a prerequisite** — production sets a `journey/returnFrom*`
   flag before sending the user to create a list / content / store / segment, and the wizard
   re-opens when the destination calls `returnToJourney()`. Behaviour was unverified (all
   prerequisites existed on UAT). The sandbox links out but does not bring the user back; the
   alert says the step-1 settings are kept, which is true only while the wizard stays mounted.
   Needs a product decision on how a "resume this wizard" affordance should look.

4. **Da Vinci build drawer** — after Build-with-AI → Create, production opens
   `JourneyBuilderAIDrawer` at 50% width inside the builder. Its contents could not be crawled
   without creating a journey. The sandbox opens the existing Da Vinci copilot (`MpDaVinciBot`,
   wide mode) with a build prompt as a stand-in; flagged in code.

5. **Content preview in a picker** — UAT's content selects are plain autocompletes with no preview.
   Kept that way (parity); the `content-picker` field type in the builder's node config is the
   richer alternative if the picker should ever preview.

6. ~~**Journey builder zoom (FYI from the brief)**~~ — **resolved in the journey-builder slice
   (2026-09-02).** Production flips every node between a compact tile and a full card at ~75 % zoom
   and re-lays them out; the rebuilt builder keeps the CSS `zoom` stage, switches the card face at
   the same threshold and keeps positions stable. See `docs/rebuild/journey-builder/`.

7. **Shell-level orphaned scrim on UAT** — an empty `v-overlay` intermittently stays over the page
   after the template dialog's Create and after the "New version available" dialog. Not a page
   defect and nothing to reproduce here; noted for the platform team.

## Shared-component findings surfaced by this slice (not fixed here)

8. **`MpDialog` body is not keyboard-scrollable** — when a dialog body overflows (the Email
   Re-Engagement and Lapsed Buyer template dialogs do at 925px), axe flags
   `scrollable-region-focusable` on `.mp-dialog__body`. The fix belongs in `MpDialog` (focusable
   body only while it overflows), not in a consumer.

9. ~~`JourneyMiniPreview` pill text contrast~~ — **resolved in this slice.** The preview was
   redesigned as surface cards: the category hue lives on a tinted icon disc only and the title sits
   on the card surface in `--text-primary`, so contrast no longer depends on the category colour.
   The template dialog now passes axe with no violations.
