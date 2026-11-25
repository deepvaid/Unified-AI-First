// URL handles, the one rule for them. Pure, so the demo store blueprints write
// their links with the same rule the storefront reads them by, and Node can test it.

import type { Product } from '../stores/useCommerce.ts'

/** Slugify a title into a URL handle (lowercase, hyphenated). */
export function toHandle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `/products/<name>-<id>`: the id keeps the link working if the product is renamed. */
export function productHandle(product: Pick<Product, 'name' | 'id'>): string {
  return `${toHandle(product.name)}-${product.id}`
}
