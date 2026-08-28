import type { Meta, StoryObj } from '@storybook/vue3'
import MpFormSection from './MpFormSection.vue'
import MpFormGrid from './MpFormGrid.vue'
import { constrain } from '@/stories/decorators'

const meta = {
  title: 'Molecules/MpFormSection',
  component: MpFormSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpFormSection\` is the one in-form section heading — "GENERAL", "EXPIRATION DATE", "DELIVERY".

Those headings were being written seven different ways across roughly 260 sites:
\`text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-3\` in one drawer,
\`text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2\` in the next,
\`text-subtitle-2 font-weight-bold mb-2\` (no uppercase at all) in a third, plus four bespoke
scoped classes. No two forms agreed on the type, the case, or the space around the heading.

**Use when:** a form has more than one group of fields.

**Don't use when:** the heading titles a whole card or page — that is \`MpSectionHeader\`
(page sections) or \`MpPageHeader\` (pages). This one is for a band *inside* a form.

### Usage
\`\`\`html
<MpFormSection title="General" />
<MpFormGrid :cols="2">
  <v-text-field label="Campaign name *" class="mp-form-grid__full" />
  <v-text-field label="From name" />
</MpFormGrid>

<MpFormSection title="Delivery" description="When and where this send goes out." />
<MpFormGrid> … </MpFormGrid>
\`\`\`

### It is a heading, not a wrapper
It renders in the flow between field groups and states its own rhythm, rather than nesting the
group inside it. That is deliberate: with ~260 sites to convert, a heading element is a one-line
replacement, where a wrapper would have meant re-nesting whole template regions — a much larger,
much riskier diff for no rendered difference.

### Spacing
One rule, everywhere: \`component.field.sectionGap\` (24) above the heading, expressed as the
*delta* over the ambient field gap (\`sectionGap - groupGap\`) so it stays correct whichever of
the two moves. A heading that opens a form gets no extra space — the shell's own inset already
provides it.

### 🟢 Do's
- **Do** use sentence-case \`title\` text ("Expiration date"). The uppercase is presentational;
  writing it uppercase in the source makes it shout in screen readers too.
- **Do** put a one-line \`description\` on the section rather than repeating it in every field hint.
- **Do** set \`required\` when every field in the section is required, so the mark appears once
  instead of on each label.

### 🔴 Don'ts
- **Don't** add \`mb-*\` after it, or \`mt-*\` before it. It owns both sides.
- **Don't** hand-roll \`text-caption text-uppercase …\` for a new form. That is the thing this
  replaced.

### A11y
- **Provides:** a real heading element (\`h3\` by default), so a screen reader can navigate a long
  form by its sections; the required mark is \`aria-hidden\` because it is decoration on top of the
  text, and the requirement itself belongs on the control.
- **Consumer must:** pick a \`headingLevel\` that does not skip a level — a form inside a page that
  already has an \`h2\` keeps the default \`h3\`.
        `,
      },
    },
  },
  args: {
    title: 'General',
  },
  argTypes: {
    title: { control: 'text', description: 'The heading text. Write it sentence case — the uppercase is applied by CSS.' },
    description: { control: 'text', description: 'One supporting line under the heading. Longer context belongs in a field hint.' },
    required: { control: 'boolean', description: 'Marks the whole section required, using the same mark a field label uses.' },
    headingLevel: { control: 'inline-radio', options: [2, 3, 4], description: 'Heading level. Default 3, for a form inside a page that already has an h2.' },
  },
  decorators: [constrain('dialog')],
} satisfies Meta<typeof MpFormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Title alone, title with a description, and a required section. */
export const Variants: Story = {
  render: () => ({
    components: { MpFormSection, MpFormGrid },
    template: `
      <div>
        <MpFormSection title="General" />
        <MpFormGrid><v-text-field label="Campaign name" /></MpFormGrid>

        <MpFormSection title="Audience" description="Who receives this send." />
        <MpFormGrid><v-select label="List" :items="['All contacts', 'Newsletter']" model-value="Newsletter" /></MpFormGrid>

        <MpFormSection title="Delivery" required />
        <MpFormGrid><v-text-field label="Send date" type="date" model-value="2026-09-14" /></MpFormGrid>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * There is no size axis — one heading size for every form section is the point of the component.
 * What varies is `headingLevel`, and that is a document-structure choice, not a visual one: all
 * three render identically and differ only in the element a screen reader announces.
 */
export const Sizes: Story = {
  render: () => ({
    components: { MpFormSection },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">headingLevel="2" — renders &lt;h2&gt;</div>
          <MpFormSection title="General" :heading-level="2" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">headingLevel="3" — the default</div>
          <MpFormSection title="General" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">headingLevel="4"</div>
          <MpFormSection title="General" :heading-level="4" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/**
 * The one state that matters is position: the first section in a form sits tight against the
 * shell's inset, and every later one carries `sectionGap`. Compare the space above "Audience"
 * with the space above "General".
 */
export const States: Story = {
  render: () => ({
    components: { MpFormSection, MpFormGrid },
    template: `
      <div style="border: 1px dashed var(--border-subtle); padding: var(--mp-component-dialog-padding);">
        <MpFormSection title="General" />
        <MpFormGrid>
          <v-text-field label="Campaign name" />
          <v-text-field label="From name" />
        </MpFormGrid>

        <MpFormSection title="Audience" description="A later section adds sectionGap above itself." />
        <MpFormGrid>
          <v-select label="List" :items="['All contacts', 'Newsletter']" model-value="Newsletter" />
        </MpFormGrid>

        <MpFormSection title="Long description" description="A description wraps and keeps sentence case and normal tracking, so only the heading itself is uppercase and letter-spaced." />
        <MpFormGrid>
          <v-textarea label="Notes" rows="3" />
        </MpFormGrid>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Composed example ────────────────────────────────────────────────────────

/**
 * **In context.** The gift-card drawer's four sections, which before this component were four
 * copies of `text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis` with two
 * different bottom margins between them.
 */
export const InContextGiftCardSections: Story = {
  render: () => ({
    components: { MpFormSection, MpFormGrid },
    template: `
      <div>
        <MpFormSection title="General" />
        <MpFormGrid>
          <v-text-field label="Initial value *" model-value="50" type="number" prepend-inner-icon="dollar-sign" />
          <v-text-field label="Email" type="email" prepend-inner-icon="mail" />
        </MpFormGrid>

        <MpFormSection title="Expiration date" />
        <MpFormGrid>
          <v-text-field label="Expires on" type="date" model-value="2027-05-12" />
        </MpFormGrid>

        <MpFormSection title="Status" />
        <MpFormGrid>
          <v-select label="Status" :items="['Active', 'Disabled']" model-value="Active" />
        </MpFormGrid>

        <MpFormSection title="Image" description="Shown on the gift card email." />
        <MpFormGrid>
          <v-select label="Artwork" :items="['None', 'Celebration', 'Thank you']" model-value="Celebration" />
        </MpFormGrid>
      </div>
    `,
  }),
  args: {} as never,
}
