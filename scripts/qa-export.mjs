#!/usr/bin/env node
/**
 * Exports the QA reference for LiquidSky: for every story in src/stories/qa/liquidskyMap.ts,
 * in light and dark, a screenshot and the computed CSS of each spec'd part.
 *
 *   npm run build-storybook && npm run qa:export
 *
 * Output (committed, served by the app at /qa-reference/):
 *   public/qa-reference/manifest.json
 *   public/qa-reference/spec/<component>.json
 *   public/qa-reference/png/<component>/<story>--<theme>.png
 *
 * Uses the installed Chrome (playwright-core downloads no browser). Set QA_BROWSER_CHANNEL to
 * use another channel, e.g. `msedge`.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QA_COMPONENTS, QA_LINKS } from '../src/stories/qa/liquidskyMap.ts'
import { THEMES, VIEWPORT, launchPage, measure, settle } from './qa-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storybookDir = path.join(root, 'dist-storybook')
const outDir = path.join(root, 'public', 'qa-reference')
const PORT = 6111

if (!fs.existsSync(path.join(storybookDir, 'index.json'))) {
  console.error('dist-storybook/ not found. Run `npm run build-storybook` first.')
  process.exit(1)
}
const storyIds = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(storybookDir, 'index.json'), 'utf8')).entries))

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = http.createServer((req, res) => {
  const file = path.join(storybookDir, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  })
})
await new Promise((resolve) => server.listen(PORT, resolve))

const { browser, page } = await launchPage()

const tokenVar = (token) => `--mp-${token.replaceAll('.', '-')}`
const problems = []

async function openStory(id, theme, selectors) {
  await page.goto(`http://localhost:${PORT}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`)
  await page.waitForSelector('[data-visual-root]')
  await settle(page, selectors)
}

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(path.join(outDir, 'spec'), { recursive: true })

const manifest = { links: QA_LINKS, viewport: VIEWPORT, themes: THEMES, components: [] }

for (const component of QA_COMPONENTS) {
  const stories = []
  for (const story of component.stories) {
    if (!storyIds.has(story.id)) { problems.push(`${component.key}: story "${story.id}" does not exist`); continue }
    const parts = story.parts.map((part) => ({ part: part.part, state: part.state, props: {} }))
    const png = {}
    for (const theme of THEMES) {
      await openStory(story.id, theme, story.parts.map((part) => part.selector))
      const file = path.join('png', component.key, `${story.id}--${theme}.png`)
      fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true })
      await page.screenshot({ path: path.join(outDir, file) })
      png[theme] = file

      for (const [index, part] of story.parts.entries()) {
        const values = await measure(page, part, Object.fromEntries(Object.entries(part.tokens ?? {}).map(([prop, token]) => [prop, tokenVar(token)])))
        if (!values) { problems.push(`${component.key} › ${story.id} › "${part.part}": selector matched nothing (${theme})`); continue }
        for (const [prop, { value, tokenValue }] of Object.entries(values)) {
          const entry = (parts[index].props[prop] ??= {})
          entry[theme] = value
          const token = part.tokens?.[prop]
          if (!token) continue
          entry.token = token
          if (tokenValue === '') problems.push(`${component.key} › "${part.part}" ${prop}: token ${token} does not exist`)
          else if (tokenValue !== value) problems.push(`${component.key} › "${part.part}" ${prop}: measured ${value}, token ${token} is ${tokenValue} (${theme})`)
        }
      }
    }
    stories.push({
      id: story.id,
      label: story.label,
      url: `${QA_LINKS.marobaseStorybook}?path=/story/${story.id}`,
      png,
      parts,
    })
  }

  const { stories: _stories, ...meta } = component
  const spec = { ...meta, stories }
  fs.writeFileSync(path.join(outDir, 'spec', `${component.key}.json`), `${JSON.stringify(spec, null, 2)}\n`)
  manifest.components.push({ ...meta, spec: `spec/${component.key}.json`, stories: stories.map(({ id, label, url, png }) => ({ id, label, url, png })) })
  console.log(`${component.status.padEnd(12)} ${component.key} — ${stories.length} stories`)
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await browser.close()
server.close()

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((line) => `  - ${line}`).join('\n')}`)
  process.exit(1)
}
console.log(`\nWrote ${path.relative(root, outDir)}/`)
