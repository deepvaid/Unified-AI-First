<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactsStore } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'

const route = useRoute()
const router = useRouter()
const store = useContactsStore()

const contactId = computed(() => Number(route.params.id))
const contact = computed(() => store.getContactById(contactId.value))
const detail = computed(() => store.getContactDetail(contactId.value))

onMounted(() => {
  if (!contact.value) router.replace(`/accounts/${route.params.accountId}/contacts`)
})

// Tab state
const activeTab = ref('overview')
const engagementSubTab = ref('emails')
const campaignSubTab = ref('email')

// Edit drawer
const editDrawer = ref(false)
const editForm = ref({ firstName: '', lastName: '', email: '', phone: '', company: '' })
function openEditDrawer() {
  if (!contact.value) return
  editForm.value = {
    firstName: contact.value.firstName ?? '',
    lastName: contact.value.lastName ?? '',
    email: contact.value.email ?? '',
    phone: contact.value.phone,
    company: contact.value.company || '',
  }
  editDrawer.value = true
}

// Computed helpers
const fullName = computed(() => contact.value ? `${contact.value.firstName} ${contact.value.lastName}` : '')
const initials = computed(() => {
  if (!contact.value) return ''
  const ln = contact.value.lastName ?? ''
  return `${contact.value.firstName[0] ?? ''}${ln[0] ?? ''}`
})

const emailCampaigns = computed(() => detail.value?.campaigns.filter(c => c.type === 'email') ?? [])
const smsCampaigns = computed(() => detail.value?.campaigns.filter(c => c.type === 'sms') ?? [])

const emailLists = computed(() => detail.value?.lists.filter(l => l.type === 'email') ?? [])
const smsLists = computed(() => detail.value?.lists.filter(l => l.type === 'sms') ?? [])

// Status chip color for campaign/timeline statuses
function activityChipColor(status: string) {
  const map: Record<string, string> = {
    'Delivered': 'info', 'Opened': 'success', 'Clicked': 'primary',
    'Re-sent': 'warning', 'Bounced': 'error', 'Completed': 'success',
    'Processing': 'info', 'Pending': 'warning', 'Open': 'primary', 'Solved': 'success',
  }
  return map[status] || 'grey'
}

// Order table headers
const orderHeaders = [
  { title: 'Order', key: 'id', width: '120px' },
  { title: 'Date', key: 'date' },
  { title: 'Items', key: 'items', align: 'center' as const },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Payment', key: 'paymentStatus' },
  { title: 'Fulfillment', key: 'fulfillmentStatus' },
]

// Ticket table headers
const ticketHeaders = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'Subject', key: 'subject' },
  { title: 'Status', key: 'status' },
  { title: 'Priority', key: 'priority' },
  { title: 'Date', key: 'date' },
  { title: 'Assignee', key: 'assignee' },
]

// Cart table headers
const cartHeaders = [
  { title: 'Cart ID', key: 'id' },
  { title: 'Date', key: 'date' },
  { title: 'Items', key: 'items', align: 'center' as const },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Recovered', key: 'recovered', align: 'center' as const },
]
</script>

<template>
  <div v-if="contact && detail" class="contact-detail-page">

    <!-- ── Back nav ──────────────────────────────────────────────────────── -->
    <RouterLink :to="`/accounts/${route.params.accountId}/contacts`" class="back-nav">
      <v-icon size="16">chevron-left</v-icon>
      Back to all contacts
    </RouterLink>

    <!-- ── Page Header ────────────────────────────────────────────────────── -->
    <MpPageHeader :title="fullName">
      <template #actions>
        <v-btn variant="flat" prepend-icon="pencil" @click="openEditDrawer" color="surface">Edit Contact</v-btn>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="more-vertical" variant="text" />
          </template>
          <v-list density="compact" rounded="lg" min-width="160" elevation="3" class="py-1">
            <v-list-item prepend-icon="share" title="Export" />
            <v-list-item prepend-icon="copy" title="Duplicate" />
            <v-list-item prepend-icon="merge" title="Merge" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <!-- ── Two-Column Layout ──────────────────────────────────────────────── -->
    <div class="d-flex gap-5 content-area">

      <!-- ═══ LEFT SIDEBAR ══════════════════════════════════════════════════ -->
      <div class="contact-sidebar">
        <div class="d-flex flex-column gap-4">

        <!-- Card 1: Profile Hero -->
        <v-card flat border rounded="lg" class="profile-hero-card overflow-hidden">
          <!-- Gradient hero banner -->
          <div class="profile-hero-banner">
            <div class="profile-hero-banner__pattern" />
          </div>

          <!-- Avatar overlapping banner -->
          <div class="profile-hero-avatar">
            <v-avatar size="80" class="profile-hero-avatar__ring">
              <v-img :src="contact.avatarUrl" :alt="fullName" cover>
                <template #placeholder>
                  <div class="avatar-fallback-lg">{{ initials }}</div>
                </template>
                <template #error>
                  <div class="avatar-fallback-lg">{{ initials }}</div>
                </template>
              </v-img>
            </v-avatar>
            <MpStatusChip :status="contact.status ?? ''" type="contact" size="x-small" variant="flat" class="profile-hero-avatar__status" />
          </div>

          <!-- Identity -->
          <div class="text-center px-5 mt-1 mb-1">
            <div class="text-h6 font-weight-bold">{{ fullName }}</div>
            <div v-if="contact.company" class="text-body-2 text-medium-emphasis">{{ contact.company }}</div>
          </div>

          <!-- Quick contact pills -->
          <div class="d-flex justify-center gap-2 px-5 mb-4">
            <v-chip size="small" variant="tonal" color="primary" prepend-icon="mail" :href="`mailto:${contact.email}`" tag="a">{{ contact.email }}</v-chip>
          </div>
          <div v-if="contact.phone" class="d-flex justify-center gap-2 px-5 mb-4" style="margin-top:-8px;">
            <v-chip size="small" variant="tonal" prepend-icon="phone">{{ contact.phone }}</v-chip>
          </div>

          <!-- Score bar -->
          <div class="px-5 mb-4">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption text-medium-emphasis font-weight-medium">Contact Score</span>
              <span class="text-caption font-weight-bold" :class="contact.score >= 70 ? 'text-success' : contact.score >= 40 ? 'text-warning' : 'text-error'">{{ contact.score }}/100</span>
            </div>
            <v-progress-linear :model-value="contact.score" :color="contact.score >= 70 ? 'success' : contact.score >= 40 ? 'warning' : 'error'" rounded height="6" bg-color="surface-variant" />
          </div>

          <v-divider style="opacity:0.5" />

          <!-- Detail fields -->
          <div class="d-flex flex-column gap-0 px-5 py-3">
            <div class="detail-row-v2">
              <v-icon size="15" class="detail-row-v2__icon">fingerprint</v-icon>
              <span class="detail-row-v2__label">UID</span>
              <span class="detail-row-v2__value text-truncate" style="max-width: 160px;">{{ detail.uid }}</span>
            </div>
            <div class="detail-row-v2">
              <v-icon size="15" class="detail-row-v2__icon">calendar</v-icon>
              <span class="detail-row-v2__label">Created</span>
              <span class="detail-row-v2__value">{{ contact.createdAt }}</span>
            </div>
            <div class="detail-row-v2">
              <v-icon size="15" class="detail-row-v2__icon">map-pin</v-icon>
              <span class="detail-row-v2__label">Location</span>
              <span class="detail-row-v2__value">{{ contact.location }}</span>
            </div>
            <template v-for="field in detail.customFields" :key="field.label">
              <div class="detail-row-v2">
                <v-icon size="15" class="detail-row-v2__icon">{{ field.label === 'Source' ? 'globe' : field.label === 'Gender' ? 'user' : 'layers' }}</v-icon>
                <span class="detail-row-v2__label">{{ field.label }}</span>
                <span class="detail-row-v2__value">{{ field.value }}</span>
              </div>
            </template>
          </div>
        </v-card>

        <!-- Card 2: Tags -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader :title="`Contact Tags (${contact.tags?.length ?? 0})`" />
          <div v-if="contact.tags?.length" class="d-flex flex-wrap gap-2 mb-4">
            <v-chip v-for="tag in contact.tags" :key="tag" size="small" variant="tonal" color="secondary">{{ tag }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis mb-4">No contact tags to show.</div>
          <v-btn variant="flat" size="small" prepend-icon="plus" color="surface">Add Contact Tags</v-btn>
        </v-card>

        <!-- Card 3: Lists & Subscriptions -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="Contact Lists">
            <template #actions>
              <v-btn icon="pencil" variant="text" size="small" density="comfortable" />
            </template>
          </MpSectionHeader>

          <div class="text-subtitle-2 font-weight-medium mb-2">Email Subscription ({{ emailLists.length }})</div>
          <div v-if="emailLists.length" class="d-flex flex-wrap gap-2 mb-4">
            <v-chip v-for="l in emailLists" :key="l.name" size="small" :color="l.subscribed ? 'primary' : 'grey'" variant="tonal">{{ l.name }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis mb-4">No email subscriptions.</div>

          <div class="text-subtitle-2 font-weight-medium mb-2">SMS Subscription ({{ smsLists.length }})</div>
          <div v-if="smsLists.length" class="d-flex flex-wrap gap-2 mb-4">
            <v-chip v-for="l in smsLists" :key="l.name" size="small" :color="l.subscribed ? 'primary' : 'grey'" variant="tonal">{{ l.name }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis mb-4">No SMS subscriptions.</div>

          <v-divider class="mb-3" />

          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-2">Add to Do Not Email List</span>
            <v-switch v-model="detail.doNotEmail" hide-details density="compact" color="primary" />
          </div>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2">Add to Do Not SMS List</span>
            <v-switch v-model="detail.doNotSms" hide-details density="compact" color="primary" />
          </div>

          <div class="d-flex align-center gap-4">
            <div class="d-flex align-center gap-1"><v-icon size="10" color="primary">circle</v-icon><span class="text-caption">Subscribed</span></div>
            <div class="d-flex align-center gap-1"><v-icon size="10" color="error">circle</v-icon><span class="text-caption">Unsubscribed</span></div>
          </div>
        </v-card>

        <!-- Card 4: Brands -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader :title="`Brands (${detail.brands.length})`" />
          <div v-if="detail.brands.length" class="d-flex flex-wrap gap-2">
            <v-chip v-for="b in detail.brands" :key="b" size="small" variant="tonal">{{ b }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">No Brands to show.<br>Add the customer to a Branded List to send emails.</div>
        </v-card>

        <!-- Card 5: eRFM -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="eRFM (Customer Group)" />
          <div class="d-flex flex-column gap-3">
            <div class="detail-row">
              <span class="detail-label">RFM Group</span>
              <span class="detail-value">{{ detail.erfm.rfmGroup }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Engagement Level</span>
              <span class="detail-value">{{ detail.erfm.engagementLevel }}</span>
            </div>
          </div>
        </v-card>

        <!-- Card 6: Keywords -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader :title="`Most Engaging Keywords (${detail.keywords.length})`" />
          <div v-if="detail.keywords.length" class="d-flex flex-wrap gap-2">
            <v-chip v-for="kw in detail.keywords" :key="kw" size="small" variant="tonal" color="info">{{ kw }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">No keywords data available.</div>
        </v-card>

        </div><!-- end inner flex column -->
      </div>

      <!-- ═══ RIGHT CONTENT AREA ════════════════════════════════════════════ -->
      <div class="flex-grow-1 d-flex flex-column overflow-hidden right-content">

        <!-- Tab bar -->
        <v-tabs v-model="activeTab" density="compact" color="primary" show-arrows class="mb-4 flex-shrink-0">
          <v-tab value="overview">Overview</v-tab>
          <v-tab value="campaigns">
            Campaigns
            <v-badge v-if="detail.campaigns.length" :content="detail.campaigns.length" color="primary" inline class="ml-1" />
          </v-tab>
          <v-tab value="tickets">Tickets</v-tab>
          <v-tab value="orders">Orders</v-tab>
          <v-tab value="abandoned">Abandoned Cart List</v-tab>
        </v-tabs>

        <!-- Tab content -->
        <v-window v-model="activeTab" class="flex-grow-1 right-tab-content">

          <!-- ─── OVERVIEW TAB ──────────────────────────────────────────── -->
          <v-window-item value="overview">
            <div class="d-flex flex-column gap-4 pa-1">

              <!-- KPI Grid (8 cards, auto-fit 4→3→2→1 columns) -->
              <div class="kpi-grid">
                <MpKpiCard label="Response Rate" :value="detail.responseRate.email" icon="mail" color="error">
                  <div class="text-body-2 text-medium-emphasis mt-1">{{ detail.responseRate.sms }} SMS</div>
                </MpKpiCard>
                <MpKpiCard label="Ideal Response Time" :value="detail.idealResponseTime" icon="clock" color="info" />
                <MpKpiCard label="Lifetime Value" :value="`$${detail.lifetimeValue.toLocaleString()}`" icon="banknote" color="success" sub-stat="vs. average $310.0M" />
                <MpKpiCard label="Number of Orders" :value="contact.orders" icon="shopping-cart" color="warning" :sub-stat="`vs. average ${detail.avgOrders} Orders`" />
                <MpKpiCard label="Total Tickets" :value="detail.engagement.tickets.total" icon="ticket" color="primary" />
                <MpKpiCard label="Open Tickets" :value="detail.engagement.tickets.open" icon="ticket-check" color="info" />
                <MpKpiCard label="Solved Tickets" :value="detail.engagement.tickets.solved" icon="circle-check" color="success" />
                <MpKpiCard label="On-hold Tickets" :value="detail.engagement.tickets.onHold" icon="circle-pause" color="error" />
              </div>

              <!-- Customer Engagement Section -->
              <v-card flat border rounded="lg" class="pa-5">
                <MpSectionHeader title="Customer Engagement (Last 7 days)">
                  <template #actions>
                    <v-btn variant="text" prepend-icon="list-filter" size="small">Filters</v-btn>
                  </template>
                </MpSectionHeader>

                <v-tabs v-model="engagementSubTab" density="compact" color="primary" show-arrows class="mb-3">
                  <v-tab value="emails">Emails</v-tab>
                  <v-tab value="orders">Orders</v-tab>
                  <v-tab value="sms">SMS</v-tab>
                  <v-tab value="tickets">Tickets</v-tab>
                </v-tabs>

                <!-- Email engagement metrics -->
                <div v-if="engagementSubTab === 'emails'" class="engagement-grid mb-5">
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: var(--accent-soft); color: var(--accent-ink);">
                      <v-icon size="18">send</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.email.sends }}</div>
                      <div class="engagement-metric-card__label">Sends</div>
                    </div>
                  </div>
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: var(--pos-soft); color: var(--pos);">
                      <v-icon size="18">mail-open</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.email.opens }}</div>
                      <div class="engagement-metric-card__label">Opens · {{ detail.engagement.email.openRate }}</div>
                    </div>
                  </div>
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: color-mix(in oklch, rgb(var(--v-theme-info)) 14%, transparent); color: rgb(var(--v-theme-info));">
                      <v-icon size="18">mouse-pointer-click</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.email.clicks }}</div>
                      <div class="engagement-metric-card__label">Clicks · {{ detail.engagement.email.clickRate }}</div>
                    </div>
                  </div>
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: var(--neg-soft); color: var(--neg);">
                      <v-icon size="18">mail-x</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.email.bounceRate }}</div>
                      <div class="engagement-metric-card__label">Bounces</div>
                    </div>
                  </div>
                </div>

                <!-- Tickets engagement -->
                <div v-else-if="engagementSubTab === 'tickets'" class="engagement-grid mb-5">
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: var(--accent-soft); color: var(--accent-ink);">
                      <v-icon size="18">ticket</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.tickets.total }}</div>
                      <div class="engagement-metric-card__label">Total</div>
                    </div>
                  </div>
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: color-mix(in oklch, rgb(var(--v-theme-info)) 14%, transparent); color: rgb(var(--v-theme-info));">
                      <v-icon size="18">ticket-check</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.tickets.open }}</div>
                      <div class="engagement-metric-card__label">Open</div>
                    </div>
                  </div>
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: var(--pos-soft); color: var(--pos);">
                      <v-icon size="18">circle-check</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.tickets.solved }}</div>
                      <div class="engagement-metric-card__label">Solved</div>
                    </div>
                  </div>
                  <div class="engagement-metric-card">
                    <div class="engagement-metric-card__icon" style="background: var(--neg-soft); color: var(--neg);">
                      <v-icon size="18">circle-pause</v-icon>
                    </div>
                    <div class="engagement-metric-card__body">
                      <div class="engagement-metric-card__value num">{{ detail.engagement.tickets.onHold }}</div>
                      <div class="engagement-metric-card__label">On-hold</div>
                    </div>
                  </div>
                </div>

                <!-- Orders / SMS engagement -->
                <div v-else class="mb-5">
                  <div class="text-body-2 text-medium-emphasis pa-4 text-center">
                    {{ engagementSubTab === 'orders' ? 'Order engagement data' : 'SMS engagement data' }} — coming soon
                  </div>
                </div>

                <!-- History Timeline -->
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="text-subtitle-1 font-weight-medium">History Timeline</div>
                  <v-chip size="x-small" variant="tonal" color="primary">{{ detail.timeline.length }} events</v-chip>
                </div>
                <div class="timeline-v2">
                  <div v-for="(entry, idx) in detail.timeline" :key="entry.id" class="timeline-v2__entry">
                    <div class="timeline-v2__rail">
                      <v-avatar :color="entry.color" size="32" variant="tonal" class="timeline-v2__dot">
                        <v-icon size="15">{{ entry.icon }}</v-icon>
                      </v-avatar>
                      <div v-if="idx < detail.timeline.length - 1" class="timeline-v2__line" />
                    </div>
                    <div class="timeline-v2__content">
                      <div class="text-body-2 font-weight-medium">{{ entry.title }}</div>
                      <div class="d-flex align-center gap-2 mt-1 flex-wrap">
                        <v-chip v-for="s in entry.statuses" :key="s" size="x-small" variant="outlined" :color="activityChipColor(s)">{{ s }}</v-chip>
                        <span class="text-caption text-medium-emphasis">{{ entry.date }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </v-card>

            </div>
          </v-window-item>

          <!-- ─── CAMPAIGNS TAB ─────────────────────────────────────────── -->
          <v-window-item value="campaigns">
            <div class="pa-1">
              <v-tabs v-model="campaignSubTab" density="compact" color="primary" show-arrows class="mb-4">
                <v-tab value="email">Email Campaigns ({{ emailCampaigns.length }})</v-tab>
                <v-tab value="sms">SMS Campaigns ({{ smsCampaigns.length }})</v-tab>
              </v-tabs>

              <div v-if="campaignSubTab === 'email' && emailCampaigns.length" class="d-flex flex-column gap-3">
                <v-card v-for="c in emailCampaigns" :key="c.id" flat border rounded="lg" class="d-flex align-center gap-3 py-3 px-4">
                  <v-avatar color="primary" size="36" variant="tonal">
                    <v-icon size="18">mail</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">{{ c.name }}</div>
                    <div class="d-flex gap-2 mt-1 flex-wrap">
                      <v-chip v-for="s in c.statuses" :key="s" size="x-small" variant="outlined" :color="activityChipColor(s)">{{ s }}</v-chip>
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis text-no-wrap mr-3">{{ c.sentDate }}</div>
                  <v-btn variant="flat" size="small" color="surface">Re-send Campaign</v-btn>
                  <v-btn variant="tonal" size="small">Details</v-btn>
                </v-card>
              </div>

              <div v-else-if="campaignSubTab === 'sms' && smsCampaigns.length" class="d-flex flex-column gap-3">
                <v-card v-for="c in smsCampaigns" :key="c.id" flat border rounded="lg" class="d-flex align-center gap-3 py-3 px-4">
                  <v-avatar color="info" size="36" variant="tonal">
                    <v-icon size="18">message-circle</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">{{ c.name }}</div>
                    <div class="d-flex gap-2 mt-1 flex-wrap">
                      <v-chip v-for="s in c.statuses" :key="s" size="x-small" variant="outlined" :color="activityChipColor(s)">{{ s }}</v-chip>
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis text-no-wrap mr-3">{{ c.sentDate }}</div>
                  <v-btn variant="flat" size="small" color="surface">Re-send</v-btn>
                  <v-btn variant="tonal" size="small">Details</v-btn>
                </v-card>
              </div>

              <MpEmptyState
                v-else
                icon="mail-x"
                title="No campaigns found"
                description="No campaigns have been sent to this contact yet."
              />
            </div>
          </v-window-item>

          <!-- ─── TICKETS TAB ───────────────────────────────────────────── -->
          <v-window-item value="tickets">
            <div class="pa-1">
              <v-card v-if="detail.tickets.length" flat border rounded="lg">
                <v-data-table
                  :headers="ticketHeaders"
                  :items="detail.tickets"
                  items-per-page="10"
                  density="comfortable"
                  style="background: transparent;"
                >
                  <template v-slot:item.status="{ item }">
                    <MpStatusChip :status="item.status" type="ticket" size="x-small" />
                  </template>
                  <template v-slot:item.priority="{ item }">
                    <v-chip size="x-small" variant="tonal" :color="item.priority === 'High' ? 'error' : item.priority === 'Medium' ? 'warning' : 'info'">{{ item.priority }}</v-chip>
                  </template>
                </v-data-table>
              </v-card>
              <MpEmptyState
                v-else
                icon="headset"
                title="No tickets"
                description="This contact has no support tickets."
              />
            </div>
          </v-window-item>

          <!-- ─── ORDERS TAB ────────────────────────────────────────────── -->
          <v-window-item value="orders">
            <div class="pa-1">
              <div class="text-subtitle-1 font-weight-medium mb-3">All Orders ({{ detail.orders.length }})</div>
              <v-card v-if="detail.orders.length" flat border rounded="lg">
                <v-data-table
                  :headers="orderHeaders"
                  :items="detail.orders"
                  items-per-page="10"
                  density="comfortable"
                  style="background: transparent;"
                >
                  <template v-slot:item.total="{ item }">
                    <span class="font-weight-medium">${{ item.total.toFixed(2) }}</span>
                  </template>
                  <template v-slot:item.status="{ item }">
                    <MpStatusChip :status="item.status" type="order" size="x-small" />
                  </template>
                  <template v-slot:item.paymentStatus="{ item }">
                    <MpStatusChip :status="item.paymentStatus" type="payment" size="x-small" />
                  </template>
                  <template v-slot:item.fulfillmentStatus="{ item }">
                    <MpStatusChip :status="item.fulfillmentStatus" type="fulfillment" size="x-small" />
                  </template>
                </v-data-table>
              </v-card>
              <MpEmptyState
                v-else
                icon="shopping-cart"
                title="No orders"
                description="This contact has not placed any orders yet."
              />
            </div>
          </v-window-item>

          <!-- ─── ABANDONED CART TAB ────────────────────────────────────── -->
          <v-window-item value="abandoned">
            <div class="pa-1">
              <v-card v-if="detail.abandonedCarts.length" flat border rounded="lg">
                <v-data-table
                  :headers="cartHeaders"
                  :items="detail.abandonedCarts"
                  items-per-page="10"
                  density="comfortable"
                  style="background: transparent;"
                >
                  <template v-slot:item.items="{ item }">
                    {{ item.items.length }} item{{ item.items.length !== 1 ? 's' : '' }}
                  </template>
                  <template v-slot:item.total="{ item }">
                    <span class="font-weight-medium">${{ item.total.toFixed(2) }}</span>
                  </template>
                  <template v-slot:item.recovered="{ item }">
                    <v-chip size="x-small" variant="flat" :color="item.recovered ? 'success' : 'warning'">
                      {{ item.recovered ? 'Recovered' : 'Not Recovered' }}
                    </v-chip>
                  </template>
                </v-data-table>
              </v-card>
              <MpEmptyState
                v-else
                icon="shopping-cart"
                title="No abandoned carts"
                description="This contact has no abandoned carts."
              />
            </div>
          </v-window-item>

        </v-window>
      </div>
    </div>

    <!-- ── Edit Contact Drawer ────────────────────────────────────────────── -->
    <MpFormDrawer v-model="editDrawer" title="Edit Contact" subtitle="Update contact information">
      <v-row dense>
        <v-col cols="6"><v-text-field v-model="editForm.firstName" label="First Name" /></v-col>
        <v-col cols="6"><v-text-field v-model="editForm.lastName" label="Last Name" /></v-col>
        <v-col cols="12"><v-text-field v-model="editForm.email" label="Email" type="email" /></v-col>
        <v-col cols="12"><v-text-field v-model="editForm.phone" label="Phone" /></v-col>
        <v-col cols="12"><v-text-field v-model="editForm.company" label="Company" /></v-col>
      </v-row>
      <template #footer>
        <v-btn variant="text" @click="editDrawer = false">Cancel</v-btn>
        <v-btn color="primary" @click="editDrawer = false">Save Changes</v-btn>
      </template>
    </MpFormDrawer>

  </div>
</template>

<style scoped>
.contact-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Back navigation link ───────────────────────────── */
.back-nav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  margin-bottom: -8px;
  padding: 4px 0;
  transition: color 120ms ease;
}

.back-nav:hover {
  color: var(--ink);
}

/* Ensure all cards use the design kit's subtle border and white background */
.v-card:not(.bg-transparent) {
  border-color: var(--hairline) !important;
  box-shadow: none !important;
  background: var(--surface-1) !important;
}

/* Match KPI cards to the main dashboard's white-on-linen style.
   MbStatCard's tone="soft"/"warm"/"inverse" props would otherwise paint pale-cyan,
   cream, or dark-blue fills which look inconsistent with the unified palette. We
   also reset the text/label colors so cards mapped from `color="error"`
   (tone="inverse") don't end up rendering white text on the forced-white surface. */
:deep(.mb-stat-card) {
  --mb-stat-bg: rgb(var(--v-theme-surface)) !important;
  --mb-stat-border: rgb(var(--v-theme-outline-variant)) !important;
  --mb-stat-value-color: rgb(var(--v-theme-on-surface)) !important;
  --mb-stat-label-color: rgba(var(--v-theme-on-surface), 0.72) !important;
  --mb-stat-unit-color: rgba(var(--v-theme-on-surface), 0.62) !important;
}

.v-card.bg-transparent {
  border-color: var(--hairline) !important;
  box-shadow: none !important;
}

/* ── Profile Hero Card ──────────────────────────────── */
.profile-hero-card {
  background: var(--surface-1);
}

.profile-hero-banner {
  height: 72px;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, color-mix(in oklch, rgb(var(--v-theme-primary)) 60%, rgb(var(--v-theme-secondary))) 100%);
  position: relative;
  overflow: hidden;
}

.profile-hero-banner__pattern {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    120deg,
    rgba(255,255,255,0.04) 0px,
    rgba(255,255,255,0.04) 1px,
    transparent 1px,
    transparent 32px
  );
}

.profile-hero-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -40px;
  position: relative;
}

.profile-hero-avatar__ring {
  border: 3px solid var(--surface-1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.profile-hero-avatar__status {
  margin-top: 6px;
}

.avatar-fallback-lg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
  font-weight: 700;
  font-size: 22px;
}

/* ── Two-column layout ──────────────────────────────── */
.content-area {
  height: calc(100vh - 200px);
  overflow: hidden;
}

.contact-sidebar {
  width: 340px;
  min-width: 340px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-bottom: 24px;
  scrollbar-width: thin;
}

.contact-sidebar > * {
  flex-shrink: 0;
}

.contact-sidebar::-webkit-scrollbar {
  width: 4px;
}

.contact-sidebar::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), 0.3);
  border-radius: 4px;
}

.right-content {
  min-width: 0;
}

@media (max-width: 1100px) {
  .content-area {
    flex-direction: column;
    height: auto;
    overflow: visible;
    gap: 16px;
  }

  .contact-sidebar {
    width: 100%;
    min-width: 0;
    max-height: none;
    overflow: visible;
    padding-bottom: 0;
  }
}

/* ── Detail rows v2 (icon + label + value) ──────────── */
.detail-row-v2 {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.06);
}

.detail-row-v2:last-child {
  border-bottom: none;
}

.detail-row-v2__icon {
  color: var(--muted);
  flex-shrink: 0;
  opacity: 0.6;
}

.detail-row-v2__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
  min-width: 64px;
}

.detail-row-v2__value {
  font-size: 13px;
  font-weight: 600;
  margin-left: auto;
  text-align: right;
}

/* ── Right content area ─────────────────────────────── */
.right-tab-content {
  overflow-y: auto;
  scrollbar-width: thin;
}

.right-tab-content::-webkit-scrollbar {
  width: 4px;
}

.right-tab-content::-webkit-scrollbar-thumb {
  background: rgba(var(--v-border-color), 0.3);
  border-radius: 4px;
}

/* ── Engagement metric grid ─────────────────────────── */
.engagement-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.engagement-metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: var(--r-card);
  background: var(--surface-1);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.engagement-metric-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.engagement-metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
}

.engagement-metric-card__body {
  min-width: 0;
}

.engagement-metric-card__value {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.3px;
}

.engagement-metric-card__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Timeline v2 (vertical connector) ───────────────── */
.timeline-v2 {
  display: flex;
  flex-direction: column;
}

.timeline-v2__entry {
  display: flex;
  gap: 12px;
  min-height: 56px;
}

.timeline-v2__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 32px;
}

.timeline-v2__dot {
  flex-shrink: 0;
  z-index: 1;
}

.timeline-v2__line {
  width: 2px;
  flex-grow: 1;
  background: rgba(var(--v-border-color), 0.15);
  border-radius: 1px;
  margin: 4px 0;
  min-height: 12px;
}

.timeline-v2__content {
  flex-grow: 1;
  padding-bottom: 14px;
  min-width: 0;
}

/* ── Campaign rows ──────────────────────────────────── */
.campaign-row {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  transition: background 0.15s ease;
  border-radius: 8px;
}

.campaign-row:hover {
  background: rgba(var(--v-theme-primary), 0.03);
}

.campaign-row:last-child {
  border-bottom: none;
}

/* Legacy (keep for older sections) */
.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-label {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

.timeline-entry {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.timeline-entry:last-child {
  border-bottom: none;
}

/* ── KPI adaptive grid ──────────────────────────────── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

/* Tighten MbStatCard density — default 28px / 160px is sized for
   full-width dashboard rows, not the narrower two-column context */
:deep(.mp-kpi-card .mb-stat-card) {
  padding: 16px 18px;
  min-height: 124px;
  gap: 10px;
}

:deep(.mp-kpi-card .mb-stat-card__value-row) {
  min-width: 0;
}

:deep(.mp-kpi-card .mb-stat-card__value) {
  font-size: 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

:deep(.mp-kpi-card .mb-stat-card__label) {
  font-size: 11px;
  white-space: normal;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

:deep(.mp-kpi-card .mb-stat-card__icon) {
  width: 30px;
  height: 30px;
  font-size: 16px;
}

:deep(.mp-kpi-card .mb-stat-card__caption) {
  color: rgba(var(--v-theme-on-surface), 0.62);
  line-height: 1.35;
}

/* ── Detail row contrast lift ───────────────────────── */
.detail-row-v2__label {
  color: rgba(var(--v-theme-on-surface), 0.66);
}
</style>
