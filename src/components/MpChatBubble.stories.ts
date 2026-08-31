import type { Meta, StoryObj } from '@storybook/vue3'
import MpChatBubble from './MpChatBubble.vue'
import { MESSAGES } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/MpChatBubble',
  component: MpChatBubble,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpChatBubble\` is the one transcript message: an optional avatar column, a meta row (author +
timestamp), and the bubble itself — one geometry on \`component.bubble.*\` (88% max-width,
12px radius with a 4px tail on the author's side). It replaced three hand-rolled bubble systems
(the Tickets thread, the theme-builder Da Vinci panel, the docs assistant) that had drifted to
three sets of raw px values.

**Alignment and fill are independent axes.** \`side\` places the bubble (\`start\`/\`end\`);
\`tone\` fills it (\`neutral\` surface, \`accent\` soft primary tint, \`solid\` primary). The
Tickets thread left-aligns *both* roles and distinguishes them by tint alone — don't assume
"user = right".

**Use when:** rendering a conversation transcript — support threads, assistant exchanges.

**Don't use when:** the surface simulates someone else's chrome (the chatbot widget preview and
the SMS phone mock draw merchant/device UI, deliberately bespoke), or for the flagship Da Vinci
bot whose assistant turns are card compositions, not bubbles.

### Usage
\`\`\`html
<MpChatBubble
  v-for="msg in ticket.thread"
  :key="msg.time"
  side="start"
  :tone="msg.role === 'agent' ? 'accent' : 'neutral'"
  :author="msg.author"
  :time="msg.time"
>
  <template #avatar>
    <v-avatar size="34" :color="msg.role === 'agent' ? 'primary' : 'surface-variant'">…</v-avatar>
  </template>
  {{ msg.body }}
</MpChatBubble>
\`\`\`

### Re-skinning (product surfaces)
Tones resolve through internal custom properties — \`--mp-bubble-bg\` / \`--mp-bubble-fg\` /
\`--mp-bubble-border\`. A product surface that must keep its own palette (e.g. a Da Vinci
accent) sets those on a host class applied to the component tag. Never \`:deep\`.

### 🟢 Do's
- **Do** give the thread column the rhythm (\`gap\`) — bubbles own no outer margin.
- **Do** use \`accent\`/\`solid\` for at most one role per thread; two tinted roles read as noise.
- **Do** put status stamps and source tags in \`#footer\` — they belong inside the bubble.

### 🔴 Don'ts
- **Don't** hand-roll a bubble again — the three px dialects this replaced are the cautionary tale.
- **Don't** put interactive card content inside — a bubble is text; rich assistant payloads are
  their own components beside it.

### A11y
- **Provides:** each message is an \`<article>\`; the timestamp is a real \`<time>\` element;
  body text preserves whitespace (\`pre-wrap\`) and wraps long tokens; solid bubbles declare
  their own foreground (never inherit page ink).
- **Consumer must:** pass \`author\` so screen readers attribute messages (or ensure the thread
  context makes the speaker obvious), and keep avatars decorative (\`aria-hidden\`) when the
  author name is present.
- **Gaps:** no built-in "new message" live region — a live transcript should wrap the thread in
  its own \`aria-live="polite"\` container.

### API
Props \`side\` · \`tone\` · \`author?\` · \`time?\` · \`loading?\`. Slots: \`#avatar\`, default
(body; also the loading label), \`#footer\`.
        `,
      },
    },
  },
  args: {
    side: 'start',
    tone: 'neutral',
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['start', 'end'],
      description: 'Which side the bubble sits on. Independent of tone.',
    },
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'accent', 'solid'],
      description: 'Fill: neutral = surface + hairline · accent = soft primary tint · solid = primary fill.',
    },
    author: { control: 'text', description: 'Sender name in the meta row above the bubble.' },
    time: { control: 'text', description: 'Timestamp label, rendered in a real `<time>` element (right-aligned).' },
    loading: { control: 'boolean', description: 'Typing/pending state — spinner + the default slot text (default "Thinking…").' },
    avatar: { control: false, description: 'Slot — the avatar column (consumer supplies a v-avatar).', table: { category: 'slots' } },
    default: { control: false, description: 'Slot — the message body (pre-wrap). Doubles as the loading label.', table: { category: 'slots' } },
    footer: { control: false, description: 'Slot — in-bubble meta under the body: delivery stamps, source tags.', table: { category: 'slots' } },
  },
} satisfies Meta<typeof MpChatBubble>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { MpChatBubble },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 560px;">
        <MpChatBubble v-bind="args" author="Sofia Thompson" time="09:12">
          Hi — my order arrived but the jacket is the wrong size. Can I exchange it?
        </MpChatBubble>
      </div>
    `,
  }),
}

/** Side × tone are independent — six combinations, one geometry. */
export const Variants: Story = {
  render: () => ({
    components: { MpChatBubble },
    template: `
      <div class="d-flex flex-column ga-4" style="max-width: 560px;">
        <MpChatBubble side="start" tone="neutral">start · neutral — the default incoming message.</MpChatBubble>
        <MpChatBubble side="start" tone="accent">start · accent — an agent reply in a left-aligned thread.</MpChatBubble>
        <MpChatBubble side="start" tone="solid">start · solid — rare, but the axes stay independent.</MpChatBubble>
        <MpChatBubble side="end" tone="neutral">end · neutral</MpChatBubble>
        <MpChatBubble side="end" tone="accent">end · accent — a user turn in an assistant chat.</MpChatBubble>
        <MpChatBubble side="end" tone="solid">end · solid — the classic sent-message look.</MpChatBubble>
      </div>
    `,
  }),
  args: {} as never,
}

/** Avatar, meta row, in-bubble footer, and the loading (typing) state. */
export const States: Story = {
  render: () => ({
    components: { MpChatBubble },
    template: `
      <div class="d-flex flex-column ga-4" style="max-width: 560px;">
        <MpChatBubble side="start" tone="accent" author="Maya (Support)" time="09:30">
          <template #avatar><v-avatar size="34" color="primary"><span class="text-caption">M</span></v-avatar></template>
          I've set up a free exchange — the replacement ships today.
          <template #footer>Delivered · 09:31</template>
        </MpChatBubble>
        <MpChatBubble side="end" tone="solid" time="09:32">
          Amazing, thank you!
        </MpChatBubble>
        <MpChatBubble side="start" tone="neutral" loading>Reading the docs…</MpChatBubble>
      </div>
    `,
  }),
  args: {} as never,
}

// ── Scenarios ────────────────────────────────────────────────────────────────

/** A left-aligned support thread (the Tickets pattern): both roles side="start",
 * the agent distinguished by tint — alignment and tone are independent. */
export const Conversation: Story = {
  render: () => ({
    components: { MpChatBubble },
    setup: () => ({ messages: MESSAGES }),
    template: `
      <div class="d-flex flex-column ga-4" style="max-width: 640px;">
        <MpChatBubble
          v-for="msg in messages"
          :key="msg.id"
          :side="msg.side"
          :tone="msg.tone"
          :author="msg.author"
          :time="msg.time"
        >
          <template #avatar>
            <v-avatar size="34" :color="msg.tone === 'accent' ? 'primary' : 'surface-variant'" :variant="msg.tone === 'accent' ? 'flat' : 'tonal'">
              <span class="text-caption font-weight-medium">{{ msg.avatar }}</span>
            </v-avatar>
          </template>
          {{ msg.body }}
        </MpChatBubble>
      </div>
    `,
  }),
  args: {} as never,
}
