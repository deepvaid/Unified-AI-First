<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import { useToast } from '@/composables/useToast'
import { useAccountsStore } from '@/stores/useAccounts'
import { activePromo, isEligibleTier, promoSaving } from '@/plg/promo'
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

function queryValue(key: string) {
  const raw = route.query[key]
  return (Array.isArray(raw) ? raw[0] : raw) ?? undefined
}

// ── Cycle + cloud selection ────────────────────────────────────────────────
// Checkout's "Back to plans" hands the cart back in the query, so a customer
// who returns (wrong coupon, second thoughts) finds it as they left it.
// Otherwise annual leads — it is the better deal — except for a paying customer,
// who opens on the cycle they are already billed on rather than being switched.
function initialCycle(): BillingCycle {
  const fromQuery = queryValue('cycle')
  if (fromQuery === 'annual' || fromQuery === 'monthly') return fromQuery
  return plg.active.mode === 'paid' ? plg.active.cycle : 'annual'
}
const cycle = ref<BillingCycle>(initialCycle())
const cloudKey = ref<PlgCloud>(PLAN_CATALOG[0]!.cloud)

const tabs = computed(() => PLAN_CATALOG.map(c => ({ label: c.name, key: c.cloud })))
const activeCatalog = computed(() => PLAN_CATALOG.find(c => c.cloud === cloudKey.value)!)

function currentTierFor(cloud: PlgCloud): PlanTier | undefined {
  return plg.active.mode === 'paid' ? plg.active.tiers[cloud] : undefined
}

/** The recommended tier carries the page's one accent — unless the customer already has it. */
function isFeatured(cloud: PlgCloud, plan: PlanDef) {
  return plan.badge === 'Most popular' && currentTierFor(cloud) !== plan.tier
}

function badgeColor(badge: string) {
  return badge === 'Most popular' ? 'primary' : 'default'
}

const annualPercent = Math.round(ANNUAL_DISCOUNT * 100)

function effectiveMonthly(plan: PlanDef) {
  return cycle.value === 'annual' ? plan.monthly * (1 - ANNUAL_DISCOUNT) : plan.monthly
}

/** Self-serve tiers a customer can put in the cart (Enterprise goes through sales). */
function canSelect(cloud: PlgCloud, tier: PlanTier) {
  return tier !== 'enterprise' && currentTierFor(cloud) !== tier
}

// ── Cart state (local — nothing persisted until checkout) ─────────────────
const selections = reactive<Partial<Record<PlgCloud, PlanTier>>>({})
const selectedAddOns = reactive<Set<AddOnKey>>(new Set())

for (const catalog of PLAN_CATALOG) {
  const plan = catalog.plans.find(p => p.tier === queryValue(catalog.cloud))
  if (plan && canSelect(catalog.cloud, plan.tier)) selections[catalog.cloud] = plan.tier
}
for (const key of (queryValue('addons') ?? '').split(',')) {
  const def = ADD_ON_CATALOG.find(a => a.key === key && a.monthly !== null)
  if (def && !plg.active.addOns.includes(def.key)) selectedAddOns.add(def.key)
}

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
      tier,
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

// ── Black Friday offer ──────────────────────────────────────────────────────
// Two Chargebee coupons, one per billing cycle. The page picks the one that
// matches the cart, so the customer never chooses between two codes — a wrong
// one only earns Chargebee's bare "Invalid coupon code".
// `?promo=auto` previews the target: Chargebee applies the code itself.
const toast = useToast()
const promo = activePromo()
const autoApply = computed(() => queryValue('promo') === 'auto')
const coupon = computed(() => promo?.coupons[cycle.value] ?? null)

function hasOffer(cloud: PlgCloud, plan: PlanDef) {
  return !!promo && isEligibleTier(promo, plan.tier) && canSelect(cloud, plan.tier)
}

function offerMonthly(plan: PlanDef) {
  return effectiveMonthly(plan) * (1 - (coupon.value?.percentOff ?? 0))
}

// The main price on a card is always what checkout charges by default: the
// regular price while the code is manual, the offer price once it is automatic.
function offerLine(plan: PlanDef) {
  if (!coupon.value) return ''
  const annual = cycle.value === 'annual'
  if (autoApply.value) {
    return `${annual ? 'year one' : `first ${coupon.value.invoices} invoices`}, then ${money(effectiveMonthly(plan))}/mo`
  }
  return `${money(offerMonthly(plan))}/mo ${annual ? 'in year one' : `for ${coupon.value.invoices} invoices`}`
}

const saving = computed(() => (promo ? promoSaving(promo, cloudLineItems.value, cycle.value) : 0))
const offerApplies = computed(() => saving.value > 0)
const offerTotal = computed(() => total.value - saving.value)
const offerMissed = computed(() => !!promo && hasSelections.value && !offerApplies.value)
const hasUndiscounted = computed(
  () => !!promo && (cloudLineItems.value.some(i => !isEligibleTier(promo, i.tier)) || addOnLineItems.value.length > 0),
)
const showCode = computed(() => offerApplies.value && !autoApply.value)

const offerHeadline = computed(() => {
  if (!promo || !coupon.value) return ''
  return cycle.value === 'annual'
    ? `Pay ${money(offerTotal.value)} for your first year (${promo.headlinePercent}% off, up from ${annualPercent}%)`
    : `Pay ${money(offerTotal.value)} for each of your first ${coupon.value.invoices} invoices`
})
const offerAfter = computed(() => {
  if (!coupon.value) return ''
  return cycle.value === 'annual'
    ? `Renews at ${money(total.value)}/yr.`
    : `Then ${money(total.value)}/mo from invoice ${coupon.value.invoices + 1}.`
})

const offerSmallPrint = computed(() =>
  [
    'Paste this code into Apply coupon at checkout.',
    cycle.value === 'monthly' && 'Your first invoice may cover only part of a month.',
    hasUndiscounted.value && "Build plans and add-ons aren't discounted.",
  ]
    .filter(Boolean)
    .join(' '),
)

// The switcher says what each cycle is worth, so the choice is made on the deal.
// On a phone the two long labels do not fit one row; the band above carries them.
const { smAndDown } = useDisplay()
const cycleItems = computed(() =>
  smAndDown.value
    ? [
        { value: 'annual', label: 'Annual' },
        { value: 'monthly', label: 'Monthly' },
      ]
    : promo
    ? [
        { value: 'annual', label: `Annual · ${promo.headlinePercent}% off for 12 months` },
        { value: 'monthly', label: `Monthly · ${promo.headlinePercent}% off ${promo.coupons.monthly.invoices} invoices` },
      ]
    : [
        { value: 'annual', label: `Annual · save ${annualPercent}%` },
        { value: 'monthly', label: 'Monthly' },
      ],
)

function setCycle(value: string | null) {
  if (value === 'annual' || value === 'monthly') cycle.value = value
}

const dueNow = computed(() => (autoApply.value ? offerTotal.value : total.value))
const savingLine = computed(() => {
  if (!coupon.value || !offerApplies.value) return ''
  const amount = money(saving.value * coupon.value.invoices)
  return cycle.value === 'annual'
    ? `You save ${amount} in your first year.`
    : `You save ${amount} over your first ${coupon.value.invoices} invoices.`
})

const copied = ref(false)
const copyFailed = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

// A code copied before the customer switched billing cycle is the wrong code.
watch(coupon, () => {
  copied.value = false
  copyFailed.value = false
})

async function copyCode() {
  if (!coupon.value) return false
  try {
    await navigator.clipboard.writeText(coupon.value.code)
  } catch {
    copyFailed.value = true
    toast.error("Couldn't copy the code. Select it and copy it, then continue.")
    return false
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 2000)
  return true
}

async function copyFromBlock() {
  if (await copyCode()) toast.success('Code copied')
}

function removeCloud(cloud: PlgCloud) {
  delete selections[cloud]
}

const checkoutLabel = computed(() => {
  if (showCode.value && !copyFailed.value) return 'Copy code and continue'
  return hasSelections.value ? `Continue to checkout · ${money(dueNow.value)}` : 'Continue to checkout'
})

// Leaving is the moment the clipboard has to be right, so the button copies the
// current code itself. If the browser refuses, the customer stays here with the
// code on screen and the next click simply continues.
async function onCheckout() {
  if (!hasSelections.value) return
  if (showCode.value && coupon.value && !copyFailed.value) {
    if (!(await copyCode())) return
    toast.success(`${coupon.value.code} copied. Paste it into Apply coupon at checkout.`)
  }
  continueToCheckout()
}

function continueToCheckout() {
  const query: Record<string, string> = { cycle: cycle.value }
  for (const [cloud, tier] of Object.entries(selections)) {
    if (tier) query[cloud] = tier
  }
  if (selectedAddOns.size) query.addons = [...selectedAddOns].join(',')
  if (autoApply.value) {
    query.promo = 'auto'
    if (offerApplies.value && coupon.value) query.coupon = coupon.value.code
  }
  router.push({ name: 'Checkout', params: { accountId: accountId.value }, query })
}

// ── Prototype toast (Talk to sales / ticket / enterprise CTAs) ────────────
function talkToSales() {
  toast.info('Our team will reach out.')
}
</script>

<template>
  <div class="plans-view">
    <MpPageHeader
      title="Subscription plans"
      subtitle="Choose the tools and plan that fit your business today — upgrade anytime as you grow."
    />

    <section v-if="promo" class="promo-band" :aria-label="promo.name">
      <div class="promo-band__lead">
        <div class="promo-band__eyebrow">{{ promo.name }}</div>
        <div class="promo-band__figure">{{ promo.headlinePercent }}% off</div>
      </div>
      <ul class="promo-band__terms">
        <li><strong>Annual</strong> {{ promo.headlinePercent }}% off your first 12 months, up from {{ annualPercent }}%</li>
        <li><strong>Monthly</strong> {{ promo.headlinePercent }}% off your first {{ promo.coupons.monthly.invoices }} invoices</li>
        <li>Free onboarding included · Essential and above</li>
      </ul>
      <div class="promo-band__meta">
        <span class="promo-band__deadline">
          <v-icon size="14">clock</v-icon>
          Ends {{ promo.endsLabel }}
        </span>
        <span>{{ autoApply ? 'Applied automatically at checkout' : 'Your code appears when you pick a plan' }}</span>
      </div>
    </section>

    <div class="plans-controls">
      <MpFilterTabs v-model="cloudKey" :tabs="tabs" aria-label="Plan clouds" class="plans-controls__tabs" />
      <MpSegmentedControl
        :model-value="cycle"
        :items="cycleItems"
        ariaLabel="Billing period"
        @update:model-value="setCycle"
      />
    </div>

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
              :class="{
                'plan-card--current': currentTierFor(cloudKey) === plan.tier,
                'plan-card--featured': isFeatured(cloudKey, plan),
              }"
            >
              <div v-if="currentTierFor(cloudKey) === plan.tier" class="plan-card__ribbon">Current plan</div>

              <div class="plan-card__body flex-grow-1">
                <v-chip size="small" :color="badgeColor(plan.badge)" variant="tonal" class="mb-3">
                  {{ plan.badge }}
                </v-chip>

                <div class="plan-card__name">{{ plan.name }}</div>

                <div class="plan-card__price">
                  <template v-if="autoApply && hasOffer(cloudKey, plan)">
                    <s class="plan-card__was"><span class="d-sr-only">Regular price </span>{{ money(effectiveMonthly(plan)) }}</s>
                    {{ money(offerMonthly(plan)) }}<span class="plan-card__unit">/mo</span>
                  </template>
                  <template v-else>
                    {{ money(effectiveMonthly(plan)) }}<span class="plan-card__unit">/mo</span>
                  </template>
                </div>
                <div v-if="cycle === 'annual'" class="plan-card__caption">billed annually</div>
                <div v-if="hasOffer(cloudKey, plan)" class="plan-card__offer text-primary">
                  <v-icon size="14">tag</v-icon>
                  <span>Black Friday: {{ offerLine(plan) }}</span>
                </div>

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
              <template v-if="promo && !autoApply">Pick a plan to see your Black Friday code.</template>
            </div>

            <template v-else>
              <div v-for="item in cloudLineItems" :key="item.cloud" class="summary-line">
                <span class="summary-line__label">
                  <span>{{ item.label }}</span>
                  <button
                    type="button"
                    class="mp-link summary-line__remove"
                    :aria-label="`Remove ${item.label}`"
                    @click="removeCloud(item.cloud)"
                  >
                    Remove
                  </button>
                </span>
                <span class="num">{{ money(item.price) }}</span>
              </div>
              <div v-for="item in addOnLineItems" :key="item.key" class="summary-line">
                <span class="summary-line__label">
                  <span>{{ item.label }}</span>
                  <button
                    type="button"
                    class="mp-link summary-line__remove"
                    :aria-label="`Remove ${item.label}`"
                    @click="toggleAddOn(item.key)"
                  >
                    Remove
                  </button>
                </span>
                <span class="num">{{ money(item.price) }}</span>
              </div>
              <div v-if="promo && offerApplies && autoApply" class="summary-line text-primary">
                <span>{{ promo.name }}</span>
                <span class="num">−{{ money(saving) }}</span>
              </div>
              <v-divider class="my-3" />
              <div class="summary-line summary-line--total">
                <span>{{ cycle === 'annual' ? 'Total due today' : 'Total due' }}</span>
                <span class="num">{{ money(dueNow) }}</span>
              </div>
              <div v-if="cycle === 'annual'" class="text-caption text-medium-emphasis">
                For 12 months · {{ money(dueNow / 12) }}/mo
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                Prices shown are exclusive of applicable taxes.
              </div>
              <div v-if="offerApplies && autoApply" class="text-caption text-medium-emphasis mt-2">
                <strong class="text-success">{{ savingLine }}</strong>
                Applied automatically at checkout. {{ offerAfter }}
                <template v-if="hasUndiscounted">Build plans and add-ons aren't discounted.</template>
              </div>
              <div v-if="offerMissed" class="text-caption text-medium-emphasis mt-2">
                The Black Friday offer applies to Essential and above.
              </div>

              <div v-if="promo && coupon && showCode" class="offer-block">
                <div class="offer-block__eyebrow">{{ promo.name }}</div>
                <div class="offer-block__headline">{{ offerHeadline }}</div>
                <div class="offer-block__note">{{ savingLine }} {{ offerAfter }} Plus free onboarding.</div>
                <div class="offer-block__code">
                  <code>{{ coupon.code }}</code>
                  <v-btn
                    variant="text"
                    color="primary"
                    class="text-none"
                    :prepend-icon="copied ? 'check' : 'copy'"
                    :aria-label="copied ? `Code ${coupon.code} copied` : `Copy code ${coupon.code}`"
                    @click="copyFromBlock"
                  >
                    {{ copied ? 'Copied' : 'Copy' }}
                  </v-btn>
                </div>
                <div class="offer-block__note">{{ offerSmallPrint }}</div>
              </div>
            </template>

            <v-btn
              block
              color="primary"
              variant="flat"
              class="text-none mt-4"
              :disabled="!hasSelections"
              @click="onCheckout"
            >
              {{ checkoutLabel }}
            </v-btn>
            <div class="plans-secure text-caption text-medium-emphasis">
              <v-icon size="14">lock</v-icon>
              Secure payment via Chargebee
            </div>
          </v-card>

          <v-card flat border rounded="lg" class="pa-4">
            <div class="text-body-2 font-weight-bold mb-3">What happens next?</div>
            <ol v-if="coupon && showCode" class="next-steps">
              <li>Continue to checkout.</li>
              <li>Paste <strong>{{ coupon.code }}</strong> into Apply coupon, in the order summary.</li>
              <li>Complete your secure payment via Chargebee.</li>
            </ol>
            <ul v-else class="next-steps">
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
        <v-btn variant="outlined" class="text-none" @click="toast.info('Prototype action')">Raise a ticket</v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.plans-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ── Promo band ─────────────────────────────────────────────── */
/* A promotion, not a notice: the ink panel pair, one accent for the figure. */
.promo-band {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-16) var(--mp-space-32);
  margin-bottom: var(--mp-space-20);
  padding: var(--mp-space-20) var(--mp-space-24);
  border-radius: var(--mp-component-card-radius);
  background: var(--ink-panel-bg);
  color: var(--ink-panel-fg);
}

.promo-band__eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
  color: var(--ink-panel-muted-fg);
}

.promo-band__figure {
  font-size: var(--mp-fontSize-32);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.1;
  letter-spacing: var(--mp-letterSpacing-tight);
  color: var(--ink-panel-accent);
}

.promo-band__terms {
  flex: 1 1 320px;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--mp-fontSize-14);
}

.promo-band__terms strong {
  display: inline-block;
  min-width: 64px;
  font-weight: var(--mp-fontWeight-semibold);
}

.promo-band__terms li:last-child {
  color: var(--ink-panel-muted-fg);
}

.promo-band__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  color: var(--ink-panel-muted-fg);
}

.promo-band__deadline {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: var(--mp-space-4) var(--mp-space-10);
  border: 1px solid var(--ink-panel-border);
  border-radius: var(--mp-radius-full);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--ink-panel-fg);
}

/* ── Cloud tabs + billing period ────────────────────────────── */
/* The period applies to every cloud, so it shares the tab row and sits right
   above the prices it changes. */
.plans-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12) var(--mp-space-24);
  margin-bottom: var(--mp-space-16);
}

.plans-controls__tabs {
  flex: 1 1 auto;
  min-width: 0;
}

.plans-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-6);
  margin-top: var(--mp-space-12);
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
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* The accent belongs to the plan worth choosing, not the one already owned. */
.plan-card--featured {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: inset 0 0 0 1px rgb(var(--v-theme-primary));
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

.plan-card__was {
  margin-right: var(--mp-space-4);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  color: rgb(var(--v-theme-on-surface-variant));
}

.plan-card__offer {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-6);
  margin-top: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  line-height: 1.4;
}

.plan-card__offer .v-icon {
  flex-shrink: 0;
  margin-top: var(--mp-space-2);
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
  align-items: baseline;
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

.summary-line__label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-space-2);
  min-width: 0;
}

.summary-line__remove {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--mp-fontSize-12);
  cursor: pointer;
}

/* ── Offer block ────────────────────────────────────────────── */
/* Sits between the total and the button, so the code is the last thing read
   before leaving. A painted surface declares its foreground — the block on the
   accent container pair, the code well on the surface pair. */
.offer-block {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  margin-top: var(--mp-space-16);
  padding: var(--mp-component-card-paddingCompact);
  border-radius: var(--mp-radius-12);
  background: var(--accent-container);
  color: var(--accent-on-container);
}

.offer-block__eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
  text-transform: uppercase;
}

.offer-block__headline {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: 1.4;
}

.offer-block__note {
  font-size: var(--mp-fontSize-12);
  line-height: 1.5;
}

.offer-block__code {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  min-height: var(--mp-component-control-height);
  margin-block: var(--mp-space-4);
  padding-inline: var(--mp-space-12) var(--mp-space-4);
  border-radius: var(--mp-component-input-radius);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.offer-block__code code {
  font-family: var(--mp-fontFamily-mono);
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: var(--mp-letterSpacing-wide);
  user-select: all;
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
