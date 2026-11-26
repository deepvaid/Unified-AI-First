/**
 * Records the sales film of the Vitaheal (demo) store: `npm run demo:video`.
 *
 * It serves the production build in `dist/` (run `npm run build` first), drives
 * the real demo in the installed Chrome with a visible pointer, draws the
 * captions and title cards in the page, and turns the recording into
 * `output/demo-video/vitaheal-demo.mp4` with ffmpeg. Nothing leaves this machine.
 *
 * The browser starts with nothing stored, so every run begins from the seeded
 * store and films the same story. The scenes are in SCENES below, in order;
 * `--only=3,4` records some of them (their set-up still runs, without pauses)
 * and `--fast` shortens every pause, both for checking a change quickly.
 *
 * Needs: Google Chrome and ffmpeg. DEMO_BROWSER_CHANNEL picks another browser.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, 'output/demo-video')
const WIDTH = 1600
const HEIGHT = 900
const ACCOUNT = '2000290'
const STORE = `/accounts/${ACCOUNT}/sales_channels/vitaheal-demo`
const SHOP = `${STORE}/storefront`

const FAST = process.argv.includes('--fast')
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7).split(',').map(Number)

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('No build found. Run `npm run build` first.')
  process.exit(1)
}

// ── The build, served as the app is in production: any unknown path is the app ──
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg' }
const server = http.createServer((req, res) => {
  const wanted = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const file = wanted.startsWith(DIST) && fs.existsSync(wanted) && fs.statSync(wanted).isFile() ? wanted : path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const ORIGIN = `http://127.0.0.1:${server.address().port}`

// ── What is drawn over the page: the pointer, the caption, the title card ──────
// Runs in every document, before the app. The caption and card survive a reload.
function overlay() {
  const css = `
    #dv-cursor { position: fixed; left: 0; top: 0; z-index: 2147483647; width: 26px; height: 26px; margin: -3px 0 0 -3px; pointer-events: none; transition: transform .12s ease; }
    #dv-cursor.is-down { transform: scale(.82); }
    #dv-ring { position: fixed; z-index: 2147483646; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid #2f7ef5; opacity: 0; pointer-events: none; }
    #dv-ring.is-on { animation: dv-ring .5s ease-out; }
    @keyframes dv-ring { from { opacity: .9; transform: scale(.35); } to { opacity: 0; transform: scale(1.25); } }
    #dv-caption { position: fixed; left: 50%; bottom: 34px; z-index: 2147483645; transform: translate(-50%, 16px); max-width: 1180px; display: flex; align-items: center; gap: 14px; padding: 14px 24px 14px 14px; border-radius: 999px; background: rgba(13, 22, 48, .94); color: #fff; font: 600 25px/1.25 Figtree, Inter, system-ui, sans-serif; box-shadow: 0 10px 34px rgba(0, 0, 0, .28); opacity: 0; pointer-events: none; transition: opacity .35s ease, transform .35s ease; }
    #dv-caption.is-on { opacity: 1; transform: translate(-50%, 0); }
    #dv-who { flex: none; padding: 6px 14px; border-radius: 999px; font-size: 17px; letter-spacing: .04em; text-transform: uppercase; background: #fff; color: #0d1630; }
    #dv-who[data-who="Merchant"] { background: #8fd3ff; }
    #dv-card { position: fixed; inset: 0; z-index: 2147483644; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; padding: 80px; background: #0d1630; color: #fff; text-align: center; font-family: Figtree, Inter, system-ui, sans-serif; opacity: 0; pointer-events: none; transition: opacity .6s ease; }
    #dv-card.is-on { opacity: 1; }
    #dv-card h1 { margin: 0; font-size: 84px; line-height: 1.05; font-weight: 700; letter-spacing: -.02em; }
    #dv-card p { margin: 0; max-width: 1100px; font-size: 34px; line-height: 1.35; color: #c9d4f2; }
    #dv-card small { margin-top: 26px; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: #8fd3ff; }
    html { scroll-behavior: smooth; }
  `
  const build = () => {
    if (document.getElementById('dv-caption')) return
    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }))
    document.body.insertAdjacentHTML('beforeend', `
      <div id="dv-card"><h1></h1><p></p><small></small></div>
      <div id="dv-caption"><span id="dv-who"></span><span id="dv-text"></span></div>
      <div id="dv-ring"></div>
      <svg id="dv-cursor" viewBox="0 0 26 26"><path d="M3 2l17 9.6-7.3 1.9-2.5 7.2z" fill="#0d1630" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>`)
    const cursor = document.getElementById('dv-cursor')
    const ring = document.getElementById('dv-ring')
    addEventListener('mousemove', (e) => { cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px` }, true)
    addEventListener('mousedown', (e) => {
      cursor.classList.add('is-down')
      ring.style.left = `${e.clientX}px`
      ring.style.top = `${e.clientY}px`
      ring.classList.remove('is-on')
      void ring.offsetWidth
      ring.classList.add('is-on')
    }, true)
    addEventListener('mouseup', () => cursor.classList.remove('is-down'), true)
    const saved = JSON.parse(sessionStorage.getItem('dv') ?? '{}')
    if (saved.card) window.__dv.card(...saved.card)
    else if (saved.caption) window.__dv.caption(...saved.caption)
  }
  const keep = (part) => sessionStorage.setItem('dv', JSON.stringify(part))
  window.__dv = {
    caption(who, text) {
      keep({ caption: [who, text] })
      document.getElementById('dv-card').classList.remove('is-on')
      document.getElementById('dv-who').textContent = who
      document.getElementById('dv-who').dataset.who = who
      document.getElementById('dv-text').textContent = text
      document.getElementById('dv-caption').classList.toggle('is-on', !!text)
      document.documentElement.classList.toggle('dv-captioned', !!text)
    },
    card(title, line, foot) {
      keep({ card: [title, line, foot] })
      const card = document.getElementById('dv-card')
      card.querySelector('h1').textContent = title
      card.querySelector('p').textContent = line
      card.querySelector('small').textContent = foot ?? ''
      document.getElementById('dv-caption').classList.remove('is-on')
      card.classList.add('is-on')
    },
  }
  if (document.body) build()
  else addEventListener('DOMContentLoaded', build)
}

// ── The browser ────────────────────────────────────────────────────────────
fs.rmSync(path.join(OUT, 'raw'), { recursive: true, force: true })
fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })
const browser = await chromium.launch({ channel: process.env.DEMO_BROWSER_CHANNEL ?? 'chrome' })
// 1600×900 of page at 1.2 device pixels each is a 1920×1080 picture: the film's own size.
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1.2,
  colorScheme: 'light',
  locale: 'en-GB',
})
await context.addInitScript(overlay)
// The first frame is the title card, not a page still loading behind it.
await context.addInitScript(() => {
  if (!sessionStorage.getItem('dv')) sessionStorage.setItem('dv', JSON.stringify({ card: ['Vitaheal', 'A subscription store on Maropost', 'Demo walkthrough'] }))
})
const page = await context.newPage()
page.setDefaultTimeout(15000)

// The picture: every frame the browser paints, saved with the moment it was painted.
// The browser paints only when something changes, so a still page costs nothing and
// each frame is held in the film until the next one. (Playwright's own recorder needs
// a download; this needs only the ffmpeg already installed.)
const frames = []
const cdp = await context.newCDPSession(page)
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = path.join(OUT, 'raw', `${String(frames.length).padStart(6, '0')}.jpg`)
  fs.writeFileSync(file, Buffer.from(data, 'base64'))
  frames.push({ file, at: metadata.timestamp })
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
const startFilming = () => cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
const started = Date.now()

// ── How the film moves ─────────────────────────────────────────────────────
let quiet = false // true while a skipped scene's set-up runs
/** Every pause is stretched by this, so a caption can be read at a calm pace. */
const PACE = 1.35
const pause = (ms) => page.waitForTimeout(quiet ? 30 : FAST ? ms / 6 : ms * PACE)
const caption = (who, text) => page.evaluate(([w, t]) => window.__dv.caption(w, t), [who, text])
const card = (title, line, foot) => page.evaluate(([t, l, f]) => window.__dv.card(t, l, f), [title, line, foot])
const text = (value, exact = true) => page.getByText(value, { exact })

async function moveTo(target) {
  await target.scrollIntoViewIfNeeded()
  await pause(250)
  const box = await target.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: quiet || FAST ? 2 : 30 })
}

async function click(target, after = 900) {
  await moveTo(target)
  await pause(280)
  await target.click()
  await pause(after)
}

async function type(target, value, after = 500) {
  await click(target, 200)
  await target.fill('')
  await target.pressSequentially(value, { delay: quiet || FAST ? 0 : 80 })
  await pause(after)
}

/** Goes to a page of the app the way a link would: no reload, so nothing flashes. */
async function go(to, settle = 1400) {
  // A message from the page being left would follow into the next one (the store is another tab in real use).
  await page.evaluate(() => document.querySelectorAll('.mp-toast button').forEach((button) => button.click()))
  await page.evaluate((p) => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push(p), to)
  await page.waitForLoadState('networkidle')
  await pause(settle)
}

const scrollTo = async (top, after = 1500) => {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top)
  await pause(after)
}

// ── The scenes ─────────────────────────────────────────────────────────────
const SCENES = [
  ['Title', async () => {
    await page.goto(`${ORIGIN}${SHOP}`)
    await page.waitForLoadState('networkidle')
    await startFilming()
    await pause(4200)
  }],

  ['The store', async () => {
    await caption('Shopper', 'A store that looks like the brand')
    await page.mouse.move(WIDTH / 2, HEIGHT / 2)
    await pause(2200)
    await scrollTo(780, 2400)
    await scrollTo(1650, 2400)
    await scrollTo(0, 1400)
    await click(page.locator('.sf-nav a', { hasText: /^Sleep$/ }), 2200)
    await click(page.locator('.sf-card', { hasText: 'Unwind' }).first(), 2200)
  }],

  ['Subscribe with a campaign code', async () => {
    await caption('Shopper', 'Subscribe and save: the shopper picks a plan')
    await click(page.locator('.sf-plan').nth(1), 1300)
    await click(page.locator('.sf-plan').nth(0), 1300)
    await click(page.locator('.sf-pdp__add'), 1400)
    await click(page.getByRole('link', { name: /View cart/ }), 1800)
    await caption('Shopper', 'A campaign code takes 15% off the first order')
    await type(page.locator('#sf-cart-code'), 'WINTER15')
    await click(page.locator('.sf-code__apply'), 2800)
    await click(page.getByRole('button', { name: 'Checkout', exact: true }), 1800)
  }],

  ['Checkout', async () => {
    await caption('Shopper', 'Checkout in US dollars, by card, Apple Pay or Google Pay')
    await page.locator('#sf-co-email').waitFor()
    await pause(1800)
    await click(page.locator('#sf-co-consent'), 1200)
    await click(page.locator('.sf-button--block'), 600)
    await text('Payment received').first().waitFor()
    await caption('Shopper', 'Paid: the order is placed and the subscription has started')
    await pause(3800)
  }],

  ['The shopper manages the subscription', async () => {
    await click(page.getByRole('link', { name: 'Manage your subscription' }), 250)
    await caption('Shopper', 'Shoppers manage their own subscription')
    await pause(3000)
    await click(page.getByRole('button', { name: 'Skip next delivery' }), 2000)
    await click(page.getByRole('button', { name: 'Skip this delivery' }), 3000)
  }],

  ['The assistant', async () => {
    await caption('Shopper', 'An assistant that knows the shopper’s orders')
    await click(page.locator('.sf-chat__launcher'), 1400)
    await click(page.locator('.sf-chat__prompt', { hasText: 'Where is my order?' }), 3800)
    await caption('Shopper', 'It suggests products for a wellness need')
    await type(page.locator('.sf-chat__field'), 'I am always tired in the afternoon', 300)
    await click(page.locator('.sf-chat__send'), 4800)
    await click(page.locator('.sf-chat__close'), 700)
  }],

  ['The merchant sees the order', async () => {
    await caption('Merchant', 'The order is in Commerce, with its code and discount')
    await go(`/commerce/${ACCOUNT}/orders`, 2400)
    await click(page.locator('main tbody tr').first(), 2600)
    await page.locator('main').getByText('WINTER15').first().scrollIntoViewIfNeeded()
    await pause(3200)
    await caption('Merchant', 'The new subscriber, with every action the shopper has')
    await go(`/commerce/${ACCOUNT}/subscriptions/subscribers`, 2600)
    await click(page.locator('main tbody tr', { hasText: 'Ava Brown' }).first(), 3800)
  }],

  ['A campaign for one store', async () => {
    await caption('Merchant', 'Run a campaign for one store: a message, a code, and its results')
    await go(`${STORE}/campaigns`, 3800)
    await click(page.getByRole('button', { name: 'Campaign actions for Winter wellness week' }), 1300)
    await caption('Merchant', 'Announce it by email to that store’s customers')
    await click(page.getByRole('menuitem', { name: /Announce by email/ }), 4800)
  }],

  ['Connect Merchandise Cloud', async () => {
    await caption('Merchant', 'Connect Merchandise Cloud in one click')
    await go(`${STORE}/merchandising`, 2600)
    await click(page.getByRole('button', { name: 'Connect Merchandising' }), 600)
    await text('Search and recommendations are live on this store').waitFor()
    await caption('Merchant', 'Eight products synced: search and recommendations are on')
    await pause(3800)
  }],

  ['Search and recommendations on the store', async () => {
    await go(SHOP, 1500)
    await caption('Shopper', 'The store now has search, with the merchant’s pinned product first')
    await type(page.locator('.sf-search input'), 'sleep')
    await page.keyboard.press('Enter')
    await pause(3600)
    await caption('Shopper', '“tired” finds energy and focus, through a synonym')
    await type(page.locator('.sf-results__form input'), 'tired')
    await page.keyboard.press('Enter')
    await pause(3800)
    await go(`${SHOP}/products/unwind-2001`, 1200)
    await caption('Shopper', 'Recommendations chosen by the store’s engine')
    await page.locator('#sf-pdp-related').scrollIntoViewIfNeeded()
    await pause(900)
    await page.evaluate(() => window.scrollBy({ top: 260, behavior: 'smooth' }))
    await pause(3800)
  }],

  ['Change a rule, the store follows', async () => {
    await caption('Merchant', 'Add a synonym in Merchandising')
    await go(`${STORE}/merchandising/search/synonyms`, 2400)
    await click(page.getByRole('button', { name: 'Add new' }), 1300)
    await type(page.getByLabel('Queries *'), 'knackered', 200)
    await page.keyboard.press('Enter')
    await type(page.getByLabel('Leads to'), 'energy', 200)
    await page.keyboard.press('Enter')
    await pause(700)
    await click(page.getByRole('button', { name: 'Add synonym' }), 2400)
    await go(SHOP, 1200)
    await caption('Shopper', 'The store follows at once')
    await type(page.locator('.sf-search input'), 'knackered')
    await page.keyboard.press('Enter')
    await pause(4200)
  }],

  ['Close', async () => {
    await card('One platform', 'Store, subscriptions, service, marketing and merchandising, working together', 'Maropost')
    await pause(5200)
  }],
]

const marks = []
try {
  for (const [index, [name, scene]] of SCENES.entries()) {
    quiet = !!ONLY && !ONLY.includes(index + 1)
    marks.push({ scene: index + 1, name, at: ((Date.now() - started) / 1000).toFixed(1) })
    console.log(`${String(index + 1).padStart(2)}  ${name}${quiet ? '  (set-up only)' : ''}`)
    await scene()
  }
} catch (error) {
  await page.screenshot({ path: path.join(OUT, 'failed.png') })
  console.error(`\nStopped in scene ${marks.at(-1)?.scene} (${marks.at(-1)?.name}). See output/demo-video/failed.png\n`)
  console.error(error)
  process.exitCode = 1
}

await cdp.send('Page.stopScreencast').catch(() => {})
const ended = frames.at(-1) ? frames.at(-1).at + 0.5 : 0
await context.close()
await browser.close()
server.close()
fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(marks, null, 2))
if (!frames.length) {
  console.error('Nothing was filmed.')
  process.exit(1)
}

// ── The film: 1080p H.264, which Teams, PowerPoint and phones all play ──────
// Each frame is shown from its own moment until the next one's.
const list = path.join(OUT, 'raw', 'frames.txt')
const entries = frames.map((frame, index) => `file '${frame.file}'\nduration ${Math.max(0.001, (frames[index + 1]?.at ?? ended) - frame.at).toFixed(4)}`)
fs.writeFileSync(list, `${entries.join('\n')}\nfile '${frames.at(-1).file}'\n`)
const film = path.join(OUT, process.exitCode ? 'vitaheal-demo-failed.mp4' : ONLY || FAST ? 'vitaheal-demo-check.mp4' : 'vitaheal-demo.mp4')
const made = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'fps=30,scale=1920:1080:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', film], { stdio: 'inherit' })
if (made.status !== 0) {
  console.error('ffmpeg could not make the film. The frames are in output/demo-video/raw')
  process.exit(1)
}
fs.rmSync(path.join(OUT, 'raw'), { recursive: true, force: true })
console.log(`\n${path.relative(ROOT, film)}  (${(fs.statSync(film).size / 1e6).toFixed(1)} MB, ${frames.length} frames filmed)`)
