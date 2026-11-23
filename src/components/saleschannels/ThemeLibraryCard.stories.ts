import type { Meta, StoryObj } from '@storybook/vue3'
import ThemeLibraryCard from './ThemeLibraryCard.vue'
import { demoStoreFor } from '@/storefront/demoStores'
import type { DemoStoreBlueprint } from '@/storefront/demoStores'
import { constrain } from '@/stories/decorators'
import { grid } from '@/stories/storyTemplate'

// The real library themes (DEMO_STORES).
const VITAHEAL = demoStoreFor('vitaheal')
const NORTHFOLD = demoStoreFor('northfold')
const TORQLINE = demoStoreFor('torqline')
const storefrontOf = (channelId: string) => `/accounts/2000290/sales_channels/${channelId}/storefront`
const cardOf = (blueprint: DemoStoreBlueprint) => ({ card: blueprint.card, showcaseName: blueprint.homeChannel.name })

/** A picture that cannot be decoded: the frame as it looks while a thumbnail is missing, with no request. */
const MISSING_PICTURE = 'data:image/jpeg;base64,'

const meta = {
  title: 'Product/Sales Channels/ThemeLibraryCard',
  component: ThemeLibraryCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
One theme in a store's **Theme library** (Store › Themes). Each theme is a whole demo store — its look,
products, pages and campaigns — and applying it makes the store a copy. The card shows a picture of the
theme's storefront (16:10), its name and version, its kind, a description, the store it is shown on
(**Showcase**), and what this store can do with it:

- **Apply** (\`action="apply"\`) — the page opens the Apply confirm.
- **Current** (\`action="current"\`) — the store runs it now: a "Current theme" chip, and Preview reads **Show store**.
- **Restore original store** (\`action="restore"\`) — the store's own theme while another one runs.
- **Preview only** (\`action="none"\`) — a store that can't take a theme; the page explains why once, above the grid.

Preview opens the showcase storefront in a new tab. When the showcase store runs another theme, there is
nothing to preview: leave out \`previewHref\`, pass \`showcaseRuns\`, and the card says so in one muted line.

**Use when:** the Theme library on the store's Themes page.

**Don't use when:** choosing a theme while creating a store — that's an \`MpOptionCard\` gallery (a select-then-commit toggle).

### A11y
- **Provides:** a static card (never a button, so its buttons are not nested), the theme name as a real heading
  (\`headingLevel\`, 3 by default), alt text on the picture, a per-card name on Apply ("Apply Northfold"), and a
  Preview link that says it opens a new tab. The placeholder mark is decorative.
- **Consumer must:** handle \`apply\` and \`restore\` (both open a confirm), and lay the cards out in a grid that
  collapses to one column on phones.
        `,
      },
    },
  },
  argTypes: {
    action: { control: 'inline-radio', options: ['apply', 'current', 'restore', 'none'] },
  },
  args: { ...cardOf(NORTHFOLD), action: 'apply' },
} satisfies Meta<typeof ThemeLibraryCard>

export default meta
type Story = StoryObj<typeof meta>

/** One card at the width it has in the library's three-column grid. */
const oneCard = [constrain('narrow')]

/** Northfold in a store that can take it: Apply and Preview. */
export const Default: Story = {
  decorators: oneCard,
  args: { previewHref: storefrontOf(NORTHFOLD.homeChannel.id) },
}

/** The theme the store runs now: a chip, no Apply, and Show store opens this store. */
export const Current: Story = {
  decorators: oneCard,
  args: { ...cardOf(TORQLINE), action: 'current', previewHref: storefrontOf(TORQLINE.homeChannel.id) },
}

/** Vitaheal on its own store while Northfold runs there: the card restores it, and its showcase (this store) can't be previewed. */
export const Original: Story = {
  decorators: oneCard,
  args: { ...cardOf(VITAHEAL), action: 'restore', showcaseRuns: NORTHFOLD.card.name },
}

/** A store that can't take a theme (Neelam-Store): Preview only. */
export const NotAllowed: Story = {
  decorators: oneCard,
  args: { ...cardOf(TORQLINE), action: 'none', previewHref: storefrontOf(TORQLINE.homeChannel.id) },
}

/** Its showcase store runs another theme right now, so there is nothing to preview. */
export const PreviewUnavailable: Story = {
  decorators: oneCard,
  args: { ...cardOf(NORTHFOLD), action: 'apply', showcaseRuns: VITAHEAL.card.name },
}

export const States: Story = {
  decorators: [constrain('wide')],
  render: grid({ ThemeLibraryCard }, [
    { label: 'Apply', args: { ...cardOf(NORTHFOLD), action: 'apply', previewHref: storefrontOf(NORTHFOLD.homeChannel.id) } },
    { label: 'Current theme', args: { ...cardOf(TORQLINE), action: 'current', previewHref: storefrontOf(TORQLINE.homeChannel.id) } },
    { label: 'Original (restore)', args: { ...cardOf(VITAHEAL), action: 'restore', showcaseRuns: NORTHFOLD.card.name } },
    { label: 'Not allowed (preview only)', args: { ...cardOf(TORQLINE), action: 'none', previewHref: storefrontOf(TORQLINE.homeChannel.id) } },
    { label: 'Preview unavailable', args: { ...cardOf(NORTHFOLD), action: 'apply', showcaseRuns: VITAHEAL.card.name } },
    { label: 'Picture missing', args: { ...cardOf(VITAHEAL), card: { ...VITAHEAL.card, thumbnail: MISSING_PICTURE }, action: 'apply', previewHref: storefrontOf(VITAHEAL.homeChannel.id) } },
  ]),
}
