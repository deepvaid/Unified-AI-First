// The share of a period's revenue each top product takes — ONE list, read by the dashboard's "Sales by
// product name" widget and by the store snapshot Da Vinci answers from. They used to disagree: the
// widget drew this mix while Da Vinci tallied the generated line items, so "What are my top sellers?"
// named different products from the dashboard behind it.
//
// TODO(mock): fixed product mix. The generated line items cycle evenly through 40 SKUs, so a real top-5
// tally would leave "Other" at ~80% of the bar; the shares keep the window's real revenue total.

export const OTHER_PRODUCTS = 'Other products'

const PRODUCT_SALES_MIX = [
  { name: 'Nike Air Max 270', share: 0.28 },
  { name: 'Sony WH-1000XM5', share: 0.21 },
  { name: 'Hydro Flask 32oz', share: 0.16 },
  { name: 'YETI Rambler 20oz', share: 0.12 },
  { name: 'Kindle Paperwhite', share: 0.09 },
  { name: OTHER_PRODUCTS, share: 0.14 },
]

/** Revenue per product for a period that took `revenue` in total, best seller first, "Other products" last. */
export function productSalesMix(revenue: number): Array<{ name: string; value: number }> {
  return PRODUCT_SALES_MIX.map((entry) => ({ name: entry.name, value: Math.round(revenue * entry.share) }))
}
