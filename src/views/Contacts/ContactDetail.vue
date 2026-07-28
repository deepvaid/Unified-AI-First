<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LOYALTY_TIER_LABELS, useContactsStore } from '@/stores/useContacts'
import { useRetailStore } from '@/stores/useRetail'
import { useResponsiveTableHeaders } from '@/composables/useResponsiveTableHeaders'
import { downloadCsv, type CsvColumn } from '@/utils/exportCsv'
import type { Contact } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useContactsStore()
const retail = useRetailStore()

const contactId = computed(() => Number(route.params.id))
const contact = computed(() => store.getContactById(contactId.value))
const detail = computed(() => store.getContactDetail(contactId.value))

function goToContacts() {
  router.push(`/accounts/${route.params.accountId}/contacts`)
}

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
function notify(text: string) { snackbarText.value = text; snackbar.value = true }

// Export this contact as a single-row CSV
const contactCsvColumns: CsvColumn<Contact>[] = [
  { title: 'First Name', value: 'firstName' },
  { title: 'Last Name', value: 'lastName' },
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone' },
  { title: 'Company', value: (r) => r.company ?? '' },
  { title: 'Location', value: 'location' },
  { title: 'Status', value: 'status' },
  { title: 'Score', value: 'score' },
  { title: 'Tags', value: (r) => r.tags.join('; ') },
  { title: 'Revenue', value: 'revenue' },
  { title: 'Orders', value: 'orders' },
  { title: 'Created', value: 'createdAt' },
]
function exportContact() {
  if (!contact.value) return
  downloadCsv(`contact-${contact.value.firstName}-${contact.value.lastName}`.toLowerCase(), [contact.value], contactCsvColumns)
  notify('Contact exported')
}

// Delete
const deleteDialog = ref(false)
function confirmDelete() {
  if (contact.value) store.deleteContact(contact.value.id)
  goToContacts()
}

// Add tags
const tagInput = ref('')
function addContactTag() {
  const value = tagInput.value.trim()
  if (!value || !contact.value) return
  store.addContactTags(contact.value.id, [value])
  tagInput.value = ''
  notify('Tag added')
}
function removeContactTag(tag: string) {
  if (!contact.value) return
  store.updateContact(contact.value.id, { tags: contact.value.tags.filter(t => t !== tag) })
  notify('Tag removed')
}

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
function saveEdit() {
  if (!contact.value) return
  store.updateContact(contact.value.id, {
    firstName: editForm.value.firstName,
    lastName: editForm.value.lastName,
    email: editForm.value.email,
    phone: editForm.value.phone,
    company: editForm.value.company || null,
  })
  editDrawer.value = false
  notify('Changes saved')
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

// Timeline — show the most recent handful; expand for the rest (keeps the page short)
const TIMELINE_PREVIEW = 6
const showAllTimeline = ref(false)
const visibleTimeline = computed(() => {
  const all = detail.value?.timeline ?? []
  return showAllTimeline.value ? all : all.slice(0, TIMELINE_PREVIEW)
})


// Order table headers — column-priority responsive (core: Order / Total / Status)
const orderHeaders = [
  { title: 'Order', key: 'id', width: '120px' },
  { title: 'Date', key: 'date', hideBelow: 'md' as const },
  { title: 'Items', key: 'items', align: 'center' as const, hideBelow: 'lg' as const },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Payment', key: 'paymentStatus', hideBelow: 'lg' as const },
  { title: 'Fulfillment', key: 'fulfillmentStatus', hideBelow: 'lg' as const },
]

// Ticket table headers — column-priority responsive (core: Subject / Status)
const ticketHeaders = [
  { title: 'ID', key: 'id', width: '80px', hideBelow: 'sm' as const },
  { title: 'Subject', key: 'subject' },
  { title: 'Status', key: 'status' },
  { title: 'Priority', key: 'priority', hideBelow: 'md' as const },
  { title: 'Date', key: 'date', hideBelow: 'lg' as const },
  { title: 'Assignee', key: 'assignee', hideBelow: 'lg' as const },
]

// Cart table headers — column-priority responsive (core: Cart ID / Total / Recovered)
const cartHeaders = [
  { title: 'Cart ID', key: 'id' },
  { title: 'Date', key: 'date', hideBelow: 'md' as const },
  { title: 'Items', key: 'items', align: 'center' as const, hideBelow: 'md' as const },
  { title: 'Total', key: 'total', align: 'end' as const },
  { title: 'Recovered', key: 'recovered', align: 'center' as const },
]

const { visibleHeaders: visibleOrderHeaders } = useResponsiveTableHeaders(orderHeaders)
const { visibleHeaders: visibleTicketHeaders } = useResponsiveTableHeaders(ticketHeaders)
const { visibleHeaders: visibleCartHeaders } = useResponsiveTableHeaders(cartHeaders)
</script>

<template>
  <div v-if="contact && detail" class="contact-detail-page">

    <!-- ── Page Header ────────────────────────────────────────────────────── -->
    <MpPageHeader
      :title="fullName"
      :back-to="`/accounts/${route.params.accountId}/contacts`"
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="pencil" @click="openEditDrawer" color="surface">Edit Contact</v-btn>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="more-vertical" variant="text" aria-label="Contact actions" />
          </template>
          <v-list density="compact" rounded="lg" min-width="160" class="py-1">
            <v-list-item prepend-icon="share" title="Export" @click="exportContact" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="deleteDialog = true" />
          </v-list>
        </v-menu>
      </template>
    </MpPageHeader>

    <!-- ── Two-Column Layout ──────────────────────────────────────────────── -->
    <div class="d-flex gap-5 content-area">

      <!-- ═══ LEFT SIDEBAR ══════════════════════════════════════════════════ -->
      <div class="contact-sidebar">
        <div class="d-flex flex-column gap-4">

        <!-- Card 1: Profile -->
        <v-card flat border rounded="lg" class="overflow-hidden">
          <!-- Identity -->
          <div class="d-flex align-center gap-4 px-5 pt-5 pb-4">
            <v-avatar size="56" class="flex-shrink-0 border">
              <v-img :src="contact.avatarUrl" :alt="fullName" cover>
                <template #placeholder>
                  <div class="avatar-fallback-lg">{{ initials }}</div>
                </template>
                <template #error>
                  <div class="avatar-fallback-lg">{{ initials }}</div>
                </template>
              </v-img>
            </v-avatar>
            <div class="min-w-0">
              <div class="text-subtitle-1 font-weight-bold text-truncate">{{ fullName }}</div>
              <div v-if="contact.company" class="text-body-2 text-medium-emphasis text-truncate">{{ contact.company }}</div>
              <MpStatusChip :status="contact.status ?? ''" type="contact" size="x-small" variant="flat" class="mt-1" />
            </div>
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
              <v-icon size="15" class="detail-row-v2__icon">mail</v-icon>
              <span class="detail-row-v2__label">Email</span>
              <a :href="`mailto:${contact.email}`" class="detail-row-v2__value detail-row-v2__link text-truncate" style="max-width: 180px;">{{ contact.email }}</a>
            </div>
            <div v-if="contact.phone" class="detail-row-v2">
              <v-icon size="15" class="detail-row-v2__icon">phone</v-icon>
              <span class="detail-row-v2__label">Phone</span>
              <span class="detail-row-v2__value">{{ contact.phone }}</span>
            </div>
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

        <!-- In-store loyalty, when this shopper is enrolled at a register -->
        <v-card v-if="contact.loyalty" flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="In-store loyalty" />
          <div class="d-flex align-center ga-2 mb-4">
            <v-chip size="small" variant="tonal" color="primary">{{ LOYALTY_TIER_LABELS[contact.loyalty.tier] }}</v-chip>
            <span class="text-body-2 text-medium-emphasis">
              Member since {{ contact.loyalty.memberSince }}
            </span>
          </div>
          <v-row dense>
            <v-col cols="4">
              <div class="text-caption text-medium-emphasis">Points</div>
              <div class="text-body-1 font-weight-bold">{{ contact.loyalty.points.toLocaleString() }}</div>
            </v-col>
            <v-col cols="4">
              <div class="text-caption text-medium-emphasis">Visits</div>
              <div class="text-body-1 font-weight-bold">{{ contact.loyalty.visits }}</div>
            </v-col>
            <v-col cols="4">
              <div class="text-caption text-medium-emphasis">Home store</div>
              <div class="text-body-2 font-weight-medium">{{ retail.locationName(contact.loyalty.homeLocationId) }}</div>
            </v-col>
          </v-row>
          <p v-if="contact.loyalty.notes" class="text-body-2 text-medium-emphasis mt-4 mb-0">
            {{ contact.loyalty.notes }}
          </p>
        </v-card>

        <!-- Card 2: Tags -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader :title="`Contact Tags (${contact.tags?.length ?? 0})`" />
          <div v-if="contact.tags?.length" class="d-flex flex-wrap gap-2 mb-4">
            <v-chip
              v-for="tag in contact.tags"
              :key="tag"
              size="small"
              variant="tonal"
              color="secondary"
              closable
              @click:close="removeContactTag(tag)"
            >{{ tag }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis mb-4">No contact tags to show.</div>
          <v-text-field
            v-model="tagInput"
            label="Add contact tag..."
            variant="outlined"
            density="compact"
            hide-details
            append-inner-icon="plus"
            @keyup.enter="addContactTag"
            @click:append-inner="addContactTag"
          />
        </v-card>

        <!-- Card 3: Lists & Subscriptions -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="Contact Lists">
            <template #actions>
              <v-btn icon="pencil" variant="text" size="small" density="comfortable" aria-label="Edit contact lists" />
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
            <div class="d-flex align-center gap-1"><v-icon size="10" class="text-medium-emphasis">circle</v-icon><span class="text-caption">Unsubscribed</span></div>
          </div>
        </v-card>

        <!-- Card 4: Insights (eRFM · Brands · Keywords) -->
        <v-card flat border rounded="lg" class="pa-5">
          <MpSectionHeader title="Insights" />

          <div class="text-subtitle-2 font-weight-medium mb-2">eRFM Customer Group</div>
          <div class="d-flex flex-column gap-2 mb-4">
            <div class="detail-row">
              <span class="detail-label">RFM Group</span>
              <span class="detail-value">{{ detail.erfm.rfmGroup }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Engagement Level</span>
              <span class="detail-value">{{ detail.erfm.engagementLevel }}</span>
            </div>
          </div>

          <v-divider class="mb-4" style="opacity:0.5" />

          <div class="text-subtitle-2 font-weight-medium mb-2">Brands ({{ detail.brands.length }})</div>
          <div v-if="detail.brands.length" class="d-flex flex-wrap gap-2 mb-4">
            <v-chip v-for="b in detail.brands" :key="b" size="small" variant="tonal">{{ b }}</v-chip>
          </div>
          <div v-else class="text-body-2 text-medium-emphasis mb-4">No brands yet — add the customer to a branded list to send emails.</div>

          <v-divider class="mb-4" style="opacity:0.5" />

          <div class="text-subtitle-2 font-weight-medium mb-2">Most Engaging Keywords ({{ detail.keywords.length }})</div>
          <div v-if="detail.keywords.length" class="d-flex flex-wrap gap-2">
            <v-chip v-for="kw in detail.keywords" :key="kw" size="small" variant="tonal">{{ kw }}</v-chip>
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

              <!-- KPI Grid — four headline metrics; ticket counts live in Engagement > Tickets -->
              <div class="kpi-grid">
                <MpKpiCard label="Response Rate" :value="detail.responseRate.email" icon="mail" color="primary">
                  <div class="text-body-2 text-medium-emphasis mt-1">{{ detail.responseRate.sms }} SMS</div>
                </MpKpiCard>
                <MpKpiCard label="Ideal Response Time" :value="detail.idealResponseTime" icon="clock" color="info" />
                <MpKpiCard label="Lifetime Value" :value="`$${detail.lifetimeValue.toLocaleString()}`" icon="banknote" color="success" sub-stat="vs. $310 average" />
                <MpKpiCard label="Number of Orders" :value="contact.orders" icon="shopping-cart" color="secondary" :sub-stat="`vs. average ${detail.avgOrders} orders`" />
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

                <!-- Email engagement — quiet stat strip -->
                <div v-if="engagementSubTab === 'emails'" class="ce-stats mb-5">
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.email.sends }}</div>
                    <div class="ce-stat__label mp-meta-label">Sends</div>
                  </div>
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.email.opens }}</div>
                    <div class="ce-stat__label mp-meta-label">Opens · {{ detail.engagement.email.openRate }}</div>
                  </div>
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.email.clicks }}</div>
                    <div class="ce-stat__label mp-meta-label">Clicks · {{ detail.engagement.email.clickRate }}</div>
                  </div>
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.email.bounceRate }}</div>
                    <div class="ce-stat__label mp-meta-label">Bounces</div>
                  </div>
                </div>

                <!-- Tickets engagement — quiet stat strip -->
                <div v-else-if="engagementSubTab === 'tickets'" class="ce-stats mb-5">
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.tickets.total }}</div>
                    <div class="ce-stat__label mp-meta-label">Total</div>
                  </div>
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.tickets.open }}</div>
                    <div class="ce-stat__label mp-meta-label">Open</div>
                  </div>
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.tickets.solved }}</div>
                    <div class="ce-stat__label mp-meta-label">Solved</div>
                  </div>
                  <div class="ce-stat">
                    <div class="ce-stat__value num">{{ detail.engagement.tickets.onHold }}</div>
                    <div class="ce-stat__label mp-meta-label">On-hold</div>
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
                  <div class="mp-section-title">History Timeline</div>
                  <span class="mp-meta-label text-medium-emphasis">{{ detail.timeline.length }} events</span>
                </div>
                <div class="ce-timeline">
                  <div v-for="(entry, idx) in visibleTimeline" :key="entry.id" class="ce-event">
                    <span class="ce-event__node">
                      <v-icon size="13">{{ entry.icon }}</v-icon>
                    </span>
                    <div class="ce-event__body" :class="{ 'ce-event__body--last': idx === visibleTimeline.length - 1 }">
                      <div class="ce-event__title">{{ entry.title }}</div>
                      <div class="d-flex align-center gap-2 mt-1 flex-wrap">
                        <MpStatusChip v-for="s in entry.statuses" :key="s" :status="s" type="campaign" size="x-small" variant="outlined" />
                        <span class="ce-event__time">{{ entry.date }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="detail.timeline.length > TIMELINE_PREVIEW" class="mt-2">
                  <v-btn
                    variant="text"
                    size="small"
                    class="text-none"
                    color="primary"
                    :append-icon="showAllTimeline ? 'chevron-up' : 'chevron-down'"
                    @click="showAllTimeline = !showAllTimeline"
                  >
                    {{ showAllTimeline ? 'Show less' : `Show all ${detail.timeline.length} events` }}
                  </v-btn>
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
                      <MpStatusChip v-for="s in c.statuses" :key="s" :status="s" type="campaign" size="x-small" variant="outlined" />
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis text-no-wrap mr-3">{{ c.sentDate }}</div>
                  <v-btn variant="flat" size="small" color="surface" class="text-none">Re-send Campaign</v-btn>
                  <v-btn variant="text" size="small" class="text-none text-medium-emphasis">Details</v-btn>
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
                      <MpStatusChip v-for="s in c.statuses" :key="s" :status="s" type="campaign" size="x-small" variant="outlined" />
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis text-no-wrap mr-3">{{ c.sentDate }}</div>
                  <v-btn variant="flat" size="small" color="surface" class="text-none">Re-send</v-btn>
                  <v-btn variant="text" size="small" class="text-none text-medium-emphasis">Details</v-btn>
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
                  :headers="visibleTicketHeaders"
                  :items="detail.tickets"
                  items-per-page="10"
                  density="comfortable"
                  style="background: transparent;"
                >
                  <template v-slot:item.status="{ item }">
                    <MpStatusChip :status="item.status" type="ticket" size="x-small" />
                  </template>
                  <template v-slot:item.priority="{ item }">
                    <MpStatusChip :status="item.priority" type="priority" size="x-small" />
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
                  :headers="visibleOrderHeaders"
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
                  :headers="visibleCartHeaders"
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
                    <MpStatusChip :status="item.recovered ? 'Recovered' : 'Not Recovered'" type="general" size="x-small" variant="flat" />
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
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" @click="saveEdit">Save Changes</v-btn>
      </template>
    </MpFormDrawer>

    <!-- Delete confirmation -->
    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete contact?"
      :message="`Delete ${fullName}? This permanently removes the contact and cannot be undone.`"
      confirm-label="Delete"
      danger
      @confirm="confirmDelete"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> {{ snackbarText }}</div>
    </v-snackbar>

  </div>

  <!-- ── Not found ──────────────────────────────────────────────────────── -->
  <div v-else class="pa-10">
    <MpErrorState
      icon="user-x"
      title="Contact not found"
      description="This contact may have been deleted, or the link is incorrect."
      action-label="Back to all contacts"
      action-icon="arrow-left"
      @action="goToContacts"
    />
  </div>
</template>

<style scoped>
.contact-detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Ensure all cards use the design kit's subtle border and white background */
.v-card:not(.bg-transparent) {
  border-color: var(--hairline) !important;
  box-shadow: none !important;
  background: var(--surface-1) !important;
}

.v-card.bg-transparent {
  border-color: var(--hairline) !important;
  box-shadow: none !important;
}

/* ── Profile card ───────────────────────────────────── */
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
  border-radius: var(--mp-borderRadius-sm);
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

.detail-row-v2__link {
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
}

.detail-row-v2__link:hover,
.detail-row-v2__link:focus-visible {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-underline-offset: 3px;
}

.min-w-0 { min-width: 0; }

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
  border-radius: var(--mp-borderRadius-sm);
}

/* ── Engagement — quiet stat strip (no colored tiles) ─── */
.ce-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--hairline);
  border-radius: var(--r-card);
  overflow: hidden;
}

.ce-stat {
  padding: 16px 18px;
  border-left: 1px solid var(--hairline);
}

.ce-stat:first-child {
  border-left: none;
}

.ce-stat__value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.ce-stat__label {
  margin-top: 6px;
  color: var(--muted);
}

@media (max-width: 700px) {
  .ce-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .ce-stat:nth-child(3) {
    border-left: none;
  }
}

/* ── Timeline — neutral glyph nodes + connecting hairline ─── */
.ce-timeline {
  display: flex;
  flex-direction: column;
}

.ce-event {
  display: flex;
  gap: 12px;
  position: relative;
}

.ce-event:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 26px;
  bottom: -2px;
  width: 1px;
  background: rgba(var(--v-theme-on-surface), 0.1);
}

.ce-event__node {
  flex-shrink: 0;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgb(var(--v-theme-on-surface-variant));
  z-index: 1;
}

.ce-event__body {
  flex-grow: 1;
  min-width: 0;
  padding-bottom: 18px;
}

.ce-event__body--last {
  padding-bottom: 0;
}

.ce-event__title {
  font-size: 13.5px;
  font-weight: 550;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
}

.ce-event__time {
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
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

/* ── Detail row contrast lift ───────────────────────── */
.detail-row-v2__label {
  color: rgba(var(--v-theme-on-surface), 0.66);
}
</style>
