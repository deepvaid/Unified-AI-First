/**
 * Shared by qa-export.mjs (measures this Storybook) and qa-compare.mjs (measures the LiquidSky
 * build): one browser setup and one way of reading a part's computed CSS, so both sides are
 * measured identically.
 */
import { chromium } from 'playwright-core'

export const THEMES = ['light', 'dark']
export const VIEWPORT = { width: 1280, height: 800 }

/** Uses the installed Chrome (playwright-core downloads no browser). QA_BROWSER_CHANNEL overrides it. */
export async function launchPage() {
  const browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL ?? 'chrome' })
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  return { browser, page: await context.newPage() }
}

/** A resting frame: no transitions, fonts loaded, the listed parts attached, pointer parked. */
export async function settle(page, selectors = []) {
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  // Stories that open a menu from a play function settle later than the first paint.
  for (const selector of selectors) await page.locator(selector).first().waitFor({ state: 'attached', timeout: 4000 }).catch(() => {})
  await page.mouse.move(0, 0)
}

/**
 * Computed CSS of the first element matching `part.selector`, or null when nothing matches or the
 * part's pointer state cannot be applied. `tokens` maps a CSS property to a custom property whose
 * root value is returned beside it. `preferVisible` skips hidden matches (a responsive twin of
 * the same control) when a visible one exists.
 */
export async function measure(page, part, tokens = {}, { preferVisible = false } = {}) {
  const all = page.locator(part.selector)
  const visible = preferVisible ? all.filter({ visible: true }) : all
  const target = (await visible.count()) > 0 ? visible.first() : all.first()
  if ((await target.count()) === 0) return null
  const stateTarget = part.stateTarget ? page.locator(part.stateTarget).first() : target
  try {
    if (part.state === 'hover') await stateTarget.hover({ timeout: 4000 })
    if (part.state === 'focus') await stateTarget.focus({ timeout: 4000 })
  } catch {
    return null
  }
  const values = await target.evaluate((el, { props, tokens }) => {
    const style = getComputedStyle(el)
    const rootStyle = getComputedStyle(document.documentElement)
    return Object.fromEntries(props.map((prop) => [prop, {
      value: style.getPropertyValue(prop),
      tokenValue: tokens[prop] ? rootStyle.getPropertyValue(tokens[prop]).trim() : undefined,
    }]))
  }, { props: part.props, tokens })
  if (part.state) await page.mouse.move(0, 0)
  return values
}
