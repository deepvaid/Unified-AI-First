import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fitState, fittingRows, makesFor, modelsFor, parseVehicle, rowFits, vehicleLabel, yearsOf } from '../../src/storefront/fitment.ts'
import type { FitmentProduct, Vehicle } from '../../src/storefront/fitment.ts'
import { VEHICLES, VEHICLE_YEAR_FROM, VEHICLE_YEAR_TO } from '../../src/storefront/vehicles.ts'

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
