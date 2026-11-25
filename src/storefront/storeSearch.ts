// Whether a store's shoppers can search it: one rule for the storefront and for the
// admin's previews of it (the store page and the Themes page). Pure, so
// `npm run test:storefront` runs it in Node.
import type { SalesChannel } from '../stores/useSalesChannels.ts'
import { merchandisingStatus } from '../utils/merchandisingChannels.ts'
import { storesWithOwnCatalogue, type CatalogProduct } from './catalog.ts'

/**
 * Search is Merchandise Cloud's: a store has it once it is connected. It runs on the
 * store's own products, so a store on the shared catalogue keeps the header it had.
 */
export function canSearch(channel: SalesChannel | undefined, products: Pick<CatalogProduct, 'channelIds'>[]): boolean {
  return !!channel
    && merchandisingStatus(channel) === 'connected'
    && storesWithOwnCatalogue(products).includes(channel.id)
}
