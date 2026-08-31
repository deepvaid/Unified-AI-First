import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import MpAlert from './MpAlert.vue'

const meta = {
  title: 'Molecules/MpAlert',
  component: MpAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpAlert\` is the one in-page feedback block: a rounded, borderless soft-fill callout in four
semantic tones, with an optional title, actions row and dismiss button. It enforces the
role/\`aria-live\` pairing that raw \`v-alert\` leaves to each call site — info/success announce
politely as \`role="status"\`, warning/error interrupt as \`role="alert"\` — and prefixes a
visually-hidden tone label so severity never rides on color alone.

**Use when:** persistent feedback is attached to a region of the page — a plan limit, a sync
problem, an over-cap validation summary, an instructional caveat with a real consequence.

**Don't use when:** the feedback is transient (\`useToast\`), spans the whole app frame
(\`MpBanner\` — the square edge strip), replaces a surface that failed to load (\`MpErrorState\`),
or means "nothing here yet" (\`MpEmptyState\`).

### Usage
\`\`\`html
<MpAlert tone="warning" title="Sync issue" dismissible @dismiss="hidden = true">
  3 products failed to sync to this channel.
  <template #actions>
    <v-btn size="small" variant="outlined" class="text-none">Review sync</v-btn>
  </template>
</MpAlert>
\`\`\`

### Two \`tone\` vocabularies (deliberate)
\`MpDialog\`/\`MpEmptyState\` carry a *surface-state* tone (\`'neutral' | 'error'\` — is this whole
surface in an error state). \`MpAlert\`/\`MpBanner\` carry a *feedback-severity* tone
(\`'info' | 'success' | 'warning' | 'error'\`). Don't unify them — they answer different questions.

### 🟢 Do's
- **Do** compose \`MpAlert\` in new code — never a raw \`v-alert\` (the ~40 legacy sites are
  grandfathered, not precedent).
- **Do** keep the body one or two sentences; put the remedy in \`#actions\`, not the prose.
- **Do** pass \`live="polite"\` explicitly on a warning whose content re-renders often (live
  counts) so it doesn't interrupt on every keystroke.

### 🔴 Don'ts
- **Don't** stack more than one alert per region — merge or promote to \`MpBanner\`.
- **Don't** use \`dismissible\` for feedback the user must resolve — dismissing an unresolved
  error is a dead end.
- **Don't** reach for \`tone="info"\` as decoration — an alert with no consequence is body copy.

### A11y
- **Provides:** \`role="status"\`+polite (info/success) or \`role="alert"\`+assertive
  (warning/error), overridable via \`live\`; a \`d-sr-only\` tone prefix ("Warning: …"); the icon
  is \`aria-hidden\` (the prefix already announces severity); a labelled dismiss button; every
  tone pair is contrast-checked (\`npm run contrast:check\`).
- **Consumer must:** own visibility (\`v-if\` + \`@dismiss\`), keep the body meaningful without
  color, and give action buttons verb labels.
- **Gaps:** an alert rendered with the initial page (not in response to interaction) may not be
  announced by all screen readers — that's inherent to live regions, not a defect.

### API
Props \`tone\` · \`title?\` · \`live?\` · \`dismissible?\` · \`icon?: string | false\` (defaults per
tone: info \`info\`, success \`circle-check\`, warning \`triangle-alert\`, error \`circle-alert\`).
Emits \`dismiss\`. Slots: default (body), \`#actions\`.
        `,
      },
    },
  },
  args: {
    tone: 'info',
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'error'],
      description: 'Feedback severity — drives tint (semantic container pairs), default icon, role and aria-live.',
    },
    title: {
      control: 'text',
      description: 'Optional bold line above the body.',
    },
    live: {
      control: 'inline-radio',
      options: ['off', 'polite', 'assertive'],
      description: "Live-region politeness override. Defaults by tone: info/success 'polite', warning/error 'assertive'.",
    },
    dismissible: {
      control: 'boolean',
      description: 'Renders a dismiss button. Visibility stays consumer-owned: v-if + @dismiss.',
    },
    icon: {
      control: 'text',
      description: 'Lucide icon override; pass `false` to hide. Defaults per tone.',
    },
    default: {
      control: false,
      description: 'Slot — the alert body. Keep it to one or two sentences.',
      table: { category: 'slots' },
    },
    actions: {
      control: false,
      description: 'Slot — remedy buttons (small outlined/text v-btns), rendered under the body.',
      table: { category: 'slots' },
    },
  },
} satisfies Meta<typeof MpAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpAlert },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 560px;">
        <MpAlert v-bind="args">Contacts imported from a CSV keep their original subscription status.</MpAlert>
      </div>
    `,
  }),
}

/** The four semantic tones on the contrast-checked container pairs. Info tints from the
 * accent container (info === primary — there is deliberately no separate info container). */
export const Variants: Story = {
  render: () => ({
    components: { MpAlert },
    template: `
      <div class="d-flex flex-column ga-3" style="max-width: 560px;">
        <MpAlert tone="info">Contacts imported from a CSV keep their original subscription status.</MpAlert>
        <MpAlert tone="success">Domain verified — campaigns now send from your own address.</MpAlert>
        <MpAlert tone="warning">This segment references a deleted field and may match fewer contacts than expected.</MpAlert>
        <MpAlert tone="error">The audience exceeds your plan's send limit. Reduce the selection to continue.</MpAlert>
      </div>
    `,
  }),
  args: {} as never,
}

/** Title, actions, dismissible, and a long body wrapping inside the block. */
export const States: Story = {
  render: () => ({
    components: { MpAlert },
    setup() {
      const visible = ref(true)
      return { visible }
    },
    template: `
      <div class="d-flex flex-column ga-3" style="max-width: 560px;">
        <MpAlert tone="warning" title="Sync issue">
          3 products failed to sync to this channel.
          <template #actions>
            <v-btn size="small" variant="outlined" class="text-none">Review sync</v-btn>
            <v-btn size="small" variant="text" class="text-none">Dismiss for now</v-btn>
          </template>
        </MpAlert>
        <MpAlert v-if="visible" tone="info" dismissible @dismiss="visible = false">
          Dismissible — visibility is owned by the consumer (v-if + @dismiss).
        </MpAlert>
        <MpAlert tone="error" title="Import failed">
          214 rows were rejected because the email column contained values that are not valid
          addresses. Fix the source file and run the import again — successfully imported rows
          are unaffected and will not be duplicated.
        </MpAlert>
      </div>
    `,
  }),
  args: {} as never,
}
