<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

/**
 * Import logs — every product import run and its per-job outcome.
 * Rebuilt from UAT `/commerce/:id/products/import`; see docs/rebuild/products-list/.
 */
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})
const listRoute = computed(() => ({ name: 'Products', params: { accountId: accountId.value } }))

interface ImportLog {
  id: number
  fileReference: string
  status: 'Completed' | 'Partial' | 'Failed'
  totalJobs: number
  completedJobs: number
  createdAt: string
}

const logs = ref<ImportLog[]>([
  { id: 3, fileReference: 'catalog_refresh_furniture.csv', status: 'Completed', totalJobs: 4, completedJobs: 4, createdAt: 'Aug 12, 2026 at 09:14 AM' },
  { id: 2, fileReference: 'product_sample1.csv', status: 'Completed', totalJobs: 2, completedJobs: 2, createdAt: 'May 18, 2026 at 04:43 AM' },
  { id: 1, fileReference: 'product_export_2026-05-07.csv', status: 'Partial', totalJobs: 2, completedJobs: 1, createdAt: 'May 07, 2026 at 06:29 AM' },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true, width: 72 },
  { title: 'File reference', key: 'fileReference', sortable: true, minWidth: '280px' },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Total jobs', key: 'totalJobs', align: 'end' as const },
  { title: 'Completed jobs', key: 'completedJobs', align: 'end' as const },
  { title: 'Created at', key: 'createdAt', sortable: true },
  { title: 'Error report', key: 'report', sortable: false, align: 'end' as const },
]

function downloadReport(log: ImportLog) {
  const lines = [
    'row,field,problem',
    ...(log.status === 'Partial' ? ['14,price,"Not a number: \'\'"', '27,sku,"Duplicate SKU in file"'] : []),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import-${log.id}-errors.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Error report downloaded')
}

function newImport(source: 'csv' | 'ftp') {
  router.push({ name: source === 'csv' ? 'ProductImportCsv' : 'ProductImportFtp', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Commerce · Products"
      title="Import logs"
      subtitle="Every product import run and how its jobs finished."
      :back-to="listRoute"
    >
      <template #actions>
        <v-menu location="bottom end">
          <template #activator="{ props: menu }">
            <v-btn v-bind="menu" color="primary" variant="flat" prepend-icon="plus" append-icon="chevron-down" class="text-none">
              New import
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="file-text" title="Upload file" subtitle="CSV up to 150 MB" @click="newImport('csv')" />
            <v-list-item prepend-icon="server" title="Import over FTP" subtitle="Needs an SFTP connection" @click="newImport('ftp')" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="logs"
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.fileReference="{ item }">
          <span class="log-mono text-body-2">{{ item.fileReference }}</span>
        </template>
        <template #item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="sm" />
        </template>
        <template #item.completedJobs="{ item }">
          <span class="text-body-2" :class="item.completedJobs < item.totalJobs ? 'text-warning' : ''">
            {{ item.completedJobs }} / {{ item.totalJobs }}
          </span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.createdAt }}</span>
        </template>
        <template #item.report="{ item }">
          <v-btn
            icon="download"
            size="small"
            variant="text"
            :aria-label="`Download error report for import ${item.id}`"
            :disabled="item.status === 'Completed'"
            @click="downloadReport(item)"
          />
        </template>
        <template #no-data>
          <MpEmptyState
            icon="history"
            title="No imports yet"
            description="Runs appear here as soon as you import products from a file or over FTP."
            action-label="New import"
            action-icon="plus"
            class="py-10"
            @action="newImport('csv')"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.log-mono {
  font-family: var(--mp-fontFamily-mono);
}
</style>
