import { defineStore } from 'pinia'
import { ref } from 'vue'
import { localDateKey } from '@/maropay/model'
import { keepPerChannel } from '@/stores/demoKeep'
import { demoChannelRecord, demoSnapshotOf } from '@/stores/useSalesChannels'
import { DEMO_STORES, canApplyTheme } from '@/storefront/demoStores'
import type { AssistantProfileId } from '@/storefront/demoStores'
import { historyFor } from '@/storefront/demoStores/install'
import type { InstallChannel } from '@/storefront/demoStores/install'
import { NORTHFOLD_CHANNEL_ID } from '@/storefront/northfoldDemo'
import { TORQLINE_CHANNEL_ID } from '@/storefront/torqlineDemo'
import { VITAHEAL_CHANNEL_ID } from '@/storefront/vitahealDemo'

/** A prompt is just its text — the assistant works out the intent itself. */
export interface QuickPrompt {
  id: number
  text: string
  enabled: boolean
}
export const MAX_QUICK_PROMPTS = 5

/** One indexed piece of a source: a crawled page, a questionnaire answer, a file section. */
export interface KnowledgeEntry {
  title: string
  text: string
  url?: string
}

export interface KnowledgeSource {
  id: number
  name: string
  icon: string
  items: number
  meta: string
  status: 'Active' | 'Disabled' | 'Indexing'
  enabled: boolean
  /** What the source contributed. The builder preview answers from these. */
  entries?: KnowledgeEntry[]
}

export type PreChatFieldType = 'Text' | 'Email' | 'Phone' | 'Text Area'
export interface PreChatField {
  id: number
  label: string
  type: PreChatFieldType
  placeholder: string
  required: boolean
}

export interface BusinessHour {
  day: string
  enabled: boolean
  open: string
  close: string
}

export interface ShoppingConfig {
  enabled: boolean
  source: 'catalog' | 'featured'
  showPrices: boolean
  allowAddToCart: boolean
  checkoutUrl: string
}

export interface OrderTrackingConfig {
  enabled: boolean
  allowGuest: boolean
  guestPortal: string
  resendEmail: boolean
  accountSync: boolean
}

export interface ChatbotConfig {
  // General
  storeName: string
  address1: string
  address2: string
  instagram: string
  storeType: string | null
  storeUrl: string
  // Appearance
  brandName: string
  brandSubtitle: string
  logoName: string | null
  primaryColor: string
  position: 'left' | 'right'
  /** Text shown beside the launcher; off = the launcher shows the logo alone. */
  launcherText: string
  launcherTextEnabled: boolean
  welcomeMessage: string
  // Sections
  businessHours: BusinessHour[]
  quickPrompts: QuickPrompt[]
  knowledgeSources: KnowledgeSource[]
  preChatEnabled: boolean
  skipForLoggedIn: boolean
  preChatFields: PreChatField[]
  shopping: ShoppingConfig
  orderTracking: OrderTrackingConfig
  /**
   * The knowledge the store's assistant answers shoppers with
   * (src/chatbot/assistantProfiles.ts). A demo store's theme brings its own. Unset: 'wellness'.
   */
  assistantProfile?: AssistantProfileId
}

export type ChatbotStatus = 'Active' | 'Inactive' | 'Disabled' | 'Archived'
export interface Chatbot {
  id: number
  store: string
  storeUrl: string
  /** The sales channel (web store) this chatbot serves, if it is linked to one. */
  channelId: string | null
  status: ChatbotStatus
  conversations: number
  createdOn: string
  lastModified: string
  archivedOn?: string
  config: ChatbotConfig
}

export interface ChatbotMessage {
  from: 'shopper' | 'bot'
  text: string
  time: string
}
export interface ChatbotConversation {
  id: string
  chatbotId: number
  visitor: string
  startedAt: string
  topic: string
  resolved: boolean
  messages: ChatbotMessage[]
}

export interface PreviewProduct {
  id: number
  name: string
  icon: string
  price: number
  salePrice?: number
}

function defaultConfig(store: string, storeUrl: string): ChatbotConfig {
  return {
    storeName: store,
    address1: '',
    address2: '',
    instagram: '',
    storeType: null,
    storeUrl,
    brandName: store,
    brandSubtitle: '24×7 Support Chat',
    logoName: null,
    primaryColor: '#2563EB',
    position: 'left',
    launcherText: 'Need help?',
    launcherTextEnabled: true,
    welcomeMessage: 'Hello! How can I help you today?',
    businessHours: [
      { day: 'Monday', enabled: true, open: '09:00', close: '17:00' },
      { day: 'Tuesday', enabled: true, open: '09:00', close: '17:00' },
      { day: 'Wednesday', enabled: true, open: '09:00', close: '17:00' },
      { day: 'Thursday', enabled: true, open: '09:00', close: '17:00' },
      { day: 'Friday', enabled: true, open: '09:00', close: '17:00' },
      { day: 'Saturday', enabled: false, open: '10:00', close: '14:00' },
      { day: 'Sunday', enabled: false, open: '10:00', close: '14:00' },
    ],
    quickPrompts: [
      { id: 1, text: 'Track my order', enabled: true },
      { id: 2, text: 'Shop for items', enabled: true },
      { id: 3, text: 'Email invoice', enabled: true },
      { id: 4, text: 'FAQs & Help', enabled: true },
    ],
    knowledgeSources: [
      {
        id: 1, name: 'Frequently asked questions', icon: 'globe', items: 12, meta: 'Added 16 Jul 2026', status: 'Active', enabled: true,
        entries: [
          { title: 'Shipping and delivery', text: 'Standard delivery takes 3–5 business days and is free on orders over $75. Express delivery arrives in 1–2 business days.', url: `${storeUrl}/shipping` },
          { title: 'Returns and refunds', text: 'You can return unworn items within 30 days for a full refund. Refunds go back to the original payment method within 5 business days.', url: `${storeUrl}/returns` },
          { title: 'Payment methods', text: 'We accept Visa, Mastercard, American Express, PayPal and Apple Pay.', url: `${storeUrl}/payments` },
        ],
      },
      {
        id: 2, name: 'Help Articles', icon: 'file-text', items: 12, meta: 'Uploaded 16 Jul 2026', status: 'Active', enabled: true,
        entries: [
          { title: 'Sizing guide', text: 'Our sizes run true to size. Each product page has a size chart, and you can exchange for a different size free of charge.' },
          { title: 'Gift cards', text: 'Gift cards are delivered by email, never expire, and can be used with any other discount.' },
        ],
      },
      { id: 3, name: 'Complete Website (34 pages)', icon: 'globe', items: 10, meta: 'Last updated 15 Jul 2026', status: 'Disabled', enabled: false },
      { id: 4, name: 'Support Docs', icon: 'file-text', items: 8, meta: 'Uploaded 14 Jul 2026', status: 'Indexing', enabled: true },
    ],
    preChatEnabled: true,
    skipForLoggedIn: true,
    preChatFields: [
      { id: 1, label: 'First name', type: 'Text', placeholder: 'Enter your first name', required: true },
      { id: 2, label: 'Last name', type: 'Text', placeholder: 'Enter your last name', required: true },
      { id: 3, label: 'Email', type: 'Email', placeholder: 'Enter your email address', required: true },
      { id: 4, label: 'How can we help?', type: 'Text Area', placeholder: 'Describe your question or issue', required: true },
    ],
    shopping: {
      enabled: true,
      source: 'catalog',
      showPrices: true,
      allowAddToCart: true,
      checkoutUrl: '',
    },
    orderTracking: {
      enabled: true,
      allowGuest: true,
      guestPortal: '',
      resendEmail: true,
      accountSync: true,
    },
  }
}

const CONVERSATION_SEED: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'Priya Nair', startedAt: 'Today, 10:42 AM', topic: 'Order status', resolved: true,
    messages: [
      { from: 'shopper', text: 'Hi, where is my order #88592?', time: '10:42 AM' },
      { from: 'bot', text: 'Order #88592 is out for delivery and should arrive today before 6 PM.', time: '10:42 AM' },
      { from: 'shopper', text: 'Great, thank you!', time: '10:43 AM' },
      { from: 'bot', text: 'You’re welcome. Anything else I can help with?', time: '10:43 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Today, 9:15 AM', topic: 'Returns', resolved: true,
    messages: [
      { from: 'shopper', text: 'What is your return policy?', time: '9:15 AM' },
      { from: 'bot', text: 'You can return unworn items within 30 days for a full refund. Refunds go back to the original payment method within 5 business days.', time: '9:15 AM' },
      { from: 'shopper', text: 'Do I pay for return shipping?', time: '9:16 AM' },
      { from: 'bot', text: 'Returns are free — you’ll get a prepaid label by email once you start the return.', time: '9:16 AM' },
    ],
  },
  {
    visitor: 'Marcus Lee', startedAt: 'Yesterday, 6:08 PM', topic: 'Product search', resolved: true,
    messages: [
      { from: 'shopper', text: 'Looking for red boots in size 11', time: '6:08 PM' },
      { from: 'bot', text: 'Here are a few great matches: Crimson Leather Boots, Cherry Ankle Boots and Ruby Chelsea Boots.', time: '6:08 PM' },
      { from: 'shopper', text: 'Add the Crimson ones to my cart', time: '6:10 PM' },
      { from: 'bot', text: 'Added Crimson Leather Boots (size 11) to your cart.', time: '6:10 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 2:31 PM', topic: 'Delivery area', resolved: false,
    messages: [
      { from: 'shopper', text: 'Do you deliver to postcode 4870?', time: '2:31 PM' },
      { from: 'bot', text: 'I don’t have delivery details for that postcode yet. I can create a ticket so the team gets back to you — what’s your name and email?', time: '2:31 PM' },
      { from: 'shopper', text: 'Sam Carter, sam@example.com', time: '2:33 PM' },
      { from: 'bot', text: 'Thanks, Sam. I’ve raised a ticket and the team will reply by email.', time: '2:33 PM' },
    ],
  },
  {
    visitor: 'Elena Rossi', startedAt: 'Mon, 11:20 AM', topic: 'Invoice', resolved: true,
    messages: [
      { from: 'shopper', text: 'Can you email me the invoice for my last order?', time: '11:20 AM' },
      { from: 'bot', text: 'Done — I’ve sent the invoice for order #88410 to the email on your account.', time: '11:20 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Mon, 8:02 AM', topic: 'Sizing', resolved: true,
    messages: [
      { from: 'shopper', text: 'Do your shoes run small?', time: '8:02 AM' },
      { from: 'bot', text: 'Our sizes run true to size. Each product page has a size chart, and exchanges for a different size are free.', time: '8:02 AM' },
    ],
  },
]

let seq = 0
function make(
  store: string,
  storeUrl: string,
  status: ChatbotStatus,
  conversations: number,
  createdOn: string,
  lastModified: string,
  extra: Partial<Pick<Chatbot, 'archivedOn' | 'channelId'>> & { primaryColor?: string } = {},
): Chatbot {
  const config = defaultConfig(store, storeUrl)
  if (extra.primaryColor) config.primaryColor = extra.primaryColor
  return {
    id: ++seq,
    store,
    storeUrl,
    channelId: extra.channelId ?? null,
    status,
    conversations,
    createdOn,
    lastModified,
    archivedOn: extra.archivedOn,
    config,
  }
}

// ── The demo stores' chatbots ────────────────────────────────────────────────
// A demo store's chatbot (Vitaheal (demo)) is the one that also runs on its
// storefront (StorefrontChat.vue). Its settings and the chats shoppers have with
// it are kept in the browser with the rest of that store's data, so a change in
// the builder reaches the store's own tab, a chat on the store shows up under
// Conversations, and "Restore original store" puts both back. Its settings come
// from the theme the store runs (src/storefront/demoStores/); its id, whether it
// is on and its chats are the store's own, so applying another theme keeps them.

/** A demo store's chatbot id: 99 + the store's slot, clear of the ids `make` hands out. */
function demoChatbotId(slot: number): number {
  return 99 + slot
}

/** Vitaheal (demo)'s chatbot (store slot 2). */
export const VITAHEAL_CHATBOT_ID = 101

/** How a demo store's chatbot is listed: the seeded stores' own have a past, any other starts now. */
const SEEDED_LISTING: Record<string, Pick<Chatbot, 'conversations' | 'createdOn' | 'lastModified'>> = {
  [VITAHEAL_CHANNEL_ID]: { conversations: 214, createdOn: 'Nov 16, 2026', lastModified: 'Nov 18, 2026' },
  [NORTHFOLD_CHANNEL_ID]: { conversations: 138, createdOn: 'Nov 19, 2026', lastModified: 'Nov 19, 2026' },
  [TORQLINE_CHANNEL_ID]: { conversations: 176, createdOn: 'Nov 23, 2026', lastModified: 'Nov 23, 2026' },
}

/** What of a demo chatbot is kept: whether it is on, and how it is set up. */
type KeptChatbot = Pick<Chatbot, 'status' | 'config'>

function isKeptChatbot(value: unknown): value is KeptChatbot {
  const kept = value as Partial<KeptChatbot> | null
  return !!kept && typeof kept.status === 'string' && typeof kept.config?.brandName === 'string'
    && typeof kept.config.welcomeMessage === 'string' && Array.isArray(kept.config.quickPrompts) && Array.isArray(kept.config.knowledgeSources)
}

function isConversationList(value: unknown): value is ChatbotConversation[] {
  return Array.isArray(value) && value.every((c: Partial<ChatbotConversation> | null) =>
    !!c && typeof c.id === 'string' && typeof c.chatbotId === 'number' && Array.isArray(c.messages))
}

/** A store's chatbot as the theme it runs now sets it up: on, with that theme's settings (the defaults for a blank store). */
function seededChatbot(channel: InstallChannel): KeptChatbot {
  const storeUrl = `https://${channel.webStore!.domain}`
  const seed = demoSnapshotOf(channel)?.chatbot
  // The snapshot is a fresh copy: the builder edits the config in place, and the seed must stay as written.
  const config: ChatbotConfig = seed
    ? { ...defaultConfig(channel.name, storeUrl), ...seed.config, assistantProfile: seed.assistantProfile }
    : defaultConfig(channel.name, storeUrl)
  return { status: 'Active', config }
}

function demoChatbot(channel: InstallChannel): Chatbot {
  const { status, config } = seededChatbot(channel)
  return {
    id: demoChatbotId(channel.webStore!.blueprint!.slot),
    store: channel.name,
    storeUrl: `https://${channel.webStore!.domain}`,
    channelId: channel.id,
    status,
    ...(SEEDED_LISTING[channel.id] ?? { conversations: 0, createdOn: 'Just now', lastModified: 'Just now' }),
    config,
  }
}

export const useChatbotStore = defineStore('chatbot', () => {
  // The seeded demo stores' chatbots come first (pure: no other store is read for them while this one sets up).
  const seededBots = DEMO_STORES.map((blueprint) => demoChatbot(blueprint.homeChannel))

  const chatbots = ref<Chatbot[]>([
    ...seededBots,
    make('Johny Style Store', 'https://johny-style.sss.com', 'Active', 1298, 'Jan 1, 2025', 'Nov 11, 2025', { channelId: 'neelam-store' }),
    make('Tech Gizmo Store', 'https://techgizmo.store.com', 'Active', 1298, 'Jan 1, 2025', 'Nov 11, 2025', { primaryColor: '#6D28D9' }),
    make('Gourmet Delights', 'https://gourmet-delights.com', 'Disabled', 752, 'Feb 15, 2023', 'Dec 31, 2024', { primaryColor: '#DD7A3B' }),
    make('Fashion Hub', 'https://fashionhub.com', 'Inactive', 2014, 'Mar 10, 2023', 'Aug 15, 2024', { primaryColor: '#C0559A', channelId: 'shopify-fashion' }),
    make('Home Essentials', 'https://homeessentials.org', 'Active', 890, 'Jun 5, 2024', 'May 20, 2026', { primaryColor: '#7BC67B' }),
    make('Eco-Friendly Goods', 'https://ecofriendlygoods.net', 'Active', 1120, 'Apr 12, 2023', 'Jan 5, 2026', { primaryColor: '#7BC67B' }),
    make('Pet Paradise', 'https://petparadise.com', 'Active', 1450, 'Dec 9, 2022', 'Nov 30, 2025', { primaryColor: '#E9C74A' }),
    make('Fitness First', 'https://fitnessfirst.com', 'Inactive', 1020, 'Sep 20, 2021', 'Jul 15, 2024', { primaryColor: '#1F2933' }),
    make('Book Nook', 'https://booknook.org', 'Active', 630, 'Jan 25, 2023', 'Mar 1, 2025', { primaryColor: '#7CB9D6' }),
    make('Seasonal Popup Store', 'https://seasonal-popup.com', 'Archived', 1298, 'Jan 1, 2025', 'Nov 11, 2025', { archivedOn: 'Nov 11, 2025' }),
    make('Holiday 2024 Store', 'https://holiday24.store.com', 'Archived', 842, 'Oct 1, 2024', 'Jan 2, 2025', { archivedOn: 'Jan 2, 2025' }),
    make('Legacy Storefront', 'https://legacy.store.com', 'Archived', 410, 'Mar 3, 2022', 'Jun 30, 2024', { archivedOn: 'Jun 30, 2024' }),
  ])

  const MAX_CHATBOTS = 20

  // A demo store's chatbot is never removed from the list (archiving only changes its status).
  /** Each demo store's own chatbot, by channel. */
  const demoBotIds = new Map<string, number>()
  /** The chats a demo store's chatbot had before the demo, by chatbot: history, seeded on the store's own channel only. */
  const pastChats = new Map<number, Omit<ChatbotConversation, 'id' | 'chatbotId'>[]>()
  const demoBot = (channelId: string): Chatbot | undefined => {
    const id = demoBotIds.get(channelId)
    return id === undefined ? undefined : getById(id)
  }
  /** Starts treating a chatbot as its demo store's own. */
  function registerDemoBot(bot: Chatbot): void {
    demoBotIds.set(bot.channelId!, bot.id)
    pastChats.set(bot.id, historyFor(bot.channelId!, localDateKey(Date.now()))?.conversations ?? [])
  }
  /** A store back to blank (restored, or deleted) loses the chatbot its theme gave it, with its chats and what this browser kept of them. */
  function removeDemoBot(channelId: string, bot: Chatbot): void {
    keptChatbot.clear(channelId)
    keptChats.clear(channelId)
    liveChats.value = liveChats.value.filter((chat) => chat.chatbotId !== bot.id)
    chatbots.value = chatbots.value.filter((entry) => entry.id !== bot.id)
    demoBotIds.delete(channelId)
    pastChats.delete(bot.id)
    keptChatbot.adopt(channelId)
    keptChats.adopt(channelId)
  }
  const seededFor = (channelId: string): KeptChatbot => seededChatbot(demoChannelRecord(channelId)!)
  const keptChatbot = keepPerChannel<KeptChatbot>('chatbot', 1, isKeptChatbot, {
    // A store back to blank has no chatbot: nothing to save, nothing to take.
    read: (channelId) => {
      const bot = demoBot(channelId)
      return (bot ? { status: bot.status, config: bot.config } : null) as KeptChatbot
    },
    take: (channelId, saved) => {
      const bot = demoBot(channelId)
      if (bot) Object.assign(bot, saved ?? seededFor(channelId))
    },
  })

  // Chats shoppers had with a demo store's chatbots on its store, newest first.
  const liveChats = ref<ChatbotConversation[]>([])
  const onStore = (channelId: string) => (chat: ChatbotConversation): boolean => getById(chat.chatbotId)?.channelId === channelId
  const keptChats = keepPerChannel('conversations', 1, isConversationList, {
    read: (channelId) => liveChats.value.filter(onStore(channelId)),
    take: (channelId, saved) => { liveChats.value = [...(saved ?? []), ...liveChats.value.filter((chat) => !onStore(channelId)(chat))] },
  })

  /** The stores whose chatbot is seeded and kept (attachStore): each only once. */
  const attached = new Set<string>()

  /**
   * Gives a store its chatbot as the theme it runs now sets it up, if it has none yet
   * (a store that started blank gets none until it takes a theme), then keeps its
   * settings, whether it is on and its chats: what this browser saved is read, never cleared.
   */
  function attachStore(channel: InstallChannel): void {
    if (attached.has(channel.id)) return
    attached.add(channel.id)
    if (!demoBot(channel.id)) {
      if (!demoSnapshotOf(channel)) return
      const added = demoChatbot(channel)
      chatbots.value.unshift(added)
      registerDemoBot(added)
    }
    keptChatbot.attach(channel.id)
    keptChats.attach(channel.id)
  }
  // The seeded stores' chatbots are already listed first; they are only kept here.
  for (const bot of seededBots) registerDemoBot(bot)
  for (const blueprint of DEMO_STORES) attachStore(blueprint.homeChannel)

  /** Saves a storefront chat as it goes: the same id replaces the earlier copy. */
  function recordConversation(conversation: ChatbotConversation): void {
    const index = liveChats.value.findIndex(c => c.id === conversation.id)
    if (index >= 0) liveChats.value[index] = conversation
    else liveChats.value.unshift(conversation)
  }

  /**
   * Sets a store's chatbot up as the theme it runs now has it, on restore and when
   * a theme is applied (src/stores/useDemoStores.ts). A store that has no chatbot
   * yet gets one, unless it started blank. Its id, whether it is on and its chats
   * stay. Does nothing for a store that cannot take a theme.
   */
  function reseedDemo(channelId: string): void {
    const channel = demoChannelRecord(channelId)
    if (!channel || !canApplyTheme(channel)) return
    // A store not kept yet comes in with what it saved: its chats, and whether its chatbot is on.
    attachStore(channel)
    const existing = demoBot(channelId)
    // A store that started blank has no chatbot until it takes a theme, and none again once it is blank.
    if (!demoSnapshotOf(channel)) {
      if (existing) removeDemoBot(channelId, existing)
      return
    }
    if (!existing) {
      const added = demoChatbot(channel)
      chatbots.value.unshift(added)
      registerDemoBot(added)
      keptChats.attach(channelId)
    }
    const bot = demoBot(channelId)!
    const status = bot.status
    keptChatbot.clear(channelId)
    Object.assign(bot, seededChatbot(channel))
    keptChatbot.attach(channelId)
    keptChatbot.adopt(channelId)
    // Whether it is on is the store's own: kept as a change from the seed, so it is saved.
    bot.status = status
  }

  /**
   * Puts back what applying a theme keeps: the chatbot on and as seeded, and no chats
   * from the storefront (its earlier chats are seeded and stay). Restore only.
   */
  /**
   * Brings a store that can take a theme in with what this browser saved for it,
   * as the app starts (a store made from a theme; src/stores/useDemoStores.ts).
   * Nothing saved is cleared, so a chatbot switched off stays off. Does nothing a
   * second time, or for a store that cannot take a theme.
   */
  function attachDemo(channelId: string): void {
    const channel = demoChannelRecord(channelId)
    if (channel && canApplyTheme(channel)) attachStore(channel)
  }

  function restoreDemoHistory(channelId: string): void {
    const bot = demoBot(channelId)
    if (!bot) return
    keptChatbot.clear(channelId)
    Object.assign(bot, seededFor(channelId))
    keptChatbot.adopt(channelId)
    keptChats.clear(channelId)
    liveChats.value = liveChats.value.filter((chat) => !onStore(channelId)(chat))
    keptChats.adopt(channelId)
  }

  function getById(id: number) {
    return chatbots.value.find(c => c.id === id)
  }
  /** The live (non-archived) chatbot serving a sales channel, if any. */
  function getByChannel(channelId: string) {
    return chatbots.value.find(c => c.channelId === channelId && c.status !== 'Archived')
  }
  function create(store: string, storeUrl: string, channelId: string | null = null): number {
    const id = ++seq
    chatbots.value.unshift({
      id,
      store,
      storeUrl,
      channelId,
      status: 'Inactive',
      conversations: 0,
      createdOn: 'Just now',
      lastModified: 'Just now',
      config: defaultConfig(store, storeUrl),
    })
    return id
  }
  function setStatus(id: number, status: ChatbotStatus) {
    const c = getById(id)
    if (c) c.status = status
  }
  function archive(id: number) {
    const c = getById(id)
    if (c) { c.status = 'Archived'; c.archivedOn = 'Just now' }
  }
  function restore(id: number) {
    const c = getById(id)
    if (c) { c.status = 'Inactive'; c.archivedOn = undefined }
  }

  // Shopping-assistant preview catalog (no product images exist → icon thumbnails)
  const previewProducts = ref<PreviewProduct[]>([
    { id: 1, name: 'Crimson Leather Boots', icon: 'footprints', price: 149.99, salePrice: 129.99 },
    { id: 2, name: 'Cherry Ankle Boots', icon: 'footprints', price: 89.99, salePrice: 74.99 },
    { id: 3, name: 'Ruby Chelsea Boots', icon: 'footprints', price: 120.0, salePrice: 99.0 },
  ])

  /**
   * Recent conversations for a chatbot. Mock: every chatbot with traffic shows the same
   * handful of transcripts, so the page has realistic content without a backend.
   */
  function conversationsFor(chatbotId: number): ChatbotConversation[] {
    const bot = getById(chatbotId)
    if (!bot) return []
    // A demo store's chatbot shows what shoppers just asked on its store, then its own earlier chats.
    const past = pastChats.get(chatbotId)
    if (past) {
      return [
        ...liveChats.value.filter(c => c.chatbotId === chatbotId),
        ...past.map((c, i) => ({ ...c, id: `${chatbotId}-${i + 1}`, chatbotId })),
      ]
    }
    if (bot.conversations === 0) return []
    return CONVERSATION_SEED.map((c, i) => ({ ...c, id: `${chatbotId}-${i + 1}`, chatbotId }))
  }

  return { chatbots, MAX_CHATBOTS, getById, getByChannel, create, setStatus, archive, restore, conversationsFor, previewProducts, recordConversation, attachDemo, reseedDemo, restoreDemoHistory }
})
