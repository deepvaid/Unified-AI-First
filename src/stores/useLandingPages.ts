import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * UAT exposes three editors, not two: the current drag-and-drop builder, the
 * WYSIWYG builder, and a deprecated `Drag & Drop (Legacy)` that a third of the
 * account's pages still use. It is a filter value and a column value, never an
 * option offered for a new page.
 */
export type EditorType = 'dnd' | 'wysiwyg' | 'dnd_legacy'

export const EDITOR_TYPE_LABEL: Record<EditorType, string> = {
  dnd: 'Drag & Drop',
  wysiwyg: 'WYSIWYG',
  dnd_legacy: 'Drag & Drop (Legacy)',
}

/** Filter options, in UAT's own order. */
export const EDITOR_TYPE_OPTIONS: Array<{ label: string; value: EditorType }> = [
  { label: EDITOR_TYPE_LABEL.wysiwyg, value: 'wysiwyg' },
  { label: EDITOR_TYPE_LABEL.dnd_legacy, value: 'dnd_legacy' },
  { label: EDITOR_TYPE_LABEL.dnd, value: 'dnd' },
]

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
  /** ISO timestamps — the list formats them, so they stay sortable. */
  publishAt: string
  expireAt: string
  updatedAt: string
  createdAt: string
  /** `useFolders` id in the `landing_pages` scope; null = unfiled. */
  folderId: string | null
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
  folderId?: string | null
  blocks?: LandingPageBlock[]
  style?: Partial<LandingPageStyle>
}

export interface LandingTemplateRecord {
  id: number
  name: string
  /** ISO timestamps — the MY TEMPLATES table shows both, as UAT does. */
  createdAt: string
  updatedAt: string
  folderId: string | null
  blocks: LandingPageBlock[]
  style: LandingPageStyle
}

// ─── Template library ──────────────────────────────────────────────────────
// Shared by the Select Template gallery and the Select Builder step, so the
// two surfaces cannot drift apart. Facet groups mirror UAT's four accordions.

export type LandingFacetGroup = 'usage' | 'industry' | 'seasonal' | 'automated'

export interface LandingFacet {
  value: string
  label: string
  group: LandingFacetGroup
}

export const LANDING_FACET_GROUPS: Array<{ key: LandingFacetGroup; label: string }> = [
  { key: 'usage', label: 'Usage' },
  { key: 'industry', label: 'Industry' },
  { key: 'seasonal', label: 'Seasonal' },
  { key: 'automated', label: 'Automated' },
]

/**
 * UAT renders raw database slugs (`product-promotion`, `Home_garden`) as labels
 * via `text-transform: capitalize`. The slug stays the value; the label is
 * written for a merchant.
 */
export const LANDING_FACETS: LandingFacet[] = [
  { value: 'newsletter', label: 'Newsletter', group: 'usage' },
  { value: 'events', label: 'Events', group: 'usage' },
  { value: 'product-promotion', label: 'Product promotion', group: 'usage' },
  { value: 'service-promotion', label: 'Service promotion', group: 'usage' },
  { value: 'dark-mode-optimized', label: 'Dark-mode optimised', group: 'usage' },
  { value: 'e-commerce', label: 'E-commerce', group: 'industry' },
  { value: 'fashion', label: 'Fashion', group: 'industry' },
  { value: 'beauty-cosmetics', label: 'Beauty & cosmetics', group: 'industry' },
  { value: 'computer-internet', label: 'Computer & internet', group: 'industry' },
  { value: 'business-services', label: 'Business services', group: 'industry' },
  { value: 'home-garden', label: 'Home & garden', group: 'industry' },
  { value: 'financial-money', label: 'Financial services', group: 'industry' },
  { value: 'pets-animal-care', label: 'Pets & animal care', group: 'industry' },
  { value: 'small-business', label: 'Small business', group: 'industry' },
  { value: 'black-friday', label: 'Black Friday', group: 'seasonal' },
  { value: 'christmas', label: 'Christmas', group: 'seasonal' },
  { value: 'new-year', label: 'New Year', group: 'seasonal' },
  { value: 'easter', label: 'Easter', group: 'seasonal' },
  { value: 'mothers-day', label: "Mother's Day", group: 'seasonal' },
  { value: 'fathers-day', label: "Father's Day", group: 'seasonal' },
  { value: 'welcome', label: 'Welcome', group: 'automated' },
  { value: 'abandoned-cart', label: 'Abandoned cart', group: 'automated' },
  { value: 'win-back', label: 'Win-back', group: 'automated' },
  { value: 'post-purchase', label: 'Post-purchase', group: 'automated' },
]

export interface LandingTemplate {
  id: string
  name: string
  description: string
  /** Theme colour key driving the abstract preview tint. */
  accent: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'secondary'
  facets: string[]
  blocks: () => LandingPageBlock[]
  style?: Partial<LandingPageStyle>
}

/** Four block presets cover the library — a template is a preset plus its copy. */
function capturePreset(headline: string, body: string, cta: string): LandingPageBlock[] {
  return [
    { ...defaultLandingBlock('title'), text: headline, titleSize: 'XL', align: 'center' },
    { ...defaultLandingBlock('paragraph'), text: body, align: 'center' },
    { ...defaultLandingBlock('form'), label: cta },
  ]
}

function promoPreset(headline: string, body: string, cta: string): LandingPageBlock[] {
  return [
    { ...defaultLandingBlock('title'), text: headline, titleSize: 'XL', align: 'center' },
    { ...defaultLandingBlock('paragraph'), text: body, align: 'center' },
    { ...defaultLandingBlock('image'), alt: 'Promotional hero image' },
    { ...defaultLandingBlock('button'), label: cta, align: 'center' },
  ]
}

function listPreset(headline: string, items: string[], cta: string): LandingPageBlock[] {
  return [
    { ...defaultLandingBlock('title'), text: headline, titleSize: 'L', align: 'center' },
    { ...defaultLandingBlock('list'), items },
    { ...defaultLandingBlock('button'), label: cta, align: 'center' },
  ]
}

function eventPreset(headline: string, body: string, items: string[], cta: string): LandingPageBlock[] {
  return [
    { ...defaultLandingBlock('title'), text: headline, titleSize: 'L', align: 'center' },
    { ...defaultLandingBlock('paragraph'), text: body, align: 'center' },
    { ...defaultLandingBlock('list'), items },
    { ...defaultLandingBlock('form'), label: cta },
  ]
}

/** 17 stock templates; the gallery renders a Blank card ahead of them. */
export const LANDING_TEMPLATES: LandingTemplate[] = [
  { id: 'fresh-drop', name: 'Fresh Drop Announcement', description: 'Hero, product shot and one call to action for a launch.', accent: 'primary', facets: ['product-promotion', 'e-commerce', 'fashion'], blocks: () => promoPreset('Something new just dropped', 'Be the first to shop our latest release before it sells out.', 'Shop the drop') },
  { id: 'newsletter-digest', name: 'Newsletter Digest', description: 'Sign-up form with a preview of the latest issue.', accent: 'info', facets: ['newsletter', 'business-services'], blocks: () => capturePreset('Get our newsletter', 'Product news, tips and offers — straight to your inbox, every other week.', 'Subscribe') },
  { id: 'webinar-rsvp', name: 'Webinar RSVP', description: 'Event details plus a registration form.', accent: 'secondary', facets: ['events', 'computer-internet', 'business-services'], blocks: () => eventPreset('Join our live webinar', 'Save your seat for a live walkthrough with our product team.', ['Live Q&A with the team', 'Free resource pack for attendees', 'Recording sent afterward'], 'Reserve my seat') },
  { id: 'midnight-mode', name: 'Midnight Mode Showcase', description: 'High-contrast dark showcase for a single product.', accent: 'secondary', facets: ['dark-mode-optimized', 'product-promotion', 'computer-internet'], blocks: () => promoPreset('Built for the night owls', 'A high-contrast showcase for a product that looks best after dark.', 'See it in action'), style: { backgroundColor: '#121212', accentColor: '#2CC4FF' } },
  { id: 'boutique-storefront', name: 'Boutique Storefront', description: 'Product grid with a limited-time offer.', accent: 'success', facets: ['e-commerce', 'fashion', 'product-promotion'], blocks: () => promoPreset('This week’s edit', 'Limited-time picks from our boutique collection — while stocks last.', 'Shop the edit') },
  { id: 'neighborhood-spotlight', name: 'Neighbourhood Spotlight', description: 'Local story with a contact form.', accent: 'success', facets: ['small-business', 'service-promotion'], blocks: () => capturePreset('A local favourite, now online', 'Our story, our neighbourhood, and how to reach us.', 'Get in touch') },
  { id: 'holiday-wishlist', name: 'Holiday Wishlist', description: 'Gift guide built around curated picks.', accent: 'error', facets: ['christmas', 'e-commerce', 'product-promotion'], blocks: () => listPreset('The holiday gift guide', ['Gifts under $50', 'Best sellers of the season', 'Free gift wrapping'], 'Browse the guide'), style: { accentColor: '#C0392B' } },
  { id: 'countdown-new-year', name: 'Countdown to New Year', description: 'Sitewide sale with an expiry-driven countdown.', accent: 'warning', facets: ['new-year', 'e-commerce', 'product-promotion'], blocks: () => promoPreset('New year, new savings', 'Sitewide savings end at midnight — don’t miss out.', 'Shop the sale'), style: { accentColor: '#F59E0B' } },
  { id: 'cyber-monday-shop', name: 'Cyber Monday Shop', description: 'One-day doorbuster grid with deal badges.', accent: 'warning', facets: ['black-friday', 'e-commerce'], blocks: () => promoPreset('Cyber Monday, one day only', 'Every deal ends at midnight. No codes, no waiting lists.', 'Shop all deals'), style: { accentColor: '#111827' } },
  { id: 'easter-home-decor', name: 'Easter Home Decor Sale', description: 'Seasonal decor collection with a soft palette.', accent: 'success', facets: ['easter', 'home-garden', 'e-commerce'], blocks: () => promoPreset('Bring spring indoors', 'Fresh pieces for the table, the mantel and the front door.', 'Shop the collection') },
  { id: 'love-your-mother', name: 'Love Your Mother', description: 'Mother’s Day gifting page with a gift-finder list.', accent: 'error', facets: ['mothers-day', 'fashion', 'beauty-cosmetics'], blocks: () => listPreset('Gifts she’ll actually use', ['Under $40', 'Made locally', 'Gift-wrapped free'], 'Find her gift') },
  { id: 'fathers-day-photography', name: 'Fathers Day Photography', description: 'Photo-led gifting page for a service business.', accent: 'info', facets: ['fathers-day', 'service-promotion', 'small-business'], blocks: () => promoPreset('A gift he won’t re-gift', 'Book a family session and give him something worth framing.', 'Book a session') },
  { id: 'brand-awareness-page', name: 'Brand Awareness Page', description: 'Story-first page for a first-touch audience.', accent: 'primary', facets: ['business-services', 'service-promotion'], blocks: () => capturePreset('Why we exist', 'The short version of a long story — and how to follow along.', 'Keep me posted') },
  { id: 'welcome-new-subscriber', name: 'Welcome New Subscriber', description: 'Post-signup landing page for a welcome journey.', accent: 'primary', facets: ['welcome', 'newsletter', 'e-commerce'], blocks: () => listPreset('Welcome aboard', ['Your 10% code is on its way', 'Pick your interests any time', 'One email a fortnight, no more'], 'Start shopping') },
  { id: 'cart-recovery', name: 'Cart Recovery Offer', description: 'Abandoned-cart landing page with a single offer.', accent: 'warning', facets: ['abandoned-cart', 'e-commerce', 'product-promotion'], blocks: () => promoPreset('Still thinking it over?', 'Your basket is saved. Here’s free shipping to help you decide.', 'Return to my basket') },
  { id: 'win-back-lapsed', name: 'Win-Back Lapsed Customers', description: 'Re-engagement page with a returning-customer offer.', accent: 'error', facets: ['win-back', 'e-commerce', 'financial-money'], blocks: () => promoPreset('It’s been a while', 'Here’s 15% off your next order — and what you’ve missed.', 'See what’s new') },
  { id: 'post-purchase-care', name: 'Post-Purchase Care Guide', description: 'Care instructions and a review prompt after delivery.', accent: 'info', facets: ['post-purchase', 'pets-animal-care', 'home-garden'], blocks: () => eventPreset('Looking after your order', 'A two-minute read that makes it last twice as long.', ['Cleaning and storage', 'What the warranty covers', 'How to reach us'], 'Leave a review') },
]

export function getLandingTemplate(id: string | null | undefined): LandingTemplate | undefined {
  return id ? LANDING_TEMPLATES.find(t => t.id === id) : undefined
}

/** Terse seed helper — the 20 rows below only differ in the fields that matter to the list. */
function seed(
  id: number,
  name: string,
  url: string,
  editorType: EditorType,
  status: LandingPageStatus,
  publishStatus: LandingPagePublishStatus,
  publishAt: string,
  expireAt: string,
  updatedAt: string,
  createdAt: string,
  folderId: string | null,
  style: Partial<LandingPageStyle> = {},
): LandingPage {
  return {
    id, name, url, editorType, status, publishStatus,
    publishAt, expireAt, updatedAt, createdAt, folderId,
    seo: defaultSeo({ pageTitle: name }),
    blocks: defaultBlocks(),
    style: defaultLandingStyle(style),
  }
}

export const useLandingPagesStore = defineStore('landingPages', () => {
  /**
   * 20 rows mirroring UAT's shape: a mixed editor-type population where every
   * `Drag & Drop (Legacy)` page is old and `Unverified`, a spread of filed and
   * unfiled pages, and pages with no publish/expire date at all.
   */
  const pages = ref<LandingPage[]>([
    seed(1, 'Spring Promo Landing Page', 'promo.mystore.com/spring', 'dnd', 'Verified', 'published', '2026-03-01T09:00:00', '2026-04-01T23:59:00', '2026-03-05T11:20:00', '2026-02-20T14:05:00', 'lp-campaigns'),
    seed(2, 'Webinar Registration', 'events.mystore.com/webinar', 'wysiwyg', 'Verified', 'published', '2026-02-10T08:00:00', '2026-03-15T23:59:00', '2026-02-28T16:42:00', '2026-01-30T09:12:00', 'lp-campaigns', { accentColor: '#7E3AF2' }),
    seed(3, 'Black Friday 2026 Early Access', 'bf.mystore.com', 'dnd', 'Unverified', 'draft', '2026-11-20T00:00:00', '2026-11-30T23:59:00', '2026-03-01T10:03:00', '2026-03-01T10:03:00', 'lp-campaigns', { backgroundColor: '#0F0E0B', accentColor: '#FACC15' }),
    seed(4, 'VIP Referral Program', 'mystore.com/refer', 'wysiwyg', 'Verified', 'published', '2026-01-05T09:00:00', '', '2026-02-12T13:30:00', '2025-12-15T08:45:00', 'lp-evergreen'),
    seed(5, 'New Product Teaser', 'mystore.com/new-arrival', 'dnd', 'Unverified', 'draft', '', '', '2026-03-08T17:55:00', '2026-03-08T17:55:00', null),
    seed(6, 'Holiday Gift Guide', 'mystore.com/gift-guide', 'wysiwyg', 'Verified', 'draft', '2026-11-01T00:00:00', '2026-12-26T23:59:00', '2026-01-20T12:00:00', '2025-12-01T10:00:00', 'lp-campaigns', { accentColor: '#C0392B' }),
    seed(7, 'Loyalty Tier Upgrade', 'mystore.com/loyalty/upgrade', 'dnd', 'Verified', 'published', '2026-02-02T07:30:00', '', '2026-02-26T09:14:00', '2026-01-22T15:20:00', 'lp-evergreen'),
    seed(8, 'Store Locator Signup', 'mystore.com/locator', 'wysiwyg', 'Unverified', 'draft', '', '', '2026-02-19T11:48:00', '2026-02-19T11:48:00', null),
    seed(9, 'Wholesale Enquiry', 'wholesale.mystore.com', 'dnd', 'Verified', 'published', '2025-11-14T09:00:00', '', '2026-01-09T08:32:00', '2025-11-10T16:05:00', 'lp-evergreen'),
    seed(10, 'yg LP test', 'mystore.com/yg-lp-test', 'dnd', 'Unverified', 'draft', '', '', '2026-02-05T04:11:00', '2026-01-28T04:02:00', 'lp-harpreet'),
    seed(11, 'landing page test', 'mystore.com/landing-page-test', 'wysiwyg', 'Unverified', 'draft', '', '', '2025-12-18T06:24:00', '2025-12-18T06:24:00', 'lp-harpreet'),
    seed(12, '28feb_new_page', 'mystore.com/28feb-new-page', 'dnd_legacy', 'Unverified', 'draft', '2024-02-28T10:00:00', '', '2024-03-04T10:15:00', '2024-02-28T09:58:00', 'lp-manny'),
    seed(13, 'avtest', 'mystore.com/avtest', 'dnd_legacy', 'Unverified', 'draft', '', '', '2023-09-12T05:40:00', '2023-09-12T05:40:00', 'lp-manny'),
    seed(14, 'bb', 'mystore.com/bb', 'dnd_legacy', 'Unverified', 'draft', '', '', '2023-07-03T02:18:00', '2023-07-03T02:18:00', null),
    seed(15, 'test-dnd-dupl', 'mystore.com/test-dnd-dupl', 'dnd_legacy', 'Unverified', 'draft', '', '', '2024-05-21T08:07:00', '2024-05-20T08:07:00', null),
    seed(16, 'test-dnd-dupl copy', 'mystore.com/test-dnd-dupl-copy', 'dnd_legacy', 'Unverified', 'draft', '', '', '2024-05-21T08:09:00', '2024-05-21T08:09:00', null),
    seed(17, 'Summer Clearance 2025', 'mystore.com/summer-clearance', 'dnd_legacy', 'Unverified', 'published', '2025-06-01T00:00:00', '2025-08-31T23:59:00', '2025-08-31T23:59:00', '2025-05-18T11:22:00', 'lp-campaigns'),
    seed(18, 'Back In Stock Alerts', 'mystore.com/back-in-stock', 'dnd', 'Verified', 'published', '2026-01-12T09:00:00', '', '2026-03-02T14:36:00', '2026-01-08T13:41:00', 'lp-evergreen'),
    seed(19, 'Post-Purchase Survey', 'mystore.com/survey/post-purchase', 'wysiwyg', 'Verified', 'published', '2025-10-01T09:00:00', '', '2026-02-01T10:26:00', '2025-09-24T10:12:00', 'lp-evergreen'),
    seed(20, 'Partner Co-Marketing Page', 'partners.mystore.com/spring', 'wysiwyg', 'Unverified', 'draft', '2026-04-10T09:00:00', '2026-05-10T23:59:00', '2026-03-07T09:03:00', '2026-03-06T18:30:00', 'lp-campaigns', { accentColor: '#0F766E' }),
  ])

  /** Pages saved via "Save as template" from the editor overflow menu. */
  const savedTemplates = ref<LandingTemplateRecord[]>([
    { id: 1, name: 'Rails-8-DnD', createdAt: '2025-07-07T04:52:00', updatedAt: '2025-08-21T02:58:00', folderId: null, blocks: defaultBlocks(), style: defaultLandingStyle() },
    { id: 2, name: 'Campaign Hero — Brand Base', createdAt: '2025-11-02T09:30:00', updatedAt: '2026-01-16T15:11:00', folderId: 'lp-campaigns', blocks: defaultBlocks(), style: defaultLandingStyle({ accentColor: '#7E3AF2' }) },
    { id: 3, name: 'Evergreen Lead Capture', createdAt: '2026-01-05T08:14:00', updatedAt: '2026-02-22T12:47:00', folderId: 'lp-evergreen', blocks: defaultBlocks(), style: defaultLandingStyle() },
  ])

  function nextId() {
    return Math.max(0, ...pages.value.map(p => p.id)) + 1
  }

  function now() {
    return new Date().toISOString()
  }

  function create(input: LandingPageInput): number {
    const id = nextId()
    const stamp = now()
    pages.value.unshift({
      id,
      name: input.name,
      url: input.url,
      editorType: input.editorType,
      status: 'Unverified',
      publishStatus: 'draft',
      publishAt: input.publishAt ?? '',
      expireAt: input.expireAt ?? '',
      updatedAt: stamp,
      createdAt: stamp,
      folderId: input.folderId ?? null,
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
    p.updatedAt = now()
  }

  /** Returns the new page's id so the caller can link straight to the copy. */
  function duplicate(id: number): number | null {
    const p = pages.value.find(x => x.id === id)
    if (!p) return null
    const copyId = nextId()
    const stamp = now()
    pages.value.unshift({
      ...p,
      id: copyId,
      name: `${p.name} (Copy)`,
      status: 'Unverified',
      publishStatus: 'draft',
      publishAt: '',
      updatedAt: stamp,
      createdAt: stamp,
      blocks: p.blocks.map(cloneLandingBlock),
      style: { ...p.style },
      seo: { ...p.seo },
    })
    return copyId
  }

  function remove(ids: number[]) {
    pages.value = pages.value.filter(p => !ids.includes(p.id))
  }

  function verifyDomain(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    p.status = 'Verified'
    p.updatedAt = now()
  }

  /** Bulk move — the source has no move-to-folder at all beyond dragging one row. */
  function moveToFolder(ids: number[], folderId: string | null) {
    for (const p of pages.value) {
      if (ids.includes(p.id)) {
        p.folderId = folderId
        p.updatedAt = now()
      }
    }
  }

  /** Unfiles everything in a folder that was just deleted. */
  function reassignFolder(folderId: string) {
    for (const p of pages.value) if (p.folderId === folderId) p.folderId = null
    for (const t of savedTemplates.value) if (t.folderId === folderId) t.folderId = null
  }

  function publish(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    p.publishStatus = 'published'
    p.publishAt = now()
    p.updatedAt = now()
  }

  function unpublish(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return
    p.publishStatus = 'draft'
    p.updatedAt = now()
  }

  function saveAsTemplate(id: number) {
    const p = pages.value.find(x => x.id === id)
    if (!p) return false
    const stamp = now()
    savedTemplates.value.unshift({
      id: Math.max(0, ...savedTemplates.value.map(t => t.id)) + 1,
      name: p.name,
      createdAt: stamp,
      updatedAt: stamp,
      folderId: p.folderId,
      blocks: p.blocks.map(cloneLandingBlock),
      style: { ...p.style },
    })
    return true
  }

  function getTemplate(id: number) {
    return savedTemplates.value.find(t => t.id === id)
  }

  function moveTemplateToFolder(id: number, folderId: string | null) {
    const t = getTemplate(id)
    if (!t) return
    t.folderId = folderId
    t.updatedAt = now()
  }

  function removeTemplates(ids: number[]) {
    savedTemplates.value = savedTemplates.value.filter(t => !ids.includes(t.id))
  }

  return {
    pages, savedTemplates,
    create, update, duplicate, remove, verifyDomain,
    moveToFolder, reassignFolder,
    publish, unpublish,
    saveAsTemplate, getTemplate, moveTemplateToFolder, removeTemplates,
  }
})
