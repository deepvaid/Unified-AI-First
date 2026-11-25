import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ASSISTANT_PROFILES, assistantProfile } from '../../src/chatbot/assistantProfiles.ts'
import { chatLineVehicle, kindAsked, partByNumber, partsNamed, vehiclesCovered } from '../../src/chatbot/partsAnswers.ts'
import { NEW_CONVERSATION, assistantProduct, assistantReply } from '../../src/chatbot/storeAssistant.ts'
import type { AssistantContext, AssistantOrder, AssistantReply, AssistantState, AssistantTurn } from '../../src/chatbot/storeAssistant.ts'
import { addLine } from '../../src/storefront/cart.ts'
import type { CartLine } from '../../src/storefront/cart.ts'
import { snapshotFor } from '../../src/storefront/demoStores/install.ts'
import { NORTHFOLD_BLUEPRINT } from '../../src/storefront/demoStores/northfold.ts'
import { TORQLINE_BLUEPRINT } from '../../src/storefront/demoStores/torqline.ts'
import type { Vehicle } from '../../src/storefront/fitment.ts'
import { productHandle } from '../../src/storefront/handles.ts'
import { TORQLINE_CHATBOT } from '../../src/storefront/torqlineDemo.ts'

// The Torqline assistant (the auto-parts profile), tested against the store's real
// seed: its 21 parts with their fitment rows, part numbers, prices and stock, and
// the knowledge base its chatbot ships with.

const snap = snapshotFor(TORQLINE_BLUEPRINT.homeChannel, 'torqline', '2026-11-23')
const products = snap.products.map((p) => assistantProduct(p, `/products/${productHandle(p)}`))
const entries = TORQLINE_CHATBOT.knowledgeSources!.flatMap((s) => (s.entries ?? []).map((e) => ({ ...e, source: s.name })))
const nameOf = (id: number) => products.find((p) => p.id === id)!.name

const F150: Vehicle = { year: 2019, make: 'Ford', model: 'F-150' }
const CIVIC_2015: Vehicle = { year: 2015, make: 'Honda', model: 'Civic' }
const MARCUS = 'marcus.reed@example.com'
const order = (over: Partial<AssistantOrder> = {}): AssistantOrder => ({
  id: 900014, number: '#20014', email: MARCUS, date: '2026-11-22', status: 'Processing', fulfillment: 'Not Ready',
  tracking: null, items: [{ name: 'Ceramic Brake Pads, Truck & SUV', qty: 1 }], total: '$64.99', ...over,
})
const usDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** The store as the chat widget sees it on Torqline: it keeps a vehicle (null until one is chosen). */
const ctx = (over: Partial<AssistantContext> = {}): AssistantContext => ({
  email: null, orders: [order()], subscriptions: [], products, entries,
  shoppingEnabled: true, trackingEnabled: true, demo: true,
  promotion: 'Brake week: 15% off brakes with code BRAKES15',
  profile: 'auto-parts', formatDay: usDay, vehicle: null, ...over,
})

/** A conversation; a turn that sets the vehicle sets it on the store, as the widget does. */
function chat(messages: string[], context = ctx(), state: AssistantState = NEW_CONVERSATION): AssistantTurn & { turns: AssistantTurn[]; store: AssistantContext } {
  const turns: AssistantTurn[] = []
  let store = context
  let now = state
  for (const message of messages) {
    const turn = assistantReply(message, store, now)
    turns.push(turn)
    if (turn.vehicle) store = { ...store, vehicle: turn.vehicle }
    now = turn.state
  }
  return { ...turns[turns.length - 1]!, turns, store }
}
const said = (message: string, context = ctx()): string => chat([message], context).replies.map((r) => r.text).join(' ')
const cards = (turn: AssistantTurn): number[] => turn.replies.flatMap((r) => (r.kind === 'products' ? r.productIds : []))
const actionOf = (reply: AssistantReply | undefined) => (reply?.kind === 'text' ? reply.action : undefined)
const MECHANIC = 'Brakes are safety parts: unless you’ve done the job before, have a qualified mechanic fit them.'
/** The store's own words on brake work (its "Brake work" knowledge entry). */
const BRAKE_WORK = entries.find((e) => e.title === 'Brake work')!.text
const linkOf = (reply: AssistantReply | undefined) => (reply?.kind === 'text' || reply?.kind === 'answer' ? reply.link : undefined)

// ── The profile ──────────────────────────────────────────────────────────────

test('Torqline’s chatbot is on the auto-parts profile, which reads like a parts store and sells no subscriptions', () => {
  assert.equal(snap.chatbot.assistantProfile, 'auto-parts')
  const profile = assistantProfile('auto-parts')
  assert.equal(profile, ASSISTANT_PROFILES['auto-parts'])
  assert.equal(profile.subscriptions, false)
  assert.ok(profile.parts)
  assert.match(profile.help, /part fits your vehicle.*part number/)
  assert.match(profile.placeholder, /part/)
  assert.match(said('Hi'), /^Hi! I can check whether a part fits your vehicle/)
  assert.match(said('How do I pause my subscription?'), /We don’t sell subscriptions/)
})

test('only a part carries its category, fitment and variants to the assistant, so other stores’ products read as before', () => {
  const pads = products.find((p) => p.id === 4001)!
  assert.equal(pads.category, 'Brakes')
  assert.deepEqual(pads.variants!.map((v) => [v.label, v.sku, v.price]), [['Front', 'TQ-BRK-4471', 64.99], ['Rear', 'TQ-BRK-4472', 64.99]])
  assert.equal(products.find((p) => p.id === 4004)!.variants!.find((v) => v.label === 'Rear')!.units, 0)
  const northfold = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-19').products
  for (const product of northfold) {
    const read = assistantProduct(product)
    assert.equal('variants' in read || 'fitment' in read || 'category' in read, false, product.name)
  }
})

// ── Does it fit ──────────────────────────────────────────────────────────────

test('on a brake pad page, “does this fit my 2019 F-150?” answers from its fitment, with part numbers, and offers to set the vehicle', () => {
  const turn = chat(['does this fit my 2019 F-150?'], ctx({ currentProductId: 4001 }))
  const [answer, mechanic, offer] = turn.replies
  assert.equal(answer!.text, 'Yes. The Ceramic Brake Pads, Truck & SUV fit your 2019 Ford F-150. Front: part # TQ-BRK-4471, $64.99. Rear: part # TQ-BRK-4472, $64.99.')
  // Brake pads are a mechanic's job: one line says so, after the fit.
  assert.equal(mechanic!.text, MECHANIC)
  assert.deepEqual(linkOf(answer), { label: 'View Ceramic Brake Pads, Truck & SUV', href: '/products/ceramic-brake-pads-truck-suv-4001' })
  assert.equal(offer!.text, 'Want me to set your vehicle to 2019 Ford F-150? The store will then show the parts that fit it.')
  assert.deepEqual(actionOf(offer), { kind: 'set-vehicle', vehicle: F150, label: 'Show parts for my 2019 Ford F-150' })
  // Never silently: the vehicle is only offered.
  assert.equal(turn.vehicle, undefined)
  assert.deepEqual(turn.state.offer, F150)
  assert.equal(turn.state.productId, 4001)
})

test('a part named in the message is checked, whatever page the shopper is on', () => {
  const turn = chat(['do the ceramic brake pads fit a 2016 Civic?'], ctx({ currentProductId: 4016 }))
  assert.equal(turn.replies[0]!.text, 'Yes. The Ceramic Brake Pads, Car & Crossover fit a 2016 Honda Civic. Front: part # TQ-BRK-4481, $49.99. Rear: part # TQ-BRK-4482, $49.99, only 2 left. The Ceramic Brake Pads, Truck & SUV don’t.')
  // "a 2016 Civic" may not be theirs: no offer to set it, only the mechanic line.
  assert.deepEqual(turn.replies.slice(1).map((r) => r.text), [MECHANIC])
  assert.equal(turn.state.offer, undefined)
  // The vehicle and the part carry to the follow-up.
  assert.match(chat(['do the ceramic brake pads fit a 2016 Civic?', 'what about a 2015 Civic?']).replies[0]!.text, /^No\. The Ceramic Brake Pads, Car & Crossover don’t fit a 2015 Honda Civic\. None of our brake pads fit it\./)
  assert.match(said('Is the AGM battery compatible with my 2019 F-150?'), /^Yes\. The AGM Battery fits your 2019 Ford F-150\. Part # TQ-BAT-4870, \$219\.99, only 3 left\./)
})

test('when a part doesn’t fit, the store’s parts of that kind that do are listed, or the answer says none does', () => {
  const turn = chat(['does this fit my 2019 F-150?'], ctx({ currentProductId: 4002 }))
  assert.equal(turn.replies[0]!.text, 'No. The Ceramic Brake Pads, Car & Crossover don’t fit your 2019 Ford F-150.')
  assert.equal(turn.replies[1]!.text, 'Brake pads that fit your 2019 Ford F-150:')
  assert.deepEqual(cards(turn), [4001])
  const civic = chat(['does it fit a 2015 Honda Civic?'], ctx({ currentProductId: 4002 }))
  assert.equal(civic.replies[0]!.text, 'No. The Ceramic Brake Pads, Car & Crossover don’t fit a 2015 Honda Civic. None of our brake pads fit it.')
  assert.deepEqual(linkOf(civic.replies[0]), { label: 'See all brake pads', href: '/collections/brakes' })
})

test('the size a wiper row names picks its part number, and a universal part says it fits any vehicle', () => {
  assert.equal(said('will the beam wiper fit my 2019 F-150?').split(' Want me')[0], 'Yes. The All-Season Beam Wiper Blade fits your 2019 Ford F-150. Driver 22 in, passenger 22 in. 22 in: part # TQ-WPR-6022, $21.99.')
  assert.match(said('does the motor oil fit my 2019 F-150?'), /^Yes\. The Full Synthetic Motor Oil is a universal fit, so it works with your 2019 Ford F-150\. It comes in 0W-20, 5W-20 and 5W-30\. Your owner’s manual says which one your vehicle takes\./)
})

test('a vehicle the store doesn’t list gets the vehicles it does, never a guess', () => {
  for (const message of ['does the AGM battery fit a 2018 Jeep Grand Cherokee?', 'I drive a 2018 Jeep Grand Cherokee']) {
    const turn = chat([message])
    assert.equal(turn.replies.length, 1)
    assert.equal(turn.replies[0]!.text, `I can’t check that vehicle. ${vehiclesCovered()} For another vehicle, match the part number on your old part, or write to us and we’ll help.`, message)
    assert.doesNotMatch(turn.replies[0]!.text, /^(Yes|No)\b/)
    assert.equal(turn.vehicle, undefined)
  }
  assert.equal(vehiclesCovered(), 'We list parts for 2015 to 2024 models of the Ford F-150, Chevrolet Silverado 1500, Ram 1500, Toyota RAV4, Honda CR-V, Toyota Camry, Honda Civic, Toyota Tacoma, Jeep Wrangler and Nissan Rogue.')
  assert.equal(said('does this fit my 2012 F-150?', ctx({ currentProductId: 4001 })), 'We list parts for the Ford F-150 from 2015 to 2024, so I can’t check a 2012. Match the part number on your old part, or write to us and we’ll help.')
})

test('a model without its year is asked for its year, and the year answers the question', () => {
  const turn = chat(['does the AGM battery fit my F-150?', '2019'])
  assert.equal(turn.turns[0]!.replies[0]!.text, 'Which year is your Ford F-150? We list parts for it from 2015 to 2024.')
  assert.match(turn.replies[0]!.text, /^Yes\. The AGM Battery fits your 2019 Ford F-150\./)
  // The vehicle already chosen is that model: no question back.
  assert.match(said('does the AGM battery fit my F-150?', ctx({ vehicle: F150 })), /^Yes\. The AGM Battery fits your 2019 Ford F-150\./)
})

// ── Setting the vehicle ──────────────────────────────────────────────────────

test('a vehicle the shopper names is offered, and set only on their yes, with a reply that says so', () => {
  for (const message of ['I drive a 2019 F-150', 'my truck is a 2019 F-150']) {
    const offered = chat([message])
    assert.equal(offered.replies[0]!.text, 'Want me to set your vehicle to 2019 Ford F-150? The store will then show the parts that fit it.', message)
    assert.equal(offered.vehicle, undefined)
  }
  const yes = chat(['I drive a 2019 F-150', 'yes please'])
  assert.deepEqual(yes.vehicle, F150)
  assert.equal(yes.replies[0]!.text, 'Showing parts for your 2019 Ford F-150.')
  assert.equal(yes.replies.length, 1)
  const no = chat(['my car is a 2017 CR-V', 'no thanks'])
  assert.equal(no.vehicle, undefined)
  assert.equal(no.replies[0]!.text, 'No problem. I’ll leave your vehicle as it is.')
  // A "yes" with no offer waiting sets nothing.
  assert.equal(chat(['yes']).vehicle, undefined)
  // The vehicle already set is not offered again.
  assert.equal(said('I drive a 2019 F-150', ctx({ vehicle: F150 })), 'Your 2019 Ford F-150 is already set, so the store shows the parts that fit it.')
})

test('asked to set the vehicle, the chat sets it right away and says so', () => {
  for (const message of ['set my vehicle to a 2019 F-150', 'change my truck to a 2019 Ford F-150', 'show parts for my 2019 F-150']) {
    const turn = chat([message])
    assert.deepEqual(turn.vehicle, F150, message)
    assert.equal(turn.replies[0]!.text, 'Showing parts for your 2019 Ford F-150.', message)
  }
})

test('setting the vehicle needs a request to set it: a part after the vehicle word, or someone else’s vehicle, sets nothing', () => {
  const wipers = chat(['I need to change my car wipers, it is a 2019 Toyota Camry'])
  assert.equal(wipers.vehicle, undefined)
  assert.equal(wipers.replies[0]!.text, 'Wiper blades that fit your 2019 Toyota Camry:')
  assert.deepEqual(cards(wipers), [4016])
  assert.deepEqual(actionOf(wipers.replies.at(-1))?.kind, 'set-vehicle', 'offered, not set')
  const battery = chat(['time to update my truck battery, 2018 Ram 1500'])
  assert.equal(battery.vehicle, undefined)
  assert.deepEqual(cards(battery), [4013])
  const friend = chat(['does this fit my friend’s 2019 Ford F-150? I want to change my car later'], ctx({ currentProductId: 4001 }))
  assert.equal(friend.vehicle, undefined)
  assert.equal(friend.state.offer, undefined)
  assert.match(friend.replies[0]!.text, /^Yes\. The Ceramic Brake Pads, Truck & SUV fit a 2019 Ford F-150\./)
  assert.ok(friend.replies.every((r) => !actionOf(r)))
  for (const message of ['show parts for my friend’s 2019 F-150', 'my dad drives a 2019 F-150']) {
    const turn = chat([message])
    assert.equal(turn.vehicle, undefined, message)
    assert.ok(turn.replies.every((r) => !actionOf(r)), message)
  }
  assert.equal(said('my dad drives a 2019 F-150'), 'Which part are you looking for? I’ll check what fits a 2019 Ford F-150.')
})

test('asked to set the vehicle along with a question, the chat sets it and still answers the question', () => {
  const turn = chat(['set my vehicle to a 2019 F-150 and show me brake pads'])
  assert.deepEqual(turn.vehicle, F150)
  assert.deepEqual(turn.replies.map((r) => r.text), ['Showing parts for your 2019 Ford F-150.', 'Brake pads that fit your 2019 Ford F-150:', MECHANIC])
  assert.deepEqual(cards(turn), [4001])
  assert.deepEqual(chat(['set vehicle 2019 F-150']).vehicle, F150)
  assert.deepEqual(chat(['change my car to a 2017 CR-V, what wipers fit?']).replies.map((r) => r.text), ['Showing parts for your 2017 Honda CR-V.', 'Wiper blades that fit your 2017 Honda CR-V:'])
})

test('after an offer, only a plain yes or no answers it; anything else is a question, and drops the offer', () => {
  for (const yes of ['yes', 'Yes, please!', 'sure, go ahead', 'ok']) assert.deepEqual(chat(['I drive a 2019 F-150', yes]).vehicle, F150, yes)
  const please = chat(['I drive a 2019 F-150', 'Please show me wiper blades'])
  assert.equal(please.vehicle, undefined)
  assert.equal(please.replies[0]!.text, 'Wiper blades that fit your 2019 Ford F-150:')
  assert.deepEqual(cards(please), [4016])
  const ok = chat(['I drive a 2019 F-150', 'ok and batteries?'])
  assert.equal(ok.vehicle, undefined)
  assert.deepEqual(cards(ok), [4012])
  const dont = chat(['I drive a 2019 F-150', 'Don’t you have rear pads?'])
  assert.notEqual(dont.replies[0]!.text, 'No problem. I’ll leave your vehicle as it is.')
  assert.deepEqual(cards(dont), [4001])
  // The offer is gone: a later "yes" sets nothing.
  assert.equal(chat(['I drive a 2019 F-150', 'Please show me wiper blades', 'yes']).vehicle, undefined)
  assert.equal(chat(['I drive a 2019 F-150', 'no thanks']).replies[0]!.text, 'No problem. I’ll leave your vehicle as it is.')
})

test('a store that keeps no vehicle is never offered one', () => {
  const turn = chat(['does this fit my 2019 F-150?', 'yes'], ctx({ vehicle: undefined, currentProductId: 4001 }))
  assert.ok(turn.turns[0]!.replies.every((r) => !actionOf(r)))
  assert.equal(turn.turns[0]!.state.offer, undefined)
  assert.equal(turn.vehicle, undefined)
})

// ── What fits my vehicle ─────────────────────────────────────────────────────

test('“what brake pads fit my car?” lists the pads that fit the chosen vehicle, with prices', () => {
  const turn = chat(['what brake pads fit my car?'], ctx({ vehicle: F150 }))
  const reply = turn.replies[0]!
  assert.equal(reply.text, 'Brake pads that fit your 2019 Ford F-150:')
  assert.deepEqual(cards(turn), [4001])
  assert.ok(reply.kind === 'products' && reply.notes?.[4001] === 'Front or rear · $64.99')
  assert.deepEqual(turn.replies.slice(1).map((r) => r.text), [MECHANIC], 'the chosen vehicle is not offered again')
  // A 2015 Civic has no brake parts.
  assert.equal(said('what brake pads fit my car?', ctx({ vehicle: CIVIC_2015 })), 'None of our brake pads fit your 2015 Honda Civic.')
  // Universal parts come after those that fit; parts that can't be bought aren't listed.
  const batteries = chat(['which batteries fit my 2017 CR-V?'])
  assert.deepEqual(cards(batteries), [4013])
  assert.ok(batteries.replies[0]!.kind === 'products' && batteries.replies[0]!.notes?.[4013] === 'Part # TQ-BAT-3510 · $159.99')
})

test('a vehicle named in the question is used, and every part that fits a 2019 F-150 is counted', () => {
  const turn = chat(['what fits my 2019 F-150?'])
  assert.match(turn.replies[0]!.text, /^11 of our parts fit your 2019 Ford F-150\. Here are a few;/)
  assert.deepEqual(cards(turn), [4001, 4003, 4006, 4008])
  assert.deepEqual(actionOf(turn.replies.at(-1)), { kind: 'set-vehicle', vehicle: F150, label: 'Show parts for my 2019 Ford F-150' })
  assert.deepEqual(cards(chat(['rear wiper for a 2019 RAV4'])), [4017])
})

test('without a vehicle, the chat asks for one and offers the vehicle selector; the vehicle given next answers the question', () => {
  const asked = chat(['what brake pads fit my car?'])
  assert.deepEqual(cards(asked), [4001, 4002])
  const question = asked.replies.at(-1)!
  assert.equal(question.text, 'Which vehicle is it for? Tell me the year, make and model, like 2019 Ford F-150, or choose it here.')
  assert.deepEqual(actionOf(question), { kind: 'choose-vehicle', label: 'Choose your vehicle' })
  assert.equal(asked.state.asked, 'what brake pads fit my car?')
  const answered = chat(['what brake pads fit my car?', '2019 F-150'])
  assert.equal(answered.replies[0]!.text, 'Brake pads that fit your 2019 Ford F-150:')
  assert.deepEqual(cards(answered), [4001])
  assert.equal(answered.vehicle, undefined, 'still only offered')
  assert.deepEqual(answered.state.offer, F150)
  // Choosing the vehicle in the selector, then asking again, answers for it.
  assert.equal(chat(['what brake pads fit my car?'], ctx({ vehicle: F150 })).replies[0]!.text, 'Brake pads that fit your 2019 Ford F-150:')
  // On a page, "does this fit my vehicle?" asks too.
  assert.equal(chat(['Does this part fit my vehicle?'], ctx({ currentProductId: 4001 })).replies[0]!.text, question.text)
})

test('the conversation keeps the vehicle it was about for a follow-up', () => {
  const turn = chat(['Will the front brake pads fit my 2019 F-150?', 'And the rotors?'], ctx({ vehicle: CIVIC_2015 }))
  assert.equal(turn.turns[0]!.replies[0]!.text, 'Yes. The Ceramic Brake Pads, Truck & SUV fit your 2019 Ford F-150. Front: part # TQ-BRK-4471, $64.99. The Ceramic Brake Pads, Car & Crossover don’t.')
  assert.equal(turn.replies[0]!.text, 'Brake rotors that fit your 2019 Ford F-150:')
  assert.deepEqual(cards(turn), [4003])
})

// ── Part numbers ─────────────────────────────────────────────────────────────

test('a part number, written any way, finds its part and variant, with its price and stock', () => {
  for (const message of ['TQ-BRK-4471', 'do you have part tq brk 4471', 'tqbrk4471?']) {
    const turn = chat([message])
    assert.equal(turn.replies[0]!.text, 'Part # TQ-BRK-4471 is the Ceramic Brake Pads, Truck & SUV (Front): $64.99, in stock.', message)
    assert.deepEqual(linkOf(turn.replies[0]), { label: 'View Ceramic Brake Pads, Truck & SUV', href: '/products/ceramic-brake-pads-truck-suv-4001?position=front' })
    assert.equal(turn.state.productId, 4001)
  }
  assert.equal(partByNumber('TQ-BRK-44710', products), null)
  assert.match(said('TQ-BRK-5182'), /^Part # TQ-BRK-5182 is the Coated Brake Rotor, Car & Crossover \(Rear\): \$59\.99, sold out right now\./)
  assert.match(said('TQ-IGN-8108'), /\(Set of 8\): \$75\.99, only 1 left\./)
  assert.equal(said('TQ-BRK-9999'), 'I can’t find part number TQ-BRK-9999. Check the number on your old part or its box, or tell me your vehicle and the part you need.')
  assert.equal(said('Look up a part number'), 'Type the part number here, like TQ-BRK-4471, and I’ll look it up. It’s printed on your old part or its box.')
})

test('a part number is checked against the vehicle, and points to what fits when it doesn’t', () => {
  const vehicle = ctx({ vehicle: F150 })
  assert.equal(said('TQ-BRK-4471', vehicle), 'Part # TQ-BRK-4471 is the Ceramic Brake Pads, Truck & SUV (Front): $64.99, in stock. It fits your 2019 Ford F-150.')
  assert.equal(said('TQ-WPR-6016', vehicle), 'Part # TQ-WPR-6016 is the All-Season Beam Wiper Blade (16 in): $21.99, in stock. It doesn’t fit your 2019 Ford F-150. The 22 in one does: part # TQ-WPR-6022.')
  const pads = chat(['TQ-BRK-4481'], vehicle)
  assert.match(pads.replies[0]!.text, /It doesn’t fit your 2019 Ford F-150\.$/)
  assert.deepEqual(cards(pads), [4001])
  assert.match(said('TQ-OIL-1530', vehicle), /It’s a universal fit\.$/)
  // Without a vehicle it asks, and the vehicle given next checks it.
  const asked = chat(['TQ-BRK-4481', '2019 F-150'])
  assert.deepEqual(actionOf(asked.turns[0]!.replies[1]), { kind: 'choose-vehicle', label: 'Choose your vehicle' })
  assert.match(asked.replies[0]!.text, /It doesn’t fit your 2019 Ford F-150\.$/)
})

test('a stock question about one part answers from its variants', () => {
  assert.equal(said('Is the AGM battery in stock?'), 'AGM Battery: only 3 left, $219.99.')
  assert.equal(said('is it in stock?', ctx({ currentProductId: 4016 })), 'All-Season Beam Wiper Blade: in stock in every length, $21.99.')
  assert.equal(said('is it in stock?', ctx({ currentProductId: 4004 })), 'Coated Brake Rotor, Car & Crossover: Front in stock, Rear sold out right now.')
})

// ── Caution ──────────────────────────────────────────────────────────────────

const SAFETY = /^That’s a safety question, so please have a qualified mechanic look at your vehicle before you drive it\./
const FLUIDS = /^Fluids and batteries need care/
const HEALTH = /^I can’t give medical advice\. .*Poison Control at 1-800-222-1222/

test('doing brake work yourself gets the store’s own words on brake work, never a how-to', () => {
  for (const message of ['How do I replace the brake pads on my 2019 F-150?', 'Can I replace my own brake pads?', 'Can I bleed the brakes myself?', 'how to change brake rotors']) {
    const turn = chat([message])
    assert.equal(turn.replies.length, 1, message)
    assert.equal(turn.replies[0]!.kind, 'answer', message)
    assert.equal(turn.replies[0]!.text, BRAKE_WORK, message)
    assert.deepEqual(linkOf(turn.replies[0]), { label: 'Read: Brake work', href: '/page/fitment-guarantee' }, message)
    assert.equal(cards(turn).length, 0, message)
    assert.equal(turn.vehicle, undefined, message)
  }
  assert.match(BRAKE_WORK, /qualified mechanic fit pads and rotors/)
  // A store without that page says it in the profile's words.
  assert.match(said('Can I replace my own brake pads?', ctx({ entries: [] })), /^Brakes are safety parts, so unless you’ve done the job before, have a qualified mechanic fit pads and rotors/)
})

test('a symptom, “is it safe to drive”, steering, suspension and airbags get a mechanic, never a product or a diagnosis', () => {
  for (const message of [
    'my brakes are grinding, what pads do I need?', 'Is it safe to drive with my brakes squealing?', 'my airbag light is on',
    'my steering wheel shakes', 'do you sell struts for a 2019 F-150?', 'is it ok to drive with a dead battery?', 'brake pedal feels spongy',
    'my brakes make a noise',
  ]) {
    const turn = chat([message])
    assert.equal(turn.replies.length, 1, message)
    assert.match(turn.replies[0]!.text, SAFETY, message)
    assert.equal(cards(turn).length, 0, message)
    assert.equal(turn.vehicle, undefined, message)
    assert.equal(turn.state.offer, undefined, message)
  }
})

test('a shopping question about brake parts gets the fit, then one line recommending a mechanic', () => {
  const replace = chat(['I need to replace the brake pads on my 2019 F-150, which ones fit?'])
  assert.equal(replace.replies[0]!.text, 'Brake pads that fit your 2019 Ford F-150:')
  assert.deepEqual(cards(replace), [4001])
  assert.equal(replace.replies[1]!.text, MECHANIC)
  const quiet = chat(['quiet brake pads that won’t make noise for a 2019 F-150'])
  assert.deepEqual(cards(quiet), [4001])
  assert.deepEqual(quiet.replies.map((r) => r.text), ['Brake pads that fit a 2019 Ford F-150:', MECHANIC])
  assert.deepEqual(cards(chat(['how do I know which brake pads fit my 2019 F-150?'])), [4001])
  // Only parts a mechanic should fit get the line: not wipers, not brake fluid, not a list of everything.
  assert.ok(!said('what wipers fit my 2019 F-150?').includes(MECHANIC))
  assert.ok(!said('does the DOT 4 brake fluid fit my 2019 F-150?').includes(MECHANIC))
  assert.ok(!said('what fits my 2019 F-150?').includes(MECHANIC))
})

test('handling fluids and batteries gets the label and a mechanic; a health question gets no advice', () => {
  for (const message of ['how do I dispose of old oil?', 'my battery is swollen', 'there’s a coolant leak under my car', 'how do i jump start my car', 'Is the jump starter safe to use?']) {
    assert.match(said(message), FLUIDS, message)
  }
  for (const message of ['I got battery acid in my eyes', 'my kid swallowed some brake fluid', 'I spilled brake fluid on my hands, is it toxic?', 'I feel dizzy from the fumes']) {
    assert.match(said(message), HEALTH, message)
  }
})

test('fit and shopping questions that name brakes are not mistaken for brake work', () => {
  assert.match(said('do the ceramic brake pads fit a 2016 Civic?'), /^Yes\./)
  assert.equal(said('replacement brake pads for my 2019 F-150').split(' Want me')[0], `Brake pads that fit your 2019 Ford F-150: ${MECHANIC}`)
  assert.match(said('does the DOT 4 brake fluid fit my 2019 F-150?'), /^Yes\. The DOT 4 Brake Fluid is a universal fit/)
})

// ── The store’s own answers ──────────────────────────────────────────────────

test('orders, returns, discounts and a person are answered as on every store', () => {
  assert.equal(said('Where is my order?'), 'I can check that. Which email did you order with?')
  assert.match(said(`Where is order #20014? My email is ${MARCUS}`), /^Order #20014, placed Nov 22, 2026: Ceramic Brake Pads, Truck & SUV, \$64\.99\./)
  assert.match(said('How do returns work?'), /^Returns are free within 90 days/)
  assert.equal(said('Is there a discount on brake pads?'), 'Yes. Brake week: 15% off brakes with code BRAKES15. Type the code in your cart or at checkout.')
  assert.equal(said('any deals?', ctx({ promotion: '' })), 'There’s no discount code running right now. Our Deals collection has a few parts at a lower price.')
  assert.match(said('Can I talk to a human?'), /^Of course\./)
  assert.match(said('Can I return brake pads that don’t fit my 2019 F-150?'), /^(Returns are free|If a part we say fits)/)
})

test('an exchange or return question goes to the store’s pages, never to a suggestion', () => {
  for (const message of ['Can I exchange my wiper blades for a longer size?', 'Can I return a part from the deals?', 'Can I swap the battery for a bigger one?']) {
    const turn = chat([message])
    assert.equal(turn.replies[0]!.kind, 'answer', message)
    assert.match(turn.replies[0]!.text, /^Returns are free within 90 days/, message)
    assert.equal(cards(turn).length, 0, message)
  }
  // A suggestion outside the parts answers reads as a sentence, and never offers a sold-out part.
  assert.deepEqual(assistantProfile('auto-parts').suggestionLead, { one: 'this is the one that matches', many: 'these are the ones that match' })
  const soldOut = products.map((p) => (p.id === 4021 ? { ...p, variants: p.variants!.map((v) => ({ ...v, units: 0 })) } : p))
  assert.ok(!cards(chat(['What do you recommend for a jump starter?'], ctx({ products: soldOut }))).includes(4021))
})

test('a part the chat adds to the cart carries the shopper’s vehicle when it fits, like every other Add to cart', () => {
  const agm = snap.products.find((p) => p.id === 4012)!
  assert.equal(chatLineVehicle(agm, F150), '2019 Ford F-150')
  assert.equal(chatLineVehicle(snap.products.find((p) => p.id === 4013)!, F150), undefined, 'it doesn’t fit')
  assert.equal(chatLineVehicle(snap.products.find((p) => p.id === 4021)!, F150), undefined, 'universal parts carry none')
  assert.equal(chatLineVehicle(agm, null), undefined)
  // Added again from the chat, a line that carries the vehicle keeps it.
  const line = (vehicle?: string): CartLine => ({ productId: 4012, name: agm.name, sku: 'TQ-BAT-4870', price: '219.99', qty: 1, ...(vehicle ? { vehicle } : {}) })
  const lines = addLine(addLine([], line('2019 Ford F-150')), line(chatLineVehicle(agm, F150)))
  assert.deepEqual(lines.map((l) => [l.qty, l.vehicle]), [[2, '2019 Ford F-150']])
})

test('every quick prompt of the Torqline chatbot gets a real answer', () => {
  const prompts = TORQLINE_CHATBOT.quickPrompts!.map((p) => p.text)
  assert.equal(prompts.length, 5)
  for (const prompt of prompts) {
    const turn = chat([prompt], ctx({ currentProductId: 4001 }))
    assert.equal(turn.offerPrompts, false, prompt)
    assert.doesNotMatch(turn.replies[0]!.text, /I’m not sure/, prompt)
  }
  // With a vehicle chosen, "Does this part fit my vehicle?" on a page is answered at once.
  assert.match(said('Does this part fit my vehicle?', ctx({ currentProductId: 4001, vehicle: F150 })), /^Yes\. The Ceramic Brake Pads, Truck & SUV fit your 2019 Ford F-150\./)
})

// ── How a message is read ────────────────────────────────────────────────────

test('the words of a question and of a vehicle never name a part, and kinds of part map to the right parts', () => {
  assert.deepEqual(partsNamed('does this fit my truck', products), [])
  assert.deepEqual(partsNamed('does it fit a 2019 Ford F-150 or a Honda CR-V', products), [])
  assert.deepEqual(partsNamed('the AGM battery', products).map((p) => p.id), [4012])
  const profile = assistantProfile('auto-parts')
  const kind = (message: string) => kindAsked(message, products, profile)?.products.map((p) => p.id)
  assert.deepEqual(kind('brake pads'), [4001, 4002])
  assert.deepEqual(kind('rotors'), [4003, 4004])
  assert.deepEqual(kind('an oil filter'), [4005, 4006, 4007])
  assert.deepEqual(kind('motor oil'), [4010])
  assert.deepEqual(kind('cabin air filter'), [4009])
  assert.deepEqual(kind('batteries'), [4012, 4013])
  assert.deepEqual(kind('headlights'), [4014, 4015])
  assert.deepEqual(kind('rear wiper'), [4017])
  assert.deepEqual(kind('spark plugs'), [4018])
  assert.deepEqual(kind('a jump starter'), [4021])
  assert.equal(kind('hello'), undefined)
  assert.equal(nameOf(4021), 'Portable Jump Starter')
})

// ── Other stores ─────────────────────────────────────────────────────────────

test('the apparel and wellness profiles know nothing of parts, so a fit question there sets no vehicle and offers none', () => {
  assert.equal(assistantProfile('apparel').parts, undefined)
  assert.equal(assistantProfile('wellness').parts, undefined)
  const northfold = snapshotFor(NORTHFOLD_BLUEPRINT.homeChannel, 'northfold', '2026-11-19')
  const apparel = ctx({ profile: 'apparel', products: northfold.products.map((p) => assistantProduct(p)), sizeCharts: northfold.sizeCharts, vehicle: undefined })
  for (const message of ['does this fit my 2019 F-150?', 'I drive a 2019 F-150', 'TQ-BRK-4471', 'set my vehicle to a 2019 F-150']) {
    for (const context of [apparel, ctx({ profile: 'wellness', vehicle: undefined })]) {
      const turn = chat([message, 'yes'], context)
      for (const t of turn.turns) {
        assert.equal(t.vehicle, undefined, message)
        assert.equal(t.state.offer, undefined, message)
        assert.ok(t.replies.every((r) => !actionOf(r)), message)
      }
    }
  }
})
