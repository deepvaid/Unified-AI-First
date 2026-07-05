import type { Meta, StoryObj } from '@storybook/vue3'
import type { FlowNode } from '@/stores/journeyFlowData'
import { dataJourneyTemplates, instantiateTemplate } from '@/stores/journeyFlowData'
import JourneyMiniPreview from './JourneyMiniPreview.vue'

/** First `count` nodes of a flow with the tail edge cleared → a pure linear run. */
function linearSlice(nodes: FlowNode[], count: number): FlowNode[] {
  const sliced = nodes.slice(0, count).map((n) => ({ ...n, children: [...n.children] }))
  const last = sliced[sliced.length - 1]
  if (last) last.children = []
  return sliced
}

const LINEAR_NODES = linearSlice(instantiateTemplate('abandoned-cart', 0), 4)
const BRANCHED_NODES = instantiateTemplate('welcome', 0)
const NESTED_NODES = instantiateTemplate('lapsed-buyer', 0)
const DATA_NODES = dataJourneyTemplates[0]!.nodes

const meta = {
  title: 'Marketing/JourneyMiniPreview',
  component: JourneyMiniPreview,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`JourneyMiniPreview\` is the read-only thumbnail of a journey graph — category-tinted pills
joined by hairline connectors, with branch columns that mirror the full canvas (rejoin, dead-end,
or empty "·"). It is used inside template pickers (\`CreateJourney\`, \`DataJourneys\`), typically
in an \`MpOptionCard\` media slot.

Pass a flat \`nodes\` array at the root; the component builds its own segments (the \`segments\`
prop exists for its internal branch recursion only).
        `,
      },
    },
  },
  argTypes: {
    nodes: { control: false },
    segments: { control: false },
  },
  args: {
    nodes: LINEAR_NODES,
  },
  render: (args) => ({
    components: { JourneyMiniPreview },
    setup: () => ({ args }),
    template: `
      <div class="bg-background border rounded-lg pa-4 d-flex justify-center" style="width: 340px; overflow-x: auto;">
        <JourneyMiniPreview :nodes="args.nodes" />
      </div>
    `,
  }),
} satisfies Meta<typeof JourneyMiniPreview>

export default meta
type Story = StoryObj<typeof meta>

/** A straight trigger → delay → email → delay run. */
export const Linear: Story = {}

/** Welcome Series: YES/NO branches that rejoin at a shared tag step. */
export const Branched: Story = {
  args: { nodes: BRANCHED_NODES },
}

/** Lapsed Buyer: an A/B split nested inside the NO branch. */
export const NestedSplit: Story = {
  args: { nodes: NESTED_NODES },
}

/** A data-journey template (Salesforce Lead Sync) — same pills, data palette icons. */
export const DataJourney: Story = {
  args: { nodes: DATA_NODES },
}
