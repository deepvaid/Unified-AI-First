import type { Meta, StoryObj } from '@storybook/vue3'
import MpComingSoonTiles, { type ComingSoonTile } from './MpComingSoonTiles.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const HARDWARE: ComingSoonTile[] = [
  { icon: 'credit-card',  title: 'Payment terminals', desc: 'Stripe Reader M2, S700, Tap to Pay on iPhone & Android.' },
  { icon: 'printer',      title: 'Receipt printers',  desc: 'Star Micronics mC-Print3, Epson TM-m30III, ESC/POS over Wi-Fi.' },
  { icon: 'scan-barcode', title: 'Barcode scanners',  desc: 'Built-in camera or Bluetooth HID scanners.' },
  { icon: 'archive',      title: 'Cash drawers',      desc: 'Printer-driven over RJ12 — auto-trigger on cash sales.' },
]

const SETTINGS: ComingSoonTile[] = [
  { icon: 'cloud-off', title: 'Offline mode',    desc: 'Per-store offline limits, sync cadence, and reconciliation defaults.' },
  { icon: 'shield',    title: 'Security',        desc: 'Inactivity lock window, PIN policy, manager-override approvals.' },
  { icon: 'tag',       title: 'Tax & rounding',  desc: 'Per-region tax tables, rounding rules, surcharging.' },
  { icon: 'flag',      title: 'Market settings', desc: 'Enable Retail per country (US / CA / AU / NZ).' },
]

const meta = {
  title: 'Feedback/MpComingSoonTiles',
  component: MpComingSoonTiles,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpComingSoonTiles\` is the "not built yet, but here's what's planned" panel: a centered icon
badge, headline, and blurb above a grid of feature tiles. It replaces the scaffold that was
copy-pasted between \`Retail/RetailSettings.vue\` and \`Retail/Hardware.vue\` (86% identical).

**Use when:** a route exists in the IA but its functionality is still ahead — and you can say
something concrete about what's coming.

**Don't use when:** the surface is built but currently has no data — that's \`MpEmptyState\`.
Empty means "nothing to show yet"; coming-soon means "this doesn't exist yet".

### Usage
\`\`\`html
<MpComingSoonTiles
  icon="printer"
  title="Hardware management coming soon"
  description="Hardware pairing lives on the POS device today."
  :tiles="categories"
/>
\`\`\`

### 🟢 Do's
- **Do** make each tile's \`desc\` specific — naming real capabilities is what makes the panel
  informative rather than an apology.
- **Do** set \`headingLevel\` to fit the page outline; it sits under the \`MpPageHeader\` h1, so
  the default \`h3\` is right when there's an intervening section heading, \`h2\` when there isn't.

### 🔴 Don'ts
- **Don't** promise dates in the copy.
- **Don't** make tiles look interactive — they're previews, not links.

### A11y
- **Provides:** the headline renders as a real heading element via \`headingLevel\`, keeping the
  page outline intact; tiles are static text, correctly not focusable.
- **Consumer must:** pick a \`headingLevel\` that doesn't skip a level from the page's h1.
        `,
      },
    },
  },
  argTypes: {
    icon: { control: 'text', description: 'Lucide icon for the centered badge.' },
    title: { control: 'text', description: 'Headline, e.g. "Hardware management coming soon".' },
    description: { control: 'text', description: 'Supporting paragraph under the headline. Clamped to a 460px measure.' },
    tiles: { control: 'object', description: 'ComingSoonTile[] — { icon, title, desc } previewing planned capabilities.' },
    smCols: { control: 'number', description: 'Tile column width at the sm breakpoint. Default 6 (two up).' },
    mdCols: { control: 'number', description: 'Tile column width at the md breakpoint. Omit to keep the sm width.' },
    headingLevel: { control: 'select', options: ['h2', 'h3', 'h4'], description: 'Heading element for the headline. Default h3.' },
  },
  render: (args) => ({
    components: { MpComingSoonTiles },
    setup: () => ({ args }),
    template: '<div style="max-width: 900px"><MpComingSoonTiles v-bind="args" /></div>',
  }),
} satisfies Meta<typeof MpComingSoonTiles>

export default meta
type Story = StoryObj<typeof meta>

/** The Hardware page's panel — two tiles per row from the sm breakpoint up. */
export const Default: Story = {
  args: {
    icon: 'printer',
    title: 'Hardware management coming soon',
    description: 'Hardware pairing lives on the POS device itself today. This panel will surface paired devices, firmware versions, and troubleshooting tools for your fleet.',
    tiles: HARDWARE,
  },
}

/** The Retail Settings panel — `mdCols: 4` gives three tiles per row on desktop. */
export const ThreeColumn: Story = {
  args: {
    icon: 'settings',
    title: 'Retail settings coming soon',
    description: 'The MVP exposes the following configuration surfaces. Interactive setup will land in Phase 1.',
    tiles: SETTINGS,
    mdCols: 4,
  },
}

/** Headline only — `description` is optional and its paragraph is skipped entirely. */
export const NoDescription: Story = {
  args: { icon: 'wrench', title: 'Diagnostics coming soon', tiles: HARDWARE.slice(0, 2) },
}

/** At 375px the tiles stack to a single column. */
export const Mobile375: Story = {
  args: { ...Default.args },
  globals: { viewport: { value: 'mobile375', isRotated: false } },
}

export const DarkMode: Story = {
  args: { ...Default.args },
  globals: darkModeGlobals,
}
