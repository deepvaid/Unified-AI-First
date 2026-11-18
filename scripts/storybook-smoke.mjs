#!/usr/bin/env node
/**
 * Opens every story in the built Storybook and fails if one is broken.
 *
 *   npm run build-storybook && npm run storybook:smoke
 *   npm run storybook:smoke -- --only dashboards      (story ids containing "dashboards")
 *
 * A story fails when it throws while rendering, its play function throws, the page raises an
 * uncaught error, it logs a console error, or it renders nothing at all. Vue warnings (a missing
 * required prop, an invalid prop value) are listed and fail the run too: in a story they mean the
 * example is not showing what it says.
 *
 * Three checks on the Storybook itself follow: the Theme toolbar changes a story that is already
 * open, an example on a docs page is not a full screen tall, and every story the LiquidSky map
 * links to exists.
 *
 * Uses the installed Chrome (see qa-lib.mjs).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QA_COMPONENTS } from '../src/stories/qa/liquidskyMap.ts'
import { VIEWPORT, launchPage, serveStatic } from './qa-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storybookDir = path.join(root, 'dist-storybook')
const PORT = 6112
const WORKERS = 4
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : ''

if (!fs.existsSync(path.join(storybookDir, 'index.json'))) {
  console.error('dist-storybook/ not found. Run `npm run build-storybook` first.')
  process.exit(1)
}
const entries = Object.values(JSON.parse(fs.readFileSync(path.join(storybookDir, 'index.json'), 'utf8')).entries)
const allIds = new Set(entries.map((entry) => entry.id))
const storyIds = entries.filter((entry) => entry.type === 'story' && entry.id.includes(only)).map((entry) => entry.id)

const server = await serveStatic(storybookDir, PORT)
const { browser, page: firstPage } = await launchPage()
const context = firstPage.context()

// Storybook assigns its channel to this global before it renders anything, so trapping the
// assignment is the one place a listener can attach without missing the first story's events.
await context.addInitScript(() => {
  window.__smoke = []
  let channel
  Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', {
    configurable: true,
    get: () => channel,
    set: (value) => {
      channel = value
      for (const event of ['storyRendered', 'storyErrored', 'storyThrewException', 'storyMissing', 'playFunctionThrewException']) {
        value.on(event, (payload) => window.__smoke.push([event, payload?.message ?? payload?.description ?? payload?.title ?? '']))
      }
    },
  })
})

const base = `http://localhost:${PORT}`
const failures = {}
const fail = (id, message) => { (failures[id] ??= new Set()).add(message.replace(/\s+/g, ' ').slice(0, 220)) }

async function checkStory(page, id) {
  const logged = []
  const onConsole = (message) => {
    const text = message.text()
    if (message.type() === 'error' && !text.startsWith('Failed to load resource')) logged.push(`console error: ${text}`)
    if (message.type() === 'warning' && text.startsWith('[Vue warn]')) logged.push(text.split('\n')[0])
  }
  const onPageError = (error) => logged.push(`uncaught: ${error.message}`)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  try {
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`)
    await page.waitForFunction(() => window.__smoke?.length > 0, null, { timeout: 20000 })
    const events = await page.evaluate(() => window.__smoke)
    for (const [event, message] of events) if (event !== 'storyRendered') fail(id, `${event}: ${message}`)
    // No visible text anywhere (overlays and drawers render outside the story root) and nothing
    // with a size in the story or the overlay layer.
    const empty = await page.evaluate(() => {
      const sized = (root) => Boolean(root) && [...root.querySelectorAll('*')].some((el) => el.offsetWidth > 0 && el.offsetHeight > 0)
      return !document.body.innerText.trim() && !sized(document.querySelector('.mp-story-canvas__content')) && !sized(document.querySelector('.v-overlay-container'))
    })
    if (empty) fail(id, 'renders nothing')
  } catch (error) {
    fail(id, `did not render: ${error.message.split('\n')[0]}`)
  }
  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  for (const message of logged) fail(id, message)
}

const queue = [...storyIds]
const pages = [firstPage, ...await Promise.all(Array.from({ length: WORKERS - 1 }, () => context.newPage()))]
let done = 0
await Promise.all(pages.map(async (page) => {
  for (let id = queue.shift(); id; id = queue.shift()) {
    await checkStory(page, id)
    if (++done % 100 === 0) console.log(`  ${done}/${storyIds.length}`)
  }
}))

// ── Checks on the Storybook itself ───────────────────────────────────────────
const checks = []
const page = firstPage
const probe = entries.find((entry) => entry.id === 'atoms-mpstatuschip--default') ?? entries.find((entry) => entry.type === 'story')

await page.goto(`${base}/iframe.html?id=${probe.id}&viewMode=story`)
await page.waitForFunction(() => window.__smoke?.length > 0)
await page.evaluate(() => window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateGlobals', { globals: { theme: 'dark' } }))
await page.waitForTimeout(800)
const themed = await page.evaluate(() => ({
  html: document.documentElement.dataset.theme,
  app: document.querySelector('.v-application')?.classList.contains('v-theme--maropostDark'),
}))
if (themed.html !== 'dark' || !themed.app) checks.push('Theme toolbar: switching to Dark did not change the open story')

const docs = entries.find((entry) => entry.type === 'docs' && entry.id === `${probe.id.split('--')[0]}--docs`)
if (docs) {
  await page.goto(`${base}/iframe.html?viewMode=docs&id=${docs.id}`)
  await page.waitForSelector('.docs-story', { timeout: 20000 })
  await page.waitForTimeout(1500)
  const height = await page.evaluate(() => Math.round(document.querySelector('.docs-story').getBoundingClientRect().height))
  if (height >= VIEWPORT.height * 0.9) checks.push(`Docs page: an example of ${docs.title} is ${height}px tall, a full screen`)
}

for (const component of QA_COMPONENTS) {
  for (const story of component.stories) {
    if (!allIds.has(story.id)) checks.push(`LiquidSky map: ${component.key} links to "${story.id}", which does not exist`)
  }
}

await browser.close()
server.close()

// ── Report ───────────────────────────────────────────────────────────────────
const failed = Object.keys(failures)
if (failed.length) {
  console.error(`\n${failed.length} of ${storyIds.length} stories failed:\n`)
  for (const id of failed.sort()) {
    console.error(id)
    for (const message of failures[id]) console.error(`    ${message}`)
  }
}
if (checks.length) {
  console.error(`\n${checks.length} Storybook check${checks.length === 1 ? '' : 's'} failed:\n`)
  for (const check of checks) console.error(`  ${check}`)
}
if (failed.length || checks.length) process.exit(1)
console.log(`\n${storyIds.length} stories rendered cleanly. Theme switch, docs heights and LiquidSky links pass.`)
