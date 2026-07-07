<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCampaignsStore } from '@/stores/useCampaigns'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

const route = useRoute()
const store = useCampaignsStore()

const accountId = computed(() => route.params.accountId as string)
const campaignId = computed(() => Number(route.params.id))
const campaign = computed(() => store.campaigns.find(c => c.id === campaignId.value))

const tab = ref<'dashboard' | 'overlay' | 'isp' | 'details'>('dashboard')

const backTo = computed(() => ({ name: 'CampaignReports', params: { accountId: accountId.value } }))

function pct(part: number, whole: number): number {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}
function fmt(n: number): string {
  return n.toLocaleString('en-US')
}
function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// Delivered is derived: assume 98.6% of sent reached the inbox (bounces excluded).
const delivered = computed(() => (campaign.value ? Math.round(campaign.value.metrics.sent * 0.986) : 0))

const openRate = computed(() => (campaign.value ? pct(campaign.value.metrics.opens, delivered.value) : 0))
const clickRate = computed(() => (campaign.value ? pct(campaign.value.metrics.clicks, delivered.value) : 0))
const ctor = computed(() => (campaign.value ? pct(campaign.value.metrics.clicks, campaign.value.metrics.opens) : 0))
const unsubRate = computed(() => (campaign.value ? pct(campaign.value.metrics.unsubscribes, delivered.value) : 0))

// Funnel stages, derived from the campaign's stored metrics.
const funnel = computed(() => {
  const c = campaign.value
  if (!c) return []
  return [
    { label: 'Sent', value: c.metrics.sent, color: 'default' },
    { label: 'Delivered', value: delivered.value, color: 'info' },
    { label: 'Opened', value: c.metrics.opens, color: 'marketing' },
    { label: 'Clicked', value: c.metrics.clicks, color: 'success' },
  ]
})

// 12-hour engagement curve — fixed hourly weights applied to this campaign's totals.
const HOUR_WEIGHTS = [0.02, 0.03, 0.05, 0.09, 0.14, 0.16, 0.13, 0.11, 0.09, 0.07, 0.06, 0.05]
const HOUR_LABELS = ['0h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h']
const timeline = computed(() => {
  const c = campaign.value
  if (!c) return []
  return HOUR_WEIGHTS.map((w, i) => ({
    label: HOUR_LABELS[i],
    opens: Math.round(c.metrics.opens * w),
    clicks: Math.round(c.metrics.clicks * w),
  }))
})
const peakOpens = computed(() => Math.max(1, ...timeline.value.map(t => t.opens)))

// Click overlay — top links as fixed shares of total clicks.
const LINK_MIX = [
  { label: 'Primary CTA — Shop the Sale', share: 0.46 },
  { label: 'Featured product tile', share: 0.21 },
  { label: 'View in browser', share: 0.12 },
  { label: 'Secondary CTA — Browse New In', share: 0.11 },
  { label: 'Unsubscribe / preferences', share: 0.06 },
  { label: 'Social — Instagram', share: 0.04 },
]
const links = computed(() => {
  const total = campaign.value?.metrics.clicks ?? 0
  return LINK_MIX.map(l => ({ label: l.label, clicks: Math.round(total * l.share), share: Math.round(l.share * 1000) / 10 }))
})

// ISP delivery split — fixed audience mix with per-ISP open rates.
const ISP_MIX = [
  { isp: 'Gmail', share: 0.44, openRate: 0.41 },
  { isp: 'Outlook / Hotmail', share: 0.23, openRate: 0.33 },
  { isp: 'Apple Mail', share: 0.16, openRate: 0.48 },
  { isp: 'Yahoo', share: 0.11, openRate: 0.29 },
  { isp: 'Other', share: 0.06, openRate: 0.24 },
]
const ispRows = computed(() => {
  const del = delivered.value
  return ISP_MIX.map(m => {
    const d = Math.round(del * m.share)
    return {
      isp: m.isp,
      delivered: d,
      deliveredShare: Math.round(m.share * 1000) / 10,
      opened: Math.round(d * m.openRate),
      openRate: Math.round(m.openRate * 1000) / 10,
    }
  })
})

const ispHeaders = [
  { title: 'Mailbox provider', key: 'isp' },
  { title: 'Delivered', key: 'delivered', align: 'end' as const },
  { title: 'Share', key: 'deliveredShare', align: 'end' as const },
  { title: 'Opened', key: 'opened', align: 'end' as const },
  { title: 'Open rate', key: 'openRate', align: 'end' as const },
]

const details = computed(() => {
  const c = campaign.value
  if (!c) return []
  return [
    { label: 'Campaign name', value: c.name },
    { label: 'Audience / list', value: c.listName },
    { label: 'Sent date', value: c.sentDate ?? 'Not sent yet' },
    { label: 'From name', value: 'Maropost Store' },
    { label: 'From address', value: 'hello@maropoststore.com' },
    { label: 'Reply-to', value: 'support@maropoststore.com' },
    { label: 'Subject line', value: c.name },
  ]
})
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <template v-if="campaign">
      <MpPageHeader :title="campaign.name" :subtitle="`Campaign report · ${campaign.listName}`" :back-to="backTo">
        <template #actions>
          <MpStatusChip :status="campaign.status" type="campaign" size="small" />
          <v-btn variant="flat" color="surface" prepend-icon="download" class="text-none">Export</v-btn>
        </template>
        <template #tabs>
          <v-tabs v-model="tab" color="primary" density="comfortable" class="mt-2">
            <v-tab value="dashboard" class="text-none">Dashboard</v-tab>
            <v-tab value="overlay" class="text-none">Click overlay</v-tab>
            <v-tab value="isp" class="text-none">ISP</v-tab>
            <v-tab value="details" class="text-none">Details</v-tab>
          </v-tabs>
        </template>
      </MpPageHeader>

      <div class="flex-grow-1 overflow-y-auto">
        <!-- Dashboard -->
        <div v-if="tab === 'dashboard'" class="d-flex flex-column gap-5">
          <v-row dense>
            <v-col cols="12" sm="6" md="3">
              <MpKpiCard label="Delivered" :value="fmt(delivered)" icon="send" color="info"
                :sub-stat="`${fmt(campaign.metrics.sent)} sent`" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <MpKpiCard label="Open rate" :value="`${openRate}%`" icon="mail-open" color="marketing"
                :sub-stat="`${fmt(campaign.metrics.opens)} opens`" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <MpKpiCard label="Click rate" :value="`${clickRate}%`" icon="mouse-pointer-click" color="success"
                :sub-stat="`${fmt(campaign.metrics.clicks)} clicks · ${ctor}% CTOR`" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <MpKpiCard label="Revenue" :value="money(campaign.metrics.revenue)" icon="dollar-sign" color="commerce"
                :sub-stat="`${unsubRate}% unsub rate`" />
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="12" md="7">
              <v-card flat border rounded="lg" class="pa-5 h-100">
                <div class="text-subtitle-2 font-weight-bold mb-1">Engagement over time</div>
                <div class="text-caption text-medium-emphasis mb-4">Opens and clicks in the 24 hours after send</div>
                <div class="crd-chart d-flex align-end ga-2">
                  <div v-for="t in timeline" :key="t.label" class="crd-chart__col d-flex flex-column align-center ga-1">
                    <div class="crd-chart__bars d-flex align-end justify-center ga-1">
                      <div class="crd-chart__bar crd-chart__bar--opens" :style="{ height: `${(t.opens / peakOpens) * 100}%` }"
                        :title="`${fmt(t.opens)} opens`" />
                      <div class="crd-chart__bar crd-chart__bar--clicks" :style="{ height: `${(t.clicks / peakOpens) * 100}%` }"
                        :title="`${fmt(t.clicks)} clicks`" />
                    </div>
                    <div class="text-caption text-medium-emphasis">{{ t.label }}</div>
                  </div>
                </div>
                <div class="d-flex ga-4 mt-4">
                  <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                    <span class="crd-swatch crd-swatch--opens" /> Opens
                  </div>
                  <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                    <span class="crd-swatch crd-swatch--clicks" /> Clicks
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="5">
              <v-card flat border rounded="lg" class="pa-5 h-100">
                <div class="text-subtitle-2 font-weight-bold mb-4">Delivery funnel</div>
                <div class="d-flex flex-column ga-3">
                  <div v-for="stage in funnel" :key="stage.label">
                    <div class="d-flex justify-space-between text-body-2 mb-1">
                      <span>{{ stage.label }}</span>
                      <span class="font-weight-medium">{{ fmt(stage.value) }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="pct(stage.value, campaign.metrics.sent)"
                      :color="stage.color"
                      height="8"
                      rounded
                      bg-color="surface-variant"
                    />
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Click overlay -->
        <v-card v-else-if="tab === 'overlay'" flat border rounded="lg" class="pa-5">
          <div class="text-subtitle-2 font-weight-bold mb-1">Link performance</div>
          <div class="text-caption text-medium-emphasis mb-4">Share of total clicks by link</div>
          <div class="d-flex flex-column ga-4">
            <div v-for="link in links" :key="link.label">
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span class="min-width-0 text-truncate">{{ link.label }}</span>
                <span class="font-weight-medium flex-shrink-0 ml-3">{{ fmt(link.clicks) }} · {{ link.share }}%</span>
              </div>
              <v-progress-linear :model-value="link.share" color="marketing" height="8" rounded bg-color="surface-variant" />
            </div>
          </div>
        </v-card>

        <!-- ISP -->
        <v-card v-else-if="tab === 'isp'" flat border rounded="lg" class="overflow-hidden">
          <v-data-table :headers="ispHeaders" :items="ispRows" density="comfortable" hide-default-footer :items-per-page="-1">
            <template #item.delivered="{ item }">{{ fmt(item.delivered) }}</template>
            <template #item.deliveredShare="{ item }">{{ item.deliveredShare }}%</template>
            <template #item.opened="{ item }">{{ fmt(item.opened) }}</template>
            <template #item.openRate="{ item }">
              <span class="font-weight-medium">{{ item.openRate }}%</span>
            </template>
          </v-data-table>
        </v-card>

        <!-- Details -->
        <v-card v-else flat border rounded="lg" class="pa-5">
          <div class="text-subtitle-2 font-weight-bold mb-4">Campaign details</div>
          <v-row>
            <v-col v-for="d in details" :key="d.label" cols="12" sm="6">
              <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-1">{{ d.label }}</div>
              <div class="text-body-2">{{ d.value }}</div>
            </v-col>
          </v-row>
        </v-card>
      </div>
    </template>

    <MpEmptyState
      v-else
      icon="bar-chart-2"
      title="Campaign not found"
      description="This campaign report doesn’t exist or hasn’t been sent yet."
      action-label="Back to Campaign Reports"
      action-icon="arrow-left"
      class="my-auto"
      @action="$router.push(backTo)"
    />
  </div>
</template>

<style scoped>
.crd-chart {
  height: 180px;
}
.crd-chart__col {
  flex: 1 1 0;
  height: 100%;
}
.crd-chart__bars {
  flex-grow: 1;
  width: 100%;
  height: 100%;
}
.crd-chart__bar {
  width: 10px;
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 200ms ease;
}
.crd-chart__bar--opens {
  background: rgb(var(--v-theme-marketing, var(--v-theme-secondary)));
  background: var(--cloud-marketing-accent, rgb(var(--v-theme-secondary)));
}
.crd-chart__bar--clicks {
  background: rgb(var(--v-theme-success));
}
.crd-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}
.crd-swatch--opens {
  background: var(--cloud-marketing-accent, rgb(var(--v-theme-secondary)));
}
.crd-swatch--clicks {
  background: rgb(var(--v-theme-success));
}
</style>
