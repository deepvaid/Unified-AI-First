#!/usr/bin/env node
/**
 * Builds the self-contained review deck at docs/chart-exploration/deck/index.html
 * from manifest.json + copy.json + research/refs.json. No dependencies, relative
 * image paths (../), works from file:// — the Figma-independent review surface.
 *
 *   node scripts/chart-exploration/build-deck.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = path.join(ROOT, 'docs', 'chart-exploration')
const manifest = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'))
const copy = JSON.parse(fs.readFileSync(path.join(BASE, 'copy.json'), 'utf8'))
const { refs } = JSON.parse(fs.readFileSync(path.join(BASE, 'research', 'refs.json'), 'utf8'))

const shot = (name, chart) => manifest.shots.find((s) => s.shot === name && s.chart === chart)?.file
const img = (file, cls = '') => (file ? `<img class="${cls}" loading="lazy" src="../${file}" alt="">` : '')
const OPTS = [
  ['optionA', 'option-a', '02'],
  ['optionB', 'option-b', '03'],
  ['optionD', 'option-d', '05'],
]

const refFile = (r) => {
  const dir = path.join(BASE, 'research', 'refs')
  const f = fs.readdirSync(dir).find((x) => x.startsWith(`${r.id}.`))
  return f ? `research/refs/${f}` : null
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const optionSection = ([id, slug, num]) => {
  const o = copy.options[id]
  const informed = refs.filter((r) => r.informs.includes(slug))
  return `
<section id="s${num}">
  <h2><span class="num">${num}</span> ${esc(o.name)}</h2>
  <p class="philosophy">${esc(o.philosophy)}</p>
  <p class="desc">${esc(o.figmaDescription)}</p>
  <div class="meta-grid">
    <div><h4>References</h4><p>${o.references.map(esc).join(' · ')}</p></div>
    <div><h4>Why it works</h4><p>${esc(o.whyItWorks)}</p></div>
    <div><h4>Why for Maropost</h4><p>${esc(o.whyForMaropost)}</p></div>
    <div><h4>Trade-off</h4><p>${esc(o.tradeoff)}</p></div>
    <div><h4>What changed vs today</h4><p>${esc(o.vsToday ?? '')}</p></div>
  </div>
  <h3>Mood board</h3>
  <div class="refgrid">${informed.map((r) => `<figure>${img(refFile(r))}<figcaption>${esc(r.product)} — ${esc(r.pattern)}</figcaption></figure>`).join('')}</div>
  <h3>Palette &amp; tokens</h3>
  ${img(shot('tokens', slug), 'wide')}
  <h3>Chart examples</h3>
  <div class="row4">${['widget-line', 'widget-area', 'widget-bar', 'widget-donut'].map((w) => img(shot(w, slug))).join('')}</div>
  <div class="row4">${['widget-customers', 'widget-country', 'widget-products', 'widget-devices'].map((w) => img(shot(w, slug))).join('')}</div>
  <div class="row4">${['widget-line-hover', 'widget-bar-hover'].map((w) => img(shot(w, slug))).join('')}${img(shot('specimen', slug))}</div>
  <h3>Full dashboard</h3>
  ${img(shot('dashboard-fold', slug), 'wide')}
  <p class="linkline"><a href="../${shot('dashboard-full', slug) ?? ''}" target="_blank">Open full-page capture ↗</a> ·
     live: <code>/accounts/2000290/dashboard?chart=${id}</code></p>
</section>`
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Maropost — Chart Visual System Exploration</title>
<style>
  :root { --ink:#1a1814; --muted:rgba(26,24,20,.62); --line:rgba(26,24,20,.10); --bg:#f7f7f5; --card:#fff; }
  * { box-sizing:border-box; margin:0; }
  body { font:15px/1.55 Inter,system-ui,sans-serif; color:var(--ink); background:var(--bg); }
  nav { position:sticky; top:0; z-index:9; background:rgba(247,247,245,.92); backdrop-filter:blur(8px);
        border-bottom:1px solid var(--line); padding:10px 24px; display:flex; gap:14px; flex-wrap:wrap; font-size:13px; }
  nav a { color:var(--muted); text-decoration:none; font-weight:600; }
  nav a:hover { color:var(--ink); }
  main { max-width:1240px; margin:0 auto; padding:32px 24px 120px; }
  header.hero { padding:40px 0 8px; }
  h1 { font-size:30px; letter-spacing:-.02em; }
  .sub { color:var(--muted); margin-top:6px; max-width:70ch; }
  section { margin-top:64px; scroll-margin-top:64px; }
  h2 { font-size:22px; letter-spacing:-.01em; margin-bottom:6px; }
  h2 .num { color:var(--muted); font-weight:700; margin-right:8px; }
  h3 { font-size:14px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin:28px 0 10px; }
  h4 { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:4px; }
  .philosophy { font-size:17px; font-weight:600; }
  .desc { color:var(--muted); max-width:78ch; margin-top:6px; }
  .meta-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:16px;
               background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; }
  img { max-width:100%; border:1px solid var(--line); border-radius:10px; background:#fff; display:block; }
  img.wide { width:100%; }
  .row4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; margin-top:8px; }
  .refgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:12px; }
  .refgrid figcaption { font-size:12px; color:var(--muted); margin-top:4px; }
  .linkline { margin-top:8px; font-size:13px; color:var(--muted); }
  .linkline a { color:inherit; }
  .cols4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:16px; }
  .cols4 > div { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; }
  .cols4 h3 { margin:0 0 8px; }
  .cols4 p { font-size:13.5px; margin-top:8px; }
  .foldrow { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:12px; }
  .foldrow figcaption { font-weight:600; font-size:13px; margin:6px 0 2px; }
  code { background:rgba(26,24,20,.06); border-radius:4px; padding:1px 5px; font-size:12.5px; }
  footer { margin-top:80px; color:var(--muted); font-size:12.5px; }
</style></head><body>
<nav>
  <a href="#s00">00 Existing</a><a href="#s01">01 Research</a>
  <a href="#s02">02 Restrained Blue</a><a href="#s03">03 Multi-Color</a>
  <a href="#s04">04 Blue·Teal·Green</a><a href="#s05">05 Modern Gradient</a>
  <a href="#s06">06 Side-by-Side</a>
</nav>
<main>
<header class="hero">
  <h1>Chart Visual System Exploration</h1>
  <p class="sub">Four chart systems, one dashboard. Same layout, same widgets, same numbers —
  only the data-visualization language changes. Captured ${esc(manifest.capturedAt?.slice(0, 10) ?? '')} @ ${esc(manifest.gitSha ?? '')}.</p>
</header>

<section id="s00">
  <h2><span class="num">00</span> Existing Dashboard</h2>
  <p class="desc">${esc(copy.baseline.summary)}</p>
  ${img(shot('dashboard-fold', 'current'), 'wide')}
  <div class="row4">${['widget-line', 'widget-area', 'widget-bar', 'widget-donut'].map((w) => img(shot(w, 'current'))).join('')}</div>
  <div class="row4">${['widget-customers', 'widget-country', 'widget-products', 'widget-devices'].map((w) => img(shot(w, 'current'))).join('')}</div>
  <p class="linkline"><a href="../${shot('dashboard-full', 'current') ?? ''}" target="_blank">Open full-page capture ↗</a> ·
     audit: <code>docs/chart-exploration/notes/00-audit.md</code></p>
</section>

<section id="s01">
  <h2><span class="num">01</span> Research</h2>
  <p class="desc">${refs.length} references (Mobbin sweep + heritage), each kept because it teaches something.
  Full notes with pattern takeaways: <code>docs/chart-exploration/research/research-notes.md</code>.
  Internal mood-board use only.</p>
  <div class="refgrid">${refs.map((r) => `<figure>${img(refFile(r))}<figcaption><b>${esc(r.product)}</b> — ${esc(r.pattern)}</figcaption></figure>`).join('')}</div>
</section>

${OPTS.map(optionSection).join('\n')}

<section id="s06">
  <h2><span class="num">06</span> Side-by-Side Comparison</h2>
  <p class="philosophy">Four chart systems, one dashboard.</p>
  <h3>The same dashboard, four ways</h3>
  <div class="foldrow">
    ${OPTS.map(([id, slug]) => `<figure><figcaption>${esc(copy.options[id].name)}</figcaption>${img(shot('dashboard-fold', slug))}</figure>`).join('')}
  </div>
  <h3>The same charts, four systems</h3>
  ${img(shot('specimen-grid', 'all'), 'wide')}
  <h3>How to choose</h3>
  <div class="cols4">
    ${OPTS.map(([id]) => {
      const o = copy.options[id]
      return `<div><h3>${esc(o.name)}</h3>
      <p><b>Philosophy.</b> ${esc(o.philosophy)}</p>
      <p><b>Reference.</b> ${o.references.map(esc).join(', ')}</p>
      <p><b>Why it works.</b> ${esc(o.whyForMaropost)}</p>
      <p><b>Trade-off.</b> ${esc(o.tradeoff)}</p></div>`
    }).join('')}
  </div>
</section>

<footer>Generated by scripts/chart-exploration/build-deck.mjs · exploration state in CHART_EXPLORATION_CONTEXT.md ·
live compare page: <code>/chart-exploration</code></footer>
</main></body></html>
`

fs.mkdirSync(path.join(BASE, 'deck'), { recursive: true })
fs.writeFileSync(path.join(BASE, 'deck', 'index.html'), html)
console.log(`deck → docs/chart-exploration/deck/index.html (${Math.round(html.length / 1024)}kB)`)
