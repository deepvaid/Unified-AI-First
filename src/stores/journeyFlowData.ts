// Journey flow data — node catalog (mirrors the full legacy palette), journey
// templates (mirror the legacy "New Journey" gallery), and the seeded flow
// graphs for the mock journeys in useCampaigns.

export type NodeCategory = 'trigger' | 'action' | 'filter' | 'delay' | 'end'

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'switch' | 'content-picker' | 'multi-select'
  options?: string[]
  /** Prefilled value when a node has no explicit config for this key yet. */
  default?: string | number | boolean
}

export interface CatalogItem {
  kind: string
  category: NodeCategory
  title: string
  subtitle: string
  icon: string
  fields: ConfigField[]
  /** Filters only: number of outgoing branches and their default labels. */
  branchCount?: number
  branchLabels?: string[]
}

export interface FlowNode {
  id: string
  kind: string
  category: NodeCategory
  title: string
  subtitle: string
  icon: string
  contacts?: number
  /** Filters only: labels per outgoing branch (defaults from the catalog). */
  branchLabels?: string[]
  /**
   * Outgoing edges. Linear nodes have 0–1 entries. Filter nodes always have
   * exactly branchCount entries; an entry of '' marks an empty branch, and an
   * entry pointing at the flow's rejoin node marks an empty branch that joins.
   */
  children: string[]
  config: Record<string, string | number | boolean | string[]>
  configured: boolean
  /** Set by "Detach" in the node config panel: unlinked from the flow but kept
   * around (visible in the builder's "detached steps" tray) instead of deleted. */
  detached?: boolean
}

export interface JourneySettings {
  endDate?: string
  endTime?: string
  enabled: boolean
  retrigger: boolean
}

export interface JourneyTemplate {
  id: string
  name: string
  description: string
  icon: string
  nodes: FlowNode[]
}

// ── Node catalog (full legacy palette) ───────────────────────────────────────

const listOptions = ['All Contacts', 'Newsletter Subscribers', 'VIP Customer Circle', 'Win-Back Pool']
const segmentOptions = ['High Spenders', 'Inactive 60 Days', 'Cart Abandoners', 'New This Month']
const fieldOptions = ['First Name', 'City', 'Loyalty Tier', 'Last Purchase Date']

export const nodeCatalog: CatalogItem[] = [
  // Triggers
  { kind: 'new-subscription', category: 'trigger', title: 'New Subscription', subtitle: 'Contact joins a list', icon: 'user-plus', fields: [
    { key: 'list', label: 'List', type: 'select', options: listOptions },
  ] },
  { kind: 'campaign-opened', category: 'trigger', title: 'Campaign Opened', subtitle: 'Contact opens an email', icon: 'mail-open', fields: [
    { key: 'campaign', label: 'Campaign', type: 'select', options: ['Any campaign', 'Spring Sale Blast', 'Weekly Newsletter'] },
  ] },
  { kind: 'link-clicked', category: 'trigger', title: 'Link Clicked', subtitle: 'Contact clicks a link', icon: 'mouse-pointer-click', fields: [
    { key: 'campaign', label: 'Campaign', type: 'select', options: ['Any campaign', 'Spring Sale Blast', 'Weekly Newsletter'] },
    { key: 'url', label: 'Link URL contains', type: 'text' },
  ] },
  { kind: 'product-purchased', category: 'trigger', title: 'Product Purchased', subtitle: 'Order completed', icon: 'shopping-cart', fields: [
    { key: 'condition', label: 'Order condition', type: 'select', options: ['Any order', 'Order > $50', 'First order only'] },
  ] },
  { kind: 'total-revenue', category: 'trigger', title: 'Total Revenue', subtitle: 'Lifetime spend threshold', icon: 'circle-dollar-sign', fields: [
    { key: 'threshold', label: 'Revenue threshold ($)', type: 'number' },
  ] },
  { kind: 'form-event', category: 'trigger', title: 'Form Event', subtitle: 'Acquisition form submitted', icon: 'list-checks', fields: [
    { key: 'form', label: 'Form', type: 'select', options: ['Any form', 'Footer Signup', 'Exit Intent Popup'] },
  ] },
  { kind: 'api-event', category: 'trigger', title: 'API Event', subtitle: 'External webhook received', icon: 'code', fields: [
    { key: 'event', label: 'Event name', type: 'text' },
  ] },
  { kind: 'segment-event', category: 'trigger', title: 'Segment Event', subtitle: 'Segment membership changes', icon: 'users', fields: [
    { key: 'segment', label: 'Segment', type: 'select', options: segmentOptions },
    { key: 'direction', label: 'When contact', type: 'select', options: ['Enters segment', 'Exits segment'] },
  ] },
  { kind: 'contact-field-updated', category: 'trigger', title: 'Contact Field Updated', subtitle: 'A contact field changes', icon: 'pencil', fields: [
    { key: 'field', label: 'Field', type: 'select', options: fieldOptions },
  ] },
  { kind: 'table-field-updated', category: 'trigger', title: 'Table Field Updated', subtitle: 'Relational table data changes', icon: 'table', fields: [
    { key: 'table', label: 'Table', type: 'select', options: ['Orders', 'Warranty Registrations', 'Store Visits'] },
    { key: 'field', label: 'Field', type: 'text' },
  ] },
  { kind: 'subscription-changed', category: 'trigger', title: 'Subscription Changed', subtitle: 'Subscribe / unsubscribe event', icon: 'repeat', fields: [
    { key: 'change', label: 'Change', type: 'select', options: ['Subscribed', 'Unsubscribed'] },
  ] },
  { kind: 'tag-event', category: 'trigger', title: 'Tag Event', subtitle: 'Tag applied or removed', icon: 'tags', fields: [
    { key: 'tag', label: 'Tag', type: 'text' },
    { key: 'operation', label: 'When tag is', type: 'select', options: ['Applied', 'Removed'] },
  ] },
  { kind: 'web-page-event', category: 'trigger', title: 'Web Page Event', subtitle: 'Tracked website activity', icon: 'globe', fields: [
    { key: 'url', label: 'Page URL contains', type: 'text' },
  ] },
  { kind: 'abandoned-cart', category: 'trigger', title: 'Abandoned Cart', subtitle: 'Cart idle for a set time', icon: 'shopping-basket', fields: [
    { key: 'idle', label: 'Idle time (minutes)', type: 'number' },
  ] },

  // Actions
  { kind: 'send-email', category: 'action', title: 'Send Email', subtitle: 'Deliver a campaign email', icon: 'send', fields: [
    { key: 'subject', label: 'Subject line*', type: 'text' },
    { key: 'preheader', label: 'Preheader', type: 'text' },
    { key: 'fromName', label: 'From Name*', type: 'text' },
    { key: 'fromEmail', label: 'From Email*', type: 'text' },
    { key: 'replyTo', label: 'Reply To*', type: 'text' },
    { key: 'content', label: 'Content*', type: 'content-picker' },
    { key: 'previewLink', label: 'Show email preview link', type: 'switch' },
    { key: 'address', label: 'Address*', type: 'text' },
    { key: 'brand', label: 'Brand', type: 'select', options: ['Default Brand', 'Secondary Brand'] },
    { key: 'campaignTags', label: 'Campaign Tags', type: 'multi-select', options: ['VIP', 'Promo', 'Newsletter', 'Automated'] },
    { key: 'secureSuppressionList', label: 'Secure Suppression List', type: 'multi-select', options: ['Do Not Mail', 'Legal Hold', 'Bounced Hard'] },
    { key: 'language', label: 'Language*', type: 'select', options: ['English', 'Spanish', 'French', 'German'], default: 'English' },
  ] },
  { kind: 'http-post', category: 'action', title: 'HTTP Post', subtitle: 'Send data to external URL', icon: 'webhook', fields: [
    { key: 'url', label: 'Endpoint URL', type: 'text' },
  ] },
  { kind: 'trigger-journey', category: 'action', title: 'Trigger Journey', subtitle: 'Enroll in another journey', icon: 'workflow', fields: [
    { key: 'journey', label: 'Journey', type: 'select', options: ['Welcome Series', 'Win-Back', 'VIP Upgrade'] },
  ] },
  { kind: 'send-to-facebook', category: 'action', title: 'Send to Facebook', subtitle: 'Sync to a custom audience', icon: 'facebook', fields: [
    { key: 'audience', label: 'Audience', type: 'select', options: ['Lookalike Seed', 'Retargeting Pool'] },
  ] },
  { kind: 'end-journey', category: 'action', title: 'End Journey', subtitle: 'Exit contact from this journey', icon: 'square', fields: [] },
  { kind: 'change-contact-field', category: 'action', title: 'Change Contact Field', subtitle: 'Set a contact field value', icon: 'pencil', fields: [
    { key: 'field', label: 'Field', type: 'select', options: fieldOptions },
    { key: 'value', label: 'New value', type: 'text' },
  ] },
  { kind: 'change-table-field', category: 'action', title: 'Change Table Field', subtitle: 'Update relational table data', icon: 'table', fields: [
    { key: 'table', label: 'Table', type: 'select', options: ['Orders', 'Warranty Registrations', 'Store Visits'] },
    { key: 'field', label: 'Field', type: 'text' },
    { key: 'value', label: 'New value', type: 'text' },
  ] },
  { kind: 'change-subscription', category: 'action', title: 'Change Subscription', subtitle: 'Subscribe or unsubscribe', icon: 'repeat', fields: [
    { key: 'list', label: 'List', type: 'select', options: listOptions },
    { key: 'operation', label: 'Operation', type: 'select', options: ['Subscribe', 'Unsubscribe'] },
  ] },
  { kind: 'change-tags', category: 'action', title: 'Change Tags', subtitle: 'Apply or remove a tag', icon: 'tags', fields: [
    { key: 'tag', label: 'Tag', type: 'text' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['Apply tag', 'Remove tag'] },
  ] },
  { kind: 'add-to-dnm', category: 'action', title: 'Add to Do Not Mail', subtitle: 'Suppress future sends', icon: 'mail-x', fields: [
    { key: 'reason', label: 'Reason', type: 'text' },
  ] },

  // Filters
  { kind: 'yes-no', category: 'filter', title: 'Yes / No', subtitle: 'Branch on a condition', icon: 'split', branchCount: 2, branchLabels: ['YES', 'NO'], fields: [
    { key: 'event', label: 'Check event', type: 'select', options: ['Email opened', 'Email clicked', 'Product purchased', 'Contact field'] },
    { key: 'window', label: 'Time window', type: 'select', options: ['Since last email', 'Last 24 hours', 'Last 7 days'] },
  ] },
  { kind: 'case', category: 'filter', title: 'Case', subtitle: 'Multi-way branch on a field', icon: 'list-tree', branchCount: 3, branchLabels: ['CASE 1', 'CASE 2', 'OTHER'], fields: [
    { key: 'field', label: 'Field', type: 'select', options: fieldOptions },
  ] },
  { kind: 'percent-split', category: 'filter', title: '% Split', subtitle: 'Random percentage split', icon: 'percent', branchCount: 3, branchLabels: ['A · 33%', 'B · 33%', 'C · 34%'], fields: [
    { key: 'distribution', label: 'Distribution', type: 'select', options: ['Even split', 'Weighted'] },
  ] },
  { kind: 'ab-split', category: 'filter', title: 'A/B Split', subtitle: 'Test two variants', icon: 'flask-conical', branchCount: 2, branchLabels: ['VARIANT A', 'VARIANT B'], fields: [
    { key: 'metric', label: 'Winner metric', type: 'select', options: ['Open rate', 'Click rate', 'Revenue'] },
  ] },

  // Delays
  { kind: 'delay', category: 'delay', title: 'Delay', subtitle: 'Pause for a fixed duration', icon: 'hourglass', fields: [
    { key: 'months', label: 'Months', type: 'number', default: 0 },
    { key: 'days', label: 'Days', type: 'number', default: 0 },
    { key: 'hours', label: 'Hours', type: 'number', default: 0 },
    { key: 'minutes', label: 'Minutes', type: 'number', default: 1 },
  ] },
  { kind: 'delay-until', category: 'delay', title: 'Delay Until', subtitle: 'Pause until a date or time', icon: 'calendar-clock', fields: [
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'time', label: 'Time', type: 'text' },
  ] },

  // End
  { kind: 'end', category: 'end', title: 'End', subtitle: 'Journey stops here', icon: 'flag', fields: [] },
]

// ── Data journey node catalog (mirrors the legacy data-journey palette) ──────

const frequencyOptions = ['Every 15 minutes', 'Hourly', 'Daily', 'Weekly']
const importSources = ['Salesforce CRM', 'Shopify Orders API', 'Contacts CSV (SFTP)', 'Google Sheets']
const exportTargets = ['Data Warehouse (SFTP)', 'S3 Bucket', 'Relational Tables']
const dataCampaigns = ['Welcome Email', 'Post-Purchase Thank You', 'Weekly Newsletter']

export const dataNodeCatalog: CatalogItem[] = [
  // Triggers
  { kind: 'dj-scheduled', category: 'trigger', title: 'Scheduled', subtitle: 'Run once at a set time', icon: 'calendar-clock', fields: [
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'time', label: 'Time', type: 'text' },
  ] },
  { kind: 'dj-recurring', category: 'trigger', title: 'Recurring', subtitle: 'Run on a schedule', icon: 'repeat', fields: [
    { key: 'frequency', label: 'Frequency', type: 'select', options: frequencyOptions },
    { key: 'time', label: 'At time', type: 'text' },
  ] },
  { kind: 'dj-import-finished', category: 'trigger', title: 'Import Finished', subtitle: 'An import completes', icon: 'download', fields: [
    { key: 'import', label: 'Import', type: 'select', options: ['Any import', ...importSources] },
  ] },
  { kind: 'dj-export-finished', category: 'trigger', title: 'Export Finished', subtitle: 'An export completes', icon: 'upload', fields: [
    { key: 'export', label: 'Export', type: 'select', options: ['Any export', ...exportTargets] },
  ] },
  { kind: 'dj-campaign-sent', category: 'trigger', title: 'Campaign Sent', subtitle: 'A campaign finishes sending', icon: 'send', fields: [
    { key: 'campaign', label: 'Campaign', type: 'select', options: ['Any campaign', ...dataCampaigns] },
  ] },
  { kind: 'dj-report-generated', category: 'trigger', title: 'Report Generated', subtitle: 'A report becomes available', icon: 'file-text', fields: [
    { key: 'report', label: 'Report', type: 'select', options: ['Campaign report', 'Journey report', 'Sales summary'] },
  ] },
  { kind: 'dj-file-uploaded', category: 'trigger', title: 'File Uploaded', subtitle: 'A file lands in a location', icon: 'file-plus', fields: [
    { key: 'location', label: 'Location', type: 'select', options: ['SFTP /inbox', 'S3 bucket', 'Manual upload'] },
  ] },
  { kind: 'dj-api-event', category: 'trigger', title: 'API Event', subtitle: 'External webhook received', icon: 'code', fields: [
    { key: 'event', label: 'Event name', type: 'text' },
  ] },

  // Actions
  { kind: 'dj-ftp-upload', category: 'action', title: 'FTP Upload', subtitle: 'Push a file to a server', icon: 'upload', fields: [
    { key: 'host', label: 'Host', type: 'text' },
    { key: 'path', label: 'Remote path', type: 'text' },
  ] },
  { kind: 'dj-send-campaign', category: 'action', title: 'Send Campaign', subtitle: 'Trigger a campaign send', icon: 'send', fields: [
    { key: 'campaign', label: 'Campaign', type: 'select', options: dataCampaigns },
  ] },
  { kind: 'dj-start-import', category: 'action', title: 'Start Import', subtitle: 'Pull data into Maropost', icon: 'download', fields: [
    { key: 'source', label: 'Source', type: 'select', options: importSources },
  ] },
  { kind: 'dj-start-export', category: 'action', title: 'Start Export', subtitle: 'Push data out of Maropost', icon: 'upload', fields: [
    { key: 'destination', label: 'Destination', type: 'select', options: exportTargets },
  ] },
  { kind: 'dj-send-to-facebook', category: 'action', title: 'Send to Facebook', subtitle: 'Sync to a custom audience', icon: 'facebook', fields: [
    { key: 'audience', label: 'Audience', type: 'select', options: ['Lookalike Seed', 'Retargeting Pool'] },
  ] },
  { kind: 'dj-secure-list-import', category: 'action', title: 'Secure List Import', subtitle: 'Import a hashed list', icon: 'shield', fields: [
    { key: 'list', label: 'List name', type: 'text' },
  ] },
]

export const catalogByKind: Record<string, CatalogItem> = Object.fromEntries(
  [...nodeCatalog, ...dataNodeCatalog].map(item => [item.kind, item]),
)

// ── Flow node helper ─────────────────────────────────────────────────────────

interface NodeSeed {
  id: string
  kind: string
  title?: string
  subtitle?: string
  contacts?: number
  branchLabels?: string[]
  children?: string[]
  config?: Record<string, string | number | boolean | string[]>
  configured?: boolean
}

/** Builds a FlowNode from the catalog entry for `kind`, with overrides. */
export function makeNode(seed: NodeSeed): FlowNode {
  const item = catalogByKind[seed.kind]
  if (!item) throw new Error(`Unknown node kind: ${seed.kind}`)
  return {
    id: seed.id,
    kind: item.kind,
    category: item.category,
    title: seed.title ?? item.title,
    subtitle: seed.subtitle ?? item.subtitle,
    icon: item.icon,
    contacts: seed.contacts,
    branchLabels: seed.branchLabels ?? item.branchLabels,
    children: seed.children ?? [],
    config: seed.config ?? {},
    configured: seed.configured ?? true,
  }
}

// ── Journey templates (mirror the legacy "New Journey" gallery) ──────────────

export const journeyTemplates: JourneyTemplate[] = [
  {
    id: 'scratch',
    name: 'Start from scratch',
    description: 'A blank canvas — pick a trigger, then build your flow step by step.',
    icon: 'plus',
    nodes: [
      makeNode({ id: 's1', kind: 'new-subscription', title: 'Choose a trigger', subtitle: 'Click to configure when contacts enter', configured: false }),
    ],
  },
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Greet new subscribers, follow up with your brand story, and tag everyone who finishes onboarding.',
    icon: 'hand-metal',
    nodes: [
      makeNode({ id: 'w1', kind: 'new-subscription', subtitle: 'Newsletter Subscribers', config: { list: 'Newsletter Subscribers' }, children: ['w2'] }),
      makeNode({ id: 'w2', kind: 'send-email', title: 'Send: Welcome Email', subtitle: 'Subject: "Welcome aboard! 👋"', config: { content: 'Welcome Email' }, children: ['w3'] }),
      makeNode({ id: 'w3', kind: 'delay', title: 'Wait 2 Days', subtitle: 'Let the welcome land', config: { months: 0, days: 2, hours: 0, minutes: 0 }, children: ['w4'] }),
      makeNode({ id: 'w4', kind: 'yes-no', title: 'Opened welcome email?', subtitle: 'Check open event on Email #1', children: ['w5', 'w6'] }),
      makeNode({ id: 'w5', kind: 'send-email', title: 'Send: Our Brand Story', subtitle: 'Subject: "How it all started"', children: ['w7'] }),
      makeNode({ id: 'w6', kind: 'send-email', title: 'Resend: New Subject', subtitle: 'Subject: "You forgot something 👀"', children: ['w7'] }),
      makeNode({ id: 'w7', kind: 'change-tags', title: 'Apply Tag: Onboarded', subtitle: 'Mark onboarding complete', config: { tag: 'Onboarded', operation: 'Apply tag' } }),
    ],
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart',
    description: 'Recover idle carts with a reminder, then a discount for anyone who still hasn\'t purchased.',
    icon: 'shopping-basket',
    nodes: [
      makeNode({ id: 'c1', kind: 'abandoned-cart', subtitle: 'Cart idle for 60 minutes', config: { idle: 60 }, children: ['c2'] }),
      makeNode({ id: 'c2', kind: 'delay', title: 'Wait 1 Hour', subtitle: 'Grace period', config: { months: 0, days: 0, hours: 1, minutes: 0 }, children: ['c3'] }),
      makeNode({ id: 'c3', kind: 'send-email', title: 'Send: You Left Something', subtitle: 'Subject: "Your cart misses you"', children: ['c4'] }),
      makeNode({ id: 'c4', kind: 'delay', title: 'Wait 1 Day', subtitle: 'Give them time to return', config: { months: 0, days: 1, hours: 0, minutes: 0 }, children: ['c5'] }),
      makeNode({ id: 'c5', kind: 'yes-no', title: 'Purchased?', subtitle: 'Check for a completed order', children: ['c6', 'c7'] }),
      makeNode({ id: 'c6', kind: 'change-tags', title: 'Apply Tag: Recovered', subtitle: 'Cart recovered — journey ends', config: { tag: 'Recovered', operation: 'Apply tag' } }),
      makeNode({ id: 'c7', kind: 'send-email', title: 'Send: 10% Off Your Cart', subtitle: 'Subject: "Still thinking it over? Here\'s 10% off"', children: [] }),
    ],
  },
  {
    id: 'nurture',
    name: 'Nurture',
    description: 'Educate new leads over a week and route the engaged ones to sales.',
    icon: 'sprout',
    nodes: [
      makeNode({ id: 'n1', kind: 'form-event', subtitle: 'Footer Signup form', config: { form: 'Footer Signup' }, children: ['n2'] }),
      makeNode({ id: 'n2', kind: 'send-email', title: 'Send: Getting-Started Guide', subtitle: 'Subject: "Your guide is inside"', children: ['n3'] }),
      makeNode({ id: 'n3', kind: 'delay', title: 'Wait 3 Days', subtitle: 'Reading time', config: { months: 0, days: 3, hours: 0, minutes: 0 }, children: ['n4'] }),
      makeNode({ id: 'n4', kind: 'send-email', title: 'Send: Customer Case Study', subtitle: 'Subject: "How Mia doubled her sales"', children: ['n5'] }),
      makeNode({ id: 'n5', kind: 'delay', title: 'Wait 4 Days', subtitle: 'Follow-up window', config: { months: 0, days: 4, hours: 0, minutes: 0 }, children: ['n6'] }),
      makeNode({ id: 'n6', kind: 'yes-no', title: 'Clicked any link?', subtitle: 'Engagement check across both emails', children: ['n7', 'n8'] }),
      makeNode({ id: 'n7', kind: 'change-tags', title: 'Apply Tag: Sales-Ready', subtitle: 'Hand off to the sales pipeline', config: { tag: 'Sales-Ready', operation: 'Apply tag' } }),
      makeNode({ id: 'n8', kind: 'change-subscription', title: 'Move to Long-Term List', subtitle: 'Keep nurturing monthly', config: { list: 'Newsletter Subscribers', operation: 'Subscribe' } }),
    ],
  },
  {
    id: 'advocacy',
    name: 'Advocacy',
    description: 'Turn your best customers into advocates with VIP perks and a referral invite.',
    icon: 'megaphone',
    nodes: [
      makeNode({ id: 'a1', kind: 'total-revenue', subtitle: 'Lifetime spend over $500', config: { threshold: 500 }, children: ['a2'] }),
      makeNode({ id: 'a2', kind: 'change-tags', title: 'Apply Tag: VIP', subtitle: 'Unlock VIP segment perks', config: { tag: 'VIP', operation: 'Apply tag' }, children: ['a3'] }),
      makeNode({ id: 'a3', kind: 'send-email', title: 'Send: VIP Welcome', subtitle: 'Subject: "You\'re in — welcome to the inner circle"', children: ['a4'] }),
      makeNode({ id: 'a4', kind: 'delay', title: 'Wait 7 Days', subtitle: 'Let the perks sink in', config: { months: 0, days: 7, hours: 0, minutes: 0 }, children: ['a5'] }),
      makeNode({ id: 'a5', kind: 'yes-no', title: 'Opened VIP welcome?', subtitle: 'Only invite engaged VIPs', children: ['a6', ''] }),
      makeNode({ id: 'a6', kind: 'send-email', title: 'Send: Referral Invite', subtitle: 'Subject: "Give $20, get $20"', children: [] }),
    ],
  },
  {
    id: 're-engagement',
    name: 'Email Re-engagement',
    description: 'Win back quiet subscribers — and stop mailing the ones who stay silent.',
    icon: 'refresh-ccw',
    nodes: [
      makeNode({ id: 'r1', kind: 'segment-event', subtitle: 'Enters "Inactive 60 Days"', config: { segment: 'Inactive 60 Days', direction: 'Enters segment' }, children: ['r2'] }),
      makeNode({ id: 'r2', kind: 'send-email', title: 'Send: We Miss You', subtitle: 'Subject: "It\'s been a while…"', children: ['r3'] }),
      makeNode({ id: 'r3', kind: 'delay', title: 'Wait 3 Days', subtitle: 'Response window', config: { months: 0, days: 3, hours: 0, minutes: 0 }, children: ['r4'] }),
      makeNode({ id: 'r4', kind: 'yes-no', title: 'Opened the email?', subtitle: 'Re-engagement check', children: ['r5', 'r6'] }),
      makeNode({ id: 'r5', kind: 'change-tags', title: 'Apply Tag: Re-Engaged', subtitle: 'Back in the active pool', config: { tag: 'Re-Engaged', operation: 'Apply tag' } }),
      makeNode({ id: 'r6', kind: 'send-email', title: 'Send: Last Chance', subtitle: 'Subject: "Should we stop emailing you?"', children: ['r7'] }),
      makeNode({ id: 'r7', kind: 'delay', title: 'Wait 4 Days', subtitle: 'Final response window', config: { months: 0, days: 4, hours: 0, minutes: 0 }, children: ['r8'] }),
      makeNode({ id: 'r8', kind: 'add-to-dnm', title: 'Add to Do Not Mail', subtitle: 'No response — suppress sends', config: { reason: 'Unresponsive 60+ days' } }),
    ],
  },
  {
    id: 'lapsed-buyer',
    name: 'Lapsed Buyer',
    description: 'Bring back customers who stopped buying, with an A/B-tested win-back offer.',
    icon: 'rotate-ccw',
    nodes: [
      makeNode({ id: 'l1', kind: 'segment-event', subtitle: 'Enters "No purchase in 90 days"', config: { segment: 'Inactive 60 Days', direction: 'Enters segment' }, children: ['l2'] }),
      makeNode({ id: 'l2', kind: 'send-email', title: 'Send: Win-Back 15% Off', subtitle: 'Subject: "We saved you a seat (and 15%)"', children: ['l3'] }),
      makeNode({ id: 'l3', kind: 'delay', title: 'Wait 5 Days', subtitle: 'Redemption window', config: { months: 0, days: 5, hours: 0, minutes: 0 }, children: ['l4'] }),
      makeNode({ id: 'l4', kind: 'yes-no', title: 'Purchased?', subtitle: 'Check for a completed order', children: ['l5', 'l6'] }),
      makeNode({ id: 'l5', kind: 'change-tags', title: 'Apply Tag: Won Back', subtitle: 'Recovered customer', config: { tag: 'Won Back', operation: 'Apply tag' } }),
      makeNode({ id: 'l6', kind: 'ab-split', title: 'Test final offer subject', subtitle: 'Split remaining contacts 50/50', children: ['l7', 'l8'] }),
      makeNode({ id: 'l7', kind: 'send-email', title: 'Send: Variant A', subtitle: 'Subject: "Your 20% goodbye gift"', children: [] }),
      makeNode({ id: 'l8', kind: 'send-email', title: 'Send: Variant B', subtitle: 'Subject: "One last thing before we go"', children: [] }),
    ],
  },
]

export const templateById: Record<string, JourneyTemplate> = Object.fromEntries(
  journeyTemplates.map(t => [t.id, t]),
)

/** Clones a node graph with prefixed ids (edges rewritten to match). */
export function cloneFlowNodes(nodes: FlowNode[], prefix: string): FlowNode[] {
  const idMap = new Map(nodes.map(n => [n.id, `${prefix}-${n.id}`]))
  return nodes.map(n => ({
    ...n,
    id: idMap.get(n.id)!,
    branchLabels: n.branchLabels ? [...n.branchLabels] : undefined,
    children: n.children.map(c => (c === '' ? '' : idMap.get(c) ?? '')),
    config: { ...n.config },
  }))
}

/** Clones a template's node graph with prefixed ids. */
export function instantiateFrom(tpl: JourneyTemplate, prefix: string): FlowNode[] {
  return cloneFlowNodes(tpl.nodes, prefix)
}

/** Clones a marketing template's graph with journey-scoped node ids. */
export function instantiateTemplate(templateId: string, journeyId: number): FlowNode[] {
  const tpl = templateById[templateId] ?? journeyTemplates[0]
  if (!tpl) return []
  return instantiateFrom(tpl, `j${journeyId}`)
}

// ── Data journey templates (mirror the legacy data-journey flows) ────────────

export const dataJourneyTemplates: JourneyTemplate[] = [
  {
    id: 'salesforce-sync',
    name: 'Salesforce Lead Sync',
    description: 'Pull new Salesforce leads every hour and greet them with your welcome campaign.',
    icon: 'repeat',
    nodes: [
      makeNode({ id: 't1', kind: 'dj-recurring', subtitle: 'Every hour, on the hour', config: { frequency: 'Hourly' }, children: ['a1'] }),
      makeNode({ id: 'a1', kind: 'dj-start-import', title: 'Import: Salesforce leads', subtitle: 'Salesforce CRM → Contacts', config: { source: 'Salesforce CRM' }, children: ['a2'] }),
      makeNode({ id: 'a2', kind: 'dj-send-campaign', title: 'Send: Welcome Email', subtitle: 'To newly imported leads', config: { campaign: 'Welcome Email' } }),
    ],
  },
  {
    id: 'shopify-orders',
    name: 'Shopify Order Import',
    description: 'Sync Shopify orders into relational tables every 15 minutes and thank new buyers.',
    icon: 'shopping-cart',
    nodes: [
      makeNode({ id: 't1', kind: 'dj-recurring', subtitle: 'Every 15 minutes', config: { frequency: 'Every 15 minutes' }, children: ['a1'] }),
      makeNode({ id: 'a1', kind: 'dj-start-import', title: 'Import: Shopify orders', subtitle: 'Shopify Orders API → Relational Tables', config: { source: 'Shopify Orders API' }, children: ['a2'] }),
      makeNode({ id: 'a2', kind: 'dj-send-campaign', title: 'Send: Post-Purchase Thank You', subtitle: 'To customers on new orders', config: { campaign: 'Post-Purchase Thank You' } }),
    ],
  },
  {
    id: 'warehouse-export',
    name: 'Data Warehouse Export',
    description: 'Export all contact activity nightly and upload it to your warehouse over SFTP.',
    icon: 'upload',
    nodes: [
      makeNode({ id: 't1', kind: 'dj-recurring', subtitle: 'Daily at 02:00', config: { frequency: 'Daily', time: '02:00' }, children: ['a1'] }),
      makeNode({ id: 'a1', kind: 'dj-start-export', title: 'Export: Contact activity', subtitle: 'All contacts → Data Warehouse (SFTP)', config: { destination: 'Data Warehouse (SFTP)' }, children: ['a2'] }),
      makeNode({ id: 'a2', kind: 'dj-ftp-upload', title: 'Upload to warehouse', subtitle: 'sftp://warehouse.internal/exports', config: { host: 'warehouse.internal', path: '/exports' } }),
    ],
  },
]

export const dataTemplateById: Record<string, JourneyTemplate> = Object.fromEntries(
  dataJourneyTemplates.map(t => [t.id, t]),
)

// ── Seeded flows for the mock journeys in useCampaigns ───────────────────────

/** Sets contact counts on a flow, decaying down the main path for realism. */
function withContacts(nodes: FlowNode[], counts: Record<string, number>): FlowNode[] {
  return nodes.map(n => (counts[n.id] != null ? { ...n, contacts: counts[n.id] } : n))
}

export function seedJourneyFlows(): Record<number, FlowNode[]> {
  return {
    1: withContacts(instantiateTemplate('welcome', 1), {
      'j1-w1': 18432, 'j1-w2': 18400, 'j1-w3': 17960, 'j1-w4': 16900,
      'j1-w5': 9840, 'j1-w6': 7060, 'j1-w7': 14231,
    }),
    2: withContacts(instantiateTemplate('abandoned-cart', 2), {
      'j2-c1': 4231, 'j2-c2': 4231, 'j2-c3': 4102, 'j2-c4': 3890,
      'j2-c5': 3811, 'j2-c6': 1892, 'j2-c7': 1919,
    }),
    // Journey 3 keeps its original post-purchase graph (converted to the new shape).
    3: [
      makeNode({ id: 'j3-n1', kind: 'product-purchased', subtitle: 'Any order with total > $0', contacts: 1240, config: { condition: 'Any order' }, children: ['j3-n2'] }),
      makeNode({ id: 'j3-n2', kind: 'delay', title: 'Wait 2 Hours', subtitle: 'Processing window', contacts: 1240, config: { months: 0, days: 0, hours: 2, minutes: 0 }, children: ['j3-n3'] }),
      makeNode({ id: 'j3-n3', kind: 'send-email', title: 'Send: Thank You Email', subtitle: 'Subject: "Your order is confirmed! 🎉"', contacts: 1235, config: { content: 'Thank You Email' }, children: ['j3-n4'] }),
      makeNode({ id: 'j3-n4', kind: 'delay', title: 'Wait 7 Days', subtitle: 'Allow delivery + use time', contacts: 1180, config: { months: 0, days: 7, hours: 0, minutes: 0 }, children: ['j3-n5'] }),
      makeNode({ id: 'j3-n5', kind: 'yes-no', title: 'Opened Thank You Email?', subtitle: 'Check open event on Email #1', contacts: 1170, children: ['j3-n6', 'j3-n7'] }),
      makeNode({ id: 'j3-n6', kind: 'send-email', title: 'Send: Review Request', subtitle: 'Subject: "How did we do? ⭐"', contacts: 690, children: ['j3-n8'] }),
      makeNode({ id: 'j3-n7', kind: 'send-email', title: 'Resend: New Subject', subtitle: 'Subject: "One quick question 👋"', contacts: 480, children: ['j3-n8'] }),
      makeNode({ id: 'j3-n8', kind: 'change-tags', title: 'Apply Tag: Reviewed', subtitle: 'Mark contact journey complete', contacts: 1170, config: { tag: 'Reviewed', operation: 'Apply tag' } }),
    ],
    4: withContacts(instantiateTemplate('lapsed-buyer', 4), {
      'j4-l1': 8912, 'j4-l2': 8860, 'j4-l3': 8710, 'j4-l4': 8654,
      'j4-l5': 2341, 'j4-l6': 6313, 'j4-l7': 3156, 'j4-l8': 3157,
    }),
    5: withContacts(instantiateTemplate('nurture', 5), {
      'j5-n1': 12893, 'j5-n2': 12850, 'j5-n3': 12410, 'j5-n4': 12180,
      'j5-n5': 11930, 'j5-n6': 11800, 'j5-n7': 6120, 'j5-n8': 5680,
    }),
    6: withContacts(instantiateTemplate('advocacy', 6), {
      'j6-a1': 312, 'j6-a2': 312, 'j6-a3': 310, 'j6-a4': 305, 'j6-a5': 301, 'j6-a6': 214,
    }),
    7: instantiateTemplate('scratch', 7),
    8: withContacts(instantiateTemplate('re-engagement', 8), {
      'j8-r1': 7892, 'j8-r2': 7860, 'j8-r3': 7712, 'j8-r4': 7690,
      'j8-r5': 5230, 'j8-r6': 2460, 'j8-r7': 2380, 'j8-r8': 1904,
    }),
  }
}
