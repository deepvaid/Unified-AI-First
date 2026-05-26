<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const props = withDefaults(defineProps<{
  status: string
  type?: 'order' | 'fulfillment' | 'payment' | 'campaign' | 'contact' | 'ticket' | 'coupon' | 'general'
  size?: 'x-small' | 'small' | 'default'
  variant?: 'flat' | 'tonal' | 'outlined'
  showIcon?: boolean
}>(), {
  type: 'general',
  size: 'small',
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
    failed: 'danger', authorised: 'brand', partially_refunded: 'warning',
  },
  campaign: {
    sent: 'success', scheduled: 'brand', draft: 'neutral', sending: 'warning',
    active: 'success', paused: 'warning', completed: 'success', failed: 'danger',
    archived: 'neutral', aborted: 'danger',
  },
  contact: {
    active: 'success', unsubscribed: 'neutral', bounced: 'danger',
    pending: 'warning', confirmed: 'success', suspended: 'danger',
    suppressed: 'neutral', 'hard bounce': 'danger',
  },
  ticket: {
    open: 'brand', 'in progress': 'warning', 'awaiting reply': 'brand',
    resolved: 'success', closed: 'neutral', 'on hold': 'warning',
    escalated: 'danger', new: 'brand',
  },
  coupon: {
    active: 'success', expired: 'neutral', scheduled: 'brand',
    used: 'neutral', disabled: 'neutral',
  },
  general: {
    active: 'success', inactive: 'neutral', pending: 'warning', error: 'danger',
    published: 'success', draft: 'neutral', archived: 'neutral',
    enabled: 'success', disabled: 'neutral', failed: 'danger',
    running: 'brand', paused: 'warning', completed: 'success',
    connected: 'success', disconnected: 'neutral',
    'needs setup': 'warning', 'sync issue': 'danger', 'auth expired': 'danger',
    healthy: 'success', 'needs attention': 'warning', incomplete: 'warning',
    open: 'success', closed: 'neutral', online: 'success', offline: 'danger',
    syncing: 'warning',
  },
}

const iconMap: Record<string, Record<string, string>> = {
  campaign: {
    sent: 'check', scheduled: 'calendar-clock',
    draft: 'pencil', sending: 'send',
    active: 'play-circle', paused: 'pause-circle',
    failed: 'alert-circle', archived: 'archive',
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
    new: 'bell',
  },
  order: {
    completed: 'check-circle', cancelled: 'x-circle',
    refunded: 'corner-down-left', 'on hold': 'pause-circle',
  },
  payment: {
    paid: 'check-circle', refunded: 'corner-down-left',
    failed: 'alert-circle',
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

const iconPx = computed(() => (props.size === 'x-small' ? 11 : props.size === 'small' ? 12 : 13))
</script>

<template>
  <v-chip
    :size="size"
    :variant="variant"
    :color="chipColor"
    class="mp-status-chip font-weight-medium"
    label
  >
    <v-icon v-if="chipIcon" :size="iconPx" class="me-1 mp-status-chip__icon">{{ chipIcon }}</v-icon>
    {{ status }}
  </v-chip>
</template>

<style scoped>
.mp-status-chip__icon {
  color: currentColor;
  flex-shrink: 0;
}
</style>
