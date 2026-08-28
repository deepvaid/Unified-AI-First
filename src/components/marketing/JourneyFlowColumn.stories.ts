import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import { buildSegments } from '@/composables/useFlowTree'
import type { FlowNode } from '@/stores/journeyFlowData'
import { dataJourneyTemplates, dataNodeCatalog, instantiateFrom, instantiateTemplate } from '@/stores/journeyFlowData'
import JourneyFlowColumn from './JourneyFlowColumn.vue'

/** First `count` nodes of a flow with the tail edge cleared → a pure linear run. */
function linearSlice(nodes: FlowNode[], count: number): FlowNode[] {
  const sliced = nodes.slice(0, count).map((n) => ({ ...n, children: [...n.children] }))
  const last = sliced[sliced.length - 1]
  if (last) last.children = []
  return sliced
}

// Realistic graphs from the journey template gallery (journeyFlowData.ts).
const LINEAR = buildSegments(linearSlice(instantiateTemplate('abandoned-cart', 0), 4))
const BRANCHED = buildSegments(instantiateTemplate('welcome', 0))
const NESTED = buildSegments(instantiateTemplate('lapsed-buyer', 0))
const EMPTY_BRANCH = buildSegments(instantiateTemplate('advocacy', 0))
const SELECTABLE = buildSegments(instantiateTemplate('abandoned-cart', 1))
const DATA_FLOW = buildSegments(instantiateFrom(dataJourneyTemplates[0]!, 'sb'))

const meta = {
  title: 'Product/Marketing/Journeys/JourneyFlowColumn',
  component: JourneyFlowColumn,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`JourneyFlowColumn\` renders one vertical run of the journey builder canvas: node cards with a
category-tinted header, connectors, hover-revealed add-step (+) menus on every edge, and a
per-node kebab menu (Configure / Duplicate / Delete). Filter nodes recurse into side-by-side
branch columns that can rejoin, dead-end, or stay empty (dashed "Add step" target).

Build \`segments\` from a flat \`FlowNode[]\` with \`buildSegments\` (\`useFlowTree.ts\`). The
optional \`catalog\` prop swaps the add-step palette (marketing vs data journeys). In these
stories only \`select\` is wired (click a card to move the selection ring); \`add\`, \`duplicate\`
and \`remove\` are graph edits owned by JourneyBuilder.
        `,
      },
    },
  },
  args: {
    segments: LINEAR,
    selectedId: null,
  },
  argTypes: {
    flashId: { control: 'text', description: 'Node to pulse once, for jump-to-issue. The parent clears it on a timer \u2014 the column does not reset it.' },
    segments: {
      control: false,
      description: '`FlowSegment[]` — the journey\'s nodes in order, already grouped into segments. Each node\'s `category` picks the accent that drives its spine, icon tile and eyebrow from one colour.',
    },
    selectedId: {
      control: false,
      description: 'Id of the currently selected node, or `null` for none. Selection is controlled — the column emits `select` and never changes this itself.',
    },
    catalog: {
      control: false,
      description: '`CatalogItem[]` offered by the add-step menus. Defaults to the marketing catalog; pass a narrower list to restrict what can be inserted.',
    },
  },
  render: (args) => ({
    components: { JourneyFlowColumn },
    setup() {
      const selected = ref<string | null>(args.selectedId ?? null)
      return { args, selected }
    },
    template: `
      <div class="bg-background rounded-lg pa-8" style="overflow-x: auto;">
        <div class="d-flex flex-column align-center mx-auto" style="min-width: 460px; width: max-content;">
          <JourneyFlowColumn :segments="args.segments" :selected-id="selected" :catalog="args.catalog"
            @select="id => selected = id" />
        </div>
      </div>
    `,
  }),
} satisfies Meta<typeof JourneyFlowColumn>

export default meta
type Story = StoryObj<typeof meta>

/** Trigger → delay → email → delay, ending in the dashed "End of journey" card. */
export const LinearFlow: Story = {}

/** Welcome Series: a YES/NO filter whose branches rejoin at a shared tag step. */
export const BranchedFlow: Story = {
  args: { segments: BRANCHED },
}

/** Lapsed Buyer: an A/B split nested inside the NO branch of a YES/NO filter. */
export const NestedSplit: Story = {
  args: { segments: NESTED },
}

/** Advocacy: the NO branch is empty and renders the dashed add-step target. */
export const EmptyBranch: Story = {
  args: { segments: EMPTY_BRANCH },
}

/** A node pre-selected via `selectedId` — primary ring; click other cards to move it. */
export const SelectedNode: Story = {
  args: { segments: SELECTABLE, selectedId: 'j1-c3' },
}

/** Data-journey flow with `catalog` swapped to the data palette (open a + menu). */
export const DataJourneyCatalog: Story = {
  args: { segments: DATA_FLOW, catalog: dataNodeCatalog },
}
