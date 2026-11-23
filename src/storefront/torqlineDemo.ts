// The "Torqline Auto Parts (demo)" store: everything seeded for sales channel `torqline-demo`.
//
// Torqline is a fictional online auto parts store: brakes, filters, oil and fluids,
// batteries, bulbs, wipers, spark plugs and a few accessories, priced in US dollars,
// with no subscriptions. Each part lists the vehicles it fits (`detail.fitment`,
// rows against src/storefront/vehicles.ts), so a shopper who picks a vehicle sees
// what fits it. Every name, part, part number and line of copy was written for this
// store, and its part brands (Torqline, Haltmark, Voltaro, Lumvane) are made up; the
// photos are free-licence stock photos kept in public/storefront/torqline (credits
// in its CREDITS.md). It is the showcase store of the Torqline theme, so
// src/storefront/demoStores/torqline.ts installs it in any store that applies that theme.
//
// Like northfoldDemo.ts, most of it is built from an InstallContext: the ids, the
// channel, the domain and the string-id prefix of the store it is installed in, so a
// copy in another store gets ids of its own and every link follows them. Constants
// hold what no install changes (the theme's styles, the header and footer, the
// chatbot's knowledge, which link pages and collections only).
//
// Everything a visitor can see or click must read like a real store: no internal
// wording, no link to a missing page, no real brand, and a vehicle make only inside
// a fitment row (the shared suite, tests/storefront/demoStores.test.ts, checks it).
// Shipping copy matches the checkout: free delivery in 3 to 5 business days, to the
// countries the US-dollar checkout offers (src/storefront/checkoutProfile.ts). The
// checkout has no Click & collect here. Pure: types and the pure rule modules only,
// so Node runs it (`npm run test:storefront`, tests/storefront/torqlineDemo.test.ts
// checks the reference tables of the catalogue).

import type { Product, ProductOption, ProductVariant } from '../stores/useCommerce.ts'
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import type { BlogSeoSettings, ContentEntry } from '../stores/useStoreContent.ts'
import type { StoreMenu } from '../stores/useStoreNavigation.ts'
import type { StorefrontChrome } from '../stores/useStorefront.ts'
import type { ChatbotConfig, ChatbotConversation } from '../stores/useChatbot.ts'
import type { PageRedirect, RecommendationEngine, SearchPin, Synonym } from '../stores/useMerchandising.ts'
import type { StoreCampaign } from './campaigns.ts'
import type { InstallContext, SnapshotCollection } from './demoStores/types.ts'
import type { Fitment, FitmentRow } from './fitment.ts'
import { productHandle, toHandle } from './handles.ts'
import { createBlock, createSection } from './themeSections.ts'
import type { TemplateType, ThemeSection, ThemeStyles } from './themeSections.ts'

export const TORQLINE_CHANNEL_ID = 'torqline-demo'
export const TORQLINE_CHANNEL_NAME = 'Torqline Auto Parts (demo)'

/** When the seed was written: the channel's dates, the theme's publish date and the collections' last update. */
export const TORQLINE_SEEDED_AT = '2026-11-23T09:00:00Z'

/**
 * The store's sales channel. It starts connected to Merchandise Cloud, so search
 * (part numbers included), its rules and "Goes well with" work on the first visit;
 * a restore connects it again.
 */
export const TORQLINE_CHANNEL: SalesChannel = {
  id: TORQLINE_CHANNEL_ID,
  accountId: '2000290',
  name: TORQLINE_CHANNEL_NAME,
  storeNumber: 14,
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'connected',
  health: 'healthy',
  description: 'Auto parts for cars, crossovers, trucks and SUVs, with vehicle fitment and part numbers; prices in US dollars.',
  connectedClouds: ['commerce', 'store_builder', 'merchandise'],
  createdAt: TORQLINE_SEEDED_AT,
  updatedAt: TORQLINE_SEEDED_AT,
  lastActivityAt: TORQLINE_SEEDED_AT,
  merchandising: { status: 'connected', health: 'healthy', lastSyncAt: TORQLINE_SEEDED_AT, lastActivityAt: TORQLINE_SEEDED_AT },
  webStore: {
    domain: '2000290-14.uat.maropost.store',
    storeBuilderEnabled: true,
    published: true,
    merchandiseConnected: true,
    currency: 'USD',
    demo: true,
  },
}

/** What the store's own page in the admin says about it. The company is made up, like the brand. */
export const TORQLINE_ADMIN = {
  /** Revenue of the last 30 days, in the store's currency. */
  revenue: '$86.4K',
  themeName: 'Torqline 1.0',
  business: [
    { label: 'Legal name', value: 'Torqline Auto Parts Inc.' },
    { label: 'Business type', value: 'Corporation' },
    { label: 'Tax ID (EIN)', value: '31-4815926' },
    { label: 'Phone', value: '(614) 555-0187' },
    { label: 'Public email', value: 'hello@torqline.example' },
    { label: 'Support email', value: 'hello@torqline.example' },
    { label: 'Website', value: '2000290-14.uat.maropost.store' },
    { label: 'Street', value: '2250 Harmon Avenue' },
    { label: 'City / region', value: 'Columbus, OH 43223' },
    { label: 'Country', value: 'United States' },
  ],
} as const

// ── Theme ────────────────────────────────────────────────────────────────────

/**
 * Charcoal and white with one safety-yellow accent: yellow buttons with charcoal
 * text, a dark header and footer, Barlow Condensed uppercase headings over Barlow,
 * corners of 4. Drawn with the sections drawing. Contrast (WCAG 2.1): text on the
 * page 17.6:1, on the surface 15.9:1; button text on the yellow 12.0:1; white on the
 * sale red 5.9:1; muted text on the page 6.2:1, on the surface 5.6:1.
 */
export const TORQLINE_THEME_STYLES: ThemeStyles = {
  brandColor: '#17191c',
  accentColor: '#ffc61a',
  background: '#ffffff',
  textColor: '#17191c',
  headingFont: 'Barlow Condensed',
  bodyFont: 'Barlow',
  cornerRadius: 4,
  buttonStyle: 'solid',
  saleBadgeColor: '#c8102e',
  customBadgeColor: '#17191c',
  soldOutBadgeColor: '#5b616b',
  drawing: 'sections',
  // Read by the sections drawing only.
  buttonColor: '#ffc61a',
  surfaceColor: '#f2f3f5',
  mutedColor: '#5b616b',
  dividerColor: '#dfe2e6',
  headingCase: 'Uppercase',
}

/** Where the store's photos live, as the browser asks for them (the files are in public/). */
export const TORQLINE_PHOTO_DIR = '/storefront/torqline'

const photo = (file: string): string => `${TORQLINE_PHOTO_DIR}/${file}`

/** The photos the theme's home page uses. Product photos are named on each product. */
export const TORQLINE_PHOTOS = {
  hero: photo('hero.jpg'),
  storyOilChange: photo('story-oil-change.jpg'),
  storyFitment: photo('story-fitment.jpg'),
} as const

// ── Catalogue ────────────────────────────────────────────────────────────────

/** The kind of part (`detail.tag`), which the storefront's Category filter offers. Each is a collection too. */
export const TORQLINE_CATEGORIES = ['Brakes', 'Filters', 'Oil & fluids', 'Batteries', 'Lighting', 'Wipers', 'Ignition', 'Accessories'] as const
export type TorqlineCategory = (typeof TORQLINE_CATEGORIES)[number]

/** The collections, in the order the admin and the menu list them: the eight categories, then Deals. */
export const TORQLINE_COLLECTION_NAMES = [...TORQLINE_CATEGORIES, 'Deals'] as const
export type TorqlineCollection = (typeof TORQLINE_COLLECTION_NAMES)[number]

/** The part brands (`detail.brand` and `vendor`), which the Brand filter offers. All made up; Torqline is the house brand. */
export const TORQLINE_BRANDS = ['Haltmark', 'Torqline', 'Voltaro', 'Lumvane'] as const
export type TorqlineBrand = (typeof TORQLINE_BRANDS)[number]

/** The category tiles on the home page, one photo per category. */
const TILE_PHOTOS: Record<TorqlineCategory, string> = {
  Brakes: photo('tile-brakes.jpg'),
  Filters: photo('tile-filters.jpg'),
  'Oil & fluids': photo('tile-oil-fluids.jpg'),
  Batteries: photo('tile-batteries.jpg'),
  Lighting: photo('tile-lighting.jpg'),
  Wipers: photo('tile-wipers.jpg'),
  Ignition: photo('tile-ignition.jpg'),
  Accessories: photo('tile-accessories.jpg'),
}

/** Where every variant is stocked (the location the other demo stores use too). */
const LOCATION = 'Oxford Warehouse'

// ── Fitment ──────────────────────────────────────────────────────────────────
// Rows name vehicles exactly as src/storefront/vehicles.ts does, split by model
// generation where a part changes with it. Truck & SUV parts fit the F-150,
// Silverado 1500, Ram 1500, Tacoma and Wrangler; car & crossover parts the Camry,
// Civic, RAV4, CR-V and Rogue. The car brake parts start at the 2016 Civic, so a
// 2015 Civic has no brake parts. Notes are rare: only the wiper rows carry one.

const vehicle = (make: string, model: string) => (yearFrom: number, yearTo: number, note?: string): FitmentRow =>
  ({ make, model, yearFrom, yearTo, ...(note ? { note } : {}) })

const F150 = vehicle('Ford', 'F-150')
const SILVERADO = vehicle('Chevrolet', 'Silverado 1500')
const RAM_1500 = vehicle('Ram', '1500')
const TACOMA = vehicle('Toyota', 'Tacoma')
const WRANGLER = vehicle('Jeep', 'Wrangler')
const CAMRY = vehicle('Toyota', 'Camry')
const CIVIC = vehicle('Honda', 'Civic')
const RAV4 = vehicle('Toyota', 'RAV4')
const CRV = vehicle('Honda', 'CR-V')
const ROGUE = vehicle('Nissan', 'Rogue')

/** Every generation of the five trucks and SUVs, 2015-2024. */
const TRUCKS_AND_SUVS: FitmentRow[] = [
  F150(2015, 2020), F150(2021, 2024), SILVERADO(2015, 2018), SILVERADO(2019, 2024), RAM_1500(2015, 2018), RAM_1500(2019, 2024),
  TACOMA(2015, 2015), TACOMA(2016, 2023), TACOMA(2024, 2024), WRANGLER(2015, 2017), WRANGLER(2018, 2024),
]

/** The five cars and crossovers from the 2016 Civic on: what the car brake parts fit. */
const CAR_BRAKES: FitmentRow[] = [
  CAMRY(2015, 2017), CAMRY(2018, 2024), CIVIC(2016, 2021), CIVIC(2022, 2024), RAV4(2015, 2018), RAV4(2019, 2024),
  CRV(2015, 2016), CRV(2017, 2022), CRV(2023, 2024), ROGUE(2015, 2020), ROGUE(2021, 2024),
]

/** Vehicles with halogen headlights (newer generations have LED headlights, which take no bulb). */
const HALOGEN_HEADLIGHTS: FitmentRow[] = [
  F150(2015, 2020), SILVERADO(2015, 2018), RAM_1500(2015, 2018), TACOMA(2015, 2023), WRANGLER(2015, 2017),
  CAMRY(2015, 2017), CIVIC(2015, 2021), RAV4(2015, 2018), CRV(2015, 2016), ROGUE(2015, 2020),
]

const universal = (): Fitment => ({ universal: true, rows: [] })
const fits = (...rows: FitmentRow[][]): Fitment => ({ universal: false, rows: rows.flat() })

// ── Products ─────────────────────────────────────────────────────────────────

/** A part's one option, shown as buttons: Position, Grade, Length, Pack or Set. */
interface PartOption {
  name: string
  values: string[]
}

interface PartSeed {
  /** Its place in the "All" collection and in the id block: product n is id `ctx.ids.product(n)` (4001 at home). */
  n: number
  name: string
  /** The first is its category (`detail.tag`) and the breadcrumb. */
  collections: [TorqlineCategory, ...TorqlineCollection[]]
  brand: TorqlineBrand
  option?: PartOption
  /** The part number of each variant, in the option's order: TQ-<category>-<4 digits>. */
  skus: string[]
  /** USD, one per variant (one number: every variant the same). */
  price: number | number[]
  /** The "was" price of a part on sale (Deals). */
  compareAt?: number
  /** Units on hand per variant, in the option's order. 0 is sold out. */
  stock: number[]
  subtitle: string
  description: string
  /** The Specifications table: the part's own facts, never a vehicle's. */
  specs: [label: string, value: string][]
  warranty: string
  countryOfOrigin: string
  hsCode: string
  /** Shipping weight of every variant. */
  weightKg: number
  /** Files in TORQLINE_PHOTO_DIR, the gallery's order; the first is the card's. */
  photos: string[]
  fitment: Fitment
}

const PAD_SPECS: [string, string][] = [
  ['Friction material', 'Ceramic'],
  ['In the box', '4 pads for one axle, with clips and shims'],
  ['Shims', 'Multi-layer, to cut noise'],
  ['Wear indicator', 'Audible'],
  ['Dust', 'Low'],
]
const ROTOR_SPECS: [string, string][] = [
  ['Material', 'Cast iron'],
  ['Coating', 'Black e-coat on the hat and vanes'],
  ['Braking surface', 'Machined, ready to fit'],
  ['Sold as', 'Each (an axle takes two)'],
]
const SPIN_ON_SPECS: [string, string][] = [
  ['Type', 'Spin-on'],
  ['Filter media', 'Synthetic blend'],
  ['Service life', 'Up to 10,000 miles'],
  ['Anti-drain-back valve', 'Silicone'],
]
const BULB_SOLD_AS: [string, string] = ['Sold as', 'Pair']

/**
 * In the order the "All" collection lists them, which is also each collection's
 * order: a collection lists its products in this order.
 */
const PART_SEEDS: PartSeed[] = [
  {
    n: 1,
    name: 'Ceramic Brake Pads, Truck & SUV',
    collections: ['Brakes'],
    brand: 'Haltmark',
    option: { name: 'Position', values: ['Front', 'Rear'] },
    skus: ['TQ-BRK-4471', 'TQ-BRK-4472'],
    price: 64.99,
    stock: [34, 27],
    subtitle: 'Front or rear set for trucks and SUVs',
    description: 'Quiet, low-dust ceramic pads for trucks and SUVs that tow, haul and stop in traffic. Each box is a full set for one axle, with new clips and shims.',
    specs: PAD_SPECS,
    warranty: 'Limited lifetime warranty',
    countryOfOrigin: 'Mexico',
    hsCode: '6813.81',
    weightKg: 2.2,
    photos: ['brake-pads-truck-1.jpg', 'brake-pads-truck-2.jpg'],
    fitment: fits(TRUCKS_AND_SUVS),
  },
  {
    n: 2,
    name: 'Ceramic Brake Pads, Car & Crossover',
    collections: ['Brakes'],
    brand: 'Haltmark',
    option: { name: 'Position', values: ['Front', 'Rear'] },
    skus: ['TQ-BRK-4481', 'TQ-BRK-4482'],
    price: 49.99,
    stock: [41, 2],
    subtitle: 'Front or rear set for cars and crossovers',
    description: 'Ceramic pads that stop smoothly and keep your wheels clean, made for everyday driving. Each box is a full set for one axle, with new clips and shims.',
    specs: PAD_SPECS,
    warranty: 'Limited lifetime warranty',
    countryOfOrigin: 'Mexico',
    hsCode: '6813.81',
    weightKg: 1.6,
    photos: ['brake-pads-car-1.jpg', 'brake-pads-car-2.jpg'],
    fitment: fits(CAR_BRAKES),
  },
  {
    n: 3,
    name: 'Coated Brake Rotor, Truck & SUV',
    collections: ['Brakes'],
    brand: 'Haltmark',
    option: { name: 'Position', values: ['Front', 'Rear'] },
    skus: ['TQ-BRK-5171', 'TQ-BRK-5172'],
    price: 79.99,
    stock: [12, 9],
    subtitle: 'Front or rear rotor for trucks and SUVs, sold each',
    description: 'A heavy cast-iron rotor for trucks and SUVs, coated black on the hat and vanes so it doesn’t rust where the pads don’t reach. Sold each: an axle takes two.',
    specs: ROTOR_SPECS,
    warranty: '2-year warranty',
    countryOfOrigin: 'Mexico',
    hsCode: '8708.30',
    weightKg: 13.5,
    photos: ['brake-rotor-truck-1.jpg', 'brake-rotor-truck-2.jpg'],
    // The 2015 and 2024 Tacoma take a rotor of another size.
    fitment: fits([F150(2015, 2020), F150(2021, 2024), SILVERADO(2015, 2018), SILVERADO(2019, 2024), RAM_1500(2015, 2018), RAM_1500(2019, 2024), TACOMA(2016, 2023), WRANGLER(2015, 2017), WRANGLER(2018, 2024)]),
  },
  {
    n: 4,
    name: 'Coated Brake Rotor, Car & Crossover',
    collections: ['Brakes'],
    brand: 'Haltmark',
    option: { name: 'Position', values: ['Front', 'Rear'] },
    skus: ['TQ-BRK-5181', 'TQ-BRK-5182'],
    price: 59.99,
    stock: [18, 0],
    subtitle: 'Front or rear rotor for cars and crossovers, sold each',
    description: 'A cast-iron rotor for cars and crossovers, coated black on the hat and vanes to keep rust off. Sold each: an axle takes two.',
    specs: ROTOR_SPECS,
    warranty: '2-year warranty',
    countryOfOrigin: 'Mexico',
    hsCode: '8708.30',
    weightKg: 8.2,
    photos: ['brake-rotor-car-1.jpg', 'brake-rotor-car-2.jpg'],
    fitment: fits(CAR_BRAKES),
  },
  {
    n: 5,
    name: 'Extended-Life Oil Filter, Compact',
    collections: ['Filters'],
    brand: 'Torqline',
    skus: ['TQ-FLT-2105'],
    price: 8.99,
    stock: [86],
    subtitle: 'Spin-on filter for cars and crossovers',
    description: 'A spin-on oil filter with synthetic-blend media that holds more dirt for longer, rated for oil changes up to 10,000 miles apart.',
    specs: SPIN_ON_SPECS,
    warranty: '1-year warranty',
    countryOfOrigin: 'United States',
    hsCode: '8421.23',
    weightKg: 0.35,
    photos: ['oil-filter-compact-1.jpg', 'oil-filter-compact-2.jpg'],
    fitment: fits([CAMRY(2015, 2017), CIVIC(2015, 2015), CIVIC(2016, 2021), CIVIC(2022, 2024), RAV4(2015, 2018), CRV(2015, 2016), CRV(2017, 2022), CRV(2023, 2024), ROGUE(2015, 2020), ROGUE(2021, 2024)]),
  },
  {
    n: 6,
    name: 'Extended-Life Oil Filter, Truck',
    collections: ['Filters'],
    brand: 'Torqline',
    skus: ['TQ-FLT-2160'],
    price: 10.99,
    stock: [64],
    subtitle: 'Spin-on filter for trucks and SUVs',
    description: 'A larger spin-on filter for trucks and SUVs, with synthetic-blend media and a silicone valve that keeps oil in the filter when the engine is off.',
    specs: SPIN_ON_SPECS,
    warranty: '1-year warranty',
    countryOfOrigin: 'United States',
    hsCode: '8421.23',
    weightKg: 0.5,
    // Only its gallery photo for now: the card shows it until a photo of its own is added.
    photos: ['oil-filter-truck-2.jpg'],
    fitment: fits([F150(2015, 2020), F150(2021, 2024), SILVERADO(2015, 2018), SILVERADO(2019, 2024), RAM_1500(2015, 2018), RAM_1500(2019, 2024), TACOMA(2015, 2015), WRANGLER(2015, 2017), WRANGLER(2018, 2024)]),
  },
  {
    n: 7,
    name: 'Cartridge Oil Filter',
    collections: ['Filters'],
    brand: 'Torqline',
    skus: ['TQ-FLT-2230'],
    price: 11.49,
    stock: [52],
    subtitle: 'Filter element with new O-rings',
    description: 'A replacement element for engines with a cartridge filter housing, with the O-rings you need to reseal the cap.',
    specs: [['Type', 'Cartridge element'], ['Filter media', 'Synthetic blend'], ['Service life', 'Up to 10,000 miles'], ['O-rings', 'Included']],
    warranty: '1-year warranty',
    countryOfOrigin: 'United States',
    hsCode: '8421.23',
    weightKg: 0.15,
    photos: ['oil-filter-cartridge-1.jpg', 'oil-filter-cartridge-2.jpg'],
    fitment: fits([CAMRY(2018, 2024), RAV4(2019, 2024), TACOMA(2016, 2023), TACOMA(2024, 2024)]),
  },
  {
    n: 8,
    name: 'Engine Air Filter, Truck & SUV',
    collections: ['Filters'],
    brand: 'Torqline',
    skus: ['TQ-FLT-3310'],
    price: 24.99,
    stock: [29],
    subtitle: 'Deep-pleat filter for trucks and SUVs',
    description: 'A high-capacity engine air filter with deep pleats, made to keep dust out on gravel roads and job sites.',
    specs: [['Filter media', 'Pleated synthetic blend'], ['Seal', 'Molded polyurethane'], ['Replace', 'Every 15,000 to 30,000 miles, sooner on dusty roads'], ['Washable', 'No']],
    warranty: '1-year warranty',
    countryOfOrigin: 'United States',
    hsCode: '8421.31',
    weightKg: 0.6,
    photos: ['engine-air-filter-1.jpg', 'engine-air-filter-2.jpg'],
    fitment: fits([F150(2015, 2020), F150(2021, 2024), SILVERADO(2015, 2018), SILVERADO(2019, 2024), RAM_1500(2015, 2018), RAM_1500(2019, 2024), TACOMA(2016, 2023), WRANGLER(2018, 2024)]),
  },
  {
    n: 9,
    name: 'Cabin Air Filter',
    collections: ['Filters'],
    brand: 'Torqline',
    skus: ['TQ-FLT-3520'],
    price: 21.99,
    stock: [47],
    subtitle: 'Activated-carbon filter for the cabin',
    description: 'Traps dust and pollen, and soaks up road odors before they reach the cabin.',
    specs: [['Filter media', 'Pleated, with activated carbon'], ['Filters out', 'Dust, pollen and odors'], ['Replace', 'Every 12,000 miles, or once a year']],
    warranty: '1-year warranty',
    countryOfOrigin: 'United States',
    hsCode: '8421.39',
    weightKg: 0.25,
    photos: ['cabin-air-filter-1.jpg', 'cabin-air-filter-2.jpg'],
    fitment: fits([
      CAMRY(2015, 2017), CAMRY(2018, 2024), CIVIC(2015, 2015), CIVIC(2016, 2021), CIVIC(2022, 2024), RAV4(2015, 2018), RAV4(2019, 2024),
      CRV(2015, 2016), CRV(2017, 2022), CRV(2023, 2024), ROGUE(2015, 2020), ROGUE(2021, 2024),
      F150(2015, 2020), F150(2021, 2024), TACOMA(2016, 2023), WRANGLER(2018, 2024),
    ]),
  },
  {
    n: 10,
    name: 'Full Synthetic Motor Oil',
    collections: ['Oil & fluids'],
    brand: 'Torqline',
    option: { name: 'Grade', values: ['0W-20', '5W-20', '5W-30'] },
    skus: ['TQ-OIL-1020', 'TQ-OIL-1520', 'TQ-OIL-1530'],
    price: 32.99,
    stock: [38, 22, 45],
    subtitle: 'Full synthetic, 5 quarts',
    description: 'Full synthetic motor oil that protects from the first cold start. Choose the grade your owner’s manual or oil filler cap names.',
    specs: [['Type', 'Full synthetic'], ['Size', '5 quarts'], ['Meets', 'API SP'], ['Change interval', 'As your owner’s manual says']],
    warranty: 'Guaranteed to meet the standard on the label',
    countryOfOrigin: 'United States',
    hsCode: '2710.19',
    weightKg: 4.4,
    photos: ['motor-oil-1.jpg', 'motor-oil-2.jpg'],
    fitment: universal(),
  },
  {
    n: 11,
    name: 'DOT 4 Brake Fluid',
    collections: ['Oil & fluids'],
    brand: 'Torqline',
    skus: ['TQ-OIL-7104'],
    price: 14.99,
    stock: [58],
    subtitle: 'High-boiling-point fluid, 32 fl oz',
    description: 'Brake fluid for any system that takes DOT 3 or DOT 4, to top up or for a full flush. Its high boiling point keeps the pedal firm on long downhill runs.',
    specs: [['Standard', 'DOT 4'], ['Size', '32 fl oz'], ['Dry boiling point', '500°F'], ['Mixes with', 'DOT 3 and DOT 4 (never DOT 5)']],
    warranty: 'Guaranteed to meet the DOT 4 standard',
    countryOfOrigin: 'United States',
    hsCode: '3819.00',
    weightKg: 1.0,
    photos: ['brake-fluid-1.jpg', 'brake-fluid-2.jpg'],
    fitment: universal(),
  },
  {
    n: 12,
    name: 'AGM Battery',
    collections: ['Batteries', 'Deals'],
    brand: 'Voltaro',
    skus: ['TQ-BAT-4870'],
    price: 219.99,
    compareAt: 249.99,
    stock: [3],
    subtitle: 'Sealed battery for start-stop vehicles',
    description: 'An absorbed glass mat battery for vehicles with start-stop and a heavy electrical load. Sealed, spill-proof and maintenance free.',
    specs: [['Type', 'AGM (absorbed glass mat)'], ['Voltage', '12 V'], ['Cold cranking amps', '760 CCA'], ['Reserve capacity', '140 minutes'], ['Maintenance', 'None: sealed']],
    warranty: '3-year free replacement',
    countryOfOrigin: 'South Korea',
    hsCode: '8507.10',
    weightKg: 23.5,
    photos: ['battery-agm-1.jpg', 'battery-agm-2.jpg'],
    fitment: fits([F150(2015, 2020), F150(2021, 2024), SILVERADO(2019, 2024), RAM_1500(2019, 2024), WRANGLER(2018, 2024), RAV4(2019, 2024), CRV(2023, 2024)]),
  },
  {
    n: 13,
    name: 'Standard Battery',
    collections: ['Batteries'],
    brand: 'Voltaro',
    skus: ['TQ-BAT-3510'],
    price: 159.99,
    stock: [14],
    subtitle: 'Flooded battery for vehicles without start-stop',
    description: 'A dependable flooded lead-acid battery for vehicles without start-stop. It arrives charged and ready to fit.',
    specs: [['Type', 'Flooded lead-acid'], ['Voltage', '12 V'], ['Cold cranking amps', '650 CCA'], ['Reserve capacity', '110 minutes']],
    warranty: '2-year free replacement',
    countryOfOrigin: 'South Korea',
    hsCode: '8507.10',
    weightKg: 18.5,
    // Only its gallery photo for now: the card shows it until a photo of its own is added.
    photos: ['battery-standard-1.jpg', 'battery-standard-2.jpg'],
    fitment: fits([
      SILVERADO(2015, 2018), RAM_1500(2015, 2018), TACOMA(2015, 2015), TACOMA(2016, 2023), TACOMA(2024, 2024), WRANGLER(2015, 2017),
      CAMRY(2015, 2017), CAMRY(2018, 2024), CIVIC(2015, 2015), CIVIC(2016, 2021), CIVIC(2022, 2024), RAV4(2015, 2018),
      CRV(2015, 2016), CRV(2017, 2022), ROGUE(2015, 2020), ROGUE(2021, 2024),
    ]),
  },
  {
    n: 14,
    name: 'Halogen Headlight Bulbs, Pair',
    collections: ['Lighting'],
    brand: 'Lumvane',
    skus: ['TQ-LGT-1100'],
    price: 24.99,
    stock: [36],
    subtitle: 'Standard replacement, sold as a pair',
    description: 'Replacement halogen headlight bulbs with the same light as the originals. Sold as a pair: when one burns out, the other isn’t far behind.',
    specs: [['Type', 'Halogen'], BULB_SOLD_AS, ['Color temperature', '3,200 K'], ['Rated life', 'Up to 1,000 hours']],
    warranty: '1-year warranty',
    countryOfOrigin: 'China',
    hsCode: '8539.21',
    weightKg: 0.1,
    photos: ['halogen-bulbs-1.jpg', 'halogen-bulbs-2.jpg'],
    fitment: fits(HALOGEN_HEADLIGHTS),
  },
  {
    n: 15,
    name: 'Brighter Halogen Headlight Bulbs, Pair',
    collections: ['Lighting', 'Deals'],
    brand: 'Lumvane',
    skus: ['TQ-LGT-1150'],
    price: 39.99,
    compareAt: 49.99,
    stock: [24],
    subtitle: 'Whiter, brighter halogen, sold as a pair',
    description: 'Halogen headlight bulbs with a whiter beam that puts more light on the road than a standard bulb. Road legal, and sold as a pair.',
    specs: [['Type', 'Halogen'], BULB_SOLD_AS, ['Color temperature', '3,700 K'], ['Rated life', 'Up to 450 hours']],
    warranty: '1-year warranty',
    countryOfOrigin: 'China',
    hsCode: '8539.21',
    weightKg: 0.1,
    photos: ['brighter-bulbs-1.jpg', 'brighter-bulbs-2.jpg'],
    fitment: fits(HALOGEN_HEADLIGHTS),
  },
  {
    n: 16,
    name: 'All-Season Beam Wiper Blade',
    collections: ['Wipers'],
    brand: 'Lumvane',
    option: { name: 'Length', values: ['16 in', '18 in', '20 in', '22 in', '24 in', '26 in'] },
    skus: ['TQ-WPR-6016', 'TQ-WPR-6018', 'TQ-WPR-6020', 'TQ-WPR-6022', 'TQ-WPR-6024', 'TQ-WPR-6026'],
    price: 21.99,
    stock: [18, 24, 31, 42, 15, 38],
    subtitle: 'Front windshield blade, sold each',
    description: 'A frameless beam blade that hugs the windshield, wipes evenly at highway speed and doesn’t pack with snow. Adapters for the common wiper arms are in the box.',
    specs: [['Type', 'Beam (frameless)'], ['Rubber', 'Natural rubber, graphite coated'], ['Adapters', 'J-hook, pin and side-lock, included'], ['Sold as', 'Each'], ['Replace', 'Every 6 to 12 months']],
    warranty: '1-year warranty',
    countryOfOrigin: 'Taiwan',
    hsCode: '8512.40',
    weightKg: 0.3,
    photos: ['wiper-blade-1.jpg', 'wiper-blade-2.jpg'],
    fitment: fits([
      F150(2015, 2024, 'Driver 22 in, passenger 22 in'),
      SILVERADO(2015, 2024, 'Driver 22 in, passenger 22 in'),
      RAM_1500(2015, 2018, 'Driver 22 in, passenger 22 in'),
      RAM_1500(2019, 2024, 'Driver 24 in, passenger 22 in'),
      TACOMA(2015, 2015, 'Driver 22 in, passenger 18 in'),
      TACOMA(2016, 2024, 'Driver 26 in, passenger 20 in'),
      WRANGLER(2015, 2024, 'Driver 16 in, passenger 16 in'),
      CAMRY(2015, 2024, 'Driver 26 in, passenger 18 in'),
      CIVIC(2015, 2015, 'Driver 26 in, passenger 18 in'),
      CIVIC(2016, 2021, 'Driver 26 in, passenger 16 in'),
      CIVIC(2022, 2024, 'Driver 26 in, passenger 18 in'),
      RAV4(2015, 2024, 'Driver 26 in, passenger 16 in'),
      CRV(2015, 2022, 'Driver 26 in, passenger 16 in'),
      CRV(2023, 2024, 'Driver 26 in, passenger 18 in'),
      ROGUE(2015, 2024, 'Driver 26 in, passenger 16 in'),
    ]),
  },
  {
    n: 17,
    name: 'Rear Wiper Blade',
    collections: ['Wipers'],
    brand: 'Lumvane',
    skus: ['TQ-WPR-6412'],
    price: 15.99,
    stock: [27],
    subtitle: 'Rear window blade, sold each',
    description: 'A rear wiper blade that clips straight onto the arm, for vehicles with a rear wiper.',
    specs: [['Type', 'Rear blade'], ['Rubber', 'Natural rubber'], ['Sold as', 'Each']],
    warranty: '1-year warranty',
    countryOfOrigin: 'Taiwan',
    hsCode: '8512.40',
    weightKg: 0.15,
    photos: ['rear-wiper-blade-1.jpg', 'rear-wiper-blade-2.jpg'],
    fitment: fits([RAV4(2015, 2024), CRV(2015, 2024), ROGUE(2015, 2024), WRANGLER(2015, 2024)]),
  },
  {
    n: 18,
    name: 'Iridium Spark Plugs',
    collections: ['Ignition'],
    brand: 'Torqline',
    option: { name: 'Pack', values: ['Set of 4', 'Set of 6', 'Set of 8'] },
    skus: ['TQ-IGN-8104', 'TQ-IGN-8106', 'TQ-IGN-8108'],
    price: [39.99, 57.99, 75.99],
    stock: [33, 21, 1],
    subtitle: 'Long-life plugs in sets of 4, 6 and 8',
    description: 'Iridium spark plugs that fire cleanly for up to 100,000 miles. Choose the set with one plug for each cylinder of your engine.',
    specs: [['Center electrode', 'Iridium'], ['Gap', 'Set at the factory; check it against your owner’s manual'], ['Replace', 'Up to 100,000 miles']],
    warranty: 'Limited lifetime warranty',
    countryOfOrigin: 'Japan',
    hsCode: '8511.10',
    weightKg: 0.25,
    photos: ['spark-plugs-1.jpg', 'spark-plugs-2.jpg'],
    fitment: fits([
      F150(2015, 2024), SILVERADO(2015, 2024), RAM_1500(2015, 2024), TACOMA(2015, 2024), WRANGLER(2015, 2024),
      CAMRY(2015, 2024), CIVIC(2015, 2024), RAV4(2015, 2024), CRV(2015, 2024), ROGUE(2015, 2024),
    ]),
  },
  {
    n: 19,
    name: 'All-Weather Floor Mats',
    collections: ['Accessories'],
    brand: 'Torqline',
    option: { name: 'Set', values: ['Front row', 'Front and rear'] },
    skus: ['TQ-ACC-9201', 'TQ-ACC-9202'],
    price: [89.99, 139.99],
    stock: [11, 8],
    subtitle: 'Molded mats, front row or front and rear',
    description: 'Deep-molded mats shaped for each vehicle, with raised edges that keep water, mud and snow off the carpet. Choose the front row, or the front and rear.',
    specs: [['Material', 'Flexible TPE, rubber-like'], ['Edges', 'Raised, to hold water and snow'], ['Backing', 'Nibbed, to stay in place'], ['Cleaning', 'Hose off and let dry']],
    warranty: 'Limited lifetime warranty',
    countryOfOrigin: 'United States',
    hsCode: '4016.91',
    weightKg: 3.2,
    photos: ['floor-mats-1.jpg', 'floor-mats-2.jpg'],
    // Molded for the current generations only.
    fitment: fits([
      F150(2015, 2020), F150(2021, 2024), SILVERADO(2015, 2018), SILVERADO(2019, 2024), RAM_1500(2015, 2018), RAM_1500(2019, 2024),
      TACOMA(2016, 2023), WRANGLER(2018, 2024), CAMRY(2018, 2024), CIVIC(2016, 2021), CIVIC(2022, 2024), RAV4(2019, 2024),
      CRV(2017, 2022), CRV(2023, 2024), ROGUE(2021, 2024),
    ]),
  },
  {
    n: 20,
    name: 'Digital Tire Pressure Gauge',
    collections: ['Accessories'],
    brand: 'Torqline',
    skus: ['TQ-ACC-9310'],
    price: 14.99,
    stock: [62],
    subtitle: 'Backlit gauge, 0 to 150 psi',
    description: 'A backlit digital gauge that reads to half a psi, with an angled head that reaches the valve on any wheel.',
    specs: [['Range', '0 to 150 psi'], ['Accuracy', '±1 psi'], ['Units', 'psi, bar, kPa and kg/cm²'], ['Battery', 'Coin cell, included']],
    warranty: '1-year warranty',
    countryOfOrigin: 'China',
    hsCode: '9026.20',
    weightKg: 0.15,
    photos: ['tire-gauge-1.jpg', 'tire-gauge-2.jpg'],
    fitment: universal(),
  },
  {
    n: 21,
    name: 'Portable Jump Starter',
    collections: ['Accessories', 'Deals'],
    brand: 'Voltaro',
    skus: ['TQ-ACC-9420'],
    price: 99.99,
    compareAt: 129.99,
    stock: [17],
    subtitle: 'Lithium jump pack, 2,000 A peak',
    description: 'A compact lithium jump starter that starts a flat battery without a second vehicle, then charges your phone. Spark-proof clamps, with reverse-polarity protection.',
    specs: [['Peak current', '2,000 A'], ['Starts', 'Gas engines up to 8.0 L, diesel up to 6.0 L'], ['Battery', '18,000 mAh lithium'], ['Charging', 'USB-C in and out'], ['Light', 'LED flashlight']],
    warranty: '2-year warranty',
    countryOfOrigin: 'China',
    hsCode: '8507.60',
    weightKg: 1.1,
    photos: ['jump-starter-1.jpg', 'jump-starter-2.jpg'],
    fitment: universal(),
  },
]

const seedOf = (n: number): PartSeed => {
  const seed = PART_SEEDS.find((p) => p.n === n)
  if (!seed) throw new Error(`Torqline has no product ${n}`)
  return seed
}

/** The price of each variant, in the option's order. */
function pricesOf(seed: PartSeed): number[] {
  return typeof seed.price === 'number' ? seed.skus.map(() => seed.price as number) : seed.price
}

/** One variant per value of the part's option (one in all for a part without one), with its part number and stock. */
function variantsOf(seed: PartSeed, productId: number, ctx: InstallContext): ProductVariant[] {
  const values = seed.option?.values ?? [undefined]
  const prices = pricesOf(seed)
  if (values.length !== seed.skus.length || values.length !== seed.stock.length || values.length !== prices.length) {
    throw new Error(`${seed.name}: ${values.length} variants, ${seed.skus.length} part numbers, ${seed.stock.length} stock counts, ${prices.length} prices`)
  }
  return values.map((value, i): ProductVariant => ({
    id: ctx.ids.variant(productId, i + 1),
    title: value ?? 'Default',
    ...(value ? { optionValues: [value] } : {}),
    sku: seed.skus[i]!,
    manageInventory: true,
    allowBackorder: false,
    costPrice: (prices[i]! * 0.45).toFixed(2),
    price: prices[i]!.toFixed(2),
    ...(seed.compareAt ? { compareAtPrice: seed.compareAt.toFixed(2) } : {}),
    weight: seed.weightKg.toFixed(2),
    stock: { [LOCATION]: seed.stock[i]! },
  }))
}

function optionsOf(seed: PartSeed): ProductOption[] {
  return seed.option ? [{ name: seed.option.name, values: [...seed.option.values], display: 'buttons' }] : []
}

/**
 * The twenty-one parts, assigned to the store they are installed in. `status` is
 * left to useCommerce, which derives it from the stock like every other product's.
 * Each product gets its own copy of its fitment rows and specs, so an edit to one
 * part never reaches another.
 */
export function torqlineProducts(ctx: InstallContext): Omit<Product, 'status'>[] {
  return PART_SEEDS.map((seed) => {
    const id = ctx.ids.product(seed.n)
    const variants = variantsOf(seed, id, ctx)
    const handle = toHandle(seed.name)
    const lowest = Math.min(...pricesOf(seed))
    return {
      id,
      name: seed.name,
      sku: variants[0]!.sku,
      price: lowest.toFixed(2),
      compareAtPrice: seed.compareAt ? seed.compareAt.toFixed(2) : '',
      inventory: seed.stock.reduce((total, units) => total + units, 0),
      category: 'Automotive',
      vendor: seed.brand,
      images: seed.photos.length,
      variants: variants.length,
      type: 'product',
      publishStatus: 'Published',
      collections: [...seed.collections],
      salesChannelNames: [ctx.channelName],
      productType: 'Physical',
      channelIds: [ctx.channelId],
      imageUrls: seed.photos.map(photo),
      detail: {
        subtitle: seed.subtitle,
        url: handle,
        description: seed.description,
        hasVariants: variants.length > 1,
        options: optionsOf(seed),
        variantsList: variants,
        taxCategory: 'Standard General Merchandise',
        material: '',
        brand: seed.brand,
        tag: seed.collections[0],
        collection: seed.collections[0],
        categories: ['Automotive'],
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
          title: `${seed.name} | Torqline`,
          metaDescription: `${seed.subtitle}. ${seed.description}`,
          urlHandle: handle,
          ogTitle: seed.name,
          ogDescription: seed.subtitle,
        },
        fitment: { universal: seed.fitment.universal, rows: seed.fitment.rows.map((row) => ({ ...row })) },
        specs: seed.specs.map(([label, value]) => ({ label, value })),
        warranty: seed.warranty,
      },
    }
  })
}

/** The storefront link of product n, as installed. */
function productLink(ctx: InstallContext, n: number): string {
  return `/products/${productHandle({ name: seedOf(n).name, id: ctx.ids.product(n) })}`
}

/** What each collection page says under its title. */
const COLLECTION_DESCRIPTIONS: Record<TorqlineCollection, string> = {
  Brakes: 'Ceramic pads and coated rotors for cars, crossovers, trucks and SUVs.',
  Filters: 'Oil, engine air and cabin air filters.',
  'Oil & fluids': 'Full synthetic motor oil and brake fluid.',
  Batteries: 'AGM and standard batteries, with a free-replacement warranty.',
  Lighting: 'Halogen headlight bulbs, sold in pairs.',
  Wipers: 'Front blades from 16 to 26 inches, and rear blades.',
  Ignition: 'Iridium spark plugs in sets of 4, 6 and 8.',
  Accessories: 'Floor mats, a tire pressure gauge and a portable jump starter.',
  Deals: 'A few parts at a lower price, while stock lasts.',
}

/** The collections as the admin lists them. On the storefront a collection is its name on the products. */
export function torqlineCollections(ctx: InstallContext): SnapshotCollection[] {
  return TORQLINE_COLLECTION_NAMES.map((title, i) => ({
    id: ctx.ids.collection(i + 1),
    title,
    productCount: PART_SEEDS.filter((p) => (p.collections as readonly string[]).includes(title)).length,
    updatedAt: TORQLINE_SEEDED_AT,
    description: COLLECTION_DESCRIPTIONS[title],
  }))
}

// ── Campaigns ────────────────────────────────────────────────────────────────
// One running, one over and one to come, so the Campaigns page shows every state and
// the announcement bar has an offer. Their dates count from the day the store is opened.
// No part on sale is a brake part, so BRAKES15 never meets a sale price.

function daysBefore(today: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = today.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** The store's campaigns, as of `ctx.today` ("YYYY-MM-DD"). */
export function torqlineCampaigns(ctx: InstallContext): StoreCampaign[] {
  const day = (fromToday: number): string => daysBefore(ctx.today, -fromToday)
  const stamp = (date: string): string => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  return [
    {
      id: `camp-${ctx.prefix}-brake-week`,
      channelId: ctx.channelId,
      name: 'Brake week',
      targets: ['Brakes'],
      startDate: day(-3), startTime: '08:00', endDate: day(11), endTime: '23:59',
      updatedAt: stamp(day(-3)),
      offer: { message: 'Brake week: 15% off brakes with code BRAKES15', code: 'BRAKES15', discountPct: 15 },
      orders: 38,
      revenue: 412_600,
    },
    {
      id: `camp-${ctx.prefix}-battery-check`,
      channelId: ctx.channelId,
      name: 'Battery check',
      targets: ['Batteries'],
      startDate: day(-40), startTime: '08:00', endDate: day(-33), endTime: '23:59',
      updatedAt: stamp(day(-33)),
      offer: { message: 'Battery check: 10% off batteries with code BATTERY10', code: 'BATTERY10', discountPct: 10 },
      orders: 21,
      revenue: 401_900,
    },
    {
      id: `camp-${ctx.prefix}-winter-wipers`,
      channelId: ctx.channelId,
      name: 'Winter wipers',
      targets: ['Wipers'],
      startDate: day(14), startTime: '08:00', endDate: day(27), endTime: '23:59',
      updatedAt: stamp(day(-1)),
      offer: { message: 'Winter wipers: 20% off wiper blades with code WIPERS20', code: 'WIPERS20', discountPct: 20 },
      orders: 0,
      revenue: 0,
    },
  ]
}

// ── Merchandising ────────────────────────────────────────────────────────────
// Search rules and recommendation engines (the store is connected to Merchandise
// Cloud from the start). Each changes what a shopper sees: what a search finds
// (src/storefront/search.ts) or the row under a product.

const MERCH_UPDATED = 'Nov 23, 2026'

export function torqlineMerchandising(ctx: InstallContext): {
  synonyms: Synonym[]
  redirects: PageRedirect[]
  searchPins: SearchPin[]
  engines: RecommendationEngine[]
} {
  const id = (name: string): string => `${ctx.home ? 'tq' : ctx.prefix}-${name}`
  const row = { channelId: ctx.channelId, updatedAt: MERCH_UPDATED }
  const storeUrl = `https://${ctx.domain}`
  const pin = (...ns: number[]): string[] => ns.map((n) => String(ctx.ids.product(n)))
  return {
    synonyms: [
      // "disc" is in no product's copy; with the rule it finds the rotors.
      { id: id('syn-rotor'), ...row, status: 'active', type: 'two_way', queries: ['rotor', 'disc', 'brake disc'], leadsTo: [] },
      // No battery's copy says "car", "auto" or "truck", so without the rule these find nothing.
      { id: id('syn-battery'), ...row, status: 'active', type: 'one_way', queries: ['car battery', 'auto battery', 'truck battery'], leadsTo: ['agm battery', 'standard battery'] },
      { id: id('syn-wiper'), ...row, status: 'active', type: 'two_way', queries: ['wiper', 'windshield wiper', 'wiper blade'], leadsTo: [] },
      { id: id('syn-headlight'), ...row, status: 'active', type: 'two_way', queries: ['headlight', 'headlamp'], leadsTo: [] },
      { id: id('syn-jump'), ...row, status: 'active', type: 'one_way', queries: ['jump pack', 'booster pack', 'jumper cables'], leadsTo: ['jump starter'] },
      { id: id('syn-mats'), ...row, status: 'active', type: 'one_way', queries: ['floor liners', 'floor liner', 'car mats'], leadsTo: ['floor mats'] },
    ],
    redirects: [
      { id: id('red-returns'), ...row, queries: ['returns', 'return', 'refund', 'exchange', 'return policy'], leadsTo: `${storeUrl}/policies/refund-policy` },
      { id: id('red-fitment'), ...row, queries: ['fitment', 'fitment guarantee', 'guarantee', 'will it fit'], leadsTo: `${storeUrl}/page/fitment-guarantee` },
      { id: id('red-shipping'), ...row, queries: ['shipping', 'delivery', 'shipping cost'], leadsTo: `${storeUrl}/page/shipping-and-returns` },
    ],
    searchPins: [
      // An oil change is oil and a filter: without the pin only the compact filter is found.
      { id: id('pin-oil-change'), ...row, query: 'oil change', pinnedProductIds: pin(10, 5, 6, 7) },
      // The brighter bulbs are on sale, so they lead a search for headlights.
      { id: id('pin-headlight'), ...row, query: 'headlight', pinnedProductIds: pin(15) },
    ],
    engines: [
      { id: id('engine-goes-with'), ...row, name: 'Goes well with', page: 'product', type: 'frequently_purchased_together', status: 'active', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:15 AM` },
      // Switched off: turn it on, and the first one off, and the row under a part shows the best sellers.
      { id: id('engine-popular'), ...row, name: 'Popular parts', page: 'product', type: 'popular_products', status: 'inactive', minProducts: 2, maxProducts: 4, fallbacks: ['Popular products'], updatedAt: `${MERCH_UPDATED} at 10:20 AM` },
    ],
  }
}

// ── Chatbot ──────────────────────────────────────────────────────────────────
// The assistant answers on the auto-parts profile (src/chatbot/assistantProfiles.ts):
// fit, part numbers, orders and returns. What it knows about the store is written
// here in short answers, each agreeing with the page it names. No vehicle make is
// named outside a fitment row, so chats name models only ("a 2019 F-150").

/** What differs from a new chatbot's settings. */
export const TORQLINE_CHATBOT: Partial<ChatbotConfig> = {
  storeName: 'Torqline',
  storeType: 'Other',
  brandName: 'Torqline assistant',
  brandSubtitle: 'Fit, orders and returns',
  primaryColor: '#17191c',
  position: 'right',
  launcherText: 'Need a hand?',
  launcherTextEnabled: true,
  welcomeMessage: 'Hi, I’m the Torqline assistant. Tell me your vehicle and I’ll check what fits. I can also look up a part number or an order, or explain returns. What can I help with?',
  preChatEnabled: false,
  quickPrompts: [
    { id: 1, text: 'Does this part fit my vehicle?', enabled: true },
    { id: 2, text: 'Where is my order?', enabled: true },
    { id: 3, text: 'How do returns work?', enabled: true },
    { id: 4, text: 'Look up a part number', enabled: true },
    { id: 5, text: 'What’s on sale?', enabled: true },
  ],
  knowledgeSources: [
    {
      id: 1, name: 'Store policies', icon: 'file-text', items: 4, meta: 'Added 23 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Returns and refunds', url: '/policies/refund-policy', text: 'Returns are free within 90 days of delivery for parts that are unused and in their original packaging. Write to hello@torqline.example with your order number and we’ll email you a prepaid label. We refund your original payment method within 5 business days of receiving the return.' },
        { title: 'Fitment guarantee', url: '/page/fitment-guarantee', text: 'If a part we say fits your vehicle doesn’t, write to us with your order number. We ship the right part free straight away, before you send the first one back, and we pay for the return.' },
        { title: 'Privacy and your data', url: '/policies/privacy-policy', text: 'We keep only what we need to deliver your order: your name, address, email, order history and the vehicle you choose. Your card details go straight to our payment provider and never reach us.' },
        { title: 'Prices and payment', url: '/policies/terms-of-service', text: 'Prices are in US dollars and shipping is free, so the total at checkout is what you pay. You can pay by card, Apple Pay or Google Pay. One discount code per order.' },
      ],
    },
    {
      id: 2, name: 'Help pages', icon: 'globe', items: 6, meta: 'Added 23 Nov 2026', status: 'Active', enabled: true,
      entries: [
        { title: 'Shipping times and cost', url: '/page/shipping-and-returns', text: 'Shipping is free on every order. Orders placed by 2 p.m. ET on a business day ship the same day, and delivery takes 3 to 5 business days. We email you a tracking link when your order ships.' },
        { title: 'Where we ship', url: '/page/shipping-and-returns', text: 'We ship to the United States, Canada, Australia, New Zealand and the United Kingdom. Orders outside the US may owe import duties on delivery.' },
        { title: 'Finding parts that fit', url: '/page/fitment-guarantee', text: 'Choose your vehicle’s year, make and model at the top of the store. Every part then says whether it fits, and each product page lists every vehicle it fits under “Vehicle fit”. Oil, brake fluid, the tire gauge and the jump starter fit any vehicle.' },
        { title: 'Part numbers', url: '/page/fitment-guarantee', text: 'Every part has a Torqline part number, like TQ-BRK-4471. Type it in the search box, with or without the dashes, to go straight to that part.' },
        { title: 'Brake work', url: '/page/fitment-guarantee', text: 'Brakes are safety parts. Unless you’ve done the job before, have a qualified mechanic fit pads and rotors, and bleed the brakes after changing the fluid.' },
        { title: 'Contact and hours', url: '/page/contact', text: 'Write to hello@torqline.example or call (614) 555-0187. We answer within one business day, Monday to Friday, 8 a.m. to 6 p.m. ET.' },
      ],
    },
  ],
}

/** Earlier chats, so the admin's Conversations page has this store's own history. */
export const TORQLINE_CONVERSATIONS: Omit<ChatbotConversation, 'id' | 'chatbotId'>[] = [
  {
    visitor: 'marcus.reed@example.com', startedAt: 'Today, 8:42 AM', topic: 'Fitment', resolved: true,
    messages: [
      { from: 'shopper', text: 'Will the front brake pads fit my 2019 F-150?', time: '8:42 AM' },
      { from: 'bot', text: 'Yes. The Ceramic Brake Pads, Truck & SUV fit a 2019 F-150, front and rear. The front set is part number TQ-BRK-4471. Choose your vehicle at the top of the store and every part will say whether it fits.', time: '8:42 AM' },
      { from: 'shopper', text: 'And the rotors?', time: '8:43 AM' },
      { from: 'bot', text: 'The Coated Brake Rotor, Truck & SUV fits it too, front and rear. Rotors are sold each, so an axle takes two. Brake week is on: code BRAKES15 takes 15% off brakes.', time: '8:43 AM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Yesterday, 6:15 PM', topic: 'Part numbers', resolved: true,
    messages: [
      { from: 'shopper', text: 'Do you have TQ-FLT-2160?', time: '6:15 PM' },
      { from: 'bot', text: 'Yes. TQ-FLT-2160 is the Extended-Life Oil Filter, Truck, at $10.99, and it’s in stock.', time: '6:15 PM' },
    ],
  },
  {
    visitor: 'Guest visitor', startedAt: 'Sat, 11:05 AM', topic: 'Returns', resolved: true,
    messages: [
      { from: 'shopper', text: 'I ordered the wrong wiper length. Can I send it back?', time: '11:05 AM' },
      { from: 'bot', text: 'Yes. Returns are free within 90 days of delivery, as long as the blade is unused and in its box. Write to hello@torqline.example with your order number and we’ll email you a prepaid label.', time: '11:05 AM' },
    ],
  },
]

// ── Storefront header and footer ─────────────────────────────────────────────

const linkTo = (title: TorqlineCollection) => ({ label: title, href: `/collections/${toHandle(title)}` })
const COLLECTION_LINKS = TORQLINE_COLLECTION_NAMES.map(linkTo)
/** The header's menu: the busiest categories and Deals. Every collection is in the footer, the mobile menu and the home page's tiles. */
const HEADER_LINKS = (['Brakes', 'Filters', 'Oil & fluids', 'Batteries', 'Lighting', 'Wipers', 'Deals'] as const).map(linkTo)

export const TORQLINE_CHROME: StorefrontChrome = {
  wordmark: 'Torqline',
  wordmarkIcon: null,
  announcementAboveHeader: true,
  // Search shows while the store is connected to Merchandise Cloud (it starts connected),
  // so a search box never leads to a page that cannot search.
  headerTools: ['account'],
  accountHref: '/account',
  social: [],
  searchPlaceholder: 'Search parts or part numbers',
  nav: HEADER_LINKS,
  mobileNav: [
    { label: 'Shop all', href: '/collections/all' },
    ...COLLECTION_LINKS,
    { label: 'Fitment guarantee', href: '/page/fitment-guarantee' },
    { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
    { label: 'About', href: '/page/about' },
    { label: 'Contact', href: '/page/contact' },
    { label: 'Your account', href: '/account' },
    { label: 'Cart', href: '/cart-page' },
  ],
  footerColumns: [
    {
      heading: { label: 'Shop', href: '/collections/all' },
      items: [{ label: 'Shop all', href: '/collections/all' }, ...COLLECTION_LINKS],
    },
    {
      heading: { label: 'Help', href: '/page/contact' },
      items: [
        { label: 'Fitment guarantee', href: '/page/fitment-guarantee' },
        { label: 'Shipping and returns', href: '/page/shipping-and-returns' },
        { label: 'Contact', href: '/page/contact' },
        { label: 'Your account', href: '/account' },
      ],
    },
    {
      heading: { label: 'Torqline', href: '/page/about' },
      items: [
        { label: 'About', href: '/page/about' },
        { label: 'Refund policy', href: '/policies/refund-policy' },
        { label: 'Privacy policy', href: '/policies/privacy-policy' },
        { label: 'Terms of service', href: '/policies/terms-of-service' },
      ],
    },
  ],
  newsletter: {
    heading: 'Deals and maintenance tips',
    placeholder: 'Email address',
    consent: [
      'I agree to the ',
      { label: 'terms of service', href: '/policies/terms-of-service' },
      ' and the ',
      { label: 'privacy policy', href: '/policies/privacy-policy' },
      '.',
    ],
    button: 'Sign up',
    busy: 'Signing up...',
    success: 'Thanks. You’re on the list.',
  },
  copyright: '© 2026 Torqline Auto Parts (demo store)',
}

// ── Navigation menus (store editor › Navigation) ─────────────────────────────

export function torqlineMenus(ctx: InstallContext): StoreMenu[] {
  const menu = (name: string, handle: string, key: string, links: { label: string; href: string }[]): StoreMenu => ({
    id: `menu-${ctx.prefix}-${key}`,
    channelId: ctx.channelId,
    name,
    handle,
    status: 'Active',
    updatedAt: MERCH_UPDATED,
    items: links.map((link, i) => ({ id: `mi-${ctx.prefix}-${key}-${i + 1}`, title: link.label, linkType: 'url' as const, target: link.href })),
  })
  return [
    menu('Main menu', 'main-menu', 'main', TORQLINE_CHROME.nav),
    menu('Footer menu', 'footer-menu', 'footer', TORQLINE_CHROME.footerColumns.slice(1).flatMap((column) => column.items)),
  ]
}

// ── Pages and policies ───────────────────────────────────────────────────────
// No blog posts, so nothing links to a blog. Every fact agrees with the checkout,
// the chatbot's knowledge and the other pages.

const PAGES: [kind: ContentEntry['kind'], handle: string, title: string, body: string, seoDescription: string][] = [
  [
    'page', 'about', 'About Torqline',
    '<h2>The right part, the first time</h2><p>Torqline sells the parts most drivers replace themselves: brakes, filters, oil, batteries, bulbs, wipers and spark plugs. We started in a two-bay garage in Columbus, Ohio, and we still answer every question ourselves.</p><h3>How we work</h3><ul><li>Every part lists the vehicles it fits, so you can check before you buy.</li><li>Every part has its own part number, printed on the box and on your receipt.</li><li>Shipping is free on every order, and returns are free within 90 days.</li></ul>',
    'Torqline sells brakes, filters, oil, batteries, bulbs, wipers and spark plugs, with the vehicles each part fits.',
  ],
  [
    'page', 'contact', 'Contact',
    '<h2>Talk to a parts expert</h2><p>Not sure a part fits, or want to check an order? Write or call, and we’ll answer within one business day.</p><ul><li><strong>Email:</strong> hello@torqline.example</li><li><strong>Phone:</strong> (614) 555-0187</li><li><strong>Hours:</strong> Monday to Friday, 8 a.m. to 6 p.m. ET</li></ul><h3>Before you write</h3><p>You can see every order and its status in <a href="/account">your account</a>. Have your vehicle’s year, make and model ready, and the part number if you have it.</p>',
    'Contact Torqline about a part, a fit or an order.',
  ],
  [
    'page', 'fitment-guarantee', 'Our fitment guarantee',
    '<h2>Parts that fit, guaranteed</h2><p>Choose your vehicle’s year, make and model at the top of the store. Every part then says whether it fits, and each product page lists every vehicle it fits under “Vehicle fit”.</p><h3>What the badges mean</h3><ul><li><strong>Fits your vehicle:</strong> the part is listed for your year, make and model.</li><li><strong>Doesn’t fit your vehicle:</strong> it isn’t, so choose another part.</li><li><strong>Universal fit:</strong> the part works with any vehicle, like oil, brake fluid, the tire gauge and the jump starter.</li><li><strong>Check fit:</strong> choose a vehicle to find out.</li></ul><h3>Our guarantee</h3><p>If a part we say fits your vehicle doesn’t, write to us with your order number. We ship the right part free straight away, before you send the first one back, and we pay for the return.</p><h3>Part numbers</h3><p>Every part has a Torqline part number, like TQ-BRK-4471. Type it in the search box, with or without the dashes, to go straight to that part.</p><h3>Brake work</h3><p>Brakes are safety parts. Unless you’ve done the job before, have a qualified mechanic fit pads and rotors, and bleed the brakes after changing the fluid.</p>',
    'How Torqline shows which parts fit your vehicle, and what we do if one doesn’t.',
  ],
  [
    'page', 'shipping-and-returns', 'Shipping and returns',
    '<h2>Free shipping on every order</h2><p>Orders placed by 2 p.m. ET on a business day ship the same day. Delivery takes 3 to 5 business days, and we email you a tracking link when your order ships.</p><p>We ship to the United States, Canada, Australia, New Zealand and the United Kingdom. Orders outside the US may owe import duties on delivery.</p><h2>Free returns within 90 days</h2><p>Send back any part that is unused and in its original packaging within 90 days of delivery.</p><ol><li>Write to hello@torqline.example with your order number.</li><li>We email you a prepaid return label.</li><li>We refund your original payment method within 5 business days of receiving the return.</li></ol><h3>Wrong fit?</h3><p>If a part we said fits your vehicle doesn’t, our <a href="/page/fitment-guarantee">fitment guarantee</a> sends you the right one first.</p>',
    'Free shipping on every order and free returns within 90 days.',
  ],
  [
    'policy', 'refund-policy', 'Refund policy',
    '<h2>Refund policy</h2><p>You can return any part that is unused and in its original packaging within 90 days of delivery. Returns are free.</p><h3>How to return</h3><p>Write to hello@torqline.example with your order number and we’ll email you a prepaid return label.</p><h3>Refunds</h3><p>We refund the full price you paid to your original payment method, within 5 business days of receiving the return.</p><h3>Parts that don’t fit</h3><p>If a part we said fits your vehicle doesn’t, we ship the right part first and pay for the return. See our <a href="/page/fitment-guarantee">fitment guarantee</a>.</p><p>More on delivery and returns: <a href="/page/shipping-and-returns">Shipping and returns</a>.</p>',
    'How returns and refunds work at Torqline.',
  ],
  [
    'policy', 'privacy-policy', 'Privacy policy',
    '<h2>Privacy policy</h2><p>We collect what we need to deliver your order: your name, address, email and order history, and the vehicle you choose so we can show what fits it. Your card details go straight to our payment provider and never reach us.</p><h3>Email</h3><p>We only send marketing email if you sign up for it, and every message has an unsubscribe link.</p><h3>Your rights</h3><p>You can ask for a copy of your data, or ask us to correct or delete it, by writing to hello@torqline.example.</p>',
    'What personal data Torqline collects, why, and your rights.',
  ],
  [
    'policy', 'terms-of-service', 'Terms of service',
    '<h2>Terms of service</h2><p>These terms apply when you buy from this store. Prices are in US dollars, and shipping is free on every order.</p><h3>Orders</h3><p>An order is confirmed when you receive our confirmation email. If a part sells out before we can ship it, we cancel that item and refund it in full.</p><h3>Discount codes</h3><p>One code per order. A code applies only to the parts and dates it names, and can’t be exchanged for cash.</p><h3>Fitment</h3><p>Fitment is shown for the year, make and model you choose. Our fitment guarantee covers a part we said fits that doesn’t.</p><h3>Delivery and returns</h3><p>Delivery takes 3 to 5 business days. You can return unused parts within 90 days of delivery for a full refund.</p>',
    'The terms that apply when you buy from the Torqline store.',
  ],
]

export function torqlineContent(ctx: InstallContext): ContentEntry[] {
  return PAGES.map(([kind, handle, title, body, seoDescription]) => ({
    id: `${ctx.prefix}-${kind}-${handle}`,
    channelId: ctx.channelId,
    kind,
    title,
    handle,
    body,
    status: 'Active',
    template: 'Default',
    seoTitle: `${title} | Torqline`,
    seoDescription,
    imageName: '',
    publishedAt: '',
    updatedAt: MERCH_UPDATED,
  }))
}

export const TORQLINE_BLOG_SEO: BlogSeoSettings = {
  title: 'Torqline Garage Notes',
  metaDescription: 'How-tos and maintenance tips from the Torqline parts team.',
}

// ── Theme templates ──────────────────────────────────────────────────────────
// Drawn by the sections drawing (TORQLINE_THEME_STYLES.drawing), with what the
// Torqline theme adds to it:
//   vehicle-finder     the home hero: { headline, subheadline, image, partNumberSearch },
//                      the Year → Make → Model picker over the photo, and a part
//                      number search when `partNumberSearch` is on.
//   featured-products  `vehicle: true` lists, once a vehicle is chosen, the parts that
//                      fit it (fits first, then universal), and the heading names it.
//   product-detail     `fitment: true` shows the fit banner; the collapsible rows add
//                      the sources 'specs' (detail.specs), 'fitment' (the vehicle table,
//                      the shopper's vehicle highlighted) and 'warranty' (detail.warranty).
//   collection-grid    `cardStyle: 'Dense'`: part number, fit badge, stock and Add to cart.

const HEADER = { menuStyle: 'Inline', sticky: true, colorScheme: 'Dark', searchStyle: 'Icon' } as const
const FOOTER = { showSocial: false, columns: 3, colorScheme: 'Dark' } as const
const SHIPPING_AND_RETURNS = 'Free shipping on every order, delivered in 3 to 5 business days. Free returns within 90 days on unused parts in their original packaging.'

export function torqlineThemeTemplates(ctx: InstallContext): Record<TemplateType, ThemeSection[]> {
  const id = (name: string): string => `${ctx.prefix}-${name}`
  const header = (template: TemplateType) => createSection('header', { ...HEADER }, id(`${template}-header`))
  const footer = (template: TemplateType) => createSection('footer', { ...FOOTER }, id(`${template}-footer`))
  const tile = (title: TorqlineCategory) => {
    const handle = toHandle(title)
    return createBlock('collection', { label: title, link: `/collections/${handle}`, image: TILE_PHOTOS[title] }, id(`collection-${handle}`))
  }
  const row = (key: string, settings: Record<string, string | boolean>) => createBlock('collapsible-row', { text: '', open: false, ...settings }, id(`row-${key}`))
  return {
    home: [
      createSection('announcement-bar', { text: 'Free shipping on every order. Parts that fit, guaranteed.', link: '' }, id('home-announcement')),
      header('home'),
      createSection('vehicle-finder', {
        headline: 'Find parts that fit',
        subheadline: 'Choose your vehicle and every part shows whether it fits.',
        image: TORQLINE_PHOTOS.hero,
        partNumberSearch: true,
      }, id('home-vehicle-finder')),
      {
        ...createSection('collection-grid', { title: 'Shop by category', layout: 'Grid', columns: 4, tileRatio: 'Landscape', tileStyle: 'Photo' }, id('home-collections')),
        blocks: TORQLINE_CATEGORIES.map(tile),
      },
      createSection('featured-products', { title: 'Popular parts', collection: 'all', productCount: 4, layout: 'Grid', vehicle: true }, id('home-popular')),
      createSection('image-with-text', {
        heading: 'Parts that fit, guaranteed',
        body: 'Choose your vehicle once and every part tells you whether it fits. If a part we say fits doesn’t, we ship the right one first and pay for the return.',
        buttonLabel: 'How our guarantee works',
        buttonLink: '/page/fitment-guarantee',
        imageSide: 'Left',
        image: TORQLINE_PHOTOS.storyFitment,
      }, id('home-story-fitment')),
      createSection('featured-products', { title: 'Brake week: 15% off brakes', collection: 'brakes', productCount: 4, layout: 'Grid' }, id('home-brakes')),
      createSection('image-with-text', {
        heading: 'Time for an oil change?',
        body: 'Five quarts of full synthetic in the grade your engine takes, and the filter that fits it. Most oil changes take under an hour in the driveway.',
        buttonLabel: 'Shop motor oil',
        buttonLink: productLink(ctx, 10),
        imageSide: 'Right',
        image: TORQLINE_PHOTOS.storyOilChange,
      }, id('home-story-oil')),
      {
        ...createSection('icon-row', { title: '' }, id('home-trust')),
        blocks: [
          createBlock('feature', { icon: 'truck', title: 'Free shipping', text: 'On every order, delivered in 3 to 5 business days.', link: '' }, id('trust-shipping')),
          createBlock('feature', { icon: 'shield-check', title: 'Fitment guarantee', text: 'If it doesn’t fit, we send the right part first.', link: '/page/fitment-guarantee' }, id('trust-fitment')),
          createBlock('feature', { icon: 'rotate-ccw', title: 'Free 90-day returns', text: 'Unused and in its box? Send it back free.', link: '/page/shipping-and-returns' }, id('trust-returns')),
          createBlock('feature', { icon: 'headphones', title: 'Parts experts', text: 'Real people, Monday to Friday.', link: '/page/contact' }, id('trust-help')),
        ],
      },
      createSection('newsletter', { headline: 'Deals and maintenance tips', buttonLabel: 'Sign up' }, id('home-newsletter')),
      footer('home'),
    ],
    product: [
      header('product'),
      {
        ...createSection('product-detail', { galleryLayout: 'Thumbnails', imageRatio: 'Square', sizeGuide: false, fitment: true, showReviews: false }, id('product-detail')),
        blocks: [
          row('description', { title: 'Description', source: 'description', open: true }),
          row('specs', { title: 'Specifications', source: 'specs' }),
          row('fitment', { title: 'Vehicle fit', source: 'fitment' }),
          row('warranty', { title: 'Warranty', source: 'warranty' }),
          row('delivery-returns', { title: 'Shipping and returns', source: 'delivery-returns', text: SHIPPING_AND_RETURNS }),
        ],
      },
      createSection('featured-products', { title: 'You may also need' }, id('product-related')),
      footer('product'),
    ],
    collection: [
      header('collection'),
      // The product grid: filters for category, brand and price, sort, quick add, and the dense part card.
      createSection('collection-grid', { title: '', columns: 4, filters: true, sort: true, quickAdd: true, cardStyle: 'Dense' }, id('collection-grid')),
      footer('collection'),
    ],
    cart: [
      header('cart'),
      createSection('cart-summary', { showNotes: false, upsells: true }, id('cart-summary')),
      footer('cart'),
    ],
  }
}
