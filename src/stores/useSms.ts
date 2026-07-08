import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TransactionalSms {
  id: number
  name: string
  messagePreview: string
  status: 'Active' | 'Draft' | 'Paused'
  senderId: string
  audience: string
  sentDate: string | null
  delivered: number
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

  return { transactionalSms, smsCampaigns }
})
