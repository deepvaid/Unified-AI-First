/**
 * Unified Field Style Stories
 *
 * All outlined Vuetify fields (v-text-field, v-select, v-textarea, v-autocomplete,
 * v-combobox) share a single visual baseline defined in settings-form.scss:
 *   • 10px border radius
 *   • 40px minimum control height
 *   • Subtle surface-2 fill (color-mix with --surface-secondary token)
 *   • Flat 1px outline using --border-subtle (dark-mode-aware)
 *   • Primary-color border on focus, no ring/glow
 *   • Full-opacity disabled container with muted text
 *
 * Settings pages inherit this baseline unchanged.
 * The AppBar command-search intentionally overrides to a pill shape.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

const meta: Meta = {
  title: 'Forms/Form Fields',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## Unified Field Baseline

Every outlined form control in the app shares a single visual style:
- **Shape** – 10px border radius
- **Height** – 40px minimum (all densities)
- **Fill** – Subtle \`surface-2\` tint, slightly darker on hover
- **Border** – Flat 1px, \`--border-subtle\` token (light & dark mode)
- **Focus** – Primary-color border, no box-shadow ring
- **Disabled** – Full opacity, muted text color
- **Error** – Error-color border

### Rules
- Always use \`variant="outlined"\` — it picks up the baseline automatically.
- Never pass \`rounded="pill"\` on standard form fields (AppBar search is the only exception).
- Do not add local \`background\` or \`box-shadow\` overrides to fields — let the baseline apply.
- Use \`density="compact"\` for toolbar filter selects, \`density="comfortable"\` for forms.
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
      <div class="mp-story-canvas pa-6">
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

export const SearchField: Story = {
  name: 'Search Field',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const query = ref('')
      return { query }
    },
    template: `
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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

export const FormLayout: Story = {
  name: 'Form Layout Example',
  parameters: { controls: { disable: true } },
  render: () => ({
    setup() {
      const form = ref({ name: '', email: '', timezone: '', notes: '' })
      return { form }
    },
    template: `
      <div class="mp-story-canvas pa-6">
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Typical form layout</h3>
        <v-card flat border rounded="lg" class="pa-6" max-width="620">
          <div class="settings-grid mb-4">
            <div class="settings-field--full">
              <v-text-field
                v-model="form.name"
                label="Full name"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="user"
                hide-details
              />
            </div>
            <div>
              <v-text-field
                v-model="form.email"
                label="Email"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mail"
                hide-details
              />
            </div>
            <div>
              <v-select
                v-model="form.timezone"
                :items="['UTC-8 (PST)', 'UTC-5 (EST)', 'UTC+0 (GMT)', 'UTC+5:30 (IST)']"
                label="Timezone"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
            <div class="settings-field--full">
              <v-textarea
                v-model="form.notes"
                label="Notes"
                variant="outlined"
                density="comfortable"
                rows="3"
                hide-details
              />
            </div>
          </div>
          <div class="d-flex justify-end gap-2">
            <v-btn variant="outlined" class="text-none">Cancel</v-btn>
            <v-btn color="primary" variant="flat" class="text-none">Save changes</v-btn>
          </div>
        </v-card>
      </div>
    `,
  }),
}

/** Outlined field baseline in dark mode — borders, focus ring, and disabled text from semantic tokens. */
export const DarkModeAllStates: Story = {
  name: 'Dark Mode — All States',
  globals: darkModeGlobals,
  ...AllStates,
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
      <div class="mp-story-canvas pa-6">
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
