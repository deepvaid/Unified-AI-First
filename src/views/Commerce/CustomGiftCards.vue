<script setup lang="ts">
import { ref, computed } from 'vue'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { useInitialLoad } from '@/composables/useInitialLoad'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFloatingBulkBar from '@/components/MpFloatingBulkBar.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])
const saveSnack = ref(false)
const { loading } = useInitialLoad()

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── Issue Gift Card drawer ───────────────────────────────────────
const issueDrawer = ref(false)

const blankCard = () => ({ name: '', email: '', amount: 50, expiry: '', deliveryDate: '', message: '', sendNow: true })
const form = ref(blankCard())

function issueGiftCard() {
  issueDrawer.value = false
  form.value = blankCard()
  saveSnack.value = true
}

// ── Filters ──────────────────────────────────────────────────────
const filters = ref({ status: null as string | null })
const filterOptions = { status: ['Active', 'Redeemed', 'Expired', 'Disabled'] }
const filterLabels: Record<string, string> = { status: 'Status' }

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` })),
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}
function clearAllFilters() {
  filters.value = { status: null }
}

const filteredCards = computed(() =>
  store.customGiftCards.filter(c => !filters.value.status || c.status === filters.value.status),
)

function selectAll() {
  selected.value = filteredCards.value.map(c => c.id)
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
  { title: 'Recipient', key: 'recipient', sortable: false, hideBelow: 'md' as const },
  { title: 'Initial value', key: 'initialValue', align: 'end' as const },
  { title: 'Balance', key: 'balance' },
  { title: 'Status', key: 'status' },
  { title: 'Issued', key: 'issued', hideBelow: 'lg' as const },
  { title: 'Expiry', key: 'expiry', hideBelow: 'lg' as const },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]
const { visibleHeaders } = useResponsiveTableHeaders(headers)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Custom Gift Cards" :subtitle="summary">
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="issueDrawer = true">Issue gift card</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Issued gift cards"
        search-placeholder="Search by code or recipient…"
        :active-filters="activeFilterEntries"
        :total-count="filteredCards.length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <v-select
              v-model="filters.status"
              label="Status"
              :items="filterOptions.status"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </div>
        </template>
      </MpDataTableToolbar>

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
              <div class="d-flex align-center gap-1">
                <span class="font-mono font-weight-bold text-body-2">{{ item.code }}</span>
                <v-tooltip text="Copy code" location="top">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="copy" variant="text" size="x-small" color="medium-emphasis" />
                  </template>
                </v-tooltip>
              </div>
              <div v-if="item.lastUsed" class="text-caption text-medium-emphasis">Last used {{ item.lastUsed }}</div>
              <div v-else class="text-caption text-medium-emphasis">Never used</div>
            </div>
          </div>
        </template>

        <template v-slot:item.recipient="{ item }">
          <div class="text-body-2 font-weight-medium">{{ item.recipient.name }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.recipient.email }}</div>
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
          <MpStatusChip :status="item.status" type="coupon" size="x-small" />
        </template>

        <template v-slot:item.issued="{ item }">
          <span class="text-body-2">{{ item.issued }}</span>
        </template>

        <template v-slot:item.expiry="{ item }">
          <span class="text-body-2">{{ item.expiry || 'Never' }}</span>
        </template>

        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-tooltip text="View" location="top"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="eye" variant="text" size="small" color="primary" /></template></v-tooltip>
            <v-tooltip text="Disable" location="top"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="ban" variant="text" size="small" /></template></v-tooltip>
            <v-tooltip text="Delete" location="top"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error" /></template></v-tooltip>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="gift"
            title="No gift cards issued yet"
            description="Issue store-credit gift cards to reward customers, resolve support cases, or run promotions."
            action-label="Issue gift card"
            action-icon="plus"
            @action="issueDrawer = true"
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
      <v-btn size="small" variant="flat" color="surface" class="text-none" prepend-icon="download" rounded="lg">Export</v-btn>
      <v-btn size="small" variant="flat" color="warning" class="text-none" prepend-icon="ban" rounded="lg">Disable</v-btn>
      <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg">Delete</v-btn>
    </MpFloatingBulkBar>

    <!-- ── Issue Gift Card drawer ──────────────────────────────── -->
    <MpFormDrawer
      v-model="issueDrawer"
      title="Issue gift card"
      subtitle="Create a store-credit card and send it to a recipient"
      :width="520"
    >
      <!-- Preview -->
      <v-card color="primary" variant="tonal" rounded="lg" class="pa-5 mb-5 gift-preview">
        <div class="d-flex align-center justify-space-between mb-4">
          <v-icon size="22">gift</v-icon>
          <span class="text-caption font-weight-bold text-uppercase" style="letter-spacing: 0.08em">Gift card</span>
        </div>
        <div class="text-h4 font-weight-bold mb-1">{{ money(Number(form.amount) || 0) }}</div>
        <div class="text-body-2 text-medium-emphasis">
          {{ form.name ? `For ${form.name}` : 'For your recipient' }}
        </div>
      </v-card>

      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Recipient</div>
      <v-text-field v-model="form.name" label="Recipient name" variant="outlined" density="comfortable" class="mb-3" />
      <v-text-field v-model="form.email" label="Recipient email" type="email" variant="outlined" density="comfortable" prepend-inner-icon="mail" class="mb-4" />

      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Value</div>
      <v-text-field
        v-model.number="form.amount"
        label="Amount ($)"
        type="number"
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="dollar-sign"
        class="mb-3"
      />
      <v-chip-group class="mb-4">
        <v-chip v-for="preset in [25, 50, 100, 200]" :key="preset" size="small" variant="outlined" @click="form.amount = preset">
          {{ money(preset) }}
        </v-chip>
      </v-chip-group>

      <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Delivery</div>
      <v-row dense class="mb-3">
        <v-col cols="6">
          <v-text-field v-model="form.deliveryDate" label="Delivery date" type="date" variant="outlined" density="comfortable" hide-details />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="form.expiry" label="Expiry date" type="date" variant="outlined" density="comfortable" hide-details />
        </v-col>
      </v-row>
      <v-textarea v-model="form.message" label="Personal message (optional)" variant="outlined" density="comfortable" rows="2" auto-grow class="mb-2" />
      <v-card variant="flat" border rounded="lg" class="pa-3">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-medium">Send email now</div>
            <div class="text-caption text-medium-emphasis">Deliver the gift card as soon as it's issued</div>
          </div>
          <v-switch v-model="form.sendNow" color="primary" hide-details density="compact" inset />
        </div>
      </v-card>

      <template #footer>
        <v-btn variant="text" class="text-none" @click="issueDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="text-none" prepend-icon="gift" :disabled="!form.name || !form.email || !form.amount" @click="issueGiftCard">
          Issue gift card
        </v-btn>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Gift card issued successfully</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.ActionButtons { opacity: 0; transition: opacity 0.2s; }
tr:hover .ActionButtons { opacity: 1; }
.font-mono { font-family: monospace; white-space: nowrap; }
.min-width-0 { min-width: 0; }
.gift-preview { overflow: hidden; }
</style>
