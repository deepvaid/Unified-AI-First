<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useServiceSettingsStore } from '@/stores/useServiceSettings'
import { useTicketsStore } from '@/stores/useTickets'
import { inboxReadiness } from '@/service/model'
import InboxGeneralTab from './inbox/InboxGeneralTab.vue'
import InboxEmailsTab from './inbox/InboxEmailsTab.vue'
import InboxRepliesTab from './inbox/InboxRepliesTab.vue'
import InboxRoutingTab from './inbox/InboxRoutingTab.vue'

/*
 * One inbox, four tabs — everything UAT spreads over Create, Edit and the
 * Support emails page. The tab lives in ?tab= (MaropaySettings pattern) so a
 * link can land on it: the ticket pane's "Verify email" goes to ?tab=emails.
 */

const route = useRoute()
const router = useRouter()
const settings = useServiceSettingsStore()
const tickets = useTicketsStore()
const accountId = computed(() => route.params.accountId as string)
const inbox = computed(() => settings.findInbox(route.params.inboxId as string))

const TABS = [
  { key: 'general', label: 'General', component: InboxGeneralTab },
  { key: 'emails', label: 'Support emails', component: InboxEmailsTab },
  { key: 'replies', label: 'Replies', component: InboxRepliesTab },
  { key: 'routing', label: 'Assignment & SLA', component: InboxRoutingTab },
] as const
type TabKey = (typeof TABS)[number]['key']

// ── Unsaved edits: tabs report them; switching or leaving asks first ───────
const dirty = ref(false)
const pendingTab = ref<TabKey | null>(null)

const activeTab = computed<TabKey>({
  get() {
    const raw = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
    return TABS.find(t => t.key === raw)?.key ?? 'general'
  },
  set(tab) {
    if (tab === activeTab.value) return
    if (dirty.value) {
      pendingTab.value = tab
      return
    }
    void router.replace({ query: { ...route.query, tab } })
  },
})
const current = computed(() => TABS.find(t => t.key === activeTab.value)!)

const confirmTabSwitch = computed({
  get: () => pendingTab.value !== null,
  set: open => { if (!open) pendingTab.value = null },
})
function discardAndSwitch() {
  const tab = pendingTab.value
  dirty.value = false
  pendingTab.value = null
  if (tab) void router.replace({ query: { ...route.query, tab } })
}

const { confirmLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } = useDirtyLeaveGuard(dirty)

// ── Header facts ────────────────────────────────────────────────────────────
const emails = computed(() => (inbox.value ? settings.emailsFor(inbox.value.id) : []))
const readiness = computed(() => inboxReadiness(emails.value))
const openCount = computed(() =>
  inbox.value ? tickets.visibleTickets.filter(t => t.inboxId === inbox.value!.id && t.status !== 'Closed').length : 0,
)
const subtitle = computed(() => {
  const n = emails.value.length
  return [
    inbox.value?.description,
    `${n} support email${n === 1 ? '' : 's'}`,
    `${openCount.value} open ticket${openCount.value === 1 ? '' : 's'}`,
  ].filter(Boolean).join(' · ')
})

const listRoute = computed(() => ({ name: 'SettingsServiceInboxes', params: { accountId: accountId.value } }))
</script>

<template>
  <div class="settings-page d-flex flex-column gap-4">
    <template v-if="inbox">
      <MpPageHeader :level="2" density="compact" :back-to="listRoute" :title="inbox.name" :subtitle="subtitle">
        <template #title-append>
          <MpStatusChip :status="readiness" type="readiness" size="sm" show-icon />
        </template>
        <template #tabs>
          <v-tabs v-model="activeTab" density="compact" color="primary" show-arrows aria-label="Inbox settings sections">
            <v-tab v-for="tab in TABS" :key="tab.key" :value="tab.key" class="text-none">{{ tab.label }}</v-tab>
          </v-tabs>
        </template>
      </MpPageHeader>

      <component :is="current.component" :key="`${inbox.id}-${current.key}`" :inbox="inbox" @dirty="dirty = $event" />
    </template>

    <v-card v-else flat border rounded="lg">
      <MpEmptyState
        icon="inbox"
        title="Inbox not found"
        description="It may have been deleted. Its tickets moved to another inbox."
        action-label="Back to inboxes"
        action-icon="arrow-left"
        :heading-level="2"
        @action="router.push(listRoute)"
      />
    </v-card>

    <MpConfirmDialog
      v-model="confirmTabSwitch"
      danger
      title="Discard unsaved changes?"
      message="You have changes on this tab that aren't saved yet."
      confirm-label="Discard changes"
      @confirm="discardAndSwitch"
    />
    <MpConfirmDialog
      v-model="confirmLeave"
      danger
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      @confirm="discardAndLeave"
    />
  </div>
</template>
