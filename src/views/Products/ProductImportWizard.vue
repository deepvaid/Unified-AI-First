<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'

const props = withDefaults(defineProps<{ source?: 'csv' | 'ftp' }>(), { source: 'csv' })

const route = useRoute()
const router = useRouter()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})
const productsRoute = computed(() => ({ name: 'Products', params: { accountId: accountId.value } }))

const isFtp = computed(() => props.source === 'ftp')
const steps = computed(() => [isFtp.value ? 'Source' : 'Upload', 'Mapping', 'Update Option', 'Import'])

const step = ref(1)
const maxStep = ref(1)

// ── Step 1 — Upload / Source ────────────────────────────────────────────
const delimiter = ref('Comma (,)')
// FTP config
const ftpServer = ref('')
const ftpPath = ref('')
const ftpFile = ref('')

// ── Step 2 — Mapping ────────────────────────────────────────────────────
const productFields = ['Name', 'SKU', 'Price', 'Cost Price', 'Inventory', 'Brand', 'Category', 'Description', 'Do not import']
const fieldMappings = ref([
  { csvCol: 'product_name', sample: 'Wireless Earbuds Pro', field: 'Name' },
  { csvCol: 'sku_code', sample: 'SKU-45012', field: 'SKU' },
  { csvCol: 'unit_price', sample: '129.00', field: 'Price' },
  { csvCol: 'stock_qty', sample: '340', field: 'Inventory' },
  { csvCol: 'supplier', sample: 'Acme Corp', field: 'Brand' },
  { csvCol: 'category', sample: 'Electronics', field: 'Category' },
])

// ── Step 3 — Update Option ──────────────────────────────────────────────
const updateOption = ref<'new' | 'update'>('new')

function goStep(target: number) {
  if (target <= maxStep.value) step.value = target
}
function nextStep() {
  if (step.value < 4) {
    step.value += 1
    maxStep.value = Math.max(maxStep.value, step.value)
  }
}
function prevStep() {
  if (step.value > 1) step.value -= 1
}
// ── Unsaved-changes guard (replaces the old always-on Cancel confirm) ────
const isDirty = computed(() =>
  step.value > 1 || ftpServer.value.trim() !== '' || ftpPath.value.trim() !== '' || ftpFile.value.trim() !== '',
)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Cancel this import?',
  message: "Your import setup won't be saved.",
  confirmLabel: 'Cancel Import',
})

function finishImport() {
  allowNextLeave()
  router.push({ ...productsRoute.value, query: { flash: 'import-complete' } })
}
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="iw-head px-8 pt-6 pb-4 bg-surface border-b">
      <MpPageHeader
        :title="isFtp ? 'Import Products — FTP' : 'Import Products — CSV'"
        :subtitle="`Step ${step} of 4 — ${steps[step - 1]}`"
        :back-to="productsRoute"
      >
        <template #actions>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="router.push(productsRoute)">Cancel</v-btn>
        </template>
        <template #tabs>
          <MpWizardSteps :steps="steps" :current="step" clickable :max-step="maxStep" class="mt-3" @select="goStep" />
        </template>
      </MpPageHeader>
    </div>

    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div style="max-width: 820px; margin: 0 auto;">

        <!-- Step 1 — Upload (CSV) or Source (FTP) -->
        <template v-if="step === 1">
          <!-- CSV upload -->
          <v-card v-if="!isFtp" variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">Upload your CSV</div>
            <div class="text-body-2 text-medium-emphasis mb-4">The first row should contain column headers.</div>
            <div class="iw-dropzone mb-4">
              <v-icon size="44" color="primary" class="mb-2">cloud-upload</v-icon>
              <div class="text-body-1 font-weight-medium mb-1">Drag and Drop your file here</div>
              <div class="text-caption text-medium-emphasis mb-3">max 150MB — CSV only</div>
              <v-btn variant="flat" color="primary" size="small" class="text-none" prepend-icon="folder-open">Browse File</v-btn>
            </div>
            <div class="d-flex align-center justify-space-between">
              <v-select v-model="delimiter" :items="['Comma (,)', 'Semicolon (;)', 'Tab']" label="Delimiter" variant="outlined" density="comfortable" hide-details style="max-width: 260px;" />
              <v-btn variant="text" color="primary" class="text-none" prepend-icon="download">Download sample template</v-btn>
            </div>
          </v-card>

          <!-- FTP source -->
          <v-card v-else variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">FTP Source</div>
            <div class="text-body-2 text-medium-emphasis mb-4">Connect to your FTP server and pick the file to import.</div>
            <v-row dense>
              <v-col cols="12" md="6"><v-text-field v-model="ftpServer" label="FTP Server" placeholder="ftp.mystore.com" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="ftpPath" label="Directory Path" placeholder="/exports/products" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="6"><v-select v-model="ftpFile" :items="['products_latest.csv', 'catalog_full.csv', 'stock_update.csv']" label="File" variant="outlined" density="comfortable" /></v-col>
              <v-col cols="12" md="6"><v-select v-model="delimiter" :items="['Comma (,)', 'Semicolon (;)', 'Tab']" label="Delimiter" variant="outlined" density="comfortable" /></v-col>
            </v-row>
          </v-card>
        </template>

        <!-- Step 2 — Mapping -->
        <template v-else-if="step === 2">
          <v-card variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">Map columns to product fields</div>
            <div class="text-body-2 text-medium-emphasis mb-4">We auto-detected {{ fieldMappings.length }} columns. Adjust the mappings if needed.</div>
            <v-table density="comfortable">
              <thead>
                <tr><th class="text-left">File Column</th><th class="text-left">Sample</th><th class="text-left">Maps To</th></tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in fieldMappings" :key="i">
                  <td class="text-body-2 font-weight-medium">{{ m.csvCol }}</td>
                  <td class="text-caption text-medium-emphasis">{{ m.sample }}</td>
                  <td>
                    <v-select v-model="m.field" :items="productFields" variant="outlined" density="compact" hide-details style="min-width: 180px;" />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </template>

        <!-- Step 3 — Update Option -->
        <template v-else-if="step === 3">
          <v-card variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-1">Update Option</div>
            <div class="text-body-2 text-medium-emphasis mb-4">Choose how rows that match an existing SKU are handled.</div>
            <v-radio-group v-model="updateOption" hide-details>
              <v-radio value="new" class="mb-2">
                <template #label>
                  <div>
                    <div class="text-body-2 font-weight-medium">Add as new products</div>
                    <div class="text-caption text-medium-emphasis">Every row is imported as a new product. Matching SKUs are skipped.</div>
                  </div>
                </template>
              </v-radio>
              <v-radio value="update">
                <template #label>
                  <div>
                    <div class="text-body-2 font-weight-medium">Update existing products</div>
                    <div class="text-caption text-medium-emphasis">Rows with a matching SKU update the existing product instead of duplicating it.</div>
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </v-card>
        </template>

        <!-- Step 4 — Import -->
        <template v-else>
          <v-card variant="flat" border rounded="lg" class="pa-6">
            <div class="text-subtitle-1 font-weight-bold mb-4">Review before importing</div>
            <v-row dense class="mb-4">
              <v-col cols="4"><v-card variant="tonal" color="primary" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">324</div><div class="text-caption">Rows detected</div></v-card></v-col>
              <v-col cols="4"><v-card variant="tonal" color="success" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">312</div><div class="text-caption">Valid products</div></v-card></v-col>
              <v-col cols="4"><v-card variant="tonal" color="warning" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">12</div><div class="text-caption">Skipped</div></v-card></v-col>
            </v-row>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="text-body-2">
              Mode: <strong>{{ updateOption === 'update' ? 'Update existing products' : 'Add as new products' }}</strong>
              · Source: <strong>{{ isFtp ? 'FTP' : 'CSV upload' }}</strong>
            </v-alert>
          </v-card>
        </template>

      </div>
    </div>

    <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none" @click="router.push(productsRoute)">Cancel</v-btn>
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn v-if="step < 4" color="primary" variant="flat" class="text-none" append-icon="arrow-right" @click="nextStep">Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="upload" @click="finishImport">Import 312 Products</v-btn>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped>
.iw-head :deep(.mp-page-header) { margin-bottom: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.iw-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 16px;
  border: 1.5px dashed rgba(var(--v-theme-on-surface), 0.25);
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
