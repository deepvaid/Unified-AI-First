// Journey flow data — node catalog (mirrors the full legacy palette), journey
// templates (mirror the legacy "New Journey" gallery), and the seeded flow
// graphs for the mock journeys in useCampaigns.

export type NodeCategory = 'trigger' | 'action' | 'filter' | 'delay' | 'end'

export interface ConfigField {
  /** Optional group heading — fields sharing a section render under one sub-heading
   *  (production's tabbed drawers are flattened into sections). */
  section?: string
  key: string
  label: string
  /**
   * `note` = read-only lines (`options`) · `action` = a button that runs a mock side effect ·
   * `link` = a router link to the route named in `to` · `radio` = an inline radio group.
   */
  type: 'text' | 'number' | 'select' | 'switch' | 'content-picker' | 'multi-select'
    | 'textarea' | 'radio' | 'note' | 'action' | 'link'
  options?: string[]
  /** Prefilled value when a node has no explicit config for this key yet. */
  default?: string | number | boolean
  /** Helper copy under the control (production's field hints). */
  hint?: string
  /** Example value shown while empty — never repeats the label. */
  placeholder?: string
  /** `link` only: route name. */
  to?: string
}

export interface CatalogItem {
  kind: string
  category: NodeCategory
  title: string
  subtitle: string
  icon: string
  /** Intro paragraph at the top of the step's details panel (production copy). */
  description?: string
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

// ── Node catalog (the production journey-builder palette) ────────────────────
// Eighteen items in production order, crawled 2026-09-02 from
// /journeys/:id/journey-builder (docs/rebuild/journey-builder/AUDIT.md §4, §6).
// Labels, intro copy and hints are verbatim; tabbed drawers are flattened into
// `section` groups. Config keys line up with what JourneyTemplateWizard writes.

const listOptions = ['All Contacts', 'Newsletter Subscribers', 'VIP Customer Circle', 'Win-Back Pool']
const segmentOptions = ['High Spenders', 'Inactive 60 Days', 'Cart Abandoners', 'New This Month']
const fieldOptions = ['First Name', 'City', 'Loyalty Tier', 'Last Purchase Date']
const brandOptions = ['Default Brand', 'Atlas Outfitters']
const weekdayOptions = ['Everyday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hourOptions = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))

export const nodeCatalog: CatalogItem[] = [
  // Triggers
  { kind: 'new-subscription', category: 'trigger', title: 'New Subscription', subtitle: 'Contact joins a list', icon: 'user-plus',
    description: 'This trigger initiates when a new subscriber is added to the list selected in the trigger.',
    fields: [
      { key: 'list', label: 'Select List *', type: 'select', options: listOptions },
    ] },
  { kind: 'product-purchased', category: 'trigger', title: 'Product Purchased', subtitle: 'Order completed', icon: 'shopping-cart',
    description: 'The Product Purchased trigger initiates the Journey for contacts who are purchasing single or multiple products.',
    fields: [
      { section: 'Product', key: 'products', label: 'Select Products *', type: 'multi-select', options: ['Trail Runner 2.0', 'Merino Base Layer', 'Ridge Pack 28L', 'Summit Bottle'] },
      { section: 'Product', key: 'allProducts', label: 'Trigger for all products', type: 'switch' },
      { section: 'Order status', key: 'orderStatusEnabled', label: 'Order status', type: 'switch' },
      { section: 'Order status', key: 'orderStatus', label: 'Enter Order Status', type: 'text', placeholder: 'e.g. Dispatched' },
    ] },
  { kind: 'api-event', category: 'trigger', title: 'API Event', subtitle: 'External POST request', icon: 'webhook',
    description: 'The API Event trigger can add a contact to a Journey by making a POST API call.',
    fields: [
      { key: 'endpoints', label: 'Use any of the following POST requests to trigger journey', type: 'note', options: [
        'https://api.maropost.com/accounts/{accountId}/journeys/{journeyId}/trigger/{triggerId}?contact_id=12345',
        'https://api.maropost.com/accounts/{accountId}/journeys/{journeyId}/trigger/{triggerId}?email=homer@example.com',
        'https://api.maropost.com/accounts/{accountId}/journeys/{journeyId}/trigger/{triggerId}?phone_number=+1234567890',
        'https://api.maropost.com/accounts/{accountId}/journeys/{journeyId}/trigger/{triggerId}?uid=unique_id_123',
        'https://api.maropost.com/accounts/{accountId}/journeys/{journeyId}/trigger/{triggerId}?table=users&where[user_id]=42',
      ] },
    ] },
  { kind: 'segment-event', category: 'trigger', title: 'Segment Event', subtitle: 'Contact enters a segment', icon: 'users',
    description: 'The Segment Event trigger is based on segments. The trigger is not instantaneous. You need to select a time frame for it.',
    fields: [
      { key: 'segment', label: 'Segments *', type: 'select', options: segmentOptions },
      { key: 'days', label: 'Days *', type: 'select', options: weekdayOptions, default: 'Everyday' },
      { key: 'hours', label: 'Hours *', type: 'select', options: hourOptions, default: '00' },
    ] },
  { kind: 'abandoned-cart', category: 'trigger', title: 'Abandoned Cart', subtitle: 'Cart left without purchase', icon: 'shopping-basket',
    description: 'The Abandoned Cart trigger is initiated when a customer leaves items in their cart but does not purchase them. The dropdown lets you choose which web store will trigger this Journey.',
    fields: [
      { key: 'store', label: 'Select Store *', type: 'select', options: ['myShop.neto.com.au'] },
    ] },
  { kind: 'total-revenue', category: 'trigger', title: 'Total Revenue', subtitle: 'Lifetime spend reaches a value', icon: 'circle-dollar-sign',
    description: 'The Total Revenue trigger is initiated when a contact’s revenue equals to what is set in the trigger.',
    fields: [
      { key: 'totalRevenue', label: 'Total Revenue', type: 'number', default: 0 },
    ] },
  { kind: 'form-event', category: 'trigger', title: 'Form Event', subtitle: 'Acquisition form submitted', icon: 'list-checks',
    description: 'The Form Event trigger is initiated when a subscriber fills the form selected in the trigger. You can select multiple forms.',
    fields: [
      { key: 'form', label: 'Select SignUp *', type: 'select', options: ['Footer Signup', 'Exit Intent Popup', 'Newsletter Signup'] },
    ] },
  { kind: 'subscription-changed', category: 'trigger', title: 'Subscription Changed', subtitle: 'Subscribe / unsubscribe event', icon: 'repeat',
    description: 'The Subscription Changed trigger is initiated when a subscription of a contact changes, for example, from unsubscribed to subscribed.',
    fields: [
      { key: 'list', label: 'Select List *', type: 'select', options: listOptions },
    ] },
  { kind: 'contact-field-updated', category: 'trigger', title: 'Contact Field Updated', subtitle: 'A contact field changes', icon: 'pencil',
    description: 'The Contact Field Updated trigger contains all the default and custom fields created in your account.',
    fields: [
      { key: 'fields', label: 'Contact Fields *', type: 'multi-select', options: fieldOptions },
    ] },

  // Actions
  { kind: 'send-email', category: 'action', title: 'Send Email', subtitle: 'Deliver a campaign email', icon: 'send',
    description: 'The Send Email action enables you to send an email campaign.',
    fields: [
      { section: 'Send email', key: 'name', label: 'Name *', type: 'text' },
      { section: 'Send email', key: 'subject', label: 'Subject *', type: 'text' },
      { section: 'Send email', key: 'preheader', label: 'Preheader', type: 'text' },
      { section: 'Send email', key: 'fromName', label: 'From Name *', type: 'text' },
      { section: 'Send email', key: 'fromEmail', label: 'From Email *', type: 'text' },
      { section: 'Send email', key: 'replyTo', label: 'Reply To *', type: 'text' },
      { section: 'Send email', key: 'content', label: 'Content *', type: 'content-picker' },
      { section: 'Send email', key: 'previewLink', label: 'Preview Link', type: 'switch' },
      { section: 'Send email', key: 'address', label: 'Address *', type: 'text' },
      { section: 'Send email', key: 'brand', label: 'Brand', type: 'select', options: brandOptions },
      { section: 'Send email', key: 'campaignTags', label: 'Campaign Tags', type: 'multi-select', options: ['VIP', 'Promo', 'Newsletter', 'Automated'] },
      { section: 'Send email', key: 'secureSuppressionList', label: 'Secure Suppression List', type: 'multi-select', options: ['Do Not Mail', 'Legal Hold', 'Bounced Hard'] },
      { section: 'Send email', key: 'language', label: 'Language *', type: 'select', options: ['English', 'Spanish', 'French', 'German'], default: 'English' },
      { section: 'Send email', key: 'report', label: 'View Journey Campaign Report', type: 'link', to: 'JourneyReports' },
      { section: 'Send test email', key: 'testNote', label: 'Select contacts to send test email. You can send test email to a maximum 10 emails and a total of 20 contacts.', type: 'note' },
      { section: 'Send test email', key: 'testSubject', label: 'Subject', type: 'text' },
      { section: 'Send test email', key: 'testEmails', label: 'Enter Emails', type: 'text', placeholder: 'name@example.com, …' },
      { section: 'Send test email', key: 'testLists', label: 'Select List(s)', type: 'multi-select', options: listOptions },
      { section: 'Send test email', key: 'sendTest', label: 'Send Test', type: 'action' },
    ] },
  { kind: 'send-sms', category: 'action', title: 'Send SMS', subtitle: 'Deliver a text message', icon: 'message-square',
    fields: [
      { section: 'Message', key: 'name', label: 'Name *', type: 'text' },
      { section: 'Message', key: 'fromNumber', label: 'From Number *', type: 'select', options: ['+1 415 555 0142', '+61 400 555 019'] },
      { section: 'Message', key: 'messageType', label: 'Message type', type: 'radio', options: ['SMS', 'MMS'], default: 'SMS' },
      { section: 'Message', key: 'message', label: 'Message *', type: 'textarea' },
      { section: 'Message', key: 'clickTracking', label: 'Enable click tracking', type: 'switch', default: true, hint: 'If you disable Click Tracking, none of your links for this campaign will be tracked.' },
      { section: 'Message', key: 'keywords', label: 'Mobile keywords', type: 'text', placeholder: 'Add keyword to message' },
      { section: 'Message', key: 'contactTags', label: 'Contact tags', type: 'text', placeholder: 'Add contact tag to message' },
      { section: 'Quiet Hours', key: 'timezone', label: 'Recipient Timezone', type: 'select', options: ['Account default', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Australia/Sydney'], default: 'Account default' },
      { section: 'Quiet Hours', key: 'quietHours', label: 'Your expected delivery schedule may lie outside permitted hours', type: 'radio', options: ['Pause', 'Send Anyway'], default: 'Pause', hint: 'Permitted sending hours are set in Settings.' },
      { section: 'Compliance', key: 'organizationName', label: 'Organization Name', type: 'text', hint: 'Include your organization name at the start of every message.' },
      { section: 'Compliance', key: 'organizationLink', label: 'Company Information Link', type: 'text', hint: 'Includes a link with sender information after message content.' },
      { section: 'Compliance', key: 'optOutText', label: 'Opt-Out Text', type: 'text', hint: 'Adds instructions on how users can opt-out of receiving messaging from this phone number.' },
    ] },
  { kind: 'add-to-dnm', category: 'action', title: 'Add to Do Not Mail', subtitle: 'Suppress future sends', icon: 'mail-x',
    description: "The Add to Do Not Mail action allows you to move inactive contacts to 'Do Not Mail' (DNM), preventing them from receiving further emails.",
    fields: [
      { section: 'General Do Not Mail list', key: 'generalDnm', label: 'Add contacts to General Do Not Mail list', type: 'switch', default: true, hint: 'This will unsubscribe contacts from all future communications across your entire account' },
      { section: 'Brand Do Not Mail list', key: 'brand', label: 'Select Brand', type: 'select', options: brandOptions },
      { section: 'Brand Do Not Mail list', key: 'allBrands', label: 'Add all brands to DNM', type: 'switch' },
    ] },
  { kind: 'change-contact-field', category: 'action', title: 'Change Contact Field', subtitle: 'Set a contact field value', icon: 'pencil',
    fields: [
      { key: 'field', label: 'Contact field', type: 'select', options: fieldOptions },
      { key: 'value', label: 'New field value', type: 'text' },
    ] },
  { kind: 'change-table-field', category: 'action', title: 'Change Table Field', subtitle: 'Update relational table data', icon: 'table',
    description: 'The Change Table Field action enables you to change the table field for a contact in a table.',
    fields: [
      { key: 'tableField', label: 'Table Field', type: 'select', options: ['orders.status', 'orders.total', 'loyalty_points.balance', 'store_visits.last_seen'] },
      { key: 'value', label: 'New Field Value', type: 'text' },
    ] },

  // Filters
  { kind: 'yes-no', category: 'filter', title: 'Yes/No', subtitle: 'Branch on segment membership', icon: 'split', branchCount: 2, branchLabels: ['Yes', 'No'],
    description: 'The Yes/No filter is based on segments and requires you to select a segment.',
    fields: [
      { key: 'segment', label: 'Segment *', type: 'select', options: segmentOptions },
    ] },
  { kind: 'percent-split', category: 'filter', title: 'Percent Split', subtitle: 'Random percentage split', icon: 'percent', branchCount: 2, branchLabels: ['50%', '50%'],
    description: 'The Percent Split filter enables you to split into a group of minimum 10% and a maximum of 50%.',
    fields: [
      { key: 'splitPercentage', label: 'Split Percentage', type: 'number', default: 50, hint: 'Between 10 and 50. The other branch receives the remainder.' },
    ] },

  // Delay
  { kind: 'delay', category: 'delay', title: 'Delay', subtitle: 'Pause for a fixed duration', icon: 'hourglass',
    description: 'This delay can be set for any amount of time.',
    fields: [
      { key: 'months', label: 'Months', type: 'number', default: 0 },
      { key: 'days', label: 'Days', type: 'number', default: 0 },
      { key: 'hours', label: 'Hours', type: 'number', default: 0 },
      { key: 'minutes', label: 'Minutes', type: 'number', default: 1 },
    ] },

  // End
  { kind: 'end', category: 'end', title: 'End', subtitle: 'Journey stops here', icon: 'flag',
    description: 'This ends the Journey. Your customers will exit the Journey now. Having multiple end points helps you know which path contacts took.',
    fields: [] },
]

// ── Legacy kinds ─────────────────────────────────────────────────────────────
// Not on the production palette; kept so the seeded demo graphs (showcase
// journeys, useJourneyGenerator) still resolve. Never shown in the builder.
export const legacyNodeCatalog: CatalogItem[] = [
  { kind: 'campaign-opened', category: 'trigger', title: 'Campaign Opened', subtitle: 'Contact opens an email', icon: 'mail-open', fields: [
    { key: 'campaign', label: 'Campaign', type: 'select', options: ['Any campaign', 'Spring Sale Blast', 'Weekly Newsletter'] },
  ] },
  { kind: 'link-clicked', category: 'trigger', title: 'Link Clicked', subtitle: 'Contact clicks a link', icon: 'mouse-pointer-click', fields: [
    { key: 'url', label: 'Link URL contains', type: 'text' },
  ] },
  { kind: 'table-field-updated', category: 'trigger', title: 'Table Field Updated', subtitle: 'Relational table data changes', icon: 'table', fields: [
    { key: 'field', label: 'Field', type: 'text' },
  ] },
  { kind: 'tag-event', category: 'trigger', title: 'Tag Event', subtitle: 'Tag applied or removed', icon: 'tags', fields: [
    { key: 'tag', label: 'Tag', type: 'text' },
  ] },
  { kind: 'web-page-event', category: 'trigger', title: 'Web Page Event', subtitle: 'Tracked website activity', icon: 'globe', fields: [
    { key: 'url', label: 'Page URL contains', type: 'text' },
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
  { kind: 'change-subscription', category: 'action', title: 'Change Subscription', subtitle: 'Subscribe or unsubscribe', icon: 'repeat', fields: [
    { key: 'list', label: 'List', type: 'select', options: listOptions },
    { key: 'operation', label: 'Operation', type: 'select', options: ['Subscribe', 'Unsubscribe'] },
  ] },
  { kind: 'change-tags', category: 'action', title: 'Change Tags', subtitle: 'Apply or remove a tag', icon: 'tags', fields: [
    { key: 'tag', label: 'Tag', type: 'text' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['Apply tag', 'Remove tag'] },
  ] },
  { kind: 'case', category: 'filter', title: 'Case', subtitle: 'Multi-way branch on a field', icon: 'list-tree', branchCount: 3, branchLabels: ['Case 1', 'Case 2', 'Other'], fields: [
    { key: 'field', label: 'Field', type: 'select', options: fieldOptions },
  ] },
  { kind: 'ab-split', category: 'filter', title: 'A/B Split', subtitle: 'Test two variants', icon: 'flask-conical', branchCount: 2, branchLabels: ['Variant A', 'Variant B'], fields: [
    { key: 'metric', label: 'Winner metric', type: 'select', options: ['Open rate', 'Click rate', 'Revenue'] },
  ] },
  { kind: 'delay-until', category: 'delay', title: 'Delay Until', subtitle: 'Pause until a date or time', icon: 'calendar-clock', fields: [
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'time', label: 'Time', type: 'text' },
  ] },
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
  // Mirrors the production Send Campaign step: the legacy 3-tab modal
  // (Create Campaign / Select Recipients / Select Campaign Tags) flattened
  // into the builder's one config panel, grouped by section.
  { kind: 'dj-send-campaign', category: 'action', title: 'Send Campaign', subtitle: 'Trigger a campaign send', icon: 'send', fields: [
    { section: 'Campaign', key: 'subject', label: 'Subject', type: 'text' },
    { section: 'Campaign', key: 'preheader', label: 'Preheader', type: 'text' },
    { section: 'Campaign', key: 'fromName', label: 'From name', type: 'text' },
    { section: 'Campaign', key: 'fromEmail', label: 'From email', type: 'text' },
    { section: 'Campaign', key: 'replyTo', label: 'Reply to', type: 'text' },
    { section: 'Campaign', key: 'brand', label: 'Brand', type: 'select', options: ['Maropost', 'Atlas Outfitters'] },
    { section: 'Campaign', key: 'content', label: 'Content', type: 'content-picker' },
    { section: 'Campaign', key: 'previewLink', label: 'Preview link', type: 'switch' },
    { section: 'Campaign', key: 'address', label: 'Address', type: 'text' },
    { section: 'Campaign', key: 'language', label: 'Language', type: 'select', options: ['English', 'French', 'Spanish'], default: 'English' },
    { section: 'Recipients', key: 'lists', label: 'Lists', type: 'multi-select', options: ['Newsletter Subscribers', 'VIP Customers', 'Webstore Buyers', 'Lapsed 90 Days'] },
    { section: 'Recipients', key: 'segments', label: 'Segments', type: 'multi-select', options: ['High Spenders', 'Recent Openers', 'Cart Abandoners'] },
    { section: 'Recipients', key: 'suppressLists', label: 'Suppress lists', type: 'multi-select', options: ['Newsletter Subscribers', 'VIP Customers', 'Webstore Buyers', 'Lapsed 90 Days'] },
    { section: 'Recipients', key: 'suppressSecureLists', label: 'Suppress secure lists', type: 'multi-select', options: ['Hashed Purchasers'] },
    { section: 'Recipients', key: 'suppressSegments', label: 'Suppress segments', type: 'multi-select', options: ['High Spenders', 'Recent Openers', 'Cart Abandoners'] },
    { section: 'Recipients', key: 'suppressJourneys', label: 'Suppress journeys', type: 'multi-select', options: ['Welcome Series', 'Win-back'] },
    { section: 'Recipients', key: 'tables', label: 'Tables', type: 'multi-select', options: ['orders', 'loyalty_points'] },
    { section: 'Campaign tags', key: 'campaignTags', label: 'Campaign tags', type: 'multi-select', options: ['Promo', 'Lifecycle', 'Transactional'] },
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
  { kind: 'dj-generate-report', category: 'action', title: 'Generate Report', subtitle: 'Build and deliver a report', icon: 'file-text', fields: [
    { key: 'report', label: 'Report', type: 'select', options: ['Campaign report', 'Journey report', 'Sales summary'] },
    { key: 'recipients', label: 'Send to', type: 'text' },
  ] },
]

export const catalogByKind: Record<string, CatalogItem> = Object.fromEntries(
  [...nodeCatalog, ...legacyNodeCatalog, ...dataNodeCatalog].map(item => [item.kind, item]),
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

// ── Demo flows for the seeded mock journeys ─────────────────────────────────
// These richer graphs (branches, tags, A/B split) power the seeded journeys the
// showcase and builder demos rely on. They are NOT the "New Journey" gallery —
// that is `journeyTemplates` below, which mirrors production's six templates.

const demoTemplates: JourneyTemplate[] = [
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
      makeNode({ id: 'c1', kind: 'abandoned-cart', subtitle: 'myShop.neto.com.au', config: { store: 'myShop.neto.com.au' }, children: ['c2'] }),
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

const demoById: Record<string, JourneyTemplate> = Object.fromEntries(demoTemplates.map(t => [t.id, t]))

// ── Journey templates (mirror the production "Journey Selection" gallery) ────
// Node graphs match the flow thumbnails shown in the production template
// dialog (crawled 2026-09-02 — see docs/rebuild/new-journey/AUDIT.md). Copy for
// the cards, dialogs and the setup step lives in journeyTemplateSetup.ts.

const oneDay = { months: 0, days: 1, hours: 0, minutes: 0 }
const threeDays = { months: 0, days: 3, hours: 0, minutes: 0 }

export const journeyTemplates: JourneyTemplate[] = [
  {
    id: 'scratch',
    name: 'Create from scratch',
    description: 'Build a journey from scratch in the Journey builder',
    icon: 'pencil',
    nodes: [
      makeNode({ id: 's1', kind: 'new-subscription', title: 'Choose a trigger', subtitle: 'Click to configure when contacts enter', configured: false }),
    ],
  },
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Greet new subscribers with an email series that provides an introduction to your business. Tell your subscribers the story of your business and help them see the value in remaining subscribed.',
    icon: 'users',
    nodes: [
      makeNode({ id: 'w1', kind: 'new-subscription', subtitle: 'Contact joins a list', children: ['w2'] }),
      makeNode({ id: 'w2', kind: 'send-email', title: 'Email 1', subtitle: 'Subject: "Welcome! Thanks for subscribing!"', config: { subject: 'Welcome! Thanks for subscribing!' }, children: ['w3'] }),
      makeNode({ id: 'w3', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['w4'] }),
      makeNode({ id: 'w4', kind: 'send-email', title: 'Email 2', subtitle: 'Subject: "What to expect from your newsletter subscription"', config: { subject: 'What to expect from your newsletter subscription' }, children: ['w5'] }),
      makeNode({ id: 'w5', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['w6'] }),
      makeNode({ id: 'w6', kind: 'send-email', title: 'Email 3', subtitle: 'Subject: "Get the most from our products and services"', config: { subject: 'Get the most from our products and services' }, children: ['w7'] }),
      makeNode({ id: 'w7', kind: 'end' }),
    ],
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned Cart',
    description: 'Send emails to customers who have left your products in their cart. Convince them to continue their transaction by reminding them of what they were trying to purchase.',
    icon: 'shopping-cart',
    nodes: [
      makeNode({ id: 'c1', kind: 'abandoned-cart', subtitle: 'myShop.neto.com.au', config: { store: 'myShop.neto.com.au' }, children: ['c2'] }),
      makeNode({ id: 'c2', kind: 'send-email', title: 'Email 1', subtitle: 'Reminder', children: ['c3'] }),
      makeNode({ id: 'c3', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['c4'] }),
      makeNode({ id: 'c4', kind: 'send-email', title: 'Email 2', subtitle: 'Secondary reminder', children: ['c5'] }),
      makeNode({ id: 'c5', kind: 'end' }),
    ],
  },
  {
    id: 'nurture',
    name: 'Nurture',
    description: 'Provide your contacts that are already interested in your products with additional incentives and benefits from continued subscription.',
    icon: 'lightbulb',
    nodes: [
      makeNode({ id: 'n1', kind: 'product-purchased', subtitle: 'Order completed', children: ['n2'] }),
      makeNode({ id: 'n2', kind: 'send-email', title: 'Email 1', subtitle: 'Introduction', children: ['n3'] }),
      makeNode({ id: 'n3', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['n4'] }),
      makeNode({ id: 'n4', kind: 'send-email', title: 'Email 2', subtitle: 'Question', children: ['n5'] }),
      makeNode({ id: 'n5', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['n6'] }),
      makeNode({ id: 'n6', kind: 'send-email', title: 'Email 3', subtitle: 'Upsell', children: ['n7'] }),
      makeNode({ id: 'n7', kind: 'end' }),
    ],
  },
  {
    id: 'advocacy',
    name: 'Advocacy',
    description: 'Send our relevant updates, promotions and discount codes to customers that have purchased products multiple times.',
    icon: 'refresh-cw',
    nodes: [
      makeNode({ id: 'a1', kind: 'segment-event', subtitle: 'Contact enters a segment', config: { direction: 'Enters segment' }, children: ['a2'] }),
      makeNode({ id: 'a2', kind: 'send-email', title: 'Email 1', subtitle: 'Introduction', children: ['a3'] }),
      makeNode({ id: 'a3', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['a4'] }),
      makeNode({ id: 'a4', kind: 'send-email', title: 'Email 2', subtitle: 'Testimonial', children: ['a5'] }),
      makeNode({ id: 'a5', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['a6'] }),
      makeNode({ id: 'a6', kind: 'send-email', title: 'Email 3', subtitle: 'Incentivize', children: ['a7'] }),
      makeNode({ id: 'a7', kind: 'end' }),
    ],
  },
  {
    id: 're-engagement',
    name: 'Email Re-Engagement',
    description: 'Re-engage with customers who have been inactive for over 90 days. Provide them with promotions and updates relevant to your brand to help them get interested again.',
    icon: 'gauge',
    nodes: [
      makeNode({ id: 'r1', kind: 'segment-event', subtitle: 'Inactive for 90 days', config: { direction: 'Enters segment' }, children: ['r2'] }),
      makeNode({ id: 'r2', kind: 'percent-split', title: 'Percent Split', subtitle: 'Spread sends over five delays', branchLabels: ['20%', '20%', '20%', '20%', '20%'], children: ['r2a', 'r2b', 'r2c', 'r2d', 'r2e'] }),
      makeNode({ id: 'r2a', kind: 'delay', title: '5 min delay', subtitle: 'Wait 5 minutes', config: { months: 0, days: 0, hours: 0, minutes: 5 }, children: ['r3'] }),
      makeNode({ id: 'r2b', kind: 'delay', title: '1 day delay', subtitle: 'Wait 1 day', config: oneDay, children: ['r3'] }),
      makeNode({ id: 'r2c', kind: 'delay', title: '2 day delay', subtitle: 'Wait 2 days', config: { months: 0, days: 2, hours: 0, minutes: 0 }, children: ['r3'] }),
      makeNode({ id: 'r2d', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['r3'] }),
      makeNode({ id: 'r2e', kind: 'delay', title: '4 day delay', subtitle: 'Wait 4 days', config: { months: 0, days: 4, hours: 0, minutes: 0 }, children: ['r3'] }),
      makeNode({ id: 'r3', kind: 'send-email', title: 'Email 1', subtitle: 'Introduction', children: ['r4'] }),
      makeNode({ id: 'r4', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['r5'] }),
      makeNode({ id: 'r5', kind: 'yes-no', title: 'Filter 1', subtitle: 'Engaged since Email 1?', children: ['r5y', 'r6'] }),
      makeNode({ id: 'r5y', kind: 'end', subtitle: 'Re-engaged — exits' }),
      makeNode({ id: 'r6', kind: 'send-email', title: 'Email 2', subtitle: 'Benefits', children: ['r7'] }),
      makeNode({ id: 'r7', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['r8'] }),
      makeNode({ id: 'r8', kind: 'yes-no', title: 'Filter 2', subtitle: 'Engaged since Email 2?', children: ['r8y', 'r9'] }),
      makeNode({ id: 'r8y', kind: 'end', subtitle: 'Re-engaged — exits' }),
      makeNode({ id: 'r9', kind: 'send-email', title: 'Email 3', subtitle: 'Consequences', children: ['r10'] }),
      makeNode({ id: 'r10', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['r11'] }),
      makeNode({ id: 'r11', kind: 'yes-no', title: 'Filter 3', subtitle: 'Engaged since Email 3?', children: ['r11y', 'r12'] }),
      makeNode({ id: 'r11y', kind: 'end', subtitle: 'Re-engaged — exits' }),
      makeNode({ id: 'r12', kind: 'send-email', title: 'Email 4', subtitle: 'Last chance', children: ['r13'] }),
      makeNode({ id: 'r13', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['r14'] }),
      makeNode({ id: 'r14', kind: 'yes-no', title: 'Filter 4', subtitle: 'Engaged since Email 4?', children: ['r14y', 'r15'] }),
      makeNode({ id: 'r14y', kind: 'end', subtitle: 'Re-engaged — exits' }),
      makeNode({ id: 'r15', kind: 'add-to-dnm', title: 'Add to Do Not Mail', subtitle: 'Still silent — suppress sends', children: ['r16'] }),
      makeNode({ id: 'r16', kind: 'end' }),
    ],
  },
  {
    id: 'lapsed-buyer',
    name: 'Lapsed Buyer',
    description: 'Connect with contacts that have purchased in the past, but have not purchased recently. Encourage them by showing new products or special coupons.',
    icon: 'user',
    nodes: [
      makeNode({ id: 'l1', kind: 'segment-event', subtitle: 'Bought 6+ months ago, nothing in 90 days', config: { direction: 'Enters segment' }, children: ['l2'] }),
      makeNode({ id: 'l2', kind: 'send-email', title: 'Email 1', subtitle: 'Subject: "A lot has changed! NEW Special Offers Inside…"', config: { subject: 'A lot has changed! NEW Special Offers Inside…' }, children: ['l3'] }),
      makeNode({ id: 'l3', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['l4'] }),
      makeNode({ id: 'l4', kind: 'yes-no', title: 'Has bought?', subtitle: 'Purchased since Email 1?', children: ['l5a', 'l6'] }),
      makeNode({ id: 'l5a', kind: 'send-email', title: 'Email 5', subtitle: 'Subject: "Welcome Back! Enjoy your New Purchase and Rediscover our Brand"', config: { subject: 'Welcome Back! Enjoy your New Purchase and Rediscover our Brand' }, children: ['le1'] }),
      makeNode({ id: 'le1', kind: 'end' }),
      makeNode({ id: 'l6', kind: 'send-email', title: 'Email 2', subtitle: 'Subject: "Let’s stay together, {{contact.name}}"', config: { subject: 'Let’s stay together, {{contact.name}}' }, children: ['l7'] }),
      makeNode({ id: 'l7', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['l8'] }),
      makeNode({ id: 'l8', kind: 'yes-no', title: 'Has bought?', subtitle: 'Purchased since Email 2?', children: ['l5b', 'l9'] }),
      makeNode({ id: 'l5b', kind: 'send-email', title: 'Email 5', subtitle: 'Subject: "Welcome Back! Enjoy your New Purchase and Rediscover our Brand"', config: { subject: 'Welcome Back! Enjoy your New Purchase and Rediscover our Brand' }, children: ['le2'] }),
      makeNode({ id: 'le2', kind: 'end' }),
      makeNode({ id: 'l9', kind: 'send-email', title: 'Email 3', subtitle: 'Subject: "Have you been seeing someone else?"', config: { subject: 'Have you been seeing someone else?' }, children: ['l10'] }),
      makeNode({ id: 'l10', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['l11'] }),
      makeNode({ id: 'l11', kind: 'yes-no', title: 'Has bought?', subtitle: 'Purchased since Email 3?', children: ['l5c', 'l12'] }),
      makeNode({ id: 'l5c', kind: 'send-email', title: 'Email 5', subtitle: 'Subject: "Welcome Back! Enjoy your New Purchase and Rediscover our Brand"', config: { subject: 'Welcome Back! Enjoy your New Purchase and Rediscover our Brand' }, children: ['le3'] }),
      makeNode({ id: 'le3', kind: 'end' }),
      makeNode({ id: 'l12', kind: 'send-email', title: 'Email 4', subtitle: 'Subject: "Are you in?"', config: { subject: 'Are you in?' }, children: ['l13'] }),
      makeNode({ id: 'l13', kind: 'delay', title: '3 day delay', subtitle: 'Wait 3 days', config: threeDays, children: ['l14'] }),
      makeNode({ id: 'l14', kind: 'yes-no', title: 'Has bought?', subtitle: 'Purchased since Email 4?', children: ['l5d', 'le5'] }),
      makeNode({ id: 'l5d', kind: 'send-email', title: 'Email 5', subtitle: 'Subject: "Welcome Back! Enjoy your New Purchase and Rediscover our Brand"', config: { subject: 'Welcome Back! Enjoy your New Purchase and Rediscover our Brand' }, children: ['le4'] }),
      makeNode({ id: 'le4', kind: 'end' }),
      makeNode({ id: 'le5', kind: 'end' }),
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
    1: withContacts(instantiateFrom(demoById['welcome']!, 'j1'), {
      'j1-w1': 18432, 'j1-w2': 18400, 'j1-w3': 17960, 'j1-w4': 16900,
      'j1-w5': 9840, 'j1-w6': 7060, 'j1-w7': 14231,
    }),
    2: withContacts(instantiateFrom(demoById['abandoned-cart']!, 'j2'), {
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
    4: withContacts(instantiateFrom(demoById['lapsed-buyer']!, 'j4'), {
      'j4-l1': 8912, 'j4-l2': 8860, 'j4-l3': 8710, 'j4-l4': 8654,
      'j4-l5': 2341, 'j4-l6': 6313, 'j4-l7': 3156, 'j4-l8': 3157,
    }),
    5: withContacts(instantiateFrom(demoById['nurture']!, 'j5'), {
      'j5-n1': 12893, 'j5-n2': 12850, 'j5-n3': 12410, 'j5-n4': 12180,
      'j5-n5': 11930, 'j5-n6': 11800, 'j5-n7': 6120, 'j5-n8': 5680,
    }),
    6: withContacts(instantiateFrom(demoById['advocacy']!, 'j6'), {
      'j6-a1': 312, 'j6-a2': 312, 'j6-a3': 310, 'j6-a4': 305, 'j6-a5': 301, 'j6-a6': 214,
    }),
    7: instantiateFrom(demoById['scratch']!, 'j7'),
    8: withContacts(instantiateFrom(demoById['re-engagement']!, 'j8'), {
      'j8-r1': 7892, 'j8-r2': 7860, 'j8-r3': 7712, 'j8-r4': 7690,
      'j8-r5': 5230, 'j8-r6': 2460, 'j8-r7': 2380, 'j8-r8': 1904,
    }),
  }
}
