/**
 * Captures the theme library's thumbnails: `npm run themes:thumbnails`.
 *
 * It serves a production build (`dist/`, or `--dist=<dir>`; run `npm run build`
 * first), opens each demo store's storefront home in the installed Chrome at
 * 1280 x 800, waits for the photos and fonts, hides the chat launcher and any
 * toast, and saves the first screen as `public/storefront/<slug>/theme.jpg`,
 * the picture a theme card in the library shows. Nothing leaves this machine.
 *
 * Every store opens in a fresh browser context, so nothing stored from an earlier
 * visit changes what it shows: each one is its seeded store. `--only=northfold`
 * captures one or more stores (comma-separated slugs).
 *
 * Needs: Google Chrome. DEMO_BROWSER_CHANNEL picks another browser.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.resolve(ROOT, process.argv.find((arg) => arg.startsWith('--dist='))?.slice(7) ?? 'dist')
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7).split(',')
const WIDTH = 1280
const HEIGHT = 800
const QUALITY = 80

// The demo stores, in library order. Plain Node cannot import the registry (it is
// TypeScript), so this mirrors DEMO_STORES in src/storefront/demoStores/index.ts:
// each blueprint's homeChannel (id, accountId) and photoDir (/storefront/<slug>).
// A new demo store is added here too.
const STORES = [
  { slug: 'vitaheal', accountId: '2000290', channelId: 'vitaheal-demo' },
  { slug: 'northfold', accountId: '2000290', channelId: 'northfold-demo' },
  { slug: 'torqline', accountId: '2000290', channelId: 'torqline-demo' },
  { slug: 'lumos', accountId: '2000290', channelId: 'lumos-demo' },
  { slug: 'aurora', accountId: '2000290', channelId: 'aurora-demo' },
].filter((store) => !ONLY || ONLY.includes(store.slug))

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`No build found in ${path.relative(ROOT, DIST) || '.'}. Run \`npm run build\` first, or pass --dist=<dir>.`)
  process.exit(1)
}
if (!STORES.length) {
  console.error(`No store matches --only=${ONLY?.join(',')}.`)
  process.exit(1)
}

// ── The build, served as the app is in production: any unknown path is the app ──
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const wanted = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const file = wanted.startsWith(DIST) && fs.existsSync(wanted) && fs.statSync(wanted).isFile() ? wanted : path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const ORIGIN = `http://127.0.0.1:${server.address().port}`

/** In the page: resolves once every picture on the first screen has loaded and every font is ready. */
async function settled(viewportHeight) {
  const onScreen = (el) => {
    const box = el.getBoundingClientRect()
    return box.bottom > 0 && box.top < viewportHeight && box.width > 0 && box.height > 0
  }
  const pictures = [...document.images].filter(onScreen)
  // Background photos (a hero drawn as a CSS background) load like any other picture.
  const backgrounds = [...document.querySelectorAll('body *')]
    .filter(onScreen)
    .flatMap((el) => [...getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]))
  await Promise.all([
    ...pictures.map((img) => (img.complete ? Promise.resolve() : new Promise((resolve) => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }) }))),
    ...backgrounds.map((src) => new Promise((resolve) => Object.assign(new Image(), { onload: resolve, onerror: resolve, src }))),
  ])
  await Promise.all(pictures.map((img) => img.decode().catch(() => {})))
  await document.fonts.ready
  return pictures.filter((img) => !img.naturalWidth).map((img) => img.currentSrc || img.src)
}

const browser = await chromium.launch({ channel: process.env.DEMO_BROWSER_CHANNEL ?? 'chrome' })
let failed = false
try {
  for (const store of STORES) {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-US', reducedMotion: 'reduce' })
    const page = await context.newPage()
    page.setDefaultTimeout(20000)
    await page.goto(`${ORIGIN}/accounts/${store.accountId}/sales_channels/${store.channelId}/storefront`)
    await page.waitForLoadState('networkidle')
    // The chat launcher and any toast are not part of the theme.
    await page.addStyleTag({ content: '.sf-chat, .mp-toast-stack { display: none !important; }' })
    await page.evaluate(() => window.scrollTo(0, 0))
    const broken = await page.evaluate(settled, HEIGHT)
    // A last moment for a fade-in or a late layout shift.
    await page.waitForTimeout(600)
    const out = path.join(ROOT, 'public/storefront', store.slug, 'theme.jpg')
    await page.screenshot({ path: out, type: 'jpeg', quality: QUALITY })
    console.log(`${path.relative(ROOT, out)}  (${(fs.statSync(out).size / 1e3).toFixed(0)} kB)${broken.length ? `  pictures that did not load: ${broken.join(', ')}` : ''}`)
    if (broken.length) failed = true
    await context.close()
  }
} catch (error) {
  console.error(error)
  failed = true
} finally {
  await browser.close()
  server.close()
}
if (failed) process.exitCode = 1
