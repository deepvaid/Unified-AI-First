<script setup lang="ts">
import DvCampaignCard from '../DvCampaignCard.vue'
import DvContentCard from '../DvContentCard.vue'
import DvKpiRow from '../DvKpiRow.vue'
import DvChartCard from '../DvChartCard.vue'
import DvSegmentCard from '../DvSegmentCard.vue'
import DvInsightCard from '../DvInsightCard.vue'
import type { DvCardDescriptor } from '@/composables/useDaVinciIntents'

defineProps<{
  cards: DvCardDescriptor[]
}>()

const emit = defineEmits<{
  action: [payload: { card: DvCardDescriptor; action: string }]
}>()

function onAction(card: DvCardDescriptor, action: string) {
  emit('action', { card, action })
}
</script>

<template>
  <div class="dv-intent-cards">
    <template v-for="(card, i) in cards" :key="`${card.type}-${i}`">
      <DvCampaignCard
        v-if="card.type === 'campaign'"
        v-bind="card.props"
        @review="onAction(card, 'review-draft')"
        @change="onAction(card, 'change-brief')"
      />
      <DvContentCard
        v-else-if="card.type === 'content'"
        v-bind="card.props"
        @use="onAction(card, 'use')"
        @copy="onAction(card, 'copy')"
        @edit="onAction(card, 'edit')"
      />
      <DvKpiRow v-else-if="card.type === 'kpis'" :kpis="card.props.kpis" />
      <DvChartCard v-else-if="card.type === 'chart'" v-bind="card.props" />
      <DvSegmentCard
        v-else-if="card.type === 'segment'"
        v-bind="card.props"
        @save="onAction(card, 'save')"
        @preview="onAction(card, 'preview')"
      />
      <DvInsightCard
        v-else-if="card.type === 'insight'"
        v-bind="card.props"
        @action="onAction(card, 'action')"
      />
    </template>
  </div>
</template>

<style scoped>
.dv-intent-cards {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  min-width: 0;
}
</style>
