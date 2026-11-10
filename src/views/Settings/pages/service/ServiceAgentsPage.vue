<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useToast } from '@/composables/useToast'
import { DEFAULT_SIGNATURE, useServiceSettingsStore } from '@/stores/useServiceSettings'
import { useTicketsStore } from '@/stores/useTickets'
import { fillTags, isDuplicateName, type ServiceAgent } from '@/service/model'

// Agents come from Users — this page only edits their service profile, so there
// is no create or delete here.

const route = useRoute()
const toast = useToast()
const settings = useServiceSettingsStore()
const tickets = useTicketsStore()
const accountId = computed(() => route.params.accountId as string)
const usersRoute = computed(() => ({ name: 'SettingsUsersPermissions', params: { accountId: accountId.value } }))

const openCount = (name: string) =>
  tickets.visibleTickets.filter(t => t.assignee === name && t.status !== 'Closed').length

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase()

const rows = computed(() =>
  settings.agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    initials: initials(agent.name),
    email: agent.email,
    nickname: agent.nickname,
    jobTitle: agent.jobTitle,
    phone: agent.phone,
    open: openCount(agent.name),
  })),
)

const search = ref('')
const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(row =>
    [row.name, row.email, row.nickname, row.jobTitle].some(field => field.toLowerCase().includes(q)),
  )
})

// Email rides under the name, the way Users shows people, so the row fits the settings column.
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Nickname', key: 'nickname', hideBelow: 'lg' as const },
  { title: 'Job title', key: 'jobTitle', hideBelow: 'md' as const },
  { title: 'Phone', key: 'phone', sortable: false, hideBelow: 'lg' as const },
  { title: 'Open tickets', key: 'open', align: 'end' as const },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, headerProps: { class: 'mp-th-sr' } },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

// ── Edit drawer ─────────────────────────────────────────────────────────────
interface AgentForm {
  name: string
  nickname: string
  jobTitle: string
  phone: string
}
const drawerOpen = ref(false)
const editing = ref<ServiceAgent | null>(null)
const form = ref<AgentForm>({ name: '', nickname: '', jobTitle: '', phone: '' })
const pristine = ref('')

const isDirty = computed(() => JSON.stringify(form.value) !== pristine.value)
// Tickets are assigned by name, so two agents can't share one.
const nameDuplicate = computed(() => isDuplicateName(settings.agents, form.value.name, editing.value?.id))
const nameError = computed(() => (nameDuplicate.value ? 'An agent with this name already exists.' : ''))
const canSave = computed(() => !!form.value.name.trim() && !nameDuplicate.value)

function openEdit(id: string) {
  const agent = settings.agents.find(a => a.id === id)
  if (!agent) return
  editing.value = agent
  form.value = { name: agent.name, nickname: agent.nickname, jobTitle: agent.jobTitle, phone: agent.phone }
  pristine.value = JSON.stringify(form.value)
  drawerOpen.value = true
}

function save() {
  if (!canSave.value || !editing.value) return
  const patch = {
    name: form.value.name.trim(),
    nickname: form.value.nickname.trim(),
    jobTitle: form.value.jobTitle.trim(),
    phone: form.value.phone.trim(),
  }
  settings.updateAgent(editing.value.id, patch)
  toast.success(`${patch.name}’s profile saved`)
  drawerOpen.value = false
}

const confirmDiscard = ref(false)
function requestClose() {
  if (isDirty.value) confirmDiscard.value = true
  else drawerOpen.value = false
}

// The seeded signature is trusted HTML; what the agent types is escaped before it goes in.
const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, ch => ESCAPES[ch] ?? ch)

const signaturePreview = computed(() =>
  fillTags(DEFAULT_SIGNATURE, {
    AGENT_NAME: escapeHtml(form.value.name.trim()),
    AGENT_JOB_TITLE: escapeHtml(form.value.jobTitle.trim()),
  }),
)
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Agents"
      subtitle="Each agent's service profile. Name and job title fill the agent tags in inbox signatures."
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="users" class="text-none" :to="usersRoute">
          Manage users
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        v-model:hidden-columns="hiddenColumns"
        search-placeholder="Search agents"
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
        aria-label="Agents"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar color="primary" variant="tonal" size="small" class="text-caption font-weight-medium" aria-hidden="true">
              {{ item.initials }}
            </v-avatar>
            <div class="agent-identity">
              <button type="button" class="mp-link text-start" @click="openEdit(item.id)">{{ item.name }}</button>
              <div class="text-caption text-medium-emphasis text-truncate">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <template #item.nickname="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.nickname }">{{ item.nickname || '—' }}</span>
        </template>

        <template #item.jobTitle="{ item }">
          <span :class="{ 'text-medium-emphasis': !item.jobTitle }">{{ item.jobTitle || '—' }}</span>
        </template>

        <template #item.phone="{ item }">
          <span class="text-no-wrap" :class="{ 'text-medium-emphasis': !item.phone }">{{ item.phone || '—' }}</span>
        </template>

        <template #item.open="{ item }">
          <span class="num">{{ item.open }}</span>
        </template>

        <template #item.actions="{ item }">
          <div @click.stop>
            <MpRowActionsMenu ariaLabel="Agent actions" :itemLabel="item.name">
              <MpMenuItem title="Edit" icon="pencil" @click="openEdit(item.id)" />
            </MpRowActionsMenu>
          </div>
        </template>

        <template #no-data>
          <MpEmptyState
            v-if="search.trim()"
            icon="search"
            :heading-level="3"
            :title="`No agents match “${search.trim()}”`"
            description="Try a different name, email or job title."
            action-label="Clear search"
            @action="search = ''"
          />
          <MpEmptyState
            v-else
            icon="users"
            :heading-level="3"
            title="No agents yet"
            description="Give people access to Service in Users, and they appear here as agents."
            action-label="Manage users"
            @action="$router.push(usersRoute)"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFormDrawer
      v-model="drawerOpen"
      title="Edit agent"
      :subtitle="editing?.name"
      size="sm"
      guarded
      @close="requestClose"
    >
      <MpFormGrid>
        <v-text-field
          v-model="form.name"
          label="Name *"
          placeholder="e.g. Chris Parker"
          :error-messages="nameError"
        />
        <v-text-field
          :model-value="editing?.email ?? ''"
          label="Email"
          readonly
          class="mp-field-readonly"
          hint="Managed in Users"
          persistent-hint
        />
        <v-text-field
          v-model="form.nickname"
          label="Nickname"
          placeholder="e.g. Chris"
        />
        <v-text-field
          v-model="form.jobTitle"
          label="Job title"
          placeholder="e.g. Support lead"
        />
        <v-text-field
          v-model="form.phone"
          label="Phone"
          type="tel"
          placeholder="e.g. +1 416 555 0101"
          hint="Include the country code"
          persistent-hint
        />
        <MpFormField label="Signature preview" hint="Inboxes that use the default signature sign off like this.">
          <div class="agent-signature" v-html="signaturePreview" />
        </MpFormField>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestClose">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard changes?"
      message="This agent's profile has unsaved changes. Closing now will discard them."
      confirm-label="Discard"
      danger
      @confirm="drawerOpen = false"
    />
  </div>
</template>

<style scoped>
.agent-identity {
  min-width: 0;
}

.agent-signature {
  padding: var(--mp-component-card-paddingCompact);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  color: var(--on-surface);
}
.agent-signature :deep(p + p) {
  margin-top: var(--mp-space-8);
}
</style>
