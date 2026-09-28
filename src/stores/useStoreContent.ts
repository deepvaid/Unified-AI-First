import { ref } from 'vue'
import { defineStore } from 'pinia'

// Storefront pages & blog posts (store editor ▸ Pages / Blogs).
// Legacy parity notes (sandbox crawl 2026-07-10, docs/uat-parity/parity-tracker.md A06b):
// Pages and Blogs share one create form — Title* + rich-text body + SEO settings,
// with a right rail of Status (default Inactive) / Template (Default) / feature image.
// Blogs additionally have a list-level SEO Settings modal (title + meta description).

/** Policies are served on the storefront at /policies/:handle; the admin's Policies page is still to be crawled. */
export type ContentKind = 'page' | 'blog' | 'policy'
export type ContentStatus = 'Active' | 'Inactive'

export interface ContentEntry {
  id: string
  channelId: string
  kind: ContentKind
  title: string
  /** The storefront URL handle (/page/:handle, /policies/:handle). */
  handle?: string
  /** Rich-text body as HTML (prototype mock — edited via the contenteditable surface). */
  body: string
  status: ContentStatus
  template: string
  seoTitle: string
  seoDescription: string
  /** Feature image filename, empty when none uploaded. */
  imageName: string
  publishedAt: string
  updatedAt: string
}

export interface BlogSeoSettings {
  title: string
  metaDescription: string
}

export const CONTENT_TEMPLATES = ['Default', 'Full width']

let contentIdCounter = 0

export function createContentDraft(channelId: string, kind: ContentKind): ContentEntry {
  contentIdCounter += 1
  return {
    id: `${kind}-${Date.now().toString(36)}-${contentIdCounter}`,
    channelId,
    kind,
    title: '',
    body: '',
    status: 'Inactive',
    template: 'Default',
    seoTitle: '',
    seoDescription: '',
    imageName: '',
    publishedAt: '',
    updatedAt: '',
  }
}

function seedEntries(): ContentEntry[] {
  return [
    {
      id: 'page-terms',
      channelId: 'retest-sales-notification',
      kind: 'page',
      title: 'Terms and conditions',
      body: '<h2>Terms and conditions</h2><p>These terms govern your use of the Atlas Outfitters storefront. By placing an order you agree to our shipping, returns, and warranty policies.</p><ul><li>Orders ship within 2 business days</li><li>Returns accepted within 30 days</li></ul>',
      status: 'Active',
      template: 'Default',
      seoTitle: 'Terms and conditions — Atlas Outfitters',
      seoDescription: 'Ordering, shipping, and returns terms for Atlas Outfitters.',
      imageName: '',
      publishedAt: 'May 8, 2026',
      updatedAt: 'May 8, 2026',
    },
    {
      id: 'page-privacy',
      channelId: 'retest-sales-notification',
      kind: 'page',
      title: 'Privacy policy',
      body: '<h2>Privacy policy</h2><p>We collect only the data needed to fulfil your order and improve your shopping experience. We never sell personal information.</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: 'Privacy policy — Atlas Outfitters',
      seoDescription: 'How Atlas Outfitters collects, uses, and protects your data.',
      imageName: '',
      publishedAt: 'May 8, 2026',
      updatedAt: 'May 8, 2026',
    },
    {
      id: 'page-about',
      channelId: 'retest-sales-notification',
      kind: 'page',
      title: 'About us',
      body: '<h2>Built for the long way home</h2><p>Atlas Outfitters makes durable outdoor gear, cut for movement and backed for life.</p>',
      status: 'Active',
      template: 'Full width',
      seoTitle: 'About Atlas Outfitters',
      seoDescription: 'The story behind Atlas Outfitters.',
      imageName: 'team-photo.webp',
      publishedAt: 'May 12, 2026',
      updatedAt: 'Jun 20, 2026',
    },
    {
      id: 'blog-trail-guide',
      channelId: 'retest-sales-notification',
      kind: 'blog',
      title: 'Five trails to break in your new boots',
      body: '<p>From coastal loops to alpine passes, these five day hikes are the perfect proving ground for a fresh pair of boots.</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: 'Five trails to break in your new boots',
      seoDescription: 'Day-hike recommendations from the Atlas Outfitters team.',
      imageName: 'trail-guide-hero.webp',
      publishedAt: 'Jun 28, 2026',
      updatedAt: 'Jul 1, 2026',
    },
    {
      id: 'blog-care-guide',
      channelId: 'retest-sales-notification',
      kind: 'blog',
      title: 'How to care for waxed canvas',
      body: '<p>Waxed canvas gets better with age — if you treat it right. Here is our simple three-step care routine.</p>',
      status: 'Inactive',
      template: 'Default',
      seoTitle: 'Waxed canvas care guide',
      seoDescription: 'Cleaning and re-waxing tips for waxed canvas gear.',
      imageName: '',
      publishedAt: '',
      updatedAt: 'Jul 6, 2026',
    },
    // Neelam-Store (UAT store #9): the pages and policies its storefront serves, text as crawled
    // (docs/rebuild/neelam-store/CRAWL-SUMMARY.md). Dates and SEO fields wait for the admin crawl.
    {
      id: 'neelam-page-faqs',
      channelId: 'neelam-store',
      kind: 'page',
      title: 'Frequently Asked Questions',
      handle: 'faqs',
      body: '<h2>Frequently Asked Questions</h2><p>Last updated: [Date]</p><p>Have a question? We\'ve got answers. Browse the topics below, or reach out to us directly if you don\'t find what you\'re looking for.</p><h3>1. Orders</h3><ul><li><strong>How do I place an order?</strong> Simply browse our store, add items to your cart, and proceed to checkout. You\'ll receive a confirmation email once your order is placed.</li><li><strong>Can I modify or cancel my order?</strong> Orders can be modified or cancelled within [number] hours of placement. Please contact us as soon as possible at [Your Email].</li></ul><h3>2. Shipping</h3><ul><li><strong>How long does shipping take?</strong> Standard shipping typically takes [number] business days. Express options are available at checkout.</li><li><strong>Do you ship internationally?</strong> Yes, we ship to most countries worldwide. Shipping rates and delivery times vary by destination.</li><li><strong>How can I track my order?</strong> Once your order ships, you will receive a confirmation email with a tracking link.</li></ul><h3>3. Returns &amp; Refunds</h3><ul><li><strong>What is your return policy?</strong> Items may be returned within [number] days of delivery in their original, unused condition. Please visit our Refund Policy page for full details.</li><li><strong>How long does a refund take?</strong> Approved refunds are processed within [number] business days to your original payment method.</li></ul><h3>4. Payments</h3><ul><li><strong>What payment methods do you accept?</strong> We accept major credit cards, PayPal, and other payment methods shown at checkout.</li><li><strong>Is my payment information secure?</strong> Yes. All transactions are encrypted and processed through trusted payment providers.</li></ul><h3>5. Contact &amp; Support</h3><p>Still have questions? We\'re happy to help. Reach us via the Contact page or at [Your Email or Contact Form Link]. Our support team typically responds within one business day.</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: '',
      seoDescription: '',
      imageName: '',
      publishedAt: '',
      updatedAt: '—',
    },
    {
      id: 'neelam-page-about',
      channelId: 'neelam-store',
      kind: 'page',
      title: 'About Us',
      handle: 'about-us',
      body: '<h2>About Us</h2><p><strong>Welcome to [Your Store Name]</strong></p><p>We\'re a passionate team dedicated to bringing you quality products and an exceptional shopping experience. Here\'s a little more about who we are and what we stand for.</p><h3>1. Our Story</h3><p>Founded in [Year], [Your Store Name] started with a simple idea: make it easy for people to find products they love at prices they can feel good about. What began as a small operation has grown into a community of happy customers across the globe.</p><h3>2. Our Mission</h3><p>We believe shopping should be simple, enjoyable, and trustworthy. Our mission is to:</p><ul><li>Offer a carefully curated selection of high-quality products.</li><li>Provide a seamless and secure shopping experience.</li><li>Stand behind everything we sell with honest, responsive support.</li></ul><h3>3. What We Offer</h3><p>From [product category] to [product category], our catalog is built around what our customers actually need. We work closely with trusted suppliers to ensure every item meets our quality standards before it reaches you.</p><h3>4. Our Values</h3><ul><li>Transparency — No hidden fees, no surprises.</li><li>Quality — We only sell products we\'d use ourselves.</li><li>Customer First — Your satisfaction drives every decision we make.</li></ul><h3>5. Get in Touch</h3><p>We\'d love to hear from you. Whether you have a question, a suggestion, or just want to say hello, reach out to us at [Your Email or Contact Form Link]. Our team typically responds within one business day.</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: '',
      seoDescription: '',
      imageName: '',
      publishedAt: '',
      updatedAt: '—',
    },
    {
      id: 'neelam-page-abhi1',
      channelId: 'neelam-store',
      kind: 'page',
      title: 'abhi1',
      handle: 'abhi1',
      body: '<p>abhi1</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: '',
      seoDescription: '',
      imageName: '',
      publishedAt: '',
      updatedAt: '—',
    },
    {
      id: 'neelam-policy-refund',
      channelId: 'neelam-store',
      kind: 'policy',
      title: 'Refund policy',
      handle: 'refund-policy',
      body: '<h2>Refund Policy</h2><p>Last updated: [Date]</p><p>We want you to be completely satisfied with your purchase. If you are not happy with your order, we\'re here to help.</p><h3>1. Returns</h3><p>You have [number] days to return an item from the date you received it. To be eligible for a return, your item must be:</p><ul><li>Unused and in the same condition that you received it.</li><li>In the original packaging.</li><li>Accompanied by a receipt or proof of purchase.</li></ul><h3>2. Refunds</h3><p>Once we receive your item, we will inspect it and notify you of the status of your refund. If your return is approved, we will initiate a refund to your original method of payment within [number] business days.</p><h3>3. Exchanges</h3><p>We only replace items if they are defective or damaged. If you need to exchange an item for the same product, please contact us at [Your Email].</p><h3>4. Non-Returnable Items</h3><p>Certain items cannot be returned, including:</p><ul><li>Perishable goods.</li><li>Downloadable software or digital products.</li><li>Items marked as final sale.</li></ul><h3>5. Shipping Costs</h3><p>You are responsible for paying your own shipping costs for returning your item. Shipping costs are non-refundable.</p><h3>6. Contact Us</h3><p>If you have any questions about our Refund Policy, please contact us at [Your Email or Contact Form Link].</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: '',
      seoDescription: '',
      imageName: '',
      publishedAt: '',
      updatedAt: '—',
    },
    {
      id: 'neelam-policy-privacy',
      channelId: 'neelam-store',
      kind: 'policy',
      title: 'Privacy policy',
      handle: 'privacy-policy',
      body: '<h2>Privacy Policy</h2><p>Last updated: [Date]</p><p>We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.</p><h3>1. Information We Collect</h3><ul><li>Personal details you provide (e.g., name, email address, phone number).</li><li>Usage data, such as pages visited, time spent, and technical details (IP address, browser type).</li></ul><h3>2. How We Use Your Information</h3><p>We use your information to:</p><ul><li>Provide and improve our services.</li><li>Communicate with you (support, updates, marketing if you consent).</li><li>Ensure security and prevent fraud.</li></ul><h3>3. Sharing of Information</h3><p>We do not sell your personal data. We may share it only with:</p><ul><li>Service providers who help us operate (e.g., hosting, analytics).</li><li>Authorities if required by law.</li></ul><h3>4. Cookies</h3><p>We use cookies to enhance your browsing experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p><h3>5. Data Security</h3><p>We take reasonable measures to protect your data. However, no system is completely secure.</p><h3>6. Your Rights</h3><p>You may:</p><ul><li>Request access to your data.</li><li>Ask us to correct or delete your information.</li><li>Withdraw consent to marketing communications.</li></ul><h3>7. Contact Us</h3><p>If you have any questions about this Privacy Policy, please contact us at [Your Email or Contact Form Link].</p>',
      status: 'Active',
      template: 'Default',
      seoTitle: '',
      seoDescription: '',
      imageName: '',
      publishedAt: '',
      updatedAt: '—',
    },
  ]
}

export const useStoreContentStore = defineStore('storeContent', () => {
  const entries = ref<ContentEntry[]>(seedEntries())
  const blogSeoByChannel = ref<Record<string, BlogSeoSettings>>({
    'retest-sales-notification': { title: 'Atlas Outfitters Journal', metaDescription: 'Guides and stories from the Atlas Outfitters team.' },
  })

  function entriesForChannel(channelId: string, kind: ContentKind): ContentEntry[] {
    return entries.value.filter((entry) => entry.channelId === channelId && entry.kind === kind)
  }

  /** The active entry a storefront URL serves, e.g. /page/about-us. */
  function entryByHandle(channelId: string, kind: ContentKind, handle: string): ContentEntry | undefined {
    return entries.value.find((entry) => entry.channelId === channelId && entry.kind === kind && entry.handle === handle && entry.status === 'Active')
  }

  function getEntry(entryId: string): ContentEntry | undefined {
    return entries.value.find((entry) => entry.id === entryId)
  }

  /** Upsert by id (create + edit share it). Stamps updatedAt, and publishedAt on first activation. */
  function saveEntry(draft: ContentEntry): ContentEntry {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const saved: ContentEntry = {
      ...draft,
      updatedAt: today,
      publishedAt: draft.status === 'Active' && !draft.publishedAt ? today : draft.publishedAt,
    }
    const index = entries.value.findIndex((entry) => entry.id === draft.id)
    if (index === -1) entries.value.push(saved)
    else entries.value[index] = saved
    return saved
  }

  function setEntryStatus(entryId: string, status: ContentStatus): void {
    const entry = getEntry(entryId)
    if (!entry) return
    entry.status = status
    if (status === 'Active' && !entry.publishedAt) {
      entry.publishedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  function deleteEntry(entryId: string): void {
    entries.value = entries.value.filter((entry) => entry.id !== entryId)
  }

  function blogSeo(channelId: string): BlogSeoSettings {
    return blogSeoByChannel.value[channelId] ?? { title: '', metaDescription: '' }
  }

  function saveBlogSeo(channelId: string, settings: BlogSeoSettings): void {
    blogSeoByChannel.value[channelId] = { ...settings }
  }

  return { entries, entriesForChannel, entryByHandle, getEntry, saveEntry, setEntryStatus, deleteEntry, blogSeo, saveBlogSeo }
})
