// Option sets for the Next-Gen segment builder.
//
// Every list here was transcribed verbatim from the source page — see
// docs/rebuild/new-segment/AUDIT.md §4. Keep them in source order: the builder's
// menus are compared against that audit during parity checks.

export type SegmentFieldType = 'string' | 'datetime' | 'float' | 'integer' | 'boolean' | 'enum'

export type SegmentCategory =
  | 'Contact Attributes'
  | 'Purchase Activity'
  | 'Membership'
  | 'Relational Data'
  | 'Site Visits'
  | 'Campaign Activity'

export const SEGMENT_CATEGORIES: SegmentCategory[] = [
  'Contact Attributes',
  'Purchase Activity',
  'Membership',
  'Relational Data',
  'Site Visits',
  'Campaign Activity',
]

/** Standard contact fields, with the data type that drives the operator list. */
export const STANDARD_FIELDS: { name: string; type: SegmentFieldType }[] = [
  { name: 'created_at', type: 'datetime' },
  { name: 'domain name', type: 'string' },
  { name: 'email', type: 'string' },
  { name: 'Engagement Level', type: 'enum' },
  { name: 'first_name', type: 'string' },
  { name: 'last_name', type: 'string' },
  { name: 'Phone Number', type: 'string' },
  { name: 'RFM Group', type: 'enum' },
  { name: 'UID', type: 'string' },
]

/** The second select for every category except Contact Attributes. */
export const CATEGORY_RULES: Record<Exclude<SegmentCategory, 'Contact Attributes'>, string[]> = {
  'Purchase Activity': ['Purchased Product', 'Converted Campaigns', 'Placed Orders', 'Lifetime Value', 'Received Coupon'],
  'Membership': ['Lists', 'Journeys', 'Segments', 'Contact tags', 'Opted-in from forms'],
  'Relational Data': ['Relational Tables', 'SQL Queries'],
  'Site Visits': ['Visited Site', 'Entered Funnel'],
  'Campaign Activity': [
    'Was Sent Emails', 'Received Emails', 'Opened Emails', 'Clicked Emails',
    'Was Sent SMS', 'Delivered SMS', 'Clicked SMS', 'Replied SMS',
  ],
}

/** Campaign Activity groups its rules under two headers in the source. */
export const CAMPAIGN_ACTIVITY_GROUPS = [
  { title: 'Email activities', items: ['Was Sent Emails', 'Received Emails', 'Opened Emails', 'Clicked Emails'] },
  { title: 'SMS activities', items: ['Was Sent SMS', 'Delivered SMS', 'Clicked SMS', 'Replied SMS'] },
]

/** Operators per data type. The source labels each select after the type. */
export const OPERATORS_BY_TYPE: Record<SegmentFieldType, string[]> = {
  string: [
    'Contains', 'Does Not Contain', 'Equals', 'Does Not Equal',
    'Begins With', 'Does Not Begin With', 'Ends With', 'Does Not End With',
    'Is Null', 'Is Not Null', 'Is In', 'Is Not In',
  ],
  datetime: [
    'Is', 'Is Not', 'Before', 'After', 'Between', 'More Than', 'Less Than',
    'Is Null', 'Is Not Null', 'In The Past', 'In The Next', 'Anniversary Of',
    'Day Is In The Past', 'Day Is In The Next',
  ],
  float: [
    'Equals', 'Does Not Equal', 'Is Less Than', 'Is At Most',
    'Is Greater Than', 'Is At Least', 'Is Null', 'Is Not Null', 'Is Between',
  ],
  integer: [
    'Equals', 'Does Not Equal', 'Is Less Than', 'Is At Most',
    'Is Greater Than', 'Is At Least', 'Is Null', 'Is Not Null', 'Is Between',
  ],
  boolean: ['YES (True)', 'NO (False)'],
  enum: [],
}

/** The operator select's label is generated from the field's data type. */
export const OPERATOR_LABEL: Record<SegmentFieldType, string> = {
  string: 'String condition',
  datetime: 'Date condition',
  float: 'Number condition',
  integer: 'Number condition',
  boolean: 'Value',
  enum: 'Level',
}

export const ENGAGEMENT_LEVELS = [
  'Most Engaged', 'Highly Engaged', 'Engaged', 'Lightly Engaged', 'Not Engaged',
]

export const RFM_GROUPS = [
  'Champions', 'Loyal', 'Potential Loyalist', 'At Risk', 'Hibernating', 'Lost',
]

export const AS_OF_OPTIONS = [
  'today', 'specific date', '7 days ago', '30 days ago', '90 days ago', 'x days ago',
]

export const FREQUENCY_OPTIONS = [
  'At Least Once', 'Nothing', 'Equal To', 'Not Equal To', 'Less Than',
  'At Most', 'Greater Than', 'At Least', 'Between',
]

export const RECENCY_OPTIONS = [
  'At Anytime', 'Today', 'Before', 'After', 'Between',
  'More Than', 'Less Than', 'In The Past', 'On',
]

export const SUBSCRIPTION_TYPES = ['Both', 'Email', 'SMS']
export const SUBSCRIPTION_STATUSES = ['Subscribed To', 'Unsubscribed From', 'Never Subscribed To']
export const LIST_TYPES = ['Any List Type', 'Branded List']

export const PURCHASE_OPTIONAL_FILTERS = ['Monetary Value', 'Products Purchased', 'Order Status']

/** Operators that take no value at all. */
export const VALUELESS_OPERATORS = new Set(['Is Null', 'Is Not Null'])

/** Operators that take two values. */
export const RANGE_OPERATORS = new Set(['Is Between', 'Between'])

/** The nine canned prompts offered by the source's AI panel. */
export const AI_PROMPTS = [
  'New subscribers within the last 30 days',
  'Subscribers who have not clicked or opened an email in the last 30 days',
  'Subscribers who have not purchased in the last 30 days',
  'Contacts whose domain is gmail.com',
  'Subscribers who have purchased at least 3 times in the last 90 days',
  // The source ships this with a missing space and the wrong preposition
  // ("atleast", "on the month of"). Corrected here — see IMPROVEMENTS.md.
  'Contacts who have received at least 5 emails in the month of May',
  'Subscribers who have made more than $1000 in purchases over the last 120 days',
  'Subscribers whose lifetime value is more than $1000',
  'Subscribers who have clicked more than once in the last 30 days',
]

/** The source caps a segment at 100 criteria across all its rules. */
export const MAX_CRITERIA = 100
