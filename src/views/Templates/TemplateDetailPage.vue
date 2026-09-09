<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import { useToast } from '@/composables/useToast'
import {
  CATEGORY_OPTIONS,
  FIELDS,
  OWNER_OPTIONS,
  STATUS_OPTIONS,
  SUPPORTING_TEXT,
  makeRecords,
  type PlaceholderRecord,
} from './placeholder'

// DETAIL PAGE TEMPLATE — one record: identity column, tabbed body, edit drawer,
// and the not-found branch. Copied from src/views/Contacts/ContactDetail.vue.

const toast = useToast()

const record = ref<PlaceholderRecord | null>(makeRecords(1)[0] ?? null)
const relatedRows = makeRecords(5)
const relatedHeaders = [
  { title: 'Column A · Name', key: 'name' },
  { title: 'Status', key: 'status' },
  { title: 'Column E · Value', key: 'amount', align: 'end' as const },
]

const activityFeed = [
  { eyebrow: 'Date value 01', title: 'Event description one', meta: 'Owner A' },
  { eyebrow: 'Date value 02', title: 'Event description two', meta: 'Owner B' },
  { eyebrow: 'Date value 03', title: 'Event description three', meta: 'Owner A' },
]

const metrics = [
  { label: 'Metric A', value: '128', icon: 'activity', trend: '+12%', subStat: 'vs previous period' },
  { label: 'Metric B', value: '46', icon: 'users', trend: '-4%', trendPositive: false, subStat: 'vs previous period' },
  { label: 'Metric C', value: '9', icon: 'inbox', subStat: 'Supporting stat' },
  { label: 'Metric D', value: '72%', icon: 'target', trend: '+3%', subStat: 'vs previous period' },
]

const activeTab = ref('overview')

/* ── Edit ───────────────────────────────────────────────────────────
   Copy the record into local refs on open, then flip the boolean. The
   drawer is never keyed on the record. */
const editOpen = ref(false)
const form = ref({ name: '', category: '', status: null as PlaceholderRecord['status'] | null, owner: '' })

function openEdit() {
  if (!record.value) return
  form.value = {
    name: record.value.name,
    category: record.value.category,
    status: record.value.status,
    owner: record.value.owner,
  }
  editOpen.value = true
}

function saveEdit() {
  if (record.value) {
    record.value.name = form.value.name
    record.value.category = form.value.category
    if (form.value.status) record.value.status = form.value.status
    record.value.owner = form.value.owner
    toast.success('Record updated')
  }
  editOpen.value = false
}

/* ── Delete ─────────────────────────────────────────────────────────*/
const confirmDelete = ref(false)
function performDelete() {
  record.value = null
  toast.success('Record removed')
}

const subtitle = computed(() => (record.value ? `Record ID · ${String(record.value.id).padStart(4, '0')}` : ''))
</script>

<template>
  <div v-if="record" class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Section · Records"
      :title="record.name"
      :subtitle="subtitle"
      :back-to="{ name: 'TemplateList' }"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="pencil" class="text-none" @click="openEdit">
          Edit record
        </v-btn>
        <MpRowActionsMenu ariaLabel="Record actions" :itemLabel="record.name">
          <MpMenuItem title="Duplicate" icon="copy" @click="toast.info('Record duplicated')" />
          <v-divider class="my-1" />
          <MpMenuItem title="Delete" icon="trash-2" danger @click="confirmDelete = true" />
        </MpRowActionsMenu>
      </template>
    </MpPageHeader>

    <div class="d-flex gap-5 tpl-detail">
      <!-- Identity column — who or what this record is, never tabbed away -->
      <div class="tpl-detail__side d-flex flex-column gap-4">
        <v-card variant="flat" border rounded="lg" class="tpl-card">
          <div class="d-flex align-center gap-3 mb-4">
            <v-avatar color="surface-variant" size="48"><v-icon>file-text</v-icon></v-avatar>
            <div class="min-width-0">
              <p class="mp-section-title mb-1">{{ record.name }}</p>
              <MpStatusChip :status="record.status" type="general" size="sm" />
            </div>
          </div>
          <dl class="mp-label-value">
            <template v-for="field in FIELDS" :key="field.label">
              <dt class="mp-meta-label">{{ field.label }}</dt>
              <dd class="mp-meta-value">{{ field.value }}</dd>
            </template>
          </dl>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="tpl-card">
          <MpSectionHeader title="Attributes" :heading-level="2" />
          <div class="d-flex flex-wrap gap-2">
            <v-chip v-for="tag in ['Tag A', 'Tag B', 'Tag C']" :key="tag" size="small" variant="tonal">
              {{ tag }}
            </v-chip>
          </div>
        </v-card>
      </div>

      <!-- Body column — everything else, grouped into tabs -->
      <div class="tpl-detail__body min-width-0 d-flex flex-column">
        <v-tabs v-model="activeTab" density="compact" color="primary" class="mb-4 flex-shrink-0">
          <v-tab value="overview" class="text-none">Overview</v-tab>
          <v-tab value="related" class="text-none">Related</v-tab>
          <v-tab value="activity" class="text-none">Activity</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="flex-grow-1">
          <v-window-item value="overview">
            <div class="d-flex flex-column gap-5 pa-1">
              <v-row dense>
                <v-col v-for="metric in metrics" :key="metric.label" cols="6" lg="3">
                  <MpKpiCard
                    :label="metric.label"
                    :value="metric.value"
                    :icon="metric.icon"
                    :trend="metric.trend"
                    :trend-positive="metric.trendPositive"
                    :sub-stat="metric.subStat"
                    class="h-100"
                  />
                </v-col>
              </v-row>

              <v-card variant="flat" border rounded="lg" class="tpl-card">
                <MpSectionHeader title="Summary" :heading-level="2" :description="SUPPORTING_TEXT" />
                <MpListRow
                  v-for="field in FIELDS"
                  :key="field.label"
                  variant="divided"
                  :eyebrow="field.label"
                  :title="field.value"
                  meta="Meta value"
                />
              </v-card>
            </div>
          </v-window-item>

          <v-window-item value="related">
            <v-card variant="flat" border rounded="lg" class="overflow-hidden">
              <v-data-table
                :headers="relatedHeaders"
                :items="relatedRows"
                density="comfortable"
                :items-per-page="5"
                hide-default-footer
              >
                <template #item.status="{ item }">
                  <MpStatusChip :status="item.status" type="general" size="sm" />
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>

          <v-window-item value="activity">
            <v-card variant="flat" border rounded="lg" class="tpl-card">
              <MpSectionHeader title="Activity" :heading-level="2" />
              <MpListRow
                v-for="entry in activityFeed"
                :key="entry.title"
                variant="divided"
                :eyebrow="entry.eyebrow"
                :title="entry.title"
                :meta="entry.meta"
              />
            </v-card>
          </v-window-item>
        </v-window>
      </div>
    </div>

    <MpFormDrawer v-model="editOpen" title="Edit record" :subtitle="record.name">
      <MpFormGrid :cols="2">
        <v-text-field v-model="form.name" label="Name" class="mp-form-grid__full" />
        <v-select v-model="form.category" label="Category" :items="CATEGORY_OPTIONS" />
        <v-select v-model="form.status" label="Status" :items="STATUS_OPTIONS" />
        <v-select v-model="form.owner" label="Owner" :items="OWNER_OPTIONS" class="mp-form-grid__full" />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="editOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveEdit">Save changes</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete record?"
      :message="`${record.name} will be removed. This cannot be undone.`"
      confirm-label="Delete"
      :consequences="['Linked items lose their reference', 'Activity history is kept for audit']"
      danger
      @confirm="performDelete"
    />
  </div>

  <!-- Not found — every detail route needs this branch, a bad id must land here -->
  <div v-else class="pa-10">
    <MpErrorState
      icon="file-x"
      title="Record not found"
      description="This record may have been removed, or the link is incorrect."
      action-label="Back to records"
      action-icon="arrow-left"
      @action="$router.push({ name: 'TemplateList' })"
    />
  </div>
</template>

<style scoped>
/* The card inset is a token, never a pa-* utility on a card root. */
.tpl-card {
  padding: var(--mp-component-card-padding);
}

/* The split stacks on its own width, not the viewport's: this template shares
   the column with the spec panel, so a viewport media query would keep both
   panes side by side long after the body column stopped being readable. The
   product page (ContactDetail) owns the full content width and uses the
   $mp-layout-breakpointSplit media query instead. */
.tpl-detail {
  flex-wrap: wrap;
}

.tpl-detail__side {
  flex: 1 1 var(--mp-layout-detailSidebarWidth);
}

.tpl-detail__body {
  /* Grows into every spare pixel while both panes fit, and wraps to its own
     full-width row the moment it cannot hold its reading measure. */
  flex: 999 1 var(--mp-layout-formMaxWidth);
}
</style>
