<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import { useCampaignsStore } from '@/stores/useCampaigns'

// UAT: /accounts/:id/campaigns/new — "Create New Campaign / Select your campaign type."
// Same navigation-tile pattern as SegmentBuilderChooser: tiles are real links
// (v-card :to), not MpOptionCard selection controls.
const route = useRoute()
const router = useRouter()
const store = useCampaignsStore()

const accountId = computed(() => String(route.params.accountId ?? '116000'))
const backTo = computed(() => ({ name: 'EmailCampaigns', params: { accountId: accountId.value } }))

const tiles = computed(() => [
  {
    id: 'email',
    title: 'Email campaign',
    description: 'One message to a chosen audience — send it now, schedule it, or make it recurring.',
    icon: 'mail',
    to: { name: 'CreateEmailCampaign', params: { accountId: accountId.value } },
  },
  {
    id: 'ab',
    title: 'A/B email campaign',
    description: 'Test subject lines, content, or senders across split groups; the winner sends to the rest.',
    icon: 'split',
    to: { name: 'CreateAbCampaign', params: { accountId: accountId.value } },
  },
])

// Deep links that used to land on the old single-route wizard (row edits,
// Da Vinci draft handoffs) carry ?id / ?source=davinci — forward them to the
// wizard that owns the draft's kind instead of showing the chooser.
onMounted(() => {
  const idParam = route.query.id
  const isDaVinci = route.query.source === 'davinci'
  if (!idParam && !isDaVinci) return
  const existing = idParam ? store.getCampaign(Number(idParam)) : undefined
  const target = existing?.config?.kind === 'ab_email' ? 'CreateAbCampaign' : 'CreateEmailCampaign'
  void router.replace({ name: target, params: { accountId: accountId.value }, query: route.query })
})
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <MpPageHeader
      title="Create a campaign"
      subtitle="Choose the campaign type."
      :back-to="backTo"
    />
    <div class="ctc-grid">
      <v-card
        v-for="tile in tiles"
        :key="tile.id"
        flat
        border
        rounded="lg"
        :to="tile.to"
        class="ctc-tile pa-6 d-flex flex-column ga-3"
      >
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal" size="34" rounded="lg" class="flex-shrink-0">
            <v-icon size="18">{{ tile.icon }}</v-icon>
          </v-avatar>
          <h2 class="text-body-1 font-weight-bold mb-0">{{ tile.title }}</h2>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ tile.description }}</p>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ctc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-space-20);
  max-width: var(--mp-layout-contentMaxWidth);
}

.ctc-tile {
  height: 100%;
  transition: border-color 0.15s ease;
}

.ctc-tile:hover,
.ctc-tile:focus-visible {
  border-color: rgb(var(--v-theme-primary));
}

@media (max-width: $mp-layout-breakpointCompact) {
  .ctc-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
