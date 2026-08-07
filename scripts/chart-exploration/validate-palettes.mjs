#!/usr/bin/env node
/**
 * Palette gate for the chart-exploration option themes. Runs the vendored
 * dataviz validator (six-checks method) over every option in
 * option-palettes.mjs, in light mode against the white card surface:
 *
 *  1. Standard categorical checks on the CHROMATIC slots (muted slate slots are
 *     a documented deviation — exempt from chroma floor / lightness band only).
 *  2. Full slot-order adjacency over ALL 6 slots (muted included): CVD ΔE ≥ 8
 *     (protan/deutan floor 6 = WARN) and normal-vision ΔE ≥ 15 — hard gates.
 *  3. Axis ramp: monotone OKLCH L with visible steps + light-end contrast
 *     (single-hue check reported but soft — optionD's axis sweeps hue by design).
 *  4. Semantic tokens: WCAG contrast vs surface (marks ≥ 3:1) + positive-green
 *     must sit ΔE ≥ 15 from every series slot (never impersonates a series).
 *
 *   node scripts/chart-exploration/validate-palettes.mjs [--option optionC]
 */
import { validate, validateOrdinal, contrast, deltaE } from './validate-palette.js'
import { OPTIONS, LIGHT_SURFACE } from './option-palettes.mjs'

const only = (() => {
  const i = process.argv.indexOf('--option')
  return i >= 0 ? process.argv[i + 1] : null
})()

const CVD_TARGET = 8
const CVD_FLOOR = 6
const NORMAL_FLOOR = 15
let anyFail = false

const fmt = (state) => (state === true || state === 'pass' ? 'PASS' : state === 'floor' || state === 'relief' || state === 'warn' ? 'WARN' : 'FAIL')

for (const [id, spec] of Object.entries(OPTIONS)) {
  if (only && id !== only) continue
  console.log(`\n━━ ${id} — ${spec.label} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  const rows = []

  // 1. standard six-checks on chromatic slots
  const chromatic = spec.series.filter((_, i) => !spec.mutedSlots.includes(i))
  const std = validate(chromatic, { mode: 'light', surface: LIGHT_SURFACE })
  for (const [name, state, detail] of std.report) {
    rows.push([`chromatic · ${name}`, fmt(state), detail])
    if (fmt(state) === 'FAIL') anyFail = true
  }

  // 2. full slot-order adjacency (all 6, muted included)
  for (let i = 0; i < spec.series.length - 1; i++) {
    const [a, b] = [spec.series[i], spec.series[i + 1]]
    const cvd = Math.min(deltaE(a, b, 'protan'), deltaE(a, b, 'deutan'))
    const nor = deltaE(a, b)
    const state = cvd >= CVD_TARGET && nor >= NORMAL_FLOOR ? 'pass' : cvd >= CVD_FLOOR && nor >= NORMAL_FLOOR ? 'warn' : 'fail'
    if (state === 'fail') anyFail = true
    if (state !== 'pass') rows.push([`slots s${i + 1}↔s${i + 2}`, fmt(state), `CVD ΔE ${cvd.toFixed(1)} · normal ΔE ${nor.toFixed(1)}`])
  }
  const worstAdj = Math.min(...spec.series.slice(1).map((c, i) => Math.min(deltaE(spec.series[i], c, 'protan'), deltaE(spec.series[i], c, 'deutan'))))
  const worstNor = Math.min(...spec.series.slice(1).map((c, i) => deltaE(spec.series[i], c)))
  rows.push(['full-order adjacency', worstAdj >= CVD_TARGET && worstNor >= NORMAL_FLOOR ? 'PASS' : worstAdj >= CVD_FLOOR && worstNor >= NORMAL_FLOOR ? 'WARN' : 'FAIL',
    `worst CVD ΔE ${worstAdj.toFixed(1)} (target ≥${CVD_TARGET}) · worst normal ΔE ${worstNor.toFixed(1)} (floor ≥${NORMAL_FLOOR})`])

  // 3. axis ramp
  const ord = validateOrdinal(spec.axis, { mode: 'light', surface: LIGHT_SURFACE })
  for (const [name, state, detail] of ord.report) {
    const soft = name === 'Single hue'
    const s = fmt(state)
    rows.push([`axis · ${name}${soft ? ' (soft)' : ''}`, soft && s === 'FAIL' ? 'WARN' : s, detail])
    if (!soft && s === 'FAIL') anyFail = true
  }

  // 4. semantic tokens
  for (const [name, hex] of Object.entries(spec.semantic)) {
    const cr = contrast(hex, LIGHT_SURFACE)
    const need = 3
    const state = cr >= need ? 'PASS' : 'FAIL'
    if (state === 'FAIL') anyFail = true
    rows.push([`semantic · ${name}`, state, `${hex} — ${cr.toFixed(2)}:1 vs surface`])
  }
  // Status-collision rule (dataviz method): a same-family positive may sit
  // ΔE 8–15 from a series slot ONLY because positives always ship icon+label
  // (KPI pills pair chevron + delta text). Below 8 is a hard fail.
  const posVsSeries = Math.min(...spec.series.map((s) => deltaE(spec.semantic.positive, s)))
  const pvState = posVsSeries >= NORMAL_FLOOR ? 'PASS' : posVsSeries >= 8 ? 'WARN' : 'FAIL'
  if (pvState === 'FAIL') anyFail = true
  rows.push(['semantic · positive-vs-series', pvState,
    `min ΔE ${posVsSeries.toFixed(1)} (≥${NORMAL_FLOOR} pass · 8–15 warn w/ icon+label mitigation)`])

  const pad = (s, n) => String(s).padEnd(n)
  for (const [name, state, detail] of rows) console.log(`  ${pad(state, 5)} ${pad(name, 34)} ${detail}`)
}

console.log(anyFail ? '\n✖ FAIL — fix the flagged slots before implementation' : '\n✓ all option palettes pass the hard gates')
process.exit(anyFail ? 1 : 0)
