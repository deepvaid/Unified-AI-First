import { ref, watch } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormDrawer from './MpFormDrawer.vue'
import MpFormGrid from './MpFormGrid.vue'
import MpFormSection from './MpFormSection.vue'
import MpFormField from './MpFormField.vue'
import MpStatusChip from './MpStatusChip.vue'
import MpAlert from './MpAlert.vue'
import { liquidskyDocs } from '@/stories/storyTemplate'
import { overlayDocs } from '@/stories/decorators'

const meta = {
  title: 'Molecules/MpFormDrawer',
  component: MpFormDrawer,
  tags: ['autodocs', 'liquidsky'],
  parameters: {
    docs: {
      description: {
        component: liquidskyDocs('molecules-mpformdrawer') + `
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
    <v-btn variant="text" @click="drawer = false">Cancel</v-btn>
    <v-btn color="primary" variant="flat" @click="save">Save</v-btn>
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
- **Selects:** every filter \`v-select\` has \`placeholder="All"\` and \`clearable\`, so a cleared
  filter reads as "All" rather than looking like an empty or broken field. The outlined look and
  the always-visible placeholder are theme defaults — don't restate them on the tag.
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
    modelValue: true,
    title: 'Edit widget',
    subtitle: 'Revenue Share (Top 10)',
  },
  argTypes: {
    guarded: { control: 'boolean', description: 'Routes Esc, the X and the scrim through the `close` emit instead of closing directly, so the host can confirm before discarding unsaved work. Off by default — turn it on for any drawer with a form in it.' },
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
} satisfies Meta<typeof MpFormDrawer>

export default meta
type Story = StoryObj<typeof meta>

const components = { MpFormDrawer, MpFormGrid, MpFormSection, MpFormField, MpAlert, MpStatusChip }

/**
 * Open state that starts from the `modelValue` control and follows it, so a drawer can be closed
 * and reopened from the Controls panel as well as from its trigger button.
 */
function useOpen(args: { modelValue?: boolean }) {
  const open = ref(args.modelValue ?? false)
  watch(() => args.modelValue, (value) => { open.value = value ?? false })
  return open
}

/**
 * Bound to the Controls panel on the Canvas tab (the docs page frames it, and the Controls table there cannot drive a frame). Stories that show a drawer open on load carry `overlayDocs()`,
 * which gives each its own frame on the docs page; the grids below start closed behind buttons.
 */
export const Default: Story = {
  parameters: overlayDocs(),
  render: (args) => ({
    components,
    setup: () => ({ args, open: useOpen(args) }),
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">Edit widget</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
            <v-text-field label="Title" model-value="Revenue Share (Top 10)" />
            <v-select label="Chart type" :items="['Bar', 'Line', 'Pie', 'Table', 'KPI']" model-value="Bar" />
            <v-select label="Data source" :items="['Marketing Cloud', 'Commerce Cloud']" model-value="Commerce Cloud" />
            <v-select label="Metric" :items="['Revenue', 'Orders', 'Customers']" model-value="Revenue" />
            <v-select label="Group by" :items="['Product', 'Channel', 'Segment']" model-value="Product" />
            <v-select label="Date range" :items="['Last 7 days', 'Last 30 days', 'Last 90 days']" model-value="Last 30 days" />
            <v-switch label="Compare with previous period" inset :model-value="true" />
          </MpFormGrid>
          <template #footer>
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="open = false">Save changes</v-btn>
          </template>
        </MpFormDrawer>
      </div>
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
    components,
    data: () => ({ which: '' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'footer'">With footer</v-btn>
        <v-btn variant="outlined" @click="which = 'nofooter'">No footer</v-btn>

        <MpFormDrawer :model-value="which === 'footer'" title="New segment" subtitle="Contacts matching these rules" @update:model-value="which = ''">
          <v-text-field label="Segment name" />
          <v-select label="Match" :items="['All rules', 'Any rule']" />
          <template #footer>
            <v-btn variant="text" @click="which = ''">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="which = ''">Create segment</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'nofooter'" title="Contact details" subtitle="Read only" @update:model-value="which = ''">
          <dl class="mp-label-value">
            <div><dt>Email</dt><dd>james.anderson@example.com</dd></div>
            <div><dt>Lifetime value</dt><dd>$4,180.00</dd></div>
          </dl>
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
 * rendered at. `lg` is for a form that is genuinely two-column (`MpFormGrid :cols="2"`). Below
 * `layout.breakpointCompact` the drawer goes full-bleed and drops its gutters, radius and border
 * whatever the size — see `Mobile375`.
 */
export const Sizes: Story = {
  render: () => ({
    components,
    data: () => ({ which: '' as string }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'sm'">sm — 440</v-btn>
        <v-btn variant="outlined" @click="which = 'md'">md — 480</v-btn>
        <v-btn variant="outlined" @click="which = 'lg'">lg — 640</v-btn>

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
            <v-text-field label="Zone name" model-value="Domestic" />
            <v-select label="Carrier" :items="['Auspost', 'DHL', 'FedEx']" model-value="Auspost" />
            <v-text-field label="Base rate" prefix="$" model-value="9.95" />
            <v-text-field label="Per kg" prefix="$" model-value="1.20" />
            <v-select label="Fallback zone" class="mp-form-grid__full" :items="['None', 'International']" model-value="None" />
          </MpFormGrid>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Resting, validation errors (a summary `MpAlert` above the fields, each invalid field with its
 * own `error-messages`), submitting (fields and Cancel disabled, the primary action `loading`),
 * a body long enough to scroll (header and footer stay pinned and cast an edge shadow), and
 * `guarded`, which routes Esc, the X and the scrim through the `close` emit so a host can
 * confirm before discarding unsaved work.
 */
export const States: Story = {
  render: () => ({
    components,
    data: () => ({ which: '' as string, guardNote: '', rows: Array.from({ length: 14 }, (_, i) => i + 1) }),
    template: `
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" @click="which = 'rest'">Resting</v-btn>
        <v-btn variant="outlined" @click="which = 'error'">Validation errors</v-btn>
        <v-btn variant="outlined" @click="which = 'busy'">Submitting</v-btn>
        <v-btn variant="outlined" @click="which = 'scroll'">Scrolling body</v-btn>
        <v-btn variant="outlined" @click="which = 'guarded'">Guarded</v-btn>

        <MpFormDrawer :model-value="which === 'rest'" title="New segment" @update:model-value="which = ''">
          <v-text-field label="Segment name" />
          <template #footer>
            <v-btn color="primary" variant="flat" @click="which = ''">Create</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'error'" title="New segment" subtitle="Define who belongs" @update:model-value="which = ''">
          <MpAlert tone="error">2 fields need attention before this segment can be saved.</MpAlert>
          <MpFormGrid>
            <v-text-field label="Segment name *" model-value="" error-messages="A segment name is required." />
            <v-select label="Source list" :items="['Newsletter', 'VIP Circle', 'Win-Back']" model-value="Newsletter" />
            <v-text-field label="Min. lifetime spend" prefix="$" model-value="-50" error-messages="Must be zero or greater." />
          </MpFormGrid>
          <template #footer>
            <v-btn variant="text" @click="which = ''">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="which = ''">Create segment</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'busy'" title="New data source" subtitle="Connect a workspace data source" @update:model-value="which = ''">
          <MpFormGrid>
            <v-text-field label="Name" model-value="Marketing Cloud - production" disabled />
            <v-select label="Type" :items="['Marketing Cloud', 'Commerce Cloud', 'Service Cloud']" model-value="Marketing Cloud" disabled />
            <v-text-field label="Endpoint" model-value="https://mc-prod.maropost.io" disabled />
          </MpFormGrid>
          <template #footer>
            <v-btn variant="text" disabled>Cancel</v-btn>
            <v-btn color="primary" variant="flat" loading>Connecting…</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer :model-value="which === 'scroll'" title="Edit product" subtitle="SV-2200 Commuter Scooter" @update:model-value="which = ''">
          <v-text-field v-for="n in rows" :key="n" :label="'Field ' + n" />
          <template #footer>
            <v-btn variant="text" @click="which = ''">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="which = ''">Save changes</v-btn>
          </template>
        </MpFormDrawer>

        <MpFormDrawer
          :model-value="which === 'guarded'"
          guarded
          title="Edit segment"
          subtitle="You have unsaved changes"
          @close="guardNote = 'close was emitted: the host decides what happens next'"
        >
          <p class="ma-0">Press Esc, the close button or the scrim: the drawer emits <code>close</code> and stays open.</p>
          <p v-if="guardNote" class="ma-0 text-medium-emphasis">{{ guardNote }}</p>
          <template #footer>
            <v-btn variant="text" @click="which = ''; guardNote = ''">Discard</v-btn>
            <v-btn color="primary" variant="flat" @click="which = ''; guardNote = ''">Save</v-btn>
          </template>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Scenarios ───────────────────────────────────────────────────────────────

/**
 * The Filters drawer pattern used above data tables (`MpDataTableToolbar`): a short body of
 * selects with `placeholder="All"` and `clearable`, so a cleared filter still reads as "All"
 * rather than an empty field, and `Clear all` held at the far left by `#footerStart` against
 * `Done` at the right.
 */
export const FilterDrawer: Story = {
  args: {
    title: 'Filters',
    subtitle: 'Changes apply immediately',
  },
  parameters: overlayDocs(),
  render: (args) => ({
    components,
    setup: () => ({ args, open: useOpen(args) }),
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="filter" @click="open = true">Filters</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
            <v-select
              label="Order status"
              :items="['Open', 'Pending', 'Completed', 'Cancelled']"
              placeholder="All"
              clearable
              :model-value="null"
            />
            <v-select
              label="Fulfillment"
              :items="['Unfulfilled', 'Partial', 'Fulfilled']"
              placeholder="All"
              clearable
              :model-value="null"
            />
            <v-select
              label="Payment status"
              :items="['Paid', 'Pending', 'Refunded']"
              placeholder="All"
              clearable
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
      </div>
    `,
  }),
}

/**
 * **Two columns with a trailing-action row.** Watch the right edge. The two-column rows, the
 * full-width rows and the denomination rows with a delete button all begin on the same left edge
 * and finish on the same right edge, because the delete button sits in its own fixed
 * `component.control.height` track rather than eating into the input's width.
 *
 * The composite control (`MpFormField` + `v-chip-group`) and the plain labelled fields share
 * a baseline in the same row — both render the identical static top label, the case that used
 * to leave neighbouring controls misaligned when one had a floating label and the other did not.
 */
export const TwoColumnWithTrailingRow: Story = {
  args: {
    title: 'Purchasable gift card',
    subtitle: 'Denominations and delivery',
    size: 'lg',
  },
  parameters: overlayDocs('720px'),
  render: (args) => ({
    components,
    setup() {
      const denominations = ref([
        { id: 1, label: 'Small', amount: 25 },
        { id: 2, label: 'Medium', amount: 50 },
        { id: 3, label: 'Large', amount: 100 },
      ])
      return { args, open: useOpen(args), denominations }
    },
    template: `
      <div>
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
            <v-btn variant="text" class="mp-form-grid__full align-self-start" prepend-icon="plus">Add denomination</v-btn>
          </MpFormGrid>

          <template #footer>
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="open = false">Save gift card</v-btn>
          </template>
        </MpFormDrawer>
      </div>
    `,
  }),
}

/**
 * **In context.** A real create-segment form, opened from the page's primary action (it starts
 * closed: press **New segment**). Nothing in this body sets a margin or a `mb-*` utility: the
 * drawer's body is a flex column on `component.dialog.gap`, the same rhythm `MpDialog` uses, so
 * a drawer form and a modal form are spaced identically.
 */
export const InContextCreateSegment: Story = {
  render: () => ({
    components,
    data: () => ({
      open: false,
      name: 'VIP — Repeat Buyers',
      match: 'All rules',
      rules: [
        { field: 'Lifetime value', op: 'is greater than', value: '$1,000' },
        { field: 'Orders', op: 'is at least', value: '3' },
      ],
    }),
    template: `
      <div>
        <v-btn variant="flat" color="primary" prepend-icon="plus" @click="open = true">New segment</v-btn>
        <MpFormDrawer v-model="open" title="New segment" subtitle="Contacts matching these rules, refreshed hourly">
          <v-text-field v-model="name" label="Segment name" />
          <v-select v-model="match" label="Contacts must match" :items="['All rules', 'Any rule']" />

          <MpFormField label="Rules">
            <div class="d-flex flex-column ga-2">
              <v-card v-for="(r, i) in rules" :key="i" flat border rounded="lg" class="mp-card-inset mp-card-inset--compact d-flex align-center ga-2">
                <span class="text-body-2 font-weight-medium">{{ r.field }}</span>
                <span class="text-body-2 text-medium-emphasis">{{ r.op }}</span>
                <span class="text-body-2 font-weight-medium">{{ r.value }}</span>
                <v-spacer />
                <v-btn icon="x" variant="text" size="x-small" :aria-label="'Remove rule: ' + r.field" />
              </v-card>
              <v-btn variant="text" size="small" class="align-self-start" prepend-icon="plus">Add rule</v-btn>
            </div>
          </MpFormField>

          <MpAlert tone="info">
            <span class="d-inline-flex align-center ga-2">
              About <strong>1,284</strong> contacts match right now
              <MpStatusChip status="Active" type="contact" size="sm" />
            </span>
          </MpAlert>

          <template #footer>
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="open = false">Create segment</v-btn>
          </template>
        </MpFormDrawer>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The drawer at a 375px viewport (canvas only; a docs frame is as wide as the page). The
 * `@media (max-width: 640px)` breakpoint clamps the panel to a full-bleed `100vw` sheet — the
 * 12px gutters and rounded corners drop out so the panel fills the viewport edge-to-edge instead
 * of the 480px panel overflowing the screen.
 */
export const Mobile375: Story = {
  args: {
    title: 'New segment',
    subtitle: 'Define who belongs',
  },
  globals: {
    viewport: { value: 'mobile375', isRotated: false },
  },
  parameters: overlayDocs(),
  render: (args) => ({
    components,
    setup: () => ({ args, open: useOpen(args) }),
    template: `
      <div>
        <v-btn variant="outlined" prepend-icon="panel-right" @click="open = true">New segment</v-btn>
        <MpFormDrawer v-bind="args" v-model="open">
          <MpFormGrid>
            <v-text-field label="Name" placeholder="VIP repeat buyers" />
            <v-select label="Source list" :items="['Newsletter', 'VIP Circle', 'Win-Back']" model-value="Newsletter" />
            <v-select label="Match" :items="['All conditions', 'Any condition']" model-value="All conditions" />
            <v-text-field label="Min. lifetime spend" prefix="$" model-value="500" />
          </MpFormGrid>
          <template #footer>
            <v-btn variant="text" @click="open = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" @click="open = false">Save</v-btn>
          </template>
        </MpFormDrawer>
      </div>
    `,
  }),
}
