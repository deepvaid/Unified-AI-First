import { defineStore } from 'pinia'
import { ref } from 'vue'

export type EditorType = 'dnd' | 'wysiwyg'
export type LandingPageStatus = 'Verified' | 'Unverified'
export type LandingPageBlockType =
  | 'title' | 'paragraph' | 'list' | 'image' | 'button' | 'divider' | 'spacer'
  | 'social' | 'html' | 'video' | 'form' | 'icons' | 'menu' | 'text'

export interface LandingPageBlock {
  id: string
  type: LandingPageBlockType
  text: string
  items: string[]
  alt: string
  label: string
  url: string
  height: number
  align: 'left' | 'center' | 'right'
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
  publishAt: string
  expireAt: string
  updatedAt: string
  createdAt: string
  seo: LandingPageSeo
  blocks: LandingPageBlock[]
}

let blockSeq = 0
function makeBlockId() {
  blockSeq += 1
  return `lpb${blockSeq}`
}

export function defaultLandingBlock(type: LandingPageBlockType): LandingPageBlock {
  const base: LandingPageBlock = { id: makeBlockId(), type, text: '', items: [], alt: '', label: '', url: '', height: 24, align: 'left' }
  switch (type) {
    case 'title': return { ...base, text: 'Your headline here', align: 'center' }
    case 'paragraph': return { ...base, text: 'Write a short, friendly paragraph to introduce this page.' }
    case 'list': return { ...base, items: ['First point', 'Second point', 'Third point'] }
    case 'image': return { ...base, alt: 'Hero image' }
    case 'button': return { ...base, label: 'Get started', url: 'https://', align: 'center' }
    case 'html': return { ...base, text: '<!-- custom HTML -->' }
    case 'form': return { ...base, label: 'Subscribe' }
    case 'menu': return { ...base, items: ['Home', 'About', 'Contact'] }
    case 'text': return { ...base, text: 'Additional supporting copy.' }
    default: return base
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

export interface LandingPageInput {
  name: string
  url: string
  editorType: EditorType
  publishAt?: string
  expireAt?: string
  tracking?: string
}

export const useLandingPagesStore = defineStore('landingPages', () => {
  const pages = ref<LandingPage[]>([
    { id: 1, name: 'Spring Promo Landing Page', url: 'promo.mystore.com/spring', editorType: 'dnd', status: 'Verified', publishAt: 'Mar 1, 2026 9:00 AM', expireAt: 'Apr 1, 2026 11:59 PM', updatedAt: 'Mar 5, 2026', createdAt: 'Feb 20, 2026', seo: defaultSeo({ pageTitle: 'Spring Promo — 20% Off', description: 'Seasonal storewide promotion.' }), blocks: defaultBlocks() },
    { id: 2, name: 'Webinar Registration', url: 'events.mystore.com/webinar', editorType: 'wysiwyg', status: 'Verified', publishAt: 'Feb 10, 2026 8:00 AM', expireAt: 'Mar 15, 2026 11:59 PM', updatedAt: 'Feb 28, 2026', createdAt: 'Jan 30, 2026', seo: defaultSeo({ pageTitle: 'Register — Growth Webinar' }), blocks: defaultBlocks() },
    { id: 3, name: 'Black Friday 2026 Early Access', url: 'bf.mystore.com', editorType: 'dnd', status: 'Unverified', publishAt: 'Nov 20, 2026 12:00 AM', expireAt: 'Nov 30, 2026 11:59 PM', updatedAt: 'Mar 1, 2026', createdAt: 'Mar 1, 2026', seo: defaultSeo(), blocks: defaultBlocks() },
    { id: 4, name: 'VIP Referral Program', url: 'mystore.com/refer', editorType: 'wysiwyg', status: 'Verified', publishAt: 'Jan 5, 2026 9:00 AM', expireAt: '', updatedAt: 'Feb 12, 2026', createdAt: 'Dec 15, 2025', seo: defaultSeo({ pageTitle: 'Refer a Friend' }), blocks: defaultBlocks() },
    { id: 5, name: 'New Product Teaser', url: 'mystore.com/new-arrival', editorType: 'dnd', status: 'Unverified', publishAt: '', expireAt: '', updatedAt: 'Mar 8, 2026', createdAt: 'Mar 8, 2026', seo: defaultSeo(), blocks: defaultBlocks() },
    { id: 6, name: 'Holiday Gift Guide', url: 'mystore.com/gift-guide', editorType: 'wysiwyg', status: 'Verified', publishAt: 'Nov 1, 2026 12:00 AM', expireAt: 'Dec 26, 2026 11:59 PM', updatedAt: 'Jan 20, 2026', createdAt: 'Dec 1, 2025', seo: defaultSeo({ pageTitle: 'Holiday Gift Guide 2026' }), blocks: defaultBlocks() },
  ])

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
      publishAt: input.publishAt ?? '',
      expireAt: input.expireAt ?? '',
      updatedAt: now,
      createdAt: now,
      seo: defaultSeo({ tracking: input.tracking ?? '' }),
      blocks: defaultBlocks(),
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
    pages.value.unshift({ ...p, id: nextId(), name: `${p.name} (Copy)`, status: 'Unverified', updatedAt: 'Just now' })
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

  function saveAsTemplate(_id: number) {
    // Mock — no persistent "My Templates" store wired yet; surfaced as a toast by the caller.
    return true
  }

  return { pages, create, update, duplicate, remove, verifyDomain, saveAsTemplate }
})
