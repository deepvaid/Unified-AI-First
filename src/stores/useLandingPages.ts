import { defineStore } from 'pinia'
import { ref } from 'vue'

export type EditorType = 'dnd' | 'wysiwyg'
export type LandingPageStatus = 'Verified' | 'Unverified'
export type LandingPagePublishStatus = 'draft' | 'published'
export type LandingPageBlockType =
  | 'title' | 'paragraph' | 'list' | 'image' | 'button' | 'divider' | 'spacer'
  | 'social' | 'html' | 'video' | 'form' | 'icons' | 'menu' | 'text'

export type Align = 'left' | 'center' | 'right'
export type TitleSize = 'S' | 'M' | 'L' | 'XL'
export type ButtonStyle = 'filled' | 'outline'
export type ButtonSize = 'S' | 'M' | 'L'
export type ImageAspect = '16:9' | '4:3' | '1:1' | 'auto'
export type DividerStyle = 'solid' | 'dashed'
export type SocialNetwork = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok'
export type BaseFont = 'Inter' | 'Georgia' | 'Mono'

export interface LandingMenuLink {
  label: string
  url: string
}

/**
 * Schema-driven block model. Every field is present on every block (matching the
 * project's existing flat-block convention in EmailContentEditor) — only the fields
 * relevant to `type` are surfaced in the settings panel / renderer.
 */
export interface LandingPageBlock {
  id: string
  type: LandingPageBlockType
  // text-ish (title / paragraph / text)
  text: string
  align: Align
  titleSize: TitleSize
  colorOverride: string
  muted: boolean
  // list
  items: string[]
  ordered: boolean
  // image / video
  alt: string
  caption: string
  aspect: ImageAspect
  rounded: boolean
  videoUrl: string
  autoplayLook: boolean
  // button / form submit label
  label: string
  url: string
  buttonStyle: ButtonStyle
  buttonSize: ButtonSize
  fullWidth: boolean
  // form
  fieldName: boolean
  fieldPhone: boolean
  successMessage: string
  // social / icons
  networks: SocialNetwork[]
  iconSet: string[]
  // menu
  links: LandingMenuLink[]
  // html
  code: string
  // spacer
  height: number
  // divider
  dividerStyle: DividerStyle
  dividerWidthPct: number
}

export interface LandingPageStyle {
  backgroundColor: string
  contentWidth: number
  baseFont: BaseFont
  accentColor: string
  buttonRadius: number
}

export interface LandingPageSeo {
  description: string
  pageTitle: string
  redirectAfterExpiry: string
  metaKeywords: string
  tracking: string
}

export interface LandingPage {
  id: number
  name: string
  url: string
  editorType: EditorType
  status: LandingPageStatus
  publishStatus: LandingPagePublishStatus
  publishAt: string
  expireAt: string
  updatedAt: string
  createdAt: string
  seo: LandingPageSeo
  blocks: LandingPageBlock[]
  style: LandingPageStyle
}

let blockSeq = 0
function makeBlockId() {
  blockSeq += 1
  return `lpb${blockSeq}`
}

export function defaultLandingBlock(type: LandingPageBlockType): LandingPageBlock {
  const base: LandingPageBlock = {
    id: makeBlockId(),
    type,
    text: '',
    align: 'left',
    titleSize: 'M',
    colorOverride: '',
    muted: false,
    items: [],
    ordered: false,
    alt: '',
    caption: '',
    aspect: '16:9',
    rounded: false,
    videoUrl: '',
    autoplayLook: false,
    label: '',
    url: '',
    buttonStyle: 'filled',
    buttonSize: 'M',
    fullWidth: false,
    fieldName: true,
    fieldPhone: false,
    successMessage: 'Thanks — you’re subscribed!',
    networks: ['facebook', 'instagram', 'twitter', 'linkedin'],
    iconSet: ['star', 'heart', 'shield-check'],
    links: [{ label: 'Home', url: '' }, { label: 'About', url: '' }, { label: 'Contact', url: '' }],
    code: '<!-- custom HTML -->',
    height: 32,
    dividerStyle: 'solid',
    dividerWidthPct: 100,
  }
  switch (type) {
    case 'title': return { ...base, text: 'Your headline here', align: 'center', titleSize: 'XL' }
    case 'paragraph': return { ...base, text: 'Write a short, friendly paragraph to introduce this page.' }
    case 'text': return { ...base, text: 'Additional supporting copy.' }
    case 'list': return { ...base, items: ['First point', 'Second point', 'Third point'] }
    case 'image': return { ...base, alt: 'Hero image' }
    case 'video': return { ...base, alt: 'Video', videoUrl: '' }
    case 'button': return { ...base, label: 'Get started', url: 'https://', align: 'center' }
    case 'form': return { ...base, label: 'Subscribe' }
    case 'spacer': return { ...base, height: 32 }
    default: return base
  }
}

/** Deep-clones a block with a fresh id (used when seeding pages from a template). */
export function cloneLandingBlock(block: LandingPageBlock): LandingPageBlock {
  return {
    ...block,
    id: makeBlockId(),
    items: [...block.items],
    networks: [...block.networks],
    iconSet: [...block.iconSet],
    links: block.links.map(l => ({ ...l })),
  }
}

function defaultBlocks(): LandingPageBlock[] {
  return [
    defaultLandingBlock('title'),
    defaultLandingBlock('paragraph'),
    defaultLandingBlock('form'),
  ]
}

function defaultSeo(overrides: Partial<LandingPageSeo> = {}): LandingPageSeo {
  return {
    description: '',
    pageTitle: '',
    redirectAfterExpiry: '',
    metaKeywords: '',
    tracking: '',
    ...overrides,
  }
}

export function defaultLandingStyle(overrides: Partial<LandingPageStyle> = {}): LandingPageStyle {
  return {
    backgroundColor: '#FFFFFF',
    contentWidth: 720,
    baseFont: 'Inter',
    accentColor: '#0073AB',
    buttonRadius: 8,
    ...overrides,
  }
}

export interface LandingPageInput {
  name: string
  url: string
  editorType: EditorType
  publishAt?: string
  expireAt?: string
  tracking?: string
  blocks?: LandingPageBlock[]
  style?: Partial<LandingPageStyle>
}

export interface LandingTemplateRecord {
  id: number
  name: string
  savedAt: string
  blocks: LandingPageBlock[]
  style: LandingPageStyle
}

export const useLandingPagesStore = defineStore('landingPages', () => {
  const pages = ref<LandingPage[]>([
    { id: 1, name: 'Spring Promo Landing Page', url: 'promo.mystore.com/spring', editorType: 'dnd', status: 'Verified', publishStatus: 'published', publishAt: 'Mar 1, 2026 9:00 AM', expireAt: 'Apr 1, 2026 11:59 PM', updatedAt: 'Mar 5, 2026', createdAt: 'Feb 20, 2026', seo: defaultSeo({ pageTitle: 'Spring Promo — 20% Off', description: 'Seasonal storewide promotion.' }), blocks: defaultBlocks(), style: defaultLandingStyle() },
    { id: 2, name: 'Webinar Registration', url: 'events.mystore.com/webinar', editorType: 'wysiwyg', status: 'Verified', publishStatus: 'published', publishAt: 'Feb 10, 2026 8:00 AM', expireAt: 'Mar 15, 2026 11:59 PM', updatedAt: 'Feb 28, 2026', createdAt: 'Jan 30, 2026', seo: defaultSeo({ pageTitle: 'Register — Growth Webinar' }), blocks: defaultBlocks(), style: defaultLandingStyle({ accentColor: '#7E3AF2' }) },
    { id: 3, name: 'Black Friday 2026 Early Access', url: 'bf.mystore.com', editorType: 'dnd', status: 'Unverified', publishStatus: 'draft', publishAt: 'Nov 20, 2026 12:00 AM', expireAt: 'Nov 30, 2026 11:59 PM', updatedAt: 'Mar 1, 2026', createdAt: 'Mar 1, 2026', seo: defaultSeo(), blocks: defaultBlocks(), style: defaultLandingStyle({ backgroundColor: '#0F0E0B', accentColor: '#FACC15' }) },
    { id: 4, name: 'VIP Referral Program', url: 'mystore.com/refer', editorType: 'wysiwyg', status: 'Verified', publishStatus: 'published', publishAt: 'Jan 5, 2026 9:00 AM', expireAt: '', updatedAt: 'Feb 12, 2026', createdAt: 'Dec 15, 2025', seo: defaultSeo({ pageTitle: 'Refer a Friend' }), blocks: defaultBlocks(), style: defaultLandingStyle() },
    { id: 5, name: 'New Product Teaser', url: 'mystore.com/new-arrival', editorType: 'dnd', status: 'Unverified', publishStatus: 'draft', publishAt: '', expireAt: '', updatedAt: 'Mar 8, 2026', createdAt: 'Mar 8, 2026', seo: defaultSeo(), blocks: defaultBlocks(), style: defaultLandingStyle() },
    { id: 6, name: 'Holiday Gift Guide', url: 'mystore.com/gift-guide', editorType: 'wysiwyg', status: 'Verified', publishStatus: 'draft', publishAt: 'Nov 1, 2026 12:00 AM', expireAt: 'Dec 26, 2026 11:59 PM', updatedAt: 'Jan 20, 2026', createdAt: 'Dec 1, 2025', seo: defaultSeo({ pageTitle: 'Holiday Gift Guide 2026' }), blocks: defaultBlocks(), style: defaultLandingStyle({ accentColor: '#C0392B' }) },
  ])

  /** Pages saved via "Save as template" from the editor overflow menu. */
  const savedTemplates = ref<LandingTemplateRecord[]>([])

  function nextId() {
    return Math.max(0, ...pages.value.map(p => p.id)) + 1
  }

  function create(input: LandingPageInput): number {
    const id = nextId()
    const now = 'Just now'
    pages.value.unshift({
      id,
      name: input.name,
      url: input.url,
      editorType: input.editorType,
      status: 'Unverified',
      publishStatus: 'draft',
      publishAt: input.publishAt ?? '',
      expireAt: input.expireAt ?? '',
      updatedAt: now,
      createdAt: now,
      seo: defaultSeo({ tracking: input.tracking ?? '' }),
      blocks: input.blocks ? input.blocks.map(cloneLandingBlock) : defaultBlocks(),
      style: defaultLandingStyle(input.style),
    })
    return id
  }

  function update(id: number, patch: Partial<Omit<LandingPage, 'id'>>) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    Object.assign(p, patch)
    p.updatedAt = 'Just now'
  }

  function duplicate(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    pages.value.unshift({ ...p, id: nextId(), name: `${p.name} (Copy)`, status: 'Unverified', publishStatus: 'draft', updatedAt: 'Just now', blocks: p.blocks.map(cloneLandingBlock), style: { ...p.style } })
  }

  function remove(ids: number[]) {
    pages.value = pages.value.filter(p => !ids.includes(p.id))
  }

  function verifyDomain(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    p.status = 'Verified'
    p.updatedAt = 'Just now'
  }

  function publish(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    p.publishStatus = 'published'
    p.publishAt = 'Just now'
    p.updatedAt = 'Just now'
  }

  function unpublish(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    p.publishStatus = 'draft'
    p.updatedAt = 'Just now'
  }

  function saveAsTemplate(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return false
    savedTemplates.value.unshift({
      id: Math.max(0, ...savedTemplates.value.map(t => t.id)) + 1,
      name: p.name,
      savedAt: 'Just now',
      blocks: p.blocks.map(cloneLandingBlock),
      style: { ...p.style },
    })
    return true
  }

  return { pages, savedTemplates, create, update, duplicate, remove, verifyDomain, publish, unpublish, saveAsTemplate }
})
