# Using the QA reference from a LiquidSky Playwright test

The reference is published with the design sandbox:

- `https://ai-first-maropost.vercel.app/qa-reference/manifest.json` — every component, its status,
  its reference stories and screenshots
- `…/qa-reference/spec/<component>.json` — the spec contract
- `…/qa-reference/png/<component>/<story>--<light|dark>.png` — what it should look like

A spec lists **parts** by name. Each part has the computed CSS values for light and dark, and the
design token that owns the value where there is one:

```json
{ "part": "footer", "props": { "padding": { "light": "20px", "dark": "20px", "token": "component.dialog.padding" } } }
```

Part names are the stable key. The selectors differ between the two libraries, so the test maps
each part name to its own selector (the `data-gs` hooks).

## 1. Assert the spec contract

```ts
import { test, expect } from '@playwright/test'

const REFERENCE = 'https://ai-first-maropost.vercel.app/qa-reference'
// The LiquidSky Storybook story under test.
const STORY = `${process.env.LIQUIDSKY_STORYBOOK}/iframe.html?id=<story-id>`

// Part name in the spec → selector in LiquidSky.
const SELECTORS: Record<string, string> = {
  header: '[data-gs="dialog-header"]',
  body: '[data-gs="dialog-body"]',
  footer: '[data-gs="dialog-footer"]',
  'primary button': '[data-gs="dialog-confirm"]',
}

for (const theme of ['light', 'dark'] as const) {
  test(`AppConfirmationDialog matches the spec (${theme})`, async ({ page, request }) => {
    const spec = await (await request.get(`${REFERENCE}/spec/dialogs.json`)).json()
    const story = spec.stories.find((s: { id: string }) => s.id === 'molecules-mpconfirmdialog--default')

    const liquidskyTheme = theme === 'light' ? 'marobaseLight' : 'marobaseDark'
    await page.goto(`${STORY}&globals=theme:${liquidskyTheme}`)

    for (const part of story.parts) {
      const selector = SELECTORS[part.part]
      if (!selector || part.state) continue
      for (const [property, expected] of Object.entries<Record<string, string>>(part.props)) {
        await expect.soft(page.locator(selector).first(), `${part.part} · ${property}`)
          .toHaveCSS(property, expected[theme])
      }
    }
  })
}
```

`expect.soft` reports every mismatch in one run. That output is the developer's self-check and
goes in the ticket before design review starts.

Parts with `"state": "hover"` are measured while hovered: call `locator.hover()` first.

## 2. Guard the approved look

Once design has signed the component off, capture it. From then on this fails on any unintended
visual change:

```ts
test('AppConfirmationDialog — approved baseline', async ({ page }) => {
  await page.goto(`${STORY}&globals=theme:marobaseLight`)
  await expect(page).toHaveScreenshot('app-confirmation-dialog--light.png', { animations: 'disabled' })
})
```

Updating that snapshot (`--update-snapshots`) is a design decision: it needs a designer's OK on
the ticket.

## Notes

- Colours are compared as the browser reports them (`rgb(…)`, `rgba(…)`, sometimes `oklch(…)`).
  Both libraries run on Vuetify 3, so the formats line up; if one does not, compare that property
  by eye against the screenshot and report it.
- A component marked `partial` or `no-reference` in the manifest has parts with no reference.
  Do not fail a build on those; raise them as a design question.
- Heights of containers that grow with content (table rows, dialog bodies) are not in the
  contract. Padding, gaps, radii, type and colour are.
