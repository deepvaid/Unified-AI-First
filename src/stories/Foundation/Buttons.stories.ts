/**
 * Buttons — how `v-btn` looks in this app.
 *
 * There is no custom button component. Every button is a stock Vuetify `v-btn`
 * styled once, globally, by:
 *   • src/plugins/maropostTheme.ts → VBtn defaults (flat variant, no text-transform,
 *     40px min-height, Inter, button radius/typography tokens)
 *   • src/styles/global.scss → .v-btn overrides (smooth transitions, no hover lift,
 *     subtle inset highlight on flat, subtle border token on outlined)
 */
import type { Meta, StoryObj } from '@storybook/vue3'

const meta: Meta = {
  title: 'Foundations/Buttons',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
Buttons in this app are **stock Vuetify \`v-btn\`s** — there is no \`MpButton\`. Their look
comes entirely from the shared app defaults in \`src/plugins/maropostTheme.ts\` (VBtn entry)
plus the \`.v-btn\` overrides in \`src/styles/global.scss\`. **Use them as-is; never restyle a
button locally.**

What the shared defaults give every button:
- \`variant="flat"\` by default
- \`text-transform: none\` — labels keep sentence case
- **40px minimum height**, 14px inline padding
- Inter, button typography + radius tokens
- Smooth color/shadow transitions, **no transform on hover**
- Flat buttons get a subtle inset highlight + soft primary shadow (global.scss)
- Outlined buttons use the \`--mp-border-subtle\` token for their border (global.scss)

### Hierarchy
| Role | Recipe |
|---|---|
| Primary CTA (one per view) | \`color="primary" variant="flat"\` |
| Secondary | \`variant="outlined"\` or \`variant="tonal"\` |
| Tertiary / dismiss | \`variant="text"\` |
| Destructive | \`color="error"\` — reserve exclusively for destructive actions |

### 🟢 Do's
- **Do** write labels in sentence case with a verb: "Create campaign", "Export", "Send reply".
- **Do** use Lucide icon names in kebab-case (\`prepend-icon="plus"\`, \`append-icon="chevron-down"\`).
- **Do** give icon-only buttons an \`aria-label\` — the icon is their only content.
- **Do** add \`class="text-none"\` where views set it defensively (harmless; the default already
  disables uppercase).

### 🔴 Don'ts
- **Don't** override button colors, radius, height, or shadows with local CSS.
- **Don't** use \`mdi-*\` icon strings — Lucide only.
- **Don't** use \`variant="elevated"\` — the platform is flat + border, not elevation.
- **Don't** put more than one primary (flat + primary) button in the same action row.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

/** The four platform variants side by side: flat (primary CTA), outlined and tonal (secondary), text (tertiary). */
export const Variants: Story = {
  render: () => ({
    template: `
      <div class="d-flex flex-wrap gap-6 align-end">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">flat + primary — primary CTA</div>
          <v-btn color="primary" variant="flat" class="text-none">Create campaign</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">outlined — secondary</div>
          <v-btn variant="outlined" class="text-none">Export</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">tonal — secondary</div>
          <v-btn color="primary" variant="tonal" class="text-none">Duplicate</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">text — tertiary</div>
          <v-btn variant="text" class="text-none">Cancel</v-btn>
        </div>
      </div>
    `,
  }),
}

/** Semantic colors. Use error exclusively for destructive actions. */
export const Colors: Story = {
  render: () => ({
    template: `
      <div class="d-flex flex-wrap gap-6 align-end">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">primary</div>
          <v-btn color="primary" variant="flat" class="text-none">Create campaign</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">secondary</div>
          <v-btn color="secondary" variant="flat" class="text-none">Generate with Da Vinci</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">error — destructive only</div>
          <v-btn color="error" variant="flat" class="text-none">Delete campaign</v-btn>
        </div>
      </div>
    `,
  }),
}

/** Size scale. Default is the workhorse (40px min-height); small suits toolbars and table rows. */
export const Sizes: Story = {
  render: () => ({
    template: `
      <div class="d-flex flex-wrap gap-6 align-end">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">small</div>
          <v-btn color="primary" variant="flat" size="small" class="text-none">Export</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">default</div>
          <v-btn color="primary" variant="flat" class="text-none">Export</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">large</div>
          <v-btn color="primary" variant="flat" size="large" class="text-none">Export</v-btn>
        </div>
      </div>
    `,
  }),
}

/**
 * Icons are Lucide names in kebab-case. Prepend for the action's object ("plus" on create),
 * append for disclosure ("chevron-down" on menus). Icon-only buttons must carry an aria-label.
 */
export const WithIcons: Story = {
  render: () => ({
    template: `
      <div class="d-flex flex-wrap gap-6 align-end">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">prepend-icon="plus"</div>
          <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create campaign</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">append-icon="chevron-down"</div>
          <v-btn variant="outlined" append-icon="chevron-down" class="text-none">Export</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">icon-only + aria-label</div>
          <v-btn icon="trash-2" variant="text" color="error" aria-label="Delete campaign" />
        </div>
      </div>
    `,
  }),
}

/** Disabled and loading. Loading swaps the label for a spinner and blocks interaction — use it on async submits. */
export const States: Story = {
  render: () => ({
    template: `
      <div class="d-flex flex-wrap gap-6 align-end">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">disabled</div>
          <v-btn color="primary" variant="flat" disabled class="text-none">Create campaign</v-btn>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">loading</div>
          <v-btn color="primary" variant="flat" loading class="text-none">Saving changes</v-btn>
        </div>
      </div>
    `,
  }),
}

/** Hover, focus, active, and selected cues — tab to focus; selected uses accent keyline. */
export const InteractionStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <p class="text-caption text-medium-emphasis mb-2">Outlined hover / focus (keyboard tab)</p>
          <v-btn variant="outlined" class="text-none">Hover or focus me</v-btn>
        </div>
        <div>
          <p class="text-caption text-medium-emphasis mb-2">Flat primary — dark uses --btn-flat-shadow, not white inset</p>
          <v-btn color="primary" variant="flat" class="text-none">Primary action</v-btn>
        </div>
        <div>
          <p class="text-caption text-medium-emphasis mb-2">Selected list row pattern</p>
          <div
            class="pa-3 d-flex align-center ga-2"
            style="max-width: 320px; background: var(--surface-interactive-selected); border: 2px solid var(--accent-default); border-radius: 8px;"
            aria-selected="true"
          >
            <v-icon size="18">check</v-icon>
            <span>Selected item</span>
          </div>
        </div>
        <div>
          <p class="text-caption text-medium-emphasis mb-2">Error / destructive</p>
          <v-btn color="error" variant="flat" class="text-none">Delete</v-btn>
        </div>
      </div>
    `,
  }),
}
