// The "Lumos Home (demo)" store: everything seeded for sales channel `lumos-demo`.
//
// Lumos is a fictional furniture and home store: sofas, chairs, tables, storage,
// beds and bedding, lighting, rugs and a few outdoor pieces, priced in US dollars,
// with no subscriptions and no size charts. Its six makers (Oakmere, Linden Row,
// Morrow & Pine, Halden Works, Cove & Co, Brightwell Studio) are made up, and so is
// every name and line of copy; the photos are free-licence stock photos kept in
// public/storefront/lumos (credits in its CREDITS.md), and the makers' logos are
// wordmarks drawn for this demo. It is the showcase store of the Lumos theme, rebuilt
// from the UAT theme "Lumos" (its sections and their order) and the Lumos style guide
// (its colours, type, buttons and cards), so src/storefront/demoStores/lumos.ts
// installs it in any store that applies that theme.
//
// Like northfoldDemo.ts, most of it is built from an InstallContext: the ids, the
// channel, the domain and the string-id prefix of the store it is installed in, so a
// copy in another store gets ids of its own and every link follows them. Constants
// hold what no install changes (the theme's styles, the header and footer, the
// chatbot's knowledge, which link pages and collections only).
//
// Every product carries its measurements, materials, care and assembly as
// `detail.specs` rows with the labels the home profile of the chatbot reads (Width,
// Depth, Height, Seat height, Weight, Materials, Care, Assembly), and its warranty.
// Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, and no real brand (the shared suite,
// tests/storefront/demoStores.test.ts, checks it). Shipping copy matches the
// checkout and says nothing more: free delivery in 3 to 5 business days, to the
// countries the US-dollar checkout offers (src/storefront/checkoutProfile.ts). The
// checkout has no Click & collect here. Pure: types and the pure rule modules only,
// so Node runs it (tests/storefront/lumosDemo.test.ts checks the reference tables).

import type { Product, ProductOption, ProductVariant } from '../stores/useCommerce.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { BlogSeoSettings, ContentEntry } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome, StorefrontLink } from '../stores/useStorefront.ts'
import type { ChatbotConfig, ChatbotConversation } from '../stores/useChatbot.ts'
import type { PageRedirect, RecommendationEngine, SearchPin, Synonym } from '../stores/useMerchandising.ts'
import type { StoreCampaign } from './campaigns.ts'
import type { InstallContext, SnapshotCollection } from './demoStores/types.ts'
import { toHandle } from './handles.ts'
import { createBlock, createSection } from './themeSections.ts'
import type { TemplateType, ThemeSection, ThemeStyles } from './themeSections.ts'

export const LUMOS_CHANNEL_ID = 'lumos-demo'
export const LUMOS_CHANNEL_NAME = 'Lumos Home (demo)'

/** When the seed was written: the channel's dates, the theme's publish date and the collections' last update. */
export const LUMOS_SEEDED_AT = '2026-11-24T09:00:00Z'

/**
 * The store's sales channel. It starts connected to Merchandise Cloud, so search,
 * its rules and "Complete the room" work on the first visit; a restore connects it again.
 */
export const LUMOS_CHANNEL: SalesChannel = {
  id: LUMOS_CHANNEL_ID,
  accountId: '2000290',
  name: LUMOS_CHANNEL_NAME,
  storeNumber: 15,
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'connected',
  health: 'healthy',
  description: 'Furniture, lighting and decor for every room, from six makers; prices in US dollars.',
  connectedClouds: ['commerce', 'store_builder', 'merchandise'],
  createdAt: LUMOS_SEEDED_AT,
  updatedAt: LUMOS_SEEDED_AT,
  lastActivityAt: LUMOS_SEEDED_AT,
  merchandising: { status: 'connected', health: 'healthy', lastSyncAt: LUMOS_SEEDED_AT, lastActivityAt: LUMOS_SEEDED_AT },
  webStore: {
    domain: '2000290-15.uat.maropost.store',
    storeBuilderEnabled: true,
    published: true,
    merchandiseConnected: true,
    currency: 'USD',
    demo: true,
  },
}

/** What the store's own page in the admin says about it. The company is made up, like the brand. */
export const LUMOS_ADMIN = {
  /** Revenue of the last 30 days, in the store's currency. */
  revenue: '$214.6K',
  themeName: 'Lumos 1.1.9',
  business: [
    { label: 'Legal name', value: 'Lumos Home Co.' },
    { label: 'Business type', value: 'Corporation' },
    { label: 'Tax ID (EIN)', value: '46-2817390' },
    { label: 'Phone', value: '(503) 555-0163' },
    { label: 'Public email', value: 'hello@lumos.example' },
    { label: 'Support email', value: 'hello@lumos.example' },
    { label: 'Website', value: '2000290-15.uat.maropost.store' },
    { label: 'Street', value: '640 Alder Street' },
    { label: 'City / region', value: 'Portland, OR 97205' },
    { label: 'Country', value: 'United States' },
  ],
} as const

// ── Theme ────────────────────────────────────────────────────────────────────

/**
 * The Lumos style guide: ink on white with one indigo accent, Inter throughout with
 * medium-weight uppercase headings, uppercase buttons with corners of 4, white cards
 * of radius 8 with a soft shadow on a near-white surface, and a pale indigo tint
 * behind the room carousel and the brand strip. A 1328px page with 56px gutters, a
 * 64px hero headline and 32px section titles. Drawn with the sections drawing.
 *
 * Contrast (WCAG 2.1, checked in tests/storefront/lumosDemo.test.ts): text on the page
 * 14.9:1, on the surface 14.3:1; muted text on the page 5.2:1, on the surface 4.9:1,
 * on the tint 4.8:1; white on the indigo button 6.2:1, on its hover 8.3:1; the indigo
 * as text on the page 6.2:1 and on the tint 5.7:1; white on the sale red 5.2:1, and the
 * sale red as a price on a white card 5.2:1. The indigo is not for words on a photo:
 * over a dark shade it is 3.4:1 at best. Form fields are edged in the style guide's
 * neutral-500, 3.0:1 on the page and on a card (WCAG 2.1 asks 3:1 of a field's edge);
 * the hairlines between rows and around cards stay the paler divider.
 */
export const LUMOS_THEME_STYLES: ThemeStyles = {
  brandColor: '#495da7',
  accentColor: '#495da7',
  background: '#ffffff',
  textColor: '#272727',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  cornerRadius: 4,
  buttonStyle: 'solid',
  saleBadgeColor: '#d4183d',
  customBadgeColor: '#495da7',
  soldOutBadgeColor: '#272727',
  drawing: 'sections',
  // Read by the sections drawing only.
  buttonColor: '#495da7',
  surfaceColor: '#f9fafb',
  mutedColor: '#6d6d6d',
  dividerColor: '#e8e8e8',
  headingCase: 'Uppercase',
  headingWeight: 500,
  cardColor: '#ffffff',
  cardRadius: 8,
  cardShadow: 'Soft',
  buttonBorderColor: '#495da7',
  buttonHoverColor: '#394a8a',
  buttonCase: 'Uppercase',
  tintColor: '#f4f7ff',
  measure: 1328,
  gutter: 56,
  heroTitleSize: 64,
  sectionTitleSize: 32,
  controlBorderColor: '#949494',
}

/** Where the store's photos live, as the browser asks for them (the files are in public/). */
export const LUMOS_PHOTO_DIR = '/storefront/lumos'

const photo = (file: string): string => `${LUMOS_PHOTO_DIR}/${file}`

/** The photos the theme's pages use. Product photos are named on each product, the makers' logos on each maker. */
export const LUMOS_PHOTOS = {
  hero: photo('hero-living.jpg'),
  roomLiving: photo('room-living.jpg'),
  roomBedroom: photo('room-bedroom.jpg'),
  roomDining: photo('room-dining.jpg'),
  roomOffice: photo('room-office.jpg'),
  roomOutdoor: photo('room-outdoor.jpg'),
  /** A calm interior detail, for a page banner. Not drawn by any template yet. */
  pageBanner: photo('page-banner.jpg'),
} as const

// ── Catalogue ────────────────────────────────────────────────────────────────

/** The collections, in the order the admin lists them. A product is in one when it names it. */
export const LUMOS_COLLECTION_NAMES = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor', 'Lighting & Decor', 'New Arrivals', 'Best Sellers', 'Sale'] as const
export type LumosCollection = (typeof LUMOS_COLLECTION_NAMES)[number]

/** The rooms: the collections the header's menu and the home page's room carousel lead to. */
export const LUMOS_ROOMS = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Outdoor'] as const satisfies readonly LumosCollection[]

/** The kind of piece (`detail.tag`), which the storefront's Category filter offers, and the code its SKUs use. */
export const LUMOS_CATEGORIES = ['Sofas & chairs', 'Tables & desks', 'Storage', 'Beds & bedding', 'Lighting', 'Rugs & decor'] as const
export type LumosCategory = (typeof LUMOS_CATEGORIES)[number]
const CATEGORY_CODES: Record<LumosCategory, string> = {
  'Sofas & chairs': 'SEA',
  'Tables & desks': 'TBL',
  Storage: 'STO',
  'Beds & bedding': 'BED',
  Lighting: 'LGT',
  'Rugs & decor': 'DEC',
}

/** The makers (`detail.brand` and `vendor`), which the Brand filter and the home page's brand strip offer. All made up. */
export const LUMOS_BRANDS = ['Oakmere', 'Linden Row', 'Morrow & Pine', 'Halden Works', 'Cove & Co', 'Brightwell Studio'] as const
export type LumosBrand = (typeof LUMOS_BRANDS)[number]

/** A maker's logo: a wordmark drawn for this demo, `brand-<handle>.svg`. */
export const brandLogo = (brand: LumosBrand): string => photo(`brand-${toHandle(brand)}.svg`)

/** The shop-all list filtered to one maker, as the Brand filter writes it (`?brand=linden-row`). */
export const brandLink = (brand: LumosBrand): string => `/collections/all?brand=${toHandle(brand)}`

/**
 * Every swatch a product offers: fabrics, wood and metal finishes and colours. A
 * light swatch sits on the page with a hairline ring; the chosen one is marked by a
 * ring and its name, never by colour alone.
 */
export const LUMOS_SWATCHES: Readonly<Record<string, string>> = {
  Oat: '#d9cdb8',
  Slate: '#5f6b75',
  Moss: '#6f7a4f',
  Oak: '#c9a77c',
  Walnut: '#6b4a33',
  Teak: '#a86b3c',
  Black: '#262626',
  Brass: '#b5964c',
  White: '#f4f3ef',
  Sage: '#a3b19b',
  Clay: '#b9775a',
  Natural: '#e3d9c6',
  Charcoal: '#3d3d3f',
  Grey: '#8d9096',
}

/**
 * The photos of a product's other colours, by its photo name and the colour each
 * shows: `<handle>-<colour>-1.jpg`. A product's own `<handle>-1.jpg` and `-2.jpg` show
 * its first colour; a colour listed here shows its own photo, and a colour not listed
 * shows the first colour's photos, with "Shown in Oat". Remove a line when its file
 * is not in public/storefront/lumos.
 */
export const LUMOS_COLOURWAY_PHOTOS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'cloud-bedding': { Sage: 'cloud-bedding-sage-1.jpg', Clay: 'cloud-bedding-clay-1.jpg' },
  'ergo-chair': { Black: 'ergo-chair-black-1.jpg' },
}

/** Where every variant is stocked (the location the other demo stores use too). */
const LOCATION = 'Oxford Warehouse'

/** A product's one option. With swatches it is a fabric, finish or colour; without, a size shown as buttons. */
interface PieceOption {
  name: string
  values: string[]
  swatches?: true
}

const FIVE_YEAR = '5-year frame warranty'
const ONE_YEAR = '1-year warranty'

interface ProductSeed {
  /** Its place in the id block: product n is id `ctx.ids.product(n)` (5001 at home). Newest lists the highest first. */
  n: number
  name: string
  /** The base of its photos' names: `<photo>-1.jpg`, `<photo>-2.jpg`. */
  photo: string
  category: LumosCategory
  /** The first is the breadcrumb. */
  collections: LumosCollection[]
  brand: LumosBrand
  option?: PieceOption
  /** USD, one per variant in the option's order (one number: every variant the same). */
  price: number | number[]
  /** The "was" price of a piece on sale. */
  compareAt?: number
  /** Units on hand per variant, in the option's order. 0 is sold out. */
  stock: number[]
  subtitle: string
  description: string
  /** Read by the product page's "Dimensions and materials" row and by the chatbot, with these labels only. */
  specs: [label: 'Width' | 'Depth' | 'Height' | 'Seat height' | 'Weight' | 'Materials' | 'Care' | 'Assembly', value: string][]
  warranty: string
  countryOfOrigin: string
  hsCode: string
  /** Shipping weight of every variant, packed. */
  weightKg: number
}

const UPHOLSTERY_CARE = 'Vacuum weekly with a soft brush. Blot spills straight away with a damp cloth; the covers zip off for dry cleaning.'
const OILED_WOOD_CARE = 'Wipe with a damp cloth and dry. Use coasters and mats, and re-oil once a year.'
const ARRIVES_ASSEMBLED = 'Arrives assembled'
const READY_TO_USE = 'Arrives ready to use'

/**
 * In the order the "All" collection lists them, which is also each collection's
 * order: a collection lists its products in this order. `n` is the place in the id
 * block, not in this list: sorting by Newest puts the highest id first, so the five
 * New Arrivals are 16-20, the newest ids. Best Sellers holds eight pieces from every
 * room, so the home page's carousel (four in view) has more to show than one view.
 *
 * The copy describes the piece in its photos (public/storefront/lumos): its shape,
 * materials and finish, and the colour or finish it is shown in comes first.
 */
const PRODUCT_SEEDS: ProductSeed[] = [
  {
    n: 1,
    name: 'Arlo 3-Seat Sofa',
    photo: 'arlo-sofa',
    category: 'Sofas & chairs',
    collections: ['Living Room', 'Best Sellers'],
    brand: 'Linden Row',
    option: { name: 'Fabric', values: ['Oat', 'Slate', 'Moss'], swatches: true },
    price: 1299,
    stock: [14, 9, 3],
    subtitle: 'Three-seat sofa in a wool blend',
    description: 'A deep, low sofa with wide, square arms, on a plinth base that sits close to the floor. Its kiln-dried oak frame and feather-wrapped cushions keep their shape, and the wool blend cover is soft, hard-wearing and zips off for cleaning.',
    specs: [
      ['Width', '84 in'], ['Depth', '36 in'], ['Height', '33 in'], ['Seat height', '18 in'], ['Weight', '128 lb'],
      ['Materials', 'Kiln-dried oak frame, wool blend cover, feather-wrapped foam cushions'],
      ['Care', UPHOLSTERY_CARE],
      ['Assembly', ARRIVES_ASSEMBLED],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'United States',
    hsCode: '9401.61',
    weightKg: 68,
  },
  {
    n: 2,
    name: 'Arlo Lounge Chair',
    photo: 'arlo-chair',
    category: 'Sofas & chairs',
    collections: ['Living Room'],
    brand: 'Linden Row',
    option: { name: 'Fabric', values: ['Oat', 'Slate'], swatches: true },
    price: 649,
    stock: [12, 8],
    subtitle: 'Lounge chair to match the Arlo sofa',
    description: 'The Arlo sofa’s deep seat and wide, square arms, in a chair sized for a reading corner. A wool blend cover on a kiln-dried oak frame, on four low black feet.',
    specs: [
      ['Width', '32 in'], ['Depth', '34 in'], ['Height', '31 in'], ['Seat height', '18 in'], ['Weight', '52 lb'],
      ['Materials', 'Kiln-dried oak frame, wool blend cover, foam cushion, black-stained wood feet'],
      ['Care', UPHOLSTERY_CARE],
      ['Assembly', 'Arrives assembled; screw on the four feet'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'United States',
    hsCode: '9401.61',
    weightKg: 28,
  },
  {
    n: 3,
    name: 'Mesa Coffee Table',
    photo: 'mesa-table',
    category: 'Tables & desks',
    collections: ['Living Room', 'Best Sellers'],
    brand: 'Oakmere',
    option: { name: 'Finish', values: ['Oak', 'Walnut'], swatches: true },
    price: 429,
    stock: [22, 15],
    subtitle: 'Solid wood coffee table on a black base',
    description: 'A low coffee table with a thick, square-edged top in solid wood, on a sturdy blackened oak base. Finished in hard-wax oil, and sized to sit in front of a three-seat sofa.',
    specs: [
      ['Width', '48 in'], ['Depth', '24 in'], ['Height', '16 in'], ['Weight', '44 lb'],
      ['Materials', 'Solid oak or solid walnut top, blackened oak base, hard-wax oil finish'],
      ['Care', OILED_WOOD_CARE],
      ['Assembly', ARRIVES_ASSEMBLED],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '9403.60',
    weightKg: 24,
  },
  {
    n: 4,
    name: 'Halden Media Console',
    photo: 'halden-console',
    category: 'Storage',
    collections: ['Living Room'],
    brand: 'Halden Works',
    option: { name: 'Finish', values: ['Teak', 'Black'], swatches: true },
    price: 899,
    stock: [10, 7],
    subtitle: 'Low media console with drawers and cupboards',
    description: 'A long, low console in the mid-century way: three drawers between two cupboards, an adjustable shelf behind each door and a cable cut-out at the back. It stands on tapered solid wood legs, and its top holds up to 80 lb.',
    specs: [
      ['Width', '72 in'], ['Depth', '18 in'], ['Height', '28 in'], ['Weight', '82 lb'],
      ['Materials', 'Teak veneer or black-stained oak veneer on plywood, solid wood legs'],
      ['Care', 'Dust with a dry cloth, and wipe spills straight away.'],
      ['Assembly', 'Attach the legs; about 20 minutes'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Vietnam',
    hsCode: '9403.60',
    weightKg: 44,
  },
  {
    n: 5,
    name: 'Orbit Floor Lamp',
    photo: 'orbit-lamp',
    category: 'Lighting',
    collections: ['Lighting & Decor', 'Best Sellers'],
    brand: 'Brightwell Studio',
    option: { name: 'Finish', values: ['Black', 'Brass'], swatches: true },
    price: 189,
    stock: [19, 26],
    subtitle: 'Tripod floor lamp with a tilting dome shade',
    description: 'A studio-style floor lamp: a wide metal dome, lined in gold, tilts on a yoke above a slim steel tripod. It takes one E26 bulb up to 60 W, with a foot switch on the cord.',
    specs: [
      ['Width', '20 in (shade)'], ['Height', '64 in'], ['Weight', '15 lb'],
      ['Materials', 'Black powder-coated or brass-plated steel, gold-lined shade'],
      ['Care', 'Dust with a dry cloth. Switch off and let the bulb cool before you touch it.'],
      ['Assembly', 'Open the tripod and fit the shade; about 5 minutes'],
    ],
    warranty: ONE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '9405.20',
    weightKg: 8,
  },
  {
    n: 6,
    name: 'Weave Wool Rug',
    photo: 'weave-rug',
    category: 'Rugs & decor',
    collections: ['Lighting & Decor', 'Living Room'],
    brand: 'Cove & Co',
    option: { name: 'Size', values: ['5 × 8 ft', '8 × 10 ft'] },
    price: [349, 549],
    stock: [18, 9],
    subtitle: 'Hand-woven wool rug with a chunky texture',
    description: 'A hand-woven rug in undyed cream wool, with a chunky ridged texture you can see and feel. Hard-wearing enough for a living room, and soft enough to sit on.',
    specs: [
      ['Height', '0.6 in'], ['Weight', '18 lb (5 × 8 ft), 36 lb (8 × 10 ft)'],
      ['Materials', 'Hand-woven undyed wool on a cotton warp'],
      ['Care', 'Vacuum without the beater bar and blot spills. Have it cleaned by a rug specialist once a year.'],
      ['Assembly', 'Arrives rolled; lay it flat for a day. A rug pad stops it sliding.'],
    ],
    warranty: ONE_YEAR,
    countryOfOrigin: 'India',
    hsCode: '5702.91',
    weightKg: 12,
  },
  {
    n: 7,
    name: 'Haven Bed Frame',
    photo: 'haven-bed',
    category: 'Beds & bedding',
    collections: ['Bedroom', 'Best Sellers'],
    brand: 'Morrow & Pine',
    option: { name: 'Size', values: ['Queen', 'King'] },
    price: [1099, 1249],
    stock: [11, 4],
    subtitle: 'Solid ash bed frame with headboard',
    description: 'A solid ash bed frame with a low, framed panel headboard and birch slats, so it needs no box spring. Mattress not included.',
    specs: [
      ['Width', '64 in (Queen), 80 in (King)'], ['Depth', '86 in'], ['Height', '40 in at the headboard'],
      ['Weight', '110 lb (Queen), 125 lb (King)'],
      ['Materials', 'Solid ash frame and headboard, birch slats'],
      ['Care', 'Dust with a dry cloth, or wipe with a damp cloth and dry.'],
      ['Assembly', 'Two people, about 45 minutes; tools included'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Poland',
    hsCode: '9403.50',
    weightKg: 58,
  },
  {
    n: 8,
    name: 'Haven Nightstand',
    photo: 'haven-nightstand',
    category: 'Storage',
    collections: ['Bedroom'],
    brand: 'Morrow & Pine',
    option: { name: 'Finish', values: ['Oak', 'Walnut'], swatches: true },
    price: 279,
    stock: [20, 13],
    subtitle: 'Nightstand with a cane-front drawer',
    description: 'A compact nightstand to match the Haven bed, with one soft-close drawer faced in woven cane and an open shelf for books. Its top sits level with most mattresses.',
    specs: [
      ['Width', '20 in'], ['Depth', '16 in'], ['Height', '24 in'], ['Weight', '26 lb'],
      ['Materials', 'Solid oak or solid walnut, woven cane drawer front'],
      ['Care', OILED_WOOD_CARE],
      ['Assembly', ARRIVES_ASSEMBLED],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Poland',
    hsCode: '9403.50',
    weightKg: 14,
  },
  {
    n: 16,
    name: 'Cloud Linen Bedding Set',
    photo: 'cloud-bedding',
    category: 'Beds & bedding',
    collections: ['Bedroom', 'New Arrivals'],
    brand: 'Cove & Co',
    option: { name: 'Color', values: ['White', 'Sage', 'Clay'], swatches: true },
    price: 219,
    stock: [30, 21, 16],
    subtitle: 'Stonewashed linen duvet cover and pillowcases',
    description: 'A duvet cover and two pillowcases in stonewashed linen, cool in summer and warm in winter. Sized for a queen bed: the cover is 90 × 92 in.',
    specs: [
      ['Weight', '5 lb'],
      ['Materials', '100% stonewashed linen; duvet cover 90 × 92 in, two pillowcases 20 × 30 in'],
      ['Care', 'Machine wash warm on a gentle cycle and tumble dry low. It softens with every wash.'],
      ['Assembly', READY_TO_USE],
    ],
    warranty: ONE_YEAR,
    countryOfOrigin: 'India',
    hsCode: '6302.39',
    weightKg: 3,
  },
  {
    n: 9,
    name: 'Fold Dining Table',
    photo: 'fold-table',
    category: 'Tables & desks',
    collections: ['Dining', 'Best Sellers'],
    brand: 'Oakmere',
    option: { name: 'Size', values: ['6-seat', '8-seat'] },
    price: [1149, 1399],
    stock: [8, 5],
    subtitle: 'Solid oak dining table, for six or eight',
    description: 'A solid oak dining table with a slim top and splayed legs set in from the corners, so chairs slide in all round. Comes in a six-seat or an eight-seat length.',
    specs: [
      ['Width', '72 in (6-seat), 94 in (8-seat)'], ['Depth', '38 in'], ['Height', '30 in'],
      ['Weight', '105 lb (6-seat), 132 lb (8-seat)'],
      ['Materials', 'Solid oak, hard-wax oil finish'],
      ['Care', OILED_WOOD_CARE],
      ['Assembly', 'Bolt on the legs; two people, about 20 minutes'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '9403.60',
    weightKg: 62,
  },
  {
    n: 17,
    name: 'Ridge Dining Chair, set of 2',
    photo: 'ridge-chairs',
    category: 'Sofas & chairs',
    collections: ['Dining', 'New Arrivals'],
    brand: 'Oakmere',
    option: { name: 'Finish', values: ['Oak', 'Black'], swatches: true },
    price: 399,
    stock: [24, 18],
    subtitle: 'Two oak dining chairs with padded seats',
    description: 'A pair of solid oak dining chairs with a straight back rail and a padded seat in a cream cotton blend. Easy to move, and strong enough for every day.',
    specs: [
      ['Width', '19 in'], ['Depth', '21 in'], ['Height', '31 in'], ['Seat height', '18 in'], ['Weight', '24 lb (the pair)'],
      ['Materials', 'Solid oak frame, foam seat with a cotton blend cover'],
      ['Care', 'Wipe the frame with a damp cloth. Vacuum the seat and blot spills straight away.'],
      ['Assembly', ARRIVES_ASSEMBLED],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '9401.61',
    weightKg: 16,
  },
  {
    n: 18,
    name: 'Linen Pendant Light',
    photo: 'linen-pendant',
    category: 'Lighting',
    collections: ['Lighting & Decor', 'Dining', 'Best Sellers', 'New Arrivals'],
    brand: 'Brightwell Studio',
    option: { name: 'Color', values: ['Natural', 'Charcoal'], swatches: true },
    price: 159,
    stock: [17, 12],
    subtitle: 'Pendant light with a linen shade',
    description: 'A wide linen drum on a black fabric cord, to hang over a dining table or a kitchen island. It takes one E26 bulb up to 60 W.',
    specs: [
      ['Width', '18 in'], ['Height', '12 in shade, on a 60 in cord'], ['Weight', '4 lb'],
      ['Materials', 'Linen shade on a steel frame, black fabric cord'],
      ['Care', 'Dust with a soft brush. Switch it off at the wall before you clean it.'],
      ['Assembly', 'Wired to a ceiling box by an electrician'],
    ],
    warranty: ONE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '9405.11',
    weightKg: 2,
  },
  {
    n: 19,
    name: 'Ledger Desk',
    photo: 'ledger-desk',
    category: 'Tables & desks',
    collections: ['Office', 'New Arrivals'],
    brand: 'Halden Works',
    option: { name: 'Finish', values: ['Oak', 'Black'], swatches: true },
    price: 699,
    stock: [9, 6],
    subtitle: 'Oak trestle desk with a leather sling',
    description: 'A writing desk on splayed solid oak trestle legs, braced with fine steel cables, with a leather sling at one end that keeps chargers and notebooks off the top. Room for a laptop, a monitor and your notes.',
    specs: [
      ['Width', '56 in'], ['Depth', '26 in'], ['Height', '30 in'], ['Weight', '48 lb'],
      ['Materials', 'Oak veneer top, solid oak legs, steel cable braces, leather sling'],
      ['Care', 'Wipe the top with a damp cloth and dry. Rub a little leather balm into the sling now and then.'],
      ['Assembly', 'Attach the legs and braces; about 30 minutes'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Vietnam',
    hsCode: '9403.30',
    weightKg: 28,
  },
  {
    n: 10,
    name: 'Ergo Task Chair',
    photo: 'ergo-chair',
    category: 'Sofas & chairs',
    collections: ['Office', 'Best Sellers'],
    brand: 'Halden Works',
    option: { name: 'Color', values: ['Grey', 'Black'], swatches: true },
    price: 499,
    stock: [15, 0],
    subtitle: 'Adjustable office chair with a headrest',
    description: 'A task chair with a breathable mesh back and headrest, adjustable arms and lumbar support, and a seat that tilts and moves up and down. Made for long days at a desk.',
    specs: [
      ['Width', '26 in'], ['Depth', '25 in'], ['Height', '45 to 49 in'], ['Seat height', '17 to 21 in'], ['Weight', '40 lb'],
      ['Materials', 'Mesh back and headrest, foam seat, nylon base with five casters'],
      ['Care', 'Vacuum the mesh, and clean the seat with mild soap and water.'],
      ['Assembly', 'Click the base, casters and seat together; about 10 minutes, no tools'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Vietnam',
    hsCode: '9401.31',
    weightKg: 21,
  },
  {
    n: 11,
    name: 'Grid Bookshelf',
    photo: 'grid-bookshelf',
    category: 'Storage',
    collections: ['Office', 'Living Room'],
    brand: 'Morrow & Pine',
    option: { name: 'Finish', values: ['Oak', 'White'], swatches: true },
    price: 549,
    stock: [11, 8],
    subtitle: 'Tall open bookshelf with staggered cubbies',
    description: 'A tall, open bookshelf whose staggered dividers make cubbies of different widths, for books, vases and plants. Each shelf holds up to 40 lb; fix it to the wall with the kit in the box.',
    specs: [
      ['Width', '32 in'], ['Depth', '14 in'], ['Height', '84 in'], ['Weight', '95 lb'],
      ['Materials', 'Solid oak, or birch painted white'],
      ['Care', 'Dust with a dry cloth, or wipe with a damp cloth and dry.'],
      ['Assembly', 'Two people, about 40 minutes; wall fixing kit included'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Poland',
    hsCode: '9403.60',
    weightKg: 46,
  },
  {
    n: 12,
    name: 'Cove Outdoor Sofa',
    photo: 'cove-sofa',
    category: 'Sofas & chairs',
    collections: ['Outdoor', 'Best Sellers'],
    brand: 'Cove & Co',
    option: { name: 'Cushion', values: ['White', 'Charcoal'], swatches: true },
    price: 1499,
    stock: [6, 4],
    subtitle: 'Woven outdoor sofa with quick-dry cushions',
    description: 'A deep outdoor sofa in modular sections of dark all-weather wicker on rust-proof aluminum frames, with thick quick-dry cushions in a fade-resistant fabric. The sections clip together in a row, or around a corner.',
    specs: [
      ['Width', '80 in (three sections in a row)'], ['Depth', '32 in'], ['Height', '27 in'], ['Seat height', '16 in'], ['Weight', '96 lb'],
      ['Materials', 'All-weather resin wicker on aluminum frames, quick-dry foam cushions with fade-resistant covers'],
      ['Care', 'Hose the frames down. Bring the cushions in or cover them in heavy rain; the covers come off to wash cold.'],
      ['Assembly', 'Arrives in three sections: line them up and attach the clips; about 10 minutes'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Indonesia',
    hsCode: '9401.79',
    weightKg: 52,
  },
  {
    n: 13,
    name: 'Terrace Dining Set',
    photo: 'terrace-set',
    category: 'Tables & desks',
    collections: ['Outdoor'],
    brand: 'Cove & Co',
    price: 1899,
    stock: [2],
    subtitle: 'Outdoor table for ten, with rope-weave armchairs',
    description: 'A long outdoor table with a pale stone-look top on a solid teak base, and ten armchairs with teak frames and hand-woven rope seats and backs. Seats ten.',
    specs: [
      ['Width', '118 in (table)'], ['Depth', '40 in (table)'], ['Height', '30 in (table)'], ['Seat height', '18 in'],
      ['Weight', '340 lb (table and ten chairs)'],
      ['Materials', 'Stone-look composite tabletop, solid teak base, teak armchairs with rope-weave seats and backs'],
      ['Care', 'Wash with soapy water and rinse, and oil the teak once a year. Cover the set or store it over winter.'],
      ['Assembly', 'Bolt the base to the top with two people; the chairs arrive assembled'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Indonesia',
    hsCode: '9403.60',
    weightKg: 165,
  },
  {
    n: 20,
    name: 'Lantern Set of 3',
    photo: 'lantern-set',
    category: 'Lighting',
    collections: ['Outdoor', 'Lighting & Decor', 'New Arrivals'],
    brand: 'Brightwell Studio',
    price: 129,
    stock: [34],
    subtitle: 'Three wood and glass lanterns',
    description: 'Three lanterns in graded heights, with dark wood frames, clear glass and pierced metal roofs that scatter candlelight. Set them on a sideboard or a covered porch, with pillar candles or battery candles.',
    specs: [
      ['Height', '10 in, 14 in and 18 in'], ['Weight', '9 lb (all three)'],
      ['Materials', 'Dark-stained wood frames, clear glass, pierced metal roofs'],
      ['Care', 'Wipe the glass with a damp cloth. Never leave a lit candle unattended.'],
      ['Assembly', READY_TO_USE],
    ],
    warranty: ONE_YEAR,
    countryOfOrigin: 'India',
    hsCode: '9405.50',
    weightKg: 6,
  },
  {
    n: 14,
    name: 'Stone Side Table',
    photo: 'stone-table',
    category: 'Tables & desks',
    collections: ['Living Room', 'Sale'],
    brand: 'Oakmere',
    price: 219,
    compareAt: 269,
    stock: [13],
    subtitle: 'Round marble side table',
    description: 'A round side table in honed cream marble: a slim top on two curved slabs that slot together. Each piece is cut from natural stone, so its veining is its own.',
    specs: [
      ['Width', '18 in'], ['Height', '22 in'], ['Weight', '62 lb'],
      ['Materials', 'Honed cream marble top and base'],
      ['Care', 'Wipe with a damp cloth, and use a coaster: stone marks easily.'],
      ['Assembly', 'Arrives in three parts: slot the base together and lay the top on it; two people, about 10 minutes, no tools'],
    ],
    warranty: FIVE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '9403.89',
    weightKg: 32,
  },
  {
    n: 15,
    name: 'Ceramic Vase Trio',
    photo: 'vase-trio',
    category: 'Rugs & decor',
    collections: ['Lighting & Decor', 'Sale'],
    brand: 'Cove & Co',
    price: 89,
    compareAt: 109,
    stock: [27],
    subtitle: 'Three textured stoneware vases',
    description: 'Three hand-shaped stoneware vases with a raw, sandy finish, in shapes that look right grouped together. Glazed inside, so they hold water for fresh stems, or leave them empty for dried ones.',
    specs: [
      ['Height', '8 in, 9 in and 10 in'], ['Weight', '7 lb (all three)'],
      ['Materials', 'Stoneware, unglazed outside and glazed inside'],
      ['Care', 'Hand wash. Not for the dishwasher.'],
      ['Assembly', READY_TO_USE],
    ],
    warranty: ONE_YEAR,
    countryOfOrigin: 'Portugal',
    hsCode: '6913.90',
    weightKg: 4,
  },
]

/** The price of each variant, in the option's order. */
function pricesOf(seed: ProductSeed): number[] {
  const count = seed.option?.values.length ?? 1
  return typeof seed.price === 'number' ? Array.from({ length: count }, () => seed.price as number) : seed.price
}

/** One variant per value of the product's option (one in all for a piece without one), with its SKU and stock. */
function variantsOf(seed: ProductSeed, productId: number, ctx: InstallContext): ProductVariant[] {
  const values = seed.option?.values ?? [undefined]
  const prices = pricesOf(seed)
  if (values.length !== seed.stock.length || values.length !== prices.length) {
    throw new Error(`${seed.name}: ${values.length} variants, ${seed.stock.length} stock counts, ${prices.length} prices`)
  }
  return values.map((value, i): ProductVariant => ({
    id: ctx.ids.variant(productId, i + 1),
    title: value ?? 'Default',
    ...(value ? { optionValues: [value] } : {}),
    sku: `LM-${CATEGORY_CODES[seed.category]}-${1000 + seed.n * 10 + i + 1}`,
    manageInventory: true,
    allowBackorder: false,
    costPrice: (prices[i]! * 0.42).toFixed(2),
    price: prices[i]!.toFixed(2),
    ...(seed.compareAt ? { compareAtPrice: seed.compareAt.toFixed(2) } : {}),
    weight: seed.weightKg.toFixed(2),
    stock: { [LOCATION]: seed.stock[i]! },
  }))
}

function optionsOf(seed: ProductSeed): ProductOption[] {
  const option = seed.option
  if (!option) return []
  if (!option.swatches) return [{ name: option.name, values: [...option.values], display: 'buttons' }]
  return [{
    name: option.name,
    values: [...option.values],
    display: 'swatches',
    swatches: Object.fromEntries(option.values.map((value) => [value, LUMOS_SWATCHES[value]!])),
  }]
}

/**
 * A product's photos: its own two, which show its first colour, then one per other
 * colour photographed (LUMOS_COLOURWAY_PHOTOS), with each colour's photos when it has
 * any. A photo is listed under the one colour it shows, so its alt text never names another.
 */
function photosOf(seed: ProductSeed): { imageUrls: string[]; imagesByColor?: Record<string, string[]> } {
  const own = [photo(`${seed.photo}-1.jpg`), photo(`${seed.photo}-2.jpg`)]
  const colourways = Object.entries(LUMOS_COLOURWAY_PHOTOS[seed.photo] ?? {})
    .filter(([value]) => seed.option?.values.includes(value))
    .map(([value, file]): [string, string[]] => [value, [photo(file)]])
  const first = seed.option?.values[0]
  if (!colourways.length || first === undefined) return { imageUrls: own }
  return {
    imageUrls: [...own, ...colourways.flatMap(([, files]) => files)],
    imagesByColor: Object.fromEntries([[first, own], ...colourways]),
  }
}

/**
 * The twenty products, assigned to the store they are installed in. `status` is left
 * to useCommerce, which derives it from the stock like every other product's. Each
 * product gets its own copy of its specs, so an edit to one never reaches another.
 */
export function lumosProducts(ctx: InstallContext): Omit<Product, 'status'>[] {
  return PRODUCT_SEEDS.map((seed) => {
    const id = ctx.ids.product(seed.n)
    const variants = variantsOf(seed, id, ctx)
    const handle = toHandle(seed.name)
    const { imageUrls, imagesByColor } = photosOf(seed)
    const materials = seed.specs.find(([label]) => label === 'Materials')?.[1] ?? ''
    return {
      id,
      name: seed.name,
      sku: variants[0]!.sku,
      price: Math.min(...pricesOf(seed)).toFixed(2),
      compareAtPrice: seed.compareAt ? seed.compareAt.toFixed(2) : '',
      inventory: seed.stock.reduce((total, units) => total + units, 0),
      category: 'Home & Living',
      vendor: seed.brand,
      images: imageUrls.length,
      variants: variants.length,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [ctx.channelName],
      productType: 'Physical',
      channelIds: [ctx.channelId],
      imageUrls,
      detail: {
        subtitle: seed.subtitle,
        url: handle,
        description: seed.description,
        hasVariants: variants.length > 1,
        options: optionsOf(seed),
        variantsList: variants,
        taxCategory: 'Standard General Merchandise',
        material: materials,
        brand: seed.brand,
        tag: seed.category,
        collection: seed.collections[0] ?? '',
        categories: ['Home & Living'],
        width: '',
        length: '',
        height: '',
        weight: seed.weightKg.toFixed(2),
        midCode: '',
        hsCode: seed.hsCode,
        countryOfOrigin: seed.countryOfOrigin,
        discountable: true,
        salesChannels: [ctx.channelName],
        seo: {
          title: `${seed.name} | Lumos Home`,
          metaDescription: `${seed.subtitle}. ${seed.description}`,
          urlHandle: handle,
          ogTitle: seed.name,
          ogDescription: seed.subtitle,
        },
        ...(imagesByColor ? { imagesByColor } : {}),
        specs: seed.specs.map(([label, value]) => ({ label, value })),
        warranty: seed.warranty,
      },
    }
  })
}

/** What each collection page says under its title. */
const COLLECTION_DESCRIPTIONS: Record<LumosCollection, string> = {
  'Living Room': 'Sofas, chairs, tables and storage for the room you spend the most time in.',
  Bedroom: 'A solid wood bed, a nightstand to match and linen bedding.',
  Dining: 'A table for six or eight, chairs to go with it, and a light to hang above.',
  Office: 'A desk, a chair for long days, and shelves for everything else.',
  Outdoor: 'A woven sofa, a dining set for ten and lanterns for the patio.',
  'Lighting & Decor': 'Lamps, pendants, lanterns, rugs and vases: the things that finish a room.',
  'New Arrivals': 'The newest pieces in the collection.',
  'Best Sellers': 'The pieces our customers come back for.',
  Sale: 'A few pieces at a lower price, while stock lasts.',
}

/** The collections as the admin lists them. On the storefront a collection is its name on the products. */
export function lumosCollections(ctx: InstallContext): SnapshotCollection[] {
  return LUMOS_COLLECTION_NAMES.map((title, i) => ({
    id: ctx.ids.collection(i + 1),
    title,
    productCount: PRODUCT_SEEDS.filter((p) => p.collections.includes(title)).length,
    updatedAt: LUMOS_SEEDED_AT,
    description: COLLECTION_DESCRIPTIONS[title],
  }))
}

// ── Campaigns ────────────────────────────────────────────────────────────────
// One running from the day the store is opened, one over and one to come, so the
// Campaigns page shows every state and the announcement bar has an offer. COZY20
// covers the Living Room collection, the Stone Side Table on sale included, and its
// message says so.

function daysBefore(today: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = today.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** The store's campaigns, as of `ctx.today` ("YYYY-MM-DD"). */
export function lumosCampaigns(ctx: InstallContext): StoreCampaign[] {
  const day = (fromToday: number): string => daysBefore(ctx.today, -fromToday)
  const stamp = (date: string): string => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return [
    {
      id: `camp-${ctx.prefix}-winter-home`,
      channelId: ctx.channelId,
      name: 'Winter home event',
      targets: ['Living Room'],
      startDate: day(0), startTime: '00:00', endDate: day(20), endTime: '23:59',
      updatedAt: stamp(day(0)),
      offer: { message: 'Winter home event: 20% off the living room, sale pieces included, with code COZY20', code: 'COZY20', discountPct: 20 },
      orders: 7,
      revenue: 638_900,
    },
    {
      id: `camp-${ctx.prefix}-bedroom-refresh`,
      channelId: ctx.channelId,
      name: 'Bedroom refresh',
      targets: ['Bedroom'],
      startDate: day(-45), startTime: '08:00', endDate: day(-38), endTime: '23:59',
      updatedAt: stamp(day(-38)),
      offer: { message: 'Bedroom refresh: 15% off the bedroom with code REST15', code: 'REST15', discountPct: 15 },
      orders: 29,
      revenue: 2_418_500,
    },
    {
      id: `camp-${ctx.prefix}-home-office`,
      channelId: ctx.channelId,
      name: 'Home office refresh',
      targets: ['Office'],
      startDate: day(35), startTime: '08:00', endDate: day(48), endTime: '23:59',
      updatedAt: stamp(day(-1)),
      offer: { message: 'Home office refresh: 15% off the office with code OFFICE15', code: 'OFFICE15', discountPct: 15 },
      orders: 0,
      revenue: 0,
    },
  ]
}

// ── Merchandising ────────────────────────────────────────────────────────────
// Search rules and recommendation engines (the store is connected to Merchandise
// Cloud from the start). Each changes what a shopper sees: what a search finds
// (src/storefront/search.ts) or the row under a product.

const MERCH_UPDATED = 'Nov 24, 2026'

export function lumosMerchandising(ctx: InstallContext): {
  synonyms: Synonym[]
  redirects: PageRedirect[]
  searchPins: SearchPin[]
  engines: RecommendationEngine[]
} {
  const id = (name: string): string => `${ctx.home ? 'lm' : ctx.prefix}-${name}`
  const row = { channelId: ctx.channelId, updatedAt: MERCH_UPDATED }
  const storeUrl = `https://${ctx.domain}`
  /** A product's id in this store, by its name. */
  const pin = (...names: string[]): string[] => names.map((name) => String(ctx.ids.product(PRODUCT_SEEDS.find((p) => p.name === name)!.n)))
  return {
    synonyms: [
      // "couch" and "settee" are in no product's copy; with the rule they find the sofas.
      { id: id('syn-sofa'), ...row, status: 'active', type: 'two_way', queries: ['sofa', 'couch', 'settee'], leadsTo: [] },
      // The store's lights, whatever a shopper calls them: "desk lamp" finds the floor lamp, the pendant
      // and the lanterns, not nothing. (Not "light": it also finds every piece in Lighting & Decor, rugs and vases too.)
      { id: id('syn-lights'), ...row, status: 'active', type: 'two_way', queries: ['lamp', 'floor lamp', 'pendant light', 'lantern'], leadsTo: [] },
      { id: id('syn-nightstand'), ...row, status: 'active', type: 'two_way', queries: ['nightstand', 'bedside table', 'night table'], leadsTo: [] },
      { id: id('syn-bookshelf'), ...row, status: 'active', type: 'two_way', queries: ['bookshelf', 'bookcase', 'shelving'], leadsTo: [] },
      { id: id('syn-duvet'), ...row, status: 'active', type: 'one_way', queries: ['duvet', 'duvet cover', 'sheets'], leadsTo: ['bedding'] },
      { id: id('syn-patio'), ...row, status: 'active', type: 'one_way', queries: ['patio', 'garden'], leadsTo: ['outdoor'] },
    ],
    redirects: [
      { id: id('red-delivery'), ...row, queries: ['delivery', 'shipping', 'delivery time', 'shipping cost'], leadsTo: `${storeUrl}/page/delivery-and-returns` },
      { id: id('red-returns'), ...row, queries: ['returns', 'return', 'refund', 'return policy'], leadsTo: `${storeUrl}/policies/refund-policy` },
      { id: id('red-care'), ...row, queries: ['care guide', 'how to clean', 'cleaning'], leadsTo: `${storeUrl}/page/care-guide` },
    ],
    searchPins: [
      // The Fold Dining Table is the best-selling table, so it leads a search for tables.
      { id: id('pin-table'), ...row, query: 'table', pinnedProductIds: pin('Fold Dining Table') },
      // The Ergo Task Chair is the best-selling chair: without the pin the lounge chair comes first.
      { id: id('pin-chair'), ...row, query: 'chair', pinnedProductIds: pin('Ergo Task Chair') },
    ],
    engines: [
      { id: id('engine-complete-room'), ...row, name: 'Complete the room', page: 'product', type: 'frequently_purchased_together', status: 'active', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:15 AM` },
      // Switched off: turn it on, and the first one off, and the row under a product shows the newest pieces.
      { id: id('engine-new-arrivals'), ...row, name: 'New arrivals', page: 'product', type: 'newest_products', status: 'inactive', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:20 AM` },
    ],
  }
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// The assistant answers on the home profile (src/chatbot/assistantProfiles.ts):
// sizes, materials, care, assembly, delivery, returns and orders, reading each
// product's specs. What it knows about the store is written here in short answers,
// each agreeing with the page it names.

/** What differs from a new chatbot's settings. */
export const LUMOS_CHATBOT: Partial<ChatbotConfig> = {
  storeName: 'Lumos Home',
  storeType: 'Home & Living',
  brandName: 'Lumos assistant',
  brandSubtitle: 'Sizes, delivery and orders',
  primaryColor: '#495da7',
  position: 'right',
  launcherText: 'Questions?',
  launcherTextEnabled: true,
  welcomeMessage: 'Hi! Ask me about sizes, materials, delivery or your order.',
  preChatEnabled: false,
  quickPrompts: [
    { id: 1, text: 'How big is the Arlo sofa?', enabled: true },
    { id: 2, text: 'Where is my order?', enabled: true },
    { id: 3, text: 'Does it need assembly?', enabled: true },
    { id: 4, text: 'How do returns work?', enabled: true },
    { id: 5, text: 'What’s on sale?', enabled: true },
  ],
  knowledgeSources: [
    {
      id: 1, name: 'Store policies', icon: 'file-text', items: 3, meta: 'Added 24 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Returns and refunds', url: '/policies/refund-policy', text: 'Returns are free within 30 days of delivery, sale pieces included, as long as the piece is unused and in its original condition. Write to hello@lumos.example with your order number and we arrange the return. We refund your original payment method within 5 business days of receiving it.' },
        { title: 'Privacy and your data', url: '/policies/privacy-policy', text: 'We keep only what we need to deliver your order: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.' },
        { title: 'Prices and payment', url: '/policies/terms-of-service', text: 'Prices are in US dollars and delivery is free, so the total at checkout is what you pay. You can pay by card, Apple Pay or Google Pay. One discount code per order.' },
      ],
    },
    {
      id: 2, name: 'Help pages', icon: 'globe', items: 7, meta: 'Added 24 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Delivery times and cost', url: '/page/delivery-and-returns', text: 'Delivery is free on every order, large or small. It takes 3 to 5 business days, and we email you a tracking link when your order ships.' },
        { title: 'Where we deliver', url: '/page/delivery-and-returns', text: 'We deliver to the United States, Canada, Australia, New Zealand and the United Kingdom. Orders outside the US may owe import duties on delivery.' },
        { title: 'Will it fit?', url: '/page/faq', text: 'Every product page lists the piece’s width, depth and height under “Dimensions and materials”. Measure your room, and the doorways, stairs and halls it has to pass through, before you order.' },
        { title: 'Assembly', url: '/page/faq', text: 'Most pieces arrive assembled or need only their legs screwed on. The bed frame, the dining tables, the bookshelf and the marble side table take two people; each product page says what is needed and how long it takes. Pendant lights are wired by an electrician.' },
        { title: 'Caring for wood, fabric and rugs', url: '/page/care-guide', text: 'Wipe oiled wood with a damp cloth and dry it, use coasters, and re-oil it once a year. Vacuum upholstery weekly and blot spills straight away. Vacuum wool rugs without the beater bar.' },
        { title: 'Warranty', url: '/page/faq', text: 'Sofas, chairs, tables, beds and storage have a 5-year frame warranty. Lighting, rugs, bedding and decor have a 1-year warranty.' },
        { title: 'Contact and hours', url: '/page/contact', text: 'Write to hello@lumos.example or call (503) 555-0163. We answer within one business day, Monday to Friday, 9 a.m. to 5 p.m. PT.' },
      ],
    },
  ],
}

/** Earlier chats, so the admin's Conversations page has this store's own history. Each answer is the one the assistant gives today. */
export const LUMOS_CONVERSATIONS: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'jordan.lee@example.com', startedAt: 'Today, 10:12 AM', topic: 'Dimensions', resolved: true,
    messages: [
      { from: 'shopper', text: 'How big is the Arlo sofa?', time: '10:12 AM' },
      { from: 'bot', text: 'The Arlo 3-Seat Sofa is 84 in wide, 36 in deep and 33 in high.', time: '10:12 AM' },
      { from: 'shopper', text: 'What is the seat height?', time: '10:12 AM' },
      { from: 'bot', text: 'The Arlo 3-Seat Sofa’s seat is 18 in high.', time: '10:12 AM' },
      { from: 'shopper', text: 'What colors does it come in?', time: '10:13 AM' },
      { from: 'bot', text: 'The Arlo 3-Seat Sofa comes in Oat, Slate and Moss.', time: '10:13 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 4:30 PM', topic: 'Delivery', resolved: true,
    messages: [
      { from: 'shopper', text: 'How much is delivery for a dining table?', time: '4:30 PM' },
      { from: 'bot', text: 'Delivery is free on every order, large or small. It takes 3 to 5 business days, and we email you a tracking link when your order ships.', time: '4:30 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Sun, 11:20 AM', topic: 'Care', resolved: true,
    messages: [
      { from: 'shopper', text: 'How do I look after the Mesa coffee table?', time: '11:20 AM' },
      { from: 'bot', text: 'Mesa Coffee Table: Wipe with a damp cloth and dry. Use coasters and mats, and re-oil once a year.', time: '11:20 AM' },
    ],
  },
]

// ── Storefront header and footer ─────────────────────────────────────────────

const linkTo = (title: LumosCollection): StorefrontLink => ({ label: title, href: `/collections/${toHandle(title)}` })
/** The header's menu: the rooms, then Sale. */
const HEADER_LINKS = ([...LUMOS_ROOMS, 'Sale'] as const).map(linkTo)
const SHOP_LINKS = (['New Arrivals', 'Best Sellers', ...LUMOS_ROOMS, 'Lighting & Decor', 'Sale'] as const).map(linkTo)
const PAGE_LINKS: StorefrontLink[] = [
  { label: 'FAQ', href: '/page/faq' },
  { label: 'Delivery and returns', href: '/page/delivery-and-returns' },
  { label: 'Care guide', href: '/page/care-guide' },
  { label: 'Refund policy', href: '/policies/refund-policy' },
  { label: 'About Lumos', href: '/page/about' },
]

export const LUMOS_CHROME: StorefrontChrome = {
  // Drawn in capitals by the theme's heading case; the tab title and the logo link's name read "Lumos".
  wordmark: 'Lumos',
  wordmarkIcon: null,
  announcementAboveHeader: true,
  // Search shows while the store is connected to Merchandise Cloud (it starts connected).
  headerTools: ['search', 'account', 'wishlist'],
  headerSearch: 'field',
  accountHref: '/account',
  social: [],
  searchPlaceholder: 'Search furniture and decor',
  nav: HEADER_LINKS,
  mobileNav: [
    { label: 'Shop all', href: '/collections/all' },
    ...SHOP_LINKS,
    ...PAGE_LINKS,
    { label: 'Your account', href: '/account' },
    { label: 'Cart', href: '/cart-page' },
  ],
  footerColumns: [
    {
      heading: { label: 'Shop', href: '/collections/all' },
      items: SHOP_LINKS,
    },
    {
      heading: { label: 'Help', href: '/page/faq' },
      items: [...PAGE_LINKS, { label: 'Your account', href: '/account' }],
    },
  ],
  tagline: 'Furniture made to live with',
  newsletterColumn: true,
  newsletter: {
    heading: 'Ideas for every room, once a month',
    placeholder: 'Email address',
    consent: [
      'I agree to the ',
      { label: 'terms of service', href: '/policies/terms-of-service' },
      ' and the ',
      { label: 'privacy policy', href: '/policies/privacy-policy' },
      '.',
    ],
    button: 'Subscribe',
    busy: 'Subscribing...',
    success: 'Thanks. You’re on the list.',
  },
  bottomLinks: [
    { label: 'Privacy policy', href: '/policies/privacy-policy' },
    { label: 'Terms of service', href: '/policies/terms-of-service' },
    { label: 'Accessibility', href: '/page/accessibility' },
  ],
  copyright: '© 2026 Lumos Home (demo store)',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────

export function lumosMenus(ctx: InstallContext): StoreMenu[] {
  const menu = (name: string, handle: string, key: string, links: StorefrontLink[]): StoreMenu => ({
    id: `menu-${ctx.prefix}-${key}`,
    channelId: ctx.channelId,
    name,
    handle,
    status: 'Active',
    updatedAt: MERCH_UPDATED,
    items: links.map((link, i) => ({ id: `mi-${ctx.prefix}-${key}-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  })
  return [
    menu('Main menu', 'main-menu', 'main', LUMOS_CHROME.nav),
    menu('Footer menu', 'footer-menu', 'footer', [...LUMOS_CHROME.footerColumns[1]!.items, ...LUMOS_CHROME.bottomLinks!]),
  ]
}

// ── Pages and policies ───────────────────────────────────────────────────────
// No blog posts, so nothing links to a blog. Every fact agrees with the checkout,
// the chatbot's knowledge and the other pages.

const PAGES: [kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string][] = [
  [
    'page', 'about', 'About Lumos',
    '<h2>Furniture made to live with</h2><p>Lumos sells furniture, lighting and decor for every room, from six makers we know well: Oakmere, Linden Row, Morrow &amp; Pine, Halden Works, Cove &amp; Co and Brightwell Studio. We choose pieces that are comfortable on the first day and still look right years later.</p><h3>How we work</h3><ul><li>Solid wood and tested fabrics, with a 5-year frame warranty on sofas, chairs, tables, beds and storage.</li><li>Every product page lists the piece’s measurements, materials, care and assembly.</li><li>Delivery is free on every order, and returns are free within 30 days.</li></ul>',
    'Lumos sells furniture, lighting and decor for every room, from six makers, with free delivery and 30-day returns.',
  ],
  [
    'page', 'delivery-and-returns', 'Delivery and returns',
    '<h2>Free delivery on every order</h2><p>Delivery is free on every order, large or small. It takes 3 to 5 business days, and we email you a tracking link when your order ships.</p><p>We deliver to the United States, Canada, Australia, New Zealand and the United Kingdom. Orders outside the US may owe import duties on delivery.</p><h2>Free returns within 30 days</h2><p>Send back any piece that is unused and in its original condition within 30 days of delivery. Sale pieces too.</p><ol><li>Write to hello@lumos.example with your order number.</li><li>We arrange the return with you, at no cost.</li><li>We refund your original payment method within 5 business days of receiving it.</li></ol><p>The full terms are in our <a href="/policies/refund-policy">refund policy</a>.</p>',
    'Free delivery on every order in 3 to 5 business days, and free returns within 30 days.',
  ],
  [
    'page', 'care-guide', 'Care guide',
    '<h2>Looking after your pieces</h2><p>A little care keeps wood, fabric and stone looking good for years. Each product page lists its own care under “Dimensions and materials”.</p><h3>Oiled wood</h3><p>Wipe with a damp cloth and dry it. Use coasters and mats, and re-oil it once a year to keep the finish.</p><h3>Upholstery</h3><p>Vacuum weekly with a soft brush and blot spills straight away with a damp cloth. The Arlo covers zip off for dry cleaning.</p><h3>Wool rugs</h3><p>Vacuum without the beater bar and blot spills. Have the rug cleaned by a specialist once a year.</p><h3>Linen</h3><p>Machine wash warm on a gentle cycle and tumble dry low. Linen softens with every wash.</p><h3>Stone and ceramics</h3><p>Wipe stone with a damp cloth and use a coaster: it marks easily. Hand wash vases.</p><h3>Outdoor pieces</h3><p>Hose wicker, teak and aluminum frames down, and cover them or store them over winter. Oil teak once a year, and bring cushions in when heavy rain is due.</p>',
    'How to look after oiled wood, upholstery, wool rugs, linen, stone and outdoor furniture.',
  ],
  [
    'page', 'faq', 'Frequently asked questions',
    '<h2>Frequently asked questions</h2><h3>Orders</h3><ul><li><strong>Where is my order?</strong> Every order and its status is in <a href="/account">your account</a>, and we email you a tracking link when it ships.</li><li><strong>Can I change my order?</strong> Write to us as soon as you can, and we change it if it has not shipped yet.</li></ul><h3>Delivery</h3><ul><li><strong>How much is delivery?</strong> Nothing: delivery is free on every order. It takes 3 to 5 business days. More in <a href="/page/delivery-and-returns">Delivery and returns</a>.</li></ul><h3>Sizes and fit</h3><ul><li><strong>Will it fit?</strong> Every product page lists the width, depth and height. Measure your room, and the doorways, stairs and halls the piece has to pass through.</li></ul><h3>Assembly</h3><ul><li><strong>Does it need assembly?</strong> Most pieces arrive assembled or need only their legs screwed on. The bed frame, the dining tables, the bookshelf and the marble side table take two people. Pendant lights are wired by an electrician.</li></ul><h3>Warranty</h3><ul><li><strong>What does the warranty cover?</strong> Sofas, chairs, tables, beds and storage have a 5-year frame warranty. Lighting, rugs, bedding and decor have a 1-year warranty.</li></ul><h3>Care</h3><ul><li><strong>How do I look after it?</strong> See our <a href="/page/care-guide">care guide</a>.</li></ul><h3>Contact</h3><ul><li><strong>How do I reach you?</strong> Write to hello@lumos.example or call (503) 555-0163. We answer within one business day, Monday to Friday, 9 a.m. to 5 p.m. PT.</li></ul>',
    'Answers about orders, delivery, sizes, assembly, warranty and care at Lumos.',
  ],
  [
    'page', 'contact', 'Contact us',
    '<h2>Contact us</h2><p>Write to <a href="mailto:hello@lumos.example">hello@lumos.example</a> or call (503) 555-0163. We answer within one business day, Monday to Friday, 9 a.m. to 5 p.m. PT.</p><p>For an order, include its number: you find it in <a href="/account">your account</a> and in your confirmation email.</p><p>Quick answers on delivery, assembly, warranty and care are in our <a href="/page/faq">FAQ</a>.</p>',
    'How to reach Lumos: email, phone and hours.',
  ],
  [
    'page', 'accessibility', 'Accessibility',
    '<h2>Accessibility</h2><p>We want everyone to be able to shop with us. This store is built to meet WCAG 2.1 AA: you can use every part of it with a keyboard or a screen reader, text has enough contrast to read, and every photo is described.</p><h3>Need a hand?</h3><p>If something gets in your way, write to hello@lumos.example or call (503) 555-0163, and we will help you find a piece or place your order.</p>',
    'How the Lumos store is built so everyone can use it, and how to reach us for help.',
  ],
  [
    'policy', 'refund-policy', 'Refund policy',
    '<h2>Refund policy</h2><p>You can return any piece that is unused and in its original condition within 30 days of delivery. Returns are free, sale pieces included.</p><h3>How to return</h3><p>Write to hello@lumos.example with your order number and we arrange the return with you.</p><h3>Refunds</h3><p>We refund the full price you paid to your original payment method, within 5 business days of receiving the return.</p><p>More on delivery and returns: <a href="/page/delivery-and-returns">Delivery and returns</a>.</p>',
    'How returns and refunds work at Lumos.',
  ],
  [
    'policy', 'privacy-policy', 'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect what we need to deliver your order: your name, address, email and order history. Your card details go straight to our payment provider and never reach us.</p><h3>Email</h3><p>We only send marketing email if you sign up for it, and every message has an unsubscribe link.</p><h3>Your wishlist</h3><p>The pieces you save to your wishlist are kept in this browser only.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@lumos.example.</p>',
    'What personal data Lumos collects, why, and your rights.',
  ],
  [
    'policy', 'terms-of-service', 'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in US dollars, and delivery is free on every order.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. If a piece sells out before we can ship it, we cancel that item and refund it in full.</p><h3>Discount codes</h3><p>One code per order. A code applies only to the collections and dates it names, and can’t be exchanged for cash.</p><h3>Delivery and returns</h3><p>Delivery takes 3 to 5 business days. You can return unused pieces within 30 days of delivery for a full refund.</p><h3>Warranty</h3><p>Sofas, chairs, tables, beds and storage have a 5-year frame warranty; lighting, rugs, bedding and decor a 1-year warranty.</p>',
    'The terms that apply when you buy from the Lumos store.',
  ],
]

export function lumosContent(ctx: InstallContext): ContentEntry[] {
  return PAGES.map(([kind, handle, title, body, seoDescription]) => ({
    id: `${ctx.prefix}-${kind}-${handle}`,
    channelId: ctx.channelId,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | Lumos Home`,
    seoDescription,
    imageName: '',
    publishedAt: '',
    updatedAt: MERCH_UPDATED,
  }))
}

export const LUMOS_BLOG_SEO: BlogSeoSettings = {
  title: 'Lumos Journal',
  metaDescription: 'Room ideas, care tips and new pieces from the Lumos team.',
}

// ── Theme templates ──────────────────────────────────────────────────────────
// Drawn by the sections drawing (LUMOS_THEME_STYLES.drawing), with what the Lumos
// theme adds to it:
//   image-banner       `badge` (a pill above the headline), `accentWords` (words of the
//                      headline in the accent colour), `contentPosition` 'Center left',
//                      two `button` blocks (the second an outline) and up to three
//                      `stat` blocks { value, label } on a strip under the buttons.
//   collection-grid    on the home page: `layout` 'Carousel', `tileStyle` 'Label over
//                      photo', `background` 'Tint', `accentWords` (of the title), and
//                      `collection` blocks with `accent` (words of their label).
//   logo-strip         `eyebrow`, `title`, `background`, and `logo` blocks { name, image, link }.
//   featured-products  `eyebrow` above the title, and `accentWords`.
//   icon-row           `eyebrow`, `subtitle`, `alignment` 'Center' and `tileStyle` 'Card'.
//   product-detail     the `specs` row ("Dimensions and materials") and the warranty row.
//   collection-grid    on the collection template: `cardStyle: 'Boxed'`, the style
//                      guide's product card with a wishlist heart and Add to cart, and
//                      `facets` (the filter groups, in order).

const HEADER = { menuStyle: 'Inline', sticky: true, colorScheme: 'Light' } as const
const FOOTER = { showSocial: false, columns: 4, colorScheme: 'Light' } as const
const DELIVERY_AND_RETURNS = 'Free delivery on every order, in 3 to 5 business days. Free returns within 30 days of delivery, as long as the piece is unused.'

/** The rooms on the home page's carousel: a photo each, and the words of its label drawn in the accent colour. */
const ROOM_TILES: Record<(typeof LUMOS_ROOMS)[number], { label: string; accent: string; image: string }> = {
  'Living Room': { label: 'Living room essentials', accent: 'essentials', image: LUMOS_PHOTOS.roomLiving },
  Bedroom: { label: 'Bedroom comfort', accent: 'comfort', image: LUMOS_PHOTOS.roomBedroom },
  Dining: { label: 'Dining together', accent: 'together', image: LUMOS_PHOTOS.roomDining },
  Office: { label: 'Home office', accent: 'office', image: LUMOS_PHOTOS.roomOffice },
  Outdoor: { label: 'Outdoor living', accent: 'living', image: LUMOS_PHOTOS.roomOutdoor },
}

export function lumosThemeTemplates(ctx: InstallContext): Record<TemplateType, ThemeSection[]> {
  const id = (name: string): string => `${ctx.prefix}-${name}`
  const header = (template: TemplateType) => createSection('header', { ...HEADER }, id(`${template}-header`))
  const footer = (template: TemplateType) => createSection('footer', { ...FOOTER }, id(`${template}-footer`))
  const row = (key: string, settings: Record<string, string | boolean>) => createBlock('collapsible-row', { text: '', open: false, ...settings }, id(`row-${key}`))
  return {
    home: [
      createSection('announcement-bar', { text: 'Free delivery on every order · 30-day returns', link: '' }, id('home-announcement')),
      header('home'),
      {
        ...createSection('image-banner', {
          badge: 'New arrivals',
          headline: 'Discover your perfect place',
          accentWords: 'perfect place',
          subheadline: 'Sofas, beds, tables and lighting from six makers we trust, delivered free to your door.',
          height: 'Large',
          contentPosition: 'Center left',
          image: LUMOS_PHOTOS.hero,
        }, id('home-hero')),
        blocks: [
          createBlock('button', { label: 'Shop new arrivals', link: '/collections/new-arrivals' }, id('hero-new-arrivals')),
          createBlock('button', { label: 'Browse rooms', link: '/collections/all' }, id('hero-rooms')),
          createBlock('stat', { value: '12K+', label: 'Homes furnished' }, id('hero-stat-homes')),
          createBlock('stat', { value: '4.8/5', label: 'Customer rating' }, id('hero-stat-rating')),
          createBlock('stat', { value: '5-year', label: 'Frame warranty' }, id('hero-stat-warranty')),
        ],
      },
      {
        ...createSection('collection-grid', {
          title: 'Shop by room',
          accentWords: 'room',
          layout: 'Carousel',
          tileStyle: 'Label over photo',
          background: 'Tint',
          columns: 3,
          tileRatio: 'Landscape',
        }, id('home-rooms')),
        blocks: LUMOS_ROOMS.map((room) => {
          const tile = ROOM_TILES[room]
          const handle = toHandle(room)
          return createBlock('collection', { label: tile.label, accent: tile.accent, link: `/collections/${handle}`, image: tile.image }, id(`room-${handle}`))
        }),
      },
      {
        ...createSection('logo-strip', { eyebrow: '', title: 'Brands we carry', background: 'Tint' }, id('home-brands')),
        blocks: LUMOS_BRANDS.map((brand) => createBlock('logo', { name: brand, image: brandLogo(brand), link: brandLink(brand) }, id(`brand-${toHandle(brand)}`))),
      },
      createSection('featured-products', {
        eyebrow: 'Recommendations',
        title: 'Featured products',
        accentWords: '',
        collection: 'best-sellers',
        productCount: 8,
        layout: 'Carousel',
      }, id('home-featured')),
      {
        ...createSection('icon-row', {
          eyebrow: 'Why choose us',
          title: 'The Lumos difference',
          subtitle: 'Pieces built to last, delivered free, with help whenever you need it.',
          alignment: 'Center',
          tileStyle: 'Card',
        }, id('home-why')),
        blocks: [
          createBlock('feature', { icon: 'award', title: 'Built to last', text: 'Solid wood and tested fabrics, with a 5-year frame warranty.', link: '/page/about' }, id('why-built')),
          createBlock('feature', { icon: 'truck', title: 'Free delivery', text: 'On every order, in 3 to 5 business days.', link: '/page/delivery-and-returns' }, id('why-delivery')),
          createBlock('feature', { icon: 'headphones', title: 'Design help', text: 'Not sure what fits your room? Ask us and we will help you choose.', link: '/page/faq' }, id('why-help')),
          createBlock('feature', { icon: 'shield-check', title: '30-day returns', text: 'Changed your mind? Send it back within 30 days, free.', link: '/policies/refund-policy' }, id('why-returns')),
        ],
      },
      footer('home'),
    ],
    product: [
      header('product'),
      {
        // Square is the gallery shape closest to the Boxed card's photo (248:273).
        ...createSection('product-detail', { galleryLayout: 'Thumbnails', imageRatio: 'Square', sizeGuide: false, fitment: false, showReviews: false }, id('product-detail')),
        blocks: [
          row('description', { title: 'Description', source: 'description', open: true }),
          row('specs', { title: 'Dimensions and materials', source: 'specs' }),
          row('warranty', { title: 'Warranty', source: 'warranty' }),
          row('delivery-returns', { title: 'Delivery and returns', source: 'delivery-returns', text: DELIVERY_AND_RETURNS }),
        ],
      },
      createSection('featured-products', { eyebrow: '', title: 'You may also like', accentWords: '' }, id('product-related')),
      footer('product'),
    ],
    collection: [
      header('collection'),
      // The product grid: filters for category, color (the fabrics, finishes and colours), brand and price, in
      // that order, so the rug's, bed's and tables' sizes are not one mixed list; sort, quick add, and the boxed card with its heart.
      createSection('collection-grid', { title: '', columns: 3, filters: true, facets: 'category,color,brand,price', sort: true, quickAdd: true, cardStyle: 'Boxed' }, id('collection-grid')),
      footer('collection'),
    ],
    cart: [
      header('cart'),
      createSection('cart-summary', { showNotes: false, upsells: true }, id('cart-summary')),
      footer('cart'),
    ],
  }
}
