#!/usr/bin/env node
/**
 * Downloads the reference screenshots listed in docs/chart-exploration/research/refs.json
 * into docs/chart-exploration/research/refs/, keeping citation map and bytes in lockstep.
 * Skips files that already exist. Extension derived from Content-Type.
 *
 *   node scripts/chart-exploration/fetch-refs.mjs [--force]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const RESEARCH = path.join(ROOT, 'docs', 'chart-exploration', 'research')
const OUT = path.join(RESEARCH, 'refs')
const FORCE = process.argv.includes('--force')

const EXT = {
  'image/webp': '.webp',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/avif': '.avif',
}

const { refs } = JSON.parse(fs.readFileSync(path.join(RESEARCH, 'refs.json'), 'utf8'))
fs.mkdirSync(OUT, { recursive: true })

let ok = 0
let skipped = 0
let failed = 0
for (const ref of refs) {
  const existing = fs.readdirSync(OUT).find((f) => f.startsWith(`${ref.id}.`))
  if (existing && !FORCE) {
    skipped++
    continue
  }
  try {
    const res = await fetch(ref.image, { redirect: 'follow' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const type = (res.headers.get('content-type') ?? '').split(';')[0]
    const ext = EXT[type] ?? '.png'
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 5000) throw new Error(`suspiciously small (${buf.length}B, ${type})`)
    fs.writeFileSync(path.join(OUT, `${ref.id}${ext}`), buf)
    console.log(`  ✓ ${ref.id}${ext} (${Math.round(buf.length / 1024)}kB)`)
    ok++
  } catch (err) {
    console.error(`  ✖ ${ref.id}: ${err.message}`)
    failed++
  }
}
console.log(`\n${ok} downloaded, ${skipped} already present, ${failed} failed`)
process.exit(failed ? 1 : 0)
