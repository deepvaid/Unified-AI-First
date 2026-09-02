<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
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

const tabs: { key: BillingTab; label: string }[] = [
  { key: 'overview',     label: 'Overview' },
  { key: 'usage',        label: 'Usage & Limits' },
  { key: 'company',      label: 'Company Info' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'documents',    label: 'Documents' },
  { key: 'delete',       label: 'Delete Account' },
]

// MpFilterTabs models a string; the section keys are the BillingTab union.
const activeTab = ref<string>('overview')

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
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Account & Billing"
      subtitle="Manage your subscription, products, usage, and invoices."
      :back-to="{ name: 'Dashboard', params: { accountId } }"
    >
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabs" aria-label="Billing sections" controls-id="billing-section" />
      </template>
    </MpPageHeader>

    <!-- Overview -->
    <section v-if="activeTab === 'overview'" id="billing-section" class="d-flex flex-column gap-5">
      <MpAlert v-if="statusStrip" :tone="statusStrip.tone" :icon="statusStrip.icon">
        {{ statusStrip.text }}
        <template #actions>
          <v-btn
            variant="flat"
            size="small"
            :color="statusStrip.tone === 'info' ? 'primary' : statusStrip.tone"
            @click="statusStrip.action"
          >
            {{ statusStrip.actionLabel }}
          </v-btn>
        </template>
      </MpAlert>

      <div class="plan-banner">
        <div class="d-flex flex-column">
          <span class="plan-banner__chip mp-meta-label">{{ bannerChipText }}</span>
          <div class="plan-banner__price">{{ bannerHeadline }}</div>
          <div class="plan-banner__meta">{{ bannerMeta }}</div>
        </div>
        <div class="plan-banner__actions">
          <v-btn variant="flat" color="surface" prepend-icon="circle-arrow-up" @click="goToPlans">Upgrade Plan</v-btn>
          <v-btn variant="text" color="on-primary" size="small" @click="openCancelDrawer">Change or cancel plan</v-btn>
        </div>
      </div>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Current Subscriptions</h2>
        </div>
        <div class="subscription-grid">
          <div v-for="card in subscriptionCards" :key="card.cloud" class="subscription-card">
            <div class="billing-disc">
              <v-icon size="20">{{ card.icon }}</v-icon>
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
                <v-btn variant="text" size="small" color="primary" @click="goToPlans">Change plan</v-btn>
                <v-btn v-if="card.canDowngrade" variant="text" size="small" @click="openDowngrade(card.cloud)">Downgrade</v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Products &amp; Add-ons</h2>
          <v-btn variant="text" size="small" color="primary" append-icon="external-link">See all features</v-btn>
        </div>
        <div class="d-flex flex-column">
          <MpListRow v-for="p in products" :key="p.name" variant="divided">
            <template #lead>
              <v-icon size="16" color="primary">{{ p.icon }}</v-icon>
            </template>
            <span class="billing-row__name">{{ p.name }}</span>
            <span class="billing-row__meta">{{ p.tier }}</span>
            <template #trailing>
              <MpStatusChip :status="p.active ? 'Active' : 'Available'" size="sm" />
            </template>
          </MpListRow>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Add-ons</h2>
        </div>
        <div class="d-flex flex-column">
          <MpListRow v-for="a in addOnRows" :key="a.key" variant="divided">
            <template #lead>
              <v-icon size="16" color="primary">{{ a.icon }}</v-icon>
            </template>
            <span class="billing-row__name">{{ a.name }}</span>
            <span class="billing-row__meta">{{ a.description }} · {{ a.priceLabel }}</span>
            <template #trailing>
              <MpStatusChip v-if="a.owned" status="Active" size="sm" />
              <v-btn v-else-if="a.monthly !== null" variant="text" size="small" color="primary" prepend-icon="plus" @click="openAddonDrawer(a)">Add</v-btn>
              <v-btn v-else variant="outlined" size="small" color="primary" @click="talkToSales">Talk to sales</v-btn>
            </template>
          </MpListRow>
        </div>
      </v-card>

      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Payment Method</h2>
        </div>
        <div class="payment-row">
          <div class="billing-disc">
            <v-icon size="20">credit-card</v-icon>
          </div>
          <div class="payment-row__copy">
            <div class="billing-row__name">Visa ending in 4242</div>
            <div class="billing-row__meta">Expires 12/2028</div>
          </div>
          <v-btn variant="outlined" size="small" color="primary">Change Card</v-btn>
        </div>
      </v-card>
    </section>

    <!-- Usage & Limits -->
    <section v-else-if="activeTab === 'usage'" id="billing-section" class="d-flex flex-column gap-5">
      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Usage This Month</h2>
        </div>
        <div class="usage-grid">
          <div v-for="u in usageRows" :key="u.label" class="usage-card">
            <div class="usage-card__head">
              <span class="billing-row__name">{{ u.label }}</span>
              <span class="billing-row__meta tabular">{{ u.used }} / {{ u.limit }}</span>
            </div>
            <v-progress-linear v-if="!u.unlimited" :model-value="u.pct" color="primary" rounded height="6" />
            <div v-else class="usage-card__unlimited">Unlimited</div>
          </div>
        </div>
      </v-card>
    </section>

    <!-- Company Info -->
    <section v-else-if="activeTab === 'company'" id="billing-section" class="d-flex flex-column gap-5">
      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Company Information</h2>
          <v-btn variant="outlined" size="small" color="primary">Edit</v-btn>
        </div>
        <dl class="mp-label-value company-info">
          <div v-for="c in company" :key="c.label">
            <dt class="text-medium-emphasis">{{ c.label }}</dt>
            <dd>{{ c.value }}</dd>
          </div>
        </dl>
      </v-card>
    </section>

    <!-- Transactions -->
    <section v-else-if="activeTab === 'transactions'" id="billing-section" class="d-flex flex-column gap-5">
      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Recent Transactions</h2>
        </div>
        <v-table density="comfortable" class="invoice-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th class="text-right">Amount</th>
              <th>Status</th>
              <th><span class="d-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(inv, i) in invoices" :key="i">
              <td class="tabular">{{ inv.date }}</td>
              <td>{{ inv.desc }}</td>
              <td class="text-right tabular x-strong">{{ inv.amt }}</td>
              <td><MpStatusChip status="Paid" type="payment" size="sm" /></td>
              <td class="text-right">
                <v-btn icon variant="text" size="small" aria-label="Download invoice">
                  <v-icon>download</v-icon>
                  <v-tooltip activator="parent" location="top">Download invoice</v-tooltip>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </section>

    <!-- Documents -->
    <section v-else-if="activeTab === 'documents'" id="billing-section" class="d-flex flex-column gap-5">
      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title">Documents</h2>
        </div>
        <div class="d-flex flex-column">
          <MpListRow v-for="d in documents" :key="d.name" variant="divided">
            <template #lead>
              <v-icon size="16" color="primary">file-text</v-icon>
            </template>
            <span class="billing-row__name">{{ d.name }}</span>
            <span class="billing-row__meta">{{ d.meta }}</span>
            <template #trailing>
              <v-btn icon variant="text" size="small" :aria-label="`Download ${d.name}`">
                <v-icon>download</v-icon>
                <v-tooltip activator="parent" location="top">Download</v-tooltip>
              </v-btn>
            </template>
          </MpListRow>
        </div>
      </v-card>
    </section>

    <!-- Delete Account -->
    <section v-else id="billing-section" class="d-flex flex-column gap-5">
      <v-card flat border rounded="lg" class="billing-card">
        <div class="billing-card__head">
          <h2 class="mp-section-title text-error">Cancel or delete account</h2>
        </div>
        <p class="danger-card__copy">
          Cancelling stops billing at the end of your current cycle and downgrades you to read-only
          access. Deleting permanently removes your account, data, and integrations — this cannot be undone.
        </p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn variant="outlined" color="error" @click="openCancelDrawer">Cancel subscription</v-btn>
          <v-btn variant="flat" color="error">Delete account</v-btn>
        </div>
      </v-card>
    </section>

    <!-- Add-on purchase drawer -->
    <MpFormDrawer v-model="addonDrawerOpen" title="Add add-on">
      <!-- Direct body children: the drawer shell's gap owns the rhythm. -->
      <template v-if="selectedAddon">
        <div class="billing-disc">
          <v-icon size="20">{{ selectedAddon.icon }}</v-icon>
        </div>
        <h3 class="mp-section-title">{{ selectedAddon.name }}</h3>
        <p class="addon-drawer__desc">{{ selectedAddon.description }}</p>
        <div class="addon-drawer__price">
          {{ selectedAddon.monthly !== null ? `$${selectedAddon.monthly}` : 'Custom' }}<span v-if="selectedAddon.monthly !== null"> / month</span>
        </div>
      </template>
      <template #footer>
        <v-btn variant="text" @click="addonDrawerOpen = false">Cancel</v-btn>
        <v-btn variant="flat" color="primary" @click="confirmPurchase">Confirm purchase</v-btn>
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
        <v-icon size="16">info</v-icon>
        You'll keep access until the end of your billing period. Your data is retained for 30 days after.
      </p>
      <template #footer>
        <v-btn variant="text" @click="cancelDrawerOpen = false">Keep my plan</v-btn>
        <v-btn variant="flat" color="error" @click="confirmCancel">Cancel subscription</v-btn>
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
.billing-card {
  padding: var(--mp-component-card-padding);
}

.billing-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
  margin-bottom: var(--mp-component-card-gap);
}

.tabular {
  font-variant-numeric: tabular-nums;
}

.x-strong {
  font-weight: var(--mp-fontWeight-semibold);
}

/* Shared row copy for MpListRow bodies, the payment row and usage cards. */
.billing-row__name {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-primary);
}

.billing-row__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}

/* Icon disc — the same 40px accent disc the App Directory cards use. */
.billing-disc {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--mp-space-40);
  height: var(--mp-space-40);
  border-radius: var(--mp-radius-12);
  background: var(--accent-soft);
  color: var(--accent-on-container);
}

/* ─── Plan banner ─────────────────────────────────────────── */
.plan-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--mp-space-16);
  padding: var(--mp-component-card-padding);
  border-radius: var(--mp-component-card-radius);
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: rgb(var(--v-theme-on-primary));
}

.plan-banner__chip {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  height: var(--mp-component-chip-height-sm);
  padding-inline: var(--mp-component-chip-paddingInline);
  border-radius: var(--mp-radius-full);
  margin-bottom: var(--mp-space-8);
  background: color-mix(in oklch, rgb(var(--v-theme-on-primary)) 18%, transparent);
  color: rgb(var(--v-theme-on-primary));
}

.plan-banner__price {
  font-size: var(--mp-fontSize-28);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1;
}

.plan-banner__meta {
  margin-top: var(--mp-space-6);
  font-size: var(--mp-fontSize-12);
  color: color-mix(in oklch, rgb(var(--v-theme-on-primary)) 78%, transparent);
}

.plan-banner__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--mp-space-4);
}

/* ─── Subscriptions ───────────────────────────────────────── */
.subscription-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--mp-space-12);
}

/* Tonal tile inside the bordered card: tint separates, no second hairline. */
.subscription-card,
.usage-card,
.payment-row {
  padding: var(--mp-space-14) var(--mp-space-16);
  border-radius: var(--mp-radius-12);
  background: var(--surface-secondary);
  color: var(--on-surface);
}

.subscription-card {
  display: flex;
  gap: var(--mp-space-12);
}

.subscription-card__body {
  flex: 1;
  min-width: 0;
}

.subscription-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-space-4);
}

.subscription-card__name {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.subscription-card__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
  line-height: 1.6;
}

.subscription-card__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-4);
  margin-top: var(--mp-space-6);
}

/* ─── Add-on drawer ───────────────────────────────────────── */
.addon-drawer__desc {
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
  /* The drawer body owns the space between its children. */
  margin: 0;
}

.addon-drawer__price {
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-bold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.addon-drawer__price span {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--on-surface-muted);
}

/* ─── Cancel drawer ───────────────────────────────────────── */
.cancel-drawer__notice {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-6);
  /* The drawer body owns the space between its children. */
  margin: 0;
  font-size: var(--mp-fontSize-12);
  color: var(--on-surface-muted);
}

/* ─── Usage ───────────────────────────────────────────────── */
.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--mp-space-12);
}

.usage-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--mp-space-8);
}

.usage-card__unlimited {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--pos);
}

/* ─── Company info ────────────────────────────────────────── */
.company-info {
  grid-template-columns: 1fr;
}

/* ─── Payment / invoices ──────────────────────────────────── */
.payment-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-16);
}

.payment-row__copy {
  flex: 1;
}

.invoice-table {
  background: transparent;
}

/* ─── Danger zone ─────────────────────────────────────────── */
.danger-card__copy {
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
  margin: 0 0 var(--mp-space-16);
  max-width: var(--mp-component-state-measureWide);
}

@media (max-width: $mp-layout-breakpointCompact) {
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
}
</style>
