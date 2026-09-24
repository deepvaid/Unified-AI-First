<script setup lang="ts">
import { computed } from 'vue'
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
  <v-card flat border rounded="lg" class="maropay-timeline">
    <MpSectionHeader :title="title" :heading-level="headingLevel" />
    <div role="list">
      <MpListRow v-for="event in rows" :key="event.id" variant="divided" role="listitem">
        <template #lead>
          <v-icon size="18" :class="`maropay-timeline__icon--${event.tone}`">{{ event.icon }}</v-icon>
        </template>
        <span class="maropay-timeline__text" :class="{ 'maropay-timeline__text--muted': event.tone === 'muted' }">{{ event.text }}</span>
        <span class="maropay-timeline__when">{{ event.when }}</span>
      </MpListRow>
    </div>
    <p v-if="!rows.length" class="maropay-timeline__empty">Nothing has happened yet.</p>
  </v-card>
</template>

<style scoped>
.maropay-timeline {
  padding: var(--mp-component-card-padding);
}

.maropay-timeline__icon--neutral {
  color: var(--icon-secondary);
}

.maropay-timeline__icon--positive {
  color: var(--pos-ink);
}

.maropay-timeline__icon--negative {
  color: var(--neg-ink);
}

.maropay-timeline__icon--muted {
  color: var(--muted);
}

.maropay-timeline__text {
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-snug);
  color: var(--text-primary);
}

.maropay-timeline__text--muted {
  color: var(--text-secondary);
}

.maropay-timeline__when {
  margin-top: var(--mp-space-2);
  font-size: var(--mp-fontSize-12);
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.maropay-timeline__empty {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
}
</style>
