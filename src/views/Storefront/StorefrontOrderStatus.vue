<script setup lang="ts">
import { inject } from 'vue'
import type { ShopperOrderStatus, ShopperOrderStatusKey } from '@/storefront/orderStatus'
import { STOREFRONT } from './storefrontContext'

// An order's status as its shopper sees it (src/storefront/orderStatus.ts): an icon
// and the word, never the colour alone. On the account page and the order's page.
// The sections drawing draws it in the theme's own surface, text and divider, square
// as the theme is, with only the icon in the status's colour.

defineProps<{ status: ShopperOrderStatus }>()

const sections = inject(STOREFRONT, null)?.sectionsDrawing

const ICONS: Record<ShopperOrderStatusKey, string> = {
  preparing: 'package',
  'awaiting-payment': 'clock',
  'payment-problem': 'circle-alert',
  shipped: 'truck',
  delivered: 'circle-check',
  cancelled: 'circle-x',
  refunded: 'rotate-ccw',
}
</script>

<template>
  <span class="sf-order-status" :class="[`sf-order-status--${status.key}`, { 'sf-order-status--sections': sections }]">
    <v-icon size="16" aria-hidden="true">{{ ICONS[status.key] }}</v-icon>
    {{ status.label }}
  </span>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. Each tone sets its own
   text colour on its own fill, so a dark theme cannot put dark text on it. */
.sf-order-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 10px;
  border-radius: 999px;
  background: #ececec;
  color: #3d3d3d;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
}

.sf-order-status--preparing {
  background: #eef1f6;
  color: #23364f;
}

.sf-order-status--awaiting-payment {
  background: #fff1cc;
  color: #6b4300;
}

.sf-order-status--payment-problem {
  background: #fde4e4;
  color: #8f1414;
}

.sf-order-status--shipped {
  background: #e3eefa;
  color: #123a63;
}

.sf-order-status--delivered {
  background: #e3f2e6;
  color: #1b4d20;
}

/* The sections drawing: the theme's quiet surface and text, the meaning in the icon's
   colour (each at least 5:1 on Northfold's surface) and the word. */
.sf-order-status--sections {
  --sf-status-tone: var(--sf-muted, #5f5f5f);
  padding: 3px 10px 3px 8px;
  border: 1px solid var(--sf-divider, #e3e3e0);
  border-radius: var(--sf-corner, 0px);
  background: var(--sf-surface, #f7f7f5);
  color: var(--sf-text, #121011);
  font-weight: 500;
}

.sf-order-status--sections :deep(.v-icon) {
  color: var(--sf-status-tone);
}

.sf-order-status--sections.sf-order-status--preparing,
.sf-order-status--sections.sf-order-status--shipped { --sf-status-tone: #2f5d8a; }
.sf-order-status--sections.sf-order-status--awaiting-payment { --sf-status-tone: #8a5a00; }
.sf-order-status--sections.sf-order-status--payment-problem { --sf-status-tone: #b3261e; }
.sf-order-status--sections.sf-order-status--delivered { --sf-status-tone: #2e6b34; }
</style>
