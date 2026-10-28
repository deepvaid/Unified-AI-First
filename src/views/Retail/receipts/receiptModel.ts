/**
 * Receipt templates for the register — pure, so a printed receipt can be proven
 * to match the sale and to fit the printer's paper (tests/pos/receipt.test.ts).
 *
 * A template is an ordered list of sections. Rendering turns a template plus a
 * sale into rows; layout turns rows into fixed-width lines, the way a thermal
 * printer prints them. The preview draws those same lines, so what the designer
 * shows is what the printer gets.
 */
import { formatDate, formatMoney, lineBreakdown, saleTotals, taxRuleFor, cashRound, changeDue, POS_PROMOTIONS } from '../pos/saleModel.ts'
import type { Country, Coupon, LineDiscount, PosPromotion } from '../pos/saleModel.ts'

/* ── Paper ─────────────────────────────────────────────────────── */

export type PaperWidth = 58 | 80
/**
 * Characters per line in the printer's standard font (Font A, 12 × 24 dots, 203 dpi).
 * 80 mm prints 576 dots = 48 columns on both Epson TM-m30III and Star mC-Print3.
 * 58 mm is 35 columns on Epson but narrower on Star, so 32 — Epson's 42-column
 * mode — is the width every supported printer can print.
 */
export const COLUMNS: Record<PaperWidth, number> = { 80: 48, 58: 32 }

/* ── Templates ─────────────────────────────────────────────────── */

export type SectionKind =
  | 'logo' | 'store' | 'header' | 'details' | 'customer' | 'items'
  | 'totals' | 'payment' | 'promo' | 'qr' | 'barcode' | 'returns' | 'footer'

export interface SectionSettings {
  /** header, returns, footer */
  text?: string
  align?: 'left' | 'center'
  /** logo */
  logoSize?: 'sm' | 'lg'
  /** logo: uploaded image, already 1-bit black and white as the printer prints it */
  image?: string
  /** store */
  showAddress?: boolean
  showPhone?: boolean
  /** details */
  showRegister?: boolean
  showStaff?: boolean
  /** items */
  showVariant?: boolean
  showSku?: boolean
  showNotes?: boolean
  /** customer */
  showPointsEarned?: boolean
  /** totals */
  showSavings?: boolean
  /** barcode, and the promo code's graphic */
  format?: 'code128' | 'qr'
  /** promo: a coupon for next time */
  headline?: string
  code?: string
  codeFormat?: 'text' | 'code128' | 'qr'
  /** promo: fixed end date (from the coupon), or… */
  validUntil?: string
  /** …a window counted from the sale date */
  validDays?: number
  /** promo: only print on sales of at least this much */
  minSpend?: number
  /** qr */
  label?: string
  url?: string
}

export interface ReceiptSection {
  /** One section of each kind per template, so the kind is the id. */
  id: SectionKind
  kind: SectionKind
  visible: boolean
  settings: SectionSettings
}

export interface ReceiptTemplate {
  id: string
  name: string
  description: string
  paper: PaperWidth
  density: 'standard' | 'compact'
  sections: ReceiptSection[]
  source: 'library' | 'custom'
  /** Library template a custom one started from — shown as "Based on Standard". */
  basedOn?: string
  updatedAt: string
}

export const SECTION_META: Record<SectionKind, { label: string; icon: string; hint: string }> = {
  logo:     { label: 'Logo',           icon: 'image',          hint: 'Your logo at the top' },
  store:    { label: 'Store',          icon: 'store',          hint: 'Name, address and tax number' },
  header:   { label: 'Header',         icon: 'megaphone',      hint: 'A line under the store details' },
  details:  { label: 'Receipt info',   icon: 'receipt-text',   hint: 'Receipt number, date, register, staff' },
  customer: { label: 'Customer',       icon: 'user-round',     hint: 'Name and points balance' },
  items:    { label: 'Items',          icon: 'list',           hint: 'What was bought' },
  totals:   { label: 'Totals & tax',   icon: 'sigma',          hint: 'Subtotal, discounts, tax, total' },
  payment:  { label: 'Payment',        icon: 'credit-card',    hint: 'Tender, rounding and change' },
  promo:    { label: 'Promotion',      icon: 'ticket-percent', hint: 'A coupon to bring them back' },
  qr:       { label: 'QR link',        icon: 'qr-code',        hint: 'Survey, reviews or loyalty sign-up' },
  barcode:  { label: 'Barcode',        icon: 'scan-barcode',   hint: 'Scan for returns and lookups' },
  returns:  { label: 'Returns policy', icon: 'rotate-ccw',     hint: 'Your returns wording' },
  footer:   { label: 'Footer',         icon: 'message-square', hint: 'A closing line' },
}

/** Where a newly added section goes: its natural place on a receipt. */
export const SECTION_ORDER: SectionKind[] = [
  'logo', 'store', 'header', 'details', 'customer', 'items', 'totals', 'payment', 'promo', 'qr', 'barcode', 'returns', 'footer',
]

/** Sections a receipt can't do without — they can't be hidden or removed. */
export const REQUIRED_SECTIONS: SectionKind[] = ['store', 'items', 'totals']

const DEFAULT_SETTINGS: Record<SectionKind, SectionSettings> = {
  logo:     { logoSize: 'sm' },
  store:    { showAddress: true, showPhone: false },
  header:   { text: 'Spring sale on now', align: 'center' },
  details:  { showRegister: true, showStaff: false },
  customer: { showPointsEarned: true },
  items:    { showVariant: true, showSku: false, showNotes: true },
  totals:   { showSavings: false },
  payment:  {},
  promo:    { headline: '15% off your next visit', code: 'BACK15', codeFormat: 'code128', validDays: 30, minSpend: 50 },
  qr:       { label: 'Tell us how we did', url: 'https://maropost.com/feedback' },
  barcode:  { format: 'code128' },
  returns:  { text: 'Change of mind returns within 30 days with this receipt.', align: 'left' },
  footer:   { text: 'Thanks for shopping with us!', align: 'center' },
}

export function section(kind: SectionKind, settings: SectionSettings = {}, visible = true): ReceiptSection {
  return { id: kind, kind, visible, settings: { ...DEFAULT_SETTINGS[kind], ...settings } }
}

const LIBRARY_DATE = '2026-10-01'

export const RECEIPT_LIBRARY: ReceiptTemplate[] = [
  {
    id: 'standard', name: 'Standard', description: 'A clear receipt for everyday sales.',
    paper: 80, density: 'standard', source: 'library', updatedAt: LIBRARY_DATE,
    sections: [section('store'), section('details'), section('items'), section('totals'), section('payment'), section('footer')],
  },
  {
    id: 'compact', name: 'Compact', description: 'Tighter spacing to save paper.',
    paper: 58, density: 'compact', source: 'library', updatedAt: LIBRARY_DATE,
    sections: [
      section('store', { showAddress: false }), section('details', { showRegister: false }),
      section('items', { showVariant: false, showNotes: false }), section('totals'), section('payment'),
      section('footer', { text: 'Thank you!' }),
    ],
  },
  {
    id: 'detailed', name: 'Detailed', description: 'More product and sale information.',
    paper: 80, density: 'standard', source: 'library', updatedAt: LIBRARY_DATE,
    sections: [
      section('store', { showPhone: true }), section('details', { showStaff: true }), section('customer'),
      section('items', { showSku: true }), section('totals'), section('payment'), section('barcode'),
      section('returns'), section('footer'),
    ],
  },
  {
    id: 'branded', name: 'Branded', description: 'Put your store identity first.',
    paper: 80, density: 'standard', source: 'library', updatedAt: LIBRARY_DATE,
    sections: [
      section('logo', { logoSize: 'lg' }), section('store'), section('header'), section('details'),
      section('items'), section('totals'), section('payment'), section('barcode', { format: 'qr' }),
      section('footer', { text: 'Follow us @maropostapparel' }),
    ],
  },
]

export function libraryTemplate(id: string): ReceiptTemplate | undefined {
  return RECEIPT_LIBRARY.find((t) => t.id === id)
}

function cloneSections(sections: ReceiptSection[]): ReceiptSection[] {
  return sections.map((s) => ({ ...s, settings: { ...s.settings } }))
}

/** A custom template made from a library one, another custom one, or nothing (blank). */
export function copyTemplate(source: ReceiptTemplate | null, id: string, name: string, today: string): ReceiptTemplate {
  if (!source) {
    return {
      id, name, description: 'Started from scratch.', paper: 80, density: 'standard', source: 'custom', updatedAt: today,
      sections: [section('store'), section('items'), section('totals'), section('payment'), section('footer', { text: '' })],
    }
  }
  return {
    ...source,
    id, name, source: 'custom', updatedAt: today,
    basedOn: source.source === 'library' ? source.id : source.basedOn,
    sections: cloneSections(source.sections),
  }
}

/** `name`, or `name 2`, `name 3`… when it's taken. */
export function uniqueName(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name
  let n = 2
  while (taken.includes(`${name} ${n}`)) n++
  return `${name} ${n}`
}

/** "Standard copy", then "Standard copy 2", "Standard copy 3"… */
export function copyName(base: string, taken: string[]): string {
  return uniqueName(`${base} copy`, taken)
}

/** Shape check for templates read back from storage — anything else is dropped, not trusted. */
export function isReceiptTemplate(value: unknown): value is ReceiptTemplate {
  const t = value as ReceiptTemplate
  return !!t && typeof t === 'object'
    && typeof t.id === 'string' && typeof t.name === 'string'
    && (t.paper === 58 || t.paper === 80)
    && Array.isArray(t.sections)
    && t.sections.every((s) => !!s && SECTION_ORDER.includes(s.kind) && s.id === s.kind && typeof s.settings === 'object')
}

/** A channel's template, falling back to Standard if it was deleted or never set. */
export function resolveTemplate(
  assignments: Record<string, string>,
  customs: ReceiptTemplate[],
  channelId: string,
): ReceiptTemplate {
  const id = assignments[channelId]
  return customs.find((t) => t.id === id) ?? libraryTemplate(id ?? '') ?? RECEIPT_LIBRARY[0]!
}

/* ── Sale and location ─────────────────────────────────────────── */

export interface ReceiptLine {
  name: string
  variant: string | null
  sku: string
  qty: number
  /** Unit price charged (after any override). */
  price: number
  discount?: LineDiscount | null
}

export type ReceiptTender = 'card' | 'tap_to_pay' | 'cash' | 'gift_card' | 'split'

export interface ReceiptSale {
  number: string
  /** Local store time, "YYYY-MM-DDTHH:mm". */
  date: string
  register: string
  staff: string
  customer?: { name: string; points: number; pointsEarned?: number } | null
  /** Who bought, for Australian tax invoices of $1,000 or more (name or ABN). */
  buyer?: { name: string; abn?: string } | null
  lines: ReceiptLine[]
  orderDiscount?: LineDiscount | null
  coupon?: Coupon | null
  tender: ReceiptTender
  cashTendered?: number | null
  cardLast4?: string
}

export interface ReceiptLocation {
  brand: string
  name: string
  address: string
  country: Country
  region?: string
  phone?: string
  taxId?: string
}

/* ── Rendering ─────────────────────────────────────────────────── */

export type ReceiptRow =
  | { type: 'text'; text: string; align?: 'left' | 'center'; strong?: boolean }
  | { type: 'pair'; left: string; right: string; strong?: boolean; indent?: boolean }
  | { type: 'rule'; style?: 'single' | 'double' }
  | { type: 'logo'; size: 'sm' | 'lg'; text: string; image?: string }
  | { type: 'barcode'; format: 'code128' | 'qr'; value: string }

export interface ReceiptBlock {
  sectionId: SectionKind
  rows: ReceiptRow[]
}

export interface ReceiptDoc {
  paper: PaperWidth
  columns: number
  density: 'standard' | 'compact'
  blocks: ReceiptBlock[]
  /** Exposed so callers (and tests) can check the receipt against the sale. */
  total: number
  amountPaid: number
}

const TENDER_LABEL: Record<ReceiptTender, string> = {
  card: 'Card', tap_to_pay: 'Tap to pay', cash: 'Cash', gift_card: 'Gift card', split: 'Split payment',
}

const TAX_ID_LABEL: Record<Country, string | null> = { AU: 'ABN', CA: 'GST/HST No.', NZ: 'GST No.', US: null }

/** Store-local timestamp in each market's usual order, without time-zone guessing. */
export function receiptDate(iso: string, country: Country): string {
  const [date = '', time = ''] = iso.split('T')
  const [y, m, d] = date.split('-')
  const hm = time.slice(0, 5)
  if (country === 'CA') return `${y}-${m}-${d} ${hm}`
  if (country === 'US') return `${m}/${d}/${y} ${hm}`
  return `${d}/${m}/${y} ${hm}`
}

const neg = (n: number, country: Country) => `-${formatMoney(n, country)}`

/** ATO: tax invoices of $1,000 or more must identify the buyer. */
export const AU_BUYER_THRESHOLD = 1000

export function needsBuyerDetails(country: Country, total: number): boolean {
  return country === 'AU' && total >= AU_BUYER_THRESHOLD
}

/**
 * `{{store}}` and `{{first_name}}` in the merchant's own text. A missing name
 * drops out cleanly: "Thanks {{first_name}}!" prints "Thanks!".
 */
export function fillPlaceholders(text: string, ctx: { store: string; firstName?: string }): string {
  return text
    .replace(/\{\{\s*store\s*\}\}/g, ctx.store)
    .replace(/\{\{\s*first_name\s*\}\}/g, ctx.firstName ?? '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,!.?])/g, '$1')
    .replace(/,([!.?])/g, '$1')
    .trim()
}

/** "YYYY-MM-DD" plus `days`, without time-zone drift. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10)
}

export function renderReceipt(
  template: ReceiptTemplate,
  sale: ReceiptSale,
  location: ReceiptLocation,
  opts: { gift?: boolean; promos?: PosPromotion[] } = {},
): ReceiptDoc {
  const country = location.country
  const money = (n: number) => formatMoney(n, country)
  const promos = opts.promos ?? POS_PROMOTIONS
  const gift = !!opts.gift
  const taxRule = taxRuleFor(country, location.region)
  const saleLines = sale.lines.map((l) => ({ sku: l.sku, price: l.price, qty: l.qty, discount: l.discount ?? null }))
  const totals = saleTotals(saleLines, { promos, orderDiscount: sale.orderDiscount, coupon: sale.coupon, taxRule })
  const rounds = sale.tender === 'cash' && (country === 'AU' || country === 'CA')
  const amountPaid = rounds ? cashRound(totals.total) : totals.total
  const fill = (text: string) => fillPlaceholders(text, {
    store: location.name,
    firstName: sale.customer?.name.split(/\s+/)[0],
  })

  const blocks: ReceiptBlock[] = []
  for (const s of template.sections) {
    if (!s.visible) continue
    const rows: ReceiptRow[] = []
    const st = s.settings
    switch (s.kind) {
      case 'logo':
        rows.push({ type: 'logo', size: st.logoSize ?? 'sm', text: location.brand, image: st.image })
        break
      case 'store': {
        if (country === 'AU' && !gift) rows.push({ type: 'text', text: 'TAX INVOICE', align: 'center', strong: true })
        if (gift) rows.push({ type: 'text', text: 'GIFT RECEIPT', align: 'center', strong: true })
        rows.push({ type: 'text', text: location.brand.toUpperCase(), align: 'center', strong: true })
        rows.push({ type: 'text', text: location.name, align: 'center' })
        if (st.showAddress) rows.push({ type: 'text', text: location.address, align: 'center' })
        if (st.showPhone && location.phone) rows.push({ type: 'text', text: location.phone, align: 'center' })
        const label = TAX_ID_LABEL[country]
        if (label && location.taxId) rows.push({ type: 'text', text: `${label} ${location.taxId}`, align: 'center' })
        // Lives with the store details, which can't be hidden, so the rule can't be switched off
        if (!gift && needsBuyerDetails(country, totals.total)) {
          const buyer = sale.buyer?.name.trim() ? sale.buyer : sale.customer ? { name: sale.customer.name } : null
          if (buyer) {
            rows.push({ type: 'pair', left: 'Buyer', right: buyer.name })
            if (buyer.abn?.trim()) rows.push({ type: 'pair', left: 'Buyer ABN', right: buyer.abn.trim() })
          }
        }
        break
      }
      case 'header':
      case 'returns':
      case 'footer': {
        const text = fill(st.text ?? '')
        if (text) rows.push({ type: 'text', text, align: st.align ?? 'center' })
        break
      }
      case 'details':
        rows.push({ type: 'pair', left: 'Receipt', right: sale.number })
        rows.push({ type: 'pair', left: 'Date', right: receiptDate(sale.date, country) })
        if (st.showRegister) rows.push({ type: 'pair', left: 'Register', right: sale.register })
        if (st.showStaff) rows.push({ type: 'pair', left: 'Served by', right: sale.staff })
        break
      case 'customer':
        if (sale.customer) {
          rows.push({ type: 'pair', left: 'Customer', right: sale.customer.name })
          if (!gift && st.showPointsEarned && sale.customer.pointsEarned) {
            rows.push({ type: 'pair', left: 'Points earned', right: `+${sale.customer.pointsEarned.toLocaleString('en')}` })
          }
          if (!gift) rows.push({ type: 'pair', left: 'Points balance', right: sale.customer.points.toLocaleString('en') })
        }
        break
      case 'items':
        rows.push({ type: 'rule' })
        sale.lines.forEach((l, i) => {
          const name = st.showVariant && l.variant ? `${l.name} - ${l.variant}` : l.name
          rows.push({ type: 'text', text: name })
          const b = lineBreakdown(saleLines[i]!, promos)
          if (gift) {
            rows.push({ type: 'pair', left: `Qty ${l.qty}`, right: '', indent: true })
          } else {
            rows.push({ type: 'pair', left: `${l.qty} x ${money(l.price)}`, right: money(b.gross), indent: true })
            if (st.showNotes) b.notes.forEach((n) => rows.push({ type: 'pair', left: n.label, right: neg(-n.amount, country), indent: true }))
          }
          if (st.showSku) rows.push({ type: 'pair', left: `SKU ${l.sku}`, right: '', indent: true })
        })
        rows.push({ type: 'rule' })
        break
      case 'totals':
        if (gift) break
        rows.push({ type: 'pair', left: 'Subtotal', right: money(totals.subtotal) })
        if (totals.discounts.length) {
          rows.push({ type: 'pair', left: 'Discounts', right: neg(-totals.discountTotal, country) })
          totals.discounts.forEach((d) => rows.push({ type: 'pair', left: d.label, right: neg(-d.amount, country), indent: true }))
        }
        if (totals.taxMode === 'exclusive') {
          totals.taxes.forEach((t) => rows.push({ type: 'pair', left: `${t.label} ${+(t.rate * 100).toFixed(3)}%`, right: money(t.amount) }))
        }
        rows.push({ type: 'rule', style: 'double' })
        rows.push({ type: 'pair', left: 'TOTAL', right: money(totals.total), strong: true })
        if (totals.taxMode === 'inclusive') {
          totals.taxes.forEach((t) => rows.push({ type: 'pair', left: `Includes ${t.label}`, right: money(t.amount) }))
        }
        if (st.showSavings && totals.discountTotal < 0) {
          rows.push({ type: 'text', text: `You saved ${money(-totals.discountTotal)}`, align: 'center', strong: true })
        }
        break
      case 'payment':
        if (gift) break
        if (rounds && amountPaid !== totals.total) {
          const r = Math.round((amountPaid - totals.total) * 100) / 100
          rows.push({ type: 'pair', left: 'Rounding', right: r < 0 ? neg(-r, country) : money(r) })
        }
        if (sale.tender === 'cash') {
          const tendered = sale.cashTendered ?? amountPaid
          rows.push({ type: 'pair', left: 'Cash', right: money(tendered) })
          rows.push({ type: 'pair', left: 'Change', right: money(changeDue(tendered, amountPaid)), strong: true })
        } else {
          const label = sale.tender === 'card' && sale.cardLast4 ? `Card ****${sale.cardLast4}` : TENDER_LABEL[sale.tender]
          rows.push({ type: 'pair', left: label, right: money(amountPaid) })
        }
        break
      case 'barcode':
        rows.push({ type: 'barcode', format: st.format ?? 'code128', value: sale.number })
        break
      case 'promo': {
        const code = st.code?.trim().toUpperCase()
        if (!code || (st.minSpend && totals.total < st.minSpend)) break
        rows.push({ type: 'rule' })
        const headline = fill(st.headline ?? '')
        if (headline) rows.push({ type: 'text', text: headline, align: 'center', strong: true })
        if (st.codeFormat === 'code128' || st.codeFormat === 'qr') rows.push({ type: 'barcode', format: st.codeFormat, value: code })
        else rows.push({ type: 'text', text: `Code ${code}`, align: 'center', strong: true })
        const until = st.validUntil ?? (st.validDays ? addDays(sale.date.slice(0, 10), st.validDays) : undefined)
        if (until) rows.push({ type: 'text', text: `Valid until ${formatDate(until, country)}`, align: 'center' })
        rows.push({ type: 'rule' })
        break
      }
      case 'qr': {
        const url = st.url?.trim()
        if (!url) break
        if (st.label?.trim()) rows.push({ type: 'text', text: fill(st.label), align: 'center', strong: true })
        rows.push({ type: 'barcode', format: 'qr', value: url.replace(/^https?:\/\//, '') })
        break
      }
    }
    if (rows.length) blocks.push({ sectionId: s.id, rows })
  }

  return { paper: template.paper, columns: COLUMNS[template.paper], density: template.density, blocks, total: totals.total, amountPaid }
}

/* ── Layout: rows → fixed-width printer lines ─────────────────── */

export interface ReceiptTextLine {
  text: string
  strong?: boolean
  /** Drawn as a graphic by the preview; the text is the printer-width fallback. */
  graphic?: 'logo-sm' | 'logo-lg' | 'code128' | 'qr'
  /** Uploaded logo (1-bit data URL) for a logo graphic. */
  image?: string
}

/** Word-wrap to `width`, breaking words longer than a line. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let w = word
    while (w.length > width) {
      if (line) { out.push(line); line = '' }
      out.push(w.slice(0, width))
      w = w.slice(width)
    }
    if (!line) line = w
    else if (line.length + 1 + w.length <= width) line += ` ${w}`
    else { out.push(line); line = w }
  }
  if (line) out.push(line)
  return out.length ? out : ['']
}

const center = (s: string, width: number) => {
  const pad = Math.max(0, Math.floor((width - s.length) / 2))
  return `${' '.repeat(pad)}${s}`
}

export function layoutRow(row: ReceiptRow, columns: number): ReceiptTextLine[] {
  switch (row.type) {
    case 'text':
      return wrap(row.text, columns).map((t) => ({ text: row.align === 'center' ? center(t, columns) : t, strong: row.strong }))
    case 'pair': {
      const indent = row.indent ? '  ' : ''
      const right = row.right
      const room = columns - indent.length - (right ? right.length + 1 : 0)
      const left = wrap(row.left, Math.max(8, room))
      const lines = left.map((t) => `${indent}${t}`)
      const last = lines[lines.length - 1]!
      const gap = columns - last.length - right.length
      lines[lines.length - 1] = right ? `${last}${' '.repeat(Math.max(1, gap))}${right}` : last
      return lines.map((t) => ({ text: t.slice(0, columns), strong: row.strong }))
    }
    case 'rule':
      return [{ text: (row.style === 'double' ? '=' : '-').repeat(columns) }]
    case 'logo':
      return [{ text: center(`[ ${row.text.toUpperCase()} ]`.slice(0, columns), columns), graphic: row.size === 'lg' ? 'logo-lg' : 'logo-sm', image: row.image }]
    case 'barcode':
      return [
        { text: center(row.format === 'qr' ? '[QR]' : '|'.repeat(Math.min(columns - 8, 32)), columns), graphic: row.format },
        ...wrap(row.value, columns).map((t) => ({ text: center(t, columns) })),
      ]
  }
}

export function layoutBlock(block: ReceiptBlock, columns: number): ReceiptTextLine[] {
  return block.rows.flatMap((r) => layoutRow(r, columns))
}

/** The receipt exactly as the printer prints it, one string per line. */
export function toText(doc: ReceiptDoc): string[] {
  return doc.blocks.flatMap((b, i) => [...(i > 0 && doc.density === 'standard' ? [''] : []), ...layoutBlock(b, doc.columns).map((l) => l.text)])
}

/* ── Sample sale for previews ──────────────────────────────────── */

/** The sale every template preview prints: promos, an item discount, cash with change. */
export function sampleSale(): ReceiptSale {
  return {
    number: 'POS-12051',
    date: '2026-10-27T14:32',
    register: 'Front counter',
    staff: 'Sienna M.',
    customer: { name: 'Hannah Cole', points: 2840, pointsEarned: 147 },
    lines: [
      { name: 'Classic crew tee', variant: 'Black', sku: 'TEE-001-BLK-M', qty: 2, price: 39 },
      { name: 'Pullover hoodie', variant: 'Grey, L', sku: 'HOOD-101-GRY-L', qty: 1, price: 89 },
      { name: 'Cap', variant: 'Navy', sku: 'CAP-001-NVY', qty: 1, price: 35, discount: { kind: 'amount', value: 5, reason: 'Damaged' } },
    ],
    tender: 'cash',
    cashTendered: 200,
  }
}
