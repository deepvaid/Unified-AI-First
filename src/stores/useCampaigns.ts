import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlowNode, JourneySettings } from '@/stores/journeyFlowData'
import { cloneFlowNodes, instantiateTemplate, seedJourneyFlows, templateById } from '@/stores/journeyFlowData'
import { useOnboardingStore } from '@/stores/useOnboarding'

export interface CampaignMetrics {
  sent: number
  opens: number
  clicks: number
  unsubscribes: number
  revenue: number
}

export interface CampaignOptimizations {
  sto: boolean
  tzo: boolean
  cto: boolean
  preSend: boolean
}

export type CampaignScheduleType = 'now' | 'scheduled'

/** UAT send methods. STO/CTO are entitlement-gated in production but modeled fully here. */
export type CampaignScheduleMethod = 'send_now' | 'priority' | 'tzo' | 'sto' | 'cto' | 'recurring'

export interface CampaignRecurringSchedule {
  mode: 'day-of-week' | 'repeat-every'
  /** Weekday codes for 'day-of-week' mode, e.g. ['Mon', 'Thu']. */
  days: string[]
  /** Interval unit for 'repeat-every' mode. */
  interval: 'Day' | 'Week' | 'Month' | 'Year'
  time: string
}

export type AbWinningCriteria =
  | 'top_choices'
  | 'open_rate'
  | 'click_rate'
  | 'manual'
  | 'click_to_open'
  | 'conversion_rate'

/** One variant of an A/B split test. Every field is required before send (UAT rule). */
export interface AbSplitGroup {
  id: number
  name: string
  contentId: number | null
  subject: string
  preheader: string
  fromName: string
  sizePercent: number | null
  date: string
  time: string
}

/** Full wizard configuration for an email (or A/B email) campaign — persisted as `Campaign.config`. */
export interface CampaignDraftInput {
  kind: 'email' | 'ab_email'
  name: string
  subject: string
  subjectB?: string
  preheader: string
  tag: string
  /** Human-readable audience summary for list display, e.g. "3 lists · 1 segment". */
  audienceSummary: string
  audienceListIds: number[]
  audienceSegmentIds: number[]
  audienceTableIds: number[]
  brand: string
  senderName: string
  senderEmail: string
  replyTo: string
  language: string
  address: string
  suppressListIds: number[]
  suppressJourneyIds: number[]
  suppressSegmentIds: number[]
  suppressSecureListIds: number[]
  contentId: number | null
  showPreviewLink: boolean
  dynamicPreview: boolean
  spamCheckResult: string | null
  scheduleType: CampaignScheduleType
  scheduleDate: string | null
  scheduleTime: string | null
  timezone: string
  optimizations: CampaignOptimizations
  testSplitPercent?: number
  winnerCriteria?: 'opens' | 'clicks' | 'revenue'
  /** UAT-parity send method; when present it wins over the legacy `scheduleType`. */
  scheduleMethod?: CampaignScheduleMethod
  recurring?: CampaignRecurringSchedule
  /** 0–100 once a spam check has run; null = not checked yet. */
  spamScore?: number | null
  /** A/B campaigns only. */
  winningCriteria?: AbWinningCriteria
  splitGroups?: AbSplitGroup[]
}

export interface Campaign {
  id: number
  name: string
  folderId: string | null
  status: string
  sentDate: string | null
  listName: string
  metrics: CampaignMetrics
  /** Full wizard configuration — present once a campaign has been through the Create Campaign wizard. */
  config?: CampaignDraftInput
}

export type JourneyStatus = 'Active' | 'Paused' | 'Draft'

export interface Journey {
  id: number
  name: string
  trigger: string
  status: JourneyStatus
  enrolled: number
  completed: number
  revenue: number
  created: string
  /** Set whenever the flow or status is persisted from the builder. */
  updatedAt?: string
  settings?: JourneySettings
}

export const useCampaignsStore = defineStore('campaigns', () => {
  const campaigns = ref<Campaign[]>([
    { id: 1, name: 'Black Friday 2025 — Early Access VIP', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2025-11-22', listName: 'VIP Customer Circle', metrics: { sent: 312, opens: 287, clicks: 134, unsubscribes: 2, revenue: 18420.50 } },
    { id: 2, name: 'Welcome Series #1 — Glad to Have You!', folderId: 'cmp-automated', status: 'Sent', sentDate: '2025-11-15', listName: 'Newsletter Opt-in', metrics: { sent: 4231, opens: 3812, clicks: 1921, unsubscribes: 12, revenue: 9231.00 } },
    { id: 3, name: 'Cyber Monday Flash Sale — 24 Hours Only', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2025-11-25', listName: 'Master Subscriber List', metrics: { sent: 45231, opens: 21432, clicks: 8912, unsubscribes: 234, revenue: 98432.75 } },
    { id: 4, name: 'Product Launch: Nike Air Max 270 Collection', folderId: 'cmp-announcements', status: 'Sent', sentDate: '2025-12-01', listName: 'Product Announcement', metrics: { sent: 32891, opens: 14523, clicks: 4821, unsubscribes: 89, revenue: 34521.00 } },
    { id: 5, name: 'December Holiday Gift Guide 2025', folderId: 'cmp-seasonal', status: 'Sent', sentDate: '2025-12-08', listName: 'Master Subscriber List', metrics: { sent: 45231, opens: 18921, clicks: 6431, unsubscribes: 156, revenue: 45234.50 } },
    { id: 6, name: 'Year End Recap & Thank You', folderId: null, status: 'Sent', sentDate: '2025-12-30', listName: 'Master Subscriber List', metrics: { sent: 45231, opens: 23412, clicks: 2341, unsubscribes: 45, revenue: 12340.00 } },
    { id: 7, name: 'January Sale — New Year, New Deals', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2026-01-02', listName: 'Master Subscriber List', metrics: { sent: 44891, opens: 16789, clicks: 5432, unsubscribes: 123, revenue: 56789.25 } },
    { id: 8, name: 'Valentine\'s Day Gift Ideas — Treat Someone Special', folderId: 'cmp-seasonal', status: 'Sent', sentDate: '2026-02-05', listName: 'Master Subscriber List', metrics: { sent: 44891, opens: 14532, clicks: 4231, unsubscribes: 98, revenue: 29871.00 } },
    { id: 9, name: 'Re-Engagement Campaign — We Miss You!', folderId: 'cmp-automated', status: 'Sent', sentDate: '2026-02-14', listName: 'Lapsed 90 Days', metrics: { sent: 4201, opens: 1234, clicks: 312, unsubscribes: 89, revenue: 8912.50 } },
    { id: 10, name: 'Spring Collection Preview — First Look', folderId: 'cmp-seasonal', status: 'Scheduled', sentDate: '2026-03-20', listName: 'Master Subscriber List', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 11, name: 'VIP Exclusive — Secret Sale Event', folderId: 'cmp-promotions', status: 'Scheduled', sentDate: '2026-03-15', listName: 'VIP Customer Circle', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 12, name: 'Product Update: Dyson V15 Now In Stock', folderId: 'cmp-announcements', status: 'Draft', sentDate: null, listName: 'Product Announcement', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 13, name: 'Abandoned Cart Reminder — Complete Your Order', folderId: 'cmp-automated', status: 'Sending', sentDate: '2026-03-07', listName: 'Abandoned Cart Recovery', metrics: { sent: 1823, opens: 892, clicks: 412, unsubscribes: 8, revenue: 12340.00 } },
    { id: 14, name: 'Customer Feedback Survey — Share Your Thoughts', folderId: null, status: 'Draft', sentDate: null, listName: 'Master Subscriber List', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 15, name: 'Flash Sale — 4 Hours Only, 40% Off Sitewide', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2026-02-28', listName: 'Master Subscriber List', metrics: { sent: 44891, opens: 31234, clicks: 12891, unsubscribes: 489, revenue: 134521.75 } },
    { id: 16, name: 'New Arrival Alert — Sony WH-1000XM5', folderId: 'cmp-announcements', status: 'Sent', sentDate: '2026-02-20', listName: 'Product Announcement', metrics: { sent: 32891, opens: 12341, clicks: 3892, unsubscribes: 67, revenue: 23421.00 } },
    { id: 17, name: 'Loyalty Points Expiring — Use Them Before April', folderId: 'cmp-transactional', status: 'Sent', sentDate: '2026-02-25', listName: 'VIP Customer Circle', metrics: { sent: 312, opens: 289, clicks: 198, unsubscribes: 1, revenue: 4521.50 } },
    { id: 18, name: 'Spring Cleaning Sale — Clear Out Old Stock', folderId: 'cmp-promotions', status: 'Scheduled', sentDate: '2026-03-21', listName: 'Master Subscriber List', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 19, name: 'Happy Birthday Coupon — A Gift from Us to You', folderId: 'cmp-automated', status: 'Sending', sentDate: '2026-03-07', listName: 'Master Subscriber List', metrics: { sent: 234, opens: 201, clicks: 143, unsubscribes: 0, revenue: 2341.00 } },
    { id: 20, name: 'Earth Day Campaign — Shop Sustainably', folderId: 'cmp-seasonal', status: 'Draft', sentDate: null, listName: 'Newsletter Opt-in', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 21, name: 'Mother\'s Day GIft Guide — Perfect Picks for Mom', folderId: 'cmp-seasonal', status: 'Draft', sentDate: null, listName: 'Master Subscriber List', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 22, name: 'Win Back — 30-Day Lapsed Customers', folderId: 'cmp-automated', status: 'Sent', sentDate: '2026-01-15', listName: 'Re-engagement 2024', metrics: { sent: 8912, opens: 2341, clicks: 512, unsubscribes: 234, revenue: 8921.25 } },
    { id: 23, name: 'Product Review Request — How Did We Do?', folderId: 'cmp-transactional', status: 'Sent', sentDate: '2026-02-10', listName: 'Master Subscriber List', metrics: { sent: 1234, opens: 891, clicks: 412, unsubscribes: 3, revenue: 0 } },
    { id: 24, name: 'Weekend Only Deal — Shop Before Monday', folderId: 'cmp-promotions', status: 'Draft', sentDate: null, listName: 'Master Subscriber List', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    { id: 25, name: 'New Blog: "10 Ways To Boost Your Fitness Routine"', folderId: 'cmp-newsletter', status: 'Draft', sentDate: null, listName: 'Newsletter Opt-in', metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 } },
    // Mar–Aug 2026 sends. The earlier history mixes 312-recipient VIP notes with
    // 45k blasts, so any "last N sends" chart drew a couple of towers next to
    // invisible slivers; these are the regular full-list campaigns the volume
    // chart compares (29k–48k), and they carry the calendar up to the current
    // month instead of stopping in February.
    { id: 26, name: 'Spring Ride Season Kickoff — 25% Off Scooters', folderId: 'cmp-seasonal', status: 'Sent', sentDate: '2026-03-12', listName: 'Master Subscriber List', metrics: { sent: 42310, opens: 19240, clicks: 6120, unsubscribes: 132, revenue: 68420.00 } },
    { id: 27, name: 'Easter Weekend Sale — Two Days Only', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2026-04-03', listName: 'Master Subscriber List', metrics: { sent: 38921, opens: 15890, clicks: 4980, unsubscribes: 98, revenue: 42310.50 } },
    { id: 28, name: 'New Season Gear Drop — Helmets & Pads', folderId: 'cmp-announcements', status: 'Sent', sentDate: '2026-04-24', listName: 'Product Announcement', metrics: { sent: 29840, opens: 13210, clicks: 4120, unsubscribes: 71, revenue: 31280.00 } },
    { id: 29, name: 'Mother\'s Day Picks — Gifts She\'ll Love', folderId: 'cmp-seasonal', status: 'Sent', sentDate: '2026-05-08', listName: 'Master Subscriber List', metrics: { sent: 44120, opens: 18730, clicks: 5340, unsubscribes: 121, revenue: 53910.25 } },
    { id: 30, name: 'Memorial Day Blowout — Up to 40% Off', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2026-05-25', listName: 'Master Subscriber List', metrics: { sent: 46280, opens: 21450, clicks: 7210, unsubscribes: 187, revenue: 88240.00 } },
    { id: 31, name: 'Summer Commute Guide — Ride Smarter', folderId: 'cmp-newsletter', status: 'Sent', sentDate: '2026-06-16', listName: 'Newsletter Opt-in', metrics: { sent: 33750, opens: 14980, clicks: 3980, unsubscribes: 84, revenue: 27650.75 } },
    { id: 32, name: 'Fourth of July Flash — 4 Hours, 40% Off', folderId: 'cmp-promotions', status: 'Sent', sentDate: '2026-07-03', listName: 'Master Subscriber List', metrics: { sent: 47910, opens: 22840, clicks: 8120, unsubscribes: 203, revenue: 79340.00 } },
    { id: 33, name: 'Back to School Ride — Student Deals', folderId: 'cmp-seasonal', status: 'Sent', sentDate: '2026-07-28', listName: 'Master Subscriber List', metrics: { sent: 41230, opens: 17920, clicks: 5610, unsubscribes: 142, revenue: 46180.50 } },
  ])

/** Applies the terminal status once the wizard's final action ("finalize") runs. */
  function applyFinalizeStatus(campaign: Campaign, input: CampaignDraftInput) {
    const method = input.scheduleMethod ?? (input.scheduleType === 'now' ? 'send_now' : 'tzo')
    if (method === 'send_now') {
      campaign.status = 'Sending'
      campaign.sentDate = new Date().toISOString().slice(0, 10)
    } else if (method === 'recurring') {
      campaign.status = 'Recurring'
      campaign.sentDate = null
    } else {
      campaign.status = 'Scheduled'
      campaign.sentDate = input.scheduleDate
    }
  }

  /** Creates a new Draft campaign from wizard state. Pass `finalize: true` on the final "Schedule/Send" action. */
  function createCampaign(input: CampaignDraftInput, finalize = false): number {
    const id = Math.max(0, ...campaigns.value.map(c => c.id)) + 1
    const campaign: Campaign = {
      id,
      name: input.name.trim() || 'Untitled campaign',
      folderId: null,
      status: 'Draft',
      sentDate: null,
      listName: input.audienceSummary || 'No audience selected',
      metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 },
      config: input,
    }
    if (finalize) applyFinalizeStatus(campaign, input)
    campaigns.value.unshift(campaign)
    const onboarding = useOnboardingStore()
    onboarding.complete('first-email')
    if (finalize) onboarding.complete('first-campaign')
    return id
  }

  /** Updates an existing (draft or in-progress) campaign from wizard state. Pass `finalize: true` on Schedule/Send. */
  function updateCampaignDraft(id: number, input: CampaignDraftInput, finalize = false) {
    const campaign = campaigns.value.find(c => c.id === id)
    if (!campaign) return
    campaign.name = input.name.trim() || 'Untitled campaign'
    campaign.listName = input.audienceSummary || 'No audience selected'
    campaign.config = input
    if (finalize) applyFinalizeStatus(campaign, input)
  }

  function getCampaign(id: number): Campaign | undefined {
    return campaigns.value.find(c => c.id === id)
  }

  function moveToFolder(id: number, folderId: string | null) {
    const campaign = campaigns.value.find(c => c.id === id)
    if (campaign) campaign.folderId = folderId
  }

  function duplicateCampaign(id: number) {
    const original = campaigns.value.find(c => c.id === id)
    if (!original) return
    const nextId = Math.max(0, ...campaigns.value.map(c => c.id)) + 1
    const index = campaigns.value.findIndex(c => c.id === id)
    campaigns.value.splice(index + 1, 0, {
      ...original,
      id: nextId,
      name: `${original.name} (Copy)`,
      status: 'Draft',
      sentDate: null,
      metrics: { sent: 0, opens: 0, clicks: 0, unsubscribes: 0, revenue: 0 },
    })
  }

  function deleteCampaigns(ids: number[]) {
    campaigns.value = campaigns.value.filter(c => !ids.includes(c.id))
  }

  /** Nulls folderId on campaigns whose folder was deleted. */
  function reassignFolder(folderId: string) {
    for (const campaign of campaigns.value) {
      if (campaign.folderId === folderId) campaign.folderId = null
    }
  }

  const journeys = ref<Journey[]>([
    { id: 1, name: 'Welcome Series — 5-Step Onboarding', trigger: 'List Join', status: 'Active', enrolled: 18432, completed: 14231, revenue: 89432.50, created: '2023-03-01' },
    { id: 2, name: 'Abandoned Cart — 3-Email Recovery', trigger: 'Cart Abandon', status: 'Active', enrolled: 4231, completed: 1892, revenue: 45231.00, created: '2023-05-15' },
    { id: 3, name: 'Post-Purchase — Thank You + Review Request', trigger: 'Order Complete', status: 'Active', enrolled: 28412, completed: 27891, revenue: 12340.00, created: '2023-04-10' },
    { id: 4, name: 'Win-Back — 90-Day Lapsed Customers', trigger: 'Inactivity 90d', status: 'Active', enrolled: 8912, completed: 2341, revenue: 23421.75, created: '2023-07-01' },
    { id: 5, name: 'Birthday Reward — Surprise & Delight', trigger: 'Birthday Date', status: 'Active', enrolled: 12893, completed: 10231, revenue: 67234.00, created: '2023-06-20' },
    { id: 6, name: 'VIP Upgrade — High Spend Customers', trigger: 'Tag Applied', status: 'Paused', enrolled: 312, completed: 289, revenue: 34521.00, created: '2024-01-15' },
    { id: 7, name: 'Referral Program — Share & Earn', trigger: 'Referral Link Click', status: 'Draft', enrolled: 0, completed: 0, revenue: 0, created: '2026-02-01' },
    { id: 8, name: 'SMS Opt-In Confirmation Flow', trigger: 'SMS Opt-In', status: 'Active', enrolled: 7892, completed: 7234, revenue: 0, created: '2024-03-10' },
  ])

  // ── Journey flow graphs ─────────────────────────────────────────────────────

  const journeyFlows = ref<Record<number, FlowNode[]>>(seedJourneyFlows())

  function getFlow(id: number): FlowNode[] | undefined {
    return journeyFlows.value[id]
  }

  /** Creates a journey from a template — or from pre-built nodes (Da Vinci drafts) — and returns the new journey id. */
  function createJourney(payload: { name: string; templateId?: string; nodes?: FlowNode[]; settings: JourneySettings }): number {
    const id = Math.max(0, ...journeys.value.map(j => j.id)) + 1
    const flow = payload.nodes
      ? payload.nodes.map(n => ({
          ...n,
          id: `j${id}-${n.id}`,
          children: n.children.map(c => (c === '' ? '' : `j${id}-${c}`)),
          config: { ...n.config },
          branchLabels: n.branchLabels ? [...n.branchLabels] : undefined,
        }))
      : instantiateTemplate(payload.templateId ?? 'scratch', id)
    const template = payload.templateId ? templateById[payload.templateId] : undefined
    journeys.value.unshift({
      id,
      name: payload.name,
      trigger: flow[0]?.title ?? template?.name ?? 'Custom',
      status: payload.settings.enabled ? 'Active' : 'Draft',
      enrolled: 0,
      completed: 0,
      revenue: 0,
      created: new Date().toISOString().slice(0, 10),
      settings: payload.settings,
    })
    journeyFlows.value[id] = flow
    return id
  }

  function setJourneyStatus(id: number, status: JourneyStatus) {
    const journey = journeys.value.find(j => j.id === id)
    if (journey) journey.status = status
  }

  /** Persists a builder's node graph for a journey and stamps the updated time. */
  function saveJourneyFlow(id: number, nodes: FlowNode[]) {
    journeyFlows.value[id] = nodes.map(n => ({
      ...n,
      children: [...n.children],
      config: { ...n.config },
      branchLabels: n.branchLabels ? [...n.branchLabels] : undefined,
    }))
    const journey = journeys.value.find(j => j.id === id)
    if (journey) journey.updatedAt = new Date().toISOString()
  }

  /** Clones a journey and its flow, suffixing the name like the legacy list does. */
  function duplicateJourney(id: number): number | undefined {
    const original = journeys.value.find(j => j.id === id)
    if (!original) return undefined
    const newId = Math.max(0, ...journeys.value.map(j => j.id)) + 1
    const index = journeys.value.findIndex(j => j.id === id)
    journeys.value.splice(index + 1, 0, {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      status: 'Draft',
      enrolled: 0,
      completed: 0,
      revenue: 0,
      created: new Date().toISOString().slice(0, 10),
      updatedAt: undefined,
    })
    journeyFlows.value[newId] = cloneFlowNodes(journeyFlows.value[id] ?? [], `j${newId}`)
    return newId
  }

  function deleteJourney(id: number) {
    journeys.value = journeys.value.filter(j => j.id !== id)
    delete journeyFlows.value[id]
  }

  return {
    campaigns, createCampaign, updateCampaignDraft, getCampaign, moveToFolder, duplicateCampaign, deleteCampaigns, reassignFolder,
    journeys, journeyFlows, getFlow, createJourney, setJourneyStatus,
    saveJourneyFlow, duplicateJourney, deleteJourney,
  }
})
