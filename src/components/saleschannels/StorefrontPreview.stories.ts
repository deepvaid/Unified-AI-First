/*
 * P5.5 exemption — the hex values in these fixtures are a MERCHANT's brand
 * colours, i.e. the content this component configures and previews, not Marobase
 * chrome. Same line Phase 4 drew for StorefrontPreview (DESIGN_AUDIT.md P4-8):
 * forcing the system palette onto them would make the preview less honest.
 */
import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import StorefrontPreview from './StorefrontPreview.vue'
import { createBlock, createSection, type ThemeSection, type ThemeStyles } from '@/stores/themeBuilderData'
import { constrain } from '@/stories/decorators'
import { demoStoreFor } from '@/storefront/demoStores'
import { snapshotFor } from '@/storefront/demoStores/install'
import { cardPrice, gridSettings, isNewArrival } from '@/storefront/listing'
import { parseDecimal } from '@/maropay/money'
import { formatStorePrice } from '@/storefront/price'
import { cheapestSelection } from '@/storefront/variants'
import { plansForProduct, roundForDisplay } from '@/subscriptions/plans'
import { purchasePreviewFor } from './storefrontPreview'

function homeSections(): ThemeSection[] {
  return [
    createSection('announcement-bar', {}, 'story-announcement'),
    createSection('header', {}, 'story-header'),
    createSection('hero', {}, 'story-hero'),
    createSection('featured-products', {}, 'story-featured'),
    createSection('testimonials', {}, 'story-testimonials'),
    createSection('newsletter', {}, 'story-newsletter'),
    createSection('footer', {}, 'story-footer'),
  ]
}

// A block-accepting rich-text section carrying a heading, paragraph, and button
// block — exercises StorefrontPreview's nested block-mock rendering.
function sectionsWithBlocks(): ThemeSection[] {
  const richText = createSection('rich-text', {}, 'story-richtext-blocks')
  richText.blocks = [
    createBlock('heading', { text: 'Built for the long way home' }, 'story-block-heading'),
    createBlock('paragraph', { body: 'Every piece is cut for movement and backed for life.' }, 'story-block-paragraph'),
    createBlock('button', { label: 'Read our story' }, 'story-block-button'),
  ]
  return [
    createSection('header', {}, 'story-header-blocks'),
    richText,
    createSection('footer', {}, 'story-footer-blocks'),
  ]
}

// A collection-grid section built from the "4-up" variant preset (columns: 4).
function collectionGridSections(): ThemeSection[] {
  return [
    createSection('header', {}, 'story-header-grid'),
    createSection('collection-grid', { columns: 4 }, 'story-collection-grid'),
    createSection('footer', {}, 'story-footer-grid'),
  ]
}

const boutiqueStyles: Partial<ThemeStyles> = {
  brandColor: '#7E3AF2',
  accentColor: '#F2A03A',
  background: '#FBF8F3',
  textColor: '#2B2440',
  headingFont: 'Georgia',
  cornerRadius: 2,
  buttonStyle: 'pill',
}

const meta = {
  title: 'Product/Sales Channels/StorefrontPreview',
  component: StorefrontPreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`StorefrontPreview\` renders a CSS-only mock storefront inside a browser-chrome frame. Extracted from
\`SalesChannelDetail\`'s Overview card, it doubles as the theme builder's live canvas.

**Two modes:**
- **Default (no props)** — the static Atlas storefront mock (browser bar, nav, hero, product grid),
  pixel-identical to the original sales-channel detail preview.
- **Sectioned** — pass \`sections\` (from \`themeBuilderData\`/\`useStoreThemes\`) to render each visible
  section by \`kind\`: announcement-bar, header, hero, featured-products, collection-grid, image-banner,
  rich-text, testimonials, newsletter, product-detail, cart-summary, footer.

\`styles\` applies \`ThemeStyles\` as CSS vars (\`--sf-brand\`, \`--sf-accent\`, \`--sf-bg\`, \`--sf-text\`,
\`--sf-radius\`, fonts, \`--sf-badge-*\`) consumed by the section mocks. \`interactive\` adds hover outlines and click/keyboard
selection (\`select\` + \`hover\` emits); \`selectedId\` shows a labeled ring. \`device\` constrains the inner
viewport (desktop full, tablet ~768px, mobile ~390px).

**The sections drawing.** A theme with \`styles.drawing: 'sections'\` (Northfold, Torqline) is drawn as its
storefront draws it: headings in the font table's weight, the theme's button, banner buttons on the photo,
portrait collection tiles with the name under the photo, the **icon row** and its features, the product
page's **collapsible rows** beside a stacked gallery, the header's icons and colour scheme, and (with
\`template="collection"\`) the collection page's filters, sort and product grid. Every other theme's preview
is unchanged.

**The store's own header and cards** (Lumos). \`headerSearch: 'field'\` draws the header's search as a field with
\`searchPlaceholder\` (a row of its own on a phone); with \`searchable: false\` (a store not yet connected to Merchandise
Cloud) the header and the vehicle finder draw no search, as the storefront's, except in the builder's \`interactive\`
canvas; \`headerTools\` with \`'wishlist'\` adds the heart to the header,
the cards and the buy box. \`cardStyle\` is the collection template's product card: with \`'Boxed'\` every product
row is drawn in framed cards with their badge, heart and (with \`quickAdd\`) Add to cart. On a product page the
buy box shows the product's own choices (swatches for a colour) and the row under it leaves the product out.

**Plans** (Vitaheal). A product template's purchase options block is drawn in the buy box on both drawings
(\`PreviewPurchaseBlock\`), from \`purchase\`: a product's real plans, or a drawn example. On the sections drawing,
while the page opens on a plan, Add to cart reads "Add subscription to cart" and Buy now is held back; the
product-detail toggles \`quantity\` and \`stockLine\` add a stepper and "In stock, ready to ship", and
\`preselectVariant\` marks each product's \`start\` choice (without it a product whose formats differ in price reads
"From"). A card's \`badge: 'Subscribe'\` reads "Subscribe available".
The theme builder, the store page and the Themes page all pass these through \`useStorefrontPreviewProps\`.

### 🟢 Do's
- **Do** drive \`sections\`/\`styles\` from the \`useStoreThemes\` store so canvas and settings stay in sync.
- **Do** pair \`interactive\` with \`selectedId\` and a \`@select\` handler.

### 🔴 Don'ts
- **Don't** pass real commerce data — the mocks are intentionally low-fidelity section stand-ins.
- **Don't** re-style sections from the outside; use \`styles\`/section settings instead.

### A11y
- **Provides:** \`aria-label\` on the root; in interactive mode each section is a keyboard-operable
  \`role="button"\` with \`tabindex="0"\`, Enter/Space selection, and a \`:focus-visible\` ring.
- **Consumer must:** keep the selected section visible in the companion sections tree for context.
        `,
      },
    },
  },
  decorators: [constrain('section')],
  args: {
    device: 'desktop',
    interactive: false,
    selectedId: null,
  },
  argTypes: {
    selectedBlockId: { control: 'text', description: 'Block id shown with a selection ring, or `null` for none. Block-level counterpart to `selectedId`.' },
    pendingIds: { control: 'object', description: '`string[]` of section ids just generated by Da Vinci. Each gets a transient New badge and ring \u2014 the host clears the list once the cue has served its purpose.' },
    pendingBlockIds: { control: 'object', description: '`string[]` of block ids just added, given the same transient New cue at block level.' },
    sections: { control: false, description: 'Ordered ThemeSection[] for the active template; omit for the static default mock.' },
    styles: { control: 'object', description: 'Partial ThemeStyles applied as CSS vars on the preview root.' },
    device: { control: 'select', options: ['desktop', 'tablet', 'mobile'], description: 'Inner viewport frame width.' },
    interactive: { control: 'boolean', description: 'Hover outline + click/keyboard selection on sections.' },
    searchable: { control: 'boolean', description: 'Shoppers can search the store (Merchandise Cloud connected). Off: no search in the header or the vehicle finder on the sections drawing, except in the `interactive` canvas.' },
    selectedId: { control: 'text', description: 'Section id highlighted with a labeled selection ring.' },
    onSelect: { table: { category: 'events' }, description: 'Emitted with the section id on click/Enter/Space (interactive only).' },
    onHover: { table: { category: 'events' }, description: 'Emitted with the hovered section id, or null on leave (interactive only).' },
  },
} satisfies Meta<typeof StorefrontPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Sectioned: Story = {
  args: { sections: homeSections() },
}

export const Styled: Story = {
  args: { sections: homeSections(), styles: boutiqueStyles },
}

export const InteractiveSelected: Story = {
  args: { interactive: true },
  render: (args) => ({
    components: { StorefrontPreview },
    setup() {
      const sections = homeSections()
      const selectedId = ref<string | null>('story-hero')
      return { args, sections, selectedId }
    },
    template: `
      <div>
        <StorefrontPreview
          v-bind="args"
          :sections="sections"
          :selected-id="selectedId"
          @select="(id) => (selectedId = id)"
        />
        <p class="text-caption text-medium-emphasis mt-2">Selected: {{ selectedId ?? 'none' }}</p>
      </div>
    `,
  }),
}

export const MobileDevice: Story = {
  args: { sections: homeSections(), device: 'mobile' },
}

/** A rich-text section carrying heading, paragraph, and button blocks — renders the nested block mocks. */
export const SectionWithBlocks: Story = {
  args: { sections: sectionsWithBlocks() },
}

/** A collection-grid section from the "4-up" variant preset (columns: 4). */
export const CollectionGridVariant: Story = {
  args: { sections: collectionGridSections() },
}

// A store with photographs and products of its own: the banner and the story name a
// photo in their `image` setting, and `products` fills the featured-products row.
const PHOTOS = '/storefront/vitaheal'

function sectionsWithPhotos(): ThemeSection[] {
  return [
    createSection('header', {}, 'story-header-photos'),
    createSection('image-banner', { headline: 'Supplements that do one job well', subheadline: 'Made in Sweden and delivered to your door.', height: 'Large', image: `${PHOTOS}/hero.jpg` }, 'story-banner-photos'),
    createSection('featured-products', { title: 'Our range', productCount: 4 }, 'story-featured-photos'),
    createSection('image-with-text', { heading: 'One warm cup before bed', body: 'Stir one scoop into warm water about an hour before you sleep.', buttonLabel: 'Shop Unwind', image: `${PHOTOS}/story-unwind.jpg` }, 'story-story-photos'),
  ]
}

const storeProducts = [
  { name: 'Unwind', price: 'From 399 kr', image: `${PHOTOS}/unwind-1.jpg` },
  { name: 'Clear Focus', price: 'From 389 kr', image: `${PHOTOS}/clear-focus-1.jpg` },
  { name: 'Daily NAD+', price: 'From 649 kr', image: `${PHOTOS}/daily-nad-1.jpg` },
  { name: 'New product', price: '199 kr' },
]

/** With `products` and `image` settings the preview shows the store itself: its photographs, and each product's photo, name and price. A product without a photo keeps the grey stand-in. Without them (every other story) the sections are drawn. */
export const WithStorePhotos: Story = {
  args: { sections: sectionsWithPhotos(), products: storeProducts, brand: 'Vitaheal', menu: ['All products', 'Sleep', 'Sport'] },
}

// Northfold, as its home channel is seeded: a theme on the sections drawing, with its own
// photographs and products. The admin's store page, Themes page and builder draw it like this.
const northfold = snapshotFor(demoStoreFor('northfold').homeChannel, 'northfold', '2026-11-20')
const northfoldProducts = northfold.products.map((p) => ({ name: p.name, price: `$${p.price}`, image: p.imageUrls?.[0], collections: p.collections }))
const northfoldArgs = { styles: northfold.theme.styles, products: northfoldProducts, brand: northfold.chrome.wordmark, menu: northfold.chrome.nav.map((item) => item.label) }

/** Northfold's home page on the sections drawing: hero photo with its buttons, portrait tiles, the outerwear row, the icon row. */
export const SectionsDrawingHome: Story = {
  args: { ...northfoldArgs, sections: northfold.theme.templates.home },
}

/** Northfold's product template: a stacked portrait gallery beside the buy box, and its four collapsible rows. */
export const SectionsDrawingProduct: Story = {
  args: { ...northfoldArgs, sections: northfold.theme.templates.product, template: 'product' },
}

/** Northfold's collection template: the product grid with its filter rail, sort and quick-add "+". */
export const SectionsDrawingCollection: Story = {
  args: { ...northfoldArgs, sections: northfold.theme.templates.collection, template: 'collection' },
}

/** The same home page in the phone frame: the menu folds away, the icon row stacks. */
export const SectionsDrawingMobile: Story = {
  args: { ...northfoldArgs, sections: northfold.theme.templates.home, device: 'mobile' },
}

// Lumos (part 5), as its home channel is seeded: the hero's badge, accent words, words on the left
// and stats strip; the rooms carousel with names on the photos and dots, on a tint; the logo strip;
// the featured row's eyebrow and arrows in Boxed cards; the icon cards. Its header has the search
// field and the wishlist heart, as the builder passes them from the store's chrome.
const lumos = snapshotFor(demoStoreFor('lumos').homeChannel, 'lumos', '2026-11-20')
const lumosProducts = lumos.products.map((p) => ({
  name: p.name,
  price: `$${p.price}`,
  image: p.imageUrls?.[0],
  images: p.imageUrls?.slice(0, 2),
  collections: p.collections,
  options: p.detail?.options ?? [],
  badge: cardPrice(p).compareAt ? 'Sale' as const : isNewArrival(p) ? 'New' as const : undefined,
}))
const lumosGrid = gridSettings(lumos.theme.templates.collection)
const lumosArgs = {
  styles: lumos.theme.styles,
  products: lumosProducts,
  brand: lumos.chrome.wordmark,
  menu: lumos.chrome.nav.map((item) => item.label),
  headerTools: lumos.chrome.headerTools,
  headerSearch: lumos.chrome.headerSearch,
  searchPlaceholder: lumos.chrome.searchPlaceholder,
  cardStyle: lumosGrid.cardStyle,
  quickAdd: lumosGrid.quickAdd,
}

/** Lumos's home page in the builder canvas: every part 5 setting drawn as the storefront draws it. */
export const SectionsDrawingLumos: Story = {
  args: { ...lumosArgs, sections: lumos.theme.templates.home },
}

/** The same in the phone frame: the search field under the bar, the hero's buttons stacked over its stats, one room in the carousel, 1.2 featured cards, the logos three to a row. */
export const SectionsDrawingLumosMobile: Story = {
  args: { ...lumosArgs, sections: lumos.theme.templates.home, device: 'mobile' },
}

/** Lumos's product template: the sofa's fabric swatches, Add to cart with the heart, Buy now, its rows, and other pieces in Boxed cards. */
export const SectionsDrawingLumosProduct: Story = {
  args: { ...lumosArgs, sections: lumos.theme.templates.product, template: 'product' },
}

/** Lumos's collection template: its filters, sort, and Boxed cards with their badges and Add to cart. */
export const SectionsDrawingLumosCollection: Story = {
  args: { ...lumosArgs, sections: lumos.theme.templates.collection, template: 'collection' },
}

// Vitaheal (the feedback round), as its home channel is seeded: a supplements store in kronor on the sections
// drawing that sells on plans. The builder passes the purchase options of its first product on a plan, and each
// product the format its page opens on (the lowest-priced) and its card's badge, "Subscribe available" on a plan.
const vitahealChannel = demoStoreFor('vitaheal').homeChannel
const vitaheal = snapshotFor(vitahealChannel, 'vitaheal', '2026-11-20')
const vitahealStore = { currency: vitahealChannel.webStore!.currency!, locale: vitahealChannel.webStore!.locale }
const kronor = (amount: string) => formatStorePrice(roundForDisplay(parseDecimal(amount, vitahealStore.currency)!), vitahealStore.locale)
const vitahealPlansFor = (product: { id: number }) => plansForProduct(vitaheal.plans, vitahealChannel.id, product.id)
const vitahealProducts = vitaheal.products.map((p) => {
  const card = cardPrice(p)
  return {
    name: p.name,
    price: `${card.from ? 'From ' : ''}${kronor(card.price)}`,
    image: p.imageUrls?.[0],
    images: p.imageUrls?.slice(0, 2),
    collections: p.collections,
    options: p.detail?.options ?? [],
    start: cheapestSelection(p),
    badge: card.compareAt ? 'Sale' as const : vitahealPlansFor(p).length ? 'Subscribe' as const : undefined,
  }
})
const vitahealOnPlan = vitaheal.products.find((p) => vitahealPlansFor(p).length)!
const vitahealGrid = gridSettings(vitaheal.theme.templates.collection)
const vitahealArgs = {
  styles: vitaheal.theme.styles,
  products: vitahealProducts,
  purchase: purchasePreviewFor(vitahealOnPlan, vitahealPlansFor(vitahealOnPlan), vitahealStore),
  brand: vitaheal.chrome.wordmark,
  menu: vitaheal.chrome.nav.map((item) => item.label),
  headerTools: vitaheal.chrome.headerTools,
  headerSearch: vitaheal.chrome.headerSearch,
  searchPlaceholder: vitaheal.chrome.searchPlaceholder,
  cardStyle: vitahealGrid.cardStyle,
  quickAdd: vitahealGrid.quickAdd,
}

/**
 * Vitaheal's product template on the sections drawing: Unwind opens on its cheapest format (Bag) with the stock
 * line, the purchase options block in the buy box with the 3-month supply chosen, the quantity stepper, and
 * "Add subscription to cart" with Buy now held back while a plan is chosen; its rows sit under the buy box.
 */
export const SectionsDrawingVitahealProduct: Story = {
  args: { ...vitahealArgs, sections: vitaheal.theme.templates.product, template: 'product', interactive: true },
}

/**
 * Vitaheal's home as the Themes page shows it on a phone, before the store is connected to Merchandise Cloud
 * (`searchable: false`): no search in the header, as on the storefront, and in a canvas this narrow the hero's
 * stats wrap, two figures to a row and the third under them.
 */
export const SectionsDrawingVitahealBeforeSearch: Story = {
  args: { ...vitahealArgs, sections: vitaheal.theme.templates.home, searchable: false },
  decorators: [constrain('narrow')],
}
