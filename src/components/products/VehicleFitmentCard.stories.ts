import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import VehicleFitmentCard from './VehicleFitmentCard.vue'
import { constrain, overlayDocs } from '@/stories/decorators'
import { demoStoreFor } from '@/storefront/demoStores'
import { snapshotFor } from '@/storefront/demoStores/install'
import { positionsFor, sortRows } from '@/storefront/fitmentForm'
import type { Fitment } from '@/storefront/fitment'

// Torqline Auto Parts (demo)'s parts and the vehicles they fit, from the store's seed.
const torqline = snapshotFor(demoStoreFor('torqline').homeChannel, 'torqline', '2026-11-20')
function part(id: number) {
  const product = torqline.products.find((p) => p.id === id)
  if (!product?.detail?.fitment) throw new Error(`No Torqline part ${id}`)
  return { name: product.name, fitment: product.detail.fitment, positions: positionsFor(product.detail.options) }
}
const pads = part(4001)
const oil = part(4010)

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const buttonIn = (root: ParentNode | null | undefined, text: string) =>
  [...(root?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find((b) => b.textContent?.trim() === text)
const drawer = () => document.querySelector<HTMLElement>('.mp-form-drawer')

/** Opens the Add vehicle drawer from the card's toolbar. */
async function openDrawer() {
  await wait(300)
  buttonIn(document.querySelector('.vfc'), 'Add vehicle')?.click()
  await wait(400)
}

/** Picks an option in one of the drawer's selects, as the keyboard does: Enter opens the list. */
async function pick(label: string, option: string) {
  const field = [...(drawer()?.querySelectorAll<HTMLElement>('.v-select') ?? [])]
    .find((el) => el.querySelector('label')?.textContent?.trim().startsWith(label))
  const input = field?.querySelector('input')
  if (!input) return
  input.focus()
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await wait(300)
  const item = [...document.querySelectorAll<HTMLElement>('.v-overlay--active .v-list-item')].find((el) => el.textContent?.trim() === option)
  item?.click()
  await wait(200)
}

const meta = {
  title: 'Product/Products/VehicleFitmentCard',
  component: VehicleFitmentCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The **Vehicle fitment** card on a part's page in Products: the vehicles the part fits
(\`detail.fitment\`), or **Universal fit** for a part that fits every vehicle. The storefront reads
it for the fit badge on cards, the banner under the product title and the product page's Vehicle
fit row.

### Behaviour
- The product editor shows it on a product that carries fitment, and on any product of a store
  that sells parts (another of its products carries fitment). Never on other stores' products.
- **Universal fit** on hides the table. When the part lists vehicles, it asks first: they are
  removed.
- The table lists Make, Model, Years, Position and Note, in one order: make, model, then year.
  A row is one model over a run of years, so the toolbar counts both ("5 models · 11 rows").
  Position is a column only for a part sold by position (\`positions\`, from its Position option)
  or one whose rows already name one. Search finds rows by make or model. Selecting rows opens
  the bulk bar, whose Remove asks first; each row's own remove button is named for its row
  ("Remove 2015–2020 Ford F-150"). The bar and the confirms sit beside the card, not inside it.
- **Add vehicle** opens a drawer: Make, then Model (that make's models), then the first and last
  year (that model's years), an optional note, and a position when the part is sold by one. A row
  the part already lists, or one whose years and position meet a listed row of the same model, is
  refused on the model field. A row with no position fits either end, so it meets front and rear.
- Every change is saved with the page's Save. The rules are pure: \`src/storefront/fitmentForm.ts\`.
        `,
      },
    },
  },
  decorators: [constrain('section')],
  args: { modelValue: pads.fitment, productName: pads.name, positions: pads.positions },
  render: (args) => ({
    components: { VehicleFitmentCard },
    setup() {
      const fitment = ref<Fitment | undefined>(args.modelValue)
      return { args, fitment }
    },
    template: '<VehicleFitmentCard v-bind="args" v-model="fitment" />',
  }),
} satisfies Meta<typeof VehicleFitmentCard>

export default meta
type Story = StoryObj<typeof meta>

/** Torqline's truck and SUV brake pads, and the vehicles they fit. */
export const Default: Story = {}

/** Motor oil fits every vehicle, so it lists none. */
export const Universal: Story = {
  args: { modelValue: oil.fitment, productName: oil.name, positions: oil.positions },
}

/** A new part in a store that sells parts: no vehicles listed yet. */
export const Empty: Story = {
  args: { modelValue: undefined, productName: 'Heavy-Duty Tow Strap', positions: [] },
}

/** Add vehicle opened: Make first, then the make's models, then the model's years. */
export const Adding: Story = {
  parameters: overlayDocs('760px'),
  play: openDrawer,
}

/** The 2015–2020 Ford F-150 again: the part already lists it, so it is refused on the model field. */
export const DuplicateError: Story = {
  parameters: overlayDocs('760px'),
  play: async () => {
    const rows = sortRows(pads.fitment.rows)
    const row = rows.find((r) => r.make === 'Ford' && r.model === 'F-150') ?? rows[0]
    await openDrawer()
    if (!row) return
    await pick('Make', row.make)
    await pick('Model', row.model)
    await pick('Year from', String(row.yearFrom))
    await pick('Year to', String(row.yearTo))
    if (row.position) await pick('Position', row.position)
    buttonIn(drawer(), 'Add vehicle')?.click()
  },
}
