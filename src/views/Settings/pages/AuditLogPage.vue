<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpAlert from '@/components/MpAlert.vue'
import { useRbacStore } from '@/stores/useRbac'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { formatAgo } from '@/composables/useRelativeTime'
import { ACCESS_DENIED_COPY, AUDIT_ACTION_META, type AuditAction, type AuditEvent } from '@/stores/rbacData'

const rbac = useRbacStore()
const { loading } = useInitialLoad()

const search = ref('')
const targetTab = ref('all')

/**
 * Demo lever for the PRD's standardized insufficient-permission state: the audit
 * log is only visible to Account Owner / Platform Admins, so previewing as a
 * Marketing Manager swaps the table for the standardized 403.
 */
const previewAs = ref<string | null>('owner')
const accessDenied = computed(() => previewAs.value === 'manager')
const previewItems = [
  { value: 'owner', label: 'Account Owner' },
  { value: 'manager', label: 'Marketing Manager' },
]

const tabs = computed(() => [
  { label: 'All', key: 'all', count: rbac.events.length },
  { label: 'Users', key: 'user', count: rbac.events.filter(e => e.targetType === 'user').length },
  { label: 'Roles', key: 'role', count: rbac.events.filter(e => e.targetType === 'role').length },
])

// Filters
const filters = ref({
  actor: null as string | null,
  period: null as string | null,
})

const actionItems = (Object.keys(AUDIT_ACTION_META) as AuditAction[]).map(a => ({
  title: AUDIT_ACTION_META[a].label,
  value: a,
}))

// Action is the promoted filter: a multi-select pill in the toolbar, so the cut
// people make most often doesn't cost a trip to the drawer.
const actionQuickFilter = {
  key: 'action',
  label: 'Action',
  options: actionItems.map((a) => ({ label: a.title, value: a.value })),
}
const actionFilter = ref<string[]>([])
const actorItems = computed(() => [...new Set(rbac.events.map(e => e.actorName))])
const periodItems = ['Last 7 days', 'Last 30 days', 'Last 90 days']

const filterLabels: Record<string, string> = { action: 'Action', actor: 'Actor', period: 'Period' }

const activeFilterEntries = computed(() => {
  const entries = Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
  if (actionFilter.value.length) {
    const names = actionFilter.value.map(a => AUDIT_ACTION_META[a as AuditAction].label)
    entries.unshift({ key: 'action', label: `Action: ${names.join(', ')}` })
  }
  return entries
})

function removeFilter(key: string) {
  if (key === 'action') {
    actionFilter.value = []
    return
  }
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  actionFilter.value = []
  filters.value = { actor: null, period: null }
}

const filteredEvents = computed(() =>
  rbac.sortedEvents.filter((e) => {
    if (targetTab.value !== 'all' && e.targetType !== targetTab.value) return false
    if (actionFilter.value.length && !actionFilter.value.includes(e.action)) return false
    if (filters.value.actor && e.actorName !== filters.value.actor) return false
    if (filters.value.period) {
      const days = (Date.now() - new Date(e.at).getTime()) / 86400000
      if (filters.value.period === 'Last 7 days' && days > 7) return false
      if (filters.value.period === 'Last 30 days' && days > 30) return false
      if (filters.value.period === 'Last 90 days' && days > 90) return false
    }
    return true
  }),
)

const headers = [
  { title: 'When', key: 'at', sortable: true },
  { title: 'Actor', key: 'actorName', hideBelow: 'md' as const },
  { title: 'Action', key: 'action', sortable: false },
  { title: 'Target', key: 'targetLabel', hideBelow: 'lg' as const },
  { title: 'Details', key: 'summary', sortable: false },
]
const hiddenColumns = ref<string[]>([])
const { visibleHeaders } = useResponsiveTableHeaders(headers, hiddenColumns)

const exactFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

function exactTime(at: string): string {
  return exactFmt.format(new Date(at))
}

function initials(name: string): string {
  return name.split(' ').map(part => part[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function actionMeta(event: AuditEvent) {
  return AUDIT_ACTION_META[event.action]
}
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <MpPageHeader
      :level="2"
      density="compact"
      title="Audit Log"
      subtitle="Every access change — who changed what, and when. Visible to the Account Owner and Platform Admins."
    >
      <template #actions>
        <div class="d-flex align-center flex-wrap gap-2">
          <span class="text-caption text-medium-emphasis">Preview as</span>
          <MpSegmentedControl
            v-model="previewAs"
            :items="previewItems"
            size="sm"
            ariaLabel="Preview the audit log as a different role"
          />
        </div>
      </template>
    </MpPageHeader>

    <!-- Standardized insufficient-permission state -->
    <template v-if="accessDenied">
      <v-card variant="flat" border rounded="lg">
        <MpEmptyState
          icon="lock"
          :title="ACCESS_DENIED_COPY.title"
          :description="ACCESS_DENIED_COPY.description"
        />
      </v-card>
      <MpAlert tone="info" live="off">
        This is the standardized access error every product shows when a user’s roles don’t include a permission —
        Marketing Manager doesn’t have <strong>View audit log</strong>. Switch back to Account Owner to restore the view.
      </MpAlert>
    </template>

    <template v-else>
      <MpFilterTabs v-model="targetTab" :tabs="tabs" aria-label="Filter audit events by target" controls-id="audit-table" />

      <v-card id="audit-table" variant="flat" border rounded="lg" class="d-flex flex-column overflow-hidden">
        <MpDataTableToolbar
        v-model:quick-filter-value="actionFilter"
        :quick-filter="actionQuickFilter"
          v-model:search="search"
          v-model:hidden-columns="hiddenColumns"
          search-placeholder="Search events, targets, or people"
          :headers="headers"
          :active-filters="activeFilterEntries"
          :total-count="filteredEvents.length"
          @remove-filter="removeFilter"
          @clear-filters="clearAllFilters"
        >
          <template #filter-content>
            <MpFormGrid>
              <v-select
                v-model="filters.actor"
                label="Actor"
                :items="actorItems"
                clearable
              />
              <v-select
                v-model="filters.period"
                label="Period"
                :items="periodItems"
                clearable
              />
            </MpFormGrid>
          </template>
        </MpDataTableToolbar>

        <MpTableSkeleton v-if="loading" :rows="8" :columns="5" />

        <v-data-table
          v-else
          :headers="visibleHeaders"
          :items="filteredEvents"
          :search="search"
          item-value="id"
          density="comfortable"
          :items-per-page="15"
          fixed-header
          class="audit-table"
        >
          <template v-slot:item.at="{ item }">
            <v-tooltip location="top" :text="exactTime((item as AuditEvent).at)">
              <template #activator="{ props: tipProps }">
                <span v-bind="tipProps" class="text-body-2 text-no-wrap">{{ formatAgo((item as AuditEvent).at) }}</span>
              </template>
            </v-tooltip>
          </template>

          <template v-slot:item.actorName="{ item }">
            <div class="d-flex align-center gap-2 text-no-wrap">
              <v-avatar color="primary" variant="tonal" size="26" class="font-weight-bold audit-avatar">
                {{ initials((item as AuditEvent).actorName) }}
              </v-avatar>
              <span class="text-body-2">{{ (item as AuditEvent).actorName }}</span>
            </div>
          </template>

          <template v-slot:item.action="{ item }">
            <v-chip size="x-small" variant="tonal" :color="actionMeta(item as AuditEvent).color" class="text-no-wrap">
              {{ actionMeta(item as AuditEvent).label }}
            </v-chip>
          </template>

          <template v-slot:item.targetLabel="{ item }">
            <div class="audit-target">
              <div class="audit-target__label">{{ (item as AuditEvent).targetLabel }}</div>
              <div class="audit-target__type">{{ (item as AuditEvent).targetType === 'user' ? 'User' : 'Role' }}</div>
            </div>
          </template>

          <template v-slot:item.summary="{ item }">
            <v-tooltip location="top" :text="(item as AuditEvent).summary">
              <template #activator="{ props: tipProps }">
                <span v-bind="tipProps" class="audit-summary text-body-2 text-medium-emphasis">
                  {{ (item as AuditEvent).summary }}
                </span>
              </template>
            </v-tooltip>
          </template>

          <template #no-data>
            <MpEmptyState
              v-if="search || activeFilterEntries.length || targetTab !== 'all'"
              emphasis="prominent"
              illustration="no-results"
              title="No events match"
              description="Try a different search, filter, or period."
            />
            <MpEmptyState
              v-else
              icon="scroll-text"
              title="No activity yet"
              description="Access changes — invitations, role assignments, and role edits — will appear here."
            />
          </template>
        </v-data-table>
      </v-card>
    </template>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  max-width: 980px;
}

.audit-table :deep(thead th) {
  white-space: nowrap;
}

.audit-avatar {
  font-size: var(--mp-fontSize-10);
}

.audit-target__label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
}

.audit-target__type {
  font-size: var(--mp-fontSize-11);
  color: var(--muted);
}

.audit-summary {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
