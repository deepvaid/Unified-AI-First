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
  <div class="pa-6 d-flex flex-column">
    <MpPageHeader
      :backTo="{ name: 'Tickets', params: { accountId } }"
      :eyebrow="ticket ? `All Tickets · ${ticket.number}` : 'All Tickets'"
      :title="ticket?.subject ?? 'Ticket'"
    />

    <v-card v-if="ticket" flat border rounded="lg" class="ticket-page mt-4 d-flex flex-column">
      <TicketWorkspace :ticket-id="ticket.id" variant="page" defaultRail="contact" />
    </v-card>

    <MpEmptyState
      v-else
      class="mt-4"
      icon="ticket"
      title="Ticket not found"
      description="This ticket doesn't exist or was deleted."
    />
  </div>
</template>

<style scoped>
/* Fill the viewport under the app bar, page padding and header. */
.ticket-page {
  height: calc(100vh - var(--mp-layout-appbarHeight) - 172px);
  min-height: 420px;
}
</style>
