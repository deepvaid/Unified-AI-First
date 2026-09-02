<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import TicketWorkspace from '@/components/service/TicketWorkspace.vue'
import { useTicketsStore } from '@/stores/useTickets'

const store = useTicketsStore()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const ticketId = computed(() => Number(route.params.id))
const ticket = computed(() => store.find(ticketId.value))
</script>

<template>
  <div class="mp-frame-fill ticket-shell d-flex flex-column">
    <div class="ticket-head flex-shrink-0">
      <MpPageHeader
        :backTo="{ name: 'Tickets', params: { accountId } }"
        :eyebrow="ticket ? `All Tickets · ${ticket.number}` : 'All Tickets'"
        :title="ticket?.subject ?? 'Ticket'"
        density="compact"
      />
    </div>

    <v-card v-if="ticket" flat border rounded="lg" class="ticket-page">
      <TicketWorkspace :ticket-id="ticket.id" variant="page" defaultRail="contact" />
    </v-card>

    <MpEmptyState
      v-else
      class="ticket-page"
      icon="ticket"
      title="Ticket not found"
      description="This ticket doesn't exist or was deleted."
    />
  </div>
</template>

<style scoped lang="scss">
/* Same shell idiom as Tickets.vue: the frame owns the height, the head band and
   the card restate the shell's inset as gutters. */
.ticket-head {
  padding: var(--mp-space-24) var(--mp-space-32) var(--mp-space-16);
}

.ticket-page {
  flex: 1 1 0;
  min-height: 0;
  margin: 0 var(--mp-space-32) var(--mp-space-32);
  display: flex;
  flex-direction: column;
}

@media (max-width: ($mp-layout-breakpointSplit - 0.02px)) {
  .ticket-head { padding: var(--mp-space-16) var(--mp-space-16) var(--mp-space-12); }
  .ticket-page { margin: 0 var(--mp-space-16) var(--mp-space-16); }
}
</style>
