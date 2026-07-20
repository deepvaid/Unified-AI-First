// Record the trailer's real-UI shots with Playwright → trailer-build/captures/*.mp4
// One browser context per shot so each recording is its own file, 1920×1080.
//
// Usage:
//   node scripts/trailer/capture.mjs [--base http://localhost:5173] [--only shot1,shot2]
import { mkdirSync, renameSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:5173'
const ONLY = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null

const OUT_DIR = 'trailer-build/captures'
const RAW_DIR = `${OUT_DIR}/.raw`
const ACCOUNT = '2000290'
const SIZE = { width: 1920, height: 1080 }

// Hide the reel keyboard hint and any scrollbars for a clean frame.
const CLEAN_CSS = `
  .reel-hint { display: none !important; }
  ::-webkit-scrollbar { display: none !important; }
  * { cursor: none !important; }
`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Wait for fonts + a settle beat so animations start from a stable frame. */
async function settle(page, ms = 1200) {
  await page.evaluate(() => document.fonts.ready)
  await sleep(ms)
}

/** Each shot: { name, theme, run(page) } — run() is recorded start to finish. */
const SHOTS = [
  {
    // S1/S3 fallback + reference: chaos wobble → SNAP (card 1 plays the whole arc)
    name: 'reel-chaos-snap',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/reel`)
      await settle(page, 2500)
      await page.keyboard.press('r') // clean replay from t=0
      await sleep(12000)
    },
  },
  {
    // S2: "Three buttons. Five blues. Zero consistency."
    name: 'reel-type-before',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/reel`)
      await settle(page, 2500)
      await page.keyboard.press('ArrowRight')
      await sleep(300)
      await page.keyboard.press('r')
      await sleep(9000)
    },
  },
  {
    // S10: "One system. / Every screen."
    name: 'reel-type-after',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/reel`)
      await settle(page, 2500)
      await page.keyboard.press('End')
      await sleep(300)
      await page.keyboard.press('ArrowLeft')
      await page.keyboard.press('ArrowLeft')
      await sleep(300)
      await page.keyboard.press('r')
      await sleep(8000)
    },
  },
  {
    // S9: stat punch
    name: 'reel-stats',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/reel`)
      await settle(page, 2500)
      await page.keyboard.press('End')
      await page.keyboard.press('ArrowLeft')
      await sleep(300)
      await page.keyboard.press('r')
      await sleep(9000)
    },
  },
  {
    // S11 fallback: wordmark close
    name: 'reel-wordmark',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/reel`)
      await settle(page, 2500)
      await page.keyboard.press('End')
      await sleep(300)
      await page.keyboard.press('r')
      await sleep(9000)
    },
  },
  {
    // S4: showcase hero reveal + gentle scroll to token chips
    name: 'showcase-hero',
    theme: 'light',
    async run(page) {
      await page.goto(`${BASE}/showcase`)
      await settle(page, 1500)
      await sleep(4500)
      await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' }))
      await sleep(3500)
      await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' }))
      await sleep(5000)
    },
  },
  {
    // S5: stats bar count-up (triggered by scrolling it into view)
    name: 'showcase-stats',
    theme: 'light',
    async run(page) {
      await page.goto(`${BASE}/showcase`)
      await settle(page, 1500)
      await page.evaluate(() => {
        const el = document.querySelector('.showcase-stats, [class*="stats"]')
        el?.scrollIntoView({ behavior: 'auto', block: 'center' })
      })
      await sleep(9000)
    },
  },
  {
    // S6a: Sales Orders table
    name: 'orders',
    theme: 'light',
    async run(page) {
      await page.goto(`${BASE}/commerce/${ACCOUNT}/orders`)
      await settle(page, 2000)
      await sleep(7000)
    },
  },
  {
    // S6b + S7a: Dashboard, light
    name: 'dashboard-light',
    theme: 'light',
    async run(page) {
      await page.goto(`${BASE}/accounts/${ACCOUNT}/dashboard`)
      await settle(page, 2000)
      await sleep(9000)
    },
  },
  {
    // S7b: Dashboard, dark (theme flip is a crossfade between the two in the edit)
    name: 'dashboard-dark',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/accounts/${ACCOUNT}/dashboard`)
      await settle(page, 2000)
      await sleep(9000)
    },
  },
  {
    // S6c: Journey Builder (demo journey id 1)
    name: 'journey-builder',
    theme: 'light',
    async run(page) {
      await page.goto(`${BASE}/accounts/${ACCOUNT}/journeys/1/builder`)
      await settle(page, 2500)
      await sleep(8000)
    },
  },
  {
    // S8: Da Vinci orb breathing
    name: 'davinci-orb',
    theme: 'dark',
    async run(page) {
      await page.goto(`${BASE}/accounts/${ACCOUNT}/da-vinci/experience`)
      await settle(page, 2500)
      await sleep(8000)
    },
  },
]

mkdirSync(RAW_DIR, { recursive: true })
const browser = await chromium.launch()
let failed = 0

for (const shot of SHOTS) {
  if (ONLY && !ONLY.includes(shot.name)) continue
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: RAW_DIR, size: SIZE },
    reducedMotion: 'no-preference',
    colorScheme: shot.theme === 'dark' ? 'dark' : 'light',
  })
  await context.addInitScript((mode) => {
    window.localStorage.setItem('app-theme-mode', mode)
  }, shot.theme)
  // Style must survive navigation — inject on every new document.
  await context.addInitScript((css) => {
    const apply = () => {
      const style = document.createElement('style')
      style.textContent = css
      document.head?.appendChild(style)
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', apply)
    } else {
      apply()
    }
  }, CLEAN_CSS)
  const page = await context.newPage()
  try {
    await shot.run(page)
    const video = page.video()
    await context.close() // flushes the video file
    const rawPath = await video.path()
    const outPath = `${OUT_DIR}/${shot.name}.mp4`
    // Remux webm → mp4 (24fps CFR so assembly cuts are frame-exact)
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', rawPath, '-r', '24', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an', outPath])
    rmSync(rawPath)
    console.log(`captured ${shot.name}.mp4`)
  } catch (err) {
    failed++
    console.error(`FAILED ${shot.name}: ${err.message}`)
    await context.close().catch(() => {})
  }
}

await browser.close()
if (existsSync(RAW_DIR)) rmSync(RAW_DIR, { recursive: true, force: true })
console.log(failed ? `\n${failed} shot(s) failed` : '\nAll shots captured.')
process.exit(failed ? 1 : 0)
