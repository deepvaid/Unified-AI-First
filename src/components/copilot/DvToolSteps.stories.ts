import type { Meta, StoryObj } from '@storybook/vue3'
import DvToolSteps from './DvToolSteps.vue'

const meta = {
  title: 'Product/Da Vinci/DvToolSteps',
  component: DvToolSteps,
  tags: ['autodocs'],
  argTypes: {
    steps: {
      control: 'object',
      description: 'Named tool steps with optional icon and pending/running/done status'
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Start expanded (live generation) instead of collapsed (finished reply)'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvToolSteps is the copilot's agent-transparency disclosure: a collapsible "N steps" row that names the tool steps Da Vinci ran (or is running) to produce a reply. Collapsed by default on finished replies; expanded with live pending → running → done statuses during generation.

## Do's
- Attach to assistant replies that did visible work (queried data, drafted something)
- Use short verb-first labels ("Query revenue · last 7 days", "Draft widget")
- Show it expanded while generating, collapsed once the reply lands

## Don'ts
- Don't list more than ~4 steps — group instead
- Don't use it for plain conversational replies with no work behind them
        `
      }
    }
  }
} satisfies Meta<typeof DvToolSteps>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    steps: [
      { label: 'Check store setup', status: 'done' },
      { label: 'Suggest next steps', status: 'done' },
    ],
    defaultOpen: false,
  },
}



/** Collapsed vs expanded — the structural axis, set by `defaultOpen`. */
export const Variants: Story = {
  render: () => ({
    components: { DvToolSteps },
    setup: () => ({
      steps: [
        { label: 'Query revenue · last 7 days', status: 'done' },
        { label: 'Compare vs prior week', status: 'done' },
      ],
    }),
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">collapsed</div>
          <DvToolSteps :steps="steps" :default-open="false" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">expanded</div>
          <DvToolSteps :steps="steps" :default-open="true" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Step-count is the size axis. */
export const Sizes: Story = {
  render: () => ({
    components: { DvToolSteps },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">one step</div>
          <DvToolSteps :steps="[{ label: 'Check store setup', status: 'done' }]" :default-open="true" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">four steps</div>
          <DvToolSteps
            :steps="[
              { label: 'Check store setup', status: 'done' },
              { label: 'Query revenue · last 7 days', status: 'done' },
              { label: 'Compare vs prior week', status: 'done' },
              { label: 'Draft a summary', status: 'running' },
            ]"
            :default-open="true"
          />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

/** Every step status: done, running, and a mixed run in progress. */
export const States: Story = {
  render: () => ({
    components: { DvToolSteps },
    template: `
      <div class="d-flex flex-column ga-6">
        <div>
          <div class="text-caption text-medium-emphasis mb-2">all done</div>
          <DvToolSteps :steps="[{ label: 'Query revenue', status: 'done' }, { label: 'Summarise', status: 'done' }]" :default-open="true" />
        </div>
        <div>
          <div class="text-caption text-medium-emphasis mb-2">running — mid-flight</div>
          <DvToolSteps :steps="[{ label: 'Query revenue', status: 'done' }, { label: 'Summarise', status: 'running' }]" :default-open="true" />
        </div>
      </div>
    `,
  }),
  args: {} as never,
}

export const CollapsedDone: Story = {
  args: {
    steps: [
      { label: 'Check store setup', status: 'done' },
      { label: 'Suggest next steps', status: 'done' }
    ],
    defaultOpen: false
  }
}

export const ExpandedDone: Story = {
  args: {
    steps: [
      { label: 'Query revenue · last 7 days', status: 'done' },
      { label: 'Compare vs prior week', status: 'done' }
    ],
    defaultOpen: true
  }
}

export const Running: Story = {
  args: {
    steps: [
      { label: 'Check Home dashboard widgets', status: 'done' },
      { label: 'Pull revenue · last 30 days', status: 'running' },
      { label: 'Draft widget', status: 'pending', icon: 'wrench' }
    ],
    defaultOpen: true
  }
}

export const SingleStep: Story = {
  args: {
    steps: [{ label: 'Consult Da Vinci brain', status: 'done' }],
    defaultOpen: false
  }
}
