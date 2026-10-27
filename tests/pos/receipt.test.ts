import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AU_BUYER_THRESHOLD, COLUMNS, RECEIPT_LIBRARY, addDays, copyName, copyTemplate, fillPlaceholders, libraryTemplate, needsBuyerDetails,
  renderReceipt, resolveTemplate, sampleSale, section, toText, wrap,
  type ReceiptLocation, type ReceiptSale, type ReceiptTemplate,
} from '../../src/views/Retail/receipts/receiptModel.ts'
import { POS_PROMOTIONS, saleTotals, taxRuleFor } from '../../src/views/Retail/pos/saleModel.ts'

const bondi: ReceiptLocation = { brand: 'Maropost Apparel', name: 'Bondi Junction', address: '500 Oxford St, Bondi Junction NSW 2022', country: 'AU', region: 'NSW', phone: '+61 2 9387 1000', taxId: '12 345 678 901' }
const robson: ReceiptLocation = { brand: 'Maropost Apparel', name: 'Robson Street', address: '1025 Robson St, Vancouver BC V6E 1A9', country: 'CA', region: 'BC', phone: '+1 (604) 555-0100', taxId: '123456789 RT0001' }

const standard = libraryTemplate('standard')!
const detailed = libraryTemplate('detailed')!
const text = (t: ReceiptTemplate, sale: ReceiptSale, loc: ReceiptLocation, gift = false) => toText(renderReceipt(t, sale, loc, { gift }))
const longSale = (): ReceiptSale => ({
  ...sampleSale(),
  lines: [
    ...sampleSale().lines,
    { name: 'Poly HL10 Handset Lifter with Straight Plug and Universal Power Supply', variant: 'Black, Universal', sku: 'POLY-HL10-UNIVERSAL-PSU', qty: 12, price: 1299.99 },
  ],
  coupon: { code: 'REFER20', title: 'Refer a friend', kind: 'percent', value: 20 },
  orderDiscount: { kind: 'percent', value: 10, reason: 'Loyalty' },
})

test('every library template fits its paper at 80 mm and 58 mm, even with long names and big totals', () => {
  for (const tpl of RECEIPT_LIBRARY) {
    for (const paper of [80, 58] as const) {
      for (const loc of [bondi, robson]) {
        for (const gift of [false, true]) {
          const lines = text({ ...tpl, paper }, longSale(), loc, gift)
          const over = lines.filter((l) => l.length > COLUMNS[paper])
          assert.deepEqual(over, [], `${tpl.name} ${paper}mm ${loc.country}${gift ? ' gift' : ''} overflows`)
        }
      }
    }
  }
  assert.deepEqual(wrap('Supercalifragilistic', 8), ['Supercal', 'ifragili', 'stic'])
})

test('the receipt total is the sale total: same model as the Charge button', () => {
  for (const [loc, region] of [[bondi, 'NSW'], [robson, 'BC']] as const) {
    const sale = longSale()
    const doc = renderReceipt(detailed, sale, loc)
    const expected = saleTotals(
      sale.lines.map((l) => ({ sku: l.sku, price: l.price, qty: l.qty, discount: l.discount ?? null })),
      { promos: POS_PROMOTIONS, orderDiscount: sale.orderDiscount, coupon: sale.coupon, taxRule: taxRuleFor(loc.country, region) },
    )
    assert.equal(doc.total, expected.total)
    assert.ok(toText(doc).some((l) => l.startsWith('TOTAL') && l.endsWith(new Intl.NumberFormat(loc.country === 'AU' ? 'en-AU' : 'en-CA', { style: 'currency', currency: loc.country === 'AU' ? 'AUD' : 'CAD' }).format(expected.total))))
  }
})

test('Australia: TAX INVOICE, ABN and GST shown as included', () => {
  const lines = text(standard, sampleSale(), bondi)
  assert.ok(lines.some((l) => l.trim() === 'TAX INVOICE'))
  assert.ok(lines.some((l) => l.trim() === 'ABN 12 345 678 901'))
  assert.ok(lines.some((l) => /^Includes GST\s+\$13\.35$/.test(l)), 'GST is 1/11 of $146.90')
  assert.ok(!lines.some((l) => /^GST 10%/.test(l)), 'GST is not added on top')
  assert.ok(lines.some((l) => /^TOTAL\s+\$146\.90$/.test(l)))
  assert.ok(lines.some((l) => /^Date\s+27\/10\/2026 14:32$/.test(l)))
})

test('Canada (BC): GST/HST number, GST and PST added on top, cash rounded to 5c', () => {
  const lines = text(standard, sampleSale(), robson)
  assert.ok(!lines.some((l) => l.includes('TAX INVOICE')))
  assert.ok(lines.some((l) => l.trim() === 'GST/HST No. 123456789 RT0001'))
  assert.ok(lines.some((l) => /^GST 5%\s+\$7\.35$/.test(l)))
  assert.ok(lines.some((l) => /^PST 7%\s+\$10\.28$/.test(l)))
  assert.ok(lines.some((l) => /^TOTAL\s+\$164\.53$/.test(l)))
  assert.ok(lines.some((l) => /^Rounding\s+\$0\.02$/.test(l)), '164.53 rounds up to 164.55')
  assert.ok(lines.some((l) => /^Cash\s+\$200\.00$/.test(l)))
  assert.ok(lines.some((l) => /^Change\s+\$35\.45$/.test(l)))
  assert.ok(lines.some((l) => /^Date\s+2026-10-27 14:32$/.test(l)))
})

test('card payments are exact; no rounding line', () => {
  const lines = text(standard, { ...sampleSale(), tender: 'card', cardLast4: '4242', cashTendered: null }, robson)
  assert.ok(!lines.some((l) => l.startsWith('Rounding')))
  assert.ok(lines.some((l) => /^Card \*\*\*\*4242\s+\$164\.53$/.test(l)))
})

test('discounts print under the item and in the totals, and the rows add up', () => {
  const lines = text(standard, sampleSale(), bondi)
  assert.ok(lines.some((l) => /^ {2}Spring sale 30%\s+-\$23\.40$/.test(l)))
  assert.ok(lines.some((l) => /^ {2}Damaged\s+-\$5\.00$/.test(l)))
  assert.ok(lines.some((l) => /^Subtotal\s+\$202\.00$/.test(l)))
  assert.ok(lines.some((l) => /^Discounts\s+-\$55\.10$/.test(l)), '202.00 - 55.10 = 146.90')
})

test('a gift receipt keeps items, quantities and the return barcode, and shows no prices', () => {
  const lines = text(detailed, sampleSale(), bondi, true)
  assert.ok(lines.some((l) => l.trim() === 'GIFT RECEIPT'))
  assert.ok(!lines.some((l) => l.includes('TAX INVOICE')))
  assert.ok(!lines.some((l) => l.includes('$')), 'no money anywhere')
  assert.ok(lines.some((l) => l.includes('Classic crew tee')))
  assert.ok(lines.some((l) => l.trim() === 'POS-12051'), 'the barcode number is kept for returns')
})

test('hidden sections are left off; sections print in template order', () => {
  const tpl: ReceiptTemplate = { ...standard, sections: [section('footer', { text: 'Bye' }), section('store'), section('details', {}, false), section('items'), section('totals')] }
  const lines = text(tpl, sampleSale(), bondi)
  assert.equal(lines[0]!.trim(), 'Bye')
  assert.ok(!lines.some((l) => l.startsWith('Receipt ')))
})

test('copies record what they are based on, get unique names, and assignments fall back to Standard', () => {
  const copy = copyTemplate(standard, 'rt-1', copyName('Standard', []), '2026-10-27')
  assert.equal(copy.source, 'custom')
  assert.equal(copy.basedOn, 'standard')
  assert.notEqual(copy.sections, standard.sections)
  copy.sections[0]!.settings.showAddress = false
  assert.equal(standard.sections[0]!.settings.showAddress, true, 'editing a copy never changes the library')
  assert.equal(copyTemplate(copy, 'rt-2', 'x', '2026-10-27').basedOn, 'standard', 'a copy of a copy keeps the original lineage')
  assert.equal(copyTemplate(null, 'rt-3', 'Blank', '2026-10-27').basedOn, undefined)
  assert.equal(copyName('Standard', ['Standard copy']), 'Standard copy 2')
  assert.equal(copyName('Standard', ['Standard copy', 'Standard copy 2']), 'Standard copy 3')
  assert.equal(resolveTemplate({ 'pos-store': 'rt-1' }, [copy], 'pos-store').id, 'rt-1')
  assert.equal(resolveTemplate({ 'pos-store': 'compact' }, [], 'pos-store').id, 'compact')
  assert.equal(resolveTemplate({ 'pos-store': 'deleted' }, [], 'pos-store').id, 'standard')
  assert.equal(resolveTemplate({}, [], 'new-channel').id, 'standard')
})

/* ── Benchmark additions: promo, QR link, savings, points, buyer, placeholders ── */

const withSections = (...extra: ReturnType<typeof section>[]): ReceiptTemplate => ({ ...standard, sections: [...standard.sections, ...extra] })

test('a promotion prints its headline, code and validity, and only on qualifying sales', () => {
  const tpl = withSections(section('promo', { headline: '15% off your next visit', code: 'back15', codeFormat: 'text', validDays: 30, minSpend: 50 }))
  const au = text(tpl, sampleSale(), bondi) // $146.90
  assert.ok(au.some((l) => l.trim() === '15% off your next visit'))
  assert.ok(au.some((l) => l.trim() === 'Code BACK15'), 'codes print in capitals')
  assert.ok(au.some((l) => l.trim() === 'Valid until 26 Nov 2026'), '30 days from 27 Oct, in Australian order')
  const ca = text(tpl, sampleSale(), robson)
  assert.ok(ca.some((l) => l.trim() === 'Valid until Nov 26, 2026'), 'Canadian date order')
  const small = text(tpl, { ...sampleSale(), lines: [{ name: 'Cap', variant: 'Navy', sku: 'CAP-001-NVY', qty: 1, price: 35 }] }, bondi)
  assert.ok(!small.some((l) => l.includes('BACK15')), 'a $35 sale is under the $50 minimum')
  const fixed = text(withSections(section('promo', { code: 'REFER20', validUntil: '2026-12-31', validDays: undefined, minSpend: 0 })), sampleSale(), bondi)
  assert.ok(fixed.some((l) => l.trim() === 'Valid until 31 Dec 2026'), "a coupon's own end date wins")
  assert.equal(addDays('2026-12-20', 30), '2027-01-19')
})

test('a QR link prints its label and a short URL that wraps inside the paper', () => {
  const tpl = withSections(section('qr', { label: 'Tell us how we did', url: 'https://maropost.com/feedback/bondi-junction/receipt-survey-2026' }))
  for (const paper of [80, 58] as const) {
    const lines = text({ ...tpl, paper }, sampleSale(), bondi)
    assert.ok(lines.some((l) => l.trim() === 'Tell us how we did'))
    assert.ok(lines.some((l) => l.includes('maropost.com/feedback')))
    assert.ok(!lines.some((l) => l.includes('https://')), 'the scheme is dropped to save paper')
    assert.deepEqual(lines.filter((l) => l.length > COLUMNS[paper]), [])
  }
})

test('"You saved" is the total of every discount, and only prints when there was one', () => {
  const tpl: ReceiptTemplate = { ...standard, sections: standard.sections.map((s) => (s.kind === 'totals' ? section('totals', { showSavings: true }) : s)) }
  assert.ok(text(tpl, sampleSale(), bondi).some((l) => l.trim() === 'You saved $55.10'))
  const full = { ...sampleSale(), lines: [{ name: 'Slim denim', variant: 'Dark, 32', sku: 'JEAN-512-DRK-32', qty: 1, price: 129 }] }
  assert.ok(!text(tpl, full, bondi).some((l) => l.includes('You saved')))
})

test('points earned prints above the new balance when the POS passes it', () => {
  const sale = { ...sampleSale(), customer: { name: 'Hannah Cole', points: 2987, pointsEarned: 147 } }
  const lines = text(detailed, sale, bondi)
  const earned = lines.findIndex((l) => /^Points earned\s+\+147$/.test(l))
  assert.ok(earned >= 0)
  assert.match(lines[earned + 1]!, /^Points balance\s+2,987$/)
  const off: ReceiptTemplate = { ...detailed, sections: detailed.sections.map((s) => (s.kind === 'customer' ? section('customer', { showPointsEarned: false }) : s)) }
  assert.ok(!text(off, sale, bondi).some((l) => l.startsWith('Points earned')))
})

test('placeholders fill from the sale, and a missing name drops out cleanly', () => {
  assert.equal(fillPlaceholders('Thanks {{first_name}}!', { store: 'Bondi Junction', firstName: 'Hannah' }), 'Thanks Hannah!')
  assert.equal(fillPlaceholders('Thanks {{first_name}}!', { store: 'Bondi Junction' }), 'Thanks!')
  assert.equal(fillPlaceholders('Hi {{ first_name }}, welcome to {{store}}.', { store: 'Robson Street' }), 'Hi, welcome to Robson Street.')
  const tpl = withSections(section('header', { text: 'Thanks {{first_name}} for visiting {{store}}' }))
  assert.ok(text(tpl, sampleSale(), bondi).some((l) => l.trim() === 'Thanks Hannah for visiting Bondi Junction'))
})

test('Australia: a tax invoice of $1,000 or more names the buyer; under $1,000 and Canada do not need to', () => {
  const big: ReceiptSale = { ...sampleSale(), customer: null, lines: [{ name: 'Leather tote', variant: 'Black', sku: 'BAG-LTH-BLK', qty: 5, price: 249 }] }
  assert.ok(needsBuyerDetails('AU', 1000) && !needsBuyerDetails('AU', 999.99) && !needsBuyerDetails('CA', 5000))
  assert.equal(AU_BUYER_THRESHOLD, 1000)
  assert.ok(!text(standard, big, bondi).some((l) => l.startsWith('Buyer')), 'unknown buyer: nothing to print yet (the POS asks)')
  const named = text(standard, { ...big, buyer: { name: 'Coastal Fitout Pty Ltd', abn: '98 765 432 109' } }, bondi)
  assert.ok(named.some((l) => /^Buyer\s+Coastal Fitout Pty Ltd$/.test(l)))
  assert.ok(named.some((l) => /^Buyer ABN\s+98 765 432 109$/.test(l)))
  assert.ok(text(standard, { ...big, customer: { name: 'Hannah Cole', points: 0 } }, bondi).some((l) => /^Buyer\s+Hannah Cole$/.test(l)), 'falls back to the customer')
  assert.ok(!text(standard, { ...sampleSale() }, bondi).some((l) => l.startsWith('Buyer')), 'under $1,000')
  assert.ok(!text(standard, { ...big, buyer: { name: 'X' } }, robson).some((l) => l.startsWith('Buyer')), 'not a Canadian rule')
  assert.ok(!text(standard, { ...big, buyer: { name: 'X' } }, bondi, true).some((l) => l.startsWith('Buyer')), 'not on gift receipts')
})

test('every section, including the new ones, fits both paper widths', () => {
  const all: ReceiptTemplate = { ...detailed, sections: [
    section('logo'), section('store'), section('header', { text: 'Thanks {{first_name}} for shopping at {{store}} today' }), section('details', { showStaff: true }),
    section('customer'), section('items', { showSku: true }), section('totals', { showSavings: true }), section('payment'),
    section('promo', { codeFormat: 'qr' }), section('qr'), section('barcode'), section('returns'), section('footer'),
  ] }
  for (const paper of [80, 58] as const) {
    const lines = text({ ...all, paper }, { ...longSale(), customer: { name: 'Hannah Cole', points: 4000, pointsEarned: 15000 }, buyer: { name: 'Coastal Fitout Pty Ltd', abn: '98 765 432 109' } }, bondi)
    assert.deepEqual(lines.filter((l) => l.length > COLUMNS[paper]), [], `${paper} mm`)
  }
})
