import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import StorefrontPreview from './StorefrontPreview.vue'
import { createBlock, createSection, type ThemeSection, type ThemeStyles } from '@/stores/themeBuilderData'

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
  title: 'Sales Channels/StorefrontPreview',
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
\`--sf-radius\`, fonts) consumed by the section mocks. \`interactive\` adds hover outlines and click/keyboard
selection (\`select\` + \`hover\` emits); \`selectedId\` shows a labeled ring. \`device\` constrains the inner
viewport (desktop full, tablet ~768px, mobile ~390px).

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
  args: {
    device: 'desktop',
    interactive: false,
    selectedId: null,
  },
  argTypes: {
    sections: { control: false, description: 'Ordered ThemeSection[] for the active template; omit for the static default mock.' },
    styles: { control: 'object', description: 'Partial ThemeStyles applied as CSS vars on the preview root.' },
    device: { control: 'select', options: ['desktop', 'tablet', 'mobile'], description: 'Inner viewport frame width.' },
    interactive: { control: 'boolean', description: 'Hover outline + click/keyboard selection on sections.' },
    selectedId: { control: 'text', description: 'Section id highlighted with a labeled selection ring.' },
    onSelect: { table: { category: 'events' }, description: 'Emitted with the section id on click/Enter/Space (interactive only).' },
    onHover: { table: { category: 'events' }, description: 'Emitted with the hovered section id, or null on leave (interactive only).' },
  },
} satisfies Meta<typeof StorefrontPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { StorefrontPreview },
    setup: () => ({ args }),
    template: `
      <div style="max-width:720px;">
        <StorefrontPreview v-bind="args" />
      </div>
    `,
  }),
}

export const Sectioned: Story = {
  render: (args) => ({
    components: { StorefrontPreview },
    setup: () => ({ args, sections: homeSections() }),
    template: `
      <div style="max-width:720px;">
        <StorefrontPreview v-bind="args" :sections="sections" />
      </div>
    `,
  }),
}

export const Styled: Story = {
  args: { styles: boutiqueStyles },
  render: (args) => ({
    components: { StorefrontPreview },
    setup: () => ({ args, sections: homeSections() }),
    template: `
      <div style="max-width:720px;">
        <StorefrontPreview v-bind="args" :sections="sections" />
      </div>
    `,
  }),
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
      <div style="max-width:720px;">
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
  args: { device: 'mobile' },
  render: (args) => ({
    components: { StorefrontPreview },
    setup: () => ({ args, sections: homeSections() }),
    template: `
      <div style="max-width:720px;">
        <StorefrontPreview v-bind="args" :sections="sections" />
      </div>
    `,
  }),
}

/** A rich-text section carrying heading, paragraph, and button blocks — renders the nested block mocks. */
export const SectionWithBlocks: Story = {
  render: (args) => ({
    components: { StorefrontPreview },
    setup: () => ({ args, sections: sectionsWithBlocks() }),
    template: `
      <div style="max-width:720px;">
        <StorefrontPreview v-bind="args" :sections="sections" />
      </div>
    `,
  }),
}

/** A collection-grid section from the "4-up" variant preset (columns: 4). */
export const CollectionGridVariant: Story = {
  render: (args) => ({
    components: { StorefrontPreview },
    setup: () => ({ args, sections: collectionGridSections() }),
    template: `
      <div style="max-width:720px;">
        <StorefrontPreview v-bind="args" :sections="sections" />
      </div>
    `,
  }),
}
