<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MpSectionRail, { type MpSectionRailSwitchOption } from '@/components/MpSectionRail.vue'
import type { SalesChannel } from '@/stores/useSalesChannels'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { channelDomain, merchandisingChannels, merchandisingRoute, providerLabel } from '@/utils/merchandisingChannels'
import { merchandisingMenu } from './merchandisingMenu'

const props = defineProps<{ accountId: string; channel: SalesChannel }>()
const router = useRouter()
const salesChannels = useSalesChannelsStore()

const groups = computed(() => merchandisingMenu(props.accountId, props.channel.id))
const switcherOptions = computed<MpSectionRailSwitchOption[]>(() =>
  merchandisingChannels(salesChannels.channels, props.accountId).map((channel) => ({
    id: channel.id,
    label: channel.name,
    caption: `${providerLabel(channel)} · ${channelDomain(channel)}`,
    icon: channel.provider === 'shopify' ? 'shopping-bag' : 'globe',
  })),
)

function switchChannel(channelId: string) {
  if (channelId === props.channel.id) return
  const currentPath = window.location.pathname
  const section = currentPath.split('/merchandising/')[1] ?? ''
  const safeSection = section.startsWith('editor') ? '' : section
  router.push(merchandisingRoute(props.accountId, channelId, safeSection))
}
</script>

<template>
  <MpSectionRail
    ariaLabel="Merchandising sections"
    :groups="groups"
    :identity="{ name: channel.name, caption: `${providerLabel(channel)} · ${channelDomain(channel)}`, icon: channel.provider === 'shopify' ? 'shopping-bag' : 'globe' }"
    :switcher-options="switcherOptions"
    switcher-label="Switch sales channel"
    :back-to="{ name: 'MerchandisingHome', params: { accountId } }"
    back-label="All sales channels"
    @switch="switchChannel"
  >
    <template #footer>
      <v-btn
        variant="outlined"
        color="primary"
        size="small"
        block
        class="text-none"
        prepend-icon="external-link"
        :href="`https://${channelDomain(channel)}`"
        target="_blank"
        rel="noopener"
      >
        View storefront
      </v-btn>
    </template>
  </MpSectionRail>
</template>
