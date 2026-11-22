<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { useTicketsStore } from '@/stores/useTickets'
import { isDuplicateName, type TicketTypeDef } from '@/service/model'

const toast = useToast()
const settings = useServiceSettingsStore()
const tickets = useTicketsStore()

const ticketCount = (name: string) => tickets.visibleTickets.filter(t => t.type === name).length
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const rows = computed(() =>
  settings.ticketTypes.map(type => ({
    id: type.id,
    name: type.name,
    description: type.description,
    tickets: ticketCount(type.name),
  })),
)

const search = ref('')
const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row => row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q))
})

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Description', key: 'description', sortable: false, hideBelow: 'md' as const },
  { title: 'Tickets', key: 'tickets', align: 'end' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, headerProps: { class: 'mp-th-sr' } },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

// ── Create / edit drawer ────────────────────────────────────────────────────
const blankForm = () => ({ name: '', description: '' })
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref(blankForm())
const pristine = ref('')

const isDirty = computed(() => JSON.stringify(form.value) !== pristine.value)
const nameDuplicate = computed(() => isDuplicateName(settings.ticketTypes, form.value.name, editingId.value ?? undefined))
const nameError = computed(() => (nameDuplicate.value ? 'A ticket type with this name already exists.' : ''))
const canSave = computed(() => !!form.value.name.trim() && !nameDuplicate.value)

function openDrawer(next: { name: string; description: string }, id: string | null) {
  editingId.value = id
  form.value = next
  pristine.value = JSON.stringify(next)
  drawerOpen.value = true
}

function openCreate() {
  openDrawer(blankForm(), null)
}

function openEdit(id: string) {
  const type = settings.ticketTypes.find(t => t.id === id)
  if (type) openDrawer({ name: type.name, description: type.description }, type.id)
}

function save() {
  if (!canSave.value) return
  const payload = { name: form.value.name.trim(), description: form.value.description.trim() }
  if (editingId.value) {
    settings.updateType(editingId.value, payload)
    toast.success(`“${payload.name}” saved`)
  } else {
    settings.createType(payload)
    toast.success(`“${payload.name}” created`)
  }
  drawerOpen.value = false
}

const confirmDiscard = ref(false)
function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else drawerOpen.value = false
}

// ── Delete ──────────────────────────────────────────────────────────────────
const deleteTarget = ref<TicketTypeDef | null>(null)
const confirmDelete = computed({
  get: () => deleteTarget.value !== null,
  set: open => { if (!open) deleteTarget.value = null },
})

const deleteConsequences = computed(() => {
  const count = deleteTarget.value ? ticketCount(deleteTarget.value.name) : 0
  return count ? [`${plural(count, 'ticket')} lose this type and show as None`] : []
})

function performDelete() {
  const type = deleteTarget.value
  if (!type) return
  settings.deleteType(type.id)
  toast.success(`“${type.name}” deleted`)
  deleteTarget.value = null
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Ticket Types"
      subtitle="Categorise tickets so agents can filter, report on and route them."
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">
          New type
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        search-placeholder="Search ticket types"
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
        aria-label="Ticket types"
      >
        <template #item.name="{ item }">
          <button type="button" class="mp-link text-start" @click="openEdit(item.id)">{{ item.name }}</button>
        </template>

        <template #item.description="{ item }">
          <span class="text-medium-emphasis">{{ item.description || '—' }}</span>
        </template>

        <template #item.tickets="{ item }">
          <span class="num">{{ item.tickets }}</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Ticket type actions" :itemLabel="item.name">
              <MpMenuItem title="Edit" icon="pencil" @click="openEdit(item.id)" />
              <v-divider class="my-1" />
              <MpMenuItem
                title="Delete"
                icon="trash-2"
                danger
                @click="deleteTarget = settings.ticketTypes.find(t => t.id === item.id) ?? null"
              />
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search.trim()"
            icon="search"
            :heading-level="3"
            :title="`No ticket types match “${search.trim()}”`"
            description="Try a different name or a word from the description."
            action-label="Clear search"
            @action="search = ''"
          />
          <MpEmptyState
            v-else
            icon="shapes"
            :heading-level="3"
            title="No ticket types yet"
            description="Add types like Refund or Delivery problem so agents can sort tickets as they come in."
            action-label="New type"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFormDrawer
      v-model="drawerOpen"
      :title="editingId ? 'Edit ticket type' : 'New ticket type'"
      size="sm"
      guarded
      @close="requestClose"
    >
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Name *"
          placeholder="e.g. Delivery problem"
          :error-messages="nameError"
        />
        <v-textarea
          v-model="form.description"
          label="Description"
          rows="3"
          placeholder="e.g. Late, lost or damaged parcels."
        />
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ editingId ? 'Save' : 'Create type' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard changes?"
      message="This ticket type has unsaved changes. Closing now will discard them."
      confirm-label="Discard"
      danger
      @confirm="drawerOpen = false"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      danger
      :title="`Delete ${deleteTarget?.name ?? 'ticket type'}?`"
      :message="`Agents can no longer pick ${deleteTarget?.name ?? 'this type'} for a ticket. This cannot be undone.`"
      :consequences="deleteConsequences"
      confirm-label="Delete type"
      @confirm="performDelete"
    />
  </div>
</template>
