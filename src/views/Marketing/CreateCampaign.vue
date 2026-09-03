<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import CampaignEmailPreview from '@/components/marketing/CampaignEmailPreview.vue'
import CampaignContentEditor from '@/components/marketing/CampaignContentEditor.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useToast } from '@/composables/useToast'
import {
  useCampaignsStore,
  type Campaign,
  type CampaignDraftInput,
  type CampaignRecurringSchedule,
  type CampaignScheduleMethod,
} from '@/stores/useCampaigns'
import { useContactsStore } from '@/stores/useContacts'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useContentStore } from '@/stores/useContent'
import { useMarketingAssetsStore } from '@/stores/useMarketingAssets'
import { useDaVinciOnboardingStore } from '@/stores/useDaVinciOnboarding'
import { useDaVinciCampaignOnboarding } from '@/composables/useDaVinciCampaignOnboarding'
import { trackDaVinciOnboardingEvent } from '@/composables/useDaVinciOnboardingAnalytics'

// UAT-parity Email Campaign wizard (/campaigns/new/email). The source packs six
// screens behind four stepper dots (spam check hides inside Content, Review inside
// Schedule); here every screen is an honest step, and the forced spam-check gate
// is an on-demand check on the Content step — both logged in PARITY.md.
const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const contactsStore = useContactsStore()
const cdpStore = useCdpEntitiesStore()
const contentStore = useContentStore()
const assetsStore = useMarketingAssetsStore()
const daVinciOnboarding = useDaVinciOnboardingStore()
const daVinciCampaign = useDaVinciCampaignOnboarding()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const campaignsRoute = computed(() => ({ name: 'EmailCampaigns', params: { accountId: accountId.value } }))

// ── Wizard state ──────────────────────────────────────────────────────────────
const stepTitles = ['Details', 'Contacts', 'Content', 'Schedule', 'Review']
const totalSteps = stepTitles.length
const draftId = ref<number | null>(null)

// ── Step 1 — Campaign details ─────────────────────────────────────────────────
const name = ref('')
const subject = ref('')
const preheader = ref('')
const tag = ref<string | null>(null)
const tagOptions = computed(() => assetsStore.tags.map(t => t.name))

// ── Step 2 — Contacts ─────────────────────────────────────────────────────────
const audienceListIds = ref<number[]>([])
const audienceSegmentIds = ref<number[]>([])
const audienceTableIds = ref<number[]>([])
const brand = ref('Maropost')
const BRAND_OPTIONS = ['Maropost', 'Storefront Co', 'Wholesale Division']

const listItems = computed(() => cdpStore.lists.map(l => ({ title: `${l.name} (${l.count.toLocaleString()})`, value: l.id })))
const segmentItems = computed(() => contactsStore.segments.map(s => ({ title: `${s.name} (${s.count.toLocaleString()})`, value: s.id })))
const tableItems = computed(() => cdpStore.tables.map(t => ({ title: `${t.name} (${t.rows.toLocaleString()})`, value: t.id })))
const journeyItems = computed(() => store.journeys.map(j => ({ title: j.name, value: j.id })))
const secureListItems = computed(() => cdpStore.secureLists.map(l => ({ title: `${l.name} (${l.contacts.toLocaleString()})`, value: l.id })))

const audienceCount = computed(() => audienceListIds.value.length + audienceSegmentIds.value.length + audienceTableIds.value.length)
const audienceContactTotal = computed(() => {
  const listTotal = audienceListIds.value.reduce((sum, id) => sum + (cdpStore.lists.find(l => l.id === id)?.count ?? 0), 0)
  const segmentTotal = audienceSegmentIds.value.reduce((sum, id) => sum + (contactsStore.segments.find(s => s.id === id)?.count ?? 0), 0)
  const tableTotal = audienceTableIds.value.reduce((sum, id) => sum + (cdpStore.tables.find(t => t.id === id)?.rows ?? 0), 0)
  return listTotal + segmentTotal + tableTotal
})
const zeroContactAudience = computed(() => audienceCount.value > 0 && audienceContactTotal.value === 0)

// Sender — UAT autofills these from the selected list's saved profile. The
// source does it silently; here the fill is announced (autofilledFrom alert)
// and the fields stay editable.
const senderName = ref('Maropost Store')
const senderEmail = ref('hello@maropoststore.com')
const replyTo = ref('support@maropoststore.com')
const language = ref('English (US)')
const address = ref('100 King St, Sydney NSW 2000')
const LANGUAGES = ['English (US)', 'English (UK)', 'French', 'German', 'Spanish', 'Italian']
const autofilledFrom = ref<string | null>(null)

function onAudienceListsChanged(ids: number[]) {
  if (!ids.length) { autofilledFrom.value = null; return }
  const last = cdpStore.lists.find(l => l.id === ids[ids.length - 1])
  if (!last) return
  senderName.value = last.fromName
  senderEmail.value = last.fromEmail
  replyTo.value = last.replyTo
  language.value = last.language
  address.value = last.address
  autofilledFrom.value = last.name
}

function toggleAllLists() {
  audienceListIds.value = audienceListIds.value.length === listItems.value.length ? [] : listItems.value.map(i => i.value)
  onAudienceListsChanged(audienceListIds.value)
}
function toggleAllSegments() {
  audienceSegmentIds.value = audienceSegmentIds.value.length === segmentItems.value.length ? [] : segmentItems.value.map(i => i.value)
}
function toggleAllTables() {
  audienceTableIds.value = audienceTableIds.value.length === tableItems.value.length ? [] : tableItems.value.map(i => i.value)
}

const suppressListIds = ref<number[]>([])
const suppressJourneyIds = ref<number[]>([])
const suppressSegmentIds = ref<number[]>([])
const suppressSecureListIds = ref<number[]>([])
const suppressCount = computed(() =>
  suppressListIds.value.length + suppressJourneyIds.value.length + suppressSegmentIds.value.length + suppressSecureListIds.value.length,
)

// ── Step 3 — Content ──────────────────────────────────────────────────────────
const contentId = ref<number | null>(null)
const contentOptions = computed(() => contentStore.items.map(i => ({ title: i.name, value: i.id })))
const selectedContent = computed(() => contentStore.items.find(i => i.id === contentId.value) ?? null)
const showPreviewLink = ref(false)
const dynamicPreview = ref(false)
const previewRendered = ref(false)
const editorOpen = ref(false)

watch(contentId, (next) => { previewRendered.value = next !== null })

// Spam check — UAT forces this as a blocking screen between Content and Schedule.
// Here it runs on demand inside the Content step (deviation, logged in PARITY.md).
const spamScore = ref<number | null>(null)
const spamChecking = ref(false)
let spamTimer: ReturnType<typeof setTimeout> | null = null
function runSpamCheck() {
  spamChecking.value = true
  spamScore.value = null
  if (spamTimer) clearTimeout(spamTimer)
  spamTimer = setTimeout(() => {
    spamChecking.value = false
    spamScore.value = 0
  }, 1200)
}
onBeforeUnmount(() => { if (spamTimer) clearTimeout(spamTimer) })

// ── Step 4 — Schedule ─────────────────────────────────────────────────────────
interface MethodOption { title: string; value: CampaignScheduleMethod; description: string }
// All six production methods (Phase-2 decision) — UAT account 116000 only exposes
// four; STO/CTO are entitlement-gated there. Descriptions are the UAT tooltip copy.
const SCHEDULE_METHODS: MethodOption[] = [
  { value: 'send_now', title: 'Send now', description: 'Send the campaign as soon as you confirm.' },
  { value: 'priority', title: 'Priority send', description: 'Send to your most engaged contacts first.' },
  { value: 'tzo', title: 'Time zone optimization', description: 'Send to each contact at the chosen time in their own time zone.' },
  { value: 'sto', title: 'Send-time optimization', description: 'Send at each contact’s best time or day, based on their email opening habits. Without prior history, the campaign sends at the date and time below.' },
  { value: 'cto', title: 'Conversion-time optimization', description: 'Send at each contact’s best time or day, based on their purchase habits. Without prior history, the campaign sends at the date and time below.' },
  { value: 'recurring', title: 'Recurring', description: 'Send on a repeating schedule that you define.' },
]
const scheduleMethod = ref<CampaignScheduleMethod | null>(null)
const methodDescription = computed(() => SCHEDULE_METHODS.find(m => m.value === scheduleMethod.value)?.description ?? 'Choose how this campaign should be sent.')
const isDated = computed(() => scheduleMethod.value !== null && scheduleMethod.value !== 'send_now' && scheduleMethod.value !== 'recurring')

const scheduleDate = ref('')
const scheduleTime = ref('09:00')
const preSendCalc = ref(false)

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const recurringMode = ref<CampaignRecurringSchedule['mode']>('day-of-week')
const recurringDays = ref<string[]>([])
const recurringInterval = ref<CampaignRecurringSchedule['interval']>('Day')
const recurringTime = ref('09:00')

// Send test — mock: shows a toast instead of dispatching mail.
const testSubject = ref('')
const testEmails = ref<string[]>([])
const testListIds = ref<number[]>([])
const testSending = ref(false)
let testTimer: ReturnType<typeof setTimeout> | null = null
const canSendTest = computed(() => testEmails.value.length > 0 || testListIds.value.length > 0)

function sendTest() {
  if (!canSendTest.value) return
  testSending.value = true
  if (testTimer) clearTimeout(testTimer)
  testTimer = setTimeout(() => {
    testSending.value = false
    const target = testEmails.value.length
      ? `${testEmails.value.length} address${testEmails.value.length > 1 ? 'es' : ''}`
      : `${testListIds.value.length} list${testListIds.value.length > 1 ? 's' : ''}`
    toast.success(`Test email sent to ${target}`)
  }, 900)
}
onBeforeUnmount(() => { if (testTimer) clearTimeout(testTimer) })

// ── Validity ──────────────────────────────────────────────────────────────────
const step1Valid = computed(() => name.value.trim().length > 0 && subject.value.trim().length > 0)
const step2Valid = computed(() =>
  audienceCount.value > 0 && senderName.value.trim().length > 0 && senderEmail.value.trim().length > 0
  && replyTo.value.trim().length > 0 && address.value.trim().length > 0,
)
const step3Valid = computed(() => contentId.value !== null)
const step4Valid = computed(() => {
  if (scheduleMethod.value === null) return false
  if (scheduleMethod.value === 'send_now') return true
  if (scheduleMethod.value === 'recurring') {
    return recurringMode.value === 'day-of-week'
      ? recurringDays.value.length > 0 && recurringTime.value.length > 0
      : recurringTime.value.length > 0
  }
  return scheduleDate.value.length > 0 && scheduleTime.value.length > 0
})

const stepValid = computed(() => {
  if (step.value === 1) return step1Valid.value
  if (step.value === 2) return step2Valid.value
  if (step.value === 3) return step3Valid.value
  if (step.value === 4) return step4Valid.value
  return step4Valid.value
})

const stepHint = computed(() => {
  if (step.value === 1) return 'Add a campaign name and subject line to continue.'
  if (step.value === 2) return 'Select at least one list, segment, or table, and complete the sender details.'
  if (step.value === 3) return 'Choose content to continue.'
  if (step.value === 4) {
    if (scheduleMethod.value === null) return 'Choose a send method to continue.'
    if (scheduleMethod.value === 'recurring') return 'Pick at least one weekday and a time.'
    return 'Pick a send date and time to continue.'
  }
  return ''
})

// ── Persistence ───────────────────────────────────────────────────────────────
function buildInput(): CampaignDraftInput {
  const parts: string[] = []
  if (audienceListIds.value.length) parts.push(`${audienceListIds.value.length} list${audienceListIds.value.length > 1 ? 's' : ''}`)
  if (audienceSegmentIds.value.length) parts.push(`${audienceSegmentIds.value.length} segment${audienceSegmentIds.value.length > 1 ? 's' : ''}`)
  if (audienceTableIds.value.length) parts.push(`${audienceTableIds.value.length} table${audienceTableIds.value.length > 1 ? 's' : ''}`)
  const method = scheduleMethod.value ?? 'send_now'

  return {
    kind: 'email',
    name: name.value,
    subject: subject.value,
    preheader: preheader.value,
    tag: tag.value ?? '',
    audienceSummary: parts.length ? parts.join(' · ') : '',
    audienceListIds: [...audienceListIds.value],
    audienceSegmentIds: [...audienceSegmentIds.value],
    audienceTableIds: [...audienceTableIds.value],
    brand: brand.value,
    senderName: senderName.value,
    senderEmail: senderEmail.value,
    replyTo: replyTo.value,
    language: language.value,
    address: address.value,
    suppressListIds: [...suppressListIds.value],
    suppressJourneyIds: [...suppressJourneyIds.value],
    suppressSegmentIds: [...suppressSegmentIds.value],
    suppressSecureListIds: [...suppressSecureListIds.value],
    contentId: contentId.value,
    showPreviewLink: showPreviewLink.value,
    dynamicPreview: dynamicPreview.value,
    spamCheckResult: spamScore.value !== null ? `Spam score ${spamScore.value} — all clear` : null,
    spamScore: spamScore.value,
    scheduleType: method === 'send_now' ? 'now' : 'scheduled',
    scheduleMethod: method,
    recurring: method === 'recurring'
      ? { mode: recurringMode.value, days: [...recurringDays.value], interval: recurringInterval.value, time: recurringTime.value }
      : undefined,
    scheduleDate: scheduleDate.value || null,
    scheduleTime: scheduleTime.value || null,
    timezone: 'America/New_York',
    optimizations: { sto: method === 'sto', tzo: method === 'tzo', cto: method === 'cto', preSend: preSendCalc.value },
  }
}

const savedSnapshot = ref('')
const draftSavedChip = ref(false)
function captureFormSnapshot() {
  savedSnapshot.value = JSON.stringify(buildInput())
}
const isDirty = computed(() => {
  if (!savedSnapshot.value) return false
  return JSON.stringify(buildInput()) !== savedSnapshot.value
})
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave campaign wizard?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

/** Auto-saves the wizard as a Draft (or, on the final action, finalizes it). Silently no-ops until Step 1 is valid. */
function saveProgress(finalize = false) {
  if (!step1Valid.value) return
  const input = buildInput()
  if (draftId.value == null) {
    draftId.value = store.createCampaign(input, finalize)
  } else {
    store.updateCampaignDraft(draftId.value, input, finalize)
  }
  captureFormSnapshot()
  draftSavedChip.value = true
}

const { step, maxStep, goTo: goToStep, next: nextStep, prev: prevStep, unlockAll } = useWizardSteps(totalSteps, {
  canAdvance: () => stepValid.value,
  onNavigate: (_from, to) => {
    saveProgress()
    if (to === 4 && !testSubject.value) testSubject.value = `Test — ${subject.value}`
  },
})

function saveDraft() {
  saveProgress(false)
  allowNextLeave()
  toast.success('Draft saved')
  router.push(campaignsRoute.value)
}

// ── Finalize (Send now / Schedule) ────────────────────────────────────────────
const confirmFinalize = ref(false)
const finalizeLabel = computed(() => {
  if (scheduleMethod.value === 'send_now') return 'Send now'
  if (scheduleMethod.value === 'recurring') return 'Start schedule'
  return 'Schedule campaign'
})
const finalizeMessage = computed(() => {
  const audience = audienceContactTotal.value.toLocaleString()
  if (scheduleMethod.value === 'send_now') return `"${name.value}" will start sending to ${audience} contacts immediately.`
  if (scheduleMethod.value === 'recurring') return `"${name.value}" will send on its recurring schedule to ${audience} contacts.`
  return `"${name.value}" will be scheduled for ${scheduleDate.value} at ${scheduleTime.value} to ${audience} contacts.`
})
const finalizeConsequences = computed(() => {
  const items = [`Audience: ${audienceContactTotal.value.toLocaleString()} contacts across ${audienceCount.value} source${audienceCount.value === 1 ? '' : 's'}`]
  if (scheduleMethod.value === 'send_now') items.push('A send cannot be recalled once it starts')
  else items.push('You can pause or edit it from Email Campaigns until it starts sending')
  return items
})

function requestFinalize() {
  if (!step4Valid.value) return
  confirmFinalize.value = true
}
function finalizeCampaign() {
  saveProgress(true)
  allowNextLeave()
  toast.success(scheduleMethod.value === 'send_now'
    ? 'Campaign is sending'
    : scheduleMethod.value === 'recurring' ? 'Recurring schedule started' : 'Campaign scheduled')
  router.push(campaignsRoute.value)
}

// ── Edit hydration ────────────────────────────────────────────────────────────
function hydrateFrom(campaign: Campaign) {
  draftId.value = campaign.id
  const c = campaign.config
  if (!c) { name.value = campaign.name; return }
  name.value = c.name
  subject.value = c.subject
  preheader.value = c.preheader
  tag.value = c.tag || null
  audienceListIds.value = [...c.audienceListIds]
  audienceSegmentIds.value = [...c.audienceSegmentIds]
  audienceTableIds.value = [...c.audienceTableIds]
  brand.value = c.brand
  senderName.value = c.senderName
  senderEmail.value = c.senderEmail
  replyTo.value = c.replyTo
  language.value = c.language
  address.value = c.address
  suppressListIds.value = [...c.suppressListIds]
  suppressJourneyIds.value = [...c.suppressJourneyIds]
  suppressSegmentIds.value = [...c.suppressSegmentIds]
  suppressSecureListIds.value = [...c.suppressSecureListIds]
  contentId.value = c.contentId
  showPreviewLink.value = c.showPreviewLink
  dynamicPreview.value = c.dynamicPreview
  spamScore.value = c.spamScore ?? null
  scheduleMethod.value = c.scheduleMethod ?? (c.scheduleType === 'now' ? 'send_now' : 'tzo')
  scheduleDate.value = c.scheduleDate ?? ''
  scheduleTime.value = c.scheduleTime ?? '09:00'
  preSendCalc.value = c.optimizations.preSend
  if (c.recurring) {
    recurringMode.value = c.recurring.mode
    recurringDays.value = [...c.recurring.days]
    recurringInterval.value = c.recurring.interval
    recurringTime.value = c.recurring.time
  }
}

const editingExisting = ref(false)

onMounted(() => {
  let idParam = route.query.id ?? route.params.id
  if (route.query.source === 'davinci' && (!idParam || !store.getCampaign(Number(idParam)))) {
    daVinciOnboarding.begin(accountId.value)
    daVinciCampaign.createDraft()
    const restoredId = daVinciOnboarding.activeSession?.draftId
    if (restoredId) {
      idParam = String(restoredId)
      void router.replace({ query: { ...route.query, id: String(restoredId) } })
    }
  }
  const existing = idParam ? store.getCampaign(Number(idParam)) : undefined
  if (existing) {
    if (existing.config?.kind === 'ab_email') {
      void router.replace({ name: 'CreateAbCampaign', params: { accountId: accountId.value }, query: route.query })
      return
    }
    hydrateFrom(existing)
    editingExisting.value = true
    step.value = 1
    unlockAll()
    captureFormSnapshot()
    if (route.query.source === 'davinci' && daVinciOnboarding.activeSession) {
      if (daVinciOnboarding.activeSession.stage !== 'complete') {
        daVinciOnboarding.complete()
        trackDaVinciOnboardingEvent('onboarding_completed', accountId.value, { draftId: existing.id })
      }
    }
  } else {
    captureFormSnapshot()
  }
})

// "New" for the whole creation session — autosaving a draft mid-wizard must not
// flip the header to "Edit" (that only happens when re-entering from the index).
const pageTitle = computed(() => (editingExisting.value ? 'Edit email campaign' : 'New email campaign'))

// ── Review helpers ────────────────────────────────────────────────────────────
const selectedListNames = computed(() => audienceListIds.value.map(id => cdpStore.lists.find(l => l.id === id)?.name ?? `List ${id}`))
const selectedSegmentNames = computed(() => audienceSegmentIds.value.map(id => contactsStore.segments.find(s => s.id === id)?.name ?? `Segment ${id}`))
const selectedTableNames = computed(() => audienceTableIds.value.map(id => cdpStore.tables.find(t => t.id === id)?.name ?? `Table ${id}`))

const scheduleSummary = computed(() => {
  if (scheduleMethod.value === null) return 'Not chosen yet'
  const method = SCHEDULE_METHODS.find(m => m.value === scheduleMethod.value)?.title ?? ''
  if (scheduleMethod.value === 'send_now') return `${method} — immediately on launch`
  if (scheduleMethod.value === 'recurring') {
    return recurringMode.value === 'day-of-week'
      ? `${method} — every ${recurringDays.value.join(', ')} at ${recurringTime.value}`
      : `${method} — every ${recurringInterval.value.toLowerCase()} at ${recurringTime.value}`
  }
  return `${method} — ${scheduleDate.value} at ${scheduleTime.value}`
})
</script>

<template>
  <MpWizardShell
    :title="pageTitle"
    :steps="stepTitles"
    :current="step"
    :max-step="maxStep"
    :clickable="maxStep > 1"
    :back-to="campaignsRoute"
    :hint="stepValid ? undefined : stepHint"
    @select="goToStep"
    @back="prevStep"
  >
    <template #actions>
      <v-chip v-if="draftSavedChip" size="small" variant="tonal" color="success" class="font-weight-medium">Draft saved</v-chip>
      <v-btn variant="text" class="text-none text-medium-emphasis" @click="saveDraft">Save &amp; exit</v-btn>
    </template>

    <!-- Step 1: Campaign details -->
    <MpWizardStepCard v-if="step === 1" title="Campaign details" description="Name your campaign and write the subject line recipients will see.">
      <MpFormGrid>
            <v-text-field
              v-model="name"
              label="Campaign name *"
              placeholder="e.g. Black Friday 2026 — VIP Early Access"
              hint="Internal name, not shown to recipients. Emojis are not supported."
              persistent-hint
            />
            <v-text-field
              v-model="subject"
              label="Subject *"
              placeholder="e.g. 40% off sitewide — today only"
            />
            <v-text-field
              v-model="preheader"
              label="Preheader"
              placeholder="e.g. Your favourite brands, now at their lowest prices"
              :counter="100"
              maxlength="100"
              hint="Short summary shown after the subject line in the inbox"
              persistent-hint
            />
            <v-combobox
              v-model="tag"
              label="Campaign tags"
              :items="tagOptions"
              clearable
              hint="Tags are useful for custom reporting. Pick one or type a new one."
              persistent-hint
            />
          </MpFormGrid>
    </MpWizardStepCard>

    <!-- Step 2: Contacts -->
    <MpWizardStepCard v-if="step === 2" title="Contacts" description="Choose who receives this campaign — at least one list, segment, or table.">

          <MpFormGrid :cols="2">
            <v-select v-model="brand" class="mp-form-grid__full" label="Brand" :items="BRAND_OPTIONS" />
            <v-select
              v-model="audienceListIds"
              :items="listItems"
              :label="`Select list (${audienceListIds.length})`"
              multiple chips closable-chips
              @update:model-value="onAudienceListsChanged"
            >
              <template #prepend-item>
                <v-list-item title="Select all" @click="toggleAllLists" />
                <v-divider class="mt-1" />
              </template>
            </v-select>
            <v-select v-model="audienceSegmentIds" :items="segmentItems" :label="`Select segment (${audienceSegmentIds.length})`" multiple chips closable-chips>
              <template #prepend-item>
                <v-list-item title="Select all" @click="toggleAllSegments" />
                <v-divider class="mt-1" />
              </template>
            </v-select>
            <v-select v-model="audienceTableIds" class="mp-form-grid__full" :items="tableItems" :label="`Select table (${audienceTableIds.length})`" multiple chips closable-chips>
              <template #prepend-item>
                <v-list-item title="Select all" @click="toggleAllTables" />
                <v-divider class="mt-1" />
              </template>
            </v-select>

            <v-alert v-if="audienceCount === 0" type="info" variant="tonal" density="compact" rounded="lg" class="mp-form-grid__full text-body-2">
              Select at least one list, segment, or table.
            </v-alert>
            <v-alert v-else-if="zeroContactAudience" type="warning" variant="tonal" density="compact" rounded="lg" class="mp-form-grid__full text-body-2">
              The selected sources have 0 contacts. The campaign cannot send until the audience includes at least 1 contact.
            </v-alert>
            <v-alert v-else type="success" variant="tonal" density="compact" rounded="lg" class="mp-form-grid__full text-body-2" icon="user-check">
              {{ audienceContactTotal.toLocaleString() }} contacts across {{ audienceCount }} source{{ audienceCount > 1 ? 's' : '' }}.
            </v-alert>
          </MpFormGrid>

          <MpFormSection title="Sender" description="What recipients see in the From line. Selecting a list fills these from that list's saved profile — edit them any time." />
          <MpFormGrid :cols="2">
            <v-alert
              v-if="autofilledFrom"
              type="info"
              variant="tonal"
              density="compact"
              rounded="lg"
              class="mp-form-grid__full text-body-2"
              closable
              @click:close="autofilledFrom = null"
            >
              Sender details filled from "{{ autofilledFrom }}".
            </v-alert>
            <v-text-field v-model="senderName" label="From name *" hint="Special characters and emojis are not supported." />
            <v-text-field v-model="senderEmail" label="From email *" type="email" />
            <v-text-field v-model="replyTo" label="Reply to *" type="email" />
            <v-select v-model="language" label="Language *" :items="LANGUAGES" />
            <v-text-field v-model="address" class="mp-form-grid__full" label="Address *" />
          </MpFormGrid>

          <MpFormSection title="Suppress contacts" description="Contacts in these sources will not receive the campaign, even if they are in the audience above." />
          <MpFormGrid :cols="2">
            <v-select v-model="suppressListIds" :items="listItems" :label="`Suppress list (${suppressListIds.length})`" multiple chips closable-chips />
            <v-select v-model="suppressJourneyIds" :items="journeyItems" :label="`Suppress journey (${suppressJourneyIds.length})`" multiple chips closable-chips />
            <v-select v-model="suppressSegmentIds" :items="segmentItems" :label="`Suppress segment (${suppressSegmentIds.length})`" multiple chips closable-chips />
            <v-select v-model="suppressSecureListIds" :items="secureListItems" :label="`Suppress secure list (${suppressSecureListIds.length})`" multiple chips closable-chips />
          </MpFormGrid>
    </MpWizardStepCard>

    <!-- Step 3: Content -->
    <MpWizardStepCard v-if="step === 3" title="Content" description="Pick the email content this campaign will send.">

          <MpFormGrid>
            <v-autocomplete
              v-model="contentId"
              :items="contentOptions"
              label="Content name *"
              placeholder="Search the content library…"
              clearable
              prepend-inner-icon="search"
              hint="Content is created under Marketing → Content → Email Content."
              persistent-hint
            />

            <MpFormField label="Preview options">
              <div class="d-flex flex-wrap align-center ga-6">
                <v-switch v-model="showPreviewLink" label="Show email preview link" hide-details />
                <v-switch v-model="dynamicPreview" label="Dynamic content preview" hide-details />
              </div>
            </MpFormField>
            <p class="text-caption text-medium-emphasis mt-n2">
              The preview link adds "Having trouble viewing this email?" to the top of the email.
              Dynamic preview renders merge tags with a real contact from your audience.
            </p>

            <div v-if="selectedContent" class="d-flex align-center ga-3">
              <v-btn variant="outlined" class="text-none" prepend-icon="pencil" @click="editorOpen = true">Edit content</v-btn>
              <v-btn variant="text" class="text-none" prepend-icon="refresh-cw" @click="previewRendered = true">Render preview</v-btn>
            </div>

            <v-card v-if="selectedContent && previewRendered" variant="flat" border rounded="lg" class="cc-preview pa-6">
              <CampaignEmailPreview :content-name="selectedContent.name" :show-preview-link="showPreviewLink" />
            </v-card>

            <MpFormSection title="Spam check" description="Identify deliverability issues that could impact campaign performance. Optional, but recommended before sending." />
            <div class="d-flex align-center ga-4 flex-wrap">
              <v-btn
                variant="outlined"
                class="text-none"
                prepend-icon="shield-check"
                :disabled="!selectedContent"
                :loading="spamChecking"
                @click="runSpamCheck"
              >
                Run spam check
              </v-btn>
              <div v-if="spamScore !== null" class="d-flex align-center ga-3">
                <v-progress-circular :model-value="100" :size="44" :width="5" color="success">
                  <span class="text-caption font-weight-bold">{{ spamScore }}</span>
                </v-progress-circular>
                <div>
                  <p class="text-body-2 font-weight-medium mb-0">Spam score {{ spamScore }} — all clear</p>
                  <p class="text-caption text-medium-emphasis mb-0">No deliverability issues found in this content.</p>
                </div>
              </div>
            </div>
          </MpFormGrid>
    </MpWizardStepCard>

    <!-- Step 4: Schedule -->
    <MpWizardStepCard v-if="step === 4" title="Schedule" description="Select a method for scheduling your campaign.">

          <MpFormGrid :cols="2">
            <v-select
              v-model="scheduleMethod"
              class="mp-form-grid__full"
              label="Schedule with *"
              :items="SCHEDULE_METHODS"
              :hint="methodDescription"
              persistent-hint
            />

            <template v-if="isDated">
              <v-text-field v-model="scheduleDate" label="Select date *" type="date" />
              <v-text-field v-model="scheduleTime" label="Select time *" type="time" />
              <v-switch
                v-model="preSendCalc"
                class="mp-form-grid__full"
                label="Pre-send calculation"
                hint="Starts calculating the audience 3 hours ahead of the send time so large campaigns are not delayed."
                persistent-hint
              />
            </template>

            <template v-if="scheduleMethod === 'recurring'">
              <MpFormField label="Repeat pattern" class="mp-form-grid__full">
                <template #default="{ labelId }">
                  <v-radio-group v-model="recurringMode" :aria-labelledby="labelId" hide-details class="cc-schedule-options">
                    <v-card variant="flat" border rounded="lg" class="pa-4">
                      <v-radio value="day-of-week">
                        <template #label>
                          <span class="font-weight-bold ml-2">Selected days of the week</span>
                        </template>
                      </v-radio>
                      <div v-if="recurringMode === 'day-of-week'" class="pl-8 pt-2 d-flex flex-column ga-3">
                        <v-chip-group
                          v-model="recurringDays"
                          multiple
                          column
                          aria-label="Days of the week"
                        >
                          <v-chip
                            v-for="day in WEEKDAYS"
                            :key="day"
                            :value="day"
                            variant="outlined"
                            filter
                          >
                            {{ day }}
                          </v-chip>
                        </v-chip-group>
                        <v-text-field v-model="recurringTime" label="Select time *" type="time" class="cc-time" />
                      </div>
                    </v-card>
                    <v-card variant="flat" border rounded="lg" class="pa-4">
                      <v-radio value="repeat-every">
                        <template #label>
                          <span class="font-weight-bold ml-2">Repeat every</span>
                        </template>
                      </v-radio>
                      <div v-if="recurringMode === 'repeat-every'" class="pl-8 pt-2 d-flex ga-4 flex-wrap">
                        <v-select v-model="recurringInterval" :items="['Day', 'Week', 'Month', 'Year']" label="Interval *" class="cc-time" />
                        <v-text-field v-model="recurringTime" label="Select time *" type="time" class="cc-time" />
                      </div>
                    </v-card>
                  </v-radio-group>
                </template>
              </MpFormField>
            </template>
          </MpFormGrid>

          <MpFormSection title="Send test email" description="Send a test to yourself or teammates first — up to 10 addresses, or lists totalling 20 contacts." />
          <MpFormGrid :cols="2">
            <v-text-field v-model="testSubject" class="mp-form-grid__full" label="Test subject *" />
            <v-combobox
              v-model="testEmails"
              label="Enter email"
              multiple chips closable-chips
              hint="Press Enter after each address"
              persistent-hint
            />
            <v-select v-model="testListIds" :items="listItems" :label="`Select list (${testListIds.length})`" multiple chips closable-chips />
            <div class="mp-form-grid__full">
              <v-btn
                variant="outlined"
                class="text-none"
                prepend-icon="send"
                :disabled="!canSendTest"
                :loading="testSending"
                @click="sendTest"
              >
                Send test
              </v-btn>
            </div>
          </MpFormGrid>
    </MpWizardStepCard>

    <!-- Step 5: Review -->
    <MpWizardStepCard v-if="step === 5" title="Review" description="Final review of your campaign before it goes out.">

          <v-alert v-if="zeroContactAudience" type="warning" variant="tonal" density="compact" rounded="lg" class="text-body-2 mb-6">
            The selected audience has 0 contacts — the campaign cannot send until at least 1 contact is included.
          </v-alert>

          <section class="d-flex flex-column ga-6">
            <div>
              <div class="d-flex align-center ga-2 mb-3">
                <h3 class="mp-section-title">Campaign details</h3>
                <v-btn icon="pencil" size="x-small" variant="text" aria-label="Edit campaign details" @click="goToStep(1)" />
              </div>
              <dl class="cc-review-grid">
                <dt>Campaign name</dt><dd>{{ name || '—' }}</dd>
                <dt>Subject</dt><dd>{{ subject || '—' }}</dd>
                <dt>Preheader</dt><dd>{{ preheader || '—' }}</dd>
                <dt>Tags</dt><dd>{{ tag || 'None' }}</dd>
              </dl>
            </div>
            <v-divider />
            <div>
              <div class="d-flex align-center ga-2 mb-3">
                <h3 class="mp-section-title">Contacts</h3>
                <v-btn icon="pencil" size="x-small" variant="text" aria-label="Edit contacts" @click="goToStep(2)" />
              </div>
              <dl class="cc-review-grid">
                <dt>Audience</dt>
                <dd>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip v-for="n in selectedListNames" :key="`l-${n}`" size="small" variant="tonal">{{ n }}</v-chip>
                    <v-chip v-for="n in selectedSegmentNames" :key="`s-${n}`" size="small" variant="tonal">{{ n }}</v-chip>
                    <v-chip v-for="n in selectedTableNames" :key="`t-${n}`" size="small" variant="tonal">{{ n }}</v-chip>
                    <span v-if="!audienceCount" class="text-medium-emphasis">None selected</span>
                  </div>
                </dd>
                <dt>Suppressed</dt><dd>{{ suppressCount ? `${suppressCount} source${suppressCount > 1 ? 's' : ''}` : 'None' }}</dd>
                <dt>From</dt><dd>{{ senderName }} &lt;{{ senderEmail }}&gt;</dd>
                <dt>Reply to</dt><dd>{{ replyTo }}</dd>
                <dt>Language</dt><dd>{{ language }}</dd>
                <dt>Address</dt><dd>{{ address }}</dd>
              </dl>
            </div>
            <v-divider />
            <div>
              <div class="d-flex align-center ga-2 mb-3">
                <h3 class="mp-section-title">Content</h3>
                <v-btn icon="pencil" size="x-small" variant="text" aria-label="Edit content" @click="goToStep(3)" />
              </div>
              <dl class="cc-review-grid mb-4">
                <dt>Content name</dt><dd>{{ selectedContent?.name ?? 'Not selected' }}</dd>
                <dt>Email preview link</dt><dd>{{ showPreviewLink ? 'Yes' : 'No' }}</dd>
                <dt>Spam check</dt>
                <dd>{{ spamScore !== null ? `Score ${spamScore} — all clear` : 'Not run' }}</dd>
              </dl>
              <v-card v-if="selectedContent" variant="flat" border rounded="lg" class="cc-preview pa-6">
                <CampaignEmailPreview :content-name="selectedContent.name" :show-preview-link="showPreviewLink" />
              </v-card>
            </div>
            <v-divider />
            <div>
              <div class="d-flex align-center ga-2 mb-3">
                <h3 class="mp-section-title">Schedule</h3>
                <v-btn icon="pencil" size="x-small" variant="text" aria-label="Edit schedule" @click="goToStep(4)" />
              </div>
              <dl class="cc-review-grid">
                <dt>Send method</dt><dd>{{ scheduleSummary }}</dd>
                <dt v-if="isDated">Pre-send calculation</dt><dd v-if="isDated">{{ preSendCalc ? 'On' : 'Off' }}</dd>
              </dl>
            </div>
          </section>
    </MpWizardStepCard>

    <template #footer>
      <v-btn v-if="step < totalSteps" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!stepValid" @click="nextStep">
        Continue
      </v-btn>
      <template v-else>
        <v-btn variant="outlined" class="text-none" @click="saveDraft">Save draft</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" :disabled="!step4Valid" @click="requestFinalize">
          {{ finalizeLabel }}
        </v-btn>
      </template>
    </template>
  </MpWizardShell>

  <CampaignContentEditor v-model="editorOpen" :content-name="selectedContent?.name ?? 'Untitled content'" />

  <MpConfirmDialog
    v-model="confirmFinalize"
    :title="finalizeLabel"
    :message="finalizeMessage"
    :confirm-label="finalizeLabel"
    :consequences="finalizeConsequences"
    @confirm="finalizeCampaign"
  />

  <MpConfirmDialog
    v-model="confirmLeave"
    danger
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    @confirm="discardAndLeave"
  />
</template>

<style scoped>
.cc-preview { background: var(--surface-sunken); }
.cc-time { max-width: 220px; }
/* The radio group owns the rhythm between its schedule option tiles. */
.cc-schedule-options :deep(.v-selection-control-group) { gap: var(--mp-component-field-groupGap); }
.cc-review-grid {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  row-gap: var(--mp-space-8);
  column-gap: var(--mp-space-16);
}
.cc-review-grid dt {
  font-size: var(--mp-fontSize-12);
  font-weight: var(--mp-fontWeight-medium);
  color: var(--text-secondary);
}
.cc-review-grid dd { font-size: var(--mp-fontSize-13); margin: 0; overflow-wrap: anywhere; }
</style>
