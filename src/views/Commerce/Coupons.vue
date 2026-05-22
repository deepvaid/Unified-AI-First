<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCommerceStore } from '@/stores/useCommerce'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const store = useCommerceStore()
const search = ref('')
const selected = ref<string[]>([])
const saveSnack = ref(false)

// ── Create Coupon Wizard ─────────────────────────────────────────
const createDialog = ref(false)
const step = ref(1)

const coupon = ref({
  code: '', type: 'Percentage', value: 20, minOrder: 50,
  limit: 500, expiry: '', applyTo: 'All products',
  stackable: false, firstOrderOnly: false, autoApply: false,
  description: '',
})

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  coupon.value.code = Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join('')
}

function saveCoupon() {
  createDialog.value = false
  step.value = 1
  saveSnack.value = true
  coupon.value = { code:'', type:'Percentage', value:20, minOrder:50, limit:500, expiry:'', applyTo:'All products', stackable:false, firstOrderOnly:false, autoApply:false, description:'' }
}

const discountPreview = computed(() => {
  if (coupon.value.type === 'Free Shipping') return 'Free Shipping'
  if (coupon.value.type === 'Percentage') return `${coupon.value.value}% off`
  return `$${coupon.value.value} off`
})

// ── Filters ──────────────────────────────────────────────────────
const filters = ref({
  status: null as string | null,
  type: null as string | null,
})

const filterOptions = {
  status: ['Active', 'Expired', 'Maxed Out'],
  type: ['Percentage', 'Fixed Amount', 'Free Shipping'],
}

const filterLabels: Record<string, string> = {
  status: 'Status',
  type: 'Discount Type',
}

const activeFilterEntries = computed(() =>
  Object.entries(filters.value)
    .filter(([, v]) => v !== null)
    .map(([key, value]) => ({ key, label: `${filterLabels[key]}: ${value}` }))
)

function removeFilter(key: string) {
  filters.value[key as keyof typeof filters.value] = null
}

function clearAllFilters() {
  filters.value = { status: null, type: null }
}

function selectAll() {
  selected.value = store.coupons.map((c: any) => c.id ?? c.code)
}

// ── Table ────────────────────────────────────────────────────────
const headers = [
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Discount', key: 'value' },
  { title: 'Min. Order', key: 'minOrder' },
  { title: 'Usage', key: 'usage' },
  { title: 'Limit', key: 'limit' },
  { title: 'Expiry', key: 'expiry' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]

const statusColor = (s: string) => ({ Active:'success', Expired:'error', 'Maxed Out':'warning' })[s as string] ?? 'default'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Coupons & Discounts"
      :subtitle="`${store.coupons.filter(c => c.status==='Active').length} active codes · ${store.coupons.reduce((a,c)=>a+c.usage,0).toLocaleString()} total uses`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="download" class="text-none" color="surface">Export</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="createDialog=true;step=1">Create Coupon</v-btn>
      </template>
    </MpPageHeader>

    <!-- Table Card -->
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All Coupons"
        :active-filters="activeFilterEntries"
        :selected-count="selected.length"
        :total-count="store.coupons.length"
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
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </div>
          </div>
        </template>
        <template #bulk-actions>
          <v-btn size="small" variant="flat" color="warning" class="text-none" prepend-icon="pause" rounded="lg">Deactivate</v-btn>
          <v-btn size="small" variant="flat" color="error" class="text-none" prepend-icon="trash-2" rounded="lg">Delete</v-btn>
        </template>
      </MpDataTableToolbar>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="store.coupons"
        :search="search"
        show-select
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.code="{ item }">
          <div class="d-flex align-center gap-2">
            <v-chip variant="outlined" color="secondary" size="small" class="font-weight-bold font-mono">{{ item.code }}</v-chip>
            <v-tooltip text="Copy code" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="copy" variant="text" size="x-small" color="medium-emphasis"></v-btn></template></v-tooltip>
          </div>
        </template>
        <template v-slot:item.value="{ item }">
          <span class="font-weight-bold">{{ item.type==='Free Shipping'?'Free Shipping':item.type==='Percentage'?`${item.value}% off`:`$${item.value} off` }}</span>
          <div class="text-caption text-medium-emphasis">{{ item.type }}</div>
        </template>
        <template v-slot:item.minOrder="{ item }">
          <span class="text-body-2">{{ item.minOrder>0?`$${item.minOrder}`:'No minimum' }}</span>
        </template>
        <template v-slot:item.usage="{ item }">
          <div>
            <span class="font-weight-bold text-body-2">{{ item.usage.toLocaleString() }}</span>
            <v-progress-linear v-if="item.limit" :model-value="(item.usage/item.limit)*100"
              :color="item.usage/item.limit>0.9?'error':'primary'" height="4" rounded class="mt-1"></v-progress-linear>
          </div>
        </template>
        <template v-slot:item.limit="{ item }"><span class="text-body-2">{{ item.limit?item.limit.toLocaleString():'∞ Unlimited' }}</span></template>
        <template v-slot:item.expiry="{ item }"><span class="text-body-2">{{ item.expiry||'Never' }}</span></template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="x-small" variant="flat">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.actions>
          <div class="ActionButtons d-flex justify-end gap-1">
            <v-tooltip text="Edit" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="pencil" variant="text" size="small" color="primary"></v-btn></template></v-tooltip>
            <v-tooltip text="Duplicate" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="copy" variant="text" size="small"></v-btn></template></v-tooltip>
            <v-tooltip text="Delete" location="top"><template v-slot:activator="{props}"><v-btn v-bind="props" icon="trash-2" variant="text" size="small" color="error"></v-btn></template></v-tooltip>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="tag"
            title="No coupons yet"
            description="Create discount codes to reward loyal customers and drive repeat purchases."
            action-label="Create Coupon"
            action-icon="plus"
            @action="createDialog = true; step = 1"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Create Coupon Wizard Drawer ──────────────────────────── -->
    <MpFormDrawer
      v-model="createDialog"
      title="Create Coupon Code"
      :subtitle="`Step ${step} of 3`"
      :width="700"
    >
      <!-- Progress -->
      <v-progress-linear :model-value="(step/3)*100" color="primary" height="3" rounded class="mb-4"></v-progress-linear>

      <!-- Step 1: Code & Discount -->
      <div v-if="step===1" class="pa-1">
          <div class="text-subtitle-2 font-weight-bold mb-4 text-uppercase text-medium-emphasis">Coupon Code</div>
          <div class="d-flex gap-3 mb-5">
            <v-text-field v-model="coupon.code" label="Coupon Code" variant="outlined" density="comfortable"
              placeholder="e.g. SUMMER20" class="flex-grow-1" hint="Leave blank to auto-generate" persistent-hint></v-text-field>
            <v-btn variant="flat" color="primary" class="text-none mt-1 coupon-code-btn" prepend-icon="refresh-cw" @click="generateCode">Auto-Generate</v-btn>
          </div>
          <div class="text-subtitle-2 font-weight-bold mb-3 text-uppercase text-medium-emphasis">Discount Type</div>
          <v-row dense class="mb-4">
            <v-col v-for="t in [{val:'Percentage',icon:'percent',label:'Percentage Off'},{val:'Fixed Amount',icon:'dollar-sign',label:'Fixed $ Amount'},{val:'Free Shipping',icon:'truck',label:'Free Shipping'}]" :key="t.val" cols="4">
              <v-card @click="coupon.type=t.val" :variant="coupon.type===t.val?'tonal':'outlined'" :color="coupon.type===t.val?'primary':'default'"
                rounded="lg" class="pa-4 text-center cursor-pointer type-card" :class="{selected:coupon.type===t.val}">
                <v-icon :color="coupon.type===t.val?'primary':'medium-emphasis'" size="28" class="mb-2">{{ t.icon }}</v-icon>
                <div class="text-body-2 font-weight-medium">{{ t.label }}</div>
              </v-card>
            </v-col>
          </v-row>
          <v-text-field v-if="coupon.type!=='Free Shipping'" v-model.number="coupon.value"
            :label="coupon.type==='Percentage'?'Discount Percentage (%)':'Discount Amount ($)'"
            type="number" variant="outlined" density="comfortable"></v-text-field>
        </div>

        <!-- Step 2: Rules & Restrictions -->
      <div v-else-if="step===2" class="pa-1">
          <div class="text-subtitle-2 font-weight-bold mb-4 text-uppercase text-medium-emphasis">Usage Rules</div>
          <v-row dense class="mb-4">
            <v-col cols="6">
              <v-text-field v-model.number="coupon.minOrder" label="Minimum Order Value ($)" type="number" variant="outlined" density="comfortable" hint="Set 0 for no minimum" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="coupon.limit" label="Total Usage Limit" type="number" variant="outlined" density="comfortable" hint="Leave 0 for unlimited" persistent-hint></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="coupon.expiry" label="Expiry Date" type="date" variant="outlined" density="comfortable"></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-select v-model="coupon.applyTo" label="Applies To" :items="['All products','Specific collections','Specific products']" variant="outlined" density="comfortable"></v-select>
            </v-col>
          </v-row>
          <v-divider class="mb-4"></v-divider>
          <div class="text-subtitle-2 font-weight-bold mb-3">Behaviour Flags</div>
          <div class="d-flex flex-column gap-2">
            <v-card variant="flat" border rounded="lg" class="pa-3">
              <div class="d-flex align-center justify-space-between">
                <div><div class="text-body-2 font-weight-medium">First order only</div><div class="text-caption text-medium-emphasis">Only valid for a customer's first purchase</div></div>
                <v-switch v-model="coupon.firstOrderOnly" color="primary" hide-details density="compact" inset></v-switch>
              </div>
            </v-card>
            <v-card variant="flat" border rounded="lg" class="pa-3">
              <div class="d-flex align-center justify-space-between">
                <div><div class="text-body-2 font-weight-medium">Stackable</div><div class="text-caption text-medium-emphasis">Can be combined with other discount codes</div></div>
                <v-switch v-model="coupon.stackable" color="primary" hide-details density="compact" inset></v-switch>
              </div>
            </v-card>
            <v-card variant="flat" border rounded="lg" class="pa-3">
              <div class="d-flex align-center justify-space-between">
                <div><div class="text-body-2 font-weight-medium">Auto-apply at checkout</div><div class="text-caption text-medium-emphasis">Automatically apply without customer entering code</div></div>
                <v-switch v-model="coupon.autoApply" color="primary" hide-details density="compact" inset></v-switch>
              </div>
            </v-card>
          </div>
        </div>

        <!-- Step 3: Preview & Confirm -->
      <div v-else class="pa-1">
          <div class="text-subtitle-2 font-weight-bold mb-4 text-uppercase text-medium-emphasis">Review & Confirm</div>

          <!-- Preview card -->
          <v-card color="primary" variant="tonal" rounded="lg" class="pa-5 mb-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-h6 font-weight-bold text-primary">{{ coupon.code || 'AUTO-GENERATED' }}</div>
              <v-chip color="success" variant="flat" size="small">Active</v-chip>
            </div>
            <div class="text-h4 font-weight-bold mb-2">{{ discountPreview }}</div>
            <div class="d-flex gap-4 text-body-2 text-medium-emphasis flex-wrap">
              <span v-if="coupon.minOrder>0">Min. ${{ coupon.minOrder }} order</span>
              <span v-if="coupon.limit>0">Limit: {{ coupon.limit }} uses</span>
              <span v-if="coupon.expiry">Expires: {{ coupon.expiry }}</span>
              <span v-if="coupon.firstOrderOnly">First order only</span>
              <span v-if="coupon.stackable">Stackable</span>
            </div>
          </v-card>

          <v-textarea v-model="coupon.description" label="Internal note (optional)" variant="outlined" density="comfortable" rows="2" placeholder="Add a note for your team about what this coupon is for…"></v-textarea>
        </div>

      <template #footer>
        <div class="w-100 d-flex justify-space-between align-center">
          <v-btn variant="text" class="text-none" @click="step>1?step--:createDialog=false">{{ step===1?'Cancel':'← Back' }}</v-btn>
          <v-btn v-if="step<3" color="primary" variant="elevated" class="text-none" :disabled="step===1&&!coupon.type" @click="step++">Continue →</v-btn>
          <v-btn v-else color="success" variant="elevated" class="text-none" prepend-icon="check" @click="saveCoupon">Create Coupon</v-btn>
        </div>
      </template>
    </MpFormDrawer>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Coupon created successfully</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.ActionButtons { opacity: 0; transition: opacity 0.2s; }
tr:hover .ActionButtons { opacity: 1; }
.font-mono { font-family: monospace; }
.type-card { transition: all 0.15s; cursor:pointer; }
.type-card:hover { border-color: rgb(var(--v-theme-primary)); }
.type-card.selected { border-color: rgb(var(--v-theme-primary)); }
.coupon-code-btn { height: 56px; }
</style>
