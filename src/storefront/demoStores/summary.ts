// What applying a theme, restoring a store and starting a store from a theme
// do, in the words the confirm dialogs, the restore card and Create sales
// channel use. Pure: the facts are counted by the caller (useDemoStores), so the
// copy is tested in Node and every screen says the same thing.

import type { AssistantProfileId, StoreSnapshot } from './types.ts'

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

/** "one", "eight", "20". */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n)
}

/** "1 product", "20 products". */
function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** "a, b and c". */
function listOf(parts: readonly string[]): string {
  return parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US dollars', SEK: 'Swedish kronor', AUD: 'Australian dollars', NZD: 'New Zealand dollars', CAD: 'Canadian dollars',
  EUR: 'euros', GBP: 'pounds sterling', NOK: 'Norwegian kroner', DKK: 'Danish kroner',
}

/** "US dollars"; an unknown code as it is. */
export function currencyName(code: string): string {
  return CURRENCY_NAMES[code] ?? code
}

const ASSISTANT_KINDS: Record<AssistantProfileId, string> = {
  wellness: 'a health and wellness store',
  apparel: 'a clothing store',
  'auto-parts': 'an auto parts store',
  home: 'a furniture and home store',
}

/** What a store holds now, as Apply and Restore count it. */
export interface StoreFacts {
  /** "Vitaheal (demo)". */
  name: string
  /** The store runs no theme (it started blank and none is applied): there is nothing to replace. */
  blank: boolean
  /** Products sold in the store. */
  products: number
  /** The currency its prices are written in. */
  currency: string
  /** The store's own subscription plans (seeded or made in it) that are not paused. */
  activePlans: number
  /** The name of the theme applied to the store now, when that is not the one it started with. */
  runs: string | null
  /** Plans that theme brought: the next Apply removes them. */
  broughtPlans: number
  /** Connected to Merchandise Cloud, so its storefront has search. Absent: connected. */
  searchConnected?: boolean
  /** Its storefront has a wishlist, which Apply empties like the cart. */
  wishlist?: boolean
  /** Subscriptions shoppers hold in the store. */
  subscribers: number
  sizeCharts: number
}

/** What a theme brings into a store: counted from the snapshot it is installed with. */
export interface ThemeFacts {
  /** "Northfold". */
  name: string
  products: number
  collections: number
  pages: number
  campaigns: number
  /** Synonyms, redirects and pinned results. */
  searchRules: number
  plans: number
  sizeCharts: number
  currency: string
  assistant: AssistantProfileId
}

/** What a theme brings, counted from its snapshot. */
export function themeFacts(name: string, snapshot: StoreSnapshot): ThemeFacts {
  const { synonyms, redirects, searchPins } = snapshot.merchandising
  return {
    name,
    products: snapshot.products.length,
    collections: snapshot.collections.length,
    pages: snapshot.content.length,
    campaigns: snapshot.campaigns.length,
    searchRules: synonyms.length + redirects.length + searchPins.length,
    plans: snapshot.plans.length,
    sizeCharts: snapshot.sizeCharts.length,
    currency: snapshot.market.currency,
    assistant: snapshot.chatbot.assistantProfile,
  }
}

/**
 * What applying `theme` to `store` does, one line each, for the confirm dialog:
 * what is replaced, what changes, what stays and how to undo it.
 */
export function applySummary(store: StoreFacts, theme: ThemeFacts): string[] {
  const lines: string[] = []
  const adds = store.blank || !store.products
  const one = theme.products === 1
  lines.push(adds
    ? `${count(theme.products, 'product')} ${one ? 'is' : 'are'} added to this store.`
    : `${count(theme.products, 'product')} ${one ? 'replaces' : 'replace'} the ${store.products} in this store.`)
  const look = `${theme.name}’s look, ${listOf([count(theme.collections, 'collection'), count(theme.pages, 'page'), 'menus'])}`
  lines.push(store.blank ? `${look} are added.` : `${look} replace this store’s.`)
  const marketing = [
    ...(theme.campaigns ? [count(theme.campaigns, 'campaign')] : []),
    ...(theme.searchRules ? [count(theme.searchRules, 'search rule')] : []),
    ...(theme.sizeCharts ? [count(theme.sizeCharts, 'size chart')] : []),
  ]
  const single = marketing.length === 1 && marketing[0]!.startsWith('1 ')
  if (marketing.length) {
    lines.push(store.blank
      ? `${listOf(marketing)} ${single ? 'is' : 'are'} added.`
      : `${listOf(marketing)} ${single ? 'replaces' : 'replace'} this store’s.`)
  } else if (!store.blank) {
    lines.push('This store’s campaigns and search rules are removed.')
  }
  if (!store.blank && store.sizeCharts && !theme.sizeCharts) lines.push('This store’s size charts are removed.')
  lines.push(`The chatbot answers as ${ASSISTANT_KINDS[theme.assistant]}.`)
  if (theme.currency !== store.currency) lines.push(`Prices change to ${currencyName(theme.currency)}.`)
  if (store.searchConnected === false) {
    lines.push(theme.assistant === 'auto-parts'
      ? 'Search, part numbers included, works once this store connects to Merchandise Cloud.'
      : 'Search works once this store connects to Merchandise Cloud.')
  }
  if (store.activePlans) {
    const plans = store.activePlans === 1 ? 'This store’s subscription plan is paused' : `This store’s ${countWord(store.activePlans)} subscription plans are paused`
    lines.push(`${plans}, so no one new can subscribe${store.subscribers ? `; its ${countWord(store.subscribers)} subscribers keep their subscriptions` : ''}.`)
  }
  if (store.broughtPlans && store.runs) lines.push(store.broughtPlans === 1 ? `The subscription plan ${store.runs} brought is removed.` : `The ${countWord(store.broughtPlans)} subscription plans ${store.runs} brought are removed.`)
  if (theme.plans) lines.push(theme.plans === 1 ? `${theme.name}’s subscription plan is added.` : `${theme.name}’s ${countWord(theme.plans)} subscription plans are added.`)
  if (!store.blank) lines.push('Changes you made to this store’s products and campaigns are not kept: a restore brings back the original store, not your changes.')
  lines.push(store.wishlist ? 'Orders already placed stay. The cart and saved wishlist are emptied.' : 'Orders already placed stay. The cart is emptied.')
  lines.push(store.blank ? 'Restore original store makes this store blank again.' : 'Restore original store puts this store back as it started.')
  return lines
}

/** What a restore puts back: counted from the seed of the theme the store started with. */
export interface RestoreFacts {
  /** The theme the store started with ("Vitaheal"); null for a store that started blank. */
  original: string | null
  /** The theme applied to it now, when that is not the one it started with. */
  applied: string | null
  /** In the original seed. */
  plans: number
  /** Subscribers the store had before the demo. */
  subscribers: number
  campaigns: number
  sizeCharts: number
  /** Store campaigns are announced by email (the store has an audience list), so a restore removes those emails. */
  announcesByEmail: boolean
  /** The currency prices go back to, when it is not the one the store prices in now (absent: no change). */
  pricesBackTo?: string
  /** Plans the applied theme brought: a restore removes them, with the subscriptions taken on them. */
  appliedPlans?: number
  /** The Merchandise Cloud connection goes back to how the store started, when that is not how it is now. */
  connectionBack?: 'connected' | 'disconnected'
  /** Its storefront has a wishlist, which a restore empties like the cart. */
  wishlist?: boolean
}

/** The restore dialog's one sentence above its list. */
export function restoreMessage(name: string, facts: RestoreFacts): string {
  if (!facts.original) return `${name} goes back to how it was made: a blank store.`
  return `${name} goes back to how it started: the ${facts.original} theme, its products${facts.plans ? ', plans' : ''} and campaigns.`
}

/** What restoring the store does, one line each, for the confirm dialog. */
export function restoreSummary(facts: RestoreFacts): string[] {
  if (!facts.original) {
    return [
      ...(facts.applied ? [`${facts.applied}’s look, products, collections, pages and menus are removed, so the store is blank again.`] : ['The store stays blank.']),
      ...(facts.pricesBackTo ? [`Prices go back to ${currencyName(facts.pricesBackTo)}.`] : []),
      'Its subscription plans, size charts, campaigns, search rules and chatbot are removed.',
      ...(facts.connectionBack ? [`Merchandise Cloud is ${facts.connectionBack} again, as it was when the store was made.`] : []),
      'Duplicated and draft themes are removed.',
      facts.wishlist ? 'The cart and saved wishlist are emptied.' : 'The cart is emptied.',
      'Orders already placed stay.',
    ]
  }
  return [
    facts.applied
      ? `The theme goes back to ${facts.original}, with its collections, pages and menus.`
      : `The theme goes back to ${facts.original} as it was published, with its collections, pages and menus.`,
    ...(facts.pricesBackTo ? [`Prices go back to ${currencyName(facts.pricesBackTo)}.`] : []),
    'Duplicated and draft themes are removed.',
    'Products you added to this store are removed.',
    'Your edits to its products are undone.',
    ...(facts.applied && facts.appliedPlans ? [`${facts.applied}’s subscription plans are removed, with the subscriptions taken on them.`] : []),
    ...(facts.plans
      ? [`Subscription plans go back to the original ${countWord(facts.plans)}${facts.subscribers ? `, and subscribers to the original ${countWord(facts.subscribers)}` : ', and subscriptions taken in this store are removed'}.`]
      : []),
    ...(facts.sizeCharts ? [`Size charts go back to the original ${countWord(facts.sizeCharts)}.`] : []),
    facts.campaigns
      ? `Campaigns go back to the original ${countWord(facts.campaigns)}${facts.announcesByEmail ? ', and their announcement emails are removed' : ''}.`
      : 'Campaigns you added are removed.',
    ...(facts.connectionBack ? [`Merchandise Cloud is ${facts.connectionBack} again, as it was when the store started.`] : []),
    'The chatbot’s settings go back, and its chats from this store are removed.',
    facts.wishlist ? 'The cart and saved wishlist are emptied.' : 'The cart is emptied.',
    'Orders already placed stay.',
  ]
}

/** What the store keeps in this browser, as the restore card names it. */
export function restoreParts(facts: Pick<RestoreFacts, 'plans' | 'sizeCharts'>): { card: string } {
  if (facts.plans) return { card: 'Products, subscription plans and subscribers' }
  if (facts.sizeCharts) return { card: 'Products, size charts and campaigns' }
  return { card: 'Products and campaigns' }
}

/** What a store made from a theme starts with, for the Review step of Create sales channel. Null theme: blank. */
export function startSummary(theme: ThemeFacts | null): string {
  if (!theme) return 'A blank store: no products, pages or campaigns yet'
  const parts = [count(theme.products, 'product'), count(theme.collections, 'collection'), count(theme.pages, 'page')]
  if (theme.campaigns) parts.push(count(theme.campaigns, 'campaign'))
  if (theme.plans) parts.push(count(theme.plans, 'subscription plan'))
  return `A copy of ${theme.name}: ${listOf(parts)}, priced in ${currencyName(theme.currency)}`
}
