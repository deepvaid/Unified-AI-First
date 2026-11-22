<script setup lang="ts">
import { computed } from 'vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import type { PaymentEvent, PaymentEventKind } from '@/maropay/model'

// A payment's history, newest first. Each event kind has its own glyph and
// tone, so the icon comes from what happened — never from sniffing the text —
// and an ignored late notification reads as quietly as it should.

const props = withDefaults(defineProps<{
  events: PaymentEvent[]
  title?: string
  headingLevel?: number
}>(), {
  title: 'Timeline',
  headingLevel: 2,
})

type Tone = 'neutral' | 'positive' | 'negative' | 'muted'

const KINDS: Record<PaymentEventKind, { icon: string; tone: Tone }> = {
  created: { icon: 'shopping-cart', tone: 'neutral' },
  processing: { icon: 'hourglass', tone: 'neutral' },
  authorised: { icon: 'shield-check', tone: 'neutral' },
  captured: { icon: 'circle-check', tone: 'positive' },
  failed: { icon: 'circle-x', tone: 'negative' },
  voided: { icon: 'ban', tone: 'neutral' },
  refund_pending: { icon: 'undo-2', tone: 'neutral' },
  refund_succeeded: { icon: 'undo-2', tone: 'neutral' },
  refund_failed: { icon: 'circle-alert', tone: 'negative' },
  dispute_opened: { icon: 'shield-alert', tone: 'negative' },
  dispute_submitted: { icon: 'send', tone: 'neutral' },
  dispute_won: { icon: 'badge-check', tone: 'positive' },
  dispute_lost: { icon: 'circle-x', tone: 'negative' },
  dispute_accepted: { icon: 'flag', tone: 'neutral' },
  late_event_ignored: { icon: 'bell-off', tone: 'muted' },
}

const TIME = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

// Events arrive oldest first; reversing before the (stable) sort keeps same-minute events newest first too.
const rows = computed(() => [...props.events]
  .reverse()
  .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  .map((event) => ({ ...event, ...KINDS[event.kind], when: TIME.format(new Date(event.at)) })))
</script>

<template>
  <v-card flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader :title="title" :heading-level="headingLevel" />
    <div v-if="rows.length" role="list">
      <MpListRow v-for="event in rows" :key="event.id" variant="divided" role="listitem" :subtitle="event.when">
        <template #lead>
          <v-icon size="16" :class="`maropay-timeline__icon--${event.tone}`">{{ event.icon }}</v-icon>
        </template>
        <template #title>
          <span :class="{ 'maropay-timeline__text--muted': event.tone === 'muted' }">{{ event.text }}</span>
        </template>
      </MpListRow>
    </div>
    <MpEmptyState v-else icon="history" title="Nothing has happened yet" :heading-level="3" />
  </v-card>
</template>

<style scoped>
.maropay-timeline__icon--neutral {
  color: var(--icon-secondary);
}

.maropay-timeline__icon--positive {
  color: var(--pos-ink);
}

.maropay-timeline__icon--negative {
  color: var(--neg-ink);
}

.maropay-timeline__icon--muted,
.maropay-timeline__text--muted {
  color: var(--on-surface-muted);
}
</style>
