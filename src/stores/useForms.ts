import { defineStore } from 'pinia'
import { ref } from 'vue'

export type FormType = 'Popup' | 'Embedded'
export type FormStatus = 'Draft' | 'Active' | 'Published' | 'Paused'

/**
 * Which builder authored the form. The source shows this as the list's "Form Type"
 * column; older records were made in a builder that is no longer offered.
 */
export type FormBuilderType = 'Drag and Drop' | 'Legacy'
export type DisplayOn = 'entry' | 'exit' | 'scroll'
export type PopupPosition =
  | 'classic-center' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  | 'drawer-left' | 'drawer-right' | 'bar-bottom' | 'bar-top'
export type FormBlockType =
  | 'title' | 'paragraph' | 'list' | 'image' | 'divider' | 'spacer' | 'social' | 'html' | 'video' | 'icons' | 'text' | 'email_submit'

export interface FormBlock {
  id: string
  type: FormBlockType
  text: string
  items: string[]
  alt: string
  height: number
  align: 'left' | 'center' | 'right'
}

export interface FormDisplayRules {
  dontShowAgainAfterSubmit: boolean
  displayOn: DisplayOn
  scrollPercent: number
  urlTargetingEnabled: boolean
  urlTargets: string[]
  hideForDaysEnabled: boolean
  hideForDays: number
}

export interface FormDesign {
  position: PopupPosition
  width: number
  height: number
  fitHeight: boolean
  paddingTop: number
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  borderColor: string
  borderThickness: number
  borderRadius: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetH: number
  shadowOffsetV: number
  overlayColor: string
  overlayOpacity: number
  backgroundType: 'color' | 'image'
  backgroundColor: string
  backgroundImage: string
}

export interface FormOptionalFunctions {
  redirectEnabled: boolean
  redirectUrl: string
  notifyEmailEnabled: boolean
  notifyEmail: string
  recaptchaEnabled: boolean
  doubleOptInEnabled: boolean
}

export interface AcquisitionForm {
  id: number
  name: string
  type: FormType
  /** The list's Form Type column. */
  builderType: FormBuilderType
  status: FormStatus
  /** The list's Status switch — whether the form is live on the merchant's site. */
  enabled: boolean
  folderId: string | null
  updated: string
  createdAt: string
  publishedAt: string | null
  // Mini-preview / list accent
  headline: string
  buttonLabel: string
  collectName: boolean
  accent: 'primary' | 'success' | 'warning' | 'secondary' | 'info' | 'error'
  // Builder config
  subscriptionListIds: string[]
  domains: string[]
  display: FormDisplayRules
  design: FormDesign
  optional: FormOptionalFunctions
  mainFormBlocks: FormBlock[]
  thankYouBlocks: FormBlock[]
}

export const SUBSCRIPTION_LISTS = [
  { id: 'newsletter', name: 'Newsletter Subscribers', count: 48213 },
  { id: 'vip', name: 'VIP Customer Circle', count: 5120 },
  { id: 'master', name: 'Master Subscriber List', count: 92044 },
  { id: 'promo', name: 'Promotional List', count: 21876 },
]

export const POPUP_POSITIONS: { value: PopupPosition; label: string }[] = [
  { value: 'classic-center', label: 'Classic — Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'drawer-left', label: 'Drawer — Left' },
  { value: 'drawer-right', label: 'Drawer — Right' },
  { value: 'bar-bottom', label: 'Bar — Bottom' },
  { value: 'bar-top', label: 'Bar — Top' },
]

let blockSeq = 0
function makeBlockId() {
  blockSeq += 1
  return `fb${blockSeq}`
}

export function defaultFormBlock(type: FormBlockType): FormBlock {
  const base: FormBlock = { id: makeBlockId(), type, text: '', items: [], alt: '', height: 24, align: 'left' }
  switch (type) {
    case 'title': return { ...base, text: 'Join our VIP list', align: 'center' }
    case 'paragraph': return { ...base, text: 'Get exclusive deals, early access & more.', align: 'center' }
    case 'list': return { ...base, items: ['Exclusive discounts', 'Early access to drops', 'Members-only content'] }
    case 'image': return { ...base, alt: 'Hero image' }
    case 'html': return { ...base, text: '<!-- custom HTML -->' }
    case 'text': return { ...base, text: 'We respect your privacy. Unsubscribe anytime.', align: 'center' }
    default: return base
  }
}

function defaultMainBlocks(): FormBlock[] {
  return [
    defaultFormBlock('title'),
    defaultFormBlock('paragraph'),
    { ...defaultFormBlock('email_submit'), text: 'Subscribe Now' },
  ]
}

function defaultThankYouBlocks(): FormBlock[] {
  return [
    { ...defaultFormBlock('title'), text: "You're in! 🎉" },
    { ...defaultFormBlock('paragraph'), text: 'Thanks for subscribing. Watch your inbox for exclusive offers.' },
  ]
}

function defaultDisplay(): FormDisplayRules {
  return {
    dontShowAgainAfterSubmit: true,
    displayOn: 'entry',
    scrollPercent: 50,
    urlTargetingEnabled: false,
    urlTargets: [],
    hideForDaysEnabled: false,
    hideForDays: 7,
  }
}

function defaultDesign(): FormDesign {
  return {
    position: 'classic-center',
    width: 420,
    height: 0,
    fitHeight: true,
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 32,
    paddingRight: 32,
    borderColor: '#00000000',
    borderThickness: 0,
    borderRadius: 16,
    shadowColor: '#00000040',
    shadowBlur: 24,
    shadowOffsetH: 0,
    shadowOffsetV: 8,
    overlayColor: '#000000',
    overlayOpacity: 60,
    backgroundType: 'color',
    backgroundColor: '#1A1A2E',
    backgroundImage: '',
  }
}

function defaultOptional(): FormOptionalFunctions {
  return {
    redirectEnabled: false,
    redirectUrl: '',
    notifyEmailEnabled: false,
    notifyEmail: '',
    recaptchaEnabled: false,
    doubleOptInEnabled: false,
  }
}

export interface FormBuilderInput {
  name: string
  type: FormType
  subscriptionListIds: string[]
  domains: string[]
  display: FormDisplayRules
  design: FormDesign
  optional: FormOptionalFunctions
  mainFormBlocks: FormBlock[]
  thankYouBlocks: FormBlock[]
  headline?: string
  buttonLabel?: string
  collectName?: boolean
  accent?: AcquisitionForm['accent']
}

export function newFormDefaults(overrides: Partial<FormBuilderInput> = {}): FormBuilderInput {
  return {
    name: '',
    type: 'Popup',
    subscriptionListIds: [],
    domains: [],
    display: defaultDisplay(),
    design: defaultDesign(),
    optional: defaultOptional(),
    mainFormBlocks: defaultMainBlocks(),
    thankYouBlocks: defaultThankYouBlocks(),
    headline: 'Join our VIP list',
    buttonLabel: 'Subscribe Now',
    collectName: false,
    accent: 'primary',
    ...overrides,
  }
}

/**
 * The two embed snippets shown on the builder's final step and in the
 * Show script link dialog. The source leaves the manual variant permanently
 * empty; here it is populated, which is the whole point of offering it.
 */
export function embedScriptFor(form: AcquisitionForm, accountId: string) {
  const script =
    `<script type="text/javascript" async src="https://optin.maropost.com/uploads/${accountId}/acquisition/builder_${form.id}/script.js"><\/script>`
  const manual = [
    `<div id="mp-form-${form.id}"></div>`,
    `<script type="text/javascript">`,
    `  window.MaropostForms = window.MaropostForms || [];`,
    `  window.MaropostForms.push({`,
    `    accountId: "${accountId}",`,
    `    formId: "${form.id}",`,
    `    target: "#mp-form-${form.id}"`,
    `  });`,
    `<\/script>`,
  ].join('\n')
  return { script, manual }
}

/** Seed helper: fills the builder config so each record only states what differs. */
type FormSeed =
  Pick<AcquisitionForm, 'id' | 'name' | 'type' | 'builderType' | 'status' | 'enabled' | 'folderId'
    | 'updated' | 'createdAt' | 'publishedAt' | 'headline' | 'buttonLabel'
    | 'subscriptionListIds' | 'domains'>
  & Partial<Pick<AcquisitionForm, 'collectName' | 'accent' | 'display' | 'design' | 'optional'
    | 'mainFormBlocks' | 'thankYouBlocks'>>

function mkForm(seed: FormSeed): AcquisitionForm {
  return {
    collectName: false,
    accent: 'primary',
    display: defaultDisplay(),
    design: defaultDesign(),
    optional: defaultOptional(),
    mainFormBlocks: defaultMainBlocks(),
    thankYouBlocks: defaultThankYouBlocks(),
    ...seed,
  }
}

export const useFormsStore = defineStore('forms', () => {
  const forms = ref<AcquisitionForm[]>([
    mkForm({
      id: 82, name: 'Remove contact from DNM using AQ form', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: null,
      updated: '2026-08-04T02:45:00Z', createdAt: '2026-08-04T02:45:00Z', publishedAt: '2026-08-04T02:45:00Z',
      headline: 'Rejoin our mailing list', buttonLabel: 'Resubscribe',
      subscriptionListIds: ['newsletter'], domains: ['mystore.com'],
    }),
    mkForm({
      id: 81, name: 'Spring sample sale', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Draft', enabled: false, folderId: null,
      updated: '2026-07-12T01:31:00Z', createdAt: '2026-07-12T01:31:00Z', publishedAt: null,
      headline: 'Make your summer days feeling good', buttonLabel: 'Submit',
      subscriptionListIds: ['promo'], domains: [],
    }),
    mkForm({
      id: 79, name: 'Main website pop-up', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: 'frm-welcome',
      updated: '2026-06-19T15:49:00Z', createdAt: '2026-04-08T06:56:00Z', publishedAt: '2026-04-10T09:12:00Z',
      headline: 'Get 10% off your first order', buttonLabel: 'Claim my discount',
      subscriptionListIds: ['newsletter'], domains: ['mystore.com'],
    }),
    mkForm({
      id: 78, name: 'First order discount', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: 'frm-promotions',
      updated: '2026-03-16T02:24:00Z', createdAt: '2026-01-23T01:45:00Z', publishedAt: '2026-01-25T11:02:00Z',
      headline: 'Get 20% off on your first order.', buttonLabel: 'Subscribe now',
      subscriptionListIds: ['promo', 'newsletter'], domains: ['mystore.com'],
    }),
    mkForm({
      id: 77, name: 'Logged-in opt-in test', type: 'Embedded', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: null,
      updated: '2025-12-19T04:16:00Z', createdAt: '2025-12-19T04:14:00Z', publishedAt: '2025-12-19T04:20:00Z',
      headline: 'Stay in the loop', buttonLabel: 'Sign up',
      subscriptionListIds: ['master'], domains: ['mystore.com'],
    }),
    mkForm({
      id: 76, name: 'Blog sidebar form', type: 'Embedded', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: null,
      updated: '2025-11-25T02:05:00Z', createdAt: '2025-11-25T02:00:00Z', publishedAt: '2025-11-26T08:00:00Z',
      headline: 'Subscribe to our newsletter', buttonLabel: 'Subscribe',
      subscriptionListIds: ['newsletter', 'master'], domains: ['blog.mystore.com'],
    }),
    mkForm({
      id: 75, name: 'Exit intent 2026', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Draft', enabled: false, folderId: 'frm-archive',
      updated: '2025-11-24T01:16:00Z', createdAt: '2025-11-18T10:04:00Z', publishedAt: null,
      headline: "Wait — don't leave empty-handed", buttonLabel: 'Reveal my offer',
      subscriptionListIds: ['promo'], domains: [],
      display: { ...defaultDisplay(), displayOn: 'exit' },
    }),
    mkForm({
      id: 74, name: 'Holiday VIP sign-up', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: 'frm-promotions',
      updated: '2025-11-24T01:07:00Z', createdAt: '2025-05-27T08:38:00Z', publishedAt: '2025-06-01T09:00:00Z',
      headline: 'Join the VIP list', buttonLabel: 'Count me in', collectName: true,
      subscriptionListIds: ['vip'], domains: ['mystore.com'],
    }),
    mkForm({
      id: 73, name: 'Footer newsletter', type: 'Embedded', builderType: 'Drag and Drop',
      status: 'Paused', enabled: false, folderId: null,
      updated: '2025-09-23T09:05:00Z', createdAt: '2025-09-23T09:05:00Z', publishedAt: '2025-09-25T10:00:00Z',
      headline: 'Stay in the loop', buttonLabel: 'Sign up',
      subscriptionListIds: ['newsletter'], domains: ['mystore.com'],
    }),
    mkForm({
      id: 52, name: 'Acquisition form demo', type: 'Popup', builderType: 'Drag and Drop',
      status: 'Published', enabled: true, folderId: 'frm-welcome',
      updated: '2025-08-28T08:38:00Z', createdAt: '2025-08-28T07:12:00Z', publishedAt: '2025-08-29T09:30:00Z',
      headline: 'Be the first to know', buttonLabel: 'Notify me',
      subscriptionListIds: ['newsletter'], domains: [],
    }),
    // Legacy-builder records: read-only in the new builder, kept for the Form Type column.
    mkForm({
      id: 31, name: 'Harpreet acq_builder 001', type: 'Popup', builderType: 'Legacy',
      status: 'Published', enabled: true, folderId: 'frm-harpreet',
      updated: '2022-05-10T04:00:00Z', createdAt: '2022-05-09T08:41:00Z', publishedAt: '2022-05-10T04:00:00Z',
      headline: 'Join the club', buttonLabel: 'Join now',
      subscriptionListIds: ['master'], domains: [],
    }),
    mkForm({
      id: 24, name: 'BN acq builder', type: 'Embedded', builderType: 'Legacy',
      status: 'Draft', enabled: false, folderId: 'frm-manny',
      updated: '2022-11-25T00:44:00Z', createdAt: '2022-11-25T00:44:00Z', publishedAt: null,
      headline: 'Welcome coupon', buttonLabel: 'Get my coupon',
      subscriptionListIds: [], domains: [],
    }),
  ])

  function nextId() {
    return Math.max(0, ...forms.value.map(f => f.id)) + 1
  }

  function createForm(input: FormBuilderInput, folderId: string | null = null): number {
    const id = nextId()
    const now = new Date().toISOString()
    forms.value.unshift({
      id,
      name: input.name,
      type: input.type,
      builderType: 'Drag and Drop',
      status: 'Draft',
      enabled: false,
      folderId,
      updated: now,
      createdAt: now,
      publishedAt: null,
      headline: input.headline ?? 'Join our VIP list',
      buttonLabel: input.buttonLabel ?? 'Subscribe Now',
      collectName: input.collectName ?? false,
      accent: input.accent ?? 'primary',
      subscriptionListIds: input.subscriptionListIds,
      domains: input.domains,
      display: input.display,
      design: input.design,
      optional: input.optional,
      mainFormBlocks: input.mainFormBlocks,
      thankYouBlocks: input.thankYouBlocks,
    })
    return id
  }

  function updateForm(id: number, input: Partial<FormBuilderInput>) {
    const f = forms.value.find(x => x.id === id)
    if (!f) return
    Object.assign(f, input)
    f.updated = new Date().toISOString()
  }

  function getForm(id: number): AcquisitionForm | undefined {
    return forms.value.find(f => f.id === id)
  }

  function publish(id: number) {
    const f = forms.value.find(x => x.id === id)
    if (!f) return
    const now = new Date().toISOString()
    f.status = 'Published'
    f.enabled = true
    f.publishedAt = now
    f.updated = now
  }

  function duplicate(id: number) {
    const f = forms.value.find(x => x.id === id)
    if (!f) return
    const now = new Date().toISOString()
    forms.value.unshift({
      ...f,
      id: nextId(),
      name: `${f.name} (Copy)`,
      status: 'Draft',
      enabled: false,
      updated: now,
      createdAt: now,
      publishedAt: null,
    })
  }

  function remove(ids: number[]) {
    forms.value = forms.value.filter(f => !ids.includes(f.id))
  }

  function setStatus(ids: number[], status: FormStatus) {
    for (const f of forms.value) if (ids.includes(f.id)) f.status = status
  }

  /** The list's Status switch: takes the form live on the merchant's site, or pauses it. */
  function setEnabled(ids: number[], enabled: boolean) {
    const now = new Date().toISOString()
    for (const f of forms.value) {
      if (!ids.includes(f.id)) continue
      f.enabled = enabled
      f.status = enabled ? 'Published' : 'Paused'
      f.updated = now
    }
  }

  function moveToFolder(ids: number[], folderId: string | null) {
    for (const f of forms.value) if (ids.includes(f.id)) f.folderId = folderId
  }

  return {
    forms, getForm, createForm, updateForm, publish, duplicate, remove,
    setStatus, setEnabled, moveToFolder,
  }
})
