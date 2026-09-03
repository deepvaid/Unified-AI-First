<script setup lang="ts">
import { ref } from 'vue'
import { useRevealOnce } from '../reveal'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const rootEl = ref<HTMLElement | null>(null)
const revealed = useRevealOnce(rootEl, 0.08)

// Playground models so the wall is genuinely interactive.
const storeName = ref('Scooter Village')
const plan = ref('Professional')
const autoPublish = ref(true)
const emailReceipts = ref(true)

const CHIP_ROWS = [
  { label: 'Orders', type: 'order', statuses: ['Processing', 'Completed', 'Cancelled'] },
  { label: 'Payments', type: 'payment', statuses: ['Paid', 'Pending', 'Refunded'] },
  { label: 'Campaigns', type: 'campaign', statuses: ['Active', 'Scheduled', 'Draft'] },
  { label: 'Tickets', type: 'ticket', statuses: ['Open', 'Escalated', 'Resolved'] },
  { label: 'Connections', type: 'connection', statuses: ['Connected', 'Needs setup', 'Sync issue'] },
] as const
</script>

<template>
  <section ref="rootEl" class="wall">
    <div class="wall__header">
      <div class="mp-eyebrow">Live components</div>
      <h2 class="mp-display-sm mt-2">Not screenshots. Running code.</h2>
      <p class="wall__sub mt-3">
        Poke anything — every element on this wall is the same component the product pages use.
      </p>
    </div>

    <v-row class="wall__grid mt-8" :class="{ 'wall__grid--in': revealed }">
      <!-- Buttons -->
      <v-col cols="12" sm="6" lg="4" class="wall__tile" :style="{ '--i': 0 }">
        <v-card flat border rounded="lg" class="pa-5 h-100">
          <div class="mp-eyebrow mb-4">Buttons</div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus">Create campaign</v-btn>
            <v-btn color="primary" variant="tonal" class="text-none">Preview</v-btn>
          </div>
          <div class="d-flex flex-wrap ga-2 mt-3">
            <v-btn variant="outlined" class="text-none" prepend-icon="download">Export</v-btn>
            <v-btn variant="text" class="text-none">Cancel</v-btn>
          </div>
          <div class="d-flex flex-wrap ga-2 mt-4 align-center">
            <v-btn color="primary" variant="flat" size="small" class="text-none">Save</v-btn>
            <v-btn variant="tonal" size="small" class="text-none" prepend-icon="copy">Duplicate</v-btn>
            <v-btn variant="outlined" size="small" class="text-none" icon="ellipsis" />
          </div>
        </v-card>
      </v-col>

      <!-- Status chips -->
      <v-col cols="12" sm="6" lg="4" class="wall__tile" :style="{ '--i': 1 }">
        <v-card flat border rounded="lg" class="pa-5 h-100">
          <div class="mp-eyebrow mb-4">Status — one component, every domain</div>
          <div v-for="row in CHIP_ROWS" :key="row.label" class="wall__chip-row">
            <span class="wall__chip-label">{{ row.label }}</span>
            <span class="d-flex flex-wrap ga-1">
              <MpStatusChip
                v-for="status in row.statuses"
                :key="status"
                :status="status"
                :type="row.type"
                size="md"
              />
            </span>
          </div>
        </v-card>
      </v-col>

      <!-- KPI card -->
      <v-col cols="12" sm="6" lg="4" class="wall__tile" :style="{ '--i': 2 }">
        <MpKpiCard
          label="Total revenue"
          period="Last 30 days"
          value="$48,210"
          icon="circle-dollar-sign"
          trend="+12.4% vs prior"
          sub-stat="1,982 orders · AOV $24.33"
          class="h-100"
        />
      </v-col>

      <!-- Form fields -->
      <v-col cols="12" sm="6" lg="4" class="wall__tile" :style="{ '--i': 3 }">
        <v-card flat border rounded="lg" class="pa-5 h-100">
          <div class="mp-eyebrow mb-4">Forms</div>
          <v-text-field
            v-model="storeName"
            label="Store name"
            prepend-inner-icon="store"
            hide-details
          />
          <v-select
            v-model="plan"
            label="Plan"
            :items="['Growth', 'Professional', 'Enterprise']"
            hide-details
            class="mt-3"
          />
          <v-switch
            v-model="autoPublish"
            label="Auto-publish new products"
            density="compact"
            hide-details
            class="mt-2"
          />
          <v-checkbox
            v-model="emailReceipts"
            label="Email receipts to customers"
            density="compact"
            hide-details
          />
        </v-card>
      </v-col>

      <!-- Feedback -->
      <v-col cols="12" sm="6" lg="4" class="wall__tile" :style="{ '--i': 4 }">
        <v-card flat border rounded="lg" class="pa-5 h-100">
          <div class="mp-eyebrow mb-4">Feedback</div>
          <v-alert type="success" variant="tonal" density="compact" rounded="lg">
            Payment captured — order #10482 is ready to fulfill.
          </v-alert>
          <v-progress-linear :model-value="72" color="primary" height="6" rounded class="mt-4" />
          <div class="d-flex flex-wrap ga-1 mt-4">
            <v-chip size="small" label>BFCM</v-chip>
            <v-chip size="small" label>Repeat buyers</v-chip>
            <v-chip size="small" label color="primary">High AOV</v-chip>
          </div>
          <div class="d-flex align-center ga-2 mt-4">
            <v-progress-circular indeterminate size="20" width="2" color="primary" />
            <span class="text-caption text-medium-emphasis">Syncing catalog…</span>
          </div>
        </v-card>
      </v-col>

      <!-- Hero KPI -->
      <v-col cols="12" sm="6" lg="4" class="wall__tile" :style="{ '--i': 5 }">
        <MpKpiCard
          label="Checkout uptime"
          period="This quarter"
          value="99.98%"
          icon="activity"
          color="success"
          trend="+0.02% this quarter"
          emphasis="prominent"
          class="h-100"
        />
      </v-col>
    </v-row>

    <p class="wall__caption mt-6">
      Same components, same tokens, same theme as every product screen in the sandbox — nothing on
      this wall is a mockup.
    </p>
  </section>
</template>

<style scoped>
.wall {
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  padding: var(--mp-space-80) var(--mp-space-24);
}

.wall__header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.wall__sub {
  margin: 0 auto;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-16);
  line-height: var(--mp-lineHeight-normal);
}

.wall__tile {
  opacity: 0;
}

.wall__grid--in .wall__tile {
  animation: wall-rise var(--mp-motion-duration-entrance) var(--mp-motion-easing-standard) both;
  animation-delay: calc(var(--i) * var(--mp-motion-stagger-step) * 2);
}

@keyframes wall-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.wall__chip-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-space-4) 0;
}

.wall__chip-label {
  width: 88px;
  flex-shrink: 0;
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
}

.wall__caption {
  text-align: center;
  max-width: 560px;
  margin-inline: auto;
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
}

@media (prefers-reduced-motion: reduce) {
  .wall__tile {
    opacity: 1;
    animation: none !important;
  }
}
</style>
