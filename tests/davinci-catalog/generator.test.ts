import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateCreateDraft,
  generateEnrichDraft,
  mergeBrief,
  parseCategoryAsk,
  SEO_META_MAX,
  SEO_TITLE_MAX,
  type CatalogGenSuccess,
  type ProductSnapshot,
} from '../../src/composables/useCatalogGenerator.ts'

const VOCAB = {
  categories: ['Electronics', 'Apparel', 'Home & Kitchen', 'Sports & Outdoors', 'Beauty & Health', 'Tools & Garden'],
  collections: ['Coffee Tables', 'Over the Door Shoe Organizers', 'Chairs', 'Summer Feature Picks', 'All Products'],
  brands: ['Acme Corp', 'Brand House', 'Global Goods', 'Prime Supplier', 'Local Artisan'],
}

const FLAGSHIP = 'Create a men’s trail running shoe, Trail Runner Pro, with sizes and SEO'

function ok(outcome: ReturnType<typeof generateCreateDraft>): CatalogGenSuccess {
  assert.equal(outcome.ok, true, outcome.ok ? '' : outcome.message)
  return outcome as CatalogGenSuccess
}

function snapshot(overrides: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    name: 'Trail Runner Pro', subtitle: '', sku: 'TRP-001', description: '', brand: '', tag: '',
    categories: [], collection: '', options: [], ...overrides,
  }
}

test('the PRD flagship prompt drafts Trail Runner Pro with a size run and SEO, and invents no price or brand', () => {
  const { draft, keys, explanation, steps } = ok(generateCreateDraft(FLAGSHIP, VOCAB))
  assert.equal(draft.title, 'Trail Runner Pro')
  assert.equal(draft.handle, 'trail-runner-pro')
  assert.deepEqual(draft.options, [{ name: 'Size', values: ['7', '8', '9', '10', '11', '12', '13'] }])
  assert.equal(draft.price, undefined)
  assert.equal(draft.brand, undefined)
  assert.deepEqual(draft.categories, ['Sports & Outdoors', 'Apparel'])
  assert.equal(draft.tag, 'Running')
  assert.match(draft.description ?? '', /^Trail Runner Pro is a men’s trail running shoe/)
  assert.match(draft.description ?? '', /Available in US sizes 7–13\./)
  assert.ok(draft.seoTitle && draft.seoTitle.length <= SEO_TITLE_MAX)
  assert.ok(draft.seoMetaDescription && draft.seoMetaDescription.length <= SEO_META_MAX)
  assert.ok(!keys.includes('price') && !keys.includes('brand'))
  assert.match(explanation, /pricing is left for you/)
  assert.ok(steps.includes('Build variant options'))
})

test('a stated price is applied, and a named brand keeps its catalog casing', () => {
  const { draft } = ok(generateCreateDraft('Draft a soy wax candle called Cedar & Smoke by local artisan, $32', VOCAB))
  assert.equal(draft.title, 'Cedar & Smoke')
  assert.equal(draft.brand, 'Local Artisan')
  assert.equal(draft.price, '32.00')
  assert.deepEqual(draft.categories, ['Home & Kitchen'])
})

test('explicit sizes and colours become options', () => {
  const { draft } = ok(generateCreateDraft('New organic cotton tee named Everyday Crew, sizes S to XL, colours black, white and navy', VOCAB))
  assert.equal(draft.title, 'Everyday Crew')
  assert.deepEqual(draft.options, [
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
    { name: 'Colour', values: ['Black', 'White', 'Navy'] },
  ])
  assert.match(draft.description ?? '', /Available in sizes S–XL, in Black, White and Navy\./)
})

test('"in white and sage, priced at $24" yields a colour option and a price, not a size', () => {
  const { draft } = ok(generateCreateDraft('Add a ceramic coffee mug called Morning Ritual in white and sage, priced at $24', VOCAB))
  assert.equal(draft.title, 'Morning Ritual')
  assert.deepEqual(draft.options, [{ name: 'Colour', values: ['White', 'Sage'] }])
  assert.equal(draft.price, '24.00')
})

test('a refinement is read together with the brief it refines', () => {
  const refined = mergeBrief(FLAGSHIP, 'Set the price to $129')
  const { draft } = ok(generateCreateDraft(refined, VOCAB))
  assert.equal(draft.title, 'Trail Runner Pro')
  assert.equal(draft.price, '129.00')

  const forWomen = ok(generateCreateDraft(mergeBrief(FLAGSHIP, 'make it for women'), VOCAB)).draft
  assert.deepEqual(forWomen.options?.[0]?.values, ['5', '6', '7', '8', '9', '10'])
  assert.match(forWomen.description ?? '', /women’s trail running shoe/)

  // A new product replaces the brief instead of merging into it.
  assert.equal(mergeBrief(FLAGSHIP, 'Add a ceramic mug called Morning Ritual'), 'Add a ceramic mug called Morning Ritual')
})

test('"timeout" in a prompt simulates a gateway failure', () => {
  const outcome = generateCreateDraft(`${FLAGSHIP} timeout`, VOCAB)
  assert.equal(outcome.ok, false)
  assert.equal(outcome.ok ? '' : outcome.code, 'timeout')
})

test('a prompt with no product and no name asks for one instead of inventing a product', () => {
  const outcome = generateCreateDraft('make it better', VOCAB)
  assert.equal(outcome.ok ? '' : outcome.code, 'unclear')
})

test('SEO generate without a title fails with missing_title and drafts nothing', () => {
  const outcome = generateEnrichDraft(snapshot({ name: '' }), 'seo', 'Write the SEO title', VOCAB)
  assert.equal(outcome.ok, false)
  assert.equal(outcome.ok ? '' : outcome.code, 'missing_title')
})

test('enrich suggests only fields that change, never brand, price or title', () => {
  const { draft, keys, current } = ok(generateEnrichDraft(
    snapshot({ name: 'Allbirds Tree Runners - Wool White', brand: 'Global Goods', tag: 'Featured' }),
    'all',
    'Improve the description, SEO and tags',
    VOCAB,
  ))
  assert.ok(keys.includes('description'))
  assert.ok(keys.includes('seoTitle'))
  assert.ok(!keys.includes('tag'), 'an existing tag is kept')
  for (const key of ['brand', 'price', 'title', 'options'] as const) assert.ok(!keys.includes(key))
  assert.equal(current?.description, '')
  assert.match(draft.seoTitle ?? '', /^Allbirds Tree Runners/)
})

test('field mode drafts only the field asked for', () => {
  const { keys } = ok(generateEnrichDraft(snapshot(), 'description', 'Write a product description', VOCAB))
  assert.deepEqual(keys, ['description'])
  const seo = ok(generateEnrichDraft(snapshot(), 'seo', 'Write the SEO title and meta description', VOCAB))
  assert.deepEqual(seo.keys, ['seoTitle', 'seoMetaDescription'])
})

test('enrich on copy Da Vinci already wrote offers a rewrite rather than nothing', () => {
  const created = ok(generateCreateDraft(FLAGSHIP, VOCAB)).draft
  const { keys, draft } = ok(generateEnrichDraft(snapshot({
    description: created.description ?? '',
    subtitle: created.subtitle ?? '',
    tag: created.tag ?? '',
    categories: created.categories ?? [],
    options: created.options ?? [],
    seo: { title: created.seoTitle ?? '', metaDescription: created.seoMetaDescription ?? '', urlHandle: 'trail-runner-pro' },
  }), 'all', 'Improve the description, SEO and tags', VOCAB))
  assert.deepEqual(keys, ['description'])
  assert.notEqual(draft.description, created.description)
})

test('every preset produces a draft', () => {
  for (const prompt of [
    FLAGSHIP,
    'Add a ceramic coffee mug called Morning Ritual in white and sage, priced at $24',
    'New organic cotton tee named Everyday Crew, sizes S to XL, colours black, white and navy',
    'Draft a soy wax candle called Cedar & Smoke by Local Artisan, $32',
  ]) ok(generateCreateDraft(prompt, VOCAB))
})

test('enrich names a product by what it is, and never calls an unknown one "a product"', () => {
  const seoTitle = (name: string) => ok(generateEnrichDraft(snapshot({ name }), 'seo', 'Write the SEO listing', VOCAB)).draft.seoTitle
  assert.equal(seoTitle('Hydro Flask 32oz Wide Mouth'), 'Hydro Flask 32oz Wide Mouth | Insulated Bottle')
  assert.equal(seoTitle('Sony WH-1000XM5 Headphones'), 'Sony WH-1000XM5 Headphones | Pair of Headphones')
  assert.equal(seoTitle('Zojirushi Rice Cooker 5.5 Cup'), 'Zojirushi Rice Cooker 5.5 Cup | Cooker')
  assert.equal(seoTitle('Nike Air Max 270 - Black/White'), 'Nike Air Max 270')
  const description = ok(generateEnrichDraft(snapshot({ name: 'Kindle Paperwhite 16GB' }), 'description', 'Write a product description', VOCAB)).draft.description
  assert.doesNotMatch(description ?? '', /is an? product/)
})

test('a brief whose first clause only names the product takes its descriptor from a later clause', () => {
  const { draft } = ok(generateCreateDraft('Add a new product called Aurora Mug, a stoneware mug, $28', VOCAB))
  assert.equal(draft.title, 'Aurora Mug')
  assert.match(draft.description ?? '', /^Aurora Mug is a stoneware mug /)
  assert.equal(draft.price, '28.00')
  const bare = ok(generateCreateDraft('Create a product called Zorb Ball', VOCAB)).draft
  assert.doesNotMatch(bare.description ?? '', /called/)
})

test('the chat intro is one sentence; gaps and notes carry what the merchant must check', () => {
  const flagship = ok(generateCreateDraft(FLAGSHIP, VOCAB))
  assert.equal(flagship.intro, 'Here’s a draft for Trail Runner Pro.')
  assert.deepEqual(flagship.gaps, ['price', 'brand'])
  assert.deepEqual(flagship.notes, ['Standard size run (7–13) — edit it in Variants if yours differs.'])

  const candle = ok(generateCreateDraft('Draft a soy wax candle called Cedar & Smoke by Local Artisan, $32', VOCAB))
  assert.deepEqual(candle.gaps, [])
  assert.deepEqual(candle.notes, [])

  const enrich = ok(generateEnrichDraft(snapshot({ name: 'Allbirds Tree Runners - Wool White' }), 'all', 'Improve the description, SEO and tags', VOCAB))
  assert.match(enrich.intro, /^\d+ suggestions for Allbirds Tree Runners\.$/)
  assert.deepEqual(enrich.notes, ['It had no description, so I wrote one.'])
})

test('Da Vinci adds categories to the ones a product has, and never removes one', () => {
  const { draft, keys, current, intro, refinements } = ok(generateEnrichDraft(
    snapshot({ description: 'A trail running shoe for rocky ground', categories: ['Apparel'] }),
    'categories',
    'Suggest categories for this product',
    VOCAB,
  ))
  assert.deepEqual(keys, ['categories'])
  assert.deepEqual(draft.categories, ['Apparel', 'Sports & Outdoors'])
  assert.deepEqual(current?.categories, ['Apparel'])
  assert.equal(intro, '1 category for Trail Runner Pro.')
  assert.deepEqual(refinements, [], 'tone refinements need copy to refine')
})

test('a product no kind matches still gets a category from its name', () => {
  const category = (name: string) =>
    ok(generateEnrichDraft(snapshot({ name }), 'categories', 'Suggest categories for this product', VOCAB)).draft.categories
  assert.deepEqual(category('Nike Air Max 270 - Black/White'), ['Apparel'])
  assert.deepEqual(category('Samsung 65" QLED 4K Smart TV'), ['Electronics'])
  assert.deepEqual(category('DEWALT 20V MAX Cordless Drill'), ['Tools & Garden'])
})

test('"Improve the whole listing" includes categories', () => {
  const { keys } = ok(generateEnrichDraft(snapshot({ name: 'Nike Air Max 270 - Black/White' }), 'all', 'Improve the description, categories, SEO and tags', VOCAB))
  assert.ok(keys.includes('categories'))
})

test('a named category is filed as asked: catalog casing for one it has, a note for a new one', () => {
  const known = ok(generateEnrichDraft(snapshot({ description: 'x', categories: ['Apparel'] }), 'all', 'Put it in home & kitchen', VOCAB))
  assert.deepEqual(known.keys, ['categories'], 'naming a category asks for that alone')
  assert.deepEqual(known.draft.categories, ['Apparel', 'Home & Kitchen'])
  assert.deepEqual(known.notes, [])

  const also = ok(generateEnrichDraft(snapshot({ name: 'Nike Air Max 270 - Black/White' }), 'categories', 'Also add it to Sports & Outdoors', VOCAB))
  assert.deepEqual(also.draft.categories, ['Apparel', 'Sports & Outdoors'], '“also” keeps the suggestion and adds the named one')

  const created = ok(generateEnrichDraft(snapshot({ categories: ['Apparel'] }), 'all', 'Add it to a new Gifts category', VOCAB))
  assert.deepEqual(created.draft.categories, ['Apparel', 'Gifts'])
  assert.deepEqual(created.notes, ['“Gifts” is a new category — check the name before you save.'])
})

test('category asks are read from how merchants phrase them, and filler is not a name', () => {
  const names = (prompt: string) => parseCategoryAsk(prompt, VOCAB).names
  assert.deepEqual(names('Add it to Home & Kitchen and Electronics'), ['Home & Kitchen', 'Electronics'])
  assert.deepEqual(names('category: Holiday Gifts'), ['Holiday Gifts'])
  assert.deepEqual(names('add it to my store under gifts category'), ['Gifts'])
  assert.deepEqual(names('Also add it to Sports & Outdoors and a new Gifts category'), ['Sports & Outdoors', 'Gifts'])
  assert.deepEqual(names('put it in a new Bed and Bath category'), ['Bed and Bath'])
  assert.deepEqual(names('put it in the right category'), [])
  assert.deepEqual(names('Suggest categories for this product'), [])
  assert.deepEqual(names('Add a ceramic coffee mug called Morning Ritual in white and sage, priced at $24'), [])
})

test('create files the draft under a named category as well as the inferred one', () => {
  const brief = 'Draft a soy wax candle called Cedar & Smoke by Local Artisan, $32'
  const { draft, notes } = ok(generateCreateDraft(`${brief}, in the Gifts category`, VOCAB))
  assert.equal(draft.title, 'Cedar & Smoke')
  assert.deepEqual(draft.categories, ['Gifts', 'Home & Kitchen'])
  assert.deepEqual(notes, ['“Gifts” is a new category — check the name before you save.'])
  // A refinement naming a category refines the draft rather than starting over.
  const refined = ok(generateCreateDraft(mergeBrief(brief, 'Add it to Home & Kitchen and Electronics'), VOCAB))
  assert.equal(refined.draft.title, 'Cedar & Smoke')
  assert.deepEqual(refined.draft.categories, ['Home & Kitchen', 'Electronics'])
})

test('nothing to add says so, and asks for a category by name', () => {
  const filed = generateEnrichDraft(snapshot({ description: 'A trail running shoe', categories: ['Sports & Outdoors', 'Apparel'] }), 'categories', 'Suggest categories for this product', VOCAB)
  assert.equal(filed.ok, false)
  assert.match(filed.ok ? '' : filed.message, /already in the categories I’d suggest\. Name one to add, like “add it to Electronics”\./)
  const unknown = generateEnrichDraft(snapshot({ name: 'Oura Ring Gen 3 - Gold' }), 'categories', 'Suggest categories for this product', VOCAB)
  assert.equal(unknown.ok, false)
  assert.match(unknown.ok ? '' : unknown.message, /^I can’t tell which category fits Oura Ring Gen 3/)
})
