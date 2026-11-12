# The Playwright files QA needs

Two small files guard the look of every approved component. There are no selectors and no
per-component tests: approving a component is one line in a list.

Baselines come from the LiquidSky Storybook itself, taken when design approves a component.

## `visual.spec.ts`

```ts
import { test, expect } from '@playwright/test'

// Pages that design has approved. Add one line per approval.
// A page that opens from a button names that button in `open`.
const APPROVED: (string | { id: string; open: string })[] = [
  'components-apppagetitle--default',
  { id: 'components-appdrawerwrapper--default', open: "button:has-text('Open Drawer')" },
]

const STORYBOOK = process.env.STORYBOOK_URL // the Storybook under test
const THEMES = ['marobaseLight', 'marobaseDark']

for (const entry of APPROVED) {
  const { id, open } = typeof entry === 'string' ? { id: entry, open: undefined } : entry
  for (const theme of THEMES) {
    test(`${id} · ${theme}`, async ({ page }) => {
      await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
      await page.locator('#storybook-root > *').first().waitFor({ state: 'attached' })
      await page.evaluate(() => document.fonts.ready)
      if (open) await page.locator(open).first().click()
      await expect(page).toHaveScreenshot(`${id}--${theme}.png`, { animations: 'disabled' })
    })
  }
}
```

The page id is the last part of a Storybook address: `…?path=/story/<page id>`.

## `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  // One folder of approved screenshots, named after the Storybook page.
  snapshotPathTemplate: '{testDir}/baselines/{arg}{ext}',
  use: { viewport: { width: 1280, height: 800 } },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
})
```

## Commands

| When | Run | What it does |
|---|---|---|
| Design approves a component | `npx playwright test -g "<page id>" --update-snapshots` | Saves that page's screenshots as the baseline |
| Every build | `npx playwright test` | Fails if an approved page no longer looks like its baseline |

Re-saving a baseline is a design decision: it needs the designer's approval on the ticket.

Tried on 2026-11-12 against three pages of the LiquidSky Storybook, in light and dark: the first
run saved six baselines and the second matched all six.
