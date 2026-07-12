import { defineStore } from 'pinia'
import { ref } from 'vue'

export type FormType = 'Popup' | 'Embedded'
export type FormStatus = 'Draft' | 'Active' | 'Published' | 'Paused'
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
  status: FormStatus
  views: number
  conversions: number
  rate: number
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

export function embedScriptFor(form: AcquisitionForm) {
  const script = `<script src="https://forms.maropost.com/embed/${form.id}.js" async><\/script>`
  const manual = `<div id="mp-form-${form.id}"></div>\n<script>\n  window.MaropostForms = window.MaropostForms || [];\n  window.MaropostForms.push({ formId: "${form.id}", target: "#mp-form-${form.id}" });\n<\/script>`
  return { script, manual }
}

export const useFormsStore = defineStore('forms', () => {
  const forms = ref<AcquisitionForm[]>([
    {
      id: 1, name: 'Main Website Pop-up', type: 'Popup', status: 'Active', views: 45000, conversions: 1200, rate: 2.7,
      updated: 'Mar 5, 2026', createdAt: 'Feb 1, 2026', publishedAt: 'Feb 3, 2026',
      headline: 'Get 10% off your first order', buttonLabel: 'Claim my discount', collectName: false, accent: 'primary',
      subscriptionListIds: ['newsletter'], domains: ['mystore.com'],
      display: defaultDisplay(), design: defaultDesign(), optional: defaultOptional(),
      mainFormBlocks: defaultMainBlocks(), thankYouBlocks: defaultThankYouBlocks(),
    },
    {
      id: 2, name: 'Blog Sidebar Form', type: 'Embedded', status: 'Active', views: 85000, conversions: 350, rate: 0.4,
      updated: 'Feb 28, 2026', createdAt: 'Jan 10, 2026', publishedAt: 'Jan 12, 2026',
      headline: 'Subscribe to our newsletter', buttonLabel: 'Subscribe', collectName: false, accent: 'info',
      subscriptionListIds: ['newsletter', 'master'], domains: ['blog.mystore.com'],
      display: defaultDisplay(), design: defaultDesign(), optional: defaultOptional(),
      mainFormBlocks: defaultMainBlocks(), thankYouBlocks: defaultThankYouBlocks(),
    },
    {
      id: 3, name: 'Exit Intent 2026', type: 'Popup', status: 'Draft', views: 12000, conversions: 45, rate: 0.4,
      updated: 'Mar 1, 2026', createdAt: 'Mar 1, 2026', publishedAt: null,
      headline: "Wait — don't leave empty-handed", buttonLabel: 'Reveal my offer', collectName: false, accent: 'warning',
      subscriptionListIds: ['promo'], domains: [],
      display: { ...defaultDisplay(), displayOn: 'exit' }, design: defaultDesign(), optional: defaultOptional(),
      mainFormBlocks: defaultMainBlocks(), thankYouBlocks: defaultThankYouBlocks(),
    },
    {
      id: 4, name: 'Holiday VIP Sign-up', type: 'Popup', status: 'Draft', views: 0, conversions: 0, rate: 0,
      updated: 'Mar 7, 2026', createdAt: 'Mar 7, 2026', publishedAt: null,
      headline: 'Join the VIP list', buttonLabel: 'Count me in', collectName: true, accent: 'secondary',
      subscriptionListIds: ['vip'], domains: [],
      display: defaultDisplay(), design: defaultDesign(), optional: defaultOptional(),
      mainFormBlocks: defaultMainBlocks(), thankYouBlocks: defaultThankYouBlocks(),
    },
    {
      id: 5, name: 'Footer Newsletter', type: 'Embedded', status: 'Paused', views: 32000, conversions: 880, rate: 2.8,
      updated: 'Jan 15, 2026', createdAt: 'Dec 1, 2025', publishedAt: 'Dec 3, 2025',
      headline: 'Stay in the loop', buttonLabel: 'Sign up', collectName: false, accent: 'success',
      subscriptionListIds: ['newsletter'], domains: ['mystore.com'],
      display: defaultDisplay(), design: defaultDesign(), optional: defaultOptional(),
      mainFormBlocks: defaultMainBlocks(), thankYouBlocks: defaultThankYouBlocks(),
    },
  ])

  function nextId() {
    return Math.max(0, ...forms.value.map(f => f.id)) + 1
  }

  function createForm(input: FormBuilderInput): number {
    const id = nextId()
    const now = 'Just now'
    forms.value.unshift({
      id,
      name: input.name,
      type: input.type,
      status: 'Draft',
      views: 0,
      conversions: 0,
      rate: 0,
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
    f.updated = 'Just now'
  }

  function publish(id: number) {
    const f = forms.value.find(x => x.id === id)
    if (!f) return
    f.status = 'Published'
    f.publishedAt = 'Just now'
    f.updated = 'Just now'
  }

  function duplicate(id: number) {
    const f = forms.value.find(x => x.id === id)
    if (!f) return
    forms.value.unshift({ ...f, id: nextId(), name: `${f.name} (Copy)`, status: 'Draft', views: 0, conversions: 0, rate: 0, updated: 'Just now', publishedAt: null })
  }

  function remove(ids: number[]) {
    forms.value = forms.value.filter(f => !ids.includes(f.id))
  }

  function setStatus(ids: number[], status: FormStatus) {
    for (const f of forms.value) if (ids.includes(f.id)) f.status = status
  }

  return { forms, createForm, updateForm, publish, duplicate, remove, setStatus }
})
