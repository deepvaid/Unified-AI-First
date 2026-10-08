<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const props = withDefaults(defineProps<{
  status: string
  type?: 'order' | 'fulfillment' | 'payment' | 'payout' | 'dispute' | 'method' | 'readiness' | 'campaign' | 'contact' | 'ticket' | 'coupon' | 'priority' | 'connection' | 'stock' | 'report' | 'general'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'flat' | 'tonal' | 'outlined'
  showIcon?: boolean
}>(), {
  type: 'general',
  size: 'md',
  variant: 'tonal',
  showIcon: false,
})

const toneMap: Record<string, Record<string, Tone>> = {
  order: {
    processing: 'brand', completed: 'success', cancelled: 'danger',
    refunded: 'danger', 'on hold': 'warning', archived: 'neutral',
  },
  fulfillment: {
    unapproved: 'warning', 'not ready': 'neutral', 'ready for fulfillment': 'brand',
    shipped: 'success', 'return requested': 'danger', cancelled: 'danger',
    fulfilled: 'success', unfulfilled: 'warning', partial: 'brand',
    'awaiting fulfillment': 'warning', picking: 'brand', packed: 'brand', 'ready to ship': 'success',
  },
  payment: {
    paid: 'success', refunded: 'danger', voided: 'neutral', pending: 'warning',
    failed: 'danger', authorised: 'brand', 'partially refunded': 'warning', disputed: 'danger',
    // Maropay payment wording (Succeeded / Processing / Cancelled).
    succeeded: 'success', processing: 'warning', cancelled: 'neutral',
  },
  // Maropay payouts. "Sent to bank" is the confirmed event — never "received".
  payout: {
    upcoming: 'brand', 'in transit': 'warning', 'sent to bank': 'success', failed: 'danger',
  },
  dispute: {
    'needs response': 'danger', 'under review': 'warning', won: 'success', lost: 'danger', accepted: 'neutral',
  },
  // A payment method's state on one store.
  method: {
    available: 'neutral', 'setup required': 'warning', 'pending approval': 'warning',
    enabled: 'success', unavailable: 'neutral',
  },
  // Maropay's account/store state dimensions — one map, so "submitted", "verified",
  // "ready to activate" and "live" read as distinct steps rather than one "Connected".
  readiness: {
    'not started': 'neutral', 'in progress': 'brand', submitted: 'brand', 'not submitted': 'neutral',
    'under review': 'warning', 'action required': 'danger', verified: 'success', rejected: 'danger', declined: 'danger',
    'not enabled': 'neutral', enabled: 'success', restricted: 'danger', disabled: 'neutral',
    ready: 'success', paused: 'warning', inactive: 'neutral', 'needs setup': 'warning', 'ready to activate': 'brand', live: 'success',
  },
  campaign: {
    sent: 'success', scheduled: 'brand', draft: 'neutral', sending: 'warning',
    active: 'success', paused: 'warning', completed: 'success', failed: 'danger',
    archived: 'neutral', aborted: 'danger', recurring: 'brand',
  },
  contact: {
    active: 'success', subscribed: 'success', unsubscribed: 'neutral', bounced: 'danger',
    pending: 'warning', confirmed: 'success', suspended: 'danger',
    suppressed: 'neutral', spam: 'danger', 'hard bounce': 'danger',
  },
  ticket: {
    open: 'brand', 'in progress': 'warning', 'awaiting reply': 'brand',
    resolved: 'success', closed: 'neutral', 'on hold': 'warning',
    escalated: 'danger', new: 'brand', pending: 'warning',
  },
  coupon: {
    active: 'success', expired: 'neutral', scheduled: 'brand',
    used: 'neutral', disabled: 'neutral',
  },
  priority: {
    critical: 'danger', urgent: 'danger', high: 'danger',
    medium: 'warning', normal: 'neutral', low: 'neutral',
  },
  connection: {
    connected: 'success', disconnected: 'neutral', 'needs setup': 'warning',
    'sync issue': 'danger', 'auth expired': 'danger', syncing: 'warning',
    error: 'danger', healthy: 'success',
    // A store's payment providers: connected and offering, connected but not finished, or switched off.
    active: 'success', 'setup incomplete': 'warning', inactive: 'neutral',
  },
  stock: {
    'in stock': 'success', 'low stock': 'warning', 'out of stock': 'danger',
    backordered: 'warning', discontinued: 'neutral',
  },
  report: {
    // A saved report's Status column shows its schedule mode, not an execution state.
    scheduled: 'warning', recurring: 'brand',
  },
  general: {
    active: 'success', inactive: 'neutral', pending: 'warning', error: 'danger',
    published: 'success', draft: 'neutral', archived: 'neutral',
    enabled: 'success', disabled: 'neutral', failed: 'danger',
    success: 'success', required: 'brand', optional: 'neutral',
    running: 'brand', paused: 'warning', completed: 'success',
    // Knowledge-source ingestion (chatbot) and catalogue/plan availability (App Store, Billing).
    indexing: 'brand', available: 'neutral', unconfigured: 'neutral',
    // Log levels (LogInspector): error is already danger above.
    info: 'brand', warning: 'warning',
    connected: 'success', disconnected: 'neutral',
    'needs setup': 'warning', 'sync issue': 'danger', 'auth expired': 'danger',
    healthy: 'success', 'needs attention': 'warning', incomplete: 'warning',
    open: 'success', closed: 'neutral', online: 'success', offline: 'danger',
    syncing: 'warning', invited: 'warning', deactivated: 'neutral',
    // Domain verification (landing pages): unverified is a to-do, not a failure.
    verified: 'success', unverified: 'warning',
    // Data journey runs.
    finished: 'success',
  },
}

const iconMap: Record<string, Record<string, string>> = {
  campaign: {
    sent: 'check', scheduled: 'calendar-clock',
    draft: 'pencil', sending: 'send',
    active: 'play-circle', paused: 'pause-circle',
    failed: 'alert-circle', archived: 'archive',
    recurring: 'repeat',
  },
  fulfillment: {
    unapproved: 'alert-circle', 'not ready': 'package',
    'ready for fulfillment': 'package-check', shipped: 'truck',
    'return requested': 'corner-down-left', cancelled: 'circle-x',
    fulfilled: 'check-circle', unfulfilled: 'clock',
  },
  ticket: {
    open: 'alert-circle', 'in progress': 'clock',
    'awaiting reply': 'reply', resolved: 'circle-check',
    closed: 'circle-x', escalated: 'alert-triangle',
    new: 'bell', pending: 'clock', 'on hold': 'pause-circle',
  },
  order: {
    completed: 'check-circle', cancelled: 'x-circle',
    refunded: 'corner-down-left', 'on hold': 'pause-circle',
  },
  payment: {
    paid: 'check-circle', refunded: 'corner-down-left',
    failed: 'alert-circle',
    succeeded: 'check-circle', processing: 'clock', authorised: 'shield-check',
    'partially refunded': 'corner-down-left', disputed: 'shield-alert', cancelled: 'circle-x',
  },
  payout: {
    upcoming: 'calendar-clock', 'in transit': 'clock', 'sent to bank': 'check-circle', failed: 'alert-circle',
  },
  dispute: {
    'needs response': 'alert-circle', 'under review': 'clock', won: 'check-circle', lost: 'x-circle', accepted: 'corner-down-left',
  },
  method: {
    'setup required': 'wrench', 'pending approval': 'clock', enabled: 'check-circle', unavailable: 'ban',
  },
  readiness: {
    'not started': 'circle-dashed', 'in progress': 'loader', submitted: 'send', 'not submitted': 'circle-dashed',
    'under review': 'clock', 'action required': 'alert-circle', verified: 'check-circle', rejected: 'x-circle', declined: 'x-circle',
    'not enabled': 'circle-dashed', enabled: 'check-circle', restricted: 'ban', disabled: 'ban',
    ready: 'check-circle', paused: 'pause-circle', inactive: 'circle-dashed', 'needs setup': 'list-checks', 'ready to activate': 'rocket', live: 'check-circle',
  },
  priority: {
    critical: 'alert-octagon', urgent: 'alert-octagon', high: 'alert-triangle',
    medium: 'circle-alert', normal: 'minus', low: 'minus',
  },
  connection: {
    connected: 'check-circle', disconnected: 'circle-x',
    'needs setup': 'wrench', 'sync issue': 'refresh-cw', 'auth expired': 'key-round',
    active: 'check-circle', 'setup incomplete': 'wrench', inactive: 'circle-dashed',
  },
  stock: {
    'in stock': 'circle-check', 'low stock': 'alert-triangle', 'out of stock': 'circle-x',
  },
}

const TONE_TO_COLOR: Record<Tone, string> = {
  brand: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  neutral: 'default',
}

const chipColor = computed(() => {
  const key = props.status.toLowerCase()
  const tone = toneMap[props.type]?.[key] ?? toneMap.general?.[key] ?? 'neutral'
  return TONE_TO_COLOR[tone]
})

const chipIcon = computed(() => {
  if (!props.showIcon) return undefined
  const key = props.status.toLowerCase()
  return iconMap[props.type]?.[key]
})

const iconPx = computed(() => ({ sm: 11, md: 12, lg: 13 } as const)[props.size])

/* Vuetify's own size names, mapped from the shared sm|md|lg vocabulary (P2-1).
   Its rendered heights (20/24/32) already match component.chip.height.*, but the
   scoped rules below assert the token so the ramp survives a Vuetify default change. */
const vuetifySize = computed(() => ({ sm: 'x-small', md: 'small', lg: 'default' } as const)[props.size])
</script>

<template>
  <v-chip
    :size="vuetifySize"
    :variant="variant"
    :color="chipColor"
    class="mp-status-chip"
    :class="`mp-status-chip--${size}`"
    label
  >
    <v-icon v-if="chipIcon" :size="iconPx" class="me-1 mp-status-chip__icon">{{ chipIcon }}</v-icon>
    {{ status }}
  </v-chip>
</template>

<style scoped>
/* Quiet, editorial chips: smaller tracked label, on-container text kept at full
   strength for contrast, tonal fill dropped to ~60% of Vuetify's default. */
.mp-status-chip.v-chip {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.01em;
  padding-inline: var(--mp-component-chip-paddingInline);
  border-radius: var(--mp-component-chip-radius);
}

/* One chip height ramp across the system (P2-4) — was 20/22/34px on three
   unrelated chips. Asserted here rather than inherited from Vuetify's size map. */
.mp-status-chip--sm.v-chip { height: var(--mp-component-chip-height-sm); }
.mp-status-chip--md.v-chip { height: var(--mp-component-chip-height-md); }
.mp-status-chip--lg.v-chip { height: var(--mp-component-chip-height-lg); }

/* Reduce the tonal underlay to ~60% of Vuetify's default (0.12 → 0.072) so the
   container reads as a whisper of colour. Text stays the dark on-container colour,
   so contrast only improves. */
.mp-status-chip.v-chip--variant-tonal :deep(.v-chip__underlay) {
  opacity: 0.072;
}

/* The 0.072 underlay is calibrated for light surfaces and reads as nearly invisible
   on the darker dark-theme surfaces, so raise it in dark mode only. */
.v-theme--maropostDark .mp-status-chip.v-chip--variant-tonal :deep(.v-chip__underlay) {
  opacity: 0.15;
}

.mp-status-chip__icon {
  color: currentColor;
  flex-shrink: 0;
}
</style>
