<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useAccountsStore } from '@/stores/useAccounts'
import {
  usePlgStore,
  PLAN_CATALOG,
  ADD_ON_CATALOG,
  ANNUAL_DISCOUNT,
  planPrice,
  type PlgCloud,
  type PlanTier,
  type PlanDef,
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

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
function money(n: number) {
  return currency.format(n)
}

// ── Cycle + cloud selection ────────────────────────────────────────────────
const cycle = ref<BillingCycle>('monthly')
const cloudKey = ref<PlgCloud>(PLAN_CATALOG[0]!.cloud)

const tabs = computed(() => PLAN_CATALOG.map(c => ({ label: c.name, key: c.cloud })))
const activeCatalog = computed(() => PLAN_CATALOG.find(c => c.cloud === cloudKey.value)!)

function currentTierFor(cloud: PlgCloud): PlanTier | undefined {
  return plg.active.mode === 'paid' ? plg.active.tiers[cloud] : undefined
}

function badgeColor(badge: string) {
  return badge === 'Most popular' ? 'primary' : 'default'
}

function effectiveMonthly(plan: PlanDef) {
  return cycle.value === 'annual' ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly
}

// ── Cart state (local — nothing persisted until checkout) ─────────────────
const selections = reactive<Partial<Record<PlgCloud, PlanTier>>>({})
const selectedAddOns = reactive<Set<AddOnKey>>(new Set())

function selectTier(cloud: PlgCloud, tier: PlanTier) {
  if (selections[cloud] === tier) delete selections[cloud]
  else selections[cloud] = tier
}

function toggleAddOn(key: AddOnKey) {
  if (selectedAddOns.has(key)) selectedAddOns.delete(key)
  else selectedAddOns.add(key)
}

function addOnCyclePrice(monthly: number) {
  return cycle.value === 'annual' ? Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT)) : monthly
}

// ── Order summary ───────────────────────────────────────────────────────────
const cloudLineItems = computed(() =>
  (Object.entries(selections) as [PlgCloud, PlanTier][]).map(([cloud, tier]) => {
    const catalog = PLAN_CATALOG.find(c => c.cloud === cloud)!
    const plan = catalog.plans.find(p => p.tier === tier)!
    return {
      cloud,
      label: `${catalog.name} — ${plan.name}`,
      price: planPrice(plan, cycle.value),
    }
  }),
)

const addOnLineItems = computed(() =>
  [...selectedAddOns].map((key) => {
    const def = ADD_ON_CATALOG.find(a => a.key === key)!
    return {
      key,
      label: def.name,
      price: addOnCyclePrice(def.monthly ?? 0),
    }
  }),
)

const hasSelections = computed(() => cloudLineItems.value.length > 0)

const total = computed(
  () =>
    cloudLineItems.value.reduce((sum, i) => sum + i.price, 0) +
    addOnLineItems.value.reduce((sum, i) => sum + i.price, 0),
)

function continueToCheckout() {
  if (!hasSelections.value) return
  const query: Record<string, string> = { cycle: cycle.value }
  for (const [cloud, tier] of Object.entries(selections)) {
    if (tier) query[cloud] = tier
  }
  if (selectedAddOns.size) query.addons = [...selectedAddOns].join(',')
  router.push({ name: 'Checkout', params: { accountId: accountId.value }, query })
}

// ── Prototype snackbar (Talk to sales / ticket / enterprise CTAs) ──────────
const snackbar = ref(false)
const snackText = ref('')
function notify(text: string) {
  snackText.value = text
  snackbar.value = true
}
function talkToSales() {
  notify('Our team will reach out.')
}
</script>

<template>
  <div class="plans-view">
    <MpPageHeader
      title="Subscription plans"
      subtitle="Choose the tools and plan that fit your business today — upgrade anytime as you grow."
    >
      <template #actions>
        <div class="d-flex align-center ga-3">
          <v-btn-toggle v-model="cycle" mandatory density="comfortable" color="primary" class="plans-cycle-toggle">
            <v-btn value="monthly" class="text-none">Monthly</v-btn>
            <v-btn value="annual" class="text-none">Annual</v-btn>
          </v-btn-toggle>
          <v-chip size="small" color="success" variant="tonal">Save 10% annually</v-chip>
        </div>
      </template>
    </MpPageHeader>

    <MpFilterTabs v-model="cloudKey" :tabs="tabs" aria-label="Plan clouds" />

    <v-row>
      <!-- Main column -->
      <v-col cols="12" lg="8">
        <div class="cloud-header d-flex align-center ga-3 mb-4">
          <v-avatar color="primary" variant="tonal" size="44" rounded="lg" class="flex-shrink-0">
            <v-icon size="22">{{ activeCatalog.icon }}</v-icon>
          </v-avatar>
          <div class="min-width-0">
            <div class="cloud-header__name">{{ activeCatalog.name }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ activeCatalog.tagline }}</div>
          </div>
        </div>

        <div class="plan-grid">
            <v-card
              v-for="plan in activeCatalog.plans"
              :key="plan.tier"
              flat
              border
              rounded="lg"
              class="plan-card d-flex flex-column"
              :class="{ 'plan-card--current': currentTierFor(cloudKey) === plan.tier }"
            >
              <div v-if="currentTierFor(cloudKey) === plan.tier" class="plan-card__ribbon">Current plan</div>

              <div class="plan-card__body flex-grow-1">
                <v-chip size="small" :color="badgeColor(plan.badge)" variant="tonal" class="mb-3">
                  {{ plan.badge }}
                </v-chip>

                <div class="plan-card__name">{{ plan.name }}</div>

                <div class="plan-card__price">
                  {{ money(effectiveMonthly(plan)) }}<span class="plan-card__unit">/mo</span>
                </div>
                <div v-if="cycle === 'annual'" class="plan-card__caption">billed annually</div>

                <v-divider class="my-3" />

                <ul class="plan-card__features">
                  <li v-for="f in plan.features" :key="f.label" :class="{ 'plan-card__feature--excluded': !f.included }">
                    <v-icon size="16" :color="f.included ? 'success' : undefined">{{ f.included ? 'check' : 'minus' }}</v-icon>
                    <span>{{ f.label }}</span>
                  </li>
                </ul>
              </div>

              <div class="plan-card__footer">
                <v-btn
                  v-if="currentTierFor(cloudKey) === plan.tier"
                  variant="tonal"
                  color="primary"
                  block
                  disabled
                  class="text-none"
                >
                  Current plan
                </v-btn>
                <v-btn
                  v-else-if="plan.tier === 'enterprise'"
                  variant="outlined"
                  color="primary"
                  block
                  class="text-none"
                  @click="talkToSales"
                >
                  Talk to Sales
                </v-btn>
                <v-btn
                  v-else
                  :variant="selections[cloudKey] === plan.tier ? 'tonal' : 'flat'"
                  color="primary"
                  block
                  class="text-none"
                  @click="selectTier(cloudKey, plan.tier)"
                >
                  {{ selections[cloudKey] === plan.tier ? 'Selected' : 'Select plan' }}
                </v-btn>
              </div>
            </v-card>
        </div>

        <v-card flat border rounded="lg" class="pa-4 mt-6">
          <MpSectionHeader title="Add-ons" />
          <div class="addon-list">
            <div v-for="addOn in ADD_ON_CATALOG" :key="addOn.key" class="addon-row">
              <v-avatar color="primary" variant="tonal" size="38" rounded="lg" class="flex-shrink-0">
                <v-icon size="18">{{ addOn.icon }}</v-icon>
              </v-avatar>
              <div class="addon-row__copy min-width-0 flex-grow-1">
                <div class="addon-row__name">{{ addOn.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ addOn.description }}</div>
              </div>
              <div class="addon-row__action flex-shrink-0">
                <v-btn
                  v-if="addOn.monthly === null"
                  variant="outlined"
                  size="small"
                  color="primary"
                  class="text-none"
                  @click="talkToSales"
                >
                  Talk to sales
                </v-btn>
                <v-chip v-else-if="plg.active.addOns.includes(addOn.key)" size="small" color="success" variant="tonal">
                  Active
                </v-chip>
                <div v-else class="d-flex align-center ga-3">
                  <span class="text-caption text-medium-emphasis">{{ money(addOn.monthly) }}/mo</span>
                  <v-btn
                    :variant="selectedAddOns.has(addOn.key) ? 'tonal' : 'outlined'"
                    :color="selectedAddOns.has(addOn.key) ? 'primary' : undefined"
                    size="small"
                    class="text-none"
                    @click="toggleAddOn(addOn.key)"
                  >
                    {{ selectedAddOns.has(addOn.key) ? 'Added' : '+ Add' }}
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Order summary rail -->
      <v-col cols="12" lg="4">
        <div class="plans-rail">
          <v-card flat border rounded="lg" class="pa-4 mb-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-body-2 font-weight-bold">Order summary</div>
              <v-chip size="small" variant="tonal">
                {{ cycle === 'annual' ? 'Billed annually' : 'Billed monthly' }}
              </v-chip>
            </div>

            <div v-if="!hasSelections" class="plans-summary__empty text-medium-emphasis text-body-2">
              Products you choose will appear here.
            </div>

            <template v-else>
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
                Prices shown are exclusive of applicable taxes.
              </div>
            </template>

            <v-btn
              block
              color="primary"
              variant="flat"
              class="text-none mt-4"
              :disabled="!hasSelections"
              @click="continueToCheckout"
            >
              Continue to checkout
            </v-btn>
          </v-card>

          <v-card flat border rounded="lg" class="pa-4">
            <div class="text-body-2 font-weight-bold mb-3">What happens next?</div>
            <ul class="next-steps">
              <li>Review and confirm your billing details.</li>
              <li>Complete your secure payment via Chargebee.</li>
              <li>Your new limits apply instantly — upgrade anytime.</li>
            </ul>
          </v-card>
        </div>
      </v-col>
    </v-row>

    <v-card flat border rounded="lg" class="need-help-card mt-6 pa-4 d-flex align-center ga-4">
      <v-avatar color="primary" variant="tonal" size="44" rounded="lg" class="flex-shrink-0">
        <v-icon size="22">circle-help</v-icon>
      </v-avatar>
      <div class="flex-grow-1 min-width-0">
        <div class="need-help-card__title">Need help?</div>
        <div class="text-body-2 text-medium-emphasis">Have questions about our plans? Our team is here to help.</div>
      </div>
      <div class="d-flex ga-2 flex-shrink-0">
        <v-btn color="primary" variant="flat" class="text-none" @click="talkToSales">Talk to sales</v-btn>
        <v-btn variant="outlined" class="text-none" @click="notify('Prototype action')">Raise a ticket</v-btn>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="3000" rounded="pill" location="bottom center">
      {{ snackText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.plans-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cloud-header__name {
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

/* ── Tier cards ─────────────────────────────────────────────── */
/* Auto-fit grid keeps tier cards readable at any content width (e.g. with the
   copilot drawer open) — reflows 4 → 2 → 1 instead of squeezing. */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
  gap: 12px;
}

.plan-card {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.plan-card__ribbon {
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-align: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.plan-card--current {
  border-color: rgb(var(--v-theme-primary));
}

.plan-card__body {
  padding: 16px;
}

.plan-card__name {
  font-size: 15px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 6px;
}

.plan-card__price {
  font-size: 24px;
  font-weight: 750;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}

.plan-card__unit {
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
}

.plan-card__caption {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.plan-card__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-card__features li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
}

.plan-card__feature--excluded {
  color: rgb(var(--v-theme-on-surface-variant));
}

.plan-card__footer {
  padding: 0 16px 16px;
  margin-top: auto;
}

/* ── Add-ons ────────────────────────────────────────────────── */
.addon-list {
  display: flex;
  flex-direction: column;
}

.addon-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 2px;
}

.addon-row + .addon-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.addon-row__name {
  font-size: 13.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

/* ── Order summary rail ─────────────────────────────────────── */
.plans-rail {
  display: flex;
  flex-direction: column;
}

@media (min-width: 1280px) {
  .plans-rail {
    position: sticky;
    top: 80px;
  }
}

.plans-summary__empty {
  padding: 24px 0;
  text-align: center;
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

.next-steps {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* ── Need help ──────────────────────────────────────────────── */
.need-help-card__title {
  font-size: 15px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

@media (max-width: 600px) {
  .need-help-card {
    flex-wrap: wrap;
  }

  .need-help-card > div:last-child {
    width: 100%;
  }

  .need-help-card .v-btn {
    flex: 1;
  }
}
</style>
