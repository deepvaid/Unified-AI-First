<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import MpSectionRail, { type MpSectionRailSwitchOption } from '@/components/MpSectionRail.vue'
import { useRetailStore } from '@/stores/useRetail'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { retailMenu } from './retailMenu'

const props = defineProps<{ accountId: string }>()

const store = useRetailStore()
const salesChannels = useSalesChannelsStore()

const contexts = computed(() => store.availableContexts(props.accountId))

/** The POS channel that owns the active location, so Locations never hardcodes a channel id. */
const activeChannel = computed(() => {
  const owner = contexts.value.find((ctx) =>
    ctx.locations.some((loc) => loc.id === store.activeLocationId),
  )
  return owner?.channel ?? salesChannels.getDefaultOfflineStore(props.accountId) ?? contexts.value[0]?.channel
})

const locationsRoute = computed<RouteLocationRaw>(() =>
  activeChannel.value
    ? { name: 'SalesChannelLocations', params: { accountId: props.accountId, channelId: activeChannel.value.id } }
    : { name: 'SalesChannels', params: { accountId: props.accountId } },
)

const groups = computed(() => retailMenu(props.accountId, locationsRoute.value))

const identity = computed(() => ({
  name: store.isAllLocations ? 'All locations' : store.activeLocation.name,
  caption: store.isAllLocations
    ? `${contexts.value.reduce((n, ctx) => n + ctx.locations.length, 0)} stores`
    : activeChannel.value?.name,
  icon: store.isAllLocations ? 'store' : 'map-pin',
}))

const switcherOptions = computed<MpSectionRailSwitchOption[]>(() => [
  { id: store.ALL_LOCATIONS, label: 'All locations', caption: 'Whole estate', icon: 'store' },
  ...contexts.value.flatMap((ctx) =>
    ctx.locations.map((loc) => ({
      id: loc.id,
      label: loc.name,
      caption: ctx.channel.name,
      icon: 'map-pin',
    })),
  ),
])
</script>

<template>
  <MpSectionRail
    ariaLabel="Retail sections"
    :groups="groups"
    :identity="identity"
    :switcher-options="switcherOptions"
    switcher-label="Switch location"
    :back-to="{ name: 'Dashboard', params: { accountId } }"
    back-label="Back to dashboard"
    @switch="store.setActiveLocation"
  />
</template>
