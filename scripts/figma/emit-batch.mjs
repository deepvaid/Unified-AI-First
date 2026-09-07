#!/usr/bin/env node
/**
 * emit-batch.mjs — prints a compact JSON slice of variable-plan.json for pasting into a use_figma call.
 *
 *   node scripts/figma/emit-batch.mjs <Collection> <offset> <limit>
 *   node scripts/figma/emit-batch.mjs --sizes            (row counts per collection)
 *   node scripts/figma/emit-batch.mjs --styles           (text/effect/paint style specs)
 *
 * Row shape: { n: name, t: type, s: scopes[], c: codeSyntax, d: description, v: { Mode: {a: aliasName} | {h: '#hex[aa]'} | {f: number} | {str: string} } }
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const plan = JSON.parse(fs.readFileSync(path.join(root, 'docs/design-system/figma/variable-plan.json'), 'utf8'))
const [arg, offset = '0', limit = '1000'] = process.argv.slice(2)

if (arg === '--sizes') {
  for (const c of plan.collections) console.log(`${c.name.padEnd(12)} ${c.variables.length}  modes=${c.modes.join('/')}${c.hidden ? '  hidden' : ''}`)
  process.exit(0)
}
if (arg === '--styles') {
  console.log(JSON.stringify({ text: plan.textStyles, effect: plan.effectStyles, paint: plan.paintStyles }))
  process.exit(0)
}
const coll = plan.collections.find((c) => c.name === arg)
if (!coll) { console.error(`unknown collection ${arg}`); process.exit(1) }
const rows = coll.variables.slice(+offset, +offset + +limit).map((v) => ({
  n: v.name, t: v.type, s: v.scopes, c: v.codeSyntax, d: v.description,
  v: Object.fromEntries(Object.entries(v.values).map(([m, val]) => [m, val.alias ? { a: val.alias } : val.hex ? { h: val.hex } : val.number !== undefined ? { f: val.number } : { str: val.string }])),
}))
console.log(JSON.stringify({ collection: coll.name, modes: coll.modes, rows }))
console.error(`${rows.length} rows (${offset}..${+offset + rows.length - 1} of ${coll.variables.length}), ${JSON.stringify(rows).length} bytes`)
