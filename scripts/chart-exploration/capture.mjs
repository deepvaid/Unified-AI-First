#!/usr/bin/env node
/**
 * Chart-exploration capture harness.
 *
 * Screenshots the SAME dashboard under each chart visual system (?chart=...)
 * plus the /chart-exploration compare page, into docs/chart-exploration/.
 * Deterministic by construction: Apex animations killed via window.Apex,
 * zero-duration CSS, fonts + skeleton settling, one-session midnight guard.
 *
 * Usage:
 *   node scripts/chart-exploration/capture.mjs                       # full matrix
 *   node scripts/chart-exploration/capture.mjs --only dashboard --charts current
 *   node scripts/chart-exploration/capture.mjs --base http://localhost:5173
 *
 * Flags: --base <url> --only <families> --charts <ids> --mode light|dark --width <px>
 * Families: dashboard | widgets | hover | exploration
 * Chart ids: current | option-a | option-b | option-c | option-d
 */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT_ROOT = path.join(ROOT, 'docs', 'chart-exploration')
const ACCOUNT = '2000290'

const args = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt
}
const BASE = flag('base', 'http://localhost:5173')
const MODE = flag('mode', 'light')
const WIDTH = Number(flag('width', '1440'))
const FAMILIES = flag('only', 'dashboard,widgets,hover,exploration').split(',').map((s) => s.trim())
const CHART_IDS = flag('charts', 'current,option-a,option-b,option-c,option-d').split(',').map((s) => s.trim())

/** File-name token → ?chart= value + output dir. `current` pins shopify explicitly. */
const CHARTS = {
  current: { query: 'shopify', dir: '00-current' },
  'option-a': { query: 'optionA', dir: 'options/option-a' },
  'option-b': { query: 'optionB', dir: 'options/option-b' },
  'option-c': { query: 'optionC', dir: 'options/option-c' },
  'option-d': { query: 'optionD', dir: 'options/option-d' },
}

/** Specimen widgets on the dashboard (element shots). */
const WIDGETS = {
  line: { metric: 'demo_channel_trend', title: 'Revenue by channel' },
  bar: { metric: 'marketing_email_volume', title: 'Email volume' },
  area: { metric: 'commerce_revenue_over_time', title: 'Revenue over time' },
  donut: { metric: 'demo_channel_mix', title: 'Traffic mix' },
}

// Zero-duration (not `none`) so transitions/animations land on their END state.
const CLEAN_CSS = `
  ::-webkit-scrollbar { display: none !important; }
  * { cursor: none !important; }
  *, *::before, *::after {
    animation-duration: 0s !important; animation-delay: 0s !important;
    transition-duration: 0s !important; transition-delay: 0s !important;
  }
`

const startDay = new Date().toDateString()
const manifestPath = path.join(OUT_ROOT, 'manifest.json')
const shotsLog = []

function guardSameDay() {
  if (new Date().toDateString() !== startDay) {
    console.error('✖ Run crossed midnight — day-granular data would fork between shots. Re-run the whole family.')
    process.exit(1)
  }
}

async function preflight() {
  let res
  try {
    res = await fetch(BASE, { redirect: 'follow' })
  } catch {
    console.error(`✖ Dev server unreachable at ${BASE} — start it (npm run dev) or pass --base.`)
    process.exit(1)
  }
  if (!res.ok) {
    console.error(`✖ ${BASE} answered ${res.status} — wrong server? Pass --base.`)
    process.exit(1)
  }
}

async function newPage(browser, { dsf = 2 } = {}) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 900 },
    deviceScaleFactor: dsf,
    colorScheme: MODE === 'dark' ? 'dark' : 'light',
    reducedMotion: 'reduce',
  })
  await context.addInitScript((mode) => {
    try { localStorage.setItem('app-theme-mode', mode) } catch { /* ignore */ }
    // Kill ApexCharts entrance animations globally (Apex reads window.Apex defaults).
    window.Apex = { chart: { animations: { enabled: false } } }
  }, MODE)
  const page = await context.newPage()
  return { context, page }
}

async function settle(page, { minCharts = 4, timeout = 20000 } = {}) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(
    (n) =>
      !document.querySelector('.v-skeleton-loader') &&
      document.querySelectorAll('.apexcharts-canvas').length >= n,
    minCharts,
    { timeout },
  )
  await page.addStyleTag({ content: CLEAN_CSS })
  await page.waitForTimeout(450) // idle-callback reveal buffer + final layout
}

function record(file, shot, chart, route, dsf) {
  shotsLog.push({ file, shot, chart, width: WIDTH, mode: MODE, dsf, route })
  console.log(`  ✓ ${file}`)
}

async function shoot(page, target, outDir, name, opts = {}) {
  guardSameDay()
  fs.mkdirSync(outDir, { recursive: true })
  const file = path.join(outDir, name)
  await target.screenshot({ path: file, ...opts })
  return path.relative(OUT_ROOT, file)
}

function widgetLocator(page, key) {
  const { metric, title } = WIDGETS[key]
  const byAttr = page.locator(`[data-widget-metric="${metric}"]`)
  return {
    async resolve() {
      if (await byAttr.count()) return byAttr.first()
      return page.locator('.dashboard-widget-card', { hasText: title }).first()
    },
  }
}

async function captureDashboard(browser, chartId) {
  const { query, dir } = CHARTS[chartId]
  const route = `/accounts/${ACCOUNT}/dashboard?chart=${query}`
  const outDir = path.join(OUT_ROOT, dir)

  for (const dsf of [2, 1]) {
    if (dsf === 1 && !FAMILIES.includes('dashboard')) break
    const { context, page } = await newPage(browser, { dsf })
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
    await settle(page)

    if (FAMILIES.includes('dashboard')) {
      const suffix = dsf === 1 ? '--dsf1' : ''
      const f1 = await shoot(page, page, outDir, `dashboard-full--${chartId}--${WIDTH}--${MODE}${suffix}.png`, { fullPage: true })
      record(f1, 'dashboard-full', chartId, route, dsf)
      if (dsf === 2) {
        const f2 = await shoot(page, page, outDir, `dashboard-fold--${chartId}--${WIDTH}--${MODE}.png`)
        record(f2, 'dashboard-fold', chartId, route, dsf)
      }
    }

    if (dsf === 2 && FAMILIES.includes('widgets')) {
      for (const key of Object.keys(WIDGETS)) {
        const card = await widgetLocator(page, key).resolve()
        await card.scrollIntoViewIfNeeded()
        await page.waitForTimeout(150)
        const f = await shoot(page, card, outDir, `widget-${key}--${chartId}--${WIDTH}--${MODE}.png`)
        record(f, `widget-${key}`, chartId, route, dsf)
      }
    }

    if (dsf === 2 && FAMILIES.includes('hover')) {
      for (const key of ['line', 'bar']) {
        const card = await widgetLocator(page, key).resolve()
        await card.scrollIntoViewIfNeeded()
        await page.waitForTimeout(150)
        const plot = card.locator('.apexcharts-inner').first()
        const box = await plot.boundingBox()
        if (!box) { console.warn(`  ⚠ no plot box for ${key}, skipping hover`); continue }
        // Fixed fraction → same data point active in every theme.
        await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.4)
        try {
          await card.locator('.apexcharts-tooltip.apexcharts-active').first().waitFor({ timeout: 4000 })
        } catch {
          console.warn(`  ⚠ tooltip did not activate for ${key} (${chartId})`)
        }
        await page.waitForTimeout(250)
        const f = await shoot(page, card, outDir, `widget-${key}-hover--${chartId}--${WIDTH}--${MODE}.png`)
        record(f, `widget-${key}-hover`, chartId, route, dsf)
        await page.mouse.move(0, 0)
        await page.waitForTimeout(150)
      }
    }

    await context.close()
  }
}

async function captureExploration(browser) {
  const route = '/chart-exploration'
  const outDir = path.join(OUT_ROOT, 'comparison')
  const { context, page } = await newPage(browser, { dsf: 2 })
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
  const resp = await page.title().catch(() => '')
  void resp
  try {
    await settle(page, { minCharts: 8, timeout: 30000 })
  } catch {
    console.warn('  ⚠ /chart-exploration did not settle — does the route exist yet? Skipping family.')
    await context.close()
    return
  }

  const f1 = await shoot(page, page, outDir, `exploration-full--all--${WIDTH}--${MODE}.png`, { fullPage: true })
  record(f1, 'exploration-full', 'all', route, 2)

  const grid = page.locator('#specimen-grid')
  if (await grid.count()) {
    await grid.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)
    const f = await shoot(page, grid.first(), outDir, `specimen-grid--all--${WIDTH}--${MODE}.png`)
    record(f, 'specimen-grid', 'all', route, 2)
  }

  for (const chartId of CHART_IDS.filter((c) => c !== 'current')) {
    const { query, dir } = CHARTS[chartId]
    for (const [sel, shot] of [[`#specimen-${query}`, 'specimen'], [`#tokens-${query}`, 'tokens']]) {
      const el = page.locator(sel)
      if (!(await el.count())) continue
      await el.scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
      const f = await shoot(page, el.first(), path.join(OUT_ROOT, dir), `${shot}--${chartId}--${WIDTH}--${MODE}.png`)
      record(f, shot, chartId, route, 2)
    }
  }

  await context.close()
}

async function main() {
  await preflight()
  const gitSha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim()
  const browser = await chromium.launch()

  for (const chartId of CHART_IDS) {
    if (!CHARTS[chartId]) { console.warn(`⚠ unknown chart id ${chartId}, skipping`); continue }
    if (FAMILIES.some((f) => ['dashboard', 'widgets', 'hover'].includes(f))) {
      console.log(`▶ ${chartId} (?chart=${CHARTS[chartId].query})`)
      await captureDashboard(browser, chartId)
    }
  }
  if (FAMILIES.includes('exploration')) {
    console.log('▶ /chart-exploration')
    await captureExploration(browser)
  }

  await browser.close()

  // Merge into manifest.json (replace same-file entries, keep the rest).
  let manifest = { shots: [] }
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch { /* rebuild */ }
  }
  const newFiles = new Set(shotsLog.map((s) => s.file))
  manifest.capturedAt = new Date().toISOString()
  manifest.gitSha = gitSha
  manifest.baseUrl = BASE
  manifest.shots = [...(manifest.shots ?? []).filter((s) => !newFiles.has(s.file)), ...shotsLog]
  fs.mkdirSync(OUT_ROOT, { recursive: true })
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\n${shotsLog.length} shots → ${path.relative(ROOT, OUT_ROOT)} (manifest updated)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
