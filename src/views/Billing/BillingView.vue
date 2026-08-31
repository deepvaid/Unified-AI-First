<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useAccountsStore } from '@/stores/useAccounts'
import {
  usePlgStore,
  PLAN_CATALOG,
  ADD_ON_CATALOG,
  tierRank,
  type PlgCloud,
  type PlanTier,
  type AddOnDef,
} from '@/stores/usePlg'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const accountsStore = useAccountsStore()
const plg = usePlgStore()
const toast = useToast()
const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

type BillingTab = 'overview' | 'usage' | 'company' | 'transactions' | 'documents' | 'delete'

const tabs: { value: BillingTab; label: string }[] = [
  { value: 'overview',     label: 'Overview' },
  { value: 'usage',        label: 'Usage & Limits' },
  { value: 'company',      label: 'Company Info' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'documents',    label: 'Documents' },
  { value: 'delete',       label: 'Delete Account' },
]

const activeTab = ref<BillingTab>('overview')

const products = computed(() => [
  { name: 'Marketing Cloud',  tier: 'Enterprise', icon: 'megaphone',     active: accountsStore.hasSubscription('marketing') },
  { name: 'Commerce Cloud',   tier: 'Pro',        icon: 'shopping-cart', active: accountsStore.hasSubscription('commerce') },
  { name: 'Service Cloud',    tier: 'Starter',    icon: 'headset',       active: accountsStore.hasSubscription('service') },
  { name: 'Da Vinci AI',      tier: 'Add-on',     icon: 'sparkles',      active: accountsStore.hasSubscription('davinci') },
  { name: 'Data Platform',    tier: 'Add-on',     icon: 'database',      active: accountsStore.hasSubscription('analytics') },
])

const company = [
  { label: 'Billing company', value: 'Texo Commerce Pty Ltd' },
  { label: 'Billing email',   value: 'billing@texo.com' },
  { label: 'Tax ID / ABN',    value: 'AU 84 142 339 071' },
  { label: 'Billing address', value: '120 Spencer St, Melbourne VIC 3000, Australia' },
]

const invoices = [
  { date: 'Mar 1, 2026', desc: 'Enterprise Plan — March',    amt: '$1,499' },
  { date: 'Feb 1, 2026', desc: 'Enterprise Plan — February', amt: '$1,499' },
  { date: 'Jan 1, 2026', desc: 'Enterprise Plan — January',  amt: '$1,499' },
]

const documents = [
  { name: 'Master Service Agreement', meta: 'PDF · Signed Jan 1, 2026' },
  { name: 'Order Form — Enterprise',  meta: 'PDF · Jan 1, 2026' },
  { name: 'W-9 / Tax Form',           meta: 'PDF · Updated Feb 12, 2026' },
  { name: 'Data Processing Addendum', meta: 'PDF · Jan 1, 2026' },
]

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatUsageNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  return n.toLocaleString('en-US')
}

function notify(text: string) {
  toast.info(text)
}

function goToPlans() {
  router.push({ name: 'Plans', params: { accountId: accountId.value } })
}

// ─── Overview: status strip ──────────────────────────────────────────────────

const GRACE_PERIOD_DAYS = 7
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function updatePayment() {
  notify('Payment method update — coming soon.')
}

function resumeSubscription() {
  notify('Resuming your subscription — coming soon.')
}

const statusStrip = computed(() => {
  const s = plg.active
  if (s.status === 'grace') {
    const daysLeft = Math.max(0, GRACE_PERIOD_DAYS - (s.gracePaymentFailedAt ? daysSince(s.gracePaymentFailedAt) : 0))
    return {
      tone: 'error' as const,
      icon: 'circle-alert',
      text: `Your last payment failed. Update your payment method within ${daysLeft} days to keep access.`,
      actionLabel: 'Update payment',
      action: updatePayment,
    }
  }
  if (s.status === 'cancelled_pending') {
    return {
      tone: 'warning' as const,
      icon: 'triangle-alert',
      text: `Your subscription is cancelled. You keep full access until ${formatDate(s.cancelAt ?? s.renewsAt ?? s.trialEndsAt)}.`,
      actionLabel: 'Resume subscription',
      action: resumeSubscription,
    }
  }
  if (s.status === 'trialing') {
    return {
      tone: 'info' as const,
      icon: 'sparkles',
      text: `You're on a free trial — ${plg.daysLeft} days left.`,
      actionLabel: 'Upgrade',
      action: goToPlans,
    }
  }
  return null
})

// ─── Overview: plan banner (slim summary strip) ──────────────────────────────

const cycleLabelText = computed(() => (plg.active.cycle === 'annual' ? 'Annual' : 'Monthly'))

const bannerChipText = computed(() => (plg.isTrial ? 'FREE TRIAL' : `${cycleLabelText.value.toUpperCase()} BILLING`))

const bannerHeadline = computed(() => {
  const s = plg.active
  if (plg.isTrial) return plg.isExpired ? 'Trial expired' : `${plg.daysLeft} days left in trial`
  if (s.status === 'grace') return 'Payment failed'
  if (s.status === 'cancelled_pending') return 'Subscription cancelled'
  return 'Active subscription'
})

const bannerMeta = computed(() => {
  const s = plg.active
  const cloudCount = Object.keys(s.tiers).length
  const cloudsText = plg.isTrial
    ? 'Marketing · Commerce · Service'
    : `${cloudCount} cloud${cloudCount === 1 ? '' : 's'} subscribed`
  if (!plg.isTrial && s.status === 'active' && s.renewsAt) {
    return `${cloudsText} · Renews ${formatDate(s.renewsAt)}`
  }
  return cloudsText
})

// ─── Overview: current subscriptions ─────────────────────────────────────────

const CLOUD_ORDER: PlgCloud[] = ['marketing', 'commerce', 'service']

const subscriptionCards = computed(() => {
  const s = plg.active
  const clouds = plg.isTrial ? CLOUD_ORDER : CLOUD_ORDER.filter(c => s.tiers[c])
  return clouds.map((cloud) => {
    const catalog = PLAN_CATALOG.find(c => c.cloud === cloud)!
    const tier = s.tiers[cloud]
    const planDef = tier ? catalog.plans.find(p => p.tier === tier) : undefined

    let chipText = 'Active'
    let chipColor = 'success'
    if (s.status === 'grace') {
      chipText = 'Payment failed'
      chipColor = 'error'
    } else if (s.status === 'cancelled_pending') {
      chipText = `Ends ${formatDate(s.cancelAt ?? s.renewsAt ?? s.trialEndsAt)}`
      chipColor = 'warning'
    } else if (plg.isTrial) {
      chipText = `${plg.daysLeft} days left`
      chipColor = 'primary'
    }

    return {
      cloud,
      name: catalog.name,
      icon: catalog.icon,
      planLabel: plg.isTrial ? 'Free Trial' : (planDef?.name ?? 'Free Trial'),
      startDate: formatDate(s.startedAt),
      cycleLabel: cycleLabelText.value,
      chipText,
      chipColor,
      canDowngrade: !plg.isTrial && !!tier && tierRank(tier) > 0,
    }
  })
})

// ─── Overview: downgrade flow ─────────────────────────────────────────────────

interface DowngradeTarget {
  cloud: PlgCloud
  cloudName: string
  targetTier: PlanTier
  targetTierName: string
  lostFeatures: string[]
}

const downgradeDialogOpen = ref(false)
const downgradeTarget = ref<DowngradeTarget | null>(null)

function openDowngrade(cloud: PlgCloud) {
  const tier = plg.active.tiers[cloud]
  if (!tier) return
  const catalog = PLAN_CATALOG.find(c => c.cloud === cloud)!
  const idx = catalog.plans.findIndex(p => p.tier === tier)
  const targetPlan = catalog.plans[idx - 1]
  if (!targetPlan) return
  const currentPlan = catalog.plans[idx]!
  const lostFeatures = currentPlan.features
    .filter(f => f.included && !targetPlan.features.find(tf => tf.label === f.label)?.included)
    .map(f => f.label)
    .slice(0, 4)

  downgradeTarget.value = {
    cloud,
    cloudName: catalog.name,
    targetTier: targetPlan.tier,
    targetTierName: targetPlan.name,
    lostFeatures,
  }
  downgradeDialogOpen.value = true
}

const downgradeTitle = computed(() => (downgradeTarget.value ? `Downgrade ${downgradeTarget.value.cloudName}?` : ''))

const downgradeMessage = computed(() => {
  const t = downgradeTarget.value
  if (!t) return ''
  if (!t.lostFeatures.length) return `Switch to ${t.targetTierName}?`
  return `Downgrading to ${t.targetTierName} removes: ${t.lostFeatures.join(', ')}.`
})

function confirmDowngrade() {
  if (!downgradeTarget.value) return
  plg.changeTier(downgradeTarget.value.cloud, downgradeTarget.value.targetTier)
  notify('Plan updated')
}

// ─── Overview: add-ons ────────────────────────────────────────────────────────

const addOnRows = computed(() =>
  ADD_ON_CATALOG.map(a => ({
    ...a,
    owned: plg.active.addOns.includes(a.key),
    priceLabel: a.monthly === null ? 'Custom pricing' : `$${a.monthly}/mo`,
  })),
)

const addonDrawerOpen = ref(false)
const selectedAddon = ref<AddOnDef | null>(null)

function openAddonDrawer(addon: AddOnDef) {
  selectedAddon.value = addon
  addonDrawerOpen.value = true
}

function confirmPurchase() {
  if (!selectedAddon.value) return
  plg.purchaseAddOn(selectedAddon.value.key)
  notify(`${selectedAddon.value.name} added`)
  addonDrawerOpen.value = false
}

function talkToSales() {
  notify('Our team will reach out.')
}

// ─── Overview: cancel flow ────────────────────────────────────────────────────

const cancelDrawerOpen = ref(false)
const cancelReason = ref('')
const cancelComment = ref('')
const cancelReasons = ['Too expensive', 'Missing features', 'Switching provider', 'Just exploring', 'Other']

function openCancelDrawer() {
  cancelReason.value = ''
  cancelComment.value = ''
  cancelDrawerOpen.value = true
}

function confirmCancel() {
  plg.cancelSubscription({ reason: cancelReason.value || 'Other', comment: cancelComment.value || undefined })
  notify('Subscription cancelled')
  cancelDrawerOpen.value = false
}

// ─── Usage & Limits ───────────────────────────────────────────────────────────

function usageRow(label: string, meter: { used: number; limit: number }) {
  const unlimited = meter.limit === -1
  const pct = unlimited || meter.limit <= 0 ? 0 : Math.min(100, Math.round((meter.used / meter.limit) * 100))
  return {
    label,
    used: formatUsageNumber(meter.used),
    limit: unlimited ? 'Unlimited' : formatUsageNumber(meter.limit),
    pct,
    unlimited,
  }
}

const usageRows = computed(() => {
  const u = plg.active.usage
  return [
    usageRow('Emails Sent', u.emailSends),
    usageRow('SMS Sent', u.sms),
    usageRow('AI Tokens', u.aiTokens),
    usageRow('Chatbots', u.chatbots),
    { label: 'Contacts', used: '128,430', limit: 'Unlimited', pct: 0, unlimited: true },
    { label: 'Support Tickets', used: '847', limit: 'Unlimited', pct: 0, unlimited: true },
  ]
})
</script>

<template>
  <div class="billing-view">
    <MpPageHeader
      title="Account & Billing"
      subtitle="Manage your subscription, products, usage, and invoices."
      :back-to="{ name: 'Dashboard', params: { accountId } }"
    >
      <template #tabs>
        <v-tabs v-model="activeTab" class="billing-tabs" density="compact" color="primary" show-arrows>
          <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="text-none">
            {{ tab.label }}
          </v-tab>
        </v-tabs>
      </template>
    </MpPageHeader>

    <!-- Overview -->
    <section v-if="activeTab === 'overview'" class="billing-panel">
      <MpAlert v-if="statusStrip" :tone="statusStrip.tone" :icon="statusStrip.icon">
        {{ statusStrip.text }}
        <template #actions>
          <v-btn
            variant="flat"
            size="small"
            class="text-none"
            :color="statusStrip.tone === 'info' ? 'primary' : statusStrip.tone"
            @click="statusStrip.action"
          >
            {{ statusStrip.actionLabel }}
          </v-btn>
        </template>
      </MpAlert>

      <div class="plan-banner">
        <div>
          <v-chip size="small" variant="flat" class="plan-banner__chip">{{ bannerChipText }}</v-chip>
          <div class="plan-banner__price">{{ bannerHeadline }}</div>
          <div class="plan-banner__meta">{{ bannerMeta }}</div>
        </div>
        <div class="plan-banner__actions">
          <v-btn variant="flat" color="on-primary" class="text-none plan-banner__cta" prepend-icon="circle-arrow-up" @click="goToPlans">Upgrade Plan</v-btn>
          <v-btn variant="text" class="text-none plan-banner__link" size="small" @click="openCancelDrawer">Change or cancel plan</v-btn>
        </div>
      </div>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="billing-card__title">Current Subscriptions</h2>
        </div>
        <div class="subscription-grid">
          <div v-for="card in subscriptionCards" :key="card.cloud" class="subscription-card">
            <div class="subscription-card__icon">
              <v-icon size="20" color="primary">{{ card.icon }}</v-icon>
            </div>
            <div class="subscription-card__body">
              <div class="subscription-card__top">
                <span class="subscription-card__name">{{ card.name }}</span>
                <v-chip :color="card.chipColor" size="small" variant="tonal">{{ card.chipText }}</v-chip>
              </div>
              <div class="subscription-card__meta">Plan: {{ card.planLabel }}</div>
              <div class="subscription-card__meta">Start date: {{ card.startDate }}</div>
              <div class="subscription-card__meta">Billing cycle: {{ card.cycleLabel }}</div>
              <div class="subscription-card__actions">
                <v-btn variant="text" size="small" color="primary" class="text-none" @click="goToPlans">Change plan</v-btn>
                <v-btn v-if="card.canDowngrade" variant="text" size="small" class="text-none" @click="openDowngrade(card.cloud)">Downgrade</v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="billing-card__title">Products &amp; Add-ons</h2>
          <v-btn variant="text" size="small" color="primary" class="text-none" append-icon="external-link">See all features</v-btn>
        </div>
        <div class="product-list">
          <div v-for="p in products" :key="p.name" class="product-row">
            <v-icon class="product-row__icon" size="22">{{ p.icon }}</v-icon>
            <div class="product-row__copy">
              <div class="product-row__name">{{ p.name }}</div>
              <div class="product-row__tier">{{ p.tier }}</div>
            </div>
            <v-chip
              :color="p.active ? 'success' : undefined"
              size="x-small"
              variant="flat"
              class="product-row__chip"
            >
              {{ p.active ? 'Active' : 'Available' }}
            </v-chip>
          </div>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="billing-card__title">Add-ons</h2>
        </div>
        <div class="product-list">
          <div v-for="a in addOnRows" :key="a.key" class="product-row">
            <v-icon class="product-row__icon" size="22">{{ a.icon }}</v-icon>
            <div class="product-row__copy">
              <div class="product-row__name">{{ a.name }}</div>
              <div class="product-row__tier">{{ a.description }} · {{ a.priceLabel }}</div>
            </div>
            <v-chip v-if="a.owned" color="success" size="x-small" variant="flat" class="product-row__chip">Active</v-chip>
            <v-btn v-else-if="a.monthly !== null" variant="text" size="small" color="primary" class="text-none" @click="openAddonDrawer(a)">+ Add</v-btn>
            <v-btn v-else variant="outlined" size="small" color="primary" class="text-none" @click="talkToSales">Talk to sales</v-btn>
          </div>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="billing-card">
        <h2 class="billing-card__title mb-3">Payment Method</h2>
        <div class="payment-row">
          <v-icon color="primary" size="30">credit-card</v-icon>
          <div class="payment-row__copy">
            <div class="payment-row__title">Visa ending in 4242</div>
            <div class="payment-row__sub">Expires 12/2028</div>
          </div>
          <v-btn variant="flat" size="small" color="primary" class="text-none">Change Card</v-btn>
        </div>
      </v-card>
    </section>

    <!-- Usage & Limits -->
    <section v-else-if="activeTab === 'usage'" class="billing-panel">
      <v-card flat border rounded="lg" class="billing-card">
        <h2 class="billing-card__title mb-3">Usage This Month</h2>
        <div class="usage-grid">
          <div v-for="u in usageRows" :key="u.label" class="usage-card">
            <div class="usage-card__head">
              <span class="usage-card__label">{{ u.label }}</span>
              <span class="usage-card__values">{{ u.used }} / {{ u.limit }}</span>
            </div>
            <v-progress-linear v-if="!u.unlimited" :model-value="u.pct" color="primary" rounded height="6" />
            <div v-else class="usage-card__unlimited">Unlimited</div>
          </div>
        </div>
      </v-card>
    </section>

    <!-- Company Info -->
    <section v-else-if="activeTab === 'company'" class="billing-panel">
      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="billing-card__title">Company Information</h2>
          <v-btn variant="flat" size="small" color="primary" class="text-none">Edit</v-btn>
        </div>
        <dl class="info-grid">
          <div v-for="c in company" :key="c.label" class="info-row">
            <dt class="info-row__label">{{ c.label }}</dt>
            <dd class="info-row__value">{{ c.value }}</dd>
          </div>
        </dl>
      </v-card>
    </section>

    <!-- Transactions -->
    <section v-else-if="activeTab === 'transactions'" class="billing-panel">
      <v-card flat border rounded="lg" class="billing-card">
        <h2 class="billing-card__title mb-3">Recent Transactions</h2>
        <v-table density="comfortable" class="invoice-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(inv, i) in invoices" :key="i">
              <td>{{ inv.date }}</td>
              <td>{{ inv.desc }}</td>
              <td class="font-weight-bold">{{ inv.amt }}</td>
              <td><v-chip color="success" size="x-small" variant="flat">Paid</v-chip></td>
              <td class="text-right"><v-btn icon="download" variant="text" size="small" color="primary" aria-label="Download invoice" /></td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </section>

    <!-- Documents -->
    <section v-else-if="activeTab === 'documents'" class="billing-panel">
      <v-card flat border rounded="lg" class="billing-card">
        <h2 class="billing-card__title mb-3">Documents</h2>
        <div class="doc-list">
          <div v-for="d in documents" :key="d.name" class="doc-row">
            <v-icon class="doc-row__icon" size="22">file-text</v-icon>
            <div class="doc-row__copy">
              <div class="doc-row__name">{{ d.name }}</div>
              <div class="doc-row__meta">{{ d.meta }}</div>
            </div>
            <v-btn icon="download" variant="text" size="small" color="primary" :aria-label="`Download ${d.name}`" />
          </div>
        </div>
      </v-card>
    </section>

    <!-- Delete Account -->
    <section v-else class="billing-panel">
      <v-card flat border rounded="lg" class="billing-card danger-card">
        <h2 class="billing-card__title billing-card__title--danger mb-1">Cancel or delete account</h2>
        <p class="danger-card__copy">
          Cancelling stops billing at the end of your current cycle and downgrades you to read-only
          access. Deleting permanently removes your account, data, and integrations — this cannot be undone.
        </p>
        <div class="danger-card__actions">
          <v-btn variant="outlined" color="error" class="text-none" @click="openCancelDrawer">Cancel subscription</v-btn>
          <v-btn variant="flat" color="error" class="text-none">Delete account</v-btn>
        </div>
      </v-card>
    </section>

    <!-- Add-on purchase drawer -->
    <MpFormDrawer v-model="addonDrawerOpen" title="Add add-on">
      <!-- Direct body children: the drawer shell's gap owns the rhythm. -->
      <template v-if="selectedAddon">
        <v-icon size="28" color="primary">{{ selectedAddon.icon }}</v-icon>
        <h3 class="addon-drawer__name">{{ selectedAddon.name }}</h3>
        <p class="addon-drawer__desc">{{ selectedAddon.description }}</p>
        <div class="addon-drawer__price">
          {{ selectedAddon.monthly !== null ? `$${selectedAddon.monthly}` : 'Custom' }}<span v-if="selectedAddon.monthly !== null"> / month</span>
        </div>
      </template>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="addonDrawerOpen = false">Cancel</v-btn>
        <v-btn variant="flat" color="primary" class="text-none" @click="confirmPurchase">Confirm purchase</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Cancel subscription drawer (exit survey) -->
    <MpFormDrawer v-model="cancelDrawerOpen" title="Cancel subscription" subtitle="We're sorry to see you go.">
      <MpFormField label="Why are you cancelling?">
        <template #default="{ labelId }">
          <v-radio-group v-model="cancelReason" :aria-labelledby="labelId">
            <v-radio v-for="r in cancelReasons" :key="r" :label="r" :value="r" />
          </v-radio-group>
        </template>
      </MpFormField>
      <v-textarea v-model="cancelComment" label="Anything else? (optional)" rows="3" />
      <p class="cancel-drawer__notice">
        <v-icon size="14">info</v-icon>
        You'll keep access until the end of your billing period. Your data is retained for 30 days after.
      </p>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="cancelDrawerOpen = false">Keep my plan</v-btn>
        <v-btn variant="flat" color="error" class="text-none" @click="confirmCancel">Cancel subscription</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="downgradeDialogOpen"
      :title="downgradeTitle"
      :message="downgradeMessage"
      confirm-label="Downgrade"
      danger
      @confirm="confirmDowngrade"
    />

  </div>
</template>

<style scoped lang="scss">
.billing-view {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.billing-tabs :deep(.v-tab) {
  letter-spacing: 0;
  min-width: 0;
}

.billing-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}

.billing-card {
  padding: 20px 22px;
}

.billing-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.billing-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.billing-card__title--danger {
  color: rgb(var(--v-theme-error));
}

/* ─── Plan banner ─────────────────────────────────────────── */
.plan-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-secondary), 0.85) 100%);
  color: rgb(var(--v-theme-on-primary));
}

.plan-banner__chip {
  background: color-mix(in oklch, rgb(var(--v-theme-on-primary)) 18%, transparent) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-bottom: 8px;
}

.plan-banner__price {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.plan-banner__cycle {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.85;
}

.plan-banner__meta {
  margin-top: 6px;
  font-size: 12.5px;
  color: color-mix(in oklch, rgb(var(--v-theme-on-primary)) 78%, transparent);
}

.plan-banner__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.plan-banner__cta {
  color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600;
}

.plan-banner__link {
  color: color-mix(in oklch, rgb(var(--v-theme-on-primary)) 85%, transparent) !important;
}

/* ─── Subscriptions ───────────────────────────────────────── */
.subscription-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.subscription-card {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.subscription-card__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: color-mix(in oklch, rgb(var(--v-theme-primary)) 12%, transparent);
}

.subscription-card__body {
  flex: 1;
  min-width: 0;
}

.subscription-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.subscription-card__name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.subscription-card__meta {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

.subscription-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

/* ─── Products ────────────────────────────────────────────── */
.product-list,
.doc-list {
  display: flex;
  flex-direction: column;
}

.product-row,
.doc-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 2px;
}

.product-row + .product-row,
.doc-row + .doc-row {
  border-top: 1px solid var(--border-subtle);
}

.product-row__icon,
.doc-row__icon {
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.product-row__copy,
.doc-row__copy {
  flex: 1;
  min-width: 0;
}

.product-row__name,
.doc-row__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.product-row__tier,
.doc-row__meta {
  font-size: 12px;
  color: var(--muted);
}

/* ─── Add-on drawer ───────────────────────────────────────── */
.addon-drawer__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  /* The drawer body owns the space between its children. */
  margin: 0;
}

.addon-drawer__desc {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

.addon-drawer__price {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.addon-drawer__price span {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

/* ─── Cancel drawer ───────────────────────────────────────── */
.cancel-drawer__notice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  /* The drawer body owns the space between its children. */
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

/* ─── Usage ───────────────────────────────────────────────── */
.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.usage-card {
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.usage-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.usage-card__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.usage-card__values {
  font-size: 12px;
  color: var(--muted);
}

.usage-card__unlimited {
  font-size: 12px;
  color: rgb(var(--v-theme-success));
  font-weight: 600;
}

/* ─── Company info ────────────────────────────────────────── */
.info-grid {
  display: grid;
  gap: 0;
  margin: 0;
}

.info-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  padding: 12px 2px;
}

.info-row + .info-row {
  border-top: 1px solid var(--border-subtle);
}

.info-row__label {
  font-size: 13px;
  color: var(--muted);
}

.info-row__value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* ─── Payment / invoices ──────────────────────────────────── */
.payment-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: color-mix(in oklch, var(--surface-secondary) 34%, transparent);
}

.payment-row__copy {
  flex: 1;
}

.payment-row__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.payment-row__sub {
  font-size: 12px;
  color: var(--muted);
}

.invoice-table {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  overflow: hidden;
  background: var(--surface-primary);
}

/* ─── Danger zone ─────────────────────────────────────────── */
.danger-card {
  border-color: color-mix(in oklch, rgb(var(--v-theme-error)) 35%, var(--border-subtle)) !important;
}

.danger-card__copy {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 16px;
  max-width: 620px;
}

.danger-card__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .plan-banner__actions {
    align-items: stretch;
    width: 100%;
  }

  .payment-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .payment-row .v-btn {
    width: 100%;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
