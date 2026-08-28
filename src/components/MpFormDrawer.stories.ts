import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormDrawer from './MpFormDrawer.vue'
import MpFormGrid from './MpFormGrid.vue'
import MpFormSection from './MpFormSection.vue'
import MpFormField from './MpFormField.vue'
import MpStatusChip from './MpStatusChip.vue'

const meta = {
  title: 'Molecules/MpFormDrawer',
  component: MpFormDrawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpFormDrawer\` is the right-side drawer used for every create/edit form (\`size="md"\`, 480px, by default). It's a
floating rounded shell: \`--mp-component-dialog-radius\` (16px) on all corners, a 1px
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
- **Do** keep the default \`size="md"\` (480); reach for \`lg\` (640) only when the form is
  genuinely two-column.
- **Do** open it from an explicit trigger button so focus restoration has somewhere to land.

### 🔴 Don'ts
- **Don't** nest another drawer or dialog inside — one overlay at a time.
- **Don't** put the primary action in the body; it belongs in the pinned footer.

### 💡 Best Practices
- **Long forms:** group fields with subheadings in the body — the body is the only scroll
  container, so the header/footer always stay visible.
- **Width:** \`size\` picks from a three-stop ramp (\`component.drawer.width.*\`); there is no
  free-form width, because eight of them is how the drawers drifted apart in the first place. On
  mobile it clamps automatically — see Mobile behavior below.

### 📱 Mobile behavior
- **≤640px** (\`layout.breakpointCompact\`): the panel becomes a full-bleed sheet —
  the width is clamped to \`100vw\` whatever the \`size\`, and the 12px gutters/rounded corners
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
- **Footer:** \`Clear all\` goes in \`#footerStart\` and \`Done\` in \`#footer\`. The shell holds them
  at opposite ends itself — the hand-rolled \`<div class="d-flex align-center w-100">\` wrapper this
  pattern used to need was one of five copies of the shell's own footer layout (P6-5).

### A11y
- **Provides:** \`role="dialog"\` + \`aria-modal="true"\` with \`aria-labelledby\` wired to the
  title; focus moves into the panel on open and back to the trigger on close; Tab/Shift+Tab are
  trapped inside the panel; Escape closes; the close icon button has \`aria-label="Close"\`; the
  scrim blocks interaction with the page behind.
- **Consumer must:** label every form field (Vuetify \`label\` props), and keep the trigger
  element mounted while the drawer is open so focus can return to it.
- **Provides (Phase 4):** the focus trap skips elements hidden inside collapsed sections
  (\`offsetParent\` check), so Tab cycles only through visible controls.
- **Provides (mobile):** the panel is clamped to the viewport at ≤640px and goes full-bleed
  instead of overflowing the screen edge (see \`Mobile375\`).
        `,
      },
    },
  },
  args: {
    title: 'Edit widget',
    subtitle: 'Revenue Share (Top 10)',
  },
  argTypes: {
    guarded: { control: 'boolean', description: 'Routes Esc, the X and the scrim through the `close` emit instead of closing directly, so the host can confirm before discarding unsaved work. Off by default \u2014 turn it on for any drawer with a form in it.' },
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility.' },
    title: { control: 'text', description: 'Required header title; also the dialog\'s accessible name (aria-labelledby).' },
    subtitle: { control: 'text', description: 'Optional supporting line under the title.' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'Width ramp — sm 440 · md 480 · lg 640 (`component.drawer.width.*`). Replaces the free-form `width` number, which had grown to eight values between 420 and 680. Clamped to 100vw full-bleed at ≤640px viewports.',
    },
    default: { control: false, description: 'Slot — form content. This region is the only scroll container.', table: { category: 'slots' } },
    footer: { control: false, description: 'Slot — pinned action row, right-aligned on `component.dialog.footerGap`, secondary then primary.', table: { category: 'slots' } },
    footerStart: { control: false, description: 'Slot — left-aligned footer zone (a "Back" step, a "Clear all"), held away from the primary pair by the shell.', table: { category: 'slots' } },
    close: { control: false, description: 'Event — emitted instead of closing when `guarded` is set.', table: { category: 'events' } },
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
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
          <MpFormGrid>
            <v-text-field label="Title" model-value="Revenue Share (Top 10)" />
            <v-select label="Chart type" :items="['Bar', 'Line', 'Pie', 'Table', 'KPI']" model-value="Bar" />
            <v-select label="Data source" :items="['Marketing Cloud', 'Commerce Cloud']" model-value="Commerce Cloud" />
            <v-select label="Metric" :items="['Revenue', 'Orders', 'Customers']" model-value="Revenue" />
            <v-select label="Group by" :items="['Product', 'Channel', 'Segment']" model-value="Product" />
            <v-select label="Date range" :items="['Last 7 days', 'Last 30 days', 'Last 90 days']" model-value="Last 30 days" />
            <v-switch label="Compare with previous period" color="primary" inset density="compact" hide-details :model-value="true" />
          </MpFormGrid>
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
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" prepend-icon="database" @click="open = true">Add data source</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
            <v-text-field label="Name" placeholder="Marketing Cloud - production" />
            <v-select label="Type" :items="['Marketing Cloud', 'Commerce Cloud', 'Service Cloud', 'Snowflake', 'BigQuery']" model-value="Marketing Cloud" />
            <v-text-field label="Endpoint" placeholder="https://..." />
            <v-text-field label="API key" type="password" placeholder="sk-..." />
            <v-alert type="info" variant="tonal" density="compact">
              Da Vinci can only read metadata until the connection is approved.
            </v-alert>
          </MpFormGrid>
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
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
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
          <template v-for="section in sections" :key="section">
            <MpFormSection :title="section" />
            <MpFormGrid>
              <v-text-field :label="section + ' field A'" />
              <v-text-field :label="section + ' field B'" />
              <v-select :label="section + ' option'" :items="['One', 'Two', 'Three']" />
            </MpFormGrid>
          </template>
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

/** `size="lg"` (640) — the wide stop, for a form that is genuinely two-column. */
export const CustomWidth640: Story = {
  args: {
    title: 'Edit shipping rules',
    subtitle: 'Zone matrix with per-carrier overrides',
    size: 'lg',
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
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
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
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
          <MpFormGrid>
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
          </MpFormGrid>
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
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" prepend-icon="database" @click="open = true">Add data source</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
            <v-text-field label="Name" model-value="Marketing Cloud - production" disabled />
            <v-select label="Type" :items="['Marketing Cloud', 'Commerce Cloud', 'Service Cloud']" model-value="Marketing Cloud" disabled />
            <v-text-field label="Endpoint" model-value="https://mc-prod.maropost.io" disabled />
          </MpFormGrid>
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
 * reads as "All" rather than an empty field, and \`Clear all\` held at the far left by
 * \`#footerStart\` against \`Done\` at the right. The wrapper div this used to need is gone — the
 * shell does that itself now.
 */
export const FilterDrawer: Story = {
  args: {
    title: 'Filters',
    subtitle: 'Changes apply immediately',
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="filter" @click="open = true">Filters</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
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
          </MpFormGrid>
          <template #footerStart>
            <v-btn variant="text" @click="open = false">Clear all</v-btn>
          </template>
          <template #footer>
            <v-btn variant="flat" color="primary" @click="open = false">Done</v-btn>
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
  },
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:16px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">New segment</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
            <v-text-field label="Name" placeholder="VIP repeat buyers" />
            <v-select label="Source list" :items="['Newsletter', 'VIP Circle', 'Win-Back']" model-value="Newsletter" />
            <v-select label="Match" :items="['All conditions', 'Any condition']" model-value="All conditions" />
            <v-text-field label="Min. lifetime spend" prefix="$" model-value="500" />
          </MpFormGrid>
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

// ── Template: Variants · Sizes · States ──────────────────────────────────────

/**
 * Two structures: with and without a `#footer`. Omitting the footer drops the divider and the
 * band entirely, so a read-only or auto-saving panel does not carry a dead action bar.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    data: () => ({ which: 'footer' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'footer'">With footer</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'nofooter'">No footer</v-btn>

        <MpFormDrawer :model-value="which === 'footer'" title="New segment" subtitle="Contacts matching these rules" @update:model-value="which = ''">
          <v-text-field label="Segment name" variant="outlined" density="comfortable" hide-details />
          <v-select label="Match" :items="['All rules','Any rule']" variant="outlined" density="comfortable" hide-details />
          <template #footer>
            <v-btn variant="text" class="text-none" @click="which = ''">Cancel</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" @click="which = ''">Create segment</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'nofooter'" title="Contact details" subtitle="Read only" @update:model-value="which = ''">
          <div><div class="text-caption text-medium-emphasis">Email</div><div>james.anderson@example.com</div></div>
          <div><div class="text-caption text-medium-emphasis">Lifetime value</div><div>$4,180.00</div></div>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The width ramp — `component.drawer.width.*`, the same `sm | md | lg` vocabulary every other
 * sized component uses. It replaced a free-form `width` number that had reached eight distinct
 * values between 420 and 680; `md` is the default and is what every previously-unset drawer
 * rendered at. Below `layout.breakpointCompact` the drawer goes full-bleed and drops its gutters,
 * radius and border whatever the size — see `Mobile375`.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    data: () => ({ which: '' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'sm'">sm — 440</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'md'">md — 480</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'lg'">lg — 640</v-btn>

        <MpFormDrawer :model-value="which === 'sm'" size="sm" title="sm — 440px" subtitle="A single-column form with a few fields" @update:model-value="which = ''">
          <MpFormGrid>
            <v-text-field label="Tag name" />
            <v-select label="Colour" :items="['Grey', 'Blue', 'Green']" model-value="Blue" />
          </MpFormGrid>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'md'" title="md — 480px" subtitle="The default" @update:model-value="which = ''">
          <MpFormGrid>
            <v-text-field label="Segment name" />
            <v-select label="Match" :items="['All rules', 'Any rule']" model-value="All rules" />
          </MpFormGrid>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'lg'" size="lg" title="lg — 640px" subtitle="For genuinely two-column forms" @update:model-value="which = ''">
          <MpFormGrid :cols="2">
            <v-text-field label="First name" />
            <v-text-field label="Last name" />
            <v-text-field label="Email" type="email" class="mp-form-grid__full" />
          </MpFormGrid>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Resting, validating, submitting, and a body long enough to scroll — header and footer stay
 * pinned while only the body moves. `guarded` routes Esc/X/scrim through the `close` emit so a
 * host can confirm before discarding unsaved work.
 */
export const States: Story = {
  render: () => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    data: () => ({ which: '' as string, rows: Array.from({ length: 14 }, (_, i) => i + 1) }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" class="text-none" @click="which = 'rest'">Resting</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'error'">Validation error</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'busy'">Submitting</v-btn>
        <v-btn variant="outlined" class="text-none" @click="which = 'scroll'">Scrolling body</v-btn>

        <MpFormDrawer :model-value="which === 'rest'" title="New segment" @update:model-value="which = ''">
          <v-text-field label="Segment name" variant="outlined" density="comfortable" hide-details />
          <template #footer><v-btn color="primary" variant="flat" class="text-none" @click="which = ''">Create</v-btn></template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'error'" title="New segment" @update:model-value="which = ''">
          <v-text-field label="Segment name" variant="outlined" density="comfortable" :error-messages="['A segment with this name already exists.']" />
          <v-select label="Match" :items="['All rules','Any rule']" variant="outlined" density="comfortable" :error-messages="['Choose how rules combine.']" />
          <template #footer>
            <v-btn variant="text" class="text-none" @click="which = ''">Cancel</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" disabled>Create segment</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'busy'" title="New segment" @update:model-value="which = ''">
          <v-text-field label="Segment name" model-value="VIP — Repeat Buyers" variant="outlined" density="comfortable" hide-details disabled />
          <template #footer>
            <v-btn variant="text" class="text-none" disabled>Cancel</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" loading>Creating…</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'scroll'" title="Filter orders" subtitle="Changes apply immediately" @update:model-value="which = ''">
          <v-text-field v-for="n in rows" :key="n" :label="'Field ' + n" variant="outlined" density="comfortable" hide-details />
          <template #footer>
            <v-btn variant="text" class="text-none" @click="which = ''">Clear all</v-btn>
            <v-spacer />
            <v-btn color="primary" variant="flat" class="text-none" @click="which = ''">Done</v-btn>
          </template>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * **Two columns with a trailing-action row.** Watch the right edge. The two-column rows, the
 * full-width rows and the denomination rows with a delete button all begin on the same left edge
 * and finish on the same right edge, because the delete button sits in its own fixed
 * `component.control.height` track rather than eating into the input's width.
 *
 * The composite control (`MpFormField` + `v-chip-group`) and the plain floating-label fields share
 * a baseline in the same row — the case that used to leave neighbouring controls misaligned
 * because one had a floating label and the other did not.
 */
export const TwoColumnWithTrailingRow: Story = {
  args: {
    title: 'Purchasable gift card',
    subtitle: 'Denominations and delivery',
    size: 'lg',
  },
  render: (args) => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField },
    setup() {
      const open = ref(true)
      const denominations = ref([
        { id: 1, label: 'Small', amount: 25 },
        { id: 2, label: 'Medium', amount: 50 },
        { id: 3, label: 'Large', amount: 100 },
      ])
      return { args, open, denominations }
    },
    template: `
      <section style="min-height:720px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">Open gift card form</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormSection title="General" />
          <MpFormGrid :cols="2">
            <v-text-field label="Product name *" model-value="Northwind gift card" class="mp-form-grid__full" />
            <v-text-field label="SKU" model-value="GC-NW-001" />
            <v-select label="Status" :items="['Active', 'Draft', 'Archived']" model-value="Active" />
            <MpFormField label="Delivery" hint="How the recipient receives the card." class="mp-form-grid__full">
              <template #default="{ labelId, descriptionId }">
                <v-chip-group :model-value="0" :aria-labelledby="labelId" :aria-describedby="descriptionId">
                  <v-chip filter>Email</v-chip>
                  <v-chip filter>Print at home</v-chip>
                  <v-chip filter>Physical card</v-chip>
                </v-chip-group>
              </template>
            </MpFormField>
          </MpFormGrid>

          <MpFormSection title="Denominations" description="At least one amount is required." required />
          <MpFormGrid :cols="2">
            <div v-for="d in denominations" :key="d.id" class="mp-form-grid__trailing">
              <MpFormGrid :cols="2">
                <v-text-field label="Label" :model-value="d.label" />
                <v-text-field label="Amount" :model-value="d.amount" type="number" prepend-inner-icon="dollar-sign" />
              </MpFormGrid>
              <v-btn icon="trash-2" variant="text" size="small" density="comfortable" :aria-label="'Remove ' + d.label" />
            </div>
            <v-btn variant="text" class="text-none mp-form-grid__full align-self-start" prepend-icon="plus">Add denomination</v-btn>
          </MpFormGrid>

          <template #footer>
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="open = false">Save gift card</v-btn>
          </template>
        </MpFormDrawer>
      </section>
    `,
  }),
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** A real create-segment form. Nothing in this body sets a margin or a
 * `mb-*` utility: since Phase 4 the drawer's body is a flex column on
 * `component.dialog.gap`, the same rhythm `MpDialog` uses, so a drawer form and a modal form
 * are spaced identically. That closes the Phase 3 follow-up "drawer and dialog form bodies
 * still space their fields ad hoc".
 */
export const InContextCreateSegment: Story = {
  render: () => ({
    components: { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField, MpStatusChip },
    data: () => ({
      open: true,
      name: 'VIP — Repeat Buyers',
      match: 'All rules',
      rules: [
        { field: 'Lifetime value', op: 'is greater than', value: '$1,000' },
        { field: 'Orders', op: 'is at least', value: '3' },
      ],
    }),
    template: `
      <div>
        <v-btn variant="flat" color="primary" class="text-none" prepend-icon="plus" @click="open = true">New segment</v-btn>
        <MpFormDrawer v-model="open" title="New segment" subtitle="Contacts matching these rules, refreshed hourly">
          <v-text-field v-model="name" label="Segment name" variant="outlined" density="comfortable" hide-details />

          <v-select v-model="match" label="Contacts must match" :items="['All rules','Any rule']" variant="outlined" density="comfortable" hide-details />

          <div>
            <div class="text-caption text-medium-emphasis mb-2">Rules</div>
            <div class="d-flex flex-column ga-2">
              <v-card v-for="(r, i) in rules" :key="i" flat border rounded="lg" class="pa-3 d-flex align-center ga-2">
                <span class="text-body-2 font-weight-medium">{{ r.field }}</span>
                <span class="text-body-2 text-medium-emphasis">{{ r.op }}</span>
                <span class="text-body-2 font-weight-medium">{{ r.value }}</span>
                <v-spacer />
                <v-btn icon="x" variant="text" size="x-small" aria-label="Remove rule" />
              </v-card>
            </div>
            <v-btn variant="text" size="small" class="text-none mt-2" prepend-icon="plus">Add rule</v-btn>
          </div>

          <v-alert type="info" variant="tonal" density="compact" class="text-body-2">
            <span class="d-inline-flex align-center ga-2">
              About <strong>1,284</strong> contacts match right now
              <MpStatusChip status="Active" type="contact" size="sm" />
            </span>
          </v-alert>

          <template #footer>
            <v-btn variant="text" class="text-none" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" @click="open = false">Create segment</v-btn>
          </template>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}
