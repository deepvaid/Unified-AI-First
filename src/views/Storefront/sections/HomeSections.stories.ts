import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage } from '@/stories/decorators'
import { demoStoreFor } from '@/storefront/demoStores'
import { snapshotFor } from '@/storefront/demoStores/install'
import { createSection, storefrontThemeVars } from '@/storefront/themeSections'
import type { ThemeSection } from '@/storefront/themeSections'
import StorefrontHome from '../StorefrontHome.vue'
import CollectionGrid from './CollectionGrid.vue'
import FeaturedProducts from './FeaturedProducts.vue'
import IconRow from './IconRow.vue'
import ImageBanner from './ImageBanner.vue'
import LogoStrip from './LogoStrip.vue'
import { LUMOS_STYLES, lumosHomeSections } from './lumosStoryFixtures'
import Newsletter from './Newsletter.vue'
import { withStorefront } from './storyContext'

// Northfold's home page, section by section, as the sections drawing draws it.
const northfold = snapshotFor(demoStoreFor('northfold').homeChannel, 'northfold', '2026-11-20')
const home = northfold.theme.templates.home
const sectionOf = (kind: string): ThemeSection => {
  const section = home.find((s) => s.kind === kind)
  if (!section) throw new Error(`Northfold's home has no ${kind} section`)
  return section
}

const meta = {
  title: 'Product/Storefront/Home sections',
  component: StorefrontHome,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
On a theme with the **sections drawing** (\`styles.drawing: 'sections'\`: Northfold, Torqline), the
home page draws its template section by section, through one component per kind in
\`src/views/Storefront/sections/\` (the registry is \`SECTION_COMPONENTS\` in \`index.ts\`):

| Kind | Component | What it draws |
|---|---|---|
| \`image-banner\`, \`hero\` | ImageBanner | A full-width photo, its headline (the page's h1 when it comes first) and buttons |
| \`collection-grid\` | CollectionGrid | Category tiles: photo, name and arrow; 2-4 columns, Portrait / Square / Landscape |
| \`image-with-text\` | ImageWithText | A photo beside a story and one button |
| \`featured-products\` | FeaturedProducts | The products of the collection it names, as the collection page's cards with quick add |
| \`rich-text\` | RichText | A heading and a paragraph |
| \`icon-row\` | IconRow | Short promises with icons: free shipping, returns, sizing help; plain, or each on a card |
| \`logo-strip\` | LogoStrip | **New.** Brand logos on cards, six to a row (three on a phone), each a link to the brand's products |
| \`newsletter\` | Newsletter | A band with the store's sign-up form |
| \`announcement-bar\` | AnnouncementBar | Where the template places it, when the store does not show it above the header |

**Lumos (part 5)** added settings the theme's own styles drive (\`--sf-card*\`, \`--sf-tint\`, \`--sf-button-hover\`,
\`--sf-button-case\`, title sizes, measure and gutter):

- \`image-banner\`: a \`badge\` above the headline, \`accentWords\` in the accent colour, \`contentPosition: 'Center left'\`
  (the page's colours on a wash beside the photo) and up to three \`stat\` blocks, a white strip under the buttons.
- \`collection-grid\`: \`layout: 'Carousel'\` (a looping row, the columns in view, one on a phone, a dot per tile),
  \`tileStyle: 'Label over photo'\`, \`background: 'Tint'\`, \`accentWords\` and a tile's \`accent\`.
- \`featured-products\`: an \`eyebrow\` and \`accentWords\`; a carousel has Previous and Next.
- \`icon-row\`: an \`eyebrow\`, a \`subtitle\`, \`alignment\` and \`tileStyle: 'Card'\`.

A kind without a component draws nothing (a developer gets one console warning). Every other theme
keeps the classic drawing. Add a kind: write its component, list it in the registry, and add it to
the catalogue in \`src/storefront/themeSections.ts\` so the theme builder offers it.

Out of system on purpose (P4-8): sections draw with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [withStorefront(), isolateStorage],
} satisfies Meta<typeof StorefrontHome>

export default meta
type Story = StoryObj<typeof meta>

/** Northfold's whole home page, between its header and footer. */
export const Default: Story = {}

/** The trust strip: three features, the last a link to the size guide. */
export const IconRowStrip: Story = {
  render: () => ({
    components: { IconRow },
    setup: () => ({ section: sectionOf('icon-row') }),
    template: '<IconRow :section="section" />',
  }),
}

/** A new icon row, as the builder adds one: three starter features to rewrite. */
export const IconRowStarter: Story = {
  render: () => ({
    components: { IconRow },
    setup: () => ({ section: createSection('icon-row', { title: 'Why shop with us' }, 'story-icon-row') }),
    template: '<IconRow :section="section" />',
  }),
}

/** Category tiles, square and three to a row. */
export const SquareTiles: Story = {
  render: () => ({
    components: { CollectionGrid },
    setup: () => {
      const tiles = sectionOf('collection-grid')
      return { section: { ...tiles, settings: { ...tiles.settings, tileRatio: 'Square', columns: 3 }, blocks: tiles.blocks?.slice(0, 3) } }
    },
    template: '<CollectionGrid :section="section" />',
  }),
}

/** A product row that scrolls sideways: every product, eight of them. */
export const ProductCarousel: Story = {
  render: () => ({
    components: { FeaturedProducts },
    setup: () => ({ section: createSection('featured-products', { title: 'New this season', collection: 'all', productCount: 8, layout: 'Carousel' }, 'story-carousel') }),
    template: '<FeaturedProducts :section="section" />',
  }),
}

/** The newsletter band, after a sign-up with nothing filled in: what is missing is said under each field. */
export const NewsletterBand: Story = {
  render: () => ({
    components: { Newsletter },
    setup: () => ({ section: sectionOf('newsletter') }),
    template: '<Newsletter :section="section" />',
  }),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLButtonElement>('.sfn button[type="submit"]')?.click()
  },
}

// ── Lumos (part 5) ──────────────────────────────────────────────────────────
// Lumos's styles (Figma's values) on an inner frame, so the sections draw as the Lumos
// theme does: Inter at 500, uppercase titles and buttons, indigo accent, 8px cards with a
// soft shadow, a pale indigo tint, a 1328px measure with 56px gutters.
const lumosFrame = {
  ...storefrontThemeVars(LUMOS_STYLES),
  background: 'var(--sf-bg)',
  color: 'var(--sf-text)',
  fontFamily: 'var(--sf-body-font)',
  paddingBottom: '96px',
}
const lumos = lumosHomeSections('story')
const lumosRooms = lumos.find((s) => s.kind === 'collection-grid')!

/**
 * The Lumos home page's sections, in its styles: the hero with its badge, accent words,
 * two buttons and stats strip; the rooms carousel with names on the photos, on a tint;
 * the brands strip; and "Why choose us" on cards.
 */
export const LumosHome: Story = {
  render: () => ({
    components: { ImageBanner, CollectionGrid, LogoStrip, IconRow },
    setup: () => ({ frame: lumosFrame, sections: lumos.filter((s) => s.kind !== 'featured-products') }),
    template: `<div :style="frame">
      <template v-for="section in sections" :key="section.id">
        <ImageBanner v-if="section.kind === 'image-banner'" :section="section" :heading-level="1" />
        <CollectionGrid v-else-if="section.kind === 'collection-grid'" :section="section" />
        <LogoStrip v-else-if="section.kind === 'logo-strip'" :section="section" />
        <IconRow v-else-if="section.kind === 'icon-row'" :section="section" />
      </template>
    </div>`,
  }),
}

/** The rooms carousel after a dot is chosen: the third room leads and the loop follows. */
export const RoomsCarousel: Story = {
  render: () => ({
    components: { CollectionGrid },
    setup: () => ({ frame: lumosFrame, rooms: lumosRooms }),
    template: '<div :style="frame"><CollectionGrid :section="rooms" /></div>',
  }),
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    canvasElement.querySelectorAll<HTMLButtonElement>('.sfc__dot')[2]?.click()
  },
}

/** A product carousel with a line above its title and an accent word: Previous and Next beside "View all". */
export const ProductCarouselWithEyebrow: Story = {
  render: () => ({
    components: { FeaturedProducts },
    setup: () => ({
      frame: lumosFrame,
      section: createSection('featured-products', { eyebrow: 'Recommendations', title: 'Featured products', accentWords: 'Featured', collection: 'all', productCount: 8, layout: 'Carousel' }, 'story-featured-eyebrow'),
    }),
    template: '<div :style="frame"><FeaturedProducts :section="section" /></div>',
  }),
}
