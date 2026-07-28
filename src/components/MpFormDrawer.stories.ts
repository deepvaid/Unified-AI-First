import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormDrawer from './MpFormDrawer.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

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
\`MpFormDrawer\` is the right-side drawer used for every create/edit form (default 480px). It's a
floating rounded shell: \`--mp-component-dialog-radius-default\` (16px) on all corners, a 1px
\`--mp-border-subtle\` border, and a soft \`--mp-shadow-md\`, inset 12px from the top/right/bottom
viewport edges (\`height: auto\` overrides Vuetify's inline top/bottom positioning). Content is
clipped to the radius, so scrolled body content never squares off the corners. It owns the header
(title, subtitle, close button), a scrollable body (default slot), and an optional pinned footer
(\`#footer\` slot) for Cancel/Save actions. It implements dialog semantics itself: focus moves into
the panel on open, Tab is trapped inside, Escape closes, and focus returns to the trigger on close.

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
- **Width:** \`width\` is a fixed pixel value on larger viewports; widen only for two-column forms
  (see \`CustomWidth640\`). On mobile it clamps automatically — see Mobile behavior below.

### 📱 Mobile behavior
- **≤640px:** a \`@media (max-width: 640px)\` breakpoint switches the panel to a full-bleed sheet —
  \`width\` is clamped to \`100vw\` regardless of the prop value, and the 12px gutters/rounded corners
  drop out so the panel fills the viewport edge-to-edge. This replaces the old fixed-width
  behavior where a 480px panel would overflow a 375px screen (see \`Mobile375\`).

### Filter drawers
The Filters drawer pattern (\`MpDataTableToolbar\`'s filter panel, see \`FilterDrawer\`) is a
short-body variant of this component with two conventions:
- **Subtitle:** default to "Changes apply immediately" so users know filters aren't staged.
- **Selects:** every filter \`v-select\` is \`outlined\`, with \`placeholder="All"\` and
  \`persistent-placeholder\` — this keeps the placeholder visible even when a value is cleared, so
  a null filter reads as "All" rather than looking like an empty/broken field. Pair with
  \`clearable\` and \`hide-details\`.
- **Footer:** \`<div class="d-flex align-center w-100">\` containing \`Clear all\` (\`variant="text"\`),
  a \`v-spacer\`, and \`Done\` (\`variant="flat" color="primary"\`) — full width so the two actions sit
  at opposite ends of the footer instead of both right-aligned.

### A11y
- **Provides:** \`role="dialog"\` + \`aria-modal="true"\` with \`aria-labelledby\` wired to the
  title; focus moves into the panel on open and back to the trigger on close; Tab/Shift+Tab are
  trapped inside the panel; Escape closes; the close icon button has \`aria-label="Close"\`; the
  scrim blocks interaction with the page behind.
- **Consumer must:** label every form field (Vuetify \`label\` props), and keep the trigger
  element mounted while the drawer is open so focus can return to it.
- **Provides (Phase 4):** the focus trap skips elements hidden inside collapsed sections
  (\`offsetParent\` check), so Tab cycles only through visible controls.
- **Provides (mobile):** \`width\` is now clamped to the viewport at ≤640px — the panel goes
  full-bleed instead of overflowing the screen edge (previously a gap at 375px; see \`Mobile375\`).
        `,
      },
    },
  },
  args: {
    title: 'Edit widget',
    subtitle: 'Revenue Share (Top 10)',
    width: 480,
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility.' },
    title: { control: 'text', description: 'Required header title; also the dialog\'s accessible name (aria-labelledby).' },
    subtitle: { control: 'text', description: 'Optional supporting line under the title.' },
    width: { control: { type: 'number', min: 320, max: 800, step: 40 }, description: 'Panel width in px (default 480). Clamped to 100vw full-bleed at ≤640px viewports.' },
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

/** L4 drawer + overlay form fields in dark mode. */
export const DarkModeWidgetEdit: Story = {
  globals: darkModeGlobals,
  ...WidgetEditFlyout,
}

export const DataSourceForm: Story = {
  args: {
    title: 'New data source',
    subtitle: 'Connect a workspace data source',
    width: 480,
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
 * Field-level validation errors visible on submit attempt: invalid fields get `error` + an
 * `error-messages` string, plus a summary alert at the top of the body. The footer stays
 * enabled so the user can retry immediately.
 */
export const ValidationErrors: Story = {
  args: {
    title: 'New segment',
    subtitle: 'Define who belongs',
    width: 480,
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">New segment</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <v-alert type="error" variant="tonal" density="compact" class="mb-4">
            2 fields need attention before this segment can be saved.
          </v-alert>
          <div style="display:grid;gap:14px;">
            <v-text-field
              label="Name"
              model-value=""
              error
              error-messages="Name is required"
            />
            <v-select label="Source list" :items="['Newsletter', 'VIP Circle', 'Win-Back']" model-value="Newsletter" />
            <v-text-field
              label="Min. lifetime spend"
              prefix="$"
              model-value="-50"
              error
              error-messages="Must be zero or greater"
            />
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

/**
 * Submitting state: the primary action shows a spinner via \`loading\`, both footer buttons are
 * disabled, and the body fields are disabled so no further edits land mid-submit.
 */
export const Submitting: Story = {
  args: {
    title: 'New data source',
    subtitle: 'Connect a workspace data source',
    width: 480,
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
            <v-text-field label="Name" model-value="Marketing Cloud - production" disabled />
            <v-select label="Type" :items="['Marketing Cloud', 'Commerce Cloud', 'Service Cloud']" model-value="Marketing Cloud" disabled />
            <v-text-field label="Endpoint" model-value="https://mc-prod.maropost.io" disabled />
          </div>
          <template #footer>
            <v-spacer />
            <v-btn variant="text" disabled @click="open = false">Cancel</v-btn>
            <v-btn color="primary" loading disabled>Connecting…</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}

/**
 * The Filters drawer pattern used above data tables (\`MpDataTableToolbar\`): a short body of
 * outlined selects with \`placeholder="All"\` + \`persistent-placeholder\` so a cleared filter still
 * reads as "All" rather than an empty field, and a full-width footer with \`Clear all\` on the
 * left and \`Done\` on the right.
 */
export const FilterDrawer: Story = {
  args: {
    title: 'Filters',
    subtitle: 'Changes apply immediately',
    width: 480,
  },
  render: (args) => ({
    components: { MpFormDrawer },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="filter" @click="open = true">Filters</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <div style="display:grid;gap:14px;">
            <v-select
              label="Order status"
              :items="['Open', 'Pending', 'Completed', 'Cancelled']"
              placeholder="All"
              persistent-placeholder
              clearable
              hide-details
              variant="outlined"
              :model-value="null"
            />
            <v-select
              label="Fulfillment"
              :items="['Unfulfilled', 'Partial', 'Fulfilled']"
              placeholder="All"
              persistent-placeholder
              clearable
              hide-details
              variant="outlined"
              :model-value="null"
            />
            <v-select
              label="Payment status"
              :items="['Paid', 'Pending', 'Refunded']"
              placeholder="All"
              persistent-placeholder
              clearable
              hide-details
              variant="outlined"
              :model-value="null"
            />
          </div>
          <template #footer>
            <div class="d-flex align-center w-100">
              <v-btn variant="text" @click="open = false">Clear all</v-btn>
              <v-spacer />
              <v-btn variant="flat" color="primary" @click="open = false">Done</v-btn>
            </div>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}

/**
 * The drawer at a 375px viewport (canvas only — the docs page doesn't resize). The
 * \`@media (max-width: 640px)\` breakpoint clamps the panel to a full-bleed \`100vw\` sheet — the
 * 12px gutters and rounded corners drop out so the panel fills the viewport edge-to-edge instead
 * of the 480px panel overflowing the screen, as it used to before the clamp was added.
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
