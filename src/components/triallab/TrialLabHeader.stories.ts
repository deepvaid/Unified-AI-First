import type { Meta, StoryObj } from '@storybook/vue3'
import TrialLabHeader from './TrialLabHeader.vue'

const meta = {
  title: 'Product/Trial Lab/TrialLabHeader',
  component: TrialLabHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
The Trial Lab's own top bar for a brand-new trial user. It renders only what the prototype store
supplies — a workspace switcher, the trial status chip, a reviewer toggle and a profile menu — so
the demo identity hard-coded into the real \`AppBar\` can never appear inside a flow that is meant
to start from nothing.

**Fallback rules it demonstrates:** an unnamed workspace shows **"Trial workspace"** with its stable
ID beneath; an unnamed user shows their **email** and a neutral icon. Nothing is ever inferred from
the address or its domain.

### Usage
\`\`\`html
<TrialLabHeader
  :workspaces="[{ id: 'ws_k2j1', label: 'Trial workspace', caption: 'ws_k2j1' }]"
  active-id="ws_k2j1"
  trial-label="Preview · Trial not started"
  :trial-started="false"
  email="you@company.com"
  :person-name="null"
  :reviewer-open="false"
  @rename-workspace="…" @add-name="…" @switch="…" @toggle-reviewer="…"
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    workspaces: [{ id: 'ws_k2j1x', label: 'Trial workspace', caption: 'ws_k2j1x' }],
    activeId: 'ws_k2j1x',
    trialLabel: 'Preview · Trial not started',
    trialStarted: false,
    email: 'alex.rivera@northwind.example',
    personName: null,
    reviewerOpen: false,
  },
} satisfies Meta<typeof TrialLabHeader>

export default meta
type Story = StoryObj<typeof meta>

/** Fresh signup: nothing named, trial not started. */
export const Default: Story = {}

/** Both names supplied and the clock running. */
export const Named: Story = {
  args: {
    workspaces: [{ id: 'ws_k2j1x', label: 'Northwind Trading' }],
    trialLabel: 'Trial · 12 days left',
    trialStarted: true,
    personName: 'Alex',
  },
}

/** Two unnamed workspaces — the IDs are what tells them apart in the switcher. */
export const MultiWorkspaceUnnamed: Story = {
  args: {
    workspaces: [
      { id: 'ws_k2j1x', label: 'Trial workspace', caption: 'ws_k2j1x' },
      { id: 'ws_k2j9q', label: 'Trial workspace', caption: 'ws_k2j9q' },
    ],
    activeId: 'ws_k2j9q',
    reviewerOpen: true,
  },
}
