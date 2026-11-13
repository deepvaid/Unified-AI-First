# LiquidSky design QA — Compare, Approve, Lock

How we check that the components LiquidSky builds match this design system, without Figma.

## The three steps

1. **Compare.** `npm run qa:compare` puts the design and the build side by side and lists what
   differs. Nobody writes tests for it. The developer reads the list and fixes it before asking
   for review.
2. **Approve.** The designer reviews the list and the screenshots, and tags anything still open as
   **Blocker**, **Must-fix** or **Nice-to-have**. With no Blocker left, the component is approved.
3. **Lock.** QA's Playwright run takes a screenshot of the approved component in the LiquidSky
   Storybook. That screenshot is the baseline. If the look changes later, the test fails until
   design approves the change.

Two rules:

- Functional QA does not wait for design review. Both run at the same time.
- Only a Blocker holds a release.

| Tag | What it means | What happens |
|---|---|---|
| Blocker | The wrong component, a missing or broken state, or an accessibility failure | Holds the release |
| Must-fix | A value differs from the design: size, spacing, colour or type | Fixed in the same sprint. QA carries on |
| Nice-to-have | A matter of taste, or something the design does not cover | Goes to the backlog |

## Checking that a component update does not break a page

Review is component by component, because the same components appear on every page. To make sure
an update to one of them does not break a page, QA also keeps screenshots of a few full pages in
the same Playwright run. If a page looks different after a component update, its test fails. A
change that was expected is confirmed by design and that page's baseline is saved again; a change
that was not expected goes back to the developer.

## Where the baseline comes from

From the LiquidSky Storybook, on the day design approves. A screenshot of an `Mp*` story cannot be
pixel-compared with an `App*` component (different markup, sample content and frame), so the design
is compared by numbers and side by side, and the pixel baseline comes from the build itself.
QA needs nothing from design to start: see `playwright-example.md`.

## What the comparison covers

Size, spacing, corner radius, colour and type, at rest, in light and dark. Hover, focus and layout
are checked by eye from the screenshots. A listed difference is a starting point for the designer,
not a verdict.

A component marked `no-reference` in the map has nothing to compare against, and one marked
`partial` only in part. Those need a design decision and should not sit in the review queue.

## Running it

```
npm run build-storybook && npm run qa:export   # only after a reference component changed
npm run qa:compare                             # needs LIQUIDSKY_STORYBOOK in .env.local
```

`qa:compare` writes `output/qa-compare/` (git-ignored): `report.json` and `site/`, a page with the
explainer, the screenshots and the differences. Findings about the build are internal, so the page
is shared privately and never committed.

| File | What it holds |
|---|---|
| `src/stories/qa/liquidskyMap.ts` | Each LiquidSky component, its reference stories, and the parts and properties that are checked |
| `src/stories/qa/liquidskyPairs.ts` | The matching LiquidSky story and selectors for each reference story |
| `public/qa-reference/` | The reference values and screenshots, written by `qa:export` |
| `scripts/qa-compare-page.html` | The page template |

Only like-for-like parts are paired. Where the two libraries build something differently, the part
is left to the eye rather than reported as a difference.
