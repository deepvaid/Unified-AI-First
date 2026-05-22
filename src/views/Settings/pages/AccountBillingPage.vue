<script setup lang="ts">
import SettingsPageHeader from '@/components/settings/SettingsPageHeader.vue'
import SettingsSection from '@/components/settings/SettingsSection.vue'

const usage = [
  { label: 'Emails Sent',     used: '12.4M',   limit: '50M',        pct: 25 },
  { label: 'Contacts',        used: '128,430', limit: 'Unlimited',  pct: 0 },
  { label: 'SMS Sent',        used: '3,240',   limit: '10,000',     pct: 32 },
  { label: 'Support Tickets', used: '847',     limit: 'Unlimited',  pct: 0 },
]

const invoices = [
  { date: 'Mar 1, 2026', desc: 'Enterprise Plan — March',    amt: '$1,499' },
  { date: 'Feb 1, 2026', desc: 'Enterprise Plan — February', amt: '$1,499' },
  { date: 'Jan 1, 2026', desc: 'Enterprise Plan — January',  amt: '$1,499' },
]
</script>

<template>
  <div class="settings-page">
    <SettingsPageHeader
      title="Account & Billing"
      subtitle="Manage your subscription, payment method, usage, and invoice history."
    />

    <div class="plan-banner">
      <div>
        <v-chip size="small" variant="flat" class="plan-banner__chip">MARKETING CLOUD ENTERPRISE</v-chip>
        <div class="plan-banner__price">$1,499<span class="plan-banner__cycle"> / month</span></div>
        <div class="plan-banner__meta">50M emails · Unlimited contacts · Priority support</div>
      </div>
      <div class="plan-banner__actions">
        <v-btn variant="flat" color="white" class="text-none plan-banner__cta" prepend-icon="circle-arrow-up">Upgrade Plan</v-btn>
        <v-btn variant="text" class="text-none plan-banner__link" size="small">View usage details</v-btn>
      </div>
    </div>

    <SettingsSection title="Usage This Month">
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
    </SettingsSection>

    <SettingsSection title="Payment Method">
      <div class="payment-row">
        <v-icon color="primary" size="30">credit-card</v-icon>
        <div class="payment-row__copy">
          <div class="payment-row__title">Visa ending in 4242</div>
          <div class="payment-row__sub">Expires 12/2028</div>
        </div>
        <v-btn variant="flat" size="small" color="primary" class="text-none">Change Card</v-btn>
      </div>
    </SettingsSection>

    <SettingsSection title="Recent Invoices">
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
    </SettingsSection>
  </div>
</template>

<style scoped lang="scss">

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
}
</style>
