import type { Meta, StoryObj } from '@storybook/vue3'
import DvToastStack from './DvToastStack.vue'
import { useDaVinciToasts, type DaVinciToastInput } from '@/composables/useDaVinciToasts'

const meta = {
  title: 'Copilot/DvToastStack',
  component: DvToastStack,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // The stack teleports to <body> and positions fixed at the bottom of the
    // viewport — render docs examples in isolated iframes so each story shows
    // its own queue (the toast state is a module singleton).
    docs: { story: { inline: false, height: '260px' } },
  },
  render: () => ({ components: { DvToastStack }, template: '<DvToastStack />' }),
} satisfies Meta<typeof DvToastStack>

export default meta
type Story = StoryObj<typeof meta>

// Stories drive the useDaVinciToasts() singleton from setup(): the queue is
// reset, then seeded with long-lived toasts so the story stays stable. The
// "Push transient toast" button demos the real enter/auto-dismiss/leave cycle.
function makeToastStory(seeds: DaVinciToastInput[]): Story {
  return {
    render: () => ({
      components: { DvToastStack },
      setup() {
        const { toasts, pushToast } = useDaVinciToasts()
        toasts.value = [] // reset the singleton between stories
        seeds.forEach((seed) => pushToast({ durationMs: 3_600_000, ...seed }))
        function pushTransient() {
          pushToast({
            title: 'Widget added',
            sub: 'Revenue by Channel → Overview',
            action: 'View',
          })
        }
        return { pushTransient }
      },
      template: `
        <div style="min-height: 220px; padding: 24px;">
          <v-btn color="primary" variant="tonal" class="text-none" @click="pushTransient">
            Push transient toast (4.2s)
          </v-btn>
          <DvToastStack />
        </div>
      `,
    }),
  }
}

/** One confirmation toast with a sub line and an action link. */
export const SingleToast: Story = makeToastStory([
  {
    title: 'Widget added to Overview',
    sub: 'Open Rate Trend · line chart',
    action: 'Undo',
  },
])

/** Three queued toasts stacking bottom-up, mixing plain and action toasts. */
export const QueuedToasts: Story = makeToastStory([
  { title: 'Draft updated', sub: 'Da Vinci re-rendered with your changes' },
  { title: 'Widget added to Overview', sub: 'Revenue by Channel · bar chart', action: 'View' },
  { title: 'Conversation saved' },
])
