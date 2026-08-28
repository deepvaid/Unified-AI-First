import type { Meta, StoryObj } from '@storybook/vue3'
import StoreEditorSidebar from './StoreEditorSidebar.vue'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'

const ACCOUNT_ID = '2000290'

const meta = {
  title: 'Product/Sales Channels/StoreEditorSidebar',
  component: StoreEditorSidebar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`StoreEditorSidebar\` is the entity flavor of \`MpSectionRail\`: the 260px in-content rail for the
store editor shell. It composes the rail with the store's identity block, a "Switch store"
selector listing the account's *other* web stores, and the section links from
\`storeEditorMenu.ts\` — grouped as Overview → Customize (Theme first, since the storefront theme
is the primary job) → Store content.

**Use when:** inside a store-editor route, as the shell's rail. The global AppSidebar
auto-minimizes behind it via the route's \`railShell\`/\`storeEditor\` meta.

**Don't use when:** you need a generic section rail — use \`MpSectionRail\` directly.

### Usage
\`\`\`html
<StoreEditorSidebar :channel="channel" />
\`\`\`

### 🟢 Do's
- **Do** pass the resolved \`SalesChannel\` — the rail derives identity, domain, and switcher from it.
- **Do** rely on the built-in switch handler: it keeps the reader on the same section when
  swapping stores (editors land on their section root via \`sectionRootForRoute\`).

### 🔴 Don'ts
- **Don't** add the current store to the switcher — it filters itself out.
- **Don't** hardcode \`accountId\`; it reads the route param and falls back to \`'2000290'\`.

### A11y
- **Provides:** inherits \`MpSectionRail\`'s \`<nav aria-label="Store editor navigation">\`, active
  state via \`aria-current\`, and keyboard-operable switcher.
- **Consumer must:** ensure exactly one rail is on screen per shell route.

> **Story note:** the Storybook router is a catch-all with no \`accountId\` param, so the rail
> falls back to account \`${ACCOUNT_ID}\` and every link resolves against that stub route.
        `,
      },
    },
  },
  argTypes: {
    channel: { control: 'object', description: 'The SalesChannel being edited — supplies rail identity, domain caption, and the switcher exclusion.' },
  },
} satisfies Meta<typeof StoreEditorSidebar>

export default meta
type Story = StoryObj<typeof meta>

/** Renders the rail for the Nth seeded web store on the demo account. */
function channelStory(index: number): Story {
  return {
    render: () => ({
      components: { StoreEditorSidebar },
      setup() {
        const store = useSalesChannelsStore()
        const channel = store.webStoreChannels(ACCOUNT_ID)[index]
        return { channel }
      },
      template: `
        <div style="display: flex; min-height: 620px;">
          <StoreEditorSidebar v-if="channel" :channel="channel" />
        </div>
      `,
    }),
  }
}

/** The primary DTC storefront — published, with a live domain in the identity caption. */
export const Default: Story = channelStory(0)

/**
 * A second store from the same account. The switcher lists the *other* four web stores, and the
 * identity block picks up this store's own name and domain.
 */
export const AlternateStore: Story = channelStory(1)

/**
 * A store still in setup — `webStore.domain` may be empty, so the identity caption falls back to
 * the literal "Web store".
 */
export const NoDomainFallback: Story = channelStory(2)

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/** One structure — the entity flavor of `MpSectionRail`: a back link, the store's identity card with a switcher, then the grouped section links. It adds no geometry of its own. */
export const Variants: Story = {
  render: (args) => ({
    components: { StoreEditorSidebar },
    setup: () => ({ args }),
    template: `<StoreEditorSidebar v-bind="args" />`,
  }),
}

/** There is no `size` prop — it inherits `MpSectionRail`'s 260px column (`layout.sectionRailWidth`) and its `component.listItem.*` rows. Phase 4 (P4-7) tokenized the rail, and this component picked all of it up for free — which is the argument for composing the rail rather than hand-rolling one, as the deleted `SettingsSidebar` did. */
export const Sizes: Story = {
  render: (args) => ({
    components: { StoreEditorSidebar },
    setup: () => ({ args }),
    template: `<StoreEditorSidebar v-bind="args" />`,
  }),
}

/** A store with a domain, a store without one (caption falls back), and the switcher open. */
export const States: Story = {
  render: (args) => ({
    components: { StoreEditorSidebar },
    setup: () => ({ args }),
    template: `<StoreEditorSidebar v-bind="args" />`,
  }),
}
