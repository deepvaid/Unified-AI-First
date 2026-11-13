<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useResponsiveTableHeaders, type ResponsiveHeader } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { useTicketsStore } from '@/stores/useTickets'
import { formatSla, inboxReadiness, type Inbox } from '@/service/model'

const route = useRoute()
const toast = useToast()
const settings = useServiceSettingsStore()
const tickets = useTicketsStore()
const accountId = computed(() => route.params.accountId as string)

// MpDataTableToolbar's column menu needs a title on every header.
const headers: (ResponsiveHeader & { title: string })[] = [
  { title: 'Inbox', key: 'name' },
  { title: 'Support emails', key: 'emails', sortable: false, hideBelow: 'md' },
  { title: 'Status', key: 'status' },
  { title: 'Assignment', key: 'assignment', hideBelow: 'lg' },
  { title: 'SLA', key: 'sla', hideBelow: 'lg' },
  { title: 'Open tickets', key: 'open', align: 'end', hideBelow: 'sm' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: 56, headerProps: { class: 'mp-th-sr' } },
]
const { visibleHeaders, isVisible } = useResponsiveTableHeaders(headers)

const rows = computed(() =>
  settings.inboxes.map(inbox => {
    const emails = settings.emailsFor(inbox.id)
    const defaultEmail = emails.find(e => e.isDefault) ?? emails[0]
    return {
      id: inbox.id,
      name: inbox.name,
      description: inbox.description,
      defaultAddress: defaultEmail?.address ?? '',
      moreEmails: Math.max(0, emails.length - 1),
      status: inboxReadiness(emails),
      assignment: inbox.assignment === 'round-robin' ? 'Round robin' : 'Manual',
      sla: formatSla(inbox.slaMinutes),
      open: tickets.visibleTickets.filter(t => t.inboxId === inbox.id && t.status !== 'Closed').length,
    }
  }),
)

const search = ref('')
const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    [row.name, row.description, ...settings.emailsFor(row.id).map(e => e.address)]
      .some(field => field.toLowerCase().includes(q)),
  )
})

const inboxRoute = (id: string, tab?: string) => ({
  name: 'SettingsServiceInbox',
  params: { accountId: accountId.value, inboxId: id },
  query: tab ? { tab } : undefined,
})
const createRoute = computed(() => ({ name: 'SettingsServiceInboxCreate', params: { accountId: accountId.value } }))

// ── Delete: tickets move to another inbox, nothing is lost ──────────────────
const deleteTarget = ref<Inbox | null>(null)
const confirmDelete = computed({
  get: () => deleteTarget.value !== null,
  set: open => { if (!open) deleteTarget.value = null },
})
const moveTarget = computed(() => settings.inboxes.find(i => i.id !== deleteTarget.value?.id))

const deleteConsequences = computed(() => {
  const inbox = deleteTarget.value
  if (!inbox || !moveTarget.value) return []
  const count = tickets.tickets.filter(t => t.inboxId === inbox.id).length
  const emails = settings.emailsFor(inbox.id).length
  return [
    count
      ? `${count} ticket${count === 1 ? '' : 's'} move${count === 1 ? 's' : ''} to ${moveTarget.value.name}`
      : 'No tickets are affected',
    ...(emails ? [`${emails} support email${emails === 1 ? '' : 's'} stop${emails === 1 ? 's' : ''} creating tickets`] : []),
    'Templates scoped to this inbox become available in every inbox',
  ]
})

function performDelete() {
  const inbox = deleteTarget.value
  if (!inbox || !moveTarget.value) return
  settings.deleteInbox(inbox.id, moveTarget.value.id)
  toast.success(`${inbox.name} deleted`)
  deleteTarget.value = null
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Inboxes"
      subtitle="Each inbox collects tickets from its support email addresses and has its own assignment, SLA, acknowledgement and signature."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" :to="createRoute">
          Create inbox
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        search-placeholder="Search inboxes or addresses"
        :headers="headers"
        :total-count="filteredRows.length"
      />

      <v-data-table
        :headers="visibleHeaders"
        :items="filteredRows"
        item-value="id"
        density="comfortable"
        :items-per-page="10"
        hover
        aria-label="Inboxes"
      >
        <template #item.name="{ item }">
          <div class="py-2">
            <router-link :to="inboxRoute(item.id)" class="mp-link font-weight-medium">{{ item.name }}</router-link>
            <div v-if="item.description" class="text-caption text-medium-emphasis inbox-description">{{ item.description }}</div>
            <!-- When the Support emails column has no room, the address folds in here. -->
            <div v-if="!isVisible('emails') && item.defaultAddress" class="text-caption inbox-address">
              {{ item.defaultAddress }}<span v-if="item.moreEmails" class="text-medium-emphasis"> +{{ item.moreEmails }} more</span>
            </div>
          </div>
        </template>

        <template #item.emails="{ item }">
          <span v-if="item.defaultAddress" class="text-body-2 text-no-wrap">
            {{ item.defaultAddress }}<span v-if="item.moreEmails" class="text-medium-emphasis"> +{{ item.moreEmails }} more</span>
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="readiness" size="sm" show-icon />
        </template>

        <template #item.open="{ item }">
          <span class="inbox-count">{{ item.open }}</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Inbox actions" :itemLabel="item.name">
              <MpMenuItem title="Edit settings" icon="pencil" :to="inboxRoute(item.id)" />
              <MpMenuItem title="Support emails" icon="mail" :to="inboxRoute(item.id, 'emails')" />
              <template v-if="settings.inboxes.length > 1">
                <v-divider class="my-1" />
                <MpMenuItem
                  title="Delete"
                  icon="trash-2"
                  danger
                  @click="deleteTarget = settings.findInbox(item.id) ?? null"
                />
              </template>
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search.trim()"
            icon="search"
            :title="`No inboxes match “${search.trim()}”`"
            description="Try a different name or email address."
            action-label="Clear search"
            @action="search = ''"
          />
          <MpEmptyState
            v-else
            icon="inbox"
            title="No inboxes yet"
            description="Create one for each support address customers write to, like support@ or orders@."
            action-label="Create inbox"
            action-icon="plus"
            @action="$router.push(createRoute)"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      :title="`Delete ${deleteTarget?.name ?? 'inbox'}?`"
      message="Customers who email its addresses won't create tickets any more."
      :consequences="deleteConsequences"
      confirm-label="Delete inbox"
      @confirm="performDelete"
    />
  </div>
</template>

<style scoped>
.inbox-description {
  max-width: var(--mp-component-pageHeader-titleMinWidth);
}
/* A long address wraps inside the cell rather than widening the table. */
.inbox-address {
  overflow-wrap: anywhere;
}
.inbox-count {
  font-variant-numeric: tabular-nums;
}
</style>
