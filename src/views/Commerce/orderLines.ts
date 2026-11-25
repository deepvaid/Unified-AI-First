import type { OrderAddress, OrderLineItem, Product } from '@/stores/useCommerce'
import { optionKind, optionValuesOf } from '@/storefront/variants'

// How an order's lines and addresses read in the back office. The order page and
// the fulfillment page show the same lines, so they read them the same way.

/** The line's product: the one it names, else the one with its SKU. */
export function lineProduct(products: Product[], li: OrderLineItem): Product | undefined {
  const named = li.productId === undefined ? undefined : products.find((p) => p.id === li.productId)
  return named ?? products.find((p) => p.sku === li.sku)
}

/** The variant's values as the line was bought, sizes first: "M · Sand". Empty for a line without a variant. */
export function variantLine(products: Product[], li: OrderLineItem): string {
  if (!li.variantTitle) return ''
  const options = lineProduct(products, li)?.detail?.options ?? []
  if (!options.length) return li.variantTitle.split(' / ').join(' · ')
  const values = optionValuesOf({ title: li.variantTitle }, options)
  const sizes = values.filter((_, i) => optionKind(options[i]!) === 'size')
  const others = values.filter((_, i) => optionKind(options[i]!) !== 'size')
  return [...sizes, ...others].filter(Boolean).join(' · ')
}

/** The line's product photo, when its product has one: the photo of the colour bought, where the product has one per colour. */
export function lineImage(products: Product[], li: OrderLineItem): string | undefined {
  const product = lineProduct(products, li)
  const options = product?.detail?.options ?? []
  const byColor = product?.detail?.imagesByColor
  if (byColor && li.variantTitle) {
    const values = optionValuesOf({ title: li.variantTitle }, options)
    const colour = values.find((_, i) => optionKind(options[i]!) === 'color')
    const photo = colour ? byColor[colour]?.[0] : undefined
    if (photo) return photo
  }
  return product?.imageUrls?.[0]
}

/** City, region and postcode on one line; an address without a region (Sweden) leaves no stray comma. */
export function placeLine(address: OrderAddress): string {
  return [address.city, [address.region, address.postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}
