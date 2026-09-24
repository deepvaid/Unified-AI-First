<script setup lang="ts">
import { computed, ref } from 'vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import type { ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useMaropayStore } from '@/stores/useMaropay'
import { ROLE_LABELS, can } from '@/maropay/model'
import type { HistoryEntry, MaropayAction, MaropayActingRole } from '@/maropay/model'
import { formatDay } from '@/maropay/readiness'

// Settings → Permissions: who can do what in Maropay (read from the same
// access model the adapter enforces), and a record of what changed.

const maropay = useMaropayStore()

const ROLES: MaropayActingRole[] = ['owner', 'finance', 'store_ops']

const GROUPS: { title: string; rows: { label: string; action: MaropayAction }[] }[] = [
  {
    title: 'Payments',
    rows: [
      { label: 'See payments', action: 'view_transactions' },
      { label: 'Capture or cancel authorised payments', action: 'capture' },
      { label: 'Refund payments', action: 'refund' },
      { label: 'Export payments and payouts', action: 'export' },
    ],
  },
  {
    title: 'Money',
    rows: [
      { label: 'See balances and payouts', action: 'view_payouts' },
      { label: 'Retry a failed payout', action: 'retry_payout' },
      { label: 'Respond to disputes', action: 'respond_dispute' },
      { label: 'Accept disputes', action: 'accept_dispute' },
    ],
  },
  {
    title: 'Setup and stores',
    rows: [
      { label: 'Fill in setup', action: 'edit_onboarding' },
      { label: 'Accept the terms and submit setup', action: 'submit_onboarding' },
      { label: 'Choose payment methods', action: 'manage_methods' },
      { label: 'Link, activate and stop stores', action: 'activate_store' },
    ],
  },
  {
    title: 'Account',
    rows: [
      { label: 'Change business details', action: 'change_business' },
      { label: 'Change the payout bank account', action: 'change_bank' },
      { label: 'Close the account', action: 'close_account' },
    ],
  },
]

/** Store operations act only on the stores they're assigned to. */
const STORE_SCOPED: MaropayAction[] = ['view_transactions', 'capture']

// ── History ────────────────────────────────────────────────────────

const TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

interface Row {
  id: string
  at: string
  who: string
  text: string
  store: string
}

const rows = computed<Row[]>(() => {
  const assigned = maropay.actingRole === 'store_ops' ? maropay.assignedChannelIds ?? [] : null
  return maropay.history
    .filter((entry: HistoryEntry) => !assigned || (entry.channelId !== null && assigned.includes(entry.channelId)))
    .map((entry) => ({
      id: entry.id,
      at: entry.at,
      who: ROLE_LABELS[entry.actor],
      text: entry.text,
      store: entry.channelId ? maropay.channelName(entry.channelId) : '—',
    }))
})

const HEADERS: (ResponsiveHeader & { title: string; key: string })[] = [
  { title: 'When', key: 'at', sortable: true },
  { title: 'What changed', key: 'text', sortable: false },
  { title: 'Who', key: 'who', sortable: false, hideBelow: 'md' },
  { title: 'Store', key: 'store', sortable: false, hideBelow: 'lg' },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(HEADERS, hiddenColumns)
</script>

<template>
  <div class="d-flex flex-column gap-5">
    <v-card flat border rounded="lg" class="maropay-permissions__card">
      <MpSectionHeader title="Who can do what" :description="`You’re acting as ${ROLE_LABELS[maropay.actingRole].toLowerCase()}. Store operations users only see the stores they’re assigned to.`" :heading-level="2" />
      <v-table density="compact" class="maropay-permissions__table">
        <thead>
          <tr>
            <th scope="col">Action</th>
            <th v-for="role in ROLES" :key="role" scope="col" class="text-center">
              {{ ROLE_LABELS[role] }}<span v-if="role === maropay.actingRole" class="maropay-permissions__you"> (you)</span>
            </th>
          </tr>
        </thead>
        <tbody v-for="group in GROUPS" :key="group.title">
          <tr>
            <th scope="colgroup" :colspan="ROLES.length + 1" class="maropay-permissions__group">{{ group.title }}</th>
          </tr>
          <tr v-for="row in group.rows" :key="row.action">
            <th scope="row" class="maropay-permissions__action">{{ row.label }}</th>
            <td v-for="role in ROLES" :key="role" class="text-center">
              <v-icon size="18" :class="can(role, row.action) ? 'maropay-permissions__yes' : 'maropay-permissions__no'" aria-hidden="true">
                {{ can(role, row.action) ? 'check' : 'minus' }}
              </v-icon>
              <span class="d-sr-only">{{ can(role, row.action) ? 'Allowed' : 'Not allowed' }}</span>
              <span v-if="role === 'store_ops' && can(role, row.action) && STORE_SCOPED.includes(row.action)" class="maropay-permissions__scope">their stores</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-card flat border rounded="lg" class="d-flex flex-column overflow-hidden">
      <div class="maropay-permissions__history-head">
        <MpSectionHeader title="History" description="Changes to setup, stores, payouts and the account, newest first." :heading-level="2" />
      </div>
      <v-data-table
        :headers="visibleHeaders"
        :items="rows"
        item-value="id"
        density="comfortable"
        :items-per-page="10"
        :sort-by="[{ key: 'at', order: 'desc' }]"
      >
        <template #item.at="{ item }">
          <span class="text-no-wrap">{{ formatDay(item.at) }}</span>
          <span class="maropay-permissions__time">{{ TIME.format(new Date(item.at)) }}</span>
        </template>
        <template #item.text="{ item }">
          <span class="text-body-2">{{ item.text }}</span>
        </template>
        <template #item.who="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.who }}</span>
        </template>
        <template #item.store="{ item }">
          <span class="text-body-2 text-medium-emphasis text-no-wrap">{{ item.store }}</span>
        </template>
        <template #no-data>
          <MpEmptyState icon="history" title="Nothing has changed yet" description="Setup, store and payout changes are recorded here." :heading-level="3" />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.maropay-permissions__card {
  padding: var(--mp-component-card-padding);
}

.maropay-permissions__table {
  background: transparent;
}

/* Prefixed with the table class to outrank Vuetify's own cell selectors. */
.maropay-permissions__table .maropay-permissions__group {
  padding-top: var(--mp-space-16);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: var(--mp-letterSpacing-eyebrow);
}

.maropay-permissions__table .maropay-permissions__action {
  font-weight: var(--mp-fontWeight-regular);
  text-align: start;
}

.maropay-permissions__you {
  color: var(--text-secondary);
  font-weight: var(--mp-fontWeight-regular);
}

.maropay-permissions__yes {
  color: var(--pos-ink);
}

.maropay-permissions__no {
  color: var(--text-muted);
}

.maropay-permissions__scope {
  margin-inline-start: var(--mp-space-4);
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
  white-space: nowrap;
}

.maropay-permissions__history-head {
  padding: var(--mp-component-card-padding) var(--mp-component-card-padding) 0;
}

.maropay-permissions__time {
  display: block;
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}
</style>
