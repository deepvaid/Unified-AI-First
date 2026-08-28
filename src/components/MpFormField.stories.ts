import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormField from './MpFormField.vue'
import MpFormGrid from './MpFormGrid.vue'
import MpFormSection from './MpFormSection.vue'
import { constrain } from '@/stories/decorators'

const meta = {
  title: 'Molecules/MpFormField',
  component: MpFormField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpFormField\` gives a label, an optional hint or error, and the aria wiring to a control that
has none of its own.

**Read this before reaching for it.** A plain \`v-text-field\` / \`v-select\` / \`v-textarea\` /
\`v-autocomplete\` / \`v-combobox\` must **not** be wrapped. Those already own their label, hint,
error and aria association; Vuetify's floating label is the system's one label language
(see \`Patterns/Form Fields\`); and the overlay audit's locked architecture decision is to polish
Vuetify's primitives rather than wrap them.

**Use when:** the control is a *composite* with no label of its own — a row of preset chips, a
grid of image tiles, a radio group, a checkbox group. Those were each hand-rolling a
\`<div class="text-caption …">\` above the control, at four different type sizes, with no
programmatic association at all.

**Don't use when:** a Vuetify input can carry the label itself. Wrapping one produces two labels.

### Usage
\`\`\`html
<MpFormField label="Usage limit" hint="Leave unlimited for an evergreen coupon.">
  <template #default="{ labelId, descriptionId }">
    <v-radio-group v-model="limit" :aria-labelledby="labelId" :aria-describedby="descriptionId">
      <v-radio value="none" label="Unlimited uses" />
      <v-radio value="capped" label="Limit total uses" />
    </v-radio-group>
  </template>
</MpFormField>
\`\`\`

### The empty-state rule
The hint/error line **renders nothing when there is nothing to say** — it does not reserve
height. That reservation is exactly what produced the large, uneven vertical gaps this phase set
out to remove, and it is why the fields in \`MpDialog\`'s \`ErrorStates\` story keep the same rhythm
as the clean form beside them.

### Spacing
\`component.field.labelGap\` (6) between the label and the control, \`component.field.hintGap\` (4)
between the control and the hint. Zero external margin — the form container owns the space
between one field and the next.

### 🟢 Do's
- **Do** bind the slot's \`labelId\` and \`descriptionId\` to the control when the control accepts
  aria attributes directly (\`v-radio-group\`, \`v-chip-group\`). The wrapper's \`role="group"\`
  covers the rest.
- **Do** use \`required\` for the mark — it is the same mark \`MpFormSection\` uses, and it never
  goes in a placeholder.
- **Do** pass \`error\` instead of \`hint\` when the field is invalid; it replaces the hint, recolours
  it, and sets \`aria-invalid\`.

### 🔴 Don'ts
- **Don't** wrap a Vuetify input. It is worth repeating.
- **Don't** put an asterisk in the label text yourself — \`required\` renders it, and marks it
  \`aria-hidden\` so it is not read as "star".

### A11y
- **Provides:** \`role="group"\` with \`aria-labelledby\` on the label, \`aria-describedby\` on the
  hint or error (and only when one is rendered — a dangling id is worse than none),
  \`aria-required\` and \`aria-invalid\`.
- **Consumer must:** keep validation on the control itself. \`required\` and \`error\` here are the
  presentation of a state, not the source of it.
        `,
      },
    },
  },
  args: {
    label: 'Common amounts',
  },
  argTypes: {
    label: { control: 'text', description: 'The field label. Required — this component exists to give a label to a control that has none.' },
    required: { control: 'boolean', description: 'Adds the required mark and `aria-required`. Validation itself stays on the control.' },
    hint: { control: 'text', description: 'Supporting text under the control. Renders nothing when empty — it never reserves height.' },
    error: { control: 'text', description: 'Replaces the hint, in the error colour, and marks the group invalid.' },
    default: { control: false, description: 'Slot — the composite control. Exposes `{ labelId, descriptionId }` for controls that take aria attributes directly.', table: { category: 'slots' } },
  },
  decorators: [constrain('drawer')],
} satisfies Meta<typeof MpFormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpFormField },
    setup: () => ({ args }),
    template: `
      <MpFormField v-bind="args">
        <v-chip-group :model-value="1">
          <v-chip filter>$25</v-chip>
          <v-chip filter>$50</v-chip>
          <v-chip filter>$100</v-chip>
          <v-chip filter>$200</v-chip>
        </v-chip-group>
      </MpFormField>
    `,
  }),
}

/**
 * The four composite controls this exists for: a preset chip group, a radio group, a checkbox
 * group, and a tile picker. Each one previously carried its own hand-rolled label div.
 */
export const Variants: Story = {
  render: () => ({
    components: { MpFormField },
    template: `
      <div class="d-flex flex-column ga-6">
        <MpFormField label="Common amounts" hint="Sets the initial value.">
          <v-chip-group :model-value="1">
            <v-chip filter>$25</v-chip>
            <v-chip filter>$50</v-chip>
            <v-chip filter>$100</v-chip>
          </v-chip-group>
        </MpFormField>

        <MpFormField label="Usage limit">
          <template #default="{ labelId }">
            <v-radio-group model-value="none" :aria-labelledby="labelId">
              <v-radio value="none" label="Unlimited uses" />
              <v-radio value="capped" label="Limit total uses" />
            </v-radio-group>
          </template>
        </MpFormField>

        <MpFormField label="Notify me about" hint="Applies to this campaign only.">
          <template #default="{ labelId }">
            <div role="group" :aria-labelledby="labelId">
              <v-checkbox label="Sends" model-value />
              <v-checkbox label="Bounces" />
              <v-checkbox label="Unsubscribes" model-value />
            </div>
          </template>
        </MpFormField>

        <MpFormField label="Card artwork" hint="Shown on the gift card email.">
          <div class="d-flex flex-wrap ga-2">
            <v-btn variant="outlined" class="text-none">None</v-btn>
            <v-btn variant="flat" color="primary" class="text-none">Celebration</v-btn>
            <v-btn variant="outlined" class="text-none">Thank you</v-btn>
          </div>
        </MpFormField>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no size axis: this wrapper inherits the measure of the form container it sits in, and
 * the control inside it sits on the shared `component.control.height` (40) ramp like every other
 * control. The one dimension it does decide — label-to-control and control-to-hint distance —
 * is a token pair (`field.labelGap` 6, `field.hintGap` 4), stated once for every field type.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpFormField, MpFormGrid },
    template: `
      <div class="d-flex flex-column ga-8">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">Beside a plain field — same baseline, same height</div>
          <MpFormGrid :cols="2">
            <v-text-field label="Initial value" model-value="50" type="number" />
            <MpFormField label="Common amounts">
              <v-chip-group :model-value="1">
                <v-chip filter>$25</v-chip>
                <v-chip filter>$50</v-chip>
              </v-chip-group>
            </MpFormField>
          </MpFormGrid>
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * Resting, with a hint, required, and in error. The important one is the first: with no hint and
 * no error, **nothing** is rendered below the control — no reserved row, no gap. Compare the
 * distance between the first and second fields with the distance between the second and third.
 */
export const States: Story = {
  render: () => ({
    components: { MpFormField, MpFormGrid },
    template: `
      <MpFormGrid>
        <MpFormField label="Resting — no hint, no reserved space">
          <v-chip-group :model-value="0"><v-chip filter>Email</v-chip><v-chip filter>SMS</v-chip></v-chip-group>
        </MpFormField>

        <MpFormField label="With a hint" hint="The hint sits at field.hintGap from the control.">
          <v-chip-group :model-value="0"><v-chip filter>Email</v-chip><v-chip filter>SMS</v-chip></v-chip-group>
        </MpFormField>

        <MpFormField label="Required" required hint="The mark is the same one MpFormSection uses.">
          <v-chip-group :model-value="0"><v-chip filter>Email</v-chip><v-chip filter>SMS</v-chip></v-chip-group>
        </MpFormField>

        <MpFormField label="In error" required error="Pick a delivery channel before saving">
          <v-chip-group :model-value="null"><v-chip filter>Email</v-chip><v-chip filter>SMS</v-chip></v-chip-group>
        </MpFormField>
      </MpFormGrid>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The expiration block from the gift-card drawer. The legal note used to be a
 * bare `<div class="text-caption text-medium-emphasis mb-4">` sibling of the radio group —
 * visually a hint, but associated with nothing. As the field's `hint` it is announced with the
 * group, and its distance from the control is the same token every other hint uses.
 */
export const InContextExpiryBlock: Story = {
  render: () => ({
    components: { MpFormField, MpFormGrid, MpFormSection },
    setup: () => ({ mode: 'date' }),
    template: `
      <div>
        <MpFormSection title="Expiration date" />
        <MpFormGrid>
          <MpFormField
            label="When this card expires"
            hint="Countries have different laws for gift card expiry dates. Check the laws that apply to your store before setting one."
          >
            <template #default="{ labelId, descriptionId }">
              <v-radio-group :model-value="mode" :aria-labelledby="labelId" :aria-describedby="descriptionId">
                <v-radio value="none" label="No expiration date" />
                <v-radio value="date" label="Set expiration date" />
              </v-radio-group>
            </template>
          </MpFormField>
          <v-text-field label="Expires on *" type="date" model-value="2027-05-12" />
        </MpFormGrid>
      </div>
    `,
  }),
  args: {} as never,
}
