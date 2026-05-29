<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
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

const products = [
  { name: 'Marketing Cloud',  tier: 'Enterprise', icon: 'megaphone',     active: true },
  { name: 'Commerce Cloud',   tier: 'Pro',        icon: 'shopping-cart', active: true },
  { name: 'Service Cloud',    tier: 'Starter',    icon: 'headset',       active: true },
  { name: 'Data Platform',    tier: 'Add-on',     icon: 'database',      active: false },
]

const usage = [
  { label: 'Emails Sent',     used: '12.4M',   limit: '50M',        pct: 25 },
  { label: 'Contacts',        used: '128,430', limit: 'Unlimited',  pct: 0 },
  { label: 'SMS Sent',        used: '3,240',   limit: '10,000',     pct: 32 },
  { label: 'Support Tickets', used: '847',     limit: 'Unlimited',  pct: 0 },
]

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
      <div class="plan-banner">
        <div>
          <v-chip size="small" variant="flat" class="plan-banner__chip">MARKETING CLOUD ENTERPRISE</v-chip>
          <div class="plan-banner__price">$1,499<span class="plan-banner__cycle"> / month</span></div>
          <div class="plan-banner__meta">50M emails · Unlimited contacts · Priority support</div>
        </div>
        <div class="plan-banner__actions">
          <v-btn variant="flat" color="white" class="text-none plan-banner__cta" prepend-icon="circle-arrow-up">Upgrade Plan</v-btn>
          <v-btn variant="text" class="text-none plan-banner__link" size="small">Change or cancel plan</v-btn>
        </div>
      </div>

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
          <div v-for="u in usage" :key="u.label" class="usage-card">
            <div class="usage-card__head">
              <span class="usage-card__label">{{ u.label }}</span>
              <span class="usage-card__values">{{ u.used }} / {{ u.limit }}</span>
            </div>
            <v-progress-linear v-if="u.pct > 0" :model-value="u.pct" color="primary" rounded height="6" />
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
          <v-btn variant="outlined" color="error" class="text-none">Cancel subscription</v-btn>
          <v-btn variant="flat" color="error" class="text-none">Delete account</v-btn>
        </div>
      </v-card>
    </section>
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
  color: var(--ink);
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
  border-top: 1px solid var(--hairline);
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
  color: var(--ink);
}

.product-row__tier,
.doc-row__meta {
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
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-2) 34%, transparent);
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
  color: var(--ink);
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
  border-top: 1px solid var(--hairline);
}

.info-row__label {
  font-size: 13px;
  color: var(--muted);
}

.info-row__value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

/* ─── Payment / invoices ──────────────────────────────────── */
.payment-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: color-mix(in oklch, var(--surface-2) 34%, transparent);
}

.payment-row__copy {
  flex: 1;
}

.payment-row__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
}

.payment-row__sub {
  font-size: 12px;
  color: var(--muted);
}

.invoice-table {
  border: 1px solid var(--hairline);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-1);
}

/* ─── Danger zone ─────────────────────────────────────────── */
.danger-card {
  border-color: color-mix(in oklch, rgb(var(--v-theme-error)) 35%, var(--hairline)) !important;
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
