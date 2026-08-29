/**
 * Field, metric and option catalogues for the Custom Report create flow.
 *
 * Every list here is transcribed from the live UAT wizards — see
 * `docs/rebuild/custom-report-new/AUDIT.md` §4 and §4b for the crawl that produced them.
 */

import type { CustomReportType } from '@/stores/useAnalytics'

export type ReportTypeSlug = 'campaign' | 'sms' | 'message' | 'deliverability' | 'growth_attrition'

export interface ReportTypeDef {
  slug: ReportTypeSlug
  /** Card title on the chooser. */
  title: string
  /** Card description on the chooser. */
  description: string
  icon: string
  /** Breadcrumb leaf and page eyebrow, e.g. "New Campaign Report". */
  label: string
  /** How the Custom Reports list names this type — it differs from the chooser title. */
  listLabel: CustomReportType
  /** Ordered wizard step titles. Length drives the stepper. */
  steps: string[]
  /** Heading above the From/To pair on step 1; null renders the dates with no sub-heading. */
  dateRangeTitle: string | null
  /** Only the Email Campaign flow offers the day-by-day breakup toggle. */
  hasBreakupToggle: boolean
  /** Only SMS Message collects assigned numbers. */
  hasAssignedNumbers: boolean
}

export const REPORT_TYPES: ReportTypeDef[] = [
  {
    slug: 'campaign',
    title: 'Email campaign',
    description: 'Report on all email campaigns, journeys and transactional emails.',
    icon: 'megaphone',
    label: 'New campaign report',
    listLabel: 'Campaign Based',
    steps: ['Schedule & delivery', 'Report details', 'Report fields'],
    dateRangeTitle: 'Campaign date range',
    hasBreakupToggle: true,
    hasAssignedNumbers: false,
  },
  {
    slug: 'sms',
    title: 'SMS campaign',
    description: 'Report on all SMS campaigns.',
    icon: 'message-square',
    label: 'New SMS report',
    listLabel: 'SMS Report',
    steps: ['Schedule & delivery', 'Report details', 'Report metrics'],
    dateRangeTitle: 'Campaign date range',
    hasBreakupToggle: false,
    hasAssignedNumbers: false,
  },
  {
    slug: 'message',
    title: 'SMS message',
    description: 'Report on individual outbound and inbound SMS messages.',
    icon: 'smartphone',
    label: 'New SMS message report',
    listLabel: 'SMS Message',
    steps: ['Schedule & delivery', 'Report details'],
    dateRangeTitle: 'Campaign date range',
    hasBreakupToggle: false,
    hasAssignedNumbers: true,
  },
  {
    slug: 'deliverability',
    title: 'Deliverability',
    description: 'Assess how successfully your campaigns reached the inbox.',
    icon: 'mail-check',
    label: 'New deliverability report',
    listLabel: 'Deliverability',
    steps: ['Schedule & delivery', 'Report details'],
    dateRangeTitle: 'Report date range',
    hasBreakupToggle: false,
    hasAssignedNumbers: false,
  },
  {
    slug: 'growth_attrition',
    title: 'Growth & attrition',
    description: 'See how your lists have changed over a period of time.',
    icon: 'trending-up',
    label: 'New growth & attrition report',
    listLabel: 'Growth & Attrition',
    steps: ['Schedule & delivery', 'Report details'],
    dateRangeTitle: null,
    hasBreakupToggle: false,
    hasAssignedNumbers: false,
  },
]

export function reportTypeBySlug(slug: string): ReportTypeDef | undefined {
  return REPORT_TYPES.find(t => t.slug === slug)
}

// ── Shared step-2 options ──────────────────────────────────────────────────────
export const FILE_FORMATS = [
  'Comma separated list (.csv)',
  'Excel spreadsheet (.xls)',
  'PDF document (.pdf)',
  'Excel 2012 sheet (.xlsx)',
]

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY']

export const RECUR_INTERVALS = ['Day', 'Week', 'Month', 'Year']

// ── Email campaign ─────────────────────────────────────────────────────────────
export const CAMPAIGN_TYPES = [
  'Recurring campaigns',
  'Transactional campaigns',
  'Sent campaigns',
  'Journey based campaigns',
  'Test campaigns',
]

/** The source caps a report at 500 campaigns. Kept so the guidance reads the same. */
export const CAMPAIGN_SELECTION_CAP = 500

export const CAMPAIGN_MANDATORY_FIELDS = [
  'Campaign ID',
  'Campaign name',
  'Campaign type',
  'Campaign send date',
  'Total contacts',
  'From email',
  'Subject',
  'Total emails sent',
  'Emails delivered',
  'Delivered percentage',
]

export const CAMPAIGN_OPTIONAL_FIELDS = [
  'From name',
  'Total email opens',
  'Total email opens percentage',
  'Unique email opens',
  'Unique email opens percentage',
  'Total email clicks',
  'Total email clicks percentage',
  'Unique email clicks',
  'Unique email clicks percentage',
  'Total email bounces',
  'Total email bounces percentage',
  'Soft bounces',
  'Soft bounces percentage',
  'Hard bounces',
  'Hard bounces percentage',
  'Complaints',
  'Complaints percentage',
  'Unsubscribes',
  'Unsubscribes percentage',
  'Click to open percentage',
  'Campaign tags',
  'Brand name',
  'Total revenue',
  'Total orders',
  'Total items purchased',
  'Total unique items purchased',
  'Conversion rate',
  'Average order value',
]

// ── SMS ────────────────────────────────────────────────────────────────────────
export const SMS_CAMPAIGN_SOURCES = ['SMS campaign', 'Journey campaign', 'Transactional campaign']

export const SMS_MANDATORY_METRICS = [
  'Campaign ID',
  'Campaign name',
  'Type',
  'Campaign send date/time',
  'Contacts',
  'SMS sent',
  'SMS delivered',
]

export const SMS_OPTIONAL_METRICS = [
  'Delivery rate',
  'SMS replies',
  'Replies rate',
  'Unsubscribes',
  'Unsubscribe rate',
  'SMS inbound',
  'SMS outbound',
  'DNM',
  'SMS failed',
  'Permanent failure',
  'Temporary failure',
  'Valid/invalid keyword',
  'Valid/invalid keyword response',
  'Click count',
  'Unique click count',
]

/** Mock SMS campaign names, keyed by the source that produces them. */
export const SMS_CAMPAIGNS: Record<string, string[]> = {
  'SMS campaign': [
    'Spring flash sale',
    'Weekend 20% off',
    'Black Friday early access',
    'Click & collect reminder',
    'New arrivals drop',
  ],
  'Journey campaign': [
    'Welcome series — SMS 1',
    'Abandoned cart nudge',
    'Post-purchase check-in',
    'Win-back offer',
  ],
  'Transactional campaign': [
    'Order confirmation',
    'Shipping notification',
    'Delivery confirmation',
    'Appointment reminder',
  ],
}

export const ASSIGNED_NUMBERS = [
  '+61 428 000 118 (Australia)',
  '+61 428 000 204 (Australia)',
  '+1 415 555 0142 (United States)',
  '+44 7700 900318 (United Kingdom)',
  '61477 (Shortcode, Australia)',
]

// ── Deliverability ─────────────────────────────────────────────────────────────
export const ISPS = [
  'aol.com', 'att.net', 'bellsouth.net', 'btest.com', 'btinternet.com',
  'charter.net', 'comcast.net', 'cox.net', 'earthlink.net', 'gmail.com',
  'gmx.de', 'hotmail.com', 'live.com', 'me.com', 'msn.com',
  'optonline.net', 'sbcglobal.net', 'shaw.ca', 'verizon.net', 'web.de',
  'yahoo.ca', 'yahoo.co.uk', 'yahoo.com', 'ymail.com', 'yopmail.com',
]

export const DELIVERABILITY_METRICS = [
  'Send total',
  'Received total',
  'Delivery rate',
  'Open total',
  'Open rate',
  'Click total',
  'Click rate',
  'Bounced',
  'Bounce rate',
  'Complaint total',
  'Complaint rate',
]

// ── Growth & attrition ─────────────────────────────────────────────────────────
export const GROWTH_METRICS = [
  'Total DNM',
  'DNM per list',
  'Total user attrition',
  'User attrition per list',
  'Total subscribed user growth',
  'Subscribed user growth per list',
  'Total unsubscribed user growth',
  'Unsubscribed user growth per list',
  'First time contacts per list',
  'Resubscribers per list',
]

// ── Mock campaigns for the email-campaign picker ───────────────────────────────
export interface MockCampaign {
  name: string
  type: string
  brand: string
  tags: string[]
}

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  { name: 'Spring collection launch', type: 'Sent campaigns', brand: 'Maropost', tags: ['Seasonal'] },
  { name: 'Black Friday early access', type: 'Sent campaigns', brand: 'Maropost', tags: ['Promotion', 'Seasonal'] },
  { name: 'Weekly newsletter — August', type: 'Recurring campaigns', brand: 'Maropost', tags: ['Newsletter'] },
  { name: 'Weekly newsletter — July', type: 'Recurring campaigns', brand: 'Maropost', tags: ['Newsletter'] },
  { name: 'Order confirmation', type: 'Transactional campaigns', brand: 'Maropost', tags: ['Transactional'] },
  { name: 'Shipping notification', type: 'Transactional campaigns', brand: 'Maropost', tags: ['Transactional'] },
  { name: 'Welcome series — email 1', type: 'Journey based campaigns', brand: 'Storefront Co', tags: ['Onboarding'] },
  { name: 'Welcome series — email 2', type: 'Journey based campaigns', brand: 'Storefront Co', tags: ['Onboarding'] },
  { name: 'Abandoned cart reminder', type: 'Journey based campaigns', brand: 'Storefront Co', tags: ['Promotion'] },
  { name: 'Win-back — 90 days inactive', type: 'Journey based campaigns', brand: 'Wholesale Division', tags: ['Win-back'] },
  { name: 'Subject line A/B test', type: 'Test campaigns', brand: 'Maropost', tags: ['Test'] },
  { name: 'Send-time A/B test', type: 'Test campaigns', brand: 'Wholesale Division', tags: ['Test'] },
]

export const CAMPAIGN_TAGS = ['Newsletter', 'Promotion', 'Seasonal', 'Onboarding', 'Transactional', 'Test', 'Win-back']

export const BRANDS = ['Maropost', 'Storefront Co', 'Wholesale Division']
