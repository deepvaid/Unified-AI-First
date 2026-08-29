<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore, type CustomGiftCard, type GiftCardInput } from '@/stores/useCommerce'
import { useImagesStore } from '@/stores/useImages'
import { downloadCsv } from '@/utils/exportCsv'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpListRow from '@/components/MpListRow.vue'
import { useToast } from '@/composables/useToast'

const store = useCommerceStore()
const images = useImagesStore()
const search = ref('')
const selected = ref<number[]>([])
const { loading } = useInitialLoad()

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Small mock image set for the picker (jpg/png tiles from the image library).
const imageOptions = computed(() => images.items.filter(i => !i.name.endsWith('.svg')).slice(0, 5).map(i => i.name))

// ── Issue Gift Card drawer ───────────────────────────────────────
const issueDrawer = ref(false)

const blankCard = (): GiftCardInput => ({
  initialValue: 50,
  email: '',
  contact: '',
  message: '',
  expiration: 'none',
  expiry: '',
  status: 'Active',
  image: undefined,
})
const form = ref<GiftCardInput>(blankCard())
const submitted = ref(false)

const AMOUNT_PRESETS = [25, 50, 100, 200]

// VChipGroup clears its model when the selected chip is clicked again; the amount
// field keeps whatever it had rather than resetting to nothing.
function onPresetPick(index: number | undefined) {
  const amount = index == null ? undefined : AMOUNT_PRESETS[index]
  if (amount != null) form.value.initialValue = amount
}

const formValid = computed(() =>
  form.value.initialValue > 0 && (form.value.expiration === 'none' || !!form.value.expiry),
)

// Snapshot the form on open so close paths can tell edits from noise.
const openSnapshot = ref('')
function snapshotState() {
  return JSON.stringify(form.value)
}
const drawerDirty = computed(() => issueDrawer.value && snapshotState() !== openSnapshot.value)

const confirmDiscard = ref(false)
function requestCloseDrawer() {
  if (drawerDirty.value) confirmDiscard.value = true
  else issueDrawer.value = false
}

function openIssue() {
  form.value = blankCard()
  submitted.value = false
  openSnapshot.value = snapshotState()
  issueDrawer.value = true
}

function issueGiftCard() {
  submitted.value = true
  if (!formValid.value) return
  store.issueGiftCard({ ...form.value, expiry: form.value.expiry || null })
  issueDrawer.value = false
  notify('Gift card issued successfully')
}

// ── View drawer (readonly) ───────────────────────────────────────
const viewDrawer = ref(false)
const viewing = ref<CustomGiftCard | null>(null)

function openView(card: CustomGiftCard) {
  viewing.value = card
  viewDrawer.value = true
}

// ── Filters ──────────────────────────────────────────────────────
// Status is this table's only filter, so it lives in the toolbar as a pill and
// there is no drawer at all.
const statusQuickFilter = {
  key: 'status',
  label: 'Status',
  options: ['Active', 'Redeemed', 'Expired', 'Disabled'].map((v) => ({ label: v, value: v })),
}
const statusFilter = ref<string[]>([])

const activeFilterEntries = computed(() =>
  statusFilter.value.length ? [{ key: 'status', label: `Status: ${statusFilter.value.join(', ')}` }] : [],
)

function clearAllFilters() {
  statusFilter.value = []
}

const filteredCards = computed(() =>
  store.customGiftCards.filter(c => !statusFilter.value.length || statusFilter.value.includes(c.status)),
)

function selectAll() {
  selected.value = filteredCards.value.map(c => c.id)
}

// ── Row / bulk actions ───────────────────────────────────────────
function disableCard(card: CustomGiftCard) {
  store.disableGiftCard(card.id)
  notify('Gift card disabled')
}

function bulkDisable() {
  const count = selected.value.length
  selected.value.forEach(id => store.disableGiftCard(id))
  selected.value = []
  notify(`${count} gift card${count === 1 ? '' : 's'} disabled`)
}

const confirmDelete = ref(false)
const pendingDelete = ref<CustomGiftCard | null>(null)
const bulkDelete = ref(false)

function askDelete(card: CustomGiftCard) {
  pendingDelete.value = card
  bulkDelete.value = false
  confirmDelete.value = true
}

function askBulkDelete() {
  pendingDelete.value = null
  bulkDelete.value = true
  confirmDelete.value = true
}

function doDelete() {
  if (bulkDelete.value) {
    const count = selected.value.length
    store.deleteGiftCards(selected.value)
    selected.value = []
    notify(`${count} gift card${count === 1 ? '' : 's'} deleted`)
  } else if (pendingDelete.value) {
    store.deleteGiftCards([pendingDelete.value.id])
    notify('Gift card deleted')
  }
  pendingDelete.value = null
  bulkDelete.value = false
}

const deleteMessage = computed(() =>
  bulkDelete.value
    ? `${selected.value.length} gift card${selected.value.length === 1 ? '' : 's'} will be permanently deleted. Any remaining balance is lost. This cannot be undone.`
    : `Gift card ${pendingDelete.value?.code} will be permanently deleted. Any remaining balance is lost. This cannot be undone.`,
)

// ── Export CSV ────────────────────────────────────────────────────
function exportCsv() {
  const rows = selected.value.length ? filteredCards.value.filter(c => selected.value.includes(c.id)) : filteredCards.value
  downloadCsv('Custom_Gift_Cards_Export', rows, [
    { title: 'Code', value: 'code' },
    { title: 'Contact', value: 'contact' },
    { title: 'Recipient', value: (c) => c.recipient.email },
    { title: 'Status', value: 'status' },
    { title: 'Initial Balance', value: (c) => c.initialValue.toFixed(2) },
    { title: 'Current Balance', value: (c) => c.balance.toFixed(2) },
    { title: 'Date Added', value: 'issued' },
    { title: 'Expiry', value: (c) => c.expiry ?? 'No expiration' },
  ])
  notify(`Exported ${rows.length} gift card${rows.length === 1 ? '' : 's'} as CSV`)
}

// ── Summary ──────────────────────────────────────────────────────
const summary = computed(() => {
  const active = store.customGiftCards.filter(c => c.status === 'Active')
  const outstanding = active.reduce((sum, c) => sum + c.balance, 0)
  const redeemed = store.customGiftCards.filter(c => c.status === 'Redeemed').length
  return `${active.length} active · ${money(outstanding)} outstanding balance · ${redeemed} redeemed`
})

// ── Table ────────────────────────────────────────────────────────
const headers = [
  { title: 'Gift card', key: 'code', sortable: true },
  { title: 'Contact', key: 'contact', hideBelow: 'lg' as const },
  { title: 'Recipient', key: 'recipient', sortable: false, hideBelow: 'md' as const },
  { title: 'Initial balance', key: 'initialValue', align: 'end' as const },
  { title: 'Current balance', key: 'balance' },
  { title: 'Status', key: 'status' },
  { title: 'Date added', key: 'issued', hideBelow: 'lg' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)

const toast = useToast()
function notify(text: string) { toast.success(text) }
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Custom Gift Cards" :subtitle="summary">
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface" @click="exportCsv">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openIssue">New custom gift card</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:quick-filter-value="statusFilter"
        :quick-filter="statusQuickFilter"
        v-model:search="search"
        title="Issued gift cards"
        search-placeholder="Search by code, contact or recipient…"
        :active-filters="activeFilterEntries"
        :total-count="filteredCards.length"
        @remove-filter="clearAllFilters"
        @clear-filters="clearAllFilters"
      />

      <MpTableSkeleton v-if="loading" :rows="8" :columns="6" />

      <v-data-table
        v-else
        v-model="selected"
        :headers="visibleHeaders"
        :items="filteredCards"
        :search="search"
        item-value="id"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.code="{ item }">
          <div class="d-flex align-center gap-2">
            <v-avatar size="30" rounded="lg" color="primary" variant="tonal">
              <v-icon size="16">gift</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <span class="font-mono font-weight-bold text-body-2">{{ item.code }}</span>
              <div v-if="item.lastUsed" class="text-caption text-medium-emphasis">Last used {{ item.lastUsed }}</div>
              <div v-else class="text-caption text-medium-emphasis">Never used</div>
            </div>
          </div>
        </template>

        <template v-slot:item.contact="{ item }">
          <span class="text-body-2" :class="{ 'text-medium-emphasis': item.contact === '—' }">{{ item.contact }}</span>
        </template>

        <template v-slot:item.recipient="{ item }">
          <div class="text-body-2 font-weight-medium">{{ item.recipient.email }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.expiry ? `Expires ${item.expiry}` : 'No expiration' }}</div>
        </template>

        <template v-slot:item.initialValue="{ item }">
          <span class="text-body-2">{{ money(item.initialValue) }}</span>
        </template>

        <template v-slot:item.balance="{ item }">
          <div style="min-width: 96px">
            <span class="font-weight-bold text-body-2">{{ money(item.balance) }}</span>
            <v-progress-linear
              :model-value="(item.balance / item.initialValue) * 100"
              :color="item.balance === 0 ? 'medium-emphasis' : item.balance / item.initialValue < 0.25 ? 'warning' : 'success'"
              height="4"
              rounded
              class="mt-1"
            />
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="coupon" size="sm" />
        </template>

        <template v-slot:item.issued="{ item }">
          <span class="text-body-2">{{ item.issued }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Gift card actions" :itemLabel="item.code">
            <MpMenuItem icon="eye" title="View" @click="openView(item)" />
            <MpMenuItem icon="ban" title="Disable" :disabled="item.status === 'Disabled'" @click="disableCard(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="gift"
            :title="search || activeFilterEntries.length ? 'No gift cards match your filters' : 'No gift cards issued yet'"
            :description="search || activeFilterEntries.length ? 'Try a different search term or clear filters.' : 'Issue store-credit gift cards to reward customers, resolve support cases, or run promotions.'"
            :action-label="!search && !activeFilterEntries.length ? 'New custom gift card' : undefined"
            action-icon="plus"
            @action="openIssue"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpFloatingBulkBar
      :count="selected.length"
      :total="filteredCards.length"
      @clear="selected = []"
      @select-all="selectAll"
    >
      <v-btn size="small" variant="flat" color="surface" class="text-none" prepend-icon="download" rounded="lg" @click="exportCsv">Export</v-btn>
      <v-btn size="small" variant="flat" color="warning" class="text-none" prepend-icon="ban" rounded="lg" @click="bulkDisable">Disable</v-btn>
      <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg" @click="askBulkDelete">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- ── Issue Gift Card drawer ──────────────────────────────── -->
    <MpFormDrawer
      v-model="issueDrawer"
      title="New custom gift card"
      subtitle="Issue a store-credit card and send it to a recipient"
      :guarded="drawerDirty"
      @close="requestCloseDrawer"
    >
      <!-- Preview -->
      <v-card color="primary" variant="tonal" rounded="lg" class="gift-preview">
        <!-- Icon and label read as one mark. They used to sit at opposite ends of
             a justify-space-between row, which pushed the word "Gift card" away
             from the icon it names and left a gap that meant nothing (P6-14). -->
        <div class="d-flex align-center ga-2">
          <v-icon size="22">gift</v-icon>
          <span class="gift-preview__kicker">Gift card</span>
        </div>
        <div>
          <div class="text-h4 font-weight-bold">{{ money(Number(form.initialValue) || 0) }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ form.email || 'For your recipient' }}</div>
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ form.expiration === 'none' ? 'No expiration date' : form.expiry ? `Expires ${form.expiry}` : 'Expiration date not set' }}
        </div>
      </v-card>

      <MpFormSection title="General" />
      <MpFormGrid>
        <v-text-field
          v-model.number="form.initialValue"
          label="Initial value *"
          type="number"
          min="1"
          prepend-inner-icon="dollar-sign"
          :error="submitted && !(form.initialValue > 0)"
          :error-messages="submitted && !(form.initialValue > 0) ? ['Initial value is required'] : []"
        />
        <MpFormField label="Common amounts" hint="Sets the initial value above.">
          <v-chip-group
            :model-value="AMOUNT_PRESETS.indexOf(Number(form.initialValue))"
            @update:model-value="onPresetPick"
          >
            <v-chip v-for="preset in AMOUNT_PRESETS" :key="preset" filter>
              {{ money(preset) }}
            </v-chip>
          </v-chip-group>
        </MpFormField>
        <v-text-field v-model="form.contact" label="Contact" prepend-inner-icon="user" hint="Link to an existing contact" persistent-hint />
        <v-text-field v-model="form.email" label="Email" type="email" prepend-inner-icon="mail" />
        <v-textarea v-model="form.message" label="Gift card message" rows="3" />
      </MpFormGrid>

      <MpFormSection title="Expiration date" />
      <MpFormGrid>
        <MpFormField
          label="When this card expires"
          hint="Countries have different laws for gift card expiry dates. Check the laws that apply to your store before setting one."
        >
          <template #default="{ labelId, descriptionId }">
            <v-radio-group
              v-model="form.expiration"
              :aria-labelledby="labelId"
              :aria-describedby="descriptionId"
            >
              <v-radio value="none" label="No expiration date" />
              <v-radio value="date" label="Set expiration date" />
            </v-radio-group>
          </template>
        </MpFormField>
        <v-text-field
          v-if="form.expiration === 'date'"
          v-model="form.expiry"
          label="Expires on *"
          type="date"
          :error="submitted && !form.expiry"
          :error-messages="submitted && !form.expiry ? ['Choose an expiration date'] : []"
        />
      </MpFormGrid>

      <MpFormSection title="Status" />
      <MpFormGrid>
        <v-select v-model="form.status" label="Status" :items="['Active', 'Disabled']" />
      </MpFormGrid>

      <MpFormSection title="Image" />
      <MpFormGrid>
        <MpFormField label="Card artwork" hint="Shown on the gift card email. Pick from your image library.">
          <div class="d-flex flex-wrap ga-2">
            <button
              type="button"
              class="gift-image-tile d-flex flex-column align-center justify-center"
              :class="{ selected: !form.image }"
              aria-label="No image"
              @click="form.image = undefined"
            >
              <v-icon size="18" class="text-medium-emphasis">image-off</v-icon>
              <span class="text-caption text-medium-emphasis">None</span>
            </button>
            <button
              v-for="(name, i) in imageOptions"
              :key="name"
              type="button"
              class="gift-image-tile gift-image-tile--art d-flex flex-column align-center justify-center"
              :class="[`gift-image-tile--g${i % 3}`, { selected: form.image === name }]"
              :aria-label="`Use image ${name}`"
              @click="form.image = name"
            >
              <v-icon size="18">gift</v-icon>
              <span class="text-caption gift-image-name">{{ name }}</span>
            </button>
          </div>
        </MpFormField>
      </MpFormGrid>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="requestCloseDrawer">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="text-none" prepend-icon="gift" @click="issueGiftCard">
          Save gift card
        </v-btn>
      </template>
    </MpFormDrawer>

    <!-- ── View Gift Card drawer (readonly) ────────────────────── -->
    <MpFormDrawer
      v-model="viewDrawer"
      title="Gift card details"
      :subtitle="viewing?.code"
    >
      <template v-if="viewing">
        <v-card color="primary" variant="tonal" rounded="lg" class="gift-preview">
          <div class="d-flex align-center justify-space-between">
            <v-icon size="22">gift</v-icon>
            <MpStatusChip :status="viewing.status" type="coupon" size="sm" />
          </div>
          <div>
            <div class="text-h4 font-weight-bold">{{ money(viewing.balance) }}</div>
            <div class="text-body-2 text-medium-emphasis">of {{ money(viewing.initialValue) }} initial value</div>
          </div>
        </v-card>

        <MpFormSection title="Details" />
        <div class="d-flex flex-column">
          <MpListRow variant="divided" eyebrow="Code" :title="viewing.code" />
          <MpListRow variant="divided" eyebrow="Contact" :title="viewing.contact" />
          <MpListRow variant="divided" eyebrow="Recipient email" :title="viewing.recipient.email" />
          <MpListRow variant="divided" eyebrow="Message" :title="viewing.message || '—'" />
          <MpListRow variant="divided" eyebrow="Date added" :title="viewing.issued" />
          <MpListRow variant="divided" eyebrow="Expiration" :title="viewing.expiry || 'No expiration date'" />
          <MpListRow variant="divided" eyebrow="Last used" :title="viewing.lastUsed || 'Never used'" />
          <MpListRow variant="divided" eyebrow="Image" :title="viewing.image || 'None'" />
        </div>
      </template>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="viewDrawer = false">Close</v-btn>
        <v-btn
          v-if="viewing && viewing.status !== 'Disabled'"
          color="warning"
          variant="flat"
          class="text-none"
          prepend-icon="ban"
          @click="viewing && disableCard(viewing); viewDrawer = false"
        >
          Disable
        </v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDiscard"
      title="Discard gift card changes?"
      message="You have unsaved changes to this gift card. Closing now will discard them."
      confirm-label="Discard changes"
      danger
      @confirm="issueDrawer = false"
    />

    <MpConfirmDialog
      v-model="confirmDelete"
      :title="bulkDelete ? 'Delete selected gift cards?' : 'Delete gift card?'"
      :message="deleteMessage"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.font-mono { font-family: monospace; white-space: nowrap; }
.min-width-0 { min-width: 0; }
.gift-preview {
  overflow: hidden;
  padding: var(--mp-component-card-padding);
  /* The card owns its internal rhythm — children carry no margins. */
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gapCompact);
}

.gift-preview__kicker {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
}

.gift-image-tile {
  width: 84px;
  height: 60px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-background));
  cursor: pointer;
  gap: 2px;
  padding: 4px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.gift-image-tile:hover { border-color: rgba(var(--v-theme-primary), 0.5); }
.gift-image-tile:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.gift-image-tile.selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary));
}
.gift-image-tile--art { color: rgb(var(--v-theme-on-primary)); }
.gift-image-tile--g0 { background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.85), rgba(var(--v-theme-secondary), 0.85)); }
.gift-image-tile--g1 { background: linear-gradient(135deg, rgba(var(--v-theme-secondary), 0.85), rgba(var(--v-theme-primary), 0.55)); }
.gift-image-tile--g2 { background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.6), rgba(var(--v-theme-secondary), 0.6)); }
.gift-image-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6rem !important;
}
</style>
