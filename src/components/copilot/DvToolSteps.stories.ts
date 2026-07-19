import type { Meta, StoryObj } from '@storybook/vue3'
import DvToolSteps from './DvToolSteps.vue'

const meta = {
  title: 'Copilot/DvToolSteps',
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
