<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpOptionCard from '@/components/MpOptionCard.vue'
import type { ComponentPublicInstance } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useCampaignsStore, type Campaign, type CampaignDraftInput } from '@/stores/useCampaigns'
import { useContactsStore } from '@/stores/useContacts'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useContentStore } from '@/stores/useContent'

const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const contactsStore = useContactsStore()
const cdpStore = useCdpEntitiesStore()
const contentStore = useContentStore()

const accountId = computed(() => route.params.accountId as string)
const campaignsRoute = computed(() => ({ name: 'EmailCampaigns', params: { accountId: accountId.value } }))

// ── Type gate (pre-step, not part of the numbered wizard) ────────────────────
const typeChosen = ref(false)
const kind = ref<'email' | 'ab_email'>('email')

function chooseType(next: 'email' | 'ab_email') {
  kind.value = next
  typeChosen.value = true
  captureFormSnapshot()
}

// Keyboard support: arrow-key navigation between the two type cards, Enter/Space
// to choose (handled by MpOptionCard itself via its native click fallthrough).
const emailCardRef = ref<ComponentPublicInstance | null>(null)
const abCardRef = ref<ComponentPublicInstance | null>(null)

function focusCard(cardRef: typeof emailCardRef) {
  (cardRef.value?.$el as HTMLElement | undefined)?.focus()
}

function onTypeGateKeydown(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  const active = document.activeElement
  if (e.key === 'ArrowRight' && active === emailCardRef.value?.$el) {
    e.preventDefault()
    focusCard(abCardRef)
  } else if (e.key === 'ArrowLeft' && active === abCardRef.value?.$el) {
    e.preventDefault()
    focusCard(emailCardRef)
  }
}

// ── Wizard state ──────────────────────────────────────────────────────────────
const stepTitles = ['Details', 'Contacts', 'Content', 'Schedule & Review']
const totalSteps = stepTitles.length
const step = ref(1)
const maxStepReached = ref(1)
const draftId = ref<number | null>(null)

// Step 1 — Details
const name = ref('')
const subject = ref('')
const subjectB = ref('')
const preheader = ref('')
const tag = ref<string | null>(null)
const TAG_OPTIONS = ['Newsletter', 'Promo_2026', 'Onboarding', 'Retention']
const testSplitPercent = ref(50)

// Step 2 — Contacts: audience
const audienceListIds = ref<number[]>([])
const audienceSegmentIds = ref<number[]>([])
const audienceTableIds = ref<number[]>([])
const brand = ref('Maropost')
const BRAND_OPTIONS = ['Maropost', 'Storefront Co', 'Wholesale Division']

const cdpLists = computed(() => cdpStore.lists)
const segments = computed(() => contactsStore.segments)
const tables = computed(() => cdpStore.tables)
const secureLists = computed(() => cdpStore.secureLists)

const listItems = computed(() => cdpLists.value.map(l => ({ title: `${l.name} (${l.count.toLocaleString()})`, value: l.id })))
const segmentItems = computed(() => segments.value.map(s => ({ title: `${s.name} (${s.count.toLocaleString()})`, value: s.id })))
const tableItems = computed(() => tables.value.map(t => ({ title: `${t.name} (${t.rows.toLocaleString()})`, value: t.id })))
const journeyItems = computed(() => store.journeys.map(j => ({ title: j.name, value: j.id })))
const secureListItems = computed(() => secureLists.value.map(l => ({ title: `${l.name} (${l.contacts.toLocaleString()})`, value: l.id })))

function toggleAllLists() {
  audienceListIds.value = audienceListIds.value.length === listItems.value.length ? [] : listItems.value.map(i => i.value)
}
function toggleAllSegments() {
  audienceSegmentIds.value = audienceSegmentIds.value.length === segmentItems.value.length ? [] : segmentItems.value.map(i => i.value)
}
function toggleAllTables() {
  audienceTableIds.value = audienceTableIds.value.length === tableItems.value.length ? [] : tableItems.value.map(i => i.value)
}

// Sender
const senderName = ref('Maropost Store')
const senderEmail = ref('hello@maropoststore.com')
const replyTo = ref('support@maropoststore.com')
const language = ref('English (US)')
const address = ref('100 King St, Sydney NSW 2000')
const LANGUAGES = ['English (US)', 'English (UK)', 'French', 'German', 'Spanish', 'Italian']

// Autofill sender fields from the last-selected list, per legacy behaviour.
function onAudienceListsChanged(ids: number[]) {
  if (!ids.length) return
  const last = cdpLists.value.find(l => l.id === ids[ids.length - 1])
  if (!last) return
  senderName.value = last.fromName
  senderEmail.value = last.fromEmail
  replyTo.value = last.replyTo
  language.value = last.language
  address.value = last.address
}

// Suppress contacts (collapsible, optional)
const suppressListIds = ref<number[]>([])
const suppressJourneyIds = ref<number[]>([])
const suppressSegmentIds = ref<number[]>([])
const suppressSecureListIds = ref<number[]>([])
const suppressCount = computed(() =>
  suppressListIds.value.length + suppressJourneyIds.value.length + suppressSegmentIds.value.length + suppressSecureListIds.value.length,
)

// Step 3 — Content
const contentId = ref<number | null>(null)
const contentOptions = computed(() => contentStore.items.map(i => ({ title: i.name, value: i.id })))
const selectedContent = computed(() => contentStore.items.find(i => i.id === contentId.value) ?? null)
const showPreviewLink = ref(false)
const dynamicPreview = ref(false)
const spamCheckResult = ref<string | null>(null)

function runSpamCheck() {
  spamCheckResult.value = 'Looks good — 0 spam triggers found'
}

// Merge-tag placeholders shown in the content preview (kept as plain string constants —
// embedding literal "{{ }}" text directly inside a template interpolation breaks the compiler).
const mergeTagFirstName = '{{contact.first_name}}'
const mergeTagAddress = '{{campaign.address}}'
const mergeTagUnsubscribe = '{{campaign.unsubscribe_link}}'

// Step 4 — Schedule & Review
const scheduleType = ref<'now' | 'scheduled'>('now')
const scheduleDate = ref('')
const scheduleTime = ref('09:00')
const timezone = ref('America/New_York')
const TIMEZONES = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'UTC', 'Europe/London']
const optimizations = reactive({ sto: false, tzo: false, cto: false, preSend: false })
const winnerCriteria = ref<'opens' | 'clicks' | 'revenue'>('opens')

// ── Validity per step ─────────────────────────────────────────────────────────
const audienceCount = computed(() => audienceListIds.value.length + audienceSegmentIds.value.length + audienceTableIds.value.length)

const step1Valid = computed(() => {
  const base = name.value.trim().length > 0 && subject.value.trim().length > 0
  return kind.value === 'ab_email' ? base && subjectB.value.trim().length > 0 : base
})
const step2Valid = computed(() =>
  audienceCount.value > 0 && senderName.value.trim().length > 0 && senderEmail.value.trim().length > 0
  && replyTo.value.trim().length > 0 && address.value.trim().length > 0,
)
const step3Valid = computed(() => contentId.value !== null)
const step4Valid = computed(() => scheduleType.value === 'now' || scheduleDate.value.length > 0)

const stepValid = computed(() => {
  if (step.value === 1) return step1Valid.value
  if (step.value === 2) return step2Valid.value
  if (step.value === 3) return step3Valid.value
  return step4Valid.value
})

const stepHint = computed(() => {
  if (step.value === 1) return 'Add a campaign name and subject line to continue.'
  if (step.value === 2) return 'Select at least one list, segment, or table, and complete the sender details.'
  if (step.value === 3) return 'Choose content to continue.'
  if (step.value === 4 && scheduleType.value === 'scheduled') return 'Pick a send date to continue.'
  return ''
})

// ── Persistence (auto-save on step change) ────────────────────────────────────
function buildInput(): CampaignDraftInput {
  const parts: string[] = []
  if (audienceListIds.value.length) parts.push(`${audienceListIds.value.length} list${audienceListIds.value.length > 1 ? 's' : ''}`)
  if (audienceSegmentIds.value.length) parts.push(`${audienceSegmentIds.value.length} segment${audienceSegmentIds.value.length > 1 ? 's' : ''}`)
  if (audienceTableIds.value.length) parts.push(`${audienceTableIds.value.length} table${audienceTableIds.value.length > 1 ? 's' : ''}`)

  return {
    kind: kind.value,
    name: name.value,
    subject: subject.value,
    subjectB: kind.value === 'ab_email' ? subjectB.value : undefined,
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
    spamCheckResult: spamCheckResult.value,
    scheduleType: scheduleType.value,
    scheduleDate: scheduleDate.value || null,
    scheduleTime: scheduleTime.value || null,
    timezone: timezone.value,
    optimizations: { ...optimizations },
    testSplitPercent: kind.value === 'ab_email' ? testSplitPercent.value : undefined,
    winnerCriteria: kind.value === 'ab_email' ? winnerCriteria.value : undefined,
  }
}

const savedSnapshot = ref('')
const draftSavedChip = ref(false)
function captureFormSnapshot() {
  savedSnapshot.value = JSON.stringify(buildInput())
}
const isDirty = computed(() => {
  if (!typeChosen.value || !savedSnapshot.value) return false
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

function goToStep(target: number) {
  if (target === step.value) return
  if (target > step.value && !stepValid.value) return
  if (step.value >= 1) saveProgress()
  step.value = target
  maxStepReached.value = Math.max(maxStepReached.value, target)
}

function nextStep() {
  goToStep(Math.min(step.value + 1, totalSteps))
}
function prevStep() {
  goToStep(Math.max(step.value - 1, 1))
}

function saveDraft() {
  saveProgress(false)
  allowNextLeave()
  router.push(campaignsRoute.value)
}

function scheduleCampaign() {
  if (!step4Valid.value) return
  saveProgress(true)
  allowNextLeave()
  router.push(campaignsRoute.value)
}

function exitWizard() {
  saveProgress(false)
  allowNextLeave()
  router.push(campaignsRoute.value)
}

// ── Edit hydration ────────────────────────────────────────────────────────────
function hydrateFrom(campaign: Campaign) {
  draftId.value = campaign.id
  const c = campaign.config
  if (!c) {
    name.value = campaign.name
    return
  }
  kind.value = c.kind
  name.value = c.name
  subject.value = c.subject
  subjectB.value = c.subjectB ?? ''
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
  spamCheckResult.value = c.spamCheckResult
  scheduleType.value = c.scheduleType
  scheduleDate.value = c.scheduleDate ?? ''
  scheduleTime.value = c.scheduleTime ?? '09:00'
  timezone.value = c.timezone
  optimizations.sto = c.optimizations.sto
  optimizations.tzo = c.optimizations.tzo
  optimizations.cto = c.optimizations.cto
  optimizations.preSend = c.optimizations.preSend
  testSplitPercent.value = c.testSplitPercent ?? 50
  winnerCriteria.value = c.winnerCriteria ?? 'opens'
}

onMounted(() => {
  const idParam = route.query.id ?? route.params.id
  const existing = idParam ? store.getCampaign(Number(idParam)) : undefined
  if (existing) {
    hydrateFrom(existing)
    typeChosen.value = true
    step.value = 1
    maxStepReached.value = totalSteps
    captureFormSnapshot()
  } else {
    focusCard(emailCardRef)
  }
})

const pageTitle = computed(() => (draftId.value != null ? `Edit ${kind.value === 'ab_email' ? 'A/B ' : ''}Campaign` : `New ${kind.value === 'ab_email' ? 'A/B ' : ''}Email Campaign`))

// Review summary (Step 4)
const reviewItems = computed(() => {
  const items: { label: string; value: string; icon: string }[] = [
    { label: 'Campaign Name', value: name.value || '—', icon: 'pencil' },
    { label: 'Subject Line', value: kind.value === 'ab_email' ? `A: ${subject.value || '—'}  ·  B: ${subjectB.value || '—'}` : (subject.value || '—'), icon: 'mail' },
    { label: 'Campaign Tag', value: tag.value || 'None', icon: 'tag' },
    { label: 'Audience', value: audienceCount.value ? `${audienceCount.value} source${audienceCount.value > 1 ? 's' : ''} selected` : 'None selected', icon: 'users' },
    { label: 'Suppressed', value: suppressCount.value ? `${suppressCount.value} suppression${suppressCount.value > 1 ? 's' : ''}` : 'None', icon: 'user-x' },
    { label: 'Sender', value: `${senderName.value} <${senderEmail.value}>`, icon: 'user' },
    { label: 'Content', value: selectedContent.value?.name ?? 'Not selected', icon: 'file-text' },
    { label: 'Send Time', value: scheduleType.value === 'now' ? 'Immediately after launch' : `${scheduleDate.value} at ${scheduleTime.value} (${timezone.value})`, icon: 'clock' },
  ]
  if (kind.value === 'ab_email') {
    items.push({ label: 'Test Split', value: `${testSplitPercent.value}% · winner by ${winnerCriteria.value}`, icon: 'split' })
  }
  return items
})

const enabledOptimizations = computed(() => {
  const labels: string[] = []
  if (optimizations.sto) labels.push('Send Time Optimization')
  if (optimizations.tzo) labels.push('Time Zone Optimization')
  if (optimizations.cto) labels.push('Conversion Time Optimization')
  if (optimizations.preSend) labels.push('Pre-Send Calculation')
  return labels.length ? labels.join(', ') : 'None enabled'
})
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Type gate -->
    <template v-if="!typeChosen">
      <div class="cc-head px-8 pt-6 pb-4 bg-surface border-b">
        <MpPageHeader title="New Email Campaign" subtitle="Choose a campaign type to get started" :back-to="campaignsRoute" />
      </div>
      <div class="flex-grow-1 overflow-y-auto pa-8 bg-background" @keydown="onTypeGateKeydown">
        <div style="max-width: 640px; width: 100%; margin: 0 auto;">
          <v-row dense>
            <v-col cols="12" sm="6">
              <MpOptionCard
                ref="emailCardRef"
                :selected="false"
                title="Email Campaign"
                description="A single email sent to your chosen audience."
                icon="mail"
                class="h-100"
                @click="chooseType('email')"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <MpOptionCard
                ref="abCardRef"
                :selected="false"
                title="A/B Email Campaign"
                description="Test two subject lines and automatically send the winner."
                icon="split"
                class="h-100"
                @click="chooseType('ab_email')"
              />
            </v-col>
          </v-row>
          <div class="d-flex justify-end mt-6">
            <v-btn variant="text" class="text-none" :to="campaignsRoute">Cancel</v-btn>
          </div>
        </div>
      </div>
    </template>

    <!-- Wizard -->
    <template v-else>
      <div class="cc-head px-8 pt-6 pb-4 bg-surface border-b">
        <MpPageHeader
          :title="pageTitle"
          :subtitle="`Step ${step} of ${totalSteps} — ${stepTitles[step - 1]}`"
          :back-to="campaignsRoute"
        >
          <template #actions>
            <v-chip v-if="draftSavedChip" size="small" variant="tonal" color="success" class="font-weight-medium">Draft saved</v-chip>
            <v-btn variant="text" class="text-none text-medium-emphasis" @click="exitWizard">Save &amp; exit</v-btn>
          </template>
          <template #tabs>
            <MpWizardSteps
              :steps="stepTitles"
              :current="step"
              :clickable="maxStepReached > 1"
              :max-step="maxStepReached"
              class="mt-3"
              @select="goToStep"
            />
          </template>
        </MpPageHeader>
      </div>

      <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
        <div style="max-width: 780px; margin: 0 auto;">

          <!-- Step 1: Details -->
          <v-card v-if="step === 1" variant="flat" border rounded="lg" class="pa-8">
            <div class="text-h6 font-weight-bold mb-1">Campaign Details</div>
            <div class="text-body-2 text-medium-emphasis mb-6">Name your campaign and write the subject line recipients will see.</div>
            <v-divider class="mb-6"></v-divider>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="name" label="Campaign Name *" placeholder="e.g. Black Friday 2026 — VIP Early Access" variant="outlined" density="comfortable" hint="Internal name, not shown to recipients" persistent-hint class="mb-4"></v-text-field>
              </v-col>
              <v-col cols="12" :sm="kind === 'ab_email' ? 6 : 12">
                <v-text-field v-model="subject" :label="kind === 'ab_email' ? 'Subject Line A *' : 'Subject Line *'" placeholder="e.g. 🔥 40% Off Sitewide — Today Only!" variant="outlined" density="comfortable" class="mb-4"></v-text-field>
              </v-col>
              <v-col v-if="kind === 'ab_email'" cols="12" sm="6">
                <v-text-field v-model="subjectB" label="Subject Line B *" placeholder="e.g. Today only — 40% off everything" variant="outlined" density="comfortable" class="mb-4"></v-text-field>
              </v-col>
              <v-col v-if="kind === 'ab_email'" cols="12" sm="6">
                <v-slider v-model="testSplitPercent" label="Test split %" min="10" max="50" step="5" thumb-label="always" class="mb-2"></v-slider>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="preheader" label="Preheader" placeholder="e.g. Your favourite brands, now at the lowest prices..." variant="outlined" density="comfortable" :counter="100" maxlength="100" hint="Shown in inbox previews after the subject line" persistent-hint class="mb-4"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-combobox v-model="tag" label="Campaign Tag" :items="TAG_OPTIONS" variant="outlined" density="comfortable" clearable hint="Pick an existing tag or type a new one" persistent-hint></v-combobox>
              </v-col>
            </v-row>
          </v-card>

          <!-- Step 2: Contacts -->
          <v-card v-if="step === 2" variant="flat" border rounded="lg" class="pa-8">
            <div class="text-h6 font-weight-bold mb-1">Contacts</div>
            <div class="text-body-2 text-medium-emphasis mb-6">Choose who receives this campaign and the sender details they'll see.</div>
            <v-divider class="mb-6"></v-divider>

            <v-select v-model="brand" label="Brand" :items="BRAND_OPTIONS" variant="outlined" density="comfortable" class="mb-4"></v-select>

            <v-row dense>
              <v-col cols="12" md="4">
                <v-select
                  v-model="audienceListIds"
                  :items="listItems"
                  item-title="title" item-value="value"
                  :label="`Select List (${audienceListIds.length})`" multiple chips closable-chips variant="outlined" density="comfortable"
                  @update:model-value="onAudienceListsChanged"
                >
                  <template #prepend-item>
                    <v-list-item title="Select all" @click="toggleAllLists"></v-list-item>
                    <v-divider class="mt-1"></v-divider>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="audienceSegmentIds" :items="segmentItems" item-title="title" item-value="value" :label="`Select Segment (${audienceSegmentIds.length})`" multiple chips closable-chips variant="outlined" density="comfortable">
                  <template #prepend-item>
                    <v-list-item title="Select all" @click="toggleAllSegments"></v-list-item>
                    <v-divider class="mt-1"></v-divider>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="audienceTableIds" :items="tableItems" item-title="title" item-value="value" :label="`Select Table (${audienceTableIds.length})`" multiple chips closable-chips variant="outlined" density="comfortable">
                  <template #prepend-item>
                    <v-list-item title="Select all" @click="toggleAllTables"></v-list-item>
                    <v-divider class="mt-1"></v-divider>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            <v-alert v-if="audienceCount === 0" type="info" variant="tonal" density="compact" rounded="lg" class="mb-6 text-body-2">
              Please select at least one List, Segment, or Table.
            </v-alert>
            <v-alert v-else type="success" variant="tonal" density="compact" rounded="lg" class="mb-6 text-body-2" icon="user-check">
              {{ audienceCount }} audience source{{ audienceCount > 1 ? 's' : '' }} selected.
            </v-alert>

            <v-expansion-panels variant="accordion" class="mp-suppress-panel">
              <v-expansion-panel rounded="lg" elevation="0">
                <v-expansion-panel-title>
                  <span class="text-body-2 font-weight-bold">Sender</span>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mb-2">
                    <v-col cols="12" sm="6"><v-text-field v-model="senderName" label="From Name *" variant="outlined" density="comfortable"></v-text-field></v-col>
                    <v-col cols="12" sm="6"><v-text-field v-model="senderEmail" label="From Email *" variant="outlined" density="comfortable"></v-text-field></v-col>
                    <v-col cols="12" sm="6"><v-text-field v-model="replyTo" label="Reply To *" variant="outlined" density="comfortable"></v-text-field></v-col>
                    <v-col cols="12" sm="3"><v-select v-model="language" label="Language *" :items="LANGUAGES" variant="outlined" density="comfortable"></v-select></v-col>
                    <v-col cols="12" sm="3"><v-text-field v-model="address" label="Address *" variant="outlined" density="comfortable"></v-text-field></v-col>
                  </v-row>
                  <div class="text-caption text-medium-emphasis">Selecting a list autofills sender details from that list's saved profile.</div>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel rounded="lg" elevation="0">
                <v-expansion-panel-title>
                  <span class="text-body-2 font-weight-bold">Suppress contacts (optional)</span>
                  <v-chip v-if="suppressCount" size="x-small" variant="tonal" color="primary" class="ml-3">{{ suppressCount }}</v-chip>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <v-select v-model="suppressListIds" :items="listItems" item-title="title" item-value="value" label="Suppress List" multiple chips closable-chips variant="outlined" density="comfortable"></v-select>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="suppressJourneyIds" :items="journeyItems" item-title="title" item-value="value" label="Suppress Journey" multiple chips closable-chips variant="outlined" density="comfortable"></v-select>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="suppressSegmentIds" :items="segmentItems" item-title="title" item-value="value" label="Suppress Segment" multiple chips closable-chips variant="outlined" density="comfortable"></v-select>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select v-model="suppressSecureListIds" :items="secureListItems" item-title="title" item-value="value" label="Suppress Secure List" multiple chips closable-chips variant="outlined" density="comfortable"></v-select>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card>

          <!-- Step 3: Content -->
          <v-card v-if="step === 3" variant="flat" border rounded="lg" class="pa-8">
            <div class="text-h6 font-weight-bold mb-1">Content</div>
            <div class="text-body-2 text-medium-emphasis mb-6">Pick the email content this campaign will send.</div>
            <v-divider class="mb-6"></v-divider>

            <v-autocomplete
              v-model="contentId"
              :items="contentOptions"
              item-title="title" item-value="value"
              label="Content Name *"
              placeholder="Search the content library…"
              variant="outlined" density="comfortable" clearable
              prepend-inner-icon="search"
              class="mb-6"
            ></v-autocomplete>

            <v-card v-if="selectedContent" variant="tonal" color="primary" rounded="lg" class="pa-5 mb-6">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center gap-2">
                  <v-icon size="18">file-text</v-icon>
                  <span class="font-weight-bold">{{ selectedContent.name }}</span>
                </div>
                <v-btn
                  icon="pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit content"
                  :to="{ name: 'EmailContentEditor', params: { accountId, id: String(selectedContent.id) } }"
                />
              </div>
              <div class="mp-content-preview rounded-lg pa-4 text-body-2">
                <div>Hi {{ mergeTagFirstName }},</div>
                <div class="my-2">Thanks for shopping with {{ mergeTagAddress }}. Here's what's new for you today…</div>
                <div class="text-caption text-medium-emphasis">{{ mergeTagUnsubscribe }}</div>
              </div>
            </v-card>

            <div class="d-flex flex-wrap align-center gap-6 mb-6">
              <v-switch v-model="showPreviewLink" color="primary" density="compact" hide-details label="Show email preview link"></v-switch>
              <v-switch v-model="dynamicPreview" color="primary" density="compact" hide-details label="Dynamic content preview"></v-switch>
            </div>

            <div class="d-flex align-center gap-4">
              <v-btn variant="outlined" class="text-none" prepend-icon="shield-check" :disabled="!selectedContent" @click="runSpamCheck">Run spam check</v-btn>
              <v-chip v-if="spamCheckResult" color="success" variant="tonal" prepend-icon="check-circle">{{ spamCheckResult }}</v-chip>
            </div>
          </v-card>

          <!-- Step 4: Schedule & Review -->
          <v-card v-if="step === 4" variant="flat" border rounded="lg" class="pa-8">
            <div class="text-h6 font-weight-bold mb-1">Schedule &amp; Review</div>
            <div class="text-body-2 text-medium-emphasis mb-6">Choose when to send, then confirm your setup.</div>
            <v-divider class="mb-6"></v-divider>

            <v-radio-group v-model="scheduleType" class="mb-4">
              <v-card variant="outlined" rounded="lg" class="pa-4 mb-3 cursor-pointer" :color="scheduleType === 'now' ? 'primary' : ''" @click="scheduleType = 'now'">
                <v-radio value="now" color="primary">
                  <template #label>
                    <div class="ml-2">
                      <div class="font-weight-bold">Send Immediately</div>
                      <div class="text-caption text-medium-emphasis">Sends as soon as you click "{{ kind === 'ab_email' ? 'Send test' : 'Schedule campaign' }}"</div>
                    </div>
                  </template>
                </v-radio>
              </v-card>
              <v-card variant="outlined" rounded="lg" class="pa-4 cursor-pointer" @click="scheduleType = 'scheduled'">
                <v-radio value="scheduled" color="primary">
                  <template #label>
                    <div class="ml-2">
                      <div class="font-weight-bold">Schedule for Later</div>
                      <div class="text-caption text-medium-emphasis">Pick a specific date and time for delivery</div>
                    </div>
                  </template>
                </v-radio>
              </v-card>
            </v-radio-group>
            <v-expand-transition>
              <v-row v-if="scheduleType === 'scheduled'" class="mb-2">
                <v-col cols="12" sm="5"><v-text-field v-model="scheduleDate" label="Date" type="date" variant="outlined" density="comfortable"></v-text-field></v-col>
                <v-col cols="12" sm="4"><v-text-field v-model="scheduleTime" label="Time" type="time" variant="outlined" density="comfortable"></v-text-field></v-col>
                <v-col cols="12" sm="3"><v-select v-model="timezone" label="Timezone" :items="TIMEZONES" variant="outlined" density="comfortable"></v-select></v-col>
              </v-row>
            </v-expand-transition>

            <div class="text-subtitle-2 font-weight-bold mt-4 mb-3">Send-time optimization</div>
            <v-row dense class="mb-2">
              <v-col cols="6" sm="3"><v-switch v-model="optimizations.sto" color="primary" density="compact" hide-details label="STO"></v-switch></v-col>
              <v-col cols="6" sm="3"><v-switch v-model="optimizations.tzo" color="primary" density="compact" hide-details label="TZO"></v-switch></v-col>
              <v-col cols="6" sm="3"><v-switch v-model="optimizations.cto" color="primary" density="compact" hide-details label="CTO"></v-switch></v-col>
              <v-col cols="6" sm="3"><v-switch v-model="optimizations.preSend" color="primary" density="compact" hide-details label="Pre-Send Calc"></v-switch></v-col>
            </v-row>

            <template v-if="kind === 'ab_email'">
              <v-divider class="my-6"></v-divider>
              <div class="text-subtitle-2 font-weight-bold mb-3">A/B winner criteria</div>
              <v-select v-model="winnerCriteria" :items="[{title:'Opens', value:'opens'},{title:'Clicks', value:'clicks'},{title:'Revenue', value:'revenue'}]" item-title="title" item-value="value" label="Pick the winner by" variant="outlined" density="comfortable" style="max-width: 320px;"></v-select>
            </template>

            <v-divider class="my-6"></v-divider>
            <div class="text-subtitle-2 font-weight-bold mb-3">Review</div>
            <v-list lines="two" density="compact" class="mb-4 rounded-xl border pa-0 overflow-hidden">
              <template v-for="(item, idx) in reviewItems" :key="idx">
                <v-list-item class="px-5 py-3" :class="{ 'border-b': idx < reviewItems.length - 1 }">
                  <template #prepend>
                    <v-avatar size="36" color="primary" variant="tonal" class="mr-3"><v-icon color="primary" size="18">{{ item.icon }}</v-icon></v-avatar>
                  </template>
                  <v-list-item-title class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ item.label }}</v-list-item-title>
                  <v-list-item-subtitle class="text-body-2 font-weight-medium mt-1" style="opacity: 1;">{{ item.value }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-list>
            <div class="text-caption text-medium-emphasis">Optimizations: {{ enabledOptimizations }}</div>
          </v-card>

        </div>
      </div>

      <!-- Unified footer -->
      <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
        <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
        <div v-else></div>
        <div class="d-flex align-center gap-3">
          <span v-if="!stepValid && stepHint" class="text-caption text-medium-emphasis">{{ stepHint }}</span>
          <span class="text-caption text-medium-emphasis num">{{ step }} / {{ totalSteps }}</span>
          <v-btn v-if="step < totalSteps" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!stepValid" @click="nextStep">
            Continue
          </v-btn>
          <template v-else>
            <v-btn variant="outlined" class="text-none" @click="saveDraft">Save draft</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" :disabled="!step4Valid" @click="scheduleCampaign">
              {{ scheduleType === 'now' ? 'Send campaign now' : 'Schedule campaign' }}
            </v-btn>
          </template>
        </div>
      </div>

      <MpConfirmDialog
        v-model="confirmLeave"
        danger
        :title="leaveTitle"
        :message="leaveMessage"
        :confirm-label="leaveConfirmLabel"
        @confirm="discardAndLeave"
      />
    </template>
  </div>
</template>

<style scoped>
.cc-head .mp-page-header { margin-bottom: 0; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.num { font-variant-numeric: tabular-nums; }
.mp-content-preview { background: rgba(var(--v-theme-on-surface), 0.03); }
.mp-suppress-panel :deep(.v-expansion-panel) { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>
