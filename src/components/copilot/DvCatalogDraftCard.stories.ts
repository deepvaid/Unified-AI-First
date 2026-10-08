import type { Meta, StoryObj } from '@storybook/vue3'
import DvCatalogDraftCard from './DvCatalogDraftCard.vue'
import { grid } from '@/stories/storyTemplate'
import { constrain } from '@/stories/decorators'
import {
  generateCreateDraft,
  generateEnrichDraft,
  type CatalogGenOutcome,
  type CatalogGenSuccess,
  type ProductSnapshot,
} from '@/composables/useCatalogGenerator'

// Fixtures come from the real generator, so the story always shows what the drawer shows.
const VOCAB = {
  categories: ['Electronics', 'Apparel', 'Home & Kitchen', 'Sports & Outdoors', 'Beauty & Health', 'Tools & Garden'],
  collections: ['Coffee Tables', 'Chairs'],
  brands: ['Local Artisan'],
}

function success(outcome: CatalogGenOutcome): CatalogGenSuccess {
  if (!outcome.ok) throw new Error(outcome.message)
  return outcome
}

const SEED: ProductSnapshot = {
  name: 'Allbirds Tree Runners - Wool White', subtitle: '', sku: 'SKU-10009', description: '', brand: 'Global Goods',
  tag: '', categories: [], collection: '', options: [],
}

const create = success(generateCreateDraft('Create a men’s trail running shoe, Trail Runner Pro, with sizes and SEO', VOCAB))
const mug = success(generateCreateDraft('Add a ceramic coffee mug called Morning Ritual in white and sage, priced at $24', VOCAB))
const enrich = success(generateEnrichDraft(SEED, 'all', 'Improve the description, SEO and tags', VOCAB))
const description = success(generateEnrichDraft(SEED, 'description', 'Write a product description', VOCAB))
const seo = success(generateEnrichDraft(SEED, 'seo', 'Write the SEO title and meta description', VOCAB))

const createArgs = { mode: 'create', draft: create.draft, keys: create.keys, gaps: create.gaps, notes: create.notes } as const
const enrichArgs = { mode: 'enrich', draft: enrich.draft, current: enrich.current, keys: enrich.keys, commitLabel: 'Save' } as const

const meta = {
  title: 'Product/Da Vinci/DvCatalogDraftCard',
  component: DvCatalogDraftCard,
  tags: ['autodocs'],
  decorators: [constrain('narrow')],
  args: { ...createArgs, status: 'draft' },
  argTypes: {
    mode: { control: 'inline-radio', options: ['create', 'enrich', 'field'], description: '`create` shows the draft grouped like the stepper; `enrich` and `field` show current vs suggested.' },
    field: { control: 'inline-radio', options: ['description', 'seo'], description: 'Field mode only.' },
    draft: { control: 'object', description: '`CatalogDraft` — the drafted values.' },
    current: { control: 'object', description: 'Current values for the same keys — the diff’s left side.' },
    keys: { control: 'object', description: 'Drafted keys, in form order.' },
    status: { control: 'select', options: ['draft', 'applied', 'discarded', 'superseded', 'inactive'], description: 'Lives in the thread, not the card, so it survives remounts. Anything but `draft` collapses to one line with a Show draft disclosure — never dimmed.' },
    appliedKeys: { control: 'object', description: 'The subset the merchant applied (enrich).' },
    gaps: { control: 'object', description: 'Fields left blank on purpose — shown under “Left for you” (create).' },
    notes: { control: 'object', description: 'Assumptions to check, one short sentence each (create).' },
    commitLabel: { control: 'text', description: '“Save as Draft or Publish” on the create stepper, “Save” on the edit page.' },
    busy: { control: 'boolean', description: 'Apply in flight — the drawer may be navigating to the form.' },
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
A Catalog Co-Pilot result in the Da Vinci thread (PRD: Da Vinci Catalog Management). Emits \`apply\` with the
selected field keys and \`discard\`. Apply only fills the form — the note under the actions says so, and what
it costs (1 AI action = 10 credits). Nothing is saved until the merchant's own Save / Save as Draft / Publish.

## Modes
- **create** — a spec sheet: title and subtitle, a clamped description, a two-column list of the drafted facts,
  the search listing, and *Left for you* (fields deliberately blank, plus assumptions to check).
- **enrich / field** — each suggestion says whether it is **New** or **Replaces current** (the current value is
  one click away); a checkbox per row when there is more than one. SEO rows show their length on the label line.

## Rules
- The footer is sticky inside the drawer's scroll body, so Apply stays in reach. The host publishes its bottom
  padding as \`--dv-sticky-bottom\` so the stuck footer meets the edge.
- A draft out of play (applied, replaced, discarded, inactive) collapses to one line and expands at full
  contrast. It is never dimmed.
`,
      },
    },
  },
} satisfies Meta<typeof DvCatalogDraftCard>

export default meta
type Story = StoryObj<typeof meta>

/** The PRD's flagship prompt: “Create a men’s trail running shoe, Trail Runner Pro, with sizes and SEO.” */
export const Default: Story = {}

export const Variants: Story = {
  render: grid({ DvCatalogDraftCard }, [
    { label: 'Create — no price stated', args: createArgs },
    { label: 'Create — price and colours stated', args: { mode: 'create', draft: mug.draft, keys: mug.keys } },
    { label: 'Enrich — pick a subset', args: enrichArgs },
    { label: 'Field — description', args: { mode: 'field', field: 'description', draft: description.draft, current: description.current, keys: description.keys, commitLabel: 'Save' } },
    { label: 'Field — SEO', args: { mode: 'field', field: 'seo', draft: seo.draft, current: seo.current, keys: seo.keys, commitLabel: 'Save' } },
  ], { columns: 'repeat(auto-fit, minmax(320px, 1fr))' }),
}

export const States: Story = {
  render: grid({ DvCatalogDraftCard }, [
    { label: 'Draft', args: { ...enrichArgs, status: 'draft' } },
    { label: 'Applying', args: { ...enrichArgs, status: 'draft', busy: true } },
    { label: 'Applied — subset (collapsed)', args: { ...enrichArgs, status: 'applied', appliedKeys: enrich.keys.slice(0, 2) } },
    { label: 'Applied — create (collapsed)', args: { ...createArgs, status: 'applied' } },
    { label: 'Discarded (collapsed)', args: { ...createArgs, status: 'discarded' } },
    { label: 'Replaced by a newer draft (collapsed)', args: { ...createArgs, status: 'superseded' } },
    { label: 'Inactive (collapsed)', args: { ...enrichArgs, status: 'inactive' } },
  ], { columns: 'repeat(auto-fit, minmax(320px, 1fr))' }),
}
