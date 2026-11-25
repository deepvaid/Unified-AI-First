import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useRouter } from 'vue-router'
import { placeholderImages } from '@/components/products/productMedia'
import { useCommerceStore, type Product } from '@/stores/useCommerce'
import { useDemoStores } from '@/stores/useDemoStores'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreThemesStore } from '@/stores/useStoreThemes'
import { channelIdsFor, storesWithOwnCatalogue } from '@/storefront/catalog'
import { currencyAffix } from '@/storefront/price'
import { productHandle } from '@/views/Storefront/storefrontCatalog'

/**
 * The stores that sell products of their own (today: the Vitaheal demo store),
 * as the product forms and the Products list need them: a product put in one is
 * priced in its currency, gets a picture if it has none, and links to its page
 * on that storefront.
 */
export function useProductStores(accountId: MaybeRefOrGetter<string>) {
  const commerce = useCommerceStore()
  const salesChannels = useSalesChannelsStore()
  const themes = useStoreThemesStore()
  const demoStores = useDemoStores()
  const router = useRouter()

  const stores = computed(() =>
    storesWithOwnCatalogue(commerce.products)
      .map((id) => salesChannels.getChannel(toValue(accountId), id))
      .filter((channel) => !!channel))

  /** The stores among the sales channels picked on a form, by name. */
  const picked = (names: string[]) => stores.value.filter((store) => names.includes(store.name))

  /** What a product's `channelIds` should be for the picked sales channels. */
  const channelIds = (names: string[]): string[] => channelIdsFor(names, stores.value)

  /** Where the price fields show the currency: the first picked store's, else dollars. */
  function affixFor(names: string[]): { prefix?: string; suffix?: string } {
    const store = picked(names)[0]?.webStore
    return currencyAffix(store?.currency, store?.locale)
  }

  /** Drawn pictures for a product saved without any, in the first picked store's colours and shape. None when no store is picked. */
  function placeholdersFor(names: string[], productName: string): string[] {
    const store = picked(names)[0]
    const styles = store ? themes.themeForChannel(store.id)?.styles : undefined
    return store && styles ? placeholderImages(productName, styles, demoStores.blueprintOf(store.id)?.packShot?.shape) : []
  }

  /** The product's page on its store, once shoppers can see it there. */
  function storefrontLink(product: Pick<Product, 'id' | 'name' | 'channelIds' | 'publishStatus'>): { storeName: string; href: string } | null {
    const store = stores.value.find((s) => product.channelIds?.includes(s.id))
    if (!store || product.publishStatus !== 'Published') return null
    const to = { name: 'StorefrontProduct', params: { accountId: toValue(accountId), channelId: store.id, handle: productHandle(product) } }
    return { storeName: store.name, href: router.resolve(to).href }
  }

  return { stores, channelIds, affixFor, placeholdersFor, storefrontLink }
}
