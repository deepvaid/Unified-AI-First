// Editing a part in Products (src/storefront/fitmentForm.ts): how a fitment row
// reads, the Make → Model → years choices, what stops a row being added, the
// list's edits, and the part's specifications.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addRow, cleanSpecs, compareRows, draftErrors, emptyDraft, fitmentMakes, fitmentModels, fitmentSummary, listedFitment,
  modelYears, overlapping, positionsFor, removeRows, rowFromDraft, rowKey, rowLabel, rowName, rowsLabel, rowsOverlap,
  searchRows, sortRows, specErrors, universalFitment, yearsLabel, NOTE_MAX,
} from '../../src/storefront/fitmentForm.ts'
import type { FitmentDraft } from '../../src/storefront/fitmentForm.ts'
import type { FitmentRow } from '../../src/storefront/fitment.ts'
import { VEHICLES } from '../../src/storefront/vehicles.ts'
import { DEMO_STORES } from '../../src/storefront/demoStores/index.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'

const row = (make: string, model: string, yearFrom: number, yearTo: number, extra: Partial<FitmentRow> = {}): FitmentRow =>
  ({ make, model, yearFrom, yearTo, ...extra })

const f150Early = row('Ford', 'F-150', 2015, 2020)
const f150Late = row('Ford', 'F-150', 2021, 2024)
const civic = row('Honda', 'Civic', 2016, 2021)
const rav4Front = row('Toyota', 'RAV4', 2019, 2024, { position: 'Front' })

const draft = (changes: Partial<FitmentDraft> = {}): FitmentDraft =>
  ({ ...emptyDraft(), make: 'Ford', model: 'F-150', yearFrom: 2015, yearTo: 2020, ...changes })

test('a row reads as its years, make and model', () => {
  assert.equal(yearsLabel(f150Early), '2015–2020')
  assert.equal(yearsLabel(row('Ford', 'F-150', 2019, 2019)), '2019')
  assert.equal(rowLabel(f150Early), '2015–2020 Ford F-150')
  assert.equal(rowName(f150Early), '2015–2020 Ford F-150')
  assert.equal(rowName(rav4Front), '2019–2024 Toyota RAV4 (Front)')
  assert.equal(rowsLabel(1), '1 row')
  assert.equal(rowsLabel(0), '0 rows')
  assert.equal(rowsLabel(11), '11 rows')
})

test('the list counts the models it names and the rows it takes', () => {
  assert.equal(fitmentSummary([f150Early, f150Late, civic]), '2 models · 3 rows')
  assert.equal(fitmentSummary([civic]), '1 model · 1 row')
  assert.equal(fitmentSummary([rav4Front, { ...rav4Front, position: 'Rear' }]), '1 model · 2 rows')
})

test('a part asks a position only when it is sold by position', () => {
  assert.deepEqual(positionsFor([{ name: 'Position', values: ['Front', 'Rear'] }]), ['Front', 'Rear'])
  assert.deepEqual(positionsFor([{ name: 'Grade', values: ['0W-20'] }, { name: 'position', values: ['Rear'] }]), ['Rear'])
  assert.deepEqual(positionsFor([{ name: 'Position', values: ['Driver', 'Passenger'] }]), [])
  assert.deepEqual(positionsFor([{ name: 'Length', values: ['16 in', '18 in'] }]), [])
  assert.deepEqual(positionsFor([]), [])
})

test('the choices: every make A to Z, a make’s models, a model’s years oldest first', () => {
  assert.deepEqual(fitmentMakes(), ['Chevrolet', 'Ford', 'Honda', 'Jeep', 'Nissan', 'Ram', 'Toyota'])
  assert.deepEqual(fitmentModels('Toyota'), ['Camry', 'RAV4', 'Tacoma'])
  assert.deepEqual(fitmentModels('Honda'), ['Civic', 'CR-V'])
  assert.deepEqual(fitmentModels('Ram'), ['1500'])
  assert.deepEqual(fitmentModels('Tesla'), [])
  assert.deepEqual(modelYears('Ford', 'F-150'), [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024])
  assert.deepEqual(modelYears('Ford', 'Civic'), [])
  // Every model in the table can be chosen through its make.
  for (const vehicle of VEHICLES) assert.ok(fitmentModels(vehicle.make).includes(vehicle.model), vehicle.model)
})

test('rows sort by make, model, then year, with no position before front before rear', () => {
  const rear = row('Ford', 'F-150', 2015, 2020, { position: 'Rear' })
  const front = row('Ford', 'F-150', 2015, 2020, { position: 'Front' })
  const sorted = sortRows([rav4Front, f150Late, civic, rear, front, f150Early])
  assert.deepEqual(sorted.map(rowName), [
    '2015–2020 Ford F-150', '2015–2020 Ford F-150 (Front)', '2015–2020 Ford F-150 (Rear)', '2021–2024 Ford F-150',
    '2016–2021 Honda Civic', '2019–2024 Toyota RAV4 (Front)',
  ])
  assert.ok(compareRows(row('Chevrolet', 'Silverado 1500', 2015, 2024), row('Ram', '1500', 2015, 2024)) < 0)
})

test('rows overlap when the same model meets in a year at the same end', () => {
  assert.ok(rowsOverlap(f150Early, row('Ford', 'F-150', 2020, 2022)), 'share 2020')
  assert.ok(rowsOverlap(f150Early, row('Ford', 'F-150', 2017, 2018)), 'inside')
  assert.ok(rowsOverlap(f150Early, f150Early), 'the same row')
  assert.ok(!rowsOverlap(f150Early, f150Late), 'next generation')
  assert.ok(!rowsOverlap(rav4Front, row('Toyota', 'RAV4', 2019, 2024, { position: 'Rear' })), 'front and rear')
  assert.ok(rowsOverlap(rav4Front, row('Toyota', 'RAV4', 2020, 2020, { position: 'Front' })), 'front and front')
  // No position means either end: it meets a front row and a rear row, whichever is listed first.
  const f150Front2019 = row('Ford', 'F-150', 2019, 2019, { position: 'Front' })
  const f150Rear2019 = row('Ford', 'F-150', 2019, 2019, { position: 'Rear' })
  assert.ok(rowsOverlap(f150Early, f150Front2019), 'no position, then front')
  assert.ok(rowsOverlap(f150Front2019, f150Early), 'front, then no position')
  assert.ok(rowsOverlap(f150Early, f150Rear2019), 'no position, then rear')
  assert.ok(rowsOverlap(f150Rear2019, f150Early), 'rear, then no position')
  assert.ok(!rowsOverlap(f150Late, f150Front2019), 'no position, other years')
  assert.ok(!rowsOverlap(f150Early, row('Chevrolet', 'Silverado 1500', 2015, 2020)), 'another model')
  assert.equal(overlapping([civic, f150Early], row('Ford', 'F-150', 2019, 2021)), f150Early)
  assert.equal(overlapping([civic, f150Late], f150Early), undefined)
})

test('a draft names a make, a model and its years, first year first', () => {
  assert.deepEqual(draftErrors(emptyDraft(), []), {
    make: 'Choose a make', model: 'Choose a model', yearFrom: 'Choose the first year', yearTo: 'Choose the last year',
  })
  assert.deepEqual(draftErrors(draft(), []), {})
  assert.deepEqual(draftErrors(draft({ yearFrom: 2019, yearTo: 2019 }), []), {}, 'one year')
  assert.deepEqual(draftErrors(draft({ yearFrom: 2020, yearTo: 2017 }), []), { yearTo: 'Choose 2020 or later' })
  assert.deepEqual(draftErrors(draft({ yearFrom: 2012 }), []), { yearFrom: 'Choose a year from 2015 to 2024' })
  assert.deepEqual(draftErrors(draft({ yearTo: 2026 }), []), { yearTo: 'Choose a year from 2015 to 2024' })
  assert.deepEqual(draftErrors(draft({ make: 'Tesla' }), []).make, 'Choose a make from the list')
  assert.deepEqual(draftErrors(draft({ model: 'Civic' }), []), { model: 'Choose a Ford model from the list' })
  assert.deepEqual(draftErrors(draft({ position: 'Left' }), []), { position: 'Choose Front, Rear or no position' })
  assert.deepEqual(draftErrors(draft({ note: 'x'.repeat(NOTE_MAX + 1) }), []), { note: `Keep the note to ${NOTE_MAX} characters` })
  assert.deepEqual(draftErrors(draft({ note: `  ${'x'.repeat(NOTE_MAX)}  ` }), []), {}, 'spaces round the note do not count')
})

test('a row the part already lists, or one that meets it, is refused on its model', () => {
  const rows = [civic, f150Early, rav4Front]
  assert.deepEqual(draftErrors(draft(), rows), { model: 'This part already lists the 2015–2020 Ford F-150' })
  assert.deepEqual(draftErrors(draft({ yearFrom: 2018, yearTo: 2022 }), rows), { model: 'This part already lists the 2015–2020 Ford F-150' })
  assert.deepEqual(draftErrors(draft({ yearFrom: 2021, yearTo: 2024 }), rows), {}, 'the next generation')
  assert.deepEqual(
    draftErrors(draft({ yearFrom: 2019, yearTo: 2019, position: 'Front' }), rows),
    { model: 'This part already lists the 2015–2020 Ford F-150' },
    'the row with no position already covers the front',
  )
  assert.deepEqual(
    draftErrors(draft({ make: 'Toyota', model: 'RAV4', yearFrom: 2019, yearTo: 2019 }), rows),
    { model: 'This part already lists the 2019–2024 Toyota RAV4 (Front)' },
    'a row with no position would repeat the front row',
  )
  assert.deepEqual(draftErrors(draft({ make: 'Toyota', model: 'RAV4', yearFrom: 2019, yearTo: 2024, position: 'Rear' }), rows), {}, 'rear beside front')
  assert.deepEqual(
    draftErrors(draft({ make: 'Toyota', model: 'RAV4', yearFrom: 2020, yearTo: 2020, position: 'Front' }), rows),
    { model: 'This part already lists the 2019–2024 Toyota RAV4 (Front)' },
  )
  // Overlap is only checked once the fields are filled in.
  assert.deepEqual(draftErrors(draft({ yearTo: null }), rows), { yearTo: 'Choose the last year' })
})

test('a draft becomes a row without the blanks', () => {
  assert.deepEqual(rowFromDraft(draft()), f150Early)
  assert.deepEqual(rowFromDraft(draft({ position: 'Front', note: '  Without tow package ' })), { ...f150Early, position: 'Front', note: 'Without tow package' })
  assert.ok(!('note' in rowFromDraft(draft({ note: '   ' }))))
})

test('adding keeps the list in order; removing takes the rows by key', () => {
  const added = addRow([rav4Front, civic], f150Late)
  assert.deepEqual(added.map(rowLabel), ['2021–2024 Ford F-150', '2016–2021 Honda Civic', '2019–2024 Toyota RAV4'])
  assert.deepEqual(removeRows(added, [rowKey(civic)]), [f150Late, rav4Front])
  assert.deepEqual(removeRows(added, [rowKey(civic), rowKey(rav4Front), rowKey(f150Late)]), [])
  assert.deepEqual(removeRows(added, ['nothing']), added)
  // A key says everything the row does, so front and rear rows are told apart.
  assert.notEqual(rowKey(rav4Front), rowKey({ ...rav4Front, position: 'Rear' }))
  assert.notEqual(rowKey(f150Early), rowKey({ ...f150Early, note: 'Without tow package' }))
})

test('search finds rows by make and model, whatever the dashes and case', () => {
  const rows = [f150Early, f150Late, civic, rav4Front, row('Ram', '1500', 2019, 2024)]
  assert.deepEqual(searchRows(rows, '').length, 5)
  assert.deepEqual(searchRows(rows, '  ').length, 5)
  assert.deepEqual(searchRows(rows, 'ford').length, 2)
  assert.deepEqual(searchRows(rows, 'f150').length, 2)
  assert.deepEqual(searchRows(rows, 'Ford F-150').length, 2)
  assert.deepEqual(searchRows(rows, 'rav').map(rowLabel), ['2019–2024 Toyota RAV4'])
  assert.deepEqual(searchRows(rows, 'ram 1500').map(rowLabel), ['2019–2024 Ram 1500'])
  assert.deepEqual(searchRows(rows, 'toyota civic'), [])
  // The years are not searched: the table already orders by them.
  assert.deepEqual(searchRows(rows, '2015'), [])
})

test('a universal part lists no rows; a listed part keeps its rows in order', () => {
  assert.deepEqual(universalFitment(), { universal: true, rows: [] })
  assert.deepEqual(listedFitment([rav4Front, f150Early]), { universal: false, rows: [f150Early, rav4Front] })
  assert.deepEqual(listedFitment([]), { universal: false, rows: [] })
})

test('every seeded part lists rows the form would take: vehicles from the table, none repeated', () => {
  let parts = 0
  for (const blueprint of DEMO_STORES) {
    for (const product of snapshotFor(blueprint.homeChannel, blueprint.id, '2026-11-20').products) {
      const fitment = product.detail?.fitment
      if (!fitment) continue
      parts++
      if (fitment.universal) {
        assert.deepEqual(fitment.rows, [], `${product.name} is universal`)
        continue
      }
      assert.ok(fitment.rows.length, `${product.name} lists vehicles`)
      fitment.rows.forEach((listed, i) => {
        const others = fitment.rows.filter((_, j) => j !== i)
        const asDraft = { make: listed.make, model: listed.model, yearFrom: listed.yearFrom, yearTo: listed.yearTo, position: listed.position ?? '', note: listed.note ?? '' }
        assert.deepEqual(draftErrors(asDraft, others), {}, `${product.name}: ${rowName(listed)}`)
      })
    }
  }
  // Only a store that sells parts has any: Vitaheal and Northfold have none.
  for (const id of ['vitaheal', 'northfold'] as const) {
    const blueprint = DEMO_STORES.find((entry) => entry.id === id)!
    assert.ok(snapshotFor(blueprint.homeChannel, id, '2026-11-20').products.every((product) => product.detail?.fitment === undefined), id)
  }
  assert.ok(parts > 0, "a demo store sells parts")
})

test('a specification needs a name and a value; an empty row is dropped', () => {
  assert.deepEqual(specErrors([
    { label: 'Friction material', value: 'Ceramic' },
    { label: 'Dust', value: '  ' },
    { label: '', value: 'Audible' },
    { label: ' ', value: '' },
  ]), [
    { label: '', value: '' },
    { label: '', value: 'Add a value' },
    { label: 'Add a name', value: '' },
    { label: '', value: '' },
  ])
  assert.deepEqual(cleanSpecs([
    { label: ' Friction material ', value: 'Ceramic ' },
    { label: '', value: '' },
    { label: '  ', value: ' ' },
  ]), [{ label: 'Friction material', value: 'Ceramic' }])
  assert.deepEqual(cleanSpecs([]), [])
})
