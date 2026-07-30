<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketingAssetsStore, type CouponBank } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'

const store = useMarketingAssetsStore()
const search = ref('')

const TAG_PATTERN = /^[a-z0-9_]*$/

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Tag', key: 'tag' },
  { title: 'Unused', key: 'unused', align: 'end' as const },
  { title: 'Redeemed', key: 'redeemed', align: 'end' as const },
  { title: 'Assigned', key: 'assigned', align: 'end' as const },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Create / edit drawer ─────────────────────────────────────────────────
const drawer = ref(false)
const editingId = ref<number | null>(null)
const name = ref('')
const tag = ref('')
const alertThreshold = ref<number | null>(null)
const alertRecipients = ref('')
const codesText = ref('')

const codeLines = computed(() => codesText.value.split('\n').map(s => s.trim()).filter(Boolean))
const tagError = computed(() => (tag.value && !TAG_PATTERN.test(tag.value)) ? 'Use lowercase letters, numbers, and underscores only' : '')
const canSave = computed(() => name.value.trim() !== '' && !tagError.value && codeLines.value.length > 0)

function resetForm() {
  name.value = ''
  tag.value = ''
  alertThreshold.value = null
  alertRecipients.value = ''
  codesText.value = ''
}

function openCreate() {
  editingId.value = null
  resetForm()
  drawer.value = true
}

function openEdit(bank: CouponBank) {
  editingId.value = bank.id
  name.value = bank.name
  tag.value = bank.tag
  alertThreshold.value = bank.alertThreshold
  alertRecipients.value = bank.alertRecipients
  codesText.value = bank.codes.join('\n')
  drawer.value = true
}

function saveBank() {
  if (!canSave.value) return
  const payload = {
    name: name.value.trim(),
    tag: tag.value.trim(),
    alertThreshold: alertThreshold.value,
    alertRecipients: alertRecipients.value.trim(),
    codes: codeLines.value,
  }
  if (editingId.value !== null) {
    store.updateCoupon(editingId.value, payload)
    notify('Coupon bank updated')
  } else {
    store.addCoupon(payload)
    notify('Coupon bank created')
  }
  drawer.value = false
}

// ── Delete ────────────────────────────────────────────────────────────────
const confirmDelete = ref(false)
const pendingDelete = ref<CouponBank | null>(null)
function askDelete(bank: CouponBank) {
  pendingDelete.value = bank
  confirmDelete.value = true
}
function doDelete() {
  if (pendingDelete.value) {
    store.deleteCoupon(pendingDelete.value.id)
    notify('Coupon bank deleted')
  }
  pendingDelete.value = null
}

// ── Toast ─────────────────────────────────────────────────────────────────
const toast = useToast()
function notify(text: string) { toast.success(text) }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Coupon Banks"
      :subtitle="`${store.coupons.length} coupon banks`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Coupon</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Coupon Banks"
        search-placeholder="Search coupon banks..."
        :total-count="store.coupons.length"
      />

      <v-data-table :headers="headers" :items="store.coupons" :search="search" hover density="comfortable" :items-per-page="15" fixed-header class="flex-grow-1">
        <template v-slot:item.name="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.name }}</span>
        </template>
        <template v-slot:item.tag="{ item }">
          <v-chip v-if="item.tag" size="small" variant="tonal" color="default" class="font-mono">{{ item.tag }}</v-chip>
          <span v-else class="text-medium-emphasis text-body-2">—</span>
        </template>
        <template v-slot:item.unused="{ item }">
          <span class="font-weight-medium">{{ item.unused.toLocaleString() }}</span>
        </template>
        <template v-slot:item.redeemed="{ item }">{{ item.redeemed.toLocaleString() }}</template>
        <template v-slot:item.assigned="{ item }">{{ item.assigned.toLocaleString() }}</template>
        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Coupon bank actions">
            <v-list-item prepend-icon="pencil" title="Edit" @click="openEdit(item)" />
            <v-divider class="my-1" style="opacity: 0.4" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>
        <template v-slot:no-data>
          <MpEmptyState
            icon="ticket-percent"
            :title="search ? 'No coupon banks match your search' : 'No coupon banks yet'"
            :description="search ? 'Try a different search term.' : 'Create a pool of unique coupon codes to assign per recipient at send time.'"
            :action-label="!search ? 'New Coupon' : undefined"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / edit drawer -->
    <MpFormDrawer
      v-model="drawer"
      :title="editingId !== null ? 'Edit Coupon Bank' : 'New Coupon'"
      :width="520"
    >
      <v-text-field
        v-model="name"
        label="Name"
        placeholder="e.g. Spring Sale 20% Off"
        variant="outlined"
        density="comfortable"
        class="mb-4"
        :rules="[v => !!v || 'Name is required']"
      />
      <v-text-field
        v-model="tag"
        label="Coupon Tag"
        placeholder="e.g. spring_sale_20"
        hint="Lowercase letters, numbers, and underscores only"
        persistent-hint
        variant="outlined"
        density="comfortable"
        class="mb-4"
        :error-messages="tagError ? [tagError] : []"
      />
      <v-row dense class="mb-2">
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="alertThreshold"
            label="Alert Threshold"
            type="number"
            placeholder="e.g. 1000"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="alertRecipients"
            label="Alert Recipients"
            placeholder="ops@example.com, team@example.com"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>
      </v-row>
      <p class="text-caption text-medium-emphasis mb-4 mt-2">Sends an alert email when unused codes fall below the threshold.</p>

      <v-textarea
        v-model="codesText"
        label="Default Coupon Codes"
        placeholder="One code per line"
        hint="The number of lines becomes the unused code count"
        persistent-hint
        variant="outlined"
        density="comfortable"
        rows="6"
        :rules="[v => !!v || 'At least one coupon code is required']"
      />
      <div v-if="codeLines.length" class="text-caption text-medium-emphasis mt-2">
        {{ codeLines.length.toLocaleString() }} code{{ codeLines.length === 1 ? '' : 's' }}
      </div>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="saveBank">
          {{ editingId !== null ? 'Save Changes' : 'Create Coupon' }}
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete coupon bank?"
      :message="`“${pendingDelete?.name}” and its remaining unused codes will be permanently deleted.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.font-mono { font-family: monospace; }
</style>
