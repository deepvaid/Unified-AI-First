/**
 * Unified Field Style Stories — Flowbite-style floating label
 *
 * All outlined Vuetify fields (v-text-field, v-select, v-textarea, v-autocomplete,
 * v-combobox) share a single visual baseline defined in settings-form.scss:
 *   • 10px border radius, transparent fill (no resting tint)
 *   • 40px minimum control height
 *   • 1px --border-strong hairline at rest (dark-mode-aware), darker on hover
 *   • 2px primary border on focus, 2px error-color border on error — NEITHER has
 *     a glow ring; the border width itself is the only focus/error cue
 *   • Floating label (Vuetify's native notch mechanism, restyled): 12px/500,
 *     muted at rest, primary on focus, error-color on error — see settings-form.scss's
 *     "specificity trap" comment before adding any new label-color rule
 *   • Full-opacity disabled container, muted text and label, lighter border
 *
 * Settings pages inherit this baseline unchanged — as of 2026-08-27 every Settings
 * field uses the `label` prop (no more separate uppercase `.settings-field__label`
 * elements above unlabeled fields; there is now exactly one label language).
 * The AppBar command-search and the MpDataTableToolbar search intentionally override to a
 * pill shape; the toolbar search also pins its border to --mp-border-subtle so it matches
 * the outlined buttons beside it (see MpDataTableToolbar).
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import { nextTick, onMounted, ref } from 'vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'

const meta: Meta = {
  title: 'Patterns/Form Fields',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Unified Field Baseline — Flowbite-style floating label

Every outlined form control in the app shares a single visual style
(flowbite.com/docs/forms/floating-label — the outlined variant):
- **Shape** – 10px border radius, **transparent** fill at rest (no tint)
- **Height** – 40px minimum (all densities)
- **Border** – Flat 1px \`--border-strong\` at rest (dark-mode-aware), darker on hover
- **Focus** – Primary-color border, **2px**, no box-shadow ring
- **Error** – Error-color border, **2px**, no box-shadow ring
- **Label** – Floats into the border notch (Vuetify's native mechanism via the
  \`label\` prop); restyled to 12px/500 weight, muted at rest, primary on focus,
  error-color on error
- **Disabled** – Full opacity, muted text/label, lighter border

### Rules
- \`variant="outlined"\` and \`density="comfortable"\` are the **theme defaults** — don't restate
  them on the tag. As of Phase 6 the selection controls (\`v-checkbox\`, \`v-radio-group\`,
  \`v-switch\`, \`v-slider\`, \`v-number-input\`, \`v-btn-toggle\`, \`v-chip-group\`) have the same
  defaults, so a checkbox group and the fields above it finally sit on one rhythm.
- **Always pass a \`label\`, not a bare \`placeholder\`** — the floating label is
  the field's name; a placeholder is example text shown once there's a label to
  float. A placeholder-only field with no label reads as unlabeled once value
  text starts sitting in the same spot the label would.
- **One required mark:** a trailing \` *\` in the label text, or \`required\` on \`MpFormField\` /
  \`MpFormSection\`. Never an asterisk inside a placeholder.
- Never pass \`rounded="pill"\` — or any \`rounded\` — on standard form fields. The AppBar search
  and the \`MpDataTableToolbar\` search are the only two exceptions.
- Do not add local \`background\` or \`box-shadow\` overrides to fields — let the baseline apply.
- **Don't set \`hide-details\`** to tidy up spacing. The default is \`"auto"\`, which reserves no
  height when there is no message; bare \`hide-details\` permanently suppresses validation and
  hints. Keep it only for a dense toolbar filter, with a comment saying so.
- **Textarea height comes from \`rows\`** — 3 for a normal message, 5 for long-form. Never a CSS
  height.
- \`density="compact"\` is for toolbar filter selects; forms use the default.

### Spacing between fields — not a field's job (Phase 6)
A field sets **zero external margin**. The container owns the rhythm:

- \`MpFormGrid\` — one or two columns on \`component.field.groupGap\` (16), plus
  \`mp-form-grid__full\` and \`mp-form-grid__trailing\` for the two row shapes that were being
  hand-rolled six different ways.
- \`MpFormSection\` — the one in-form section heading, owning \`component.field.sectionGap\` (24).
- \`MpFormField\` — label + hint/error + aria for **composite** controls only (chip groups, radio
  groups, tile pickers). Never around a Vuetify input; those own their own label.
- Inside \`MpDialog\` / \`MpFormDrawer\` the body is already a 16px flex column, so a bare stack of
  fields needs no container at all.

An \`mb-4\` on a field inside a shell body used to land *on top of* the shell's 16px gap and
render 32. 275 of them were deleted in Phase 6; don't add the 276th.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const AllStates: Story = {
  name: 'All States',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const text = ref('Hello World')
      const empty = ref('')
      return { text, empty }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Text Field — all states</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Default (empty)</div>
            <v-text-field
              v-model="empty"
              label="Company name"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Default (filled)</div>
            <v-text-field
              v-model="text"
              label="Company name"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Disabled</div>
            <v-text-field
              model-value="Locked value"
              label="Company name"
              variant="outlined"
              density="comfortable"
              disabled
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Read-only</div>
            <v-text-field
              model-value="Read-only value"
              label="Company name"
              variant="outlined"
              density="comfortable"
              readonly
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Error</div>
            <v-text-field
              model-value=""
              label="Company name"
              variant="outlined"
              density="comfortable"
              error-messages="This field is required"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Helper text</div>
            <v-text-field
              model-value=""
              label="Subdomain"
              variant="outlined"
              density="comfortable"
              hint="This will be part of your store URL"
              persistent-hint
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

export const FloatingLabelStates: Story = {
  name: 'Floating Label States',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const emptyComfortable = ref('')
      const filledComfortable = ref('Scooter Village')
      const emptyCompact = ref('')
      const filledCompact = ref('USD')
      const emptyIcon = ref('')
      // The native `autofocus` HTML attribute races Vuetify's own focus
      // listener: the input becomes document.activeElement, but the
      // `@focus` handler that flips VField's internal `focused` ref (and
      // therefore the .v-field--focused class this baseline's focus rules
      // key off) attaches in Vuetify's mounted hook — which can run after
      // the browser has already fired the autofocus event. Result: the
      // input is focused but renders as if it isn't. Calling the exposed
      // .focus() method after nextTick() sidesteps the race entirely.
      const focusedFieldRef = ref()
      onMounted(() => nextTick(() => focusedFieldRef.value?.focus()))
      return { emptyComfortable, filledComfortable, emptyCompact, filledCompact, emptyIcon, focusedFieldRef }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-1">Floating label — empty vs. filled vs. focused</h3>
        <p class="text-caption text-medium-emphasis mb-4">
          Every other story in this file interacts with a field to see its focused state.
          This one pins one open so the notch, label transition, and 2px focus border are
          visible without clicking anything.
        </p>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">Comfortable — empty</div>
            <v-text-field v-model="emptyComfortable" label="Account Name" variant="outlined" density="comfortable" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">Comfortable — filled</div>
            <v-text-field v-model="filledComfortable" label="Account Name" variant="outlined" density="comfortable" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">Compact — empty</div>
            <v-select v-model="emptyCompact" :items="['USD','EUR','GBP']" label="Currency" variant="outlined" density="compact" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">Compact — filled</div>
            <v-select v-model="filledCompact" :items="['USD','EUR','GBP']" label="Currency" variant="outlined" density="compact" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Focused (autofocus) — label + border go primary, no glow</div>
            <v-text-field ref="focusedFieldRef" v-model="emptyIcon" label="Email Address" prepend-inner-icon="mail" variant="outlined" density="comfortable" hide-details />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

export const SearchField: Story = {
  name: 'Search Field',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const query = ref('')
      return { query }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Search — toolbar / filter variant</h3>
        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-1">Comfortable density (forms)</div>
            <v-text-field
              v-model="query"
              variant="outlined"
              density="comfortable"
              placeholder="Search…"
              prepend-inner-icon="search"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-1">Compact density (toolbar)</div>
            <v-text-field
              v-model="query"
              variant="outlined"
              density="compact"
              placeholder="Search records…"
              prepend-inner-icon="search"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

export const SelectAndCombobox: Story = {
  name: 'Select & Combobox',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const single = ref('')
      const multi = ref<string[]>([])
      return { single, multi }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Select / Combobox — unified style</h3>
        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-1">Single select</div>
            <v-select
              v-model="single"
              :items="['Active', 'Inactive', 'Pending', 'Archived']"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-1">Multi-select with chips</div>
            <v-select
              v-model="multi"
              :items="['Email', 'SMS', 'Push', 'In-app']"
              label="Channels"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-1">Select — disabled</div>
            <v-select
              model-value="Active"
              :items="['Active']"
              label="Status"
              variant="outlined"
              density="comfortable"
              disabled
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-caption text-medium-emphasis mb-1">Compact (toolbar filter)</div>
            <v-select
              v-model="single"
              :items="['All statuses', 'Active', 'Inactive', 'Pending']"
              label="Status filter"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

export const TextareaField: Story = {
  name: 'Textarea',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const body = ref('')
      return { body }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Textarea — same baseline</h3>
        <v-row>
          <v-col cols="12" sm="6">
            <v-textarea
              v-model="body"
              label="Message body"
              variant="outlined"
              density="comfortable"
              rows="4"
              placeholder="Type your message here…"
              hint="Markdown is supported"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-textarea
              model-value="This field is disabled."
              label="Internal notes"
              variant="outlined"
              density="comfortable"
              rows="4"
              disabled
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

export const WithIcons: Story = {
  name: 'With Icons',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Fields with icons</h3>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              label="Email"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mail"
              placeholder="hello@example.com"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              label="Website"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="globe"
              append-inner-icon="external-link"
              placeholder="https://example.com"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              label="Password"
              type="password"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="lock"
              append-inner-icon="eye-off"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              label="Revenue"
              variant="outlined"
              density="comfortable"
              prefix="$"
              placeholder="0.00"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/**
 * The layout primitives doing the work together: `MpFormSection` for each heading, `MpFormGrid`
 * for each group, `MpFormField` for the one composite control. There is no spacing utility in
 * this markup — every gap is a token, and the fields carry no margins of their own.
 */
export const FormLayout: Story = {
  name: 'Form Layout Example',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { MpFormGrid, MpFormSection, MpFormField },
    setup() {
      const form = ref({ name: '', email: '', timezone: '', notes: '', channel: 0 })
      return { form }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Typical form layout</h3>
        <v-card flat border rounded="lg" style="max-width: var(--mp-component-dialog-width-md); padding: var(--mp-component-card-padding);">
          <MpFormSection title="Profile" />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="form.name"
              label="Full name *"
              prepend-inner-icon="user"
              class="mp-form-grid__full"
            />
            <v-text-field v-model="form.email" label="Email" type="email" prepend-inner-icon="mail" />
            <v-select
              v-model="form.timezone"
              :items="['UTC-8 (PST)', 'UTC-5 (EST)', 'UTC+0 (GMT)', 'UTC+5:30 (IST)']"
              label="Timezone"
            />
            <v-textarea v-model="form.notes" label="Notes" rows="3" class="mp-form-grid__full" />
          </MpFormGrid>

          <MpFormSection title="Contact preference" />
          <MpFormGrid>
            <MpFormField label="How we reach you" hint="Used for service notices, never marketing.">
              <template #default="{ labelId, descriptionId }">
                <v-chip-group v-model="form.channel" :aria-labelledby="labelId" :aria-describedby="descriptionId">
                  <v-chip filter>Email</v-chip>
                  <v-chip filter>SMS</v-chip>
                  <v-chip filter>In-app only</v-chip>
                </v-chip-group>
              </template>
            </MpFormField>
          </MpFormGrid>

          <div class="d-flex justify-end ga-2 mt-6">
            <v-btn variant="outlined" class="text-none">Cancel</v-btn>
            <v-btn color="primary" variant="flat" class="text-none">Save changes</v-btn>
          </div>
        </v-card>
      </div>
    `,
  }),
}

/**
 * Fixtures for the open-menu state matrix below (UX-008 checkmark, grouping, truncation,
 * scrolling, disabled items). Vuetify's `items` prop accepts plain strings alongside
 * `{ type: 'subheader' }` entries in the same array — no custom slot needed for the
 * recessed, non-interactive group headers (docs/ui-system-audit/00-reference-research.md §1).
 */
const groupedAssigneeItems = [
  { type: 'subheader', title: 'Sales' },
  'Jordan Lee',
  'Casey Kim',
  { type: 'subheader', title: 'Marketing' },
  'Alex Rivera',
  'Sam Patel',
  { type: 'subheader', title: 'Support' },
  'Morgan Blake',
]

const longLabelItems = [
  'Premium Wireless Noise-Cancelling Over-Ear Headphones — Midnight Black',
  'Organic Cotton Crewneck T-Shirt, Unisex, Made in Portugal',
  'Stainless Steel Insulated Water Bottle with Bamboo Lid, 750ml',
  'Limited Edition Hand-Poured Soy Candle — Sea Salt & Driftwood',
]

const manyCountryItems = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile',
  'Colombia', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece',
  'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Kenya', 'Malaysia',
  'Mexico', 'Netherlands', 'New Zealand', 'Norway', 'Philippines', 'Poland',
  'Portugal', 'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden',
  'Switzerland', 'Thailand', 'United Kingdom', 'United States', 'Vietnam',
]

const statusItemsWithDisabled = [
  { title: 'Active', value: 'active' },
  { title: 'Paused', value: 'paused' },
  { title: 'Archived', value: 'archived', disabled: true },
]

/** Menu pre-opened with "Active" already selected — the active row shows the UX-008 trailing
 * checkmark (global.scss `.v-overlay .v-list-item--active[aria-selected='true']`), composed with
 * the existing tint rather than replacing it, per reference-research §1. */
export const SelectedWithCheckmark: Story = {
  name: 'Select — Selected (Checkmark)',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const status = ref('Active')
      const menu = ref(true)
      return { status, menu }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Select — menu open, item selected</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="status"
              v-model:menu="menu"
              :items="['Active', 'Inactive', 'Pending', 'Archived']"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** Menu pre-opened with items grouped under subheaders ("Sales" / "Marketing" / "Support") — group
 * headers are visually recessed and non-interactive, never a clickable row. */
export const GroupedOptions: Story = {
  name: 'Select — Grouped Options',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const assignee = ref('Jordan Lee')
      const menu = ref(true)
      return { assignee, menu, groupedAssigneeItems }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Select — grouped with subheaders</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="assignee"
              v-model:menu="menu"
              :items="groupedAssigneeItems"
              label="Assign to"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** Long option text truncates instead of wrapping or widening the field — both in the closed
 * field's selected value and in each open-menu row. */
export const LongLabels: Story = {
  name: 'Select — Long Labels',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const closedValue = ref(longLabelItems[0])
      const openValue = ref(longLabelItems[1])
      const menu = ref(true)
      return { closedValue, openValue, menu, longLabelItems }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Select — long option text truncates</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Closed — selected value truncates</div>
            <v-select
              v-model="closedValue"
              :items="longLabelItems"
              label="Product"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="text-caption text-medium-emphasis mb-1">Open — menu rows truncate</div>
            <v-select
              v-model="openValue"
              v-model:menu="menu"
              :items="longLabelItems"
              label="Product"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** 38 options pre-opened — the menu's default 310px max-height (VSelect's built-in cap) scrolls
 * internally instead of growing to fit every row. */
export const ManyOptionsScroll: Story = {
  name: 'Select — Many Options (Scroll)',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const country = ref('')
      const menu = ref(true)
      return { country, menu, manyCountryItems }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Select — many options, menu scrolls internally</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="country"
              v-model:menu="menu"
              :items="manyCountryItems"
              label="Country"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** Menu pre-opened with "Archived" disabled (can't file back into it directly) — Vuetify's
 * built-in disabled row treatment: muted text, no hover/active state, unclickable. Uses
 * `item-props` so each item object's own `disabled` flag reaches the underlying `v-list-item`. */
export const DisabledItem: Story = {
  name: 'Select — Disabled Item',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const status = ref('active')
      const menu = ref(true)
      return { status, menu, statusItemsWithDisabled }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Select — one option disabled</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="status"
              v-model:menu="menu"
              :items="statusItemsWithDisabled"
              item-props
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** Vuetify's built-in `loading` prop — a linear progress bar replaces the resting border while
 * a value is being fetched. Works the same on `v-text-field` and `v-select`. */
export const LoadingState: Story = {
  name: 'Loading State',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Fields — loading</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              label="Company name"
              variant="outlined"
              density="comfortable"
              loading
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select
              :items="['Active', 'Inactive', 'Pending']"
              label="Status"
              variant="outlined"
              density="comfortable"
              loading="primary"
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** Searchable autocomplete with a query that matches nothing — Vuetify's default no-data row
 * renders in place of the list instead of an empty menu. */
export const EmptyState: Story = {
  name: 'Autocomplete — No Matches',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const country = ref(null)
      const search = ref('Wakanda')
      const menu = ref(true)
      return { country, search, menu, manyCountryItems }
    },
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Autocomplete — search matches nothing</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-autocomplete
              v-model="country"
              v-model:search="search"
              v-model:menu="menu"
              :items="manyCountryItems"
              label="Country"
              placeholder="Search countries…"
              prepend-inner-icon="search"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}

/** Select and textarea with `error-messages` set — complements AllStates' text-field error case
 * with the same treatment on other field types. */
export const ErrorState: Story = {
  name: 'Error State',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div>
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Fields — error</h3>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
              :items="['Active', 'Inactive', 'Pending']"
              label="Status"
              variant="outlined"
              density="comfortable"
              error-messages="Select a status"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-textarea
              label="Notes"
              variant="outlined"
              density="comfortable"
              rows="3"
              error-messages="Notes cannot be empty"
            />
          </v-col>
        </v-row>
      </div>
    `,
  }),
}
