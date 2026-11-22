import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  uniqueSlug,
  withoutEmail,
  type Inbox,
  type ReplyTemplate,
  type ServiceAgent,
  type SupportEmail,
  type TagColor,
  type TicketTag,
  type TicketTypeDef,
} from '@/service/model'
import { useTicketsStore } from '@/stores/useTickets'

/**
 * Service desk configuration (Settings › Service). Seeded from the UAT audit of
 * 5 Nov 2026: Inboxes (+ support emails, assignment, SLA, signature,
 * acknowledgement), Reply templates, Ticket types, Tags, Agents.
 *
 * Tickets reference types, tags and agents by name, so renames and deletes here
 * are carried through to the tickets store (and its saved views).
 */

export const CRM_OPTIONS = ['Maropost CDP', 'HubSpot', 'Salesforce']

export const DEFAULT_SIGNATURE = '<p>Best regards,</p><p>{{AGENT_NAME}}<br>{{AGENT_JOB_TITLE}}</p>'

const SEED_DATE = '2026-09-01T09:00:00Z'

export const useServiceSettingsStore = defineStore('serviceSettings', () => {
  let seq = 100
  const nextId = (prefix: string) => `${prefix}-${seq++}`
  const now = () => new Date().toISOString()

  // ── Inboxes & support emails ──────────────────────────────────────────────
  const inboxes = ref<Inbox[]>([
    {
      id: 'support',
      name: 'Customer support',
      description: 'Product questions, delivery problems and general help.',
      crm: 'Maropost CDP',
      assignment: 'round-robin',
      slaMinutes: 240,
      signature: DEFAULT_SIGNATURE,
      acknowledgement: { enabled: true, fromEmailId: 'em-support', templateId: 'tpl-request-received' },
      createdAt: '2026-03-02T09:00:00Z',
    },
    {
      id: 'orders',
      name: 'Orders & returns',
      description: 'Cancellations, exchanges and refunds.',
      crm: '',
      assignment: 'manual',
      slaMinutes: 120,
      signature: DEFAULT_SIGNATURE,
      acknowledgement: { enabled: false, fromEmailId: null, templateId: null },
      createdAt: '2026-10-28T09:00:00Z',
    },
  ])

  const supportEmails = ref<SupportEmail[]>([
    { id: 'em-support', inboxId: 'support', name: 'Support', address: 'support@maropost.com', status: 'Verified', isDefault: true },
    { id: 'em-sushant', inboxId: 'support', name: 'Sushant Rana', address: 'sushant@maropost.com', status: 'Verified', isDefault: false },
    // Still waiting on its verification link — this inbox can't send replies yet.
    { id: 'em-orders', inboxId: 'orders', name: 'Orders', address: 'orders@maropost.com', status: 'Pending', isDefault: true },
  ])

  const findInbox = (id: string) => inboxes.value.find(i => i.id === id)
  const inboxName = (id: string) => findInbox(id)?.name ?? id
  const emailsFor = (inboxId: string) => supportEmails.value.filter(e => e.inboxId === inboxId)

  function createInbox(payload: {
    name: string
    description: string
    crm: string
    email?: { name: string; address: string }
  }): string {
    const id = uniqueSlug(payload.name, inboxes.value.map(i => i.id))
    inboxes.value.push({
      id,
      name: payload.name.trim(),
      description: payload.description.trim(),
      crm: payload.crm,
      assignment: 'manual',
      slaMinutes: null,
      signature: DEFAULT_SIGNATURE,
      acknowledgement: { enabled: false, fromEmailId: null, templateId: null },
      createdAt: now(),
    })
    if (payload.email) addSupportEmail(id, payload.email)
    return id
  }

  function updateInbox(id: string, patch: Partial<Omit<Inbox, 'id' | 'createdAt'>>) {
    const inbox = findInbox(id)
    if (inbox) Object.assign(inbox, patch)
  }

  /** Its tickets move to `moveTicketsTo`; its templates become available in every inbox. */
  function deleteInbox(id: string, moveTicketsTo: string) {
    useTicketsStore().moveInbox(id, moveTicketsTo)
    supportEmails.value = supportEmails.value.filter(e => e.inboxId !== id)
    replyTemplates.value.forEach(t => { if (t.inboxId === id) t.inboxId = null })
    inboxes.value = inboxes.value.filter(i => i.id !== id)
  }

  /** New addresses start Pending until their verification link is clicked. */
  function addSupportEmail(inboxId: string, payload: { name: string; address: string }): string {
    const id = nextId('em')
    supportEmails.value.push({
      id,
      inboxId,
      name: payload.name.trim(),
      address: payload.address.trim().toLowerCase(),
      status: 'Pending',
      isDefault: emailsFor(inboxId).length === 0,
    })
    return id
  }

  function makeDefaultEmail(emailId: string) {
    const email = supportEmails.value.find(e => e.id === emailId)
    if (!email) return
    supportEmails.value.forEach(e => { if (e.inboxId === email.inboxId) e.isDefault = e.id === emailId })
  }

  function removeSupportEmail(emailId: string) {
    supportEmails.value = withoutEmail(supportEmails.value, emailId)
    inboxes.value.forEach(inbox => {
      if (inbox.acknowledgement.fromEmailId === emailId) {
        inbox.acknowledgement = { ...inbox.acknowledgement, enabled: false, fromEmailId: null }
      }
    })
  }

  // ── Reply & notification templates ────────────────────────────────────────
  const replyTemplates = ref<ReplyTemplate[]>([
    {
      id: 'tpl-request-received', name: 'Request received', kind: 'reply', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>Hi {{CONTACT_FIRST_NAME}},</p><p>Thanks for getting in touch. We’ve received your request “{{TICKET_SUBJECT}}” ({{TICKET_NUMBER}}) and will get back to you soon.</p><p>Best regards,<br>The support team</p>',
    },
    {
      id: 'tpl-refund-issued', name: 'Refund issued', kind: 'reply', inboxId: 'orders', attachments: [], updatedAt: SEED_DATE,
      body: '<p>Hi {{CONTACT_FIRST_NAME}},</p><p>Your refund has been issued today. It usually shows on your statement within 3–5 business days.</p>',
    },
    {
      id: 'tpl-exchange-label', name: 'Exchange label sent', kind: 'reply', inboxId: 'orders', attachments: ['returns-label.pdf'], updatedAt: SEED_DATE,
      body: '<p>Hi {{CONTACT_FIRST_NAME}},</p><p>Your exchange label is attached. Drop the parcel at any post office and we’ll ship the new size as soon as it arrives.</p>',
    },
    {
      id: 'tpl-where-is-order', name: 'Where is my order?', kind: 'reply', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>Hi {{CONTACT_FIRST_NAME}},</p><p>Your order is on its way. You can follow it with the tracking link in your shipping confirmation email.</p>',
    },
    {
      id: 'tpl-how-to-login', name: 'How to log in', kind: 'reply', inboxId: 'support', attachments: [], updatedAt: SEED_DATE,
      body: '<p>Hi {{CONTACT_FIRST_NAME}},</p><p>Use “Forgot password” on the sign-in page and we’ll email you a reset link.</p>',
    },
    {
      id: 'tpl-agent-assigned', name: 'Agent assigned', kind: 'notification', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>{{AGENT_NAME}}, ticket {{TICKET_NUMBER}} “{{TICKET_SUBJECT}}” has been assigned to you.</p>',
    },
    {
      id: 'tpl-agent-customer-replied', name: 'Agent: customer replied', kind: 'notification', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>{{CONTACT_NAME}} replied on {{TICKET_NUMBER}} “{{TICKET_SUBJECT}}”.</p>',
    },
    {
      id: 'tpl-agent-ticket-closed', name: 'Agent: ticket closed', kind: 'notification', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>Ticket {{TICKET_NUMBER}} “{{TICKET_SUBJECT}}” was closed.</p>',
    },
    {
      id: 'tpl-cc-agent-replied', name: 'CC: agent replied', kind: 'notification', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>{{AGENT_NAME}} replied on {{TICKET_NUMBER}} “{{TICKET_SUBJECT}}”.</p>',
    },
    {
      id: 'tpl-cc-ticket-closed', name: 'CC: ticket closed', kind: 'notification', inboxId: null, attachments: [], updatedAt: SEED_DATE,
      body: '<p>{{TICKET_NUMBER}} “{{TICKET_SUBJECT}}” has been closed. Reply to this email to reopen it.</p>',
    },
  ])

  const findTemplate = (id: string) => replyTemplates.value.find(t => t.id === id)

  function createTemplate(payload: Omit<ReplyTemplate, 'id' | 'updatedAt'>): string {
    const id = nextId('tpl')
    replyTemplates.value.push({ ...payload, name: payload.name.trim(), id, updatedAt: now() })
    return id
  }

  function updateTemplate(id: string, patch: Partial<Omit<ReplyTemplate, 'id'>>) {
    const tpl = findTemplate(id)
    if (tpl) Object.assign(tpl, patch, { updatedAt: now() })
  }

  /** An inbox acknowledging with this template stops acknowledging rather than send nothing. */
  function deleteTemplate(id: string) {
    replyTemplates.value = replyTemplates.value.filter(t => t.id !== id)
    inboxes.value.forEach(inbox => {
      if (inbox.acknowledgement.templateId === id) {
        inbox.acknowledgement = { ...inbox.acknowledgement, enabled: false, templateId: null }
      }
    })
  }

  // ── Ticket types ──────────────────────────────────────────────────────────
  const ticketTypes = ref<TicketTypeDef[]>([
    { id: 'type-customer-request', name: 'Customer Request', description: 'General questions and requests from shoppers.' },
    { id: 'type-bug', name: 'Bug', description: 'Something on the store or in the app isn’t working.' },
    { id: 'type-technical-support', name: 'Technical Support', description: 'Help with accounts, sign-in or integrations.' },
    { id: 'type-service-request', name: 'Service Request', description: 'A change the team needs to make for the customer.' },
    { id: 'type-pricing', name: 'Pricing', description: 'Quotes, bulk orders and discounts.' },
    { id: 'type-payment', name: 'Payment', description: 'Charges, refunds and failed payments.' },
    { id: 'type-product-enquiry', name: 'Product Enquiry', description: 'Sizing, materials, stock and availability.' },
    { id: 'type-incident', name: 'Incident', description: 'Outages or problems affecting many customers.' },
  ])

  function createType(payload: { name: string; description: string }): string {
    const id = nextId('type')
    ticketTypes.value.push({ id, name: payload.name.trim(), description: payload.description.trim() })
    return id
  }

  function updateType(id: string, patch: { name: string; description: string }) {
    const type = ticketTypes.value.find(t => t.id === id)
    if (!type) return
    const name = patch.name.trim()
    if (name !== type.name) useTicketsStore().renameValue('type', type.name, name)
    Object.assign(type, { name, description: patch.description.trim() })
  }

  function deleteType(id: string) {
    const type = ticketTypes.value.find(t => t.id === id)
    if (!type) return
    useTicketsStore().removeValue('type', type.name)
    ticketTypes.value = ticketTypes.value.filter(t => t.id !== id)
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  const tags = ref<TicketTag[]>([
    { id: 'tag-500-error', name: '500 Error', color: 'red', createdAt: '2026-04-06T06:26:00Z', updatedAt: '2026-09-24T02:32:00Z' },
    { id: 'tag-vip', name: 'VIP', color: 'violet', createdAt: '2026-02-23T02:32:00Z', updatedAt: '2026-02-23T02:32:00Z' },
    { id: 'tag-refund', name: 'Refund', color: 'amber', createdAt: '2026-02-05T11:11:00Z', updatedAt: '2026-02-05T11:11:00Z' },
    { id: 'tag-order-issue', name: 'Order Issue', color: 'orange', createdAt: '2026-01-22T03:47:00Z', updatedAt: '2026-01-22T03:47:00Z' },
    { id: 'tag-loyalty', name: 'Loyalty', color: 'green', createdAt: '2026-01-06T07:22:00Z', updatedAt: '2026-01-06T07:22:00Z' },
    { id: 'tag-escalated', name: 'Escalated', color: 'sky', createdAt: '2025-10-28T23:10:00Z', updatedAt: '2025-10-28T23:10:00Z' },
  ])

  const tagByName = (name: string) => tags.value.find(t => t.name === name)

  function createTag(payload: { name: string; color: TagColor }): string {
    const id = nextId('tag')
    tags.value.push({ id, name: payload.name.trim(), color: payload.color, createdAt: now(), updatedAt: now() })
    return id
  }

  function updateTag(id: string, patch: { name: string; color: TagColor }) {
    const tag = tags.value.find(t => t.id === id)
    if (!tag) return
    const name = patch.name.trim()
    if (name !== tag.name) useTicketsStore().renameValue('tag', tag.name, name)
    Object.assign(tag, { name, color: patch.color, updatedAt: now() })
  }

  function deleteTag(id: string) {
    const tag = tags.value.find(t => t.id === id)
    if (!tag) return
    useTicketsStore().removeValue('tag', tag.name)
    tags.value = tags.value.filter(t => t.id !== id)
  }

  // ── Agents ────────────────────────────────────────────────────────────────
  // Agents come from Users; here they only get their service profile. Name and
  // job title feed the {{AGENT_NAME}} / {{AGENT_JOB_TITLE}} signature tags.
  const agents = ref<ServiceAgent[]>([
    { id: 'agent-chris', name: 'Chris Parker', email: 'chris.parker@maropost.com', nickname: 'Chris', jobTitle: 'Support lead', phone: '+1 416 555 0101' },
    { id: 'agent-sushant', name: 'Sushant Rana', email: 'sushant@maropost.com', nickname: 'Sushant', jobTitle: 'Senior support executive', phone: '' },
    { id: 'agent-deepak', name: 'Deepak Vaidya', email: 'deepak.v@maropost.com', nickname: 'Deepak', jobTitle: 'Support executive', phone: '' },
    { id: 'agent-priya', name: 'Priya Shah', email: 'priya.shah@maropost.com', nickname: '', jobTitle: 'Store operations', phone: '+1 416 555 0144' },
  ])

  function updateAgent(id: string, patch: Partial<Omit<ServiceAgent, 'id' | 'email'>>) {
    const agent = agents.value.find(a => a.id === id)
    if (!agent) return
    if (patch.name && patch.name.trim() !== agent.name) useTicketsStore().renameValue('agent', agent.name, patch.name.trim())
    Object.assign(agent, patch)
  }

  // Name lists for selects and filters across the ticket screens.
  const typeNames = computed(() => ticketTypes.value.map(t => t.name))
  const tagNames = computed(() => tags.value.map(t => t.name))
  const agentNames = computed(() => agents.value.map(a => a.name))
  /** A ticket tag's colour from Settings › Tags; a name with no entry there reads as slate. */
  const tagColor = (name: string): TagColor => tags.value.find(t => t.name === name)?.color ?? 'slate'

  return {
    inboxes,
    supportEmails,
    replyTemplates,
    ticketTypes,
    tags,
    agents,
    typeNames,
    tagNames,
    agentNames,
    tagColor,
    findInbox,
    inboxName,
    emailsFor,
    createInbox,
    updateInbox,
    deleteInbox,
    addSupportEmail,
    makeDefaultEmail,
    removeSupportEmail,
    findTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createType,
    updateType,
    deleteType,
    tagByName,
    createTag,
    updateTag,
    deleteTag,
    updateAgent,
  }
})
