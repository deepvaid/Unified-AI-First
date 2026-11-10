import type { Meta, StoryObj } from '@storybook/vue3'
import { reactive, ref } from 'vue'
import MpRichTextArea from './MpRichTextArea.vue'
import { constrain } from '@/stories/decorators'
import { TEMPLATE_TAG_GROUPS } from '@/service/model'

const SIGNATURE = '<p>Thanks,<br>{{AGENT_NAME}}<br><em>{{AGENT_JOB_TITLE}}</em></p>'
const REPLY = [
  '<p>Hi {{CONTACT_FIRST_NAME}},</p>',
  '<p>Thanks for getting in touch about <strong>{{TICKET_SUBJECT}}</strong>. We have:</p>',
  '<ul><li><p>refunded the original payment</p></li><li><p>emailed you a returns label</p></li></ul>',
  '<p>Track it any time on <a href="https://example.com/orders">your orders page</a>.</p>',
].join('')

const meta = {
  title: 'Molecules/MpRichTextArea',
  component: MpRichTextArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpRichTextArea\` is the rich-text field (Tiptap 3): one formatting toolbar row — Bold, Italic,
Underline | Bulleted list, Numbered list | Link | Quote | Insert tag — over an editable area drawn
in the outlined-field look. Label, hint, error and the required mark follow the field contract
(static top label, 1px boundary, 2px on focus and on error, error wins).

The model is **HTML**. An empty editor emits \`''\`, not \`<p></p>\`, so a required check can test
the string. Incoming HTML only replaces the document when it differs from what the editor holds,
so the echo of a keystroke never moves the cursor.

**Insert tag** appears when \`tagGroups\` is set and types the literal \`{{KEY}}\` at the cursor
(\`TEMPLATE_TAG_GROUPS\` in \`src/service/model.ts\`).

**Use when:** the content is formatted copy — reply templates, signatures, notification bodies.

**Don't use when:** the value is plain text (use \`v-textarea\` with \`rows\`), or the surface is a
full email/page builder.

### Usage
\`\`\`html
<MpRichTextArea v-model="inbox.signature" label="Signature" :tag-groups="agentTags" :rows="3" />
<!-- composer chrome, no visible label -->
<MpRichTextArea v-model="draft" aria-label="Reply" placeholder="Write a reply…" />
\`\`\`

### A11y
- **Provides:** the editable area is \`role="textbox"\` \`aria-multiline\`, named by the label (or
  \`ariaLabel\`), described by the hint/error, with \`aria-required\` / \`aria-invalid\`. The toolbar
  is \`role="toolbar"\` with one tab stop (←/→/Home/End move between tools); toggles carry
  \`aria-pressed\` from the editor's state; every tool has a name and a tooltip; pressing a tool
  keeps the editor's selection. Link opens a small dialog (URL, Apply, Remove link); Insert tag
  is a \`role="menu"\` grouped under labelled subheaders.
- **Consumer must:** pass \`label\` or \`ariaLabel\`.
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'text', description: 'HTML. An empty editor emits an empty string.' },
    label: { control: 'text', description: 'Static top label.' },
    ariaLabel: { control: 'text', description: 'Accessible name when there is no visible label.' },
    required: { control: 'boolean', description: 'Trailing " *" on the label and aria-required on the textbox.' },
    hint: { control: 'text', description: 'Supporting text under the field.' },
    error: { control: 'text', description: 'Error message; replaces the hint and wins over focus styling.' },
    placeholder: { control: 'text', description: 'Shown while empty — an example, never the label.' },
    rows: { control: 'inline-radio', options: [3, 5, 8], description: 'Minimum visible lines (3 short · 5 default · 8 long-form). Scrolls past twice this.' },
    disabled: { control: 'boolean', description: 'Not editable; the toolbar is disabled.' },
    tagGroups: { control: 'object', description: 'Enables the Insert tag menu: `{ title, tags: { key, label }[] }[]`.' },
  },
  args: {
    modelValue: REPLY,
    label: 'Reply template',
    hint: 'Tags like {{CONTACT_FIRST_NAME}} are filled in when the reply is sent.',
    rows: 5,
  },
  decorators: [constrain('dialog')],
} satisfies Meta<typeof MpRichTextArea>

export default meta
type Story = StoryObj<typeof meta>

/** Label + hint, with v-model wired so the HTML below updates as you type. */
export const Default: Story = {
  render: (args) => ({
    components: { MpRichTextArea },
    setup() {
      const html = ref(args.modelValue)
      return { args, html }
    },
    template: `
      <div class="d-flex flex-column ga-4">
        <MpRichTextArea v-bind="args" v-model="html" />
        <pre class="text-caption text-medium-emphasis" style="white-space: pre-wrap; overflow-wrap: anywhere;">{{ html }}</pre>
      </div>
    `,
  }),
}

/** Variants — the plain toolbar, and with the Insert tag menu (tagGroups). */
export const Variants: Story = {
  render: () => ({
    components: { MpRichTextArea },
    setup() {
      const values = reactive({ plain: REPLY, tags: SIGNATURE })
      return { values, groups: TEMPLATE_TAG_GROUPS }
    },
    template: `
      <div class="d-flex flex-column ga-6">
        <MpRichTextArea v-model="values.plain" label="Plain toolbar" :rows="3" />
        <MpRichTextArea
          v-model="values.tags"
          label="With Insert tag"
          hint="Put the cursor where the tag should go, then pick one from the braces menu."
          :rows="3"
          :tag-groups="groups"
        />
      </div>
    `,
  }),
}

/** Sizes — the rows ramp: 3 (short), 5 (default), 8 (long-form). Each scrolls past twice its rows. */
export const Sizes: Story = {
  render: () => ({
    components: { MpRichTextArea },
    setup() {
      const values = reactive<Record<number, string>>({ 3: '', 5: '', 8: '' })
      return { values, ramp: [3, 5, 8] }
    },
    template: `
      <div class="d-flex flex-column ga-6">
        <MpRichTextArea
          v-for="rows in ramp"
          :key="rows"
          v-model="values[rows]"
          :label="'rows=' + rows"
          :rows="rows"
          placeholder="Start typing…"
        />
      </div>
    `,
  }),
}

/** States — disabled, error (wins over focus), required, and placeholder-only with ariaLabel. */
export const States: Story = {
  render: () => ({
    components: { MpRichTextArea },
    setup() {
      const values = reactive({ disabled: SIGNATURE, error: '', required: '', bare: '' })
      return { values, groups: TEMPLATE_TAG_GROUPS }
    },
    template: `
      <div class="d-flex flex-column ga-6">
        <MpRichTextArea v-model="values.disabled" label="Disabled" :rows="3" disabled :tag-groups="groups" />
        <MpRichTextArea
          v-model="values.error"
          label="Error"
          required
          :rows="3"
          error="Enter the reply body."
          hint="Not shown while there is an error."
        />
        <MpRichTextArea v-model="values.required" label="Required" required :rows="3" hint="Every inbox needs a signature." />
        <MpRichTextArea v-model="values.bare" aria-label="Reply" placeholder="Write a reply…" :rows="3" />
      </div>
    `,
  }),
}
