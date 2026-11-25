import type { Meta, StoryObj } from '@storybook/vue3'
import StorefrontVehicleSelector from './StorefrontVehicleSelector.vue'
import { torqlineFrame } from './product/productStoryFixtures'

const meta = {
  title: 'Product/Storefront/StorefrontVehicleSelector',
  component: StorefrontVehicleSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The shopper's vehicle on an auto-parts store (Torqline), chosen **Year → Make → Model**. The vehicle
drawer and the home page's vehicle finder both use it; shown here in Torqline's theme.

### Behaviour
- Three native \`<select>\`s with visible labels, from the store's vehicle table (\`yearsOf\`,
  \`makesFor\`, \`modelsFor\` in src/storefront/fitment.ts). Make waits for a year and Model for a
  make: each is disabled until the one before it is chosen.
- Changing the year keeps the make and model while that year still offers them.
- The submit button is never disabled. Pressed with something missing, it says what under that
  select ("Choose a model"), marks it invalid and moves focus there.
- It only chooses: \`submit\` hands the vehicle to the parent, \`clear\` (with \`clearable\`, while a
  vehicle is chosen) asks to forget it. \`layout="row"\` puts the selects and button side by side
  on a wide screen.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [torqlineFrame('440px')],
  args: { vehicle: null, submitLabel: 'Save vehicle', clearable: false, layout: 'stack' },
} satisfies Meta<typeof StorefrontVehicleSelector>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing chosen yet: Make and Model wait for a year. */
export const Default: Story = {}

/** The vehicle chosen before, with Clear vehicle (the drawer). */
export const WithVehicle: Story = {
  args: { vehicle: { year: 2019, make: 'Ford', model: 'F-150' }, clearable: true },
}

/** Side by side, as the home page's vehicle finder lays it out. */
export const Row: Story = {
  args: { layout: 'row', submitLabel: 'Find parts' },
  decorators: [torqlineFrame('960px')],
}

/** Saved with the model missing: it says so under Model and focus goes there. */
export const MissingModel: Story = {
  play: async ({ canvasElement }) => {
    const selects = canvasElement.querySelectorAll<HTMLSelectElement>('select')
    const choose = (select: HTMLSelectElement, value: string) => {
      select.value = value
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
    choose(selects[0]!, '2015')
    await new Promise((resolve) => setTimeout(resolve, 50))
    choose(selects[1]!, 'Honda')
    await new Promise((resolve) => setTimeout(resolve, 50))
    canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
  },
}
