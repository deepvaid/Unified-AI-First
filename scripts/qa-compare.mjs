#!/usr/bin/env node
/**
 * Compares the LiquidSky build with the QA reference, so nobody has to write that check by hand.
 *
 * For every reference story paired in src/stories/qa/liquidskyPairs.ts, in light and dark, it opens
 * the LiquidSky story, takes a screenshot and measures the same parts the reference measures
 * (public/qa-reference/spec/*.json), then lists what differs in plain words.
 *
 *   npm run qa:compare
 *
 * Needs LIQUIDSKY_STORYBOOK (the LiquidSky Storybook address) — put it in .env.local.
 *
 * Output is git-ignored, because findings about the build are internal:
 *   output/qa-compare/report.json
 *   output/qa-compare/site/index.html        the page to share (scripts/qa-compare-page.html + the report)
 *   output/qa-compare/site/{design,build}/<component>/<story>--<theme>.png
 *
 * `npm run qa:compare -- --page` rebuilds only the page from the last report.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QA_COMPONENTS } from '../src/stories/qa/liquidskyMap.ts'
import { QA_BUILD_ONLY, QA_PAIRS } from '../src/stories/qa/liquidskyPairs.ts'
import { THEMES, launchPage, measure, settle } from './qa-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const referenceDir = path.join(root, 'public', 'qa-reference')
const outDir = path.join(root, 'output', 'qa-compare')
const siteDir = path.join(outDir, 'site')
const host = (process.env.LIQUIDSKY_STORYBOOK ?? '').replace(/\/+$/, '')
const BUILD_THEME = { light: 'marobaseLight', dark: 'marobaseDark' }

/** The shareable page: the explainer template with the report inlined. */
function writePage(report) {
  const template = fs.readFileSync(path.join(root, 'scripts', 'qa-compare-page.html'), 'utf8')
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const data = JSON.stringify(report).replaceAll('<', '\\u003c')
  fs.writeFileSync(path.join(siteDir, 'index.html'), template.replace('/*__REPORT__*/null', () => data).replace('__DATE__', today))
}

if (process.argv.includes('--page')) {
  writePage(JSON.parse(fs.readFileSync(path.join(outDir, 'report.json'), 'utf8')))
  console.log(`Wrote ${path.relative(root, siteDir)}/index.html`)
  process.exit(0)
}

if (!host) {
  console.error('LIQUIDSKY_STORYBOOK is not set. Add it to .env.local, e.g. LIQUIDSKY_STORYBOOK=https://…')
  process.exit(1)
}

/** What a reviewer calls each CSS property. */
const PROP_LABEL = {
  'font-size': 'Text size',
  'font-weight': 'Text weight',
  'line-height': 'Line height',
  'letter-spacing': 'Letter spacing',
  color: 'Text colour',
  'background-color': 'Background',
  'border-radius': 'Corner radius',
  'border-top-color': 'Border colour',
  'border-bottom-color': 'Divider colour',
  'border-top-width': 'Border thickness',
  'box-shadow': 'Shadow',
  padding: 'Inner spacing',
  'padding-top': 'Spacing above the content',
  'padding-left': 'Spacing beside the content',
  'margin-top': 'Space above',
  'column-gap': 'Gap between items',
  'row-gap': 'Gap between rows',
  height: 'Height',
  'min-height': 'Minimum height',
  width: 'Width',
  'min-width': 'Minimum width',
  'max-width': 'Maximum width',
  opacity: 'Opacity',
}

const isColour = (prop) => prop.endsWith('color')
const PX_LIST = /^(-?[\d.]+px)(\s+-?[\d.]+px)*$/
const PILL = 999

/** `8px 16px` → [8, 16, 8, 16]; anything that is not a list of px lengths → null. */
function lengths(value, prop) {
  if (!PX_LIST.test(value.trim())) return null
  const list = value.trim().split(/\s+/).map(parseFloat)
  if (prop !== 'padding' && prop !== 'border-radius') return list
  const [a, b = a, c = a, d = b] = list
  return [a, b, c, d]
}

const round = (number) => Math.round(number * 10) / 10

function showLengths(list, prop) {
  if (prop === 'border-radius' && list.every((n) => n >= PILL)) return 'Fully rounded'
  const unique = list.every((n) => n === list[0]) ? [list[0]] : list
  return unique.map((n) => `${round(n)}px`).join(' ')
}

/** A shadow whose every layer has no offset, blur or spread paints nothing. */
function shadowVisible(value) {
  if (value === 'none' || value === '') return false
  return value.split(/,(?![^(]*\))/).some((layer) => (layer.replace(/\([^)]*\)/g, '').match(/-?[\d.]+px/g) ?? []).some((n) => parseFloat(n) !== 0))
}

function showColour([r, g, b, a]) {
  if (a < 0.005) return 'Transparent'
  const hex = `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
  return a > 0.995 ? hex : `${hex} at ${Math.round(a * 100)}%`
}

function sameColour(one, two) {
  if (one[3] < 0.005 && two[3] < 0.005) return true
  if (Math.abs(one[3] - two[3]) > 0.02) return false
  return [0, 1, 2].every((i) => Math.abs(one[i] - two[i]) <= 3 / 255)
}

/** One property, one theme → are they the same, and how to say each value. */
function judge(prop, design, build, colours) {
  if (isColour(prop)) {
    const [d, b] = [colours[design], colours[build]]
    if (d && b) return { same: sameColour(d, b), design: showColour(d), build: showColour(b), swatch: [toCss(d), toCss(b)] }
  }
  if (prop === 'box-shadow') {
    const [d, b] = [shadowVisible(design), shadowVisible(build)]
    return { same: d === b && (!d || design === build), design: d ? 'Shadow' : 'None', build: b ? (d && design !== build ? 'A different shadow' : 'Shadow') : 'None' }
  }
  const [d, b] = [lengths(design, prop), lengths(build, prop)]
  if (d && b) {
    const bothPill = prop === 'border-radius' && d.every((n) => n >= PILL) && b.every((n) => n >= PILL)
    const same = bothPill || (d.length === b.length && d.every((n, i) => Math.abs(n - b[i]) <= 0.6))
    return { same, design: showLengths(d, prop), build: showLengths(b, prop) }
  }
  const say = (value) => (lengths(value, prop) ? showLengths(lengths(value, prop), prop) : value.trim() === 'none' ? 'None' : value.trim())
  // A minimum of `auto` and a minimum of 0 are the same thing.
  const zero = (value) => (prop.startsWith('min-') && value.trim() === 'auto' ? '0px' : value.trim())
  return { same: zero(design) === zero(build), design: say(design), build: say(build) }
}

const toCss = ([r, g, b, a]) => `rgba(${[r, g, b].map((c) => Math.round(c * 255)).join(', ')}, ${round(a * 100) / 100})`

const { browser, page } = await launchPage()

/** Any CSS colour string → [r, g, b, a] as 0–1 floats, resolved by the browser itself. */
async function resolveColours(values) {
  return page.evaluate((list) => {
    const probe = document.createElement('span')
    document.body.append(probe)
    const out = {}
    for (const value of list) {
      probe.style.color = ''
      probe.style.color = `color-mix(in srgb, ${value} 100%, transparent 0%)`
      const numbers = getComputedStyle(probe).color.match(/-?[\d.]+(e-?\d+)?/g)?.map(Number)
      if (numbers && numbers.length >= 3) out[value] = [numbers[0], numbers[1], numbers[2], numbers[3] ?? 1]
    }
    probe.remove()
    return out
  }, [...new Set(values)])
}

const index = await (await fetch(`${host}/index.json`)).json()
const buildIds = new Set(Object.keys(index.entries))

async function openBuild(pair, theme) {
  await page.goto(`${host}/iframe.html?id=${pair.id}&viewMode=story&globals=theme:${BUILD_THEME[theme]}`)
  await page.waitForSelector('#storybook-root > *', { state: 'attached', timeout: 15000 })
  await settle(page)
  let opened = true
  if (pair.open) {
    opened = await page.locator(pair.open).first().click({ timeout: 4000 }).then(() => true, () => false)
    await page.waitForTimeout(600)
  }
  if (pair.hover) await page.locator(pair.hover).first().hover({ timeout: 4000 }).catch(() => { opened = false })
  const first = Object.values(pair.parts ?? {})[0]
  if (first) await page.locator(first).first().waitFor({ state: 'attached', timeout: 4000 }).catch(() => {})
  await page.waitForTimeout(300)
  return opened
}

const trimmer = await page.context().newPage()

/**
 * Crops a screenshot to the component: rows and columns of one flat colour are cut from each
 * edge, then a margin is put back. A small component in a 1280px frame is otherwise unreadable
 * once two frames sit side by side.
 */
async function trim(file) {
  const full = path.join(siteDir, file)
  const cropped = await trimmer.evaluate(async (source) => {
    const image = new Image()
    image.src = source
    await image.decode()
    const { width, height } = image
    const canvas = Object.assign(document.createElement('canvas'), { width, height })
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
    const { data } = context.getImageData(0, 0, width, height)
    const at = (x, y) => (y * width + x) * 4
    const alike = (a, b) => Math.abs(data[a] - data[b]) + Math.abs(data[a + 1] - data[b + 1]) + Math.abs(data[a + 2] - data[b + 2]) <= 6
    let [top, bottom, left, right] = [0, height - 1, 0, width - 1]
    const flatRow = (y) => { for (let x = left + 1; x <= right; x++) if (!alike(at(left, y), at(x, y))) return false; return true }
    const flatColumn = (x) => { for (let y = top + 1; y <= bottom; y++) if (!alike(at(x, top), at(x, y))) return false; return true }
    while (top < bottom && flatRow(top)) top++
    while (bottom > top && flatRow(bottom)) bottom--
    while (left < right && flatColumn(left)) left++
    while (right > left && flatColumn(right)) right--
    if (right - left < 24 || bottom - top < 12) return null
    const margin = 24
    const x = Math.max(0, left - margin)
    const y = Math.max(0, top - margin)
    const out = Object.assign(document.createElement('canvas'), {
      width: Math.min(width, right + margin + 1) - x,
      height: Math.min(height, bottom + margin + 1) - y,
    })
    out.getContext('2d').drawImage(image, -x, -y)
    return out.toDataURL('image/png').split(',')[1]
  }, `data:image/png;base64,${fs.readFileSync(full).toString('base64')}`)
  if (cropped) fs.writeFileSync(full, Buffer.from(cropped, 'base64'))
}

async function shot(folder, key, name) {
  const file = path.join(folder, key, `${name}.png`)
  fs.mkdirSync(path.dirname(path.join(siteDir, file)), { recursive: true })
  await page.screenshot({ path: path.join(siteDir, file) })
  await trim(file)
  return file
}

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(siteDir, { recursive: true })

const report = { themes: THEMES, components: [] }

for (const component of QA_COMPONENTS) {
  const spec = JSON.parse(fs.readFileSync(path.join(referenceDir, 'spec', `${component.key}.json`), 'utf8'))
  const entry = {
    key: component.key,
    liquidsky: component.liquidsky,
    status: component.status,
    reference: component.reference,
    note: component.note ?? null,
    stories: [],
    buildOnly: null,
  }

  const buildOnly = QA_BUILD_ONLY[component.key]
  if (buildOnly && buildIds.has(buildOnly)) {
    const png = {}
    for (const theme of THEMES) {
      await openBuild({ id: buildOnly }, theme)
      png[theme] = await shot('build', component.key, `${buildOnly}--${theme}`)
    }
    entry.buildOnly = { png }
  }

  for (const story of spec.stories) {
    const pair = QA_PAIRS[story.id]
    if (!pair || !buildIds.has(pair.id)) continue

    const design = {}
    const build = {}
    const measured = {}
    const unchecked = new Set()
    for (const theme of THEMES) {
      const source = path.join(referenceDir, story.png[theme])
      design[theme] = path.join('design', component.key, path.basename(source))
      fs.mkdirSync(path.dirname(path.join(siteDir, design[theme])), { recursive: true })
      fs.copyFileSync(source, path.join(siteDir, design[theme]))
      await trim(design[theme])

      await openBuild(pair, theme)
      build[theme] = await shot('build', component.key, `${pair.id}--${theme}`)

      measured[theme] = {}
      for (const part of story.parts) {
        const selector = pair.parts[part.part]
        if (!selector) continue
        const values = await measure(page, { selector, props: Object.keys(part.props), state: part.state }, {}, { preferVisible: true })
        if (values) measured[theme][part.part] = values
        else unchecked.add(part.part)
      }
    }

    const rows = []
    for (const part of story.parts) {
      if (!pair.parts[part.part] || unchecked.has(part.part)) continue
      for (const [prop, expected] of Object.entries(part.props)) {
        const perTheme = {}
        for (const theme of THEMES) {
          const actual = measured[theme][part.part][prop].value
          // `normal` means the build spaces its children another way (margins), which a gap cannot be judged against.
          if (prop.endsWith('gap') && actual === 'normal') continue
          const colours = isColour(prop) ? await resolveColours([expected[theme], actual]) : {}
          perTheme[theme] = judge(prop, expected[theme], actual, colours)
        }
        const [light, dark] = [perTheme.light, perTheme.dark]
        if (!light || !dark) continue
        const alike = light.same === dark.same && light.design === dark.design && light.build === dark.build
        for (const theme of alike ? ['light'] : THEMES) {
          rows.push({ part: part.part, property: PROP_LABEL[prop] ?? prop, theme: alike ? 'both' : theme, ...perTheme[theme] })
        }
      }
    }

    entry.stories.push({
      label: story.label,
      designStory: story.id,
      buildStory: pair.id,
      png: { design, build },
      rows,
      unchecked: [...unchecked],
      skipped: story.parts.filter((part) => !pair.parts[part.part]).map((part) => part.part),
    })
  }

  const rows = entry.stories.flatMap((story) => story.rows)
  entry.checked = rows.length
  entry.differences = rows.filter((row) => !row.same).length
  entry.result = component.status === 'no-reference'
    ? 'no-design'
    : rows.length === 0 ? 'by-eye' : entry.differences === 0 ? 'matches' : 'differs'
  report.components.push(entry)
  console.log(`${entry.result.padEnd(10)} ${component.key} — ${entry.differences} of ${entry.checked} checks differ`)
}

fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
writePage(report)
await browser.close()
console.log(`\nWrote ${path.relative(root, outDir)}/`)
