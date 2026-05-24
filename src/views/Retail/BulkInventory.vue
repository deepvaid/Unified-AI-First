<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useRetailStore } from '@/stores/useRetail'
import { formatAgo } from '@/composables/useRelativeTime'

const store = useRetailStore()
const snackbar = ref({ visible: false, message: '' })

function showToast(message: string) { snackbar.value = { visible: true, message } }

const dropping = ref(false)
const uploading = ref(false)
function onDrop(_e: DragEvent) {
  dropping.value = false
  uploading.value = true
  setTimeout(() => {
    uploading.value = false
    showToast('Preview ready — review changes before applying.')
  }, 900)
}

function pickFile() {
  showToast('File picker — mock only')
}

const audits = computed(() => store.inventoryAuditList)

const auditHeaders = [
  { title: 'File', key: 'fileName', sortable: false },
  { title: 'Rows changed', key: 'rowsChanged', sortable: true, align: 'end' as const, width: 140 },
  { title: 'Reason', key: 'reason', sortable: false, width: 200 },
  { title: 'User', key: 'user', sortable: false, width: 180 },
  { title: 'When', key: 'at', sortable: true, width: 160 },
  { title: 'Status', key: 'status', sortable: false, width: 130 },
]

function statusLabel(s: 'completed' | 'partial' | 'failed'): string {
  return s === 'completed' ? 'Completed' : s === 'partial' ? 'Partial' : 'Failed'
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Bulk Inventory"
      subtitle="Upload CSVs to create or adjust stock across SKUs and locations. Every change is logged and reversible."
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="download" @click="showToast('Export started')">
          Export current stock
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="upload" @click="pickFile">
          Upload CSV
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- Upload zone -->
    <v-card flat border rounded="lg" class="retail-widget-card">
      <div class="retail-widget-header">
        <div class="retail-widget-header__title">Upload</div>
        <div class="retail-widget-header__actions">
          <span class="retail-widget-header__sub">CSV or spreadsheet · max 50,000 rows</span>
        </div>
      </div>

      <div class="retail-widget-body">
        <div
          class="retail-dropzone"
          :class="{ 'retail-dropzone--active': dropping, 'retail-dropzone--uploading': uploading }"
          @dragover.prevent="dropping = true"
          @dragleave.prevent="dropping = false"
          @drop.prevent="onDrop"
          @click="pickFile"
          role="button"
          tabindex="0"
        >
          <v-progress-circular v-if="uploading" indeterminate color="primary" size="36" />
          <template v-else>
            <v-icon size="32" color="primary">upload-cloud</v-icon>
            <div class="retail-dropzone__title">Drag and drop a CSV here</div>
            <div class="retail-dropzone__sub">or click to browse — file is validated before any changes apply</div>
          </template>
        </div>

        <div class="retail-format-row">
          <div class="retail-format-tile">
            <v-icon size="18" color="info">file-text</v-icon>
            <div>
              <div class="retail-list-title">Set absolute quantities</div>
              <div class="retail-list-sub">columns: sku, location_id, quantity</div>
            </div>
          </div>
          <div class="retail-format-tile">
            <v-icon size="18" color="success">arrow-up-down</v-icon>
            <div>
              <div class="retail-list-title">Delta adjustments</div>
              <div class="retail-list-sub">columns: sku, location_id, delta, reason</div>
            </div>
          </div>
          <div class="retail-format-tile">
            <v-icon size="18" color="warning">history</v-icon>
            <div>
              <div class="retail-list-title">Audit-safe</div>
              <div class="retail-list-sub">every row logs old → new with attribution</div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Audit history -->
    <v-card flat border rounded="lg" class="retail-widget-card flex-grow-1 d-flex flex-column overflow-hidden">
      <div class="retail-widget-header">
        <div class="retail-widget-header__title">Recent imports</div>
        <div class="retail-widget-header__actions">
          <span class="retail-widget-header__sub">{{ audits.length }} entries</span>
        </div>
      </div>

      <v-data-table
        :headers="auditHeaders"
        :items="audits"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="10"
        class="flex-grow-1"
      >
        <template #item.fileName="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="16" color="medium-emphasis">file-spreadsheet</v-icon>
            <span class="font-weight-medium">{{ item.fileName }}</span>
          </div>
        </template>

        <template #item.rowsChanged="{ item }">
          <span class="font-weight-bold">{{ item.rowsChanged.toLocaleString() }}</span>
        </template>

        <template #item.at="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatAgo(item.at) }}</span>
        </template>

        <template #item.status="{ item }">
          <MpStatusChip :status="statusLabel(item.status)" type="general" size="x-small" />
        </template>

        <template #no-data>
          <MpEmptyState icon="upload-cloud" title="No imports yet" description="Upload a CSV to get started." />
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.retail-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 36px 18px;
  border: 1.5px dashed color-mix(in oklch, var(--ink) 18%, transparent);
  border-radius: var(--r-section);
  background: color-mix(in oklch, var(--ink) 2%, var(--surface-1));
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}

.retail-dropzone:hover,
.retail-dropzone--active {
  border-color: var(--cloud-retail-accent);
  background: color-mix(in oklch, var(--cloud-retail-accent) 5%, var(--surface-1));
}

.retail-dropzone--uploading {
  pointer-events: none;
}

.retail-dropzone__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.retail-dropzone__sub {
  font-size: 12px;
  color: var(--muted);
}

.retail-format-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.retail-format-tile {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in oklch, var(--ink) 7%, transparent);
  border-radius: var(--r-section);
  background: var(--surface-1);
}
</style>
