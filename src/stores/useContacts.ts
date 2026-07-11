import { defineStore } from 'pinia'
import { ref } from 'vue'

// ── Seeded random for deterministic mock data ──────────────────────────────────
function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

function pick<T>(arr: T[], rng: () => number): T {
  const ix = Math.floor(rng() * arr.length)
  return arr[ix] as T
}
function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5)
  return shuffled.slice(0, n)
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ContactDetail {
  uid: string
  customFields: { label: string; value: string }[]
  lists: { name: string; type: 'email' | 'sms'; subscribed: boolean }[]
  brands: string[]
  erfm: { rfmGroup: string; engagementLevel: string }
  keywords: string[]
  doNotEmail: boolean
  doNotSms: boolean
  engagement: {
    email: { sends: number; opens: number; clicks: number; bounces: number; openRate: string; clickRate: string; bounceRate: string }
    tickets: { total: number; open: number; solved: number; onHold: number }
  }
  responseRate: { email: string; sms: string }
  idealResponseTime: string
  lifetimeValue: number
  avgLifetimeValue: number
  avgOrders: number
  campaigns: { id: number; name: string; type: 'email' | 'sms'; sentDate: string; statuses: string[] }[]
  orders: { id: string; date: string; total: number; items: number; status: string; paymentStatus: string; fulfillmentStatus: string }[]
  tickets: { id: number; subject: string; status: string; priority: string; date: string; assignee: string }[]
  abandonedCarts: { id: string; date: string; items: { name: string; qty: number; price: number }[]; total: number; recovered: boolean }[]
  timeline: { id: number; type: string; icon: string; color: string; title: string; date: string; statuses: string[] }[]
}

// ── Contact record ──────────────────────────────────────────────────────────────
export interface Contact {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string | null
  location: string
  status: string
  score: number
  tags: string[]
  revenue: string
  orders: number
  lastActive: string
  createdAt: string
  avatarUrl: string
}

// ── Segment condition builder ─────────────────────────────────────────────────
export type SegmentMatchLogic = 'all' | 'any' | 'active'

export interface SegmentCriterion {
  id: number
  category: string
  field: string
  operator: string
  value: string
}

export interface SegmentRule {
  id: number
  matchAll: boolean
  criteria: SegmentCriterion[]
}

export interface Segment {
  id: number
  name: string
  description: string
  count: number
  type: string
  status: string
  lastCalc: string
  matchLogic?: SegmentMatchLogic
  rules?: SegmentRule[]
}

const firstNames = ['James', 'Sofia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte', 'Aiden', 'Amelia', 'Jackson', 'Harper', 'Sebastian', 'Evelyn', 'Mateo', 'Abigail', 'Jack', 'Emily', 'Owen', 'Ella', 'Theodore', 'Scarlett', 'Henry', 'Grace', 'Alexander', 'Chloe', 'Benjamin', 'Zoe', 'William', 'Penelope', 'Daniel', 'Lily', 'Michael', 'Victoria', 'David', 'Aurora', 'Joseph', 'Nora', 'Samuel', 'Hannah', 'Carter', 'Stella', 'Ryan', 'Leah']
const lastNames = ['Anderson', 'Thompson', 'Martinez', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers']
const companies = ['Acme Corp', 'TechFlow Inc', 'BlueSky Ventures', 'Meridian Solutions', 'Apex Digital', 'Horizon Media', 'Stellar Commerce', 'Orbit Labs', 'Nova Group', 'Peak Partners', 'Zenith Corp', 'Summit Digital', 'Atlas Ventures', 'Cascade Media', 'Ridge Analytics', null, null, null, null, null]
const cities = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Chicago, IL', 'Seattle, WA', 'Miami, FL', 'Boston, MA', 'Denver, CO', 'Los Angeles, CA', 'Phoenix, AZ', 'Portland, OR', 'Atlanta, GA', 'Nashville, TN', 'Charlotte, NC', 'Minneapolis, MN']
const statuses = ['Subscribed', 'Subscribed', 'Subscribed', 'Unsubscribed', 'Bounced', 'Spam', 'Subscribed', 'Subscribed', 'Unsubscribed', 'Subscribed']
const tags = [['VIP', 'Loyal'], ['Newsletter'], ['Sale Buyer'], ['Referral'], ['High Value'], [], ['Re-engagement'], ['VIP'], ['Churned'], ['New']]

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref<Contact[]>(firstNames.map((fName, i) => {
    const lName = lastNames[i % lastNames.length]!
    const status = statuses[i % statuses.length]!
    const company = companies[i % companies.length] ?? null
    return {
      id: i + 1,
      firstName: fName,
      lastName: lName,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@${['gmail.com', 'outlook.com', 'company.io', 'example.com', 'mail.com'][i % 5]}`,
      phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company,
      location: cities[i % cities.length]!,
      status,
      score: Math.floor(Math.random() * 100),
      tags: tags[i % tags.length]!,
      revenue: status === 'Subscribed' ? (Math.random() * 2000).toFixed(2) : '0.00',
      orders: status === 'Subscribed' ? Math.floor(Math.random() * 15) : 0,
      lastActive: new Date(Date.now() - (Math.random() * 7776000000)).toISOString().split('T')[0]!,
      createdAt: new Date(Date.now() - (Math.random() * 31536000000)).toISOString().split('T')[0]!,
      avatarUrl: `https://i.pravatar.cc/96?u=contact-${i + 1}`,
    }
  }))

  const segments = ref<Segment[]>([
    { id: 1, name: 'High Value Customers', description: 'Contacts with LTV > $500', count: 1842, type: 'Dynamic', status: 'Active', lastCalc: '2026-03-07' },
    { id: 2, name: 'Lapsed 90 Days', description: 'No activity in 90+ days', count: 4201, type: 'Dynamic', status: 'Active', lastCalc: '2026-03-07' },
    { id: 3, name: 'Newsletter Subscribers', description: 'Opted in to weekly newsletter', count: 18432, type: 'Static', status: 'Active', lastCalc: '2026-03-06' },
    { id: 4, name: 'Abandoned Cart - 7 Days', description: 'Cart abandoned in last 7 days', count: 892, type: 'Dynamic', status: 'Active', lastCalc: '2026-03-07' },
    { id: 5, name: 'VIP Members', description: 'Tagged as VIP or Loyalty tier', count: 312, type: 'Static', status: 'Active', lastCalc: '2026-03-05' },
    { id: 6, name: 'New Signups - 30 Days', description: 'Joined in the last 30 days', count: 2341, type: 'Dynamic', status: 'Active', lastCalc: '2026-03-07' },
    { id: 7, name: 'Repeat Buyers', description: '2+ orders in any period', count: 5621, type: 'Dynamic', status: 'Active', lastCalc: '2026-03-06' },
    { id: 8, name: 'SMS Opted-In', description: 'Consented to SMS marketing', count: 7892, type: 'Static', status: 'Active', lastCalc: '2026-03-04' },
    { id: 9, name: 'Bounced Emails', description: 'Hard or soft email bounces', count: 1243, type: 'Dynamic', status: 'Active', lastCalc: '2026-03-07' },
    { id: 10, name: 'Re-Engagement Targets', description: '120+ days inactive, still subscribed', count: 3102, type: 'Dynamic', status: 'Paused', lastCalc: '2026-02-28' },
    { id: 11, name: 'Flash Sale Buyers', description: 'Purchased during last flash sale', count: 4892, type: 'Static', status: 'Active', lastCalc: '2026-03-01' },
    { id: 12, name: 'Referral Program', description: 'Joined via referral link', count: 923, type: 'Static', status: 'Active', lastCalc: '2026-03-05' },
  ])

  const lists = ref([
    { id: 1, name: 'Master Subscriber List', subscribers: 45231, bounced: 1243, unsubscribed: 2891, type: 'General', created: '2023-01-15' },
    { id: 2, name: 'Newsletter Opt-in', subscribers: 18432, bounced: 342, unsubscribed: 891, type: 'Newsletter', created: '2023-02-01' },
    { id: 3, name: 'VIP Customer Circle', subscribers: 312, bounced: 4, unsubscribed: 12, type: 'Premium', created: '2023-06-15' },
    { id: 4, name: 'Product Announcement', subscribers: 32891, bounced: 892, unsubscribed: 1432, type: 'Transactional', created: '2023-03-10' },
    { id: 5, name: 'Black Friday 2025', subscribers: 28412, bounced: 412, unsubscribed: 2341, type: 'Campaign', created: '2025-10-01' },
    { id: 6, name: 'Abandoned Cart Recovery', subscribers: 4231, bounced: 89, unsubscribed: 341, type: 'Automation', created: '2023-08-20' },
    { id: 7, name: 'Re-engagement 2024', subscribers: 8912, bounced: 1232, unsubscribed: 3421, type: 'Campaign', created: '2024-01-10' },
    { id: 8, name: 'SMS Marketing List', subscribers: 7892, bounced: 34, unsubscribed: 123, type: 'SMS', created: '2024-03-01' },
  ])

  // ── Getters & Detail Generator ───────────────────────────────────────────────
  function getContactById(id: number) {
    return contacts.value.find(c => c.id === id)
  }

  const _detailCache = new Map<number, ContactDetail>()

  function getContactDetail(id: number): ContactDetail | undefined {
    const contact = getContactById(id)
    if (!contact) return undefined
    if (_detailCache.has(id)) return _detailCache.get(id)!

    const rng = seededRandom(id * 7919)

    // Custom fields
    const customFields = [
      { label: 'Source', value: pick(['Organic', 'Google Ads', 'Facebook', 'Referral', 'Direct', 'Email'], rng) },
      { label: 'Gender', value: pick(['Male', 'Female', 'Not specified'], rng) },
      { label: 'Age Group', value: pick(['18-24', '25-34', '35-44', '45-54', '55+'], rng) },
    ]

    // Lists
    const emailLists = pickN(lists.value, Math.floor(rng() * 3) + 1, rng).map(l => ({
      name: l.name, type: 'email' as const, subscribed: contact.status === 'Subscribed'
    }))
    const smsLists = rng() > 0.5 ? [{ name: 'SMS Marketing List', type: 'sms' as const, subscribed: rng() > 0.3 }] : []
    const contactLists = [...emailLists, ...smsLists]

    // Brands
    const brandPool = ['Maropost', 'BlueSky Brand', 'Apex Store', 'Horizon Shop']
    const brands = rng() > 0.4 ? pickN(brandPool, Math.floor(rng() * 2) + 1, rng) : []

    // eRFM
    const rfmGroups = ['Champions', 'Loyal', 'Potential Loyalist', 'At Risk', 'Hibernating', 'Inactive']
    const engageLevels = ['Highly Engaged', 'Engaged', 'Moderately Engaged', 'Not Engaged']
    const erfm = { rfmGroup: pick(rfmGroups, rng), engagementLevel: pick(engageLevels, rng) }

    // Keywords
    const kwPool = ['discount', 'free shipping', 'new arrivals', 'sale', 'exclusive', 'limited', 'clearance', 'holiday']
    const keywords = rng() > 0.4 ? pickN(kwPool, Math.floor(rng() * 3) + 1, rng) : []

    // Engagement
    const sends = Math.floor(rng() * 400) + 50
    const opens = Math.floor(sends * (rng() * 0.4 + 0.05))
    const clicks = Math.floor(opens * (rng() * 0.3))
    const bounces = Math.floor(sends * rng() * 0.05)
    const ticketTotal = Math.floor(rng() * 12)
    const ticketOpen = Math.floor(rng() * Math.min(ticketTotal, 4))
    const ticketSolved = Math.floor((ticketTotal - ticketOpen) * 0.7)
    const ticketOnHold = ticketTotal - ticketOpen - ticketSolved

    const engagement = {
      email: {
        sends, opens, clicks, bounces,
        openRate: ((opens / sends) * 100).toFixed(1) + '%',
        clickRate: ((clicks / sends) * 100).toFixed(1) + '%',
        bounceRate: ((bounces / sends) * 100).toFixed(1) + '%',
      },
      tickets: { total: ticketTotal, open: ticketOpen, solved: ticketSolved, onHold: ticketOnHold },
    }

    const responseRate = {
      email: (rng() * 0.5 + 0.01).toFixed(2) + '%',
      sms: (rng() * 0.1).toFixed(1) + '%',
    }

    const hours = Math.floor(rng() * 12) + 1
    const mins = Math.floor(rng() * 60)
    const idealResponseTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${rng() > 0.5 ? 'AM' : 'PM'} EDT`

    const lifetimeValue = parseFloat(contact.revenue) || Math.floor(rng() * 3000)
    const avgLifetimeValue = 310
    const avgOrders = 8

    // Campaigns
    const campaignNames = [
      'Spring Sale Announcement', 'Weekly Newsletter', 'Abandoned Cart Reminder',
      'VIP Early Access', 'Product Launch', 'Holiday Special', 'Re-engagement',
      'Loyalty Reward', 'Flash Sale Alert', 'Welcome Series', 'Birthday Offer',
      'Back in Stock', 'End of Season Sale', 'Referral Program'
    ]
    const campaignCount = Math.floor(rng() * 8) + 3
    const campaignStatuses = ['Delivered', 'Opened', 'Clicked', 'Re-sent', 'Bounced']
    const campaigns = Array.from({ length: campaignCount }, (_, i) => {
      const daysAgo = Math.floor(rng() * 180) + 1
      const date = new Date(Date.now() - daysAgo * 86400000)
      const numStatuses = Math.floor(rng() * 3) + 1
      return {
        id: i + 1,
        name: pick(campaignNames, rng),
        type: rng() > 0.15 ? 'email' as const : 'sms' as const,
        sentDate: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        statuses: pickN(campaignStatuses, numStatuses, rng),
      }
    }).sort((a, b) => b.id - a.id)

    // Orders
    const orderStatuses = ['Completed', 'Processing', 'Pending', 'Cancelled']
    const payStatuses = ['Paid', 'Pending', 'Refunded']
    const fulfillStatuses = ['Fulfilled', 'Unfulfilled', 'Partial']
    const orderCount = contact.orders || Math.floor(rng() * 5)
    const orders = Array.from({ length: orderCount }, (_, i) => {
      const daysAgo = Math.floor(rng() * 365) + 1
      return {
        id: `#MP-${String(10000 + id * 100 + i).slice(-5)}`,
        date: new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        total: parseFloat((rng() * 500 + 15).toFixed(2)),
        items: Math.floor(rng() * 5) + 1,
        status: pick(orderStatuses, rng),
        paymentStatus: pick(payStatuses, rng),
        fulfillmentStatus: pick(fulfillStatuses, rng),
      }
    })

    // Tickets
    const ticketSubjects = ['Order not received', 'Wrong item shipped', 'Refund request', 'Account access issue', 'Billing question', 'Product inquiry', 'Shipping delay', 'Return label needed']
    const ticketStatPick = ['Open', 'Solved', 'On Hold', 'Pending']
    const ticketPriorities = ['High', 'Medium', 'Low']
    const assignees = ['Sarah M.', 'James K.', 'Emily R.', 'David L.', 'Unassigned']
    const tickets = Array.from({ length: Math.min(ticketTotal, 5) }, (_, i) => {
      const daysAgo = Math.floor(rng() * 120) + 1
      return {
        id: 4000 + id * 10 + i,
        subject: pick(ticketSubjects, rng),
        status: pick(ticketStatPick, rng),
        priority: pick(ticketPriorities, rng),
        date: new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        assignee: pick(assignees, rng),
      }
    })

    // Abandoned carts
    const productNames = ['Wireless Headphones', 'Running Shoes', 'Organic Coffee Beans', 'Yoga Mat', 'Laptop Stand', 'Water Bottle', 'Backpack', 'Sunglasses']
    const cartCount = Math.floor(rng() * 3)
    const abandonedCarts = Array.from({ length: cartCount }, (_, i) => {
      const daysAgo = Math.floor(rng() * 60) + 1
      const numItems = Math.floor(rng() * 3) + 1
      const items = Array.from({ length: numItems }, () => ({
        name: pick(productNames, rng),
        qty: Math.floor(rng() * 3) + 1,
        price: parseFloat((rng() * 100 + 10).toFixed(2)),
      }))
      return {
        id: `CART-${String(5000 + id * 10 + i).slice(-5)}`,
        date: new Date(Date.now() - daysAgo * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
        items,
        total: parseFloat(items.reduce((s, it) => s + it.price * it.qty, 0).toFixed(2)),
        recovered: rng() > 0.7,
      }
    })

    // Timeline
    const timelineTypes = [
      { type: 'email_sent', icon: 'mail', color: 'primary' },
      { type: 'email_opened', icon: 'mail-open', color: 'success' },
      { type: 'order_placed', icon: 'shopping-cart', color: 'warning' },
      { type: 'sms_sent', icon: 'message-circle', color: 'info' },
      { type: 'ticket_created', icon: 'headset', color: 'error' },
      { type: 'tag_added', icon: 'tag', color: 'secondary' },
    ]
    const timelineCount = Math.floor(rng() * 12) + 8
    const timeline = Array.from({ length: timelineCount }, (_, i) => {
      const tt = pick(timelineTypes, rng)
      const daysAgo = Math.floor(rng() * 180) + 1
      const d = new Date(Date.now() - daysAgo * 86400000)
      const titles: Record<string, string[]> = {
        email_sent: campaignNames,
        email_opened: campaignNames,
        order_placed: ['Order placed', 'New purchase'],
        sms_sent: ['SMS Campaign: Flash Sale', 'SMS: Order Update', 'SMS: Welcome'],
        ticket_created: ticketSubjects,
        tag_added: ['Tag "VIP" added', 'Tag "Loyal" added', 'Tag "Re-engagement" added'],
      }
      const actStatuses: Record<string, string[][]> = {
        email_sent: [['Delivered'], ['Delivered', 'Opened'], ['Delivered', 'Opened', 'Clicked']],
        email_opened: [['Opened'], ['Opened', 'Re-sent']],
        order_placed: [['Completed'], ['Processing'], ['Pending']],
        sms_sent: [['Delivered'], ['Delivered', 'Clicked']],
        ticket_created: [['Open'], ['Solved']],
        tag_added: [[]],
      }
      return {
        id: i + 1,
        type: tt.type,
        icon: tt.icon,
        color: tt.color,
        title: pick(titles[tt.type] ?? [''], rng),
        date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        statuses: pick(actStatuses[tt.type] ?? [[]], rng),
      }
    }).sort((a, b) => b.id - a.id)

    // UID
    const uid = `01J${Array.from({ length: 24 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(rng() * 36)]).join('')}`

    const detail: ContactDetail = {
      uid,
      customFields,
      lists: contactLists,
      brands,
      erfm,
      keywords,
      doNotEmail: false,
      doNotSms: false,
      engagement,
      responseRate,
      idealResponseTime,
      lifetimeValue,
      avgLifetimeValue,
      avgOrders,
      campaigns,
      orders,
      tickets,
      abandonedCarts,
      timeline,
    }

    _detailCache.set(id, detail)
    return detail
  }

  // ── Contact mutations ────────────────────────────────────────────────────────
  function addContact(input: {
    firstName: string
    lastName?: string
    email: string
    phone?: string
    company?: string
    tags?: string[]
    status?: string
  }): Contact {
    const id = contacts.value.reduce((max, c) => Math.max(max, c.id), 0) + 1
    const today = new Date().toISOString().slice(0, 10)
    const contact: Contact = {
      id,
      firstName: input.firstName,
      lastName: input.lastName ?? '',
      email: input.email,
      phone: input.phone ?? '',
      company: input.company || null,
      location: '—',
      status: input.status ?? 'Subscribed',
      score: 0,
      tags: input.tags ?? [],
      revenue: '0.00',
      orders: 0,
      lastActive: today,
      createdAt: today,
      avatarUrl: `https://i.pravatar.cc/96?u=contact-${id}`,
    }
    contacts.value.unshift(contact)
    return contact
  }

  function updateContact(id: number, patch: Partial<Omit<Contact, 'id'>>): void {
    const contact = contacts.value.find(c => c.id === id)
    if (contact) Object.assign(contact, patch)
  }

  function deleteContact(id: number): void {
    const ix = contacts.value.findIndex(c => c.id === id)
    if (ix !== -1) contacts.value.splice(ix, 1)
  }

  function deleteContacts(ids: number[]): void {
    contacts.value = contacts.value.filter(c => !ids.includes(c.id))
  }

  function addContactTags(id: number, newTags: string[]): void {
    const contact = contacts.value.find(c => c.id === id)
    if (!contact) return
    for (const tag of newTags) {
      if (tag && !contact.tags.includes(tag)) contact.tags.push(tag)
    }
  }

  // ── Segment mutations ────────────────────────────────────────────────────────
  function addSegment(input: Omit<Segment, 'id' | 'lastCalc'>): Segment {
    const id = segments.value.reduce((max, s) => Math.max(max, s.id), 0) + 1
    const segment: Segment = { ...input, id, lastCalc: new Date().toISOString().slice(0, 10) }
    segments.value.unshift(segment)
    return segment
  }

  function updateSegment(id: number, patch: Partial<Omit<Segment, 'id'>>): void {
    const segment = segments.value.find(s => s.id === id)
    if (segment) Object.assign(segment, patch)
  }

  function deleteSegment(id: number): void {
    const ix = segments.value.findIndex(s => s.id === id)
    if (ix !== -1) segments.value.splice(ix, 1)
  }

  function recalcSegment(id: number): void {
    updateSegment(id, { lastCalc: new Date().toISOString().slice(0, 10) })
  }

  return {
    contacts,
    segments,
    lists,
    getContactById,
    getContactDetail,
    addContact,
    updateContact,
    deleteContact,
    deleteContacts,
    addContactTags,
    addSegment,
    updateSegment,
    deleteSegment,
    recalcSegment,
  }
})
