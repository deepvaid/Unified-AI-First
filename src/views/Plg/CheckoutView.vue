<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import Plg3dsDialog from '@/components/plg/Plg3dsDialog.vue'
import { useAccountsStore } from '@/stores/useAccounts'
import {
  usePlgStore,
  PLAN_CATALOG,
  ADD_ON_CATALOG,
  ANNUAL_DISCOUNT,
  planPrice,
  type PlgCloud,
  type PlanTier,
  type BillingCycle,
  type AddOnKey,
} from '@/stores/usePlg'

const route = useRoute()
const router = useRouter()
const plg = usePlgStore()
const accountsStore = useAccountsStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? accountsStore.activeId
})

const plansRoute = computed(() => ({ name: 'Plans', params: { accountId: accountId.value } }))

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
function money(n: number) {
  return currency.format(n)
}

// ── Parse + validate the Plans → Checkout query contract ──────────────────
// cycle: 'monthly' | 'annual'; one query param per cloud (marketing/commerce/
// service) whose value is a PlanTier; addons: comma-separated AddOnKey list.
const cycleParam = computed<BillingCycle>(() => (route.query.cycle === 'annual' ? 'annual' : 'monthly'))

const selections = computed<Partial<Record<PlgCloud, PlanTier>>>(() => {
  const out: Partial<Record<PlgCloud, PlanTier>> = {}
  for (const catalog of PLAN_CATALOG) {
    const raw = route.query[catalog.cloud]
    const tier = Array.isArray(raw) ? raw[0] : raw
    if (tier && catalog.plans.some(p => p.tier === tier)) {
      out[catalog.cloud] = tier as PlanTier
    }
  }
  return out
})

const addOns = computed<AddOnKey[]>(() => {
  const raw = route.query.addons
  const str = Array.isArray(raw) ? raw[0] : raw
  if (!str) return []
  return str
    .split(',')
    .filter((k): k is AddOnKey => ADD_ON_CATALOG.some(a => a.key === k && a.monthly !== null))
})

const hasValidSelections = computed(() => Object.keys(selections.value).length > 0)

const cloudLineItems = computed(() =>
  (Object.entries(selections.value) as [PlgCloud, PlanTier][]).map(([cloud, tier]) => {
    const catalog = PLAN_CATALOG.find(c => c.cloud === cloud)!
    const plan = catalog.plans.find(p => p.tier === tier)!
    return {
      cloud,
      label: `${catalog.name} — ${plan.name}`,
      price: planPrice(plan, cycleParam.value),
    }
  }),
)

const addOnLineItems = computed(() =>
  addOns.value.map((key) => {
    const def = ADD_ON_CATALOG.find(a => a.key === key)!
    const monthly = def.monthly ?? 0
    const price = cycleParam.value === 'annual' ? Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT)) : monthly
    return { key, label: def.name, price }
  }),
)

const total = computed(
  () =>
    cloudLineItems.value.reduce((sum, i) => sum + i.price, 0) +
    addOnLineItems.value.reduce((sum, i) => sum + i.price, 0),
)

// ── Mock payment fields (display only — nothing is submitted anywhere) ────
const cardholderName = ref('Alex Merchant')
const cardNumber = ref('4242 4242 4242 4242')
const expiry = ref('12/28')
const cvv = ref('•••')
const country = ref('United States')
const billingEmail = ref('billing@company.com')

// ── 3DS confirmation + provisioning ────────────────────────────────────────
const dialogOpen = ref(false)
const provisioning = ref(false)
const provisioningDone = ref(0)
const provisioningSteps = [
  'Confirming payment with Chargebee',
  'Updating your subscription',
  'Unlocking your new limits',
]

function pay() {
  if (!hasValidSelections.value) return
  dialogOpen.value = true
}

async function onApproved() {
  provisioning.value = true
  provisioningDone.value = 0
  for (let i = 0; i < provisioningSteps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 700))
    provisioningDone.value = i + 1
  }
  plg.activatePaidPlan({ selections: selections.value, cycle: cycleParam.value, addOns: addOns.value })
  router.push({ name: 'Dashboard', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="plg-checkout">
    <header class="plg-checkout__topbar">
      <div class="d-flex align-center">
        <span class="plg-checkout__wordmark">Maropost</span>
        <v-divider vertical class="mx-3 plg-checkout__divider" />
        <v-icon size="15" class="mr-1">lock</v-icon>
        <span class="text-body-2 text-medium-emphasis">Secure checkout</span>
      </div>
      <div class="text-caption text-medium-emphasis">Powered by Chargebee</div>
    </header>

    <main class="plg-checkout__main">
      <MpEmptyState
        v-if="!hasValidSelections"
        icon="shopping-cart"
        title="No plan selected"
        description="Choose a plan to continue to checkout."
        action-label="Back to plans"
        @action="router.push(plansRoute)"
      />

      <div v-else class="plg-checkout__grid">
        <v-card flat border rounded="lg" class="pa-5 plg-checkout__payment">
          <div class="text-body-1 font-weight-bold mb-4">Payment details</div>

          <v-row dense>
            <v-col cols="12">
              <v-text-field v-model="cardholderName" label="Cardholder name" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="cardNumber"
                label="Card number"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="credit-card"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="expiry" label="Expiry" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="cvv" label="CVV" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-select v-model="country" :items="['United States']" label="Country" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="billingEmail" label="Billing email" variant="outlined" density="comfortable" />
            </v-col>
          </v-row>

          <div class="plg-checkout__secure-note text-caption text-medium-emphasis d-flex align-center ga-2">
            <v-icon size="15">shield-check</v-icon>
            <span>Payments are processed securely by Chargebee. This is a demo — no charge will be made.</span>
          </div>

          <v-btn block color="primary" variant="flat" size="large" class="text-none mt-4" @click="pay">
            Pay {{ money(total) }}
          </v-btn>
        </v-card>

        <v-card flat border rounded="lg" class="pa-5 plg-checkout__summary">
          <div class="text-body-1 font-weight-bold mb-4">Order summary</div>

          <div v-for="item in cloudLineItems" :key="item.cloud" class="summary-line">
            <span>{{ item.label }}</span>
            <span class="num">{{ money(item.price) }}</span>
          </div>
          <div v-for="item in addOnLineItems" :key="item.key" class="summary-line">
            <span>{{ item.label }}</span>
            <span class="num">{{ money(item.price) }}</span>
          </div>

          <v-divider class="my-3" />

          <div class="summary-line summary-line--total">
            <span>Total due</span>
            <span class="num">{{ money(total) }}</span>
          </div>

          <div class="text-caption text-medium-emphasis mt-2">
            {{ cycleParam === 'annual' ? 'Billed annually until cancelled.' : 'Billed monthly until cancelled.' }}
          </div>

          <RouterLink :to="plansRoute" class="plg-checkout__back mt-4 d-inline-flex align-center text-body-2">
            &larr; Back to plans
          </RouterLink>
        </v-card>
      </div>
    </main>

    <div v-if="provisioning" class="plg-checkout__provisioning">
      <v-card flat rounded="lg" class="pa-6 provisioning-card">
        <div v-for="(step, i) in provisioningSteps" :key="step" class="provisioning-step">
          <v-progress-circular v-if="provisioningDone <= i" indeterminate size="20" width="2" color="primary" />
          <v-icon v-else color="success" size="20">circle-check</v-icon>
          <span :class="{ 'text-medium-emphasis': provisioningDone <= i }">{{ step }}</span>
        </div>
      </v-card>
    </div>

    <Plg3dsDialog
      v-model="dialogOpen"
      :amount-label="`Maropost purchase — ${money(total)}`"
      @approved="onApproved"
    />
  </div>
</template>

<style scoped>
.plg-checkout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-background));
  border-top: 3px solid rgb(var(--v-theme-primary));
}

.plg-checkout__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.plg-checkout__wordmark {
  font-size: 15px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.plg-checkout__divider {
  height: 16px;
}

.plg-checkout__main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 24px;
}

.plg-checkout__grid {
  width: 100%;
  max-width: 960px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 800px) {
  .plg-checkout__grid {
    grid-template-columns: 1fr;
  }
}

.plg-checkout__secure-note {
  margin-top: 8px;
  line-height: 1.4;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}

.summary-line--total {
  font-size: 15px;
  font-weight: 700;
}

.plg-checkout__back {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-decoration: none;
}

.plg-checkout__back:hover {
  text-decoration: underline;
}

.plg-checkout__provisioning {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.4);
  z-index: 2400;
}

.provisioning-card {
  width: 100%;
  max-width: 360px;
  background: rgb(var(--v-theme-surface));
}

.provisioning-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  font-size: 13.5px;
}

.provisioning-step + .provisioning-step {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
