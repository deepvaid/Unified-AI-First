import { defineStore } from 'pinia'
import { ref } from 'vue'

export type SmsScheduleType = 'now' | 'scheduled'

export interface TransactionalSms {
  id: number
  name: string
  messagePreview: string
  status: 'Active' | 'Draft' | 'Paused'
  senderId: string
  audience: string
  sentDate: string | null
  delivered: number
  /** Full message body (messagePreview mirrors this, truncated, for table display). */
  message?: string
  optOutConfirmed?: boolean
}

export interface SmsCampaign {
  id: number
  name: string
  messagePreview: string
  audience: string
  status: 'Sent' | 'Scheduled' | 'Sending' | 'Draft'
  sentDate: string | null
  sent: number
  delivered: number
  clicks: number
  /** Full wizard fields — present once a campaign has been through the SMS composer. */
  message?: string
  fromNumber?: string
  optOutConfirmed?: boolean
  scheduleType?: SmsScheduleType
  scheduleDate?: string | null
  scheduleTime?: string | null
}

export interface TransactionalEmail {
  id: number
  name: string
  subject: string
  preheader: string
  fromName: string
  fromEmail: string
  replyTo: string
  language: string
  contentId: number | null
  showPreviewLink: boolean
  brand: string
  tag: string
  address: string
  sends: number
  updatedAt: string
}

export const useSmsStore = defineStore('sms', () => {
  const transactionalSms = ref<TransactionalSms[]>([
    { id: 1, name: 'Order Confirmation', messagePreview: 'Your order {{order_no}} is confirmed! 🎉 Track it here: {{link}}', status: 'Active', senderId: 'MAROPOST', audience: 'SMS Opted-In', sentDate: '2026-07-07', delivered: 4821 },
    { id: 2, name: 'Shipping Update', messagePreview: 'Good news! Your order has shipped 📦 Follow along: {{link}}', status: 'Active', senderId: 'MAROPOST', audience: 'SMS Opted-In', sentDate: '2026-07-07', delivered: 3960 },
    { id: 3, name: 'Delivery Notification', messagePreview: 'Your package was delivered. Enjoy! Questions? Reply here.', status: 'Active', senderId: 'MAROPOST', audience: 'SMS Opted-In', sentDate: '2026-07-06', delivered: 3510 },
    { id: 4, name: 'Verification Code (OTP)', messagePreview: 'Your verification code is {{code}}. It expires in 10 minutes.', status: 'Active', senderId: 'VERIFY', audience: 'All contacts', sentDate: '2026-07-08', delivered: 12840 },
    { id: 5, name: 'Password Reset', messagePreview: 'Reset your password using this secure link: {{link}}', status: 'Active', senderId: 'MAROPOST', audience: 'All contacts', sentDate: '2026-07-05', delivered: 890 },
    { id: 6, name: 'Abandoned Cart Reminder', messagePreview: 'You left something behind! Complete your checkout: {{link}}', status: 'Draft', senderId: 'MAROPOST', audience: 'SMS Marketing List', sentDate: null, delivered: 0 },
    { id: 7, name: 'Appointment Reminder', messagePreview: 'Reminder: your appointment is tomorrow at {{time}}. Reply C to confirm.', status: 'Paused', senderId: 'MAROPOST', audience: 'SMS Opted-In', sentDate: '2026-06-28', delivered: 612 },
  ])

  const smsCampaigns = ref<SmsCampaign[]>([
    { id: 1, name: 'Flash Sale — 24 Hours Only', messagePreview: '⚡ 24hr Flash Sale! 30% off everything. Shop now: {{link}} Reply STOP to opt out', audience: 'SMS Marketing List', status: 'Sent', sentDate: '2026-07-04', sent: 7892, delivered: 7810, clicks: 1543 },
    { id: 2, name: 'Black Friday Early Access', messagePreview: '🖤 VIP early access starts NOW. Beat the crowds: {{link}}', audience: 'SMS Opted-In', status: 'Sent', sentDate: '2026-06-27', sent: 7640, delivered: 7588, clicks: 2210 },
    { id: 3, name: 'New Arrivals Drop', messagePreview: 'Just dropped 👀 New arrivals are live. Be first: {{link}}', audience: 'SMS Marketing List', status: 'Scheduled', sentDate: '2026-07-12', sent: 0, delivered: 0, clicks: 0 },
    { id: 4, name: 'Weekend Promo', messagePreview: 'Weekend treat: 20% off with code SMS20. Ends Sunday: {{link}}', audience: 'SMS Opted-In', status: 'Sent', sentDate: '2026-06-21', sent: 7420, delivered: 7361, clicks: 1188 },
    { id: 5, name: 'Back in Stock Alert', messagePreview: "It's back! The item you wanted is in stock again: {{link}}", audience: 'SMS Marketing List', status: 'Sending', sentDate: '2026-07-08', sent: 3120, delivered: 3050, clicks: 402 },
    { id: 6, name: 'Loyalty VIP Offer', messagePreview: 'A little thank-you 💝 Members get an extra 15% this week: {{link}}', audience: 'SMS Opted-In', status: 'Draft', sentDate: null, sent: 0, delivered: 0, clicks: 0 },
  ])

  const transactionalEmails = ref<TransactionalEmail[]>([
    { id: 1, name: 'Order Confirmation', subject: 'Your order is confirmed 🎉', preheader: 'Thanks for shopping with us — here are your order details.', fromName: 'Maropost Store', fromEmail: 'hello@maropoststore.com', replyTo: 'support@maropoststore.com', language: 'English (US)', contentId: 4, showPreviewLink: true, brand: 'Maropost', tag: 'Transactional', address: '100 King St, Sydney NSW 2000', sends: 12840, updatedAt: '2026-07-08' },
    { id: 2, name: 'Shipping Update', subject: 'Your order has shipped 📦', preheader: 'Track your package every step of the way.', fromName: 'Maropost Store', fromEmail: 'hello@maropoststore.com', replyTo: 'support@maropoststore.com', language: 'English (US)', contentId: 4, showPreviewLink: true, brand: 'Maropost', tag: 'Transactional', address: '100 King St, Sydney NSW 2000', sends: 11920, updatedAt: '2026-07-08' },
    { id: 3, name: 'Password Reset', subject: 'Reset your password', preheader: 'Use the secure link below to reset your password.', fromName: 'Maropost Store', fromEmail: 'security@maropoststore.com', replyTo: 'support@maropoststore.com', language: 'English (US)', contentId: null, showPreviewLink: false, brand: 'Maropost', tag: 'Transactional', address: '100 King St, Sydney NSW 2000', sends: 890, updatedAt: '2026-07-05' },
    { id: 4, name: 'Welcome Email', subject: 'Welcome to Maropost Store!', preheader: 'Glad to have you — here is what to expect.', fromName: 'Maropost Store', fromEmail: 'hello@maropoststore.com', replyTo: 'support@maropoststore.com', language: 'English (US)', contentId: 2, showPreviewLink: true, brand: 'Maropost', tag: 'Onboarding', address: '100 King St, Sydney NSW 2000', sends: 4231, updatedAt: '2026-07-01' },
  ])

  function nextId<T extends { id: number }>(list: T[]): number {
    return Math.max(0, ...list.map(i => i.id)) + 1
  }

  // ── SMS campaigns ────────────────────────────────────────────────────────────

  function createSmsCampaign(input: Omit<SmsCampaign, 'id' | 'status' | 'sent' | 'delivered' | 'clicks'>, finalize = false): number {
    const id = nextId(smsCampaigns.value)
    smsCampaigns.value.unshift({
      ...input,
      id,
      status: finalize ? (input.scheduleType === 'now' ? 'Sending' : 'Scheduled') : 'Draft',
      sent: 0,
      delivered: 0,
      clicks: 0,
    })
    return id
  }

  function updateSmsCampaign(id: number, input: Omit<SmsCampaign, 'id' | 'status' | 'sent' | 'delivered' | 'clicks'>, finalize = false) {
    const campaign = smsCampaigns.value.find(c => c.id === id)
    if (!campaign) return
    Object.assign(campaign, input)
    if (finalize) campaign.status = input.scheduleType === 'now' ? 'Sending' : 'Scheduled'
  }

  function getSmsCampaign(id: number): SmsCampaign | undefined {
    return smsCampaigns.value.find(c => c.id === id)
  }

  function duplicateSmsCampaign(id: number) {
    const original = smsCampaigns.value.find(c => c.id === id)
    if (!original) return
    const index = smsCampaigns.value.findIndex(c => c.id === id)
    smsCampaigns.value.splice(index + 1, 0, {
      ...original,
      id: nextId(smsCampaigns.value),
      name: `${original.name} (Copy)`,
      status: 'Draft',
      sentDate: null,
      sent: 0,
      delivered: 0,
      clicks: 0,
    })
  }

  function deleteSmsCampaigns(ids: number[]) {
    smsCampaigns.value = smsCampaigns.value.filter(c => !ids.includes(c.id))
  }

  // ── Transactional SMS ────────────────────────────────────────────────────────

  function createTransactionalSms(input: Omit<TransactionalSms, 'id' | 'status' | 'sentDate' | 'delivered'>): number {
    const id = nextId(transactionalSms.value)
    transactionalSms.value.unshift({
      ...input,
      id,
      status: 'Active',
      sentDate: null,
      delivered: 0,
    })
    return id
  }

  function updateTransactionalSms(id: number, input: Omit<TransactionalSms, 'id' | 'status' | 'sentDate' | 'delivered'>) {
    const flow = transactionalSms.value.find(f => f.id === id)
    if (!flow) return
    Object.assign(flow, input)
  }

  function getTransactionalSms(id: number): TransactionalSms | undefined {
    return transactionalSms.value.find(f => f.id === id)
  }

  function duplicateTransactionalSms(id: number) {
    const original = transactionalSms.value.find(f => f.id === id)
    if (!original) return
    const index = transactionalSms.value.findIndex(f => f.id === id)
    transactionalSms.value.splice(index + 1, 0, {
      ...original,
      id: nextId(transactionalSms.value),
      name: `${original.name} (Copy)`,
      sentDate: null,
      delivered: 0,
    })
  }

  function deleteTransactionalSms(ids: number[]) {
    transactionalSms.value = transactionalSms.value.filter(f => !ids.includes(f.id))
  }

  // ── Transactional email ──────────────────────────────────────────────────────

  function createTransactionalEmail(input: Omit<TransactionalEmail, 'id' | 'sends' | 'updatedAt'>): number {
    const id = nextId(transactionalEmails.value)
    transactionalEmails.value.unshift({
      ...input,
      id,
      sends: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    })
    return id
  }

  function updateTransactionalEmail(id: number, input: Omit<TransactionalEmail, 'id' | 'sends' | 'updatedAt'>) {
    const flow = transactionalEmails.value.find(f => f.id === id)
    if (!flow) return
    Object.assign(flow, input)
    flow.updatedAt = new Date().toISOString().slice(0, 10)
  }

  function getTransactionalEmail(id: number): TransactionalEmail | undefined {
    return transactionalEmails.value.find(f => f.id === id)
  }

  function duplicateTransactionalEmail(id: number) {
    const original = transactionalEmails.value.find(f => f.id === id)
    if (!original) return
    const index = transactionalEmails.value.findIndex(f => f.id === id)
    transactionalEmails.value.splice(index + 1, 0, {
      ...original,
      id: nextId(transactionalEmails.value),
      name: `${original.name} (Copy)`,
      sends: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    })
  }

  function deleteTransactionalEmails(ids: number[]) {
    transactionalEmails.value = transactionalEmails.value.filter(f => !ids.includes(f.id))
  }

  return {
    transactionalSms, smsCampaigns, transactionalEmails,
    createSmsCampaign, updateSmsCampaign, getSmsCampaign, duplicateSmsCampaign, deleteSmsCampaigns,
    createTransactionalSms, updateTransactionalSms, getTransactionalSms, duplicateTransactionalSms, deleteTransactionalSms,
    createTransactionalEmail, updateTransactionalEmail, getTransactionalEmail, duplicateTransactionalEmail, deleteTransactionalEmails,
  }
})
