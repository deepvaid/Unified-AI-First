<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore, type SalesChannel } from '@/stores/useSalesChannels'
import { STORE_EDITOR_ITEMS, sectionRootForRoute } from './storeEditorMenu'
import MpSectionRail, { type MpSectionRailGroup, type MpSectionRailSwitchOption } from '@/components/MpSectionRail.vue'

// Store editor rail — entity flavor of MpSectionRail: store identity + switcher
// above the section links from storeEditorMenu.ts.

const props = defineProps<{
  channel: SalesChannel
}>()

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

function toItem(item: (typeof STORE_EDITOR_ITEMS)[number]) {
  return {
    slug: item.slug,
    label: item.label,
    icon: item.icon,
    to: { name: item.routeName, params: { accountId: accountId.value, channelId: props.channel.id } },
    match: item.match,
  }
}

// Theme is the primary storefront job — surface it under Customize first;
// Payments is how the store sells, so it gets its own Selling group.
const groups = computed<MpSectionRailGroup[]>(() => {
  const overview = STORE_EDITOR_ITEMS.find((i) => i.slug === 'overview')
  const theme = STORE_EDITOR_ITEMS.find((i) => i.slug === 'themes')
  const payments = STORE_EDITOR_ITEMS.find((i) => i.slug === 'payments')
  const rest = STORE_EDITOR_ITEMS.filter((i) => i.slug !== 'overview' && i.slug !== 'themes' && i.slug !== 'payments')
  return [
    ...(overview ? [{ items: [toItem(overview)] }] : []),
    ...(theme ? [{ title: 'Customize', items: [toItem(theme)] }] : []),
    ...(payments ? [{ title: 'Selling', items: [toItem(payments)] }] : []),
    { title: 'Store content', items: rest.map(toItem) },
  ]
})

/** "#9 Neelam-Store" for stores with an admin number, as the store switcher shows them. */
function storeLabel(channel: SalesChannel): string {
  return channel.storeNumber ? `#${channel.storeNumber} ${channel.name}` : channel.name
}

const switcherOptions = computed<MpSectionRailSwitchOption[]>(() =>
  salesChannelsStore
    .webStoreChannels(accountId.value)
    .filter((channel) => channel.id !== props.channel.id)
    .map((channel) => ({ id: channel.id, label: storeLabel(channel), caption: channel.webStore?.domain, icon: 'globe' })),
)

// Maropost-built stores have a storefront to open (the admin's eye icon); Shopify stores check out elsewhere.
const storefrontHref = computed(() =>
  props.channel.provider === 'maropost_store_builder'
    ? router.resolve({ name: 'StorefrontHome', params: { accountId: accountId.value, channelId: props.channel.id } }).href
    : null,
)

// Switch stores but stay on the same section (editors land on their section root).
function onSwitch(channelId: string) {
  const sectionRoot = sectionRootForRoute(typeof route.name === 'string' ? route.name : undefined)
  router.push({ name: sectionRoot, params: { accountId: accountId.value, channelId } })
}
</script>

<template>
  <MpSectionRail
    ariaLabel="Store editor navigation"
    :back-to="{ name: 'SalesChannels', params: { accountId } }"
    back-label="All sales channels"
    :identity="{ name: storeLabel(channel), caption: channel.webStore?.domain || 'Web store', icon: 'globe' }"
    :switcher-options="switcherOptions"
    switcher-label="Switch store"
    :groups="groups"
    @switch="onSwitch"
  >
    <template v-if="storefrontHref" #footer>
      <v-btn
        variant="outlined"
        color="primary"
        size="small"
        block
        class="text-none"
        prepend-icon="eye"
        :href="storefrontHref"
        target="_blank"
        rel="noopener"
      >
        View store
      </v-btn>
    </template>
  </MpSectionRail>
</template>
