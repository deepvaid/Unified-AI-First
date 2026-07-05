// Da Vinci journey draft generator — deterministic, brief-driven flow drafts.
// The draft's FlowNode[] is the single source of truth: the sequence table and
// rationale are derived from it. Scripted today; the async-shaped entry point
// (generateJourneyDraft) can later delegate to /api/gemini structured output.

import type { FlowNode } from '@/stores/journeyFlowData'
import { catalogByKind, dataTemplateById, instantiateTemplate } from '@/stores/journeyFlowData'
import { addNodeAfter, removeNode } from '@/composables/useFlowTree'

export type JourneyGoal = 'welcome' | 'abandoned-cart' | 'nurture' | 'advocacy' | 're-engagement' | 'lapsed-buyer'
export type RefinementKind = 'shorter' | 'add-winback-branch' | 'more-urgent' | 'regenerate'

export interface JourneyBrief {
  goal: JourneyGoal
  audience: string
  brand?: string
  offer?: string
  notes?: string
}

export interface EmailRow {
  order: number
  subject: string
  preheader: string
  delay: string
}

export interface JourneyDraft {
  nodes: FlowNode[]
  sequence: EmailRow[]
  rationale: string
  suggestedName: string
}

export const goalOptions: { key: JourneyGoal; label: string; icon: string }[] = [
  { key: 'welcome', label: 'Welcome new subscribers', icon: 'hand-metal' },
  { key: 'abandoned-cart', label: 'Recover abandoned carts', icon: 'shopping-basket' },
  { key: 'nurture', label: 'Nurture new leads', icon: 'sprout' },
  { key: 'advocacy', label: 'Grow advocates & referrals', icon: 'megaphone' },
  { key: 're-engagement', label: 'Re-engage quiet contacts', icon: 'refresh-ccw' },
  { key: 'lapsed-buyer', label: 'Win back lapsed buyers', icon: 'rotate-ccw' },
]

const goalLabel: Record<JourneyGoal, string> = {
  'welcome': 'Welcome Series',
  'abandoned-cart': 'Abandoned Cart Recovery',
  'nurture': 'Lead Nurture',
  'advocacy': 'Advocacy Program',
  're-engagement': 'Re-Engagement',
  'lapsed-buyer': 'Lapsed Buyer Win-Back',
}

interface CopyContext { brand: string; offer: string }
type CopyLine = (ctx: CopyContext) => { subject: string; preheader: string }

// Two copy variants per goal so Regenerate visibly changes output. Formulas
// weave the brief's brand/offer in — never placeholder tokens.
const copyPools: Record<JourneyGoal, CopyLine[][]> = {
  'welcome': [
    [
      c => ({ subject: `Welcome to ${c.brand} 👋`, preheader: `Here's what makes ${c.brand} different` }),
      c => ({ subject: `The story behind ${c.brand}`, preheader: `Why we started, and what ${c.brand} stands for` }),
      c => ({ subject: `Still settling in? ${c.offer}`, preheader: 'A little welcome gift from us' }),
    ],
    [
      c => ({ subject: `You're in — welcome to ${c.brand}`, preheader: `Your first look inside ${c.brand}` }),
      c => ({ subject: 'Three favourites to start with', preheader: `Hand-picked ${c.brand} bestsellers for new members` }),
      c => ({ subject: `A welcome treat: ${c.offer}`, preheader: 'Because first impressions matter' }),
    ],
  ],
  'abandoned-cart': [
    [
      c => ({ subject: 'Your cart is waiting', preheader: `We saved your picks at ${c.brand}` }),
      c => ({ subject: `Still thinking it over? ${c.offer}`, preheader: 'Complete your order before it expires' }),
    ],
    [
      c => ({ subject: 'Forget something?', preheader: `Your ${c.brand} cart misses you` }),
      c => ({ subject: `${c.offer} — on the house`, preheader: 'One last nudge for the items you loved' }),
    ],
  ],
  'nurture': [
    [
      c => ({ subject: `Getting the most from ${c.brand}`, preheader: 'Your quick-start guide is inside' }),
      c => ({ subject: 'How Mia doubled her results', preheader: `A real ${c.brand} customer story — plus ${c.offer}` }),
    ],
    [
      c => ({ subject: 'Your guide is inside', preheader: `Everything ${c.brand} can do for you` }),
      c => ({ subject: 'Proof it works', preheader: `Case study: from first ${c.brand} order to loyal fan` }),
    ],
  ],
  'advocacy': [
    [
      c => ({ subject: `You're one of ${c.brand}'s best`, preheader: 'VIP perks, unlocked' }),
      c => ({ subject: `Give ${c.offer}, get ${c.offer}`, preheader: 'Share the love with a friend' }),
    ],
    [
      c => ({ subject: 'Welcome to the inner circle', preheader: `${c.brand} VIP status starts now` }),
      c => ({ subject: 'Know someone who\'d love this?', preheader: `Refer a friend — ${c.offer} for you both` }),
    ],
  ],
  're-engagement': [
    [
      c => ({ subject: `It's been a while…`, preheader: `Here's what's new at ${c.brand}` }),
      c => ({ subject: 'Should we stop emailing you?', preheader: `One click keeps ${c.brand} in your inbox` }),
    ],
    [
      c => ({ subject: `We miss you at ${c.brand}`, preheader: `${c.offer} if you come back this week` }),
      c => ({ subject: 'Last email from us (really)', preheader: `Tell ${c.brand} if you want to keep in touch` }),
    ],
  ],
  'lapsed-buyer': [
    [
      c => ({ subject: `We saved you a seat (and ${c.offer})`, preheader: `Come back to ${c.brand} this week` }),
      c => ({ subject: `Your ${c.offer} goodbye gift`, preheader: 'It expires in 48 hours' }),
      c => ({ subject: 'One last thing before we go', preheader: `A final offer from ${c.brand}` }),
    ],
    [
      c => ({ subject: `${c.offer} to welcome you back`, preheader: `New arrivals at ${c.brand} since your last order` }),
      c => ({ subject: 'Did we do something wrong?', preheader: `Tell us — and take ${c.offer}` }),
      c => ({ subject: 'Final call on your offer', preheader: `${c.offer} disappears at midnight` }),
    ],
  ],
}

function copyContext(brief: JourneyBrief): CopyContext {
  return {
    brand: brief.brand?.trim() || 'our store',
    offer: brief.offer?.trim() || 'a little thank-you',
  }
}

/** Send-email nodes in flat order, with subject/preheader rewritten from the brief. */
function personalize(nodes: FlowNode[], brief: JourneyBrief, seed: number): void {
  const pools = copyPools[brief.goal]
  const pool = pools[seed % pools.length]!
  const ctx = copyContext(brief)
  let emailIndex = 0
  for (const node of nodes) {
    if (node.kind === 'send-email') {
      const line = pool[emailIndex % pool.length]!(ctx)
      node.title = `Send: ${line.subject}`
      node.subtitle = `Preheader: “${line.preheader}”`
      node.config = { ...node.config, subject: line.subject }
      node.configured = true
      emailIndex++
    }
    // Point the trigger at the chosen audience where the schema allows it.
    if (node.category === 'trigger') {
      const fields = catalogByKind[node.kind]?.fields ?? []
      if (fields.some(f => f.key === 'list')) {
        node.config = { ...node.config, list: brief.audience }
        node.subtitle = brief.audience
      } else if (fields.some(f => f.key === 'segment')) {
        node.config = { ...node.config, segment: brief.audience }
        node.subtitle = `Segment: ${brief.audience}`
      }
      node.configured = true
    }
  }
}

const delayText = (node: FlowNode): string => {
  const duration = Number(node.config.duration) || 0
  const unit = String(node.config.unit || 'Days')
  return duration ? `After ${duration} ${duration === 1 ? unit.replace(/s$/, '').toLowerCase() : unit.toLowerCase()}` : node.title
}

/** Derives the email-sequence table from the flow itself. */
export function deriveSequence(nodes: FlowNode[]): EmailRow[] {
  const rows: EmailRow[] = []
  let pendingDelay = 'Immediately'
  for (const node of nodes) {
    if (node.category === 'delay') pendingDelay = delayText(node)
    if (node.kind === 'send-email') {
      const subject = String(node.config.subject || node.title.replace(/^Send: /, ''))
      const preheader = node.subtitle.replace(/^Preheader: [“"]?/, '').replace(/[”"]$/, '')
      rows.push({ order: rows.length + 1, subject, preheader, delay: pendingDelay })
      pendingDelay = 'Immediately after previous'
    }
  }
  return rows
}

function buildRationale(nodes: FlowNode[], brief: JourneyBrief): string {
  const emails = nodes.filter(n => n.kind === 'send-email').length
  const branches = nodes.filter(n => n.category === 'filter').length
  const days = nodes.filter(n => n.category === 'delay')
    .reduce((a, n) => a + (String(n.config.unit) === 'Days' ? Number(n.config.duration) || 0 : 0), 0)
  const brand = brief.brand?.trim()
  const label = goalLabel[brief.goal].toLowerCase()
  const article = /^[aeiou]/.test(label) ? 'An' : 'A'
  return `${article} ${label} flow for ${brief.audience}${brand ? ` from ${brand}` : ''}: `
    + `${emails} ${emails === 1 ? 'email' : 'emails'}${days ? ` over ~${days} ${days === 1 ? 'day' : 'days'}` : ''}`
    + `${branches ? `, with ${branches} ${branches === 1 ? 'branch' : 'branches'} reacting to what contacts do` : ''}.`
}

function lastMainNodeId(nodes: FlowNode[]): string {
  let currentId = nodes[0]?.id ?? ''
  let guard = 0
  while (currentId && guard++ < 200) {
    const node = nodes.find(n => n.id === currentId)
    if (!node || !node.children[0]) break
    currentId = node.children[0]
  }
  return currentId
}

function finishDraft(nodes: FlowNode[], brief: JourneyBrief): JourneyDraft {
  const brand = brief.brand?.trim()
  return {
    nodes,
    sequence: deriveSequence(nodes),
    rationale: buildRationale(nodes, brief),
    suggestedName: `${brand ? `${brand} — ` : ''}${goalLabel[brief.goal]}`,
  }
}

/** Builds a fresh draft. `seed` rotates copy variants (Regenerate bumps it). */
export function generateJourneyDraft(brief: JourneyBrief, seed = 0): JourneyDraft {
  const nodes = instantiateTemplate(brief.goal, 0)
  for (const node of nodes) node.configured = node.configured || node.category === 'trigger'
  personalize(nodes, brief, seed)
  return finishDraft(nodes, brief)
}

// ── Data journeys: describe-to-draft ─────────────────────────────────────────

export interface DataJourneyHint {
  templateId: string
  name: string
  frequency?: string
}

/** Scripted parse of a plain-English data-journey description. */
export function parseDataJourneyDescription(text: string): DataJourneyHint | null {
  const t = text.toLowerCase()
  let templateId: string | null = null
  if (/salesforce|crm|lead/.test(t)) templateId = 'salesforce-sync'
  else if (/shopify|order/.test(t)) templateId = 'shopify-orders'
  else if (/export|warehouse|sftp|backup|s3/.test(t)) templateId = 'warehouse-export'
  if (!templateId) return null

  let frequency: string | undefined
  if (/15 ?min/.test(t)) frequency = 'Every 15 minutes'
  else if (/hour/.test(t)) frequency = 'Hourly'
  else if (/daily|nightly|every day|night/.test(t)) frequency = 'Daily'
  else if (/week/.test(t)) frequency = 'Weekly'

  const base = dataTemplateById[templateId]!.name
  return { templateId, name: frequency ? `${base} (${frequency.toLowerCase()})` : base, frequency }
}

/** Applies a one-tap refinement to an existing draft (mutates a copy). */
export function applyRefinement(draft: JourneyDraft, kind: RefinementKind, brief: JourneyBrief, seed = 0): JourneyDraft {
  if (kind === 'regenerate') return generateJourneyDraft(brief, seed)

  const nodes = draft.nodes.map(n => ({ ...n, children: [...n.children], config: { ...n.config } }))

  if (kind === 'shorter') {
    const emails = nodes.filter(n => n.kind === 'send-email')
    if (emails.length > 1) {
      const last = emails[emails.length - 1]!
      // Drop the delay sitting immediately before the removed email, if any.
      const parent = nodes.find(n => n.children.includes(last.id))
      removeNode(nodes, last.id)
      if (parent && parent.category === 'delay') removeNode(nodes, parent.id)
    }
  }

  if (kind === 'more-urgent') {
    const ctx = copyContext(brief)
    for (const node of nodes) {
      if (node.category === 'delay' && Number(node.config.duration) > 1) {
        const halved = Math.max(1, Math.floor(Number(node.config.duration) / 2))
        node.config.duration = halved
        node.title = `Wait ${halved} ${String(node.config.unit || 'Days')}`
      }
      if (node.kind === 'send-email' && !String(node.config.subject).includes('⏰')) {
        const subject = `⏰ ${node.config.subject || node.title.replace(/^Send: /, '')}`
        node.config.subject = subject
        node.title = `Send: ${subject}`
        node.subtitle = `Preheader: “Ends soon — ${ctx.offer}”`
      }
    }
  }

  if (kind === 'add-winback-branch') {
    const alreadyHasCheck = nodes.some(n => n.category === 'filter' && n.title === 'Purchased since?')
    if (!alreadyHasCheck) {
      const ctx = copyContext(brief)
      // The win-back check belongs after the last email touch, not the main-path tail
      // (which can sit inside an earlier YES branch).
      const emails = nodes.filter(n => n.kind === 'send-email')
      const tail = emails.length ? emails[emails.length - 1]!.id : lastMainNodeId(nodes)
      const split = addNodeAfter(nodes, tail, catalogByKind['yes-no']!)
      split.title = 'Purchased since?'
      split.subtitle = 'Check for a completed order'
      split.configured = true
      const tagged = addNodeAfter(nodes, split.id, catalogByKind['change-tags']!, 0)
      tagged.title = 'Apply Tag: Won Back'
      tagged.subtitle = 'Recovered — no more sends'
      tagged.config = { tag: 'Won Back', operation: 'Apply tag' }
      tagged.configured = true
      const winback = addNodeAfter(nodes, split.id, catalogByKind['send-email']!, 1)
      const subject = `Come back for ${ctx.offer}`
      winback.title = `Send: ${subject}`
      winback.subtitle = `Preheader: “We'd love another chance”`
      winback.config = { subject, template: 'Win-Back Offer' }
      winback.configured = true
    }
  }

  return finishDraft(nodes, brief)
}
