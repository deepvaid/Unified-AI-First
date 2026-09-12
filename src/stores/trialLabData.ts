/**
 * Trial Lab — static data for the four free-trial onboarding prototypes.
 *
 * Variants, goals, sample-task seeds and the copy that must read identically
 * across variants live here so the comparison isolates the two design
 * decisions (verify-before-entry, ask-names-early) and nothing else.
 * Consumed by `useTrialLab.ts` and `src/views/TrialLab/*`.
 */

export type TrialVariant = 'a' | 'b' | 'c' | 'd'
export type TrialGoal = 'marketing' | 'commerce' | 'service'
export type TrialStage = 'signup' | 'verify' | 'preparing' | 'names' | 'goal' | 'task' | 'home' | 'upgrade'

export interface VariantConfig {
  key: TrialVariant
  label: string
  /** One-line hypothesis the variant tests. */
  hypothesis: string
  /** Trade-off the reviewer should watch for. */
  tradeOff: string
  /** A/B block product entry until the email is verified; C/D let the user explore samples first. */
  verifyBeforeEntry: boolean
  /** A/C show the optional names screen during onboarding; B/D offer names only through contextual edits. */
  askNamesEarly: boolean
}

export const VARIANTS: VariantConfig[] = [
  {
    key: 'a',
    label: 'Verify, then personalize',
    hypothesis: 'Early personalization improves orientation once the account is verified.',
    tradeOff: 'One more screen before the first useful action.',
    verifyBeforeEntry: true,
    askNamesEarly: true,
  },
  {
    key: 'b',
    label: 'Verify, then explore',
    hypothesis: 'The shortest verified route to a useful task converts best.',
    tradeOff: 'Names stay empty until the user reaches for them.',
    verifyBeforeEntry: true,
    askNamesEarly: false,
  },
  {
    key: 'c',
    label: 'Preview, then personalize',
    hypothesis: 'Progress while waiting for the email keeps users engaged.',
    tradeOff: 'Some users personalise a workspace they never activate.',
    verifyBeforeEntry: false,
    askNamesEarly: true,
  },
  {
    key: 'd',
    label: 'Preview, then explore',
    hypothesis: 'Earliest access with minimal setup maximises first-task completion.',
    tradeOff: 'Some users finish exploring without ever verifying.',
    verifyBeforeEntry: false,
    askNamesEarly: false,
  },
]

export function isTrialVariant(v: unknown): v is TrialVariant {
  return typeof v === 'string' && VARIANTS.some(x => x.key === v)
}

export function variantConfig(variant: TrialVariant): VariantConfig {
  return VARIANTS.find(x => x.key === variant)!
}

export interface GoalDef {
  key: TrialGoal
  cloud: string
  title: string
  description: string
  icon: string
  /** Noun the success state names ("Your sample welcome email is saved"). */
  artifact: string
}

export const GOALS: GoalDef[] = [
  {
    key: 'marketing',
    cloud: 'Marketing Cloud',
    title: 'Explore Marketing',
    description: 'Pick a welcome-email template, edit it and preview the result.',
    icon: 'megaphone',
    artifact: 'welcome email',
  },
  {
    key: 'commerce',
    cloud: 'Commerce Cloud',
    title: 'Explore Commerce',
    description: 'Customise the heading and accent of a sample storefront.',
    icon: 'shopping-bag',
    artifact: 'storefront',
  },
  {
    key: 'service',
    cloud: 'Service Cloud',
    title: 'Explore Service',
    description: 'Open a sample ticket and refine a suggested reply.',
    icon: 'life-buoy',
    artifact: 'ticket reply',
  },
]

export function isTrialGoal(v: unknown): v is TrialGoal {
  return typeof v === 'string' && GOALS.some(g => g.key === v)
}

export function goalDef(goal: TrialGoal): GoalDef {
  return GOALS.find(g => g.key === goal)!
}

// ── Sample task seeds ────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string
  name: string
  description: string
  subject: string
  body: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'A warm first email after signup.',
    subject: 'Welcome to {{store_name}} — glad you’re here',
    body: 'Hi {{first_name}},\n\nThanks for joining us. Over the next few days we’ll show you the pieces our customers love most, and how to get the most out of them.\n\nIf you ever need a hand, just reply to this email.\n\n— The {{store_name}} team',
  },
  {
    id: 'welcome-offer',
    name: 'Welcome + offer',
    description: 'A welcome with a first-order incentive.',
    subject: 'Your 10% welcome gift is inside',
    body: 'Hi {{first_name}},\n\nWelcome aboard. As a thank-you, here’s 10% off your first order — use code WELCOME10 at checkout any time this week.\n\nShop the new arrivals →\n\n— The {{store_name}} team',
  },
  {
    id: 'plain',
    name: 'Plain text',
    description: 'A short, personal note with no design chrome.',
    subject: 'Quick hello from {{store_name}}',
    body: 'Hi {{first_name}},\n\nI’m the founder of {{store_name}}. I wanted to say thanks personally for signing up — and to ask: what brought you here today?\n\nReply and let me know. I read every message.',
  },
]

export const STOREFRONT_DEFAULT_HEADING = 'Fall 26 Drop 02'

/** Token-sourced accent choices for the sample storefront. Values are resolved in the task view. */
export const STOREFRONT_ACCENTS: { key: string; label: string; value: string }[] = [
  { key: 'blue', label: 'Blue', value: '#0073AB' },
  { key: 'indigo', label: 'Indigo', value: '#4F46E5' },
  { key: 'teal', label: 'Teal', value: '#0F766E' },
  { key: 'amber', label: 'Amber', value: '#B45309' },
  { key: 'rose', label: 'Rose', value: '#BE123C' },
]

export const SAMPLE_TICKET = {
  id: 'S-1042',
  subject: 'Order arrived with the wrong size',
  customer: 'Priya N.',
  receivedAgo: '2h ago',
  message:
    'Hi — my order (#48213) arrived today but the jacket is a medium, and I ordered a small. I’m travelling on Friday and was hoping to take it with me. Can this be sorted quickly?',
  suggestedReply:
    'Hi Priya,\n\nI’m sorry the wrong size arrived — that’s on us. I’ve dispatched a small today with express shipping so it reaches you before Friday, and included a prepaid label to return the medium whenever suits you.\n\nYou’ll get tracking by email within the hour. Safe travels!\n\nBest,\nSam',
}

// ── Validation copy shared with the real signup ─────────────────────────────

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com',
  'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com',
  'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'zoho.com',
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Returns an error message, or '' when the address is acceptable. */
export function validateWorkEmail(value: string): string {
  const v = value.trim()
  if (!v) return 'Work email is required'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address'
  const domain = v.split('@')[1]?.toLowerCase() ?? ''
  if (FREE_EMAIL_DOMAINS.has(domain)) return 'Use your work email to start a trial'
  return ''
}

export const PASSWORD_MIN_LENGTH = 8

export function validatePassword(value: string): string {
  if (!value) return 'Password is required'
  if (value.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters`
  return ''
}

// ── Gated actions (require a verified email) ────────────────────────────────

export interface GatedAction {
  key: string
  label: string
  description: string
  icon: string
}

export const GATED_ACTIONS: GatedAction[] = [
  { key: 'connect', label: 'Connect your live store', description: 'Sync products and orders from your platform.', icon: 'plug' },
  { key: 'import', label: 'Import real contacts', description: 'Upload a CSV or connect a source.', icon: 'upload' },
  { key: 'send', label: 'Send a test email', description: 'Deliver your draft to a real inbox.', icon: 'send' },
  { key: 'publish', label: 'Publish the storefront', description: 'Make your sample store reachable.', icon: 'globe' },
  { key: 'invite', label: 'Invite a teammate', description: 'Share this workspace with a colleague.', icon: 'user-plus' },
  { key: 'upgrade', label: 'Upgrade your plan', description: 'Choose a plan and keep everything you built.', icon: 'arrow-up-right' },
]

/** Shown in the verify dialog when a gated action is attempted before verification. */
export const GATE_REASON =
  'Sending, importing, publishing and inviting affect real people, so we confirm it’s you first. Your sample work is safe either way.'
