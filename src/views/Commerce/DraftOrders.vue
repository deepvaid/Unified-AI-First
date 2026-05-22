<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<number[]>([])
const saveSnack = ref(false)

// ── Create Draft Order Drawer ────────────────────────────────────
const createDrawer = ref(false)
const draftStep = ref(1)
const productSearch = ref('')

const draft = ref({
  customer: '',
  customerEmail: '',
  note: '',
  shippingMethod: 'Standard',
  discount: { type: 'None', value: 0, code: '' },
  items: [] as { id:number; name:string; sku:string; price:number; qty:number }[],
})

const catalogProducts = [
  { id:1, name:'Premium Wireless Headphones', sku:'WH-PRO-001', price:149.99, stock:42 },
  { id:2, name:'USB-C Hub 7-in-1',             sku:'HUB-7C-002', price:49.99,  stock:128 },
  { id:3, name:'Mechanical Keyboard MK700',    sku:'KB-MK7-003', price:129.00, stock:15 },
  { id:4, name:'27" 4K Monitor',               sku:'MON-4K-004', price:429.00, stock:8 },
  { id:5, name:'Ergonomic Office Chair',        sku:'CHR-ERG-005', price:349.00, stock:22 },
  { id:6, name:'Standing Desk 60"',             sku:'DSK-60-006', price:599.00, stock:5 },
]

const filteredCatalog = computed(() =>
  catalogProducts.filter(p => p.name.toLowerCase().includes(productSearch.value.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.value.toLowerCase()))
)

function addProduct(p: typeof catalogProducts[0]) {
  const existing = draft.value.items.find(i => i.id === p.id)
  if (existing) { existing.qty++ }
  else { draft.value.items.push({ id:p.id, name:p.name, sku:p.sku, price:p.price, qty:1 }) }
}
function removeItem(i: number) { draft.value.items.splice(i, 1) }

const subtotal = computed(() => draft.value.items.reduce((s,i) => s + i.price * i.qty, 0))
const discountAmt = computed(() => {
  if (draft.value.discount.type === 'Percentage') return subtotal.value * (draft.value.discount.value / 100)
  if (draft.value.discount.type === 'Fixed') return draft.value.discount.value
  return 0
})
const shipping = computed(() => ({ Standard:9.99, Express:24.99, Overnight:49.99, Free:0 })[draft.value.shippingMethod] ?? 0)
const total = computed(() => Math.max(0, subtotal.value - discountAmt.value) + shipping.value)

function saveDraft() {
  createDrawer.value = false
  saveSnack.value = true
  draft.value = { customer:'', customerEmail:'', note:'', shippingMethod:'Standard', discount:{type:'None',value:0,code:''}, items:[] }
  draftStep.value = 1
}

// ── Filters ──────────────────────────────────────────────────────
const filters = ref({
  status: [] as string[],
})

const filterOptions = {
  status: ['Draft', 'Invoice Sent', 'Completed'],
}

const filterLabels: Record<string, string> = {
  status: 'Status',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => Array.isArray(v) ? v.length > 0 : v !== null)
    .map(([key, value]) => ({
      key,
      label: `${filterLabels[key]}: ${Array.isArray(value) ? value.join(', ') : value}`
    }))
)

function removeFilter(key: string) {
  const val = filters.value[key as keyof typeof filters.value]
  ;(filters.value as any)[key] = Array.isArray(val) ? [] : null
}

function clearAllFilters() {
  filters.value.status = []
}

function selectAll() {
  selected.value = (store.draftOrders ?? []).map((_: any, i: number) => i)
}

// Table
const headers = [
  { title: 'Order', key: 'draftNumber', sortable: true },
  { title: 'Customer', key: 'customer' },
  { title: 'Items', key: 'items' },
  { title: 'Total', key: 'total', align:'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'createdAt' },
  { title: '', key: 'actions', align:'end' as const, sortable:false },
]
const statusColor = (s: string) => ({Open:'primary','Invoice Sent':'success'})[s as string] ?? 'default'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Draft Orders"
      :subtitle="`${store.draftOrders?.length ?? 0} drafts · Create manual orders on behalf of customers`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="createDrawer=true;draftStep=1">Create Draft Order</v-btn>
      </template>
    </MpPageHeader>

    <!-- Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Draft Orders"
        :active-filters="activeFilterEntries"
        :selected-count="selected.length"
        :total-count="(store.draftOrders ?? []).length"
        @remove-filter="removeFilter"
        @clear-filters="clearAllFilters"
        @clear-selection="selected = []"
        @select-all="selectAll"
      >
        <template #filter-content>
          <div class="pa-4 pb-2">
            <div class="text-subtitle-2 font-weight-bold mb-3">Filter by</div>
            <div v-for="(options, key) in filterOptions" :key="key" class="mb-3">
              <v-select
                v-model="filters[key as keyof typeof filters]"
                :label="filterLabels[key]"
                :items="options"
                multiple
                chips
                closable-chips
                clearable
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>
          </div>
        </template>
        <template #bulk-actions>
          <v-btn size="small" variant="flat" color="primary" class="text-none" prepend-icon="send" rounded="lg">Send Invoice</v-btn>
          <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg">Delete Drafts</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="store.draftOrders ?? []"
        :search="search"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.draftNumber="{ item }">
          <span class="font-weight-bold text-primary">{{ (item as any).draftNumber }}</span>
        </template>
        <template v-slot:item.customer="{ item }">
          <div class="py-1">
            <div class="text-body-2 font-weight-medium">{{ (item as any).customer ?? 'Guest' }}</div>
            <div class="text-caption text-medium-emphasis">{{ (item as any).email ?? '—' }}</div>
          </div>
        </template>
        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold">${{ parseFloat((item as any).total || '0').toFixed(2) }}</span>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="statusColor((item as any).status ?? 'Open')" size="x-small" variant="flat">{{ (item as any).status ?? 'Open' }}</v-chip>
        </template>
        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-tooltip text="Edit order" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="pencil" variant="text" size="small" color="primary"></v-btn></template></v-tooltip>
            <v-tooltip text="Send invoice" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="send" variant="text" size="small"></v-btn></template></v-tooltip>
            <v-tooltip text="Delete" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error"></v-btn></template></v-tooltip>
          </div>
        </template>
        <template v-slot:no-data>
          <div class="d-flex flex-column align-center justify-center pa-12">
            <v-icon size="64" color="medium-emphasis" class="mb-4">shopping-cart</v-icon>
            <div class="text-h6 font-weight-medium mb-2">No draft orders yet</div>
            <div class="text-body-2 text-medium-emphasis mb-5">Create a manual order for a customer or wholesale buyer.</div>
            <v-btn color="primary" variant="elevated" prepend-icon="plus" class="text-none" @click="createDrawer=true">Create First Draft</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Create Draft Order Drawer (3-step) ────────────────────── -->
    <v-navigation-drawer v-model="createDrawer" location="right" temporary :width="560" elevation="4">
      <div class="d-flex flex-column h-100">
        <!-- Drawer Header -->
        <div class="pa-5 border-b d-flex align-center justify-space-between" style="flex-shrink:0;">
          <div>
            <div class="text-h6 font-weight-bold">Create Draft Order</div>
            <div class="text-caption text-medium-emphasis">Step {{ draftStep }} of 3 · {{ draftStep===1?'Add products':draftStep===2?'Customer & shipping':'Review & send' }}</div>
          </div>
          <v-btn icon="x" variant="text" size="small" @click="createDrawer=false"></v-btn>
        </div>
        <v-progress-linear :model-value="(draftStep/3)*100" color="primary" height="2"></v-progress-linear>

        <!-- Step 1: Products ────────────────────────────────────── -->
        <div v-if="draftStep===1" class="d-flex flex-column flex-grow-1 overflow-hidden">
          <div class="pa-4 border-b" style="flex-shrink:0;">
            <v-text-field v-model="productSearch" prepend-inner-icon="search" placeholder="Search products by name or SKU…"
              variant="outlined" density="compact" hide-details></v-text-field>
          </div>
          <div class="flex-grow-1 overflow-y-auto pa-4">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Product Catalog</div>
            <v-list density="compact" rounded="xl" nav class="pa-0">
              <v-list-item v-for="p in filteredCatalog" :key="p.id" class="mb-2 border rounded-xl px-4" style="min-height:64px;">
                <template v-slot:prepend>
                  <v-avatar color="surface-variant" variant="flat" size="40" rounded="lg" class="mr-3">
                    <v-icon color="primary">package</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ p.name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ p.sku }} · {{ p.stock }} in stock</v-list-item-subtitle>
                <template v-slot:append>
                  <div class="d-flex align-center gap-3">
                    <span class="font-weight-bold text-body-2">${{ p.price.toFixed(2) }}</span>
                    <v-btn icon="plus" variant="tonal" color="primary" size="small" @click="addProduct(p)"></v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Cart summary -->
          <div class="border-t pa-4" style="flex-shrink:0;">
            <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">Cart ({{ draft.items.length }} items)</div>
            <div v-if="draft.items.length===0" class="text-caption text-medium-emphasis pa-3 text-center rounded-lg" style="background:rgba(var(--v-theme-surface-variant),1);">
              No products added yet
            </div>
            <div v-else class="d-flex flex-column gap-2 mb-3">
              <div v-for="(item,i) in draft.items" :key="item.id" class="d-flex align-center gap-3">
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">${{ item.price.toFixed(2) }} each</div>
                </div>
                <div class="d-flex align-center gap-1">
                  <v-btn icon="minus" variant="text" size="x-small" @click="item.qty>1?item.qty--:removeItem(i)"></v-btn>
                  <span class="text-body-2 font-weight-bold" style="min-width:24px;text-align:center;">{{ item.qty }}</span>
                  <v-btn icon="plus" variant="text" size="x-small" @click="item.qty++"></v-btn>
                </div>
                <span class="font-weight-bold text-body-2" style="min-width:60px;text-align:right;">${{ (item.price*item.qty).toFixed(2) }}</span>
              </div>
            </div>
            <div class="d-flex justify-space-between font-weight-bold text-body-1 pt-2 border-t">
              <span>Subtotal</span><span>${{ subtotal.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Customer & Shipping ─────────────────────────── -->
        <div v-else-if="draftStep===2" class="pa-5 flex-grow-1 overflow-y-auto">
          <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Customer</div>
          <v-text-field v-model="draft.customer" label="Customer Name *" variant="outlined" density="comfortable" class="mb-3" prepend-inner-icon="user"></v-text-field>
          <v-text-field v-model="draft.customerEmail" label="Email Address *" type="email" variant="outlined" density="comfortable" class="mb-5" prepend-inner-icon="mail"></v-text-field>

          <v-divider class="mb-5"></v-divider>
          <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Shipping</div>
          <v-radio-group v-model="draft.shippingMethod" density="compact" class="mb-4">
            <v-card v-for="opt in [{val:'Standard',label:'Standard Shipping',eta:'5–7 business days',price:9.99},{val:'Express',label:'Express Shipping',eta:'2–3 business days',price:24.99},{val:'Overnight',label:'Overnight',eta:'Next business day',price:49.99},{val:'Free',label:'Free Shipping',eta:'7–10 business days',price:0}]"
              :key="opt.val" :variant="draft.shippingMethod===opt.val?'tonal':'outlined'" :color="draft.shippingMethod===opt.val?'primary':'default'"
              rounded="lg" class="pa-3 mb-2 cursor-pointer" @click="draft.shippingMethod=opt.val">
              <div class="d-flex align-center gap-3">
                <v-radio :value="opt.val" hide-details density="compact" color="primary"></v-radio>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">{{ opt.label }}</div>
                  <div class="text-caption text-medium-emphasis">{{ opt.eta }}</div>
                </div>
                <span class="font-weight-bold text-body-2">{{ opt.price===0?'Free':`$${opt.price.toFixed(2)}` }}</span>
              </div>
            </v-card>
          </v-radio-group>

          <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Discount</div>
          <div class="d-flex gap-3">
            <v-select v-model="draft.discount.type" label="Type" :items="['None','Percentage','Fixed']" variant="outlined" density="comfortable" style="max-width:140px;flex-shrink:0;"></v-select>
            <v-text-field v-if="draft.discount.type!=='None'" v-model.number="draft.discount.value"
              :label="draft.discount.type==='Percentage'?'Percent (%)':'Amount ($)'"
              type="number" variant="outlined" density="comfortable"></v-text-field>
          </div>
        </div>

        <!-- Step 3: Review ─────────────────────────────────────── -->
        <div v-else class="pa-5 flex-grow-1 overflow-y-auto">
          <div class="text-subtitle-2 font-weight-bold mb-4 text-uppercase text-medium-emphasis">Order Summary</div>
          <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
            <div class="d-flex justify-space-between text-body-2 mb-2"><span class="text-medium-emphasis">Customer</span><span class="font-weight-medium">{{ draft.customer || '—' }}</span></div>
            <div class="d-flex justify-space-between text-body-2 mb-2"><span class="text-medium-emphasis">Email</span><span>{{ draft.customerEmail || '—' }}</span></div>
            <div class="d-flex justify-space-between text-body-2"><span class="text-medium-emphasis">Shipping</span><span>{{ draft.shippingMethod }}</span></div>
          </v-card>
          <div class="d-flex flex-column gap-2 mb-4">
            <div v-for="item in draft.items" :key="item.id" class="d-flex justify-space-between text-body-2">
              <span>{{ item.name }} × {{ item.qty }}</span>
              <span class="font-weight-medium">${{ (item.price*item.qty).toFixed(2) }}</span>
            </div>
          </div>
          <v-divider class="mb-3"></v-divider>
          <div class="d-flex justify-space-between text-body-2 mb-1"><span class="text-medium-emphasis">Subtotal</span><span>${{ subtotal.toFixed(2) }}</span></div>
          <div v-if="discountAmt>0" class="d-flex justify-space-between text-body-2 mb-1 text-success"><span>Discount</span><span>−${{ discountAmt.toFixed(2) }}</span></div>
          <div class="d-flex justify-space-between text-body-2 mb-3"><span class="text-medium-emphasis">Shipping</span><span>{{ shipping===0?'Free':`$${shipping.toFixed(2)}` }}</span></div>
          <div class="d-flex justify-space-between font-weight-bold text-body-1 border-t pt-3"><span>Total</span><span>${{ total.toFixed(2) }}</span></div>

          <v-textarea v-model="draft.note" label="Internal note" variant="outlined" density="comfortable" rows="2" class="mt-4" placeholder="Add a note for your team…"></v-textarea>
        </div>

        <!-- Footer -->
        <div class="pa-5 border-t d-flex justify-space-between align-center" style="flex-shrink:0;">
          <v-btn variant="text" class="text-none" @click="draftStep>1?draftStep--:createDrawer=false">{{ draftStep===1?'Cancel':'← Back' }}</v-btn>
          <div class="d-flex gap-2">
            <v-btn v-if="draftStep===3" variant="flat" color="primary" class="text-none" @click="saveDraft">Save Draft</v-btn>
            <v-btn v-if="draftStep<3" color="primary" variant="elevated" class="text-none" :disabled="draftStep===1&&draft.items.length===0" @click="draftStep++">Continue →</v-btn>
            <v-btn v-else color="success" variant="elevated" class="text-none" prepend-icon="send" @click="saveDraft">Send Invoice</v-btn>
          </div>
        </div>
      </div>
    </v-navigation-drawer>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Draft order saved</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.ActionButtons { opacity: 0; transition: opacity 0.2s ease; }
tr:hover .ActionButtons { opacity: 1; }
</style>
