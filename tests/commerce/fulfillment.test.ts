import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canFulfill, carriersFor, defaultParcel, deliver, isFulfillmentProgress, isProgressMap, nextStep, orderView, pack,
  parcelProblems, pickCarrier, ship, shipNow, shipsFrom, shownFulfillment, startProgress, stepPosition, suggestedTracking,
} from '../../src/commerce/fulfillment.ts'
import type { Parcel } from '../../src/commerce/fulfillment.ts'
import { shopperOrderStatus } from '../../src/storefront/orderStatus.ts'

const AT = '2026-11-24T09:00:00.000Z'
const PARCEL: Parcel = { carrier: 'PostNord', service: 'Standard', trackingNumber: '123456789SE' }

describe('a fulfillment moves one step at a time', () => {
  it('starts Picked, at the location that ships it', () => {
    const start = startProgress('Stockholm warehouse', AT)
    assert.equal(start.status, 'Picked')
    assert.equal(start.events[0]!.text, 'Fulfillment created, items picked at Stockholm warehouse')
    assert.equal(nextStep(start.status), 'pack')
  })

  it('goes Picked, Packed, Label Created, Shipped, Delivered', () => {
    const packed = pack(startProgress('A', AT), AT)!
    assert.equal(packed.status, 'Packed')
    const labelled = pickCarrier(packed, PARCEL, AT)!
    assert.equal(labelled.status, 'Label Created')
    assert.deepEqual(labelled.parcel, PARCEL)
    const shipped = ship(labelled, AT)!
    assert.equal(shipped.status, 'Shipped')
    assert.equal(shipped.shippedAt, AT)
    const delivered = deliver(shipped, AT)!
    assert.equal(delivered.status, 'Delivered')
    assert.equal(delivered.deliveredAt, AT)
    assert.equal(nextStep(delivered.status), null)
    assert.deepEqual(delivered.events.map((e) => e.text), [
      'Fulfillment created, items picked at A',
      'Items packed',
      'Label created with PostNord, tracking 123456789SE',
      'Shipped with PostNord',
      'Delivered',
    ])
  })

  it('refuses a step that is not next, and leaves the fulfillment as it was', () => {
    const start = startProgress('A', AT)
    assert.equal(ship(start, AT), null)
    assert.equal(pickCarrier(start, PARCEL, AT), null)
    assert.equal(deliver(start, AT), null)
    const packed = pack(start, AT)!
    assert.equal(pack(packed, AT), null)
    assert.equal(start.status, 'Picked')
    assert.equal(start.events.length, 1)
  })

  it('needs a carrier and a tracking number before a label', () => {
    const packed = pack(startProgress('A', AT), AT)!
    assert.equal(pickCarrier(packed, { ...PARCEL, trackingNumber: '  ' }, AT), null)
    assert.deepEqual(parcelProblems({ carrier: '', service: '', trackingNumber: '' }), {
      carrier: 'Choose a carrier.',
      trackingNumber: 'Enter the tracking number from the label.',
    })
    assert.deepEqual(parcelProblems({ ...PARCEL, weightG: 0 }), { weightG: 'Enter a number above 0, or leave it empty.' })
    assert.deepEqual(parcelProblems({ ...PARCEL, weightG: 450, lengthCm: 20 }), {})
  })

  it('trims what was typed and names the service when it was left empty', () => {
    const packed = pack(startProgress('A', AT), AT)!
    const labelled = pickCarrier(packed, { carrier: ' DHL ', service: ' ', trackingNumber: ' DHL123 ' }, AT)!
    assert.deepEqual(labelled.parcel, { carrier: 'DHL', service: 'Standard', trackingNumber: 'DHL123' })
  })

  it('ships in one go from any earlier status, recording the steps on the way', () => {
    const fromPicked = shipNow(startProgress('A', AT), PARCEL, AT)!
    assert.equal(fromPicked.status, 'Shipped')
    assert.equal(fromPicked.events.length, 4)
    const fromPacked = shipNow(pack(startProgress('A', AT), AT)!, PARCEL, AT)!
    assert.equal(fromPacked.events.length, 4)
    const labelled = pickCarrier(pack(startProgress('A', AT), AT)!, PARCEL, AT)!
    // A label that exists keeps its own carrier and number.
    assert.equal(shipNow(labelled, { ...PARCEL, carrier: 'DHL' }, AT)!.parcel!.carrier, 'PostNord')
    assert.equal(shipNow(fromPicked, PARCEL, AT), null)
  })

  it('places the step indicator on the step to do next', () => {
    assert.equal(stepPosition('Picked'), 2)
    assert.equal(stepPosition('Packed'), 3)
    assert.equal(stepPosition('Label Created'), 4)
    assert.equal(stepPosition('Shipped'), 5)
    assert.equal(stepPosition('Delivered'), 5)
  })
})

describe('what the order shows', () => {
  const start = startProgress('A', AT)
  const packed = pack(start, AT)!
  const labelled = pickCarrier(packed, PARCEL, AT)!
  const shipped = ship(labelled, AT)!
  const delivered = deliver(shipped, AT)!

  it('follows the fulfillment', () => {
    assert.deepEqual(orderView(start), { fulfillmentStatus: 'Not Ready', fulfillmentStage: 'Picked', lineStatus: 'Processing', completed: false, trackingNumber: null, courier: null })
    assert.equal(orderView(packed).fulfillmentStage, 'Pack')
    assert.equal(orderView(labelled).fulfillmentStatus, 'Ready For Fulfillment')
    assert.equal(orderView(labelled).fulfillmentStage, 'Carrier')
    assert.deepEqual(orderView(shipped), { fulfillmentStatus: 'Shipped', fulfillmentStage: 'Shipped', lineStatus: 'Shipped', completed: false, trackingNumber: '123456789SE', courier: 'PostNord' })
    assert.equal(orderView(delivered).completed, true)
  })

  it('tells the shopper Preparing, then Shipped with tracking, then Delivered', () => {
    const order = (view: ReturnType<typeof orderView>) => ({
      status: view.completed ? 'Completed' : 'Processing',
      fulfillmentStatus: view.fulfillmentStatus,
      paymentStatus: 'Paid',
      trackingNumber: view.trackingNumber,
      courier: view.courier,
    })
    assert.equal(shopperOrderStatus(order(orderView(packed))).key, 'preparing')
    // A label is not a shipment: the shopper is not told it is on its way yet.
    assert.equal(shopperOrderStatus(order(orderView(labelled))).key, 'preparing')
    const onItsWay = shopperOrderStatus(order(orderView(shipped)))
    assert.equal(onItsWay.key, 'shipped')
    assert.deepEqual(onItsWay.tracking, { number: '123456789SE', courier: 'PostNord' })
    assert.equal(shopperOrderStatus(order(orderView(delivered))).key, 'delivered')
  })

  it('does not send a cancelled or refunded order', () => {
    assert.equal(canFulfill('Processing'), true)
    assert.equal(canFulfill('Completed'), true)
    assert.equal(canFulfill('Cancelled'), false)
    assert.equal(canFulfill('Refunded'), false)
  })
})

describe('what an order page shows of its fulfillment', () => {
  // An order as placed: the order's own words for a fulfillment that is Picked.
  const placed = { status: 'Processing', fulfillmentStatus: 'Not Ready', fulfillmentStage: 'Picked' as const, trackingNumber: null, courier: null }
  const labelled = pickCarrier(pack(startProgress('A', AT), AT)!, PARCEL, AT)!

  it('reads as its fulfillment does, so the order and FF-x agree', () => {
    assert.deepEqual(shownFulfillment(placed, startProgress('A', AT)), { status: 'Picked', stage: 'Picked', lineStatus: 'Processing', tracking: null })
    assert.deepEqual(shownFulfillment(placed, labelled), {
      status: 'Label Created', stage: 'Carrier', lineStatus: 'Processing', tracking: { number: '123456789SE', courier: 'PostNord' },
    })
    assert.equal(shownFulfillment({ ...placed, status: 'Completed', fulfillmentStatus: 'Shipped' }, deliver(ship(labelled, AT)!, AT)).status, 'Delivered')
  })

  it('follows the fulfillment even where seeded order data says otherwise, without changing the order', () => {
    const seeded = { status: 'Processing', fulfillmentStatus: 'Shipped', fulfillmentStage: 'Shipped' as const, trackingNumber: '1Z900000000', courier: 'UPS' }
    const before = { ...seeded }
    assert.deepEqual(shownFulfillment(seeded, startProgress('A', AT)), { status: 'Picked', stage: 'Picked', lineStatus: 'Processing', tracking: null })
    assert.deepEqual(seeded, before)
  })

  it('shows the order\'s own without a fulfillment, or when it is not one a fulfillment tracks', () => {
    assert.deepEqual(shownFulfillment(placed), { status: 'Not Ready', stage: 'Picked', lineStatus: null, tracking: null })
    assert.deepEqual(shownFulfillment({ ...placed, fulfillmentStatus: 'Shipped', fulfillmentStage: 'Shipped', trackingNumber: '1Z1', courier: 'UPS' }, null), {
      status: 'Shipped', stage: 'Shipped', lineStatus: null, tracking: { number: '1Z1', courier: 'UPS' },
    })
    // A cancelled order is not being sent, whatever its fulfillment last said.
    assert.equal(shownFulfillment({ ...placed, status: 'Cancelled', fulfillmentStatus: 'Cancelled' }, startProgress('A', AT)).status, 'Cancelled')
    assert.equal(shownFulfillment({ ...placed, status: 'Refunded' }, labelled).status, 'Not Ready')
    // States a fulfillment knows nothing of stay the order's.
    for (const own of ['Unapproved', 'Return Requested', 'Cancelled']) {
      assert.equal(shownFulfillment({ ...placed, fulfillmentStatus: own }, labelled).status, own)
    }
  })
})

describe('where a store order ships from', () => {
  it('a store with a Swedish checkout ships from the Stockholm warehouse, wherever its stock is kept', () => {
    assert.equal(shipsFrom('SEK', 'Oxford Warehouse', 'Oxford warehouse'), 'Stockholm warehouse')
    assert.equal(shipsFrom('sek', undefined, 'Retail Hub - TX'), 'Stockholm warehouse')
  })

  it('any other store ships from where its product is stocked, else from the fallback, as before', () => {
    assert.equal(shipsFrom('USD', 'Oxford Warehouse', 'Retail Hub - TX'), 'Oxford Warehouse')
    assert.equal(shipsFrom(undefined, 'Oxford Warehouse', 'Retail Hub - TX'), 'Oxford Warehouse')
    assert.equal(shipsFrom('USD', undefined, 'Retail Hub - TX'), 'Retail Hub - TX')
    assert.equal(shipsFrom('AUD', undefined, 'Main Warehouse - FL'), 'Main Warehouse - FL')
  })
})

describe('carriers and tracking numbers', () => {
  it('offers the usual carrier of the country first', () => {
    assert.equal(carriersFor('Sweden')[0], 'PostNord')
    assert.equal(carriersFor('United States')[0], 'UPS')
    assert.equal(carriersFor('Norway')[0], 'DHL')
  })

  it('suggests the same number for the same order and carrier', () => {
    assert.equal(suggestedTracking('PostNord', 20001), suggestedTracking('PostNord', 20001))
    assert.notEqual(suggestedTracking('PostNord', 20001), suggestedTracking('PostNord', 20002))
    assert.match(suggestedTracking('PostNord', 20001), /^\d{9}SE$/)
    assert.match(suggestedTracking('UPS', 20001), /^1Z\d{9}$/)
    assert.match(suggestedTracking('DB Schenker', 20001), /^DBS\d{9}$/)
  })

  it('fills a parcel for Mark shipped, keeping a number the merchant typed', () => {
    assert.deepEqual(defaultParcel('Sweden', 20001), { carrier: 'PostNord', service: 'Standard', trackingNumber: suggestedTracking('PostNord', 20001) })
    assert.equal(defaultParcel('United States', 5, ' 1ZABC ').trackingNumber, '1ZABC')
  })
})

describe('saved progress', () => {
  it('is read back only when it has the right shape', () => {
    const shipped = shipNow(startProgress('A', AT), PARCEL, AT)!
    assert.equal(isFulfillmentProgress(JSON.parse(JSON.stringify(shipped))), true)
    assert.equal(isFulfillmentProgress({ ...shipped, status: 'Lost' }), false)
    assert.equal(isFulfillmentProgress({ ...shipped, parcel: { carrier: 'DHL' } }), false)
    assert.equal(isFulfillmentProgress(null), false)
    assert.equal(isProgressMap({ '2000290:20001': shipped }), true)
    assert.equal(isProgressMap({ '2000290:20001': { status: 'Shipped' } }), false)
    assert.equal(isProgressMap([]), false)
  })
})
