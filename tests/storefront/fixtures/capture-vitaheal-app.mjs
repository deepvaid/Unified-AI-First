// What the app's Pinia stores hold for Vitaheal (demo): its sales channel, products,
// campaigns, merchandising, plans, subscriptions, chatbot, chats and announcement
// emails, read with the clock frozen and Math.random seeded so two runs agree.
//
// vitaheal-app-head.json is this, read from the tree before the demo store registry
// (commit 30ff1a0d), once in an empty browser and once in a browser holding
// vitaheal-saved-head.json. demoStoresApp.test.ts reads today's stores the same way
// (readVitaheal, frozen) and compares. Capture it again only for a deliberate change
// to what Vitaheal is seeded with:
//
//   git worktree add ../vitaheal-before 30ff1a0d
//   node --experimental-strip-types tests/storefront/fixtures/capture-vitaheal-app.mjs ../vitaheal-before/src tests/storefront/fixtures/vitaheal-app-head.json
//   git worktree remove ../vitaheal-before
//
// Packages resolve from this repo's node_modules, so the worktree needs no install.
//
// Patched once since, on 2026-11-24 (feedback round): Vitaheal's products were given their
// facts (`detail.specs`) on purpose, so `fresh.products` was replaced with today's; a check
// confirmed nothing else in either scenario had changed, and nothing but `specs` in a product.
//
// Patched a second time, on 2026-11-25 (eight more products, seed version 2): in `fresh`,
// `products` gained 2009-2016 after the first eight (unchanged), both `plans` gained 2009, 2010
// and 2014, and the synonym `vh-syn-immune` was added to `searchRules.synonyms` and
// `merchandising.synonymList`. Those four parts were replaced with today's; every other part
// was checked identical. `saved` was not touched: it is what that browser read before the
// registry, and a browser that holds vitaheal-saved-head.json at seed version 2 still reads it
// back exactly (demoStoresApp.test.ts). At seed 1 the store is seeded again instead
// (vitahealReseed.test.ts).
//
// Patched a third time, the same day, after the review of the new range: in `fresh`, only
// `products` was replaced (the new products' copy, and Creatine's 30-serving pack and weights);
// every other part was checked identical, and `saved` was not touched.
import { setMaxListeners } from 'node:events'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { register } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isMainThread } from 'node:worker_threads'

const VH = 'vitaheal-demo'
const VITAHEAL_CHATBOT_ID = 101
const STORE_CAMPAIGN_TAG = 'Store campaign'
/** The day the stores are read on, at local midday, so it is that day in every time zone. */
export const VITAHEAL_APP_DAY = '2026-11-18'
/** Every merchandising list a demo store keeps, by the name of its channel view in useMerchandising. */
const MERCH_LISTS = [
  'synonymList', 'redirectList', 'searchPinList', 'engineList', 'collectionList', 'pinningRuleList', 'merchRuleList',
  'fieldList', 'searchRuleList', 'promoCardList', 'bannerList', 'blacklistTermList', 'blacklistedProductList',
]

const plain = (value) => JSON.parse(JSON.stringify(value))

/**
 * Runs `fn` with Date frozen at midday on VITAHEAL_APP_DAY (a Date made with arguments is
 * still that date) and Math.random seeded, then puts both back.
 */
export async function frozen(fn) {
  const RealDate = Date
  const realRandom = Math.random
  const [year, month, day] = VITAHEAL_APP_DAY.split('-').map(Number)
  const fixed = new RealDate(year, month - 1, day, 12).getTime()
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [fixed])) }
    static now() { return fixed }
  }
  let seed = 1
  Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  try {
    return await fn()
  } finally {
    globalThis.Date = RealDate
    Math.random = realRandom
  }
}

/** Vitaheal's part of every store, as plain JSON. `app` holds the stores by the names demoStoresApp.test.ts uses. */
export function readVitaheal(app) {
  app.merch.setActiveChannel(VH)
  return plain({
    channel: app.channels.channels.find((channel) => channel.id === VH),
    products: app.commerce.products.filter((product) => product.channelIds?.includes(VH)),
    campaigns: app.storeCampaigns.campaignsForChannel(VH),
    searchRules: app.merch.searchRulesFor(VH),
    merchandising: Object.fromEntries(MERCH_LISTS.map((name) => [name, app.merch[name]])),
    plans: app.subscriptions.plans.filter((plan) => plan.channelId === VH),
    contracts: app.subscriptions.contracts.filter((contract) => contract.channelId === VH),
    chatbot: app.chatbot.getByChannel(VH),
    conversations: app.chatbot.conversationsFor(VITAHEAL_CHATBOT_ID),
    emails: app.emails.campaigns.filter((email) => email.config?.tag === STORE_CAMPAIGN_TAG),
  })
}

// ── Run as a script: capture from another tree ──────────────────────────────

/** Module hook: '@/x' resolves in the captured tree's src, a bare package in this repo. */
let capturedSrc
export function initialize(data) {
  capturedSrc = data.src
}
function withTs(file) {
  if (existsSync(file) && statSync(file).isFile()) return file
  for (const candidate of [`${file}.ts`, path.join(file, 'index.ts')]) if (existsSync(candidate)) return candidate
  return null
}
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const file = withTs(path.join(capturedSrc, specifier.slice(2)))
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const file = withTs(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier))
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true }
  }
  if (!/^(\.|\/|node:|file:|data:)/.test(specifier)) return next(specifier, { ...context, parentURL: import.meta.url })
  return next(specifier, context)
}

async function capture(src, out) {
  register(import.meta.url, { data: { src: path.resolve(src) } })
  const saved = JSON.parse(readFileSync(new URL('./vitaheal-saved-head.json', import.meta.url), 'utf8'))
  const memory = new Map()
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => { memory.set(key, String(value)) },
    removeItem: (key) => { memory.delete(key) },
    key: (index) => [...memory.keys()][index] ?? null,
    get length() { return memory.size },
    clear: () => memory.clear(),
  }
  globalThis.window = new EventTarget()
  // Each store adds its storage listeners to the one window.
  setMaxListeners(0, globalThis.window)
  const at = (name) => pathToFileURL(withTs(path.join(path.resolve(src), 'stores', name))).href
  const fixture = await frozen(async () => {
    const { createPinia, setActivePinia } = await import('pinia')
    const stores = {
      channels: (await import(at('useSalesChannels'))).useSalesChannelsStore,
      commerce: (await import(at('useCommerce'))).useCommerceStore,
      storeCampaigns: (await import(at('useStoreCampaigns'))).useStoreCampaignsStore,
      merch: (await import(at('useMerchandising'))).useMerchandisingStore,
      chatbot: (await import(at('useChatbot'))).useChatbotStore,
      subscriptions: (await import(at('useSubscriptions'))).useSubscriptionsStore,
      emails: (await import(at('useCampaigns'))).useCampaignsStore,
    }
    const read = async (browser) => {
      memory.clear()
      for (const [key, value] of Object.entries(browser)) memory.set(key, value)
      setActivePinia(createPinia())
      const app = Object.fromEntries(Object.entries(stores).map(([name, use]) => [name, use()]))
      await new Promise((resolve) => setTimeout(resolve, 10))
      return readVitaheal(app)
    }
    return { day: VITAHEAL_APP_DAY, fresh: await read({}), saved: await read(saved) }
  })
  writeFileSync(out, `${JSON.stringify(fixture, null, 2)}\n`)
  console.log('written', out)
}

// The hook thread loads this file too: only the main thread captures.
if (isMainThread && process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [src, out] = process.argv.slice(2)
  if (!src || !out) throw new Error('usage: capture-vitaheal-app.mjs <src of the tree to read> <out.json>')
  await capture(src, out)
}
