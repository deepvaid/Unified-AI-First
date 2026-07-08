import { defineStore } from 'pinia'
import { ref } from 'vue'

export type QuickPromptIntent = 'shopping' | 'track' | 'support' | 'faq'
export interface QuickPrompt {
  id: number
  text: string
  intent: QuickPromptIntent
  enabled: boolean
}

export interface KnowledgeSource {
  id: number
  name: string
  icon: string
  items: number
  meta: string
  status: 'Active' | 'Disabled' | 'Indexing'
  enabled: boolean
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
  greeting: string
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
}

export type ChatbotStatus = 'Active' | 'Inactive' | 'Disabled' | 'Archived'
export interface Chatbot {
  id: number
  store: string
  storeUrl: string
  status: ChatbotStatus
  conversations: number
  createdOn: string
  lastModified: string
  archivedOn?: string
  config: ChatbotConfig
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
      { id: 1, text: 'Track my order', intent: 'track', enabled: true },
      { id: 2, text: 'Shop for items', intent: 'shopping', enabled: true },
      { id: 3, text: 'Email invoice', intent: 'support', enabled: true },
      { id: 4, text: 'FAQs & Help', intent: 'faq', enabled: true },
    ],
    knowledgeSources: [
      { id: 1, name: 'Frequently asked questions', icon: 'globe', items: 12, meta: 'Last synced 16 Jul 2026', status: 'Active', enabled: true },
      { id: 2, name: 'Help Articles', icon: 'file-text', items: 12, meta: 'Uploaded 16 Jul 2026', status: 'Active', enabled: true },
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
      greeting: "I'd love to help you find something! What are you looking for? (e.g. 'red boots size 11')",
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

let seq = 0
function make(
  store: string,
  storeUrl: string,
  status: ChatbotStatus,
  conversations: number,
  createdOn: string,
  lastModified: string,
  extra: Partial<Pick<Chatbot, 'archivedOn'>> & { primaryColor?: string } = {},
): Chatbot {
  const config = defaultConfig(store, storeUrl)
  if (extra.primaryColor) config.primaryColor = extra.primaryColor
  return {
    id: ++seq,
    store,
    storeUrl,
    status,
    conversations,
    createdOn,
    lastModified,
    archivedOn: extra.archivedOn,
    config,
  }
}

export const useChatbotStore = defineStore('chatbot', () => {
  const chatbots = ref<Chatbot[]>([
    make('Johny Style Store', 'https://johny-style.sss.com', 'Active', 1298, 'Jan 1, 2025', 'Nov 11, 2025'),
    make('Tech Gizmo Store', 'https://techgizmo.store.com', 'Active', 1298, 'Jan 1, 2025', 'Nov 11, 2025', { primaryColor: '#6D28D9' }),
    make('Gourmet Delights', 'https://gourmet-delights.com', 'Disabled', 752, 'Feb 15, 2023', 'Dec 31, 2024', { primaryColor: '#DD7A3B' }),
    make('Fashion Hub', 'https://fashionhub.com', 'Inactive', 2014, 'Mar 10, 2023', 'Aug 15, 2024', { primaryColor: '#C0559A' }),
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

  function getById(id: number) {
    return chatbots.value.find(c => c.id === id)
  }
  function create(store: string, storeUrl: string): number {
    const id = ++seq
    chatbots.value.unshift({
      id,
      store,
      storeUrl,
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

  return { chatbots, MAX_CHATBOTS, getById, create, setStatus, archive, restore, previewProducts }
})
