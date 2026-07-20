// Render the trailer captions as transparent 1920×1080 PNGs via headless
// Chromium — real Inter + design-system styling (this ffmpeg build has no
// libass/drawtext, and HTML/CSS renders nicer type anyway).
//
// Input: trailer-build/captions.json  [{ id, text, html }]
// Output: trailer-build/captions/cap-<id>.png
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const caps = JSON.parse(readFileSync('trailer-build/captions.json', 'utf8'))
mkdirSync('trailer-build/captions', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

for (const cap of caps) {
  await page.setContent(`<!doctype html><html><head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700&display=swap" rel="stylesheet">
    <style>
      html, body { margin: 0; width: 1920px; height: 1080px; background: transparent; }
      .cap {
        position: absolute; left: 50%; bottom: 84px; transform: translateX(-50%);
        max-width: 1160px; text-align: center;
        font-family: 'Inter', 'Helvetica Neue', sans-serif;
        font-size: 44px; line-height: 1.35; font-weight: 600; letter-spacing: -0.01em;
        color: rgba(255,255,255,0.96);
        text-shadow: 0 2px 26px rgba(0,0,0,0.75), 0 0 3px rgba(0,0,0,0.6);
      }
      .cap em { font-style: normal; font-weight: 700; color: #5B9BFF; }
    </style></head>
    <body><div class="cap">${cap.html}</div></body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `trailer-build/captions/cap-${cap.id}.png`, omitBackground: true })
  console.log(`caption cap-${cap.id}.png — "${cap.text.slice(0, 50)}…"`)
}
await browser.close()
