<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'

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

// CSV mode's upload is a mock with no file state, so its step 1 has nothing
// honest to gate on; FTP mode gates on a server and a file being chosen.
const sourceValid = computed(() => !isFtp.value || (ftpServer.value.trim() !== '' && ftpFile.value !== ''))

const { step, maxStep, goTo: goStep, next: nextStep, prev: prevStep } = useWizardSteps(() => steps.value.length, {
  canAdvance: (from) => from !== 1 || sourceValid.value,
})

const stepHint = computed(() =>
  step.value === 1 && !sourceValid.value ? 'Enter the FTP server and choose a file to continue' : undefined,
)

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

// ── Step 4 — mocked parse results (one source for the tiles AND the CTA) ─
const rowsDetected = 324
const skippedRows = 12
const validRows = rowsDetected - skippedRows
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
  <MpWizardShell
    :title="isFtp ? 'Import Products — FTP' : 'Import Products — CSV'"
    :steps="steps"
    :current="step"
    :max-step="maxStep"
    :back-to="productsRoute"
    :hint="stepHint"
    @select="goStep"
    @back="prevStep"
  >
    <template #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" @click="router.push(productsRoute)">Cancel</v-btn>
    </template>

        <!-- Step 1 — Upload (CSV) or Source (FTP) -->
        <template v-if="step === 1">
          <!-- CSV upload -->
          <MpWizardStepCard v-if="!isFtp" title="Upload your CSV" description="The first row should contain column headers.">
            <div class="iw-dropzone mb-4">
              <v-icon size="44" color="primary" class="mb-2">cloud-upload</v-icon>
              <div class="text-body-1 font-weight-medium mb-1">Drag and Drop your file here</div>
              <div class="text-caption text-medium-emphasis mb-3">max 150MB — CSV only</div>
              <v-btn variant="flat" color="primary" size="small" class="text-none" prepend-icon="folder-open">Browse File</v-btn>
            </div>
            <div class="d-flex align-center justify-space-between">
              <v-select v-model="delimiter" :items="['Comma (,)', 'Semicolon (;)', 'Tab']" label="Delimiter" class="iw-delimiter" />
              <v-btn variant="text" color="primary" class="text-none" prepend-icon="download">Download sample template</v-btn>
            </div>
          </MpWizardStepCard>

          <!-- FTP source -->
          <MpWizardStepCard v-else title="FTP Source" description="Connect to your FTP server and pick the file to import.">
            <MpFormGrid :cols="2">
              <v-text-field v-model="ftpServer" label="FTP Server" placeholder="ftp.mystore.com" />
              <v-text-field v-model="ftpPath" label="Directory Path" placeholder="/exports/products" />
              <v-select v-model="ftpFile" :items="['products_latest.csv', 'catalog_full.csv', 'stock_update.csv']" label="File" />
              <v-select v-model="delimiter" :items="['Comma (,)', 'Semicolon (;)', 'Tab']" label="Delimiter" />
            </MpFormGrid>
          </MpWizardStepCard>
        </template>

        <!-- Step 2 — Mapping -->
        <template v-else-if="step === 2">
          <MpWizardStepCard title="Map columns to product fields" :description="`We auto-detected ${fieldMappings.length} columns. Adjust the mappings if needed.`">
            <v-table density="comfortable">
              <thead>
                <tr><th class="text-left">File Column</th><th class="text-left">Sample</th><th class="text-left">Maps To</th></tr>
              </thead>
              <tbody>
                <tr v-for="(m, i) in fieldMappings" :key="i">
                  <td class="text-body-2 font-weight-medium">{{ m.csvCol }}</td>
                  <td class="text-caption text-medium-emphasis">{{ m.sample }}</td>
                  <td>
                    <!-- Table-cell inline editor: compact + `hide-details` are
                         deliberate, so a mapping row stays one line tall. -->
                    <v-select
                      v-model="m.field"
                      :items="productFields"
                      :aria-label="`Maps ${m.csvCol} to`"
                      hide-details
                      class="iw-mapping-select"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </MpWizardStepCard>
        </template>

        <!-- Step 3 — Update Option -->
        <template v-else-if="step === 3">
          <MpWizardStepCard title="Update Option" description="Choose how rows that match an existing SKU are handled.">
            <v-radio-group v-model="updateOption" aria-label="Update option">
              <v-radio value="new">
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
          </MpWizardStepCard>
        </template>

        <!-- Step 4 — Import -->
        <template v-else>
          <MpWizardStepCard title="Review before importing">
            <v-row dense class="mb-4">
              <v-col cols="4"><v-card variant="tonal" color="primary" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">{{ rowsDetected }}</div><div class="text-caption">Rows detected</div></v-card></v-col>
              <v-col cols="4"><v-card variant="tonal" color="success" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">{{ validRows }}</div><div class="text-caption">Valid products</div></v-card></v-col>
              <v-col cols="4"><v-card variant="tonal" color="warning" rounded="lg" class="pa-4 text-center"><div class="text-h5 font-weight-bold">{{ skippedRows }}</div><div class="text-caption">Skipped</div></v-card></v-col>
            </v-row>
            <MpAlert tone="info" live="off">
              Mode: <strong>{{ updateOption === 'update' ? 'Update existing products' : 'Add as new products' }}</strong>
              · Source: <strong>{{ isFtp ? 'FTP' : 'CSV upload' }}</strong>
            </MpAlert>
          </MpWizardStepCard>
        </template>

    <template #footerStart>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none" @click="router.push(productsRoute)">Cancel</v-btn>
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      </div>
    </template>
    <template #footer>
      <v-btn v-if="step < 4" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="step === 1 && !sourceValid" @click="nextStep">Continue</v-btn>
      <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="upload" @click="finishImport">Import {{ validRows }} Products</v-btn>
    </template>
  </MpWizardShell>

  <MpConfirmDialog
    v-model="confirmLeave"
    danger
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    @confirm="discardAndLeave"
  />
</template>

<style scoped>
.iw-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--mp-space-40) var(--mp-space-16);
  border: 1px dashed var(--border-strong);
  border-radius: var(--mp-radius-12);
}

/* Short control and table-cell editor widths from the token scale — no bare px. */
.iw-delimiter {
  max-width: var(--mp-component-toolbar-searchMinWidth);
}

.iw-mapping-select {
  min-width: var(--mp-component-menu-minWidth);
}
</style>
