#!/usr/bin/env node
/**
 * Supernova token sync script.
 *
 * Works around a bug in @supernovaio/cli@2.x where the API server expects
 * `settings.dryRun` inside the request body but the CLI sends `dryRun` at
 * the top level, causing a 500 on the Supernova API.
 *
 * Usage:
 *   node scripts/supernova-sync.mjs
 *   SUPERNOVA_TOKEN=<token> node scripts/supernova-sync.mjs
 */

import { resolve } from 'path'

const API_KEY = process.env.SUPERNOVA_TOKEN

if (!API_KEY) {
  console.error('SUPERNOVA_TOKEN environment variable is required')
  process.exit(1)
}

const DESIGN_SYSTEM_ID = '725033'
const TOKEN_FILE = resolve('design-kit/figma-export/tokens-studio.json')
const CONFIG_FILE = resolve('supernova-config.json')

const { FigmaTokensDataLoader } = await import(
  '../node_modules/@supernovaio/cli/dist/utils/figma-tokens-data-loader.js'
)
const { getWritableVersion } = await import(
  '../node_modules/@supernovaio/cli/dist/utils/sdk.js'
)

const flags = {
  apiKey: API_KEY,
  designSystemId: DESIGN_SYSTEM_ID,
  tokenFilePath: TOKEN_FILE,
  configFilePath: CONFIG_FILE,
}

console.log('→ Connecting to Supernova...')
const { id, instance } = await getWritableVersion(flags)
console.log(`  Design system ID : ${DESIGN_SYSTEM_ID}`)
console.log(`  Version ID       : ${id?.versionId ?? id}`)

// ── Patch fetch ─────────────────────────────────────────────────────────────
// The Supernova API (v2.x) expects settings.dryRun inside the POST body, but
// the SDK spreads the config at the top level. Restructure on the way out.
const origFetch = globalThis.fetch
globalThis.fetch = async (url, opts) => {
  if (url?.toString().includes('token-studio') && opts?.method === 'POST') {
    const body = JSON.parse(opts.body)
    if (!body.settings && 'dryRun' in body) {
      body.settings = {
        dryRun: body.dryRun ?? false,
        verbose: body.verbose ?? false,
      }
      delete body.dryRun
      delete body.verbose
      opts = { ...opts, body: JSON.stringify(body) }
    }
  }
  return origFetch(url, opts)
}

// ── Sync ────────────────────────────────────────────────────────────────────
const dataLoader = new FigmaTokensDataLoader()
const tokenDefinition = await dataLoader.loadTokensFromPath(TOKEN_FILE)
const buildData = (payload) => ({
  connection: { name: 'CLI' },
  ...dataLoader.loadConfigFromPathAsIs(CONFIG_FILE),
  payload,
})

console.log('→ Syncing tokens...')
try {
  const response = await instance.versions.writeTokenStudioData(id, buildData(tokenDefinition))
  if (response?.result?.logs?.length) {
    for (const line of response.result.logs) {
      console.log(' ', line)
    }
  }
  console.log('\n✓ Tokens synced to Supernova successfully')
} catch (e) {
  console.error('\n✗ Sync failed:', e.message)
  process.exit(1)
}
