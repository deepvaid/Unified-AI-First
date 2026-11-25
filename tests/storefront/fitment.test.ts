import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fitDetail, fitLabel, fitState, fitsVehicle, lineVehicle, variantFitState, fittingRows, isVehicle, makesFor, modelsFor, parseVehicle, rowFits, sellsParts, vehicleLabel, yearsOf } from '../../src/storefront/fitment.ts'
import type { FitmentProduct, Vehicle } from '../../src/storefront/fitment.ts'
import { VEHICLES, VEHICLE_YEAR_FROM, VEHICLE_YEAR_TO } from '../../src/storefront/vehicles.ts'
import { TORQLINE_BLUEPRINT } from '../../src/storefront/demoStores/torqline.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { DEMO_STORES } from '../../src/storefront/demoStores/index.ts'

const f150: Vehicle = { year: 2019, make: 'Ford', model: 'F-150' }
const civic: Vehicle = { year: 2015, make: 'Honda', model: 'Civic' }

// Front pads for the 2015-2020 F-150 and the 2021-2024 one, with a note on the later run.
const pads: FitmentProduct = {
  detail: {
    fitment: {
      universal: false,
      rows: [
        { make: 'Ford', model: 'F-150', yearFrom: 2015, yearTo: 2020, position: 'Front' },
        { make: 'Ford', model: 'F-150', yearFrom: 2021, yearTo: 2024, position: 'Front', note: 'Not for Raptor' },
        { make: 'Chevrolet', model: 'Silverado 1500', yearFrom: 2019, yearTo: 2024, position: 'Front' },
      ],
    },
  },
}
const wipers: FitmentProduct = { detail: { fitment: { universal: true, rows: [] } } }
const unlisted: FitmentProduct = { detail: {} }

// ── The vehicle table ────────────────────────────────────────────────────────

test('the table is ten popular US models, each offered every year from 2015 to 2024', () => {
  assert.equal(VEHICLES.length, 10)
  assert.equal(new Set(VEHICLES.map((v) => `${v.make} ${v.model}`)).size, 10)
  for (const v of VEHICLES) assert.deepEqual([v.yearFrom, v.yearTo], [VEHICLE_YEAR_FROM, VEHICLE_YEAR_TO], `${v.make} ${v.model}`)
})

test('years run newest first, makes and models A to Z', () => {
  const years = yearsOf()
  assert.equal(years.length, 10)
  assert.deepEqual([years[0], years.at(-1)], [2024, 2015])
  assert.deepEqual(makesFor(2019), ['Chevrolet', 'Ford', 'Honda', 'Jeep', 'Nissan', 'Ram', 'Toyota'])
  assert.deepEqual(modelsFor(2019, 'Toyota'), ['Camry', 'RAV4', 'Tacoma'])
  assert.deepEqual(modelsFor(2019, 'toyota'), ['Camry', 'RAV4', 'Tacoma'])
})

test('a year outside the table offers no makes and no models', () => {
  assert.deepEqual(makesFor(2012), [])
  assert.deepEqual(modelsFor(2025, 'Ford'), [])
  const short = [{ make: 'Ford', model: 'F-150', yearFrom: 2021, yearTo: 2022 }]
  assert.deepEqual(yearsOf(short), [2022, 2021])
  assert.deepEqual(makesFor(2019, short), [])
})

test('a vehicle reads year, make, model', () => {
  assert.equal(vehicleLabel(f150), '2019 Ford F-150')
})

// ── Does it fit? ─────────────────────────────────────────────────────────────

test('a part fits a vehicle its rows cover, by make, model and year', () => {
  assert.equal(fitState(pads, f150), 'fits')
  assert.equal(fitState(pads, { ...f150, year: 2024 }), 'fits')
  assert.equal(fitState(pads, { year: 2019, make: 'Chevrolet', model: 'Silverado 1500' }), 'fits')
  assert.equal(fitState(pads, { year: 2018, make: 'Chevrolet', model: 'Silverado 1500' }), 'no-fit')
  assert.equal(fitState(pads, civic), 'no-fit')
})

test('names match whatever their case or punctuation', () => {
  assert.equal(rowFits({ make: 'Honda', model: 'CR-V', yearFrom: 2017, yearTo: 2022 }, { year: 2019, make: 'HONDA', model: 'crv' }), true)
})

test('a universal part is universal with or without a vehicle', () => {
  assert.equal(fitState(wipers, f150), 'universal')
  assert.equal(fitState(wipers, null), 'universal')
})

test('without a vehicle, or without fitment, the fit is unknown', () => {
  assert.equal(fitState(pads, null), 'unknown')
  assert.equal(fitState(pads, undefined), 'unknown')
  assert.equal(fitState(unlisted, f150), 'unknown')
  assert.equal(fitState({}, f150), 'unknown')
  assert.equal(fitState({ detail: { fitment: { universal: false, rows: [] } } }, f150), 'unknown')
})

test('the rows that fit say where and with what note', () => {
  assert.deepEqual(fittingRows(pads, { ...f150, year: 2022 }).map((r) => [r.position, r.note]), [['Front', 'Not for Raptor']])
  assert.deepEqual(fittingRows(pads, civic), [])
})

// ── A vehicle named in a chat message ────────────────────────────────────────

test('a vehicle is read from a message however the model is written', () => {
  assert.deepEqual(parseVehicle('Does this fit my 2019 Ford F-150?'), f150)
  assert.deepEqual(parseVehicle('2019 f150'), f150)
  assert.deepEqual(parseVehicle('my 2019 F 150'), f150)
  assert.deepEqual(parseVehicle('2018 honda crv'), { year: 2018, make: 'Honda', model: 'CR-V' })
  assert.deepEqual(parseVehicle('2018 Honda CR-V'), { year: 2018, make: 'Honda', model: 'CR-V' })
  assert.deepEqual(parseVehicle('a 2021 rav 4'), { year: 2021, make: 'Toyota', model: 'RAV4' })
  assert.deepEqual(parseVehicle('2015 civic'), civic)
})

test('a make with one model is enough, and a nickname for the make counts', () => {
  assert.deepEqual(parseVehicle('my 2018 Jeep'), { year: 2018, make: 'Jeep', model: 'Wrangler' })
  assert.deepEqual(parseVehicle('2020 chevy'), { year: 2020, make: 'Chevrolet', model: 'Silverado 1500' })
  assert.deepEqual(parseVehicle('2020 Silverado'), { year: 2020, make: 'Chevrolet', model: 'Silverado 1500' })
  assert.deepEqual(parseVehicle('2017 Ram 1500'), { year: 2017, make: 'Ram', model: '1500' })
  assert.deepEqual(parseVehicle('2017 Ram'), { year: 2017, make: 'Ram', model: '1500' })
})

test('a make alone still reads when the words after it name no model', () => {
  assert.deepEqual(parseVehicle('Does this fit my 2018 Jeep?'), { year: 2018, make: 'Jeep', model: 'Wrangler' })
  assert.deepEqual(parseVehicle('my 2018 Jeep, rear brakes'), { year: 2018, make: 'Jeep', model: 'Wrangler' })
  assert.deepEqual(parseVehicle('a 2020 chevy and the front pads'), { year: 2020, make: 'Chevrolet', model: 'Silverado 1500' })
  assert.deepEqual(parseVehicle('my Ram 2017'), { year: 2017, make: 'Ram', model: '1500' })
})

test('without a year, a clear model, or a vehicle in the table, nothing is read', () => {
  assert.equal(parseVehicle('does this fit my F-150?'), null)
  assert.equal(parseVehicle('2019 Toyota'), null) // Camry, RAV4 or Tacoma
  assert.equal(parseVehicle('2019 1500'), null) // a number alone could be anything
  assert.equal(parseVehicle('2012 Ford F-150'), null) // before the table starts
  assert.equal(parseVehicle('2019 Subaru Outback'), null)
  assert.equal(parseVehicle('I paid 150 dollars of 2019 money'), null)
  assert.equal(parseVehicle('2019 Toyota Civic'), null) // a Honda model with another make
})

test("a model the table doesn't list is not read as its make's listed one", () => {
  assert.equal(parseVehicle('Does this fit my 2018 Jeep Grand Cherokee?'), null)
  assert.equal(parseVehicle('2021 Ford Explorer'), null)
  assert.equal(parseVehicle('does this fit my 2016 ford mustang'), null)
  assert.equal(parseVehicle('2020 chevy equinox'), null)
  assert.equal(parseVehicle('2019 Nissan Altima'), null)
  assert.equal(parseVehicle('2017 Ram ProMaster'), null)
  assert.equal(parseVehicle('my 2019 Ram 2500'), null)
  assert.equal(parseVehicle('brake pads for my 2019 Ford F-250'), null)
})

test('"ram" as an everyday word does not override a model that is named', () => {
  assert.deepEqual(parseVehicle('Will the ram air intake fit my 2019 F-150?'), f150)
  assert.deepEqual(parseVehicle('Will the ram air intake fit my 2019 Ford F-150?'), f150)
  assert.equal(parseVehicle('does the 2019 ram air intake fit?'), null) // no vehicle, just the part
})

// ── What a badge says, and a vehicle read back from storage ──────────────────

test('a badge says the same words wherever it is shown', () => {
  assert.equal(fitLabel(fitState(pads, f150), f150), 'Fits your 2019 Ford F-150')
  assert.equal(fitLabel(fitState(pads, civic), civic), 'Doesn’t fit your 2015 Honda Civic')
  assert.equal(fitLabel(fitState(wipers, null), null), 'Universal fit')
  assert.equal(fitLabel(fitState(pads, null), null), 'Check fit')
  assert.equal(fitLabel(fitState(unlisted, f150), f150), 'Check fit')
})

test('a store sells parts when one of its products carries fitment', () => {
  assert.equal(sellsParts([pads, unlisted]), true)
  assert.equal(sellsParts([unlisted, { detail: { fitment: undefined } }]), false)
  assert.equal(sellsParts([]), false)
})

test('a saved vehicle counts only while the table offers it', () => {
  assert.equal(isVehicle(f150), true)
  assert.equal(isVehicle({ year: 2014, make: 'Ford', model: 'F-150' }), false, 'a year before the run')
  assert.equal(isVehicle({ year: 2019, make: 'Ford', model: 'Ranger' }), false, 'a model the table does not list')
  assert.equal(isVehicle({ year: '2019', make: 'Ford', model: 'F-150' }), false, 'an old shape')
  assert.equal(isVehicle(null), false)
})

test('the line under "Fits your …" says what the fitting rows say, each once', () => {
  assert.equal(fitDetail(pads, f150), 'Front')
  assert.equal(fitDetail(pads, { year: 2022, make: 'Ford', model: 'F-150' }), 'Front · Not for Raptor')
  assert.equal(fitDetail(pads, civic), '', 'nothing fits')
  assert.equal(fitDetail(pads, null), '')
  assert.equal(fitDetail(wipers, f150), '', 'a universal part has no rows')
})

// ── One choice of a part ─────────────────────────────────────────────────────

const torqline = snapshotFor(TORQLINE_BLUEPRINT.homeChannel, 'torqline', '2026-11-23')
const seeded = (id: number) => torqline.products.find((p) => p.id === id)!
const choice = (id: number, title: string) => seeded(id).detail!.variantsList.find((v) => v.title === title)!

test('a choice fits when a row that fits takes it: the length a wiper row names, the position a row names', () => {
  const wiper = seeded(4016)
  assert.equal(variantFitState(wiper, choice(4016, '22 in'), f150), 'fits')
  assert.equal(variantFitState(wiper, choice(4016, '16 in'), f150), 'no-fit', 'the F-150 takes 22 in blades')
  assert.equal(variantFitState(wiper, undefined, f150), 'fits', 'no choice yet: the part fits')
  assert.equal(lineVehicle(wiper, choice(4016, '22 in'), f150), '2019 Ford F-150')
  assert.equal(lineVehicle(wiper, choice(4016, '16 in'), f150), undefined, 'the line never says it fits')
  // Both positions of the truck pads fit a 2019 F-150; neither fits a 2016 Civic.
  const pads = seeded(4001)
  assert.equal(variantFitState(pads, choice(4001, 'Rear'), f150), 'fits')
  assert.equal(variantFitState(pads, choice(4001, 'Front'), { year: 2016, make: 'Honda', model: 'Civic' }), 'no-fit')
  // A row the merchant limits to the front takes the front pads only.
  const frontOnly = { ...pads, detail: { ...pads.detail!, fitment: { universal: false, rows: [{ make: 'Ford', model: 'F-150', yearFrom: 2015, yearTo: 2020, position: 'Front' }] } } }
  assert.equal(variantFitState(frontOnly, choice(4001, 'Front'), f150), 'fits')
  assert.equal(variantFitState(frontOnly, choice(4001, 'Rear'), f150), 'no-fit')
  // Universal parts and parts without choices are the part's own state.
  assert.equal(variantFitState(seeded(4010), choice(4010, '5W-30'), f150), 'universal')
  assert.equal(lineVehicle(seeded(4010), choice(4010, '5W-30'), f150), undefined, 'a universal part names no vehicle')
  assert.equal(variantFitState(seeded(4006), seeded(4006).detail!.variantsList[0], f150), 'fits')
})

test('parts that fit a vehicle are the ones that fit it and the universal ones', () => {
  const fitting = torqline.products.filter((p) => fitsVehicle(p, f150)).map((p) => p.id)
  assert.deepEqual(fitting, [4001, 4003, 4006, 4008, 4009, 4010, 4011, 4012, 4014, 4015, 4016, 4018, 4019, 4020, 4021])
  assert.equal(fitsVehicle(seeded(4002), f150), false)
  assert.equal(fitsVehicle(seeded(4010), null), true, 'universal with no vehicle')
  assert.equal(fitsVehicle(seeded(4001), null), false, 'unknown is not a fit')
})

test('of the demo stores, only the one with vehicle fitment sells parts', () => {
  for (const blueprint of DEMO_STORES) {
    const snapshot = snapshotFor(blueprint.homeChannel, blueprint.id, '2026-11-23')
    assert.equal(sellsParts(snapshot.products), blueprint.capabilities.vehicleFitment, blueprint.id)
  }
})
