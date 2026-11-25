import type { Meta, StoryObj } from '@storybook/vue3'
import StoreSetupProgress from './StoreSetupProgress.vue'
import { SETUP_STEP_MS, setupSteps } from '@/storefront/storeLaunch'
import { constrain } from '@/stories/decorators'

// A store made at a fixed moment, drawn at fixed moments after it: no clock runs in a story.
const MADE = '2026-11-24T10:00:00.000Z'
const after = (steps: number) => Date.parse(MADE) + SETUP_STEP_MS * steps
const FROM_THEME = setupSteps({ merchandise: true, theme: 'Daybloom', domain: 'sunday-wellness.maropost.store' })
const BLANK = setupSteps({ merchandise: false, theme: null, domain: 'new-store.maropost.store' })

const meta = {
  title: 'Product/Sales Channels/StoreSetupProgress',
  component: StoreSetupProgress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
What a store's page shows right after **Create sales channel**, while the store is being set up: its
steps, one running at a time, until the store is ready. The page shows nothing else meanwhile (no tabs,
no Preview or Edit theme), and its status chip reads "Setting up".

The steps are the store's own (\`setupSteps\` in \`src/storefront/storeLaunch.ts\`): a store connected to
Merchandise Cloud sets up search, one made from a theme names the theme, and the last step names its address.

### Behaviour
- Where setup stands is read from **when the store was made** (\`setupProgress\`), about two seconds a
  step. Nothing is stored for it, so a reload or another tab shows the same step, and a store made
  long ago is simply ready.
- \`ready\` is emitted once, when the last step is done; the page then shows the store's overview and a
  "… is ready" message.
- \`now\` draws a fixed moment, for stories and tests.

### A11y
- Each step says its state in words ("Done", "In progress", "Waiting"), not by its icon alone.
- A polite live region reads the step that is running, then "… is ready".
- The progress bar is named "2 of 5 setup steps done".
        `,
      },
    },
  },
  decorators: [constrain('section')],
  args: { storeName: 'Sunday Wellness', steps: FROM_THEME, startedAt: MADE, now: after(2.4) },
} satisfies Meta<typeof StoreSetupProgress>

export default meta
type Story = StoryObj<typeof meta>

/** A store made from the Daybloom theme, connected to Merchandise Cloud: two steps done, the storefront being built. */
export const Default: Story = {}

/** The moment the store is made: the first step runs, the rest wait. */
export const JustCreated: Story = {
  args: { now: after(0) },
}

/** A blank store without Merchandise Cloud: four steps, no search to set up and no theme to name. */
export const BlankStore: Story = {
  args: { storeName: 'New store', steps: BLANK, now: after(1.5) },
}

/** Every step done, as the page sees it for an instant before it shows the store's overview. */
export const Ready: Story = {
  args: { now: after(5) },
}
