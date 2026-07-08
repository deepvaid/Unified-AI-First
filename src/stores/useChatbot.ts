import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface QuickPrompt {
  id: number
  text: string
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

export const useChatbotStore = defineStore('chatbot', () => {
  // General
  const storeName = ref('Johny Style Store')
  const address1 = ref('')
  const address2 = ref('')
  const instagram = ref('')
  const storeType = ref<string | null>(null)
  const storeUrl = ref('')

  // Appearance
  const brandName = ref('Johny Style Store')
  const brandSubtitle = ref('24×7 Support Chat')
  const logoName = ref<string | null>(null)
  const primaryColor = ref('#2563EB')
  const position = ref<'left' | 'right'>('left')
  const welcomeMessage = ref('Hello! How can I help you today?')

  // Business hours
  const businessHours = ref<BusinessHour[]>([
    { day: 'Monday', enabled: true, open: '09:00', close: '17:00' },
    { day: 'Tuesday', enabled: true, open: '09:00', close: '17:00' },
    { day: 'Wednesday', enabled: true, open: '09:00', close: '17:00' },
    { day: 'Thursday', enabled: true, open: '09:00', close: '17:00' },
    { day: 'Friday', enabled: true, open: '09:00', close: '17:00' },
    { day: 'Saturday', enabled: false, open: '10:00', close: '14:00' },
    { day: 'Sunday', enabled: false, open: '10:00', close: '14:00' },
  ])

  // Quick prompts
  const quickPrompts = ref<QuickPrompt[]>([
    { id: 1, text: 'Track my order', enabled: true },
    { id: 2, text: 'Return or refund', enabled: true },
    { id: 3, text: 'Change delivery address', enabled: true },
    { id: 4, text: 'View shipping options', enabled: true },
  ])

  // Knowledge base
  const knowledgeSources = ref<KnowledgeSource[]>([
    { id: 1, name: 'Frequently asked questions', icon: 'globe', items: 12, meta: 'Last synced 16 Jul 2026', status: 'Active', enabled: true },
    { id: 2, name: 'Help Articles', icon: 'file-text', items: 12, meta: 'Uploaded 16 Jul 2026', status: 'Active', enabled: true },
    { id: 3, name: 'Complete Website (34 pages)', icon: 'globe', items: 10, meta: 'Last updated 15 Jul 2026', status: 'Disabled', enabled: false },
    { id: 4, name: 'Support Docs', icon: 'file-text', items: 8, meta: 'Uploaded 14 Jul 2026', status: 'Indexing', enabled: true },
  ])

  // Pre-chat form
  const preChatEnabled = ref(true)
  const skipForLoggedIn = ref(true)
  const preChatFields = ref<PreChatField[]>([
    { id: 1, label: 'First name', type: 'Text', placeholder: 'Enter your first name', required: true },
    { id: 2, label: 'Last name', type: 'Text', placeholder: 'Enter your last name', required: true },
    { id: 3, label: 'Email', type: 'Email', placeholder: 'Enter your email address', required: true },
    { id: 4, label: 'How can we help?', type: 'Text Area', placeholder: 'Describe your question or issue', required: true },
  ])

  return {
    storeName, address1, address2, instagram, storeType, storeUrl,
    brandName, brandSubtitle, logoName, primaryColor, position, welcomeMessage,
    businessHours, quickPrompts, knowledgeSources,
    preChatEnabled, skipForLoggedIn, preChatFields,
  }
})
