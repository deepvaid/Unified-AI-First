import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormDrawer from './MpFormDrawer.vue'

const mobile375 = {
  options: {
    mobile375: {
      name: 'Mobile 375',
      styles: { width: '375px', height: '812px' },
      type: 'mobile' as const,
    },
  },
}

const meta = {
  title: 'Overlays/MpFormDrawer',
  component: MpFormDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpFormDrawer\` is the right-side drawer used for every create/edit form (default 480px). It owns
the header (title, subtitle, close button), a scrollable body (default slot), and an optional
pinned footer (\`#footer\` slot) for Cancel/Save actions. It implements dialog semantics itself:
focus moves into the panel on open, Tab is trapped inside, Escape closes, and focus returns to
the trigger on close.

**Use when:** creating or editing an entity from a list/detail page — the platform never uses
\`v-dialog\` for forms.

**Don't use when:** confirming a yes/no decision (\`MpConfirmDialog\`), picking a folder
(\`MpMoveToFolderDialog\`), or building a multi-step wizard (use a dedicated wizard view).

### Usage
\`\`\`html
<v-btn color="primary" @click="drawer = true">New segment</v-btn>
<MpFormDrawer v-model="drawer" title="New segment" subtitle="Define who belongs">
  <v-text-field label="Name" />
  <v-select label="Source list" :items="lists" />
  <template #footer>
    <v-spacer />
    <v-btn variant="text" @click="drawer = false">Cancel</v-btn>
    <v-btn color="primary" @click="save">Save</v-btn>
  </template>
</MpFormDrawer>
\`\`\`

### 🟢 Do's
- **Do** always provide the \`#footer\` slot with Cancel + primary action; the body scrolls, the
  footer stays pinned.
- **Do** keep the default 480px width; widen (e.g. 640) only for two-column forms.
- **Do** open it from an explicit trigger button so focus restoration has somewhere to land.

### 🔴 Don'ts
- **Don't** nest another drawer or dialog inside — one overlay at a time.
- **Don't** put the primary action in the body; it belongs in the pinned footer.

### 💡 Best Practices
- **Long forms:** group fields with subheadings in the body — the body is the only scroll
  container, so the header/footer always stay visible.
- **Width:** \`width\` is a fixed pixel value. It is not responsive — on small viewports the
  default 480 exceeds the screen (see the Mobile375 story).

### A11y
- **Provides:** \`role="dialog"\` + \`aria-modal="true"\` with \`aria-labelledby\` wired to the
  title; focus moves into the panel on open and back to the trigger on close; Tab/Shift+Tab are
  trapped inside the panel; Escape closes; the close icon button has \`aria-label="Close"\`; the
  scrim blocks interaction with the page behind.
- **Consumer must:** label every form field (Vuetify \`label\` props), and keep the trigger
  element mounted while the drawer is open so focus can return to it.
- **Provides (Phase 4):** the focus trap skips elements hidden inside collapsed sections
  (\`offsetParent\` check), so Tab cycles only through visible controls.
- **Gaps:** \`width\` is not clamped to the viewport — at 375px the 480px panel overflows the
  screen edge instead of going full-width (backlog: clamping interacts with the drawer's
  translate-based open/close animation, so it needs its own verified change).
        `,
      },
    },
  },
  args: {
    title: 'Edit widget',
    subtitle: 'Revenue Share (Top 10)',
    width: 440,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility.' },
    title: { control: 'text', description: 'Required header title; also the dialog\'s accessible name (aria-labelledby).' },
    subtitle: { control: 'text', description: 'Optional supporting line under the title.' },
    width: { control: { type: 'number', min: 320, max: 800, step: 40 }, description: 'Panel width in px (default 480). Fixed — not viewport-clamped.' },
    default: { control: false, description: 'Slot — form content. This region is the only scroll container.', table: { category: 'slots' } },
    footer: { control: false, description: 'Slot — pinned action row (Cancel + primary action, right-aligned).', table: { category: 'slots' } },
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)

      watch(
        () => args.title,
        () => {
          open.value = true
        },
      )

      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">Open flyout</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <div style="display:grid;gap:14px;">
            <v-text-field label="Title" model-value="Revenue Share (Top 10)" />
            <v-select label="Chart type" :items="['Bar', 'Line', 'Pie', 'Table', 'KPI']" model-value="Bar" />
            <v-select label="Data source" :items="['Marketing Cloud', 'Commerce Cloud']" model-value="Commerce Cloud" />
            <v-select label="Metric" :items="['Revenue', 'Orders', 'Customers']" model-value="Revenue" />
            <v-select label="Group by" :items="['Product', 'Channel', 'Segment']" model-value="Product" />
            <v-select label="Date range" :items="['Last 7 days', 'Last 30 days', 'Last 90 days']" model-value="Last 30 days" />
            <v-switch label="Compare with previous period" color="primary" inset density="compact" hide-details :model-value="true" />
          </div>
          <template #footer>
            <v-spacer />
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" @click="open = false">Save changes</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
} satisfies Meta<typeof MpFormDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const WidgetEditFlyout: Story = {}

export const DataSourceForm: Story = {
  args: {
    title: 'New data source',
    subtitle: 'Connect a workspace data source',
    width: 460,
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" prepend-icon="database" @click="open = true">Add data source</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <div style="display:grid;gap:14px;">
            <v-text-field label="Name" placeholder="Marketing Cloud - production" />
            <v-select label="Type" :items="['Marketing Cloud', 'Commerce Cloud', 'Service Cloud', 'Snowflake', 'BigQuery']" model-value="Marketing Cloud" />
            <v-text-field label="Endpoint" placeholder="https://..." />
            <v-text-field label="API key" type="password" placeholder="sk-..." />
            <v-alert type="info" variant="tonal" density="compact">
              Da Vinci can only read metadata until the connection is approved.
            </v-alert>
          </div>
          <template #footer>
            <v-spacer />
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" @click="open = false">Connect</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}

/**
 * A long grouped form: the body is the only scroll container, so the header and the pinned
 * footer stay visible while the fields scroll.
 */
export const LongScrollingContent: Story = {
  args: {
    title: 'Edit product',
    subtitle: 'SV-2200 Commuter Scooter',
    width: 480,
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)
      const sections = [
        'General', 'Pricing', 'Inventory', 'Shipping', 'SEO', 'Attributes',
      ]
      return { args, open, sections }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">Edit product</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <div v-for="section in sections" :key="section" class="mb-6">
            <div class="text-subtitle-2 font-weight-bold mb-3">{{ section }}</div>
            <div style="display:grid;gap:14px;">
              <v-text-field :label="section + ' field A'" />
              <v-text-field :label="section + ' field B'" />
              <v-select :label="section + ' option'" :items="['One', 'Two', 'Three']" />
            </div>
          </div>
          <template #footer>
            <v-spacer />
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" @click="open = false">Save changes</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}

/** A wider 640px panel for a two-column form — the only sanctioned reason to override `width`. */
export const CustomWidth640: Story = {
  args: {
    title: 'Edit shipping rules',
    subtitle: 'Zone matrix with per-carrier overrides',
    width: 640,
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">Edit shipping rules</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <v-row dense>
            <v-col cols="6"><v-text-field label="Zone name" model-value="Domestic" /></v-col>
            <v-col cols="6"><v-select label="Carrier" :items="['Auspost', 'DHL', 'FedEx']" model-value="Auspost" /></v-col>
            <v-col cols="6"><v-text-field label="Base rate" prefix="$" model-value="9.95" /></v-col>
            <v-col cols="6"><v-text-field label="Per kg" prefix="$" model-value="1.20" /></v-col>
            <v-col cols="6"><v-text-field label="Free over" prefix="$" model-value="150.00" /></v-col>
            <v-col cols="6"><v-select label="Fallback zone" :items="['None', 'International']" model-value="None" /></v-col>
          </v-row>
          <template #footer>
            <v-spacer />
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" @click="open = false">Save rules</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}

/**
 * The drawer at a 375px viewport (canvas only — the docs page doesn't resize). The default
 * 480px width exceeds the screen, so the panel covers the full viewport and clips at the left
 * edge — the width-clamping gap flagged in the A11y notes.
 */
export const Mobile375: Story = {
  args: {
    title: 'New segment',
    subtitle: 'Define who belongs',
    width: 480,
  },
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
  parameters: {
    viewport: mobile375,
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:16px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">New segment</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <div style="display:grid;gap:14px;">
            <v-text-field label="Name" placeholder="VIP repeat buyers" />
            <v-select label="Source list" :items="['Newsletter', 'VIP Circle', 'Win-Back']" model-value="Newsletter" />
            <v-select label="Match" :items="['All conditions', 'Any condition']" model-value="All conditions" />
            <v-text-field label="Min. lifetime spend" prefix="$" model-value="500" />
          </div>
          <template #footer>
            <v-spacer />
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" @click="open = false">Save</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}
