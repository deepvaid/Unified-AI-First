<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import {
  useCampaignsStore,
  type AbSplitGroup,
  type AbWinningCriteria,
  type Campaign,
  type CampaignDraftInput,
} from '@/stores/useCampaigns'
import { useContactsStore } from '@/stores/useContacts'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useContentStore } from '@/stores/useContent'
import { useMarketingAssetsStore } from '@/stores/useMarketingAssets'

// UAT-parity A/B Email Campaign wizard (/campaigns/new_ab_test): two steps —
// Campaign information + Contacts, then Split groups. Unlike the email wizard,
// UAT gives every split group its own subject, content, from-name, size and
// send date/time; the winner takes the unallocated percentage.
const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const contactsStore = useContactsStore()
const cdpStore = useCdpEntitiesStore()
const contentStore = useContentStore()
const assetsStore = useMarketingAssetsStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const campaignsRoute = computed(() => ({ name: 'EmailCampaigns', params: { accountId: accountId.value } }))

const stepTitles = ['Campaign information', 'Split groups']
const totalSteps = stepTitles.length
const step = ref(1)
const maxStepReached = ref(1)
const draftId = ref<number | null>(null)

// ── Step 1 — Campaign information + Contacts ─────────────────────────────────
const name = ref('')
const fromEmail = ref('hello@maropoststore.com')
const replyTo = ref('support@maropoststore.com')
const brand = ref('Maropost')
const BRAND_OPTIONS = ['Maropost', 'Storefront Co', 'Wholesale Division']

const audienceListIds = ref<number[]>([])
const audienceSegmentIds = ref<number[]>([])
const suppressListIds = ref<number[]>([])
const suppressSecureListIds = ref<number[]>([])
const suppressSegmentIds = ref<number[]>([])
const suppressJourneyIds = ref<number[]>([])
const tag = ref<string | null>(null)
const address = ref('100 King St, Sydney NSW 2000')
const language = ref('English (US)')
const showPreviewLink = ref(false)
const LANGUAGES = ['English (US)', 'English (UK)', 'French', 'German', 'Spanish', 'Italian']

const listItems = computed(() => cdpStore.lists.map(l => ({ title: `${l.name} (${l.count.toLocaleString()})`, value: l.id })))
const segmentItems = computed(() => contactsStore.segments.map(s => ({ title: `${s.name} (${s.count.toLocaleString()})`, value: s.id })))
const journeyItems = computed(() => store.journeys.map(j => ({ title: j.name, value: j.id })))
const secureListItems = computed(() => cdpStore.secureLists.map(l => ({ title: `${l.name} (${l.contacts.toLocaleString()})`, value: l.id })))
const tagOptions = computed(() => assetsStore.tags.map(t => t.name))
const contentOptions = computed(() => contentStore.items.map(i => ({ title: i.name, value: i.id })))

const audienceCount = computed(() => audienceListIds.value.length + audienceSegmentIds.value.length)
const audienceContactTotal = computed(() => {
  const listTotal = audienceListIds.value.reduce((sum, id) => sum + (cdpStore.lists.find(l => l.id === id)?.count ?? 0), 0)
  const segmentTotal = audienceSegmentIds.value.reduce((sum, id) => sum + (contactsStore.segments.find(s => s.id === id)?.count ?? 0), 0)
  return listTotal + segmentTotal
})
const zeroContactAudience = computed(() => audienceCount.value > 0 && audienceContactTotal.value === 0)

// ── Step 2 — Split groups ─────────────────────────────────────────────────────
interface CriteriaOption { title: string; value: AbWinningCriteria; description: string }
// UAT tooltip copy, lightly edited for sentence case.
const WINNING_CRITERIA: CriteriaOption[] = [
  { value: 'top_choices', title: 'Top choices', description: 'Subject line and from name are picked by highest open rate; content by highest click rate.' },
  { value: 'open_rate', title: 'Highest open rate', description: 'Everything is picked by the highest open rate.' },
  { value: 'click_rate', title: 'Highest click rate', description: 'Everything is picked by the highest click rate.' },
  { value: 'manual', title: 'Manual selection', description: 'You pick the winner later, after viewing the split-group reports.' },
  { value: 'click_to_open', title: 'Highest click-to-open rate', description: 'Everything is picked by the highest click-to-open rate.' },
  { value: 'conversion_rate', title: 'Highest conversion rate', description: 'Everything is picked by the highest conversion rate.' },
]
const winningCriteria = ref<AbWinningCriteria | null>(null)
const criteriaDescription = computed(() =>
  WINNING_CRITERIA.find(c => c.value === winningCriteria.value)?.description
  ?? 'How the winning variant is chosen once the split groups have sent.')

const GROUP_LETTERS = ['A', 'B', 'C', 'D']
const MAX_GROUPS = GROUP_LETTERS.length
let nextGroupId = 3

function blankGroup(letter: string): AbSplitGroup {
  return { id: nextGroupId++, name: `Group ${letter}`, contentId: null, subject: '', preheader: '', fromName: 'Maropost Store', sizePercent: null, date: '', time: '09:00' }
}
const groups = ref<AbSplitGroup[]>([
  { id: 1, name: 'Group A', contentId: null, subject: '', preheader: '', fromName: 'Maropost Store', sizePercent: null, date: '', time: '09:00' },
  { id: 2, name: 'Group B', contentId: null, subject: '', preheader: '', fromName: 'Maropost Store', sizePercent: null, date: '', time: '09:00' },
])

function addGroup() {
  if (groups.value.length >= MAX_GROUPS) return
  groups.value.push(blankGroup(GROUP_LETTERS[groups.value.length] ?? String(groups.value.length + 1)))
}
function duplicateGroup(index: number) {
  if (groups.value.length >= MAX_GROUPS) return
  const source = groups.value[index]
  if (!source) return
  groups.value.splice(index + 1, 0, { ...source, id: nextGroupId++, name: `${source.name} (copy)` })
}
function removeGroup(index: number) {
  if (groups.value.length <= 2) return
  groups.value.splice(index, 1)
}

const allocatedPercent = computed(() => groups.value.reduce((sum, g) => sum + (g.sizePercent ?? 0), 0))
const overAllocated = computed(() => allocatedPercent.value > 100)
const winnerPercent = computed(() => Math.max(0, 100 - allocatedPercent.value))

function groupComplete(group: AbSplitGroup): boolean {
  return group.name.trim().length > 0 && group.contentId !== null && group.subject.trim().length > 0
    && group.fromName.trim().length > 0 && (group.sizePercent ?? 0) > 0
    && group.date.length > 0 && group.time.length > 0
}

const preSendCalc = ref(false)

// Send test — mock: shows a toast instead of dispatching mail.
const testEmails = ref<string[]>([])
const testListIds = ref<number[]>([])
const canSendTest = computed(() => testEmails.value.length > 0 || testListIds.value.length > 0)
function sendTest() {
  if (!canSendTest.value) return
  toast.success('Test email sent for every split group')
}

// ── Validity ──────────────────────────────────────────────────────────────────
const step1Valid = computed(() =>
  name.value.trim().length > 0 && fromEmail.value.trim().length > 0 && replyTo.value.trim().length > 0
  && audienceCount.value > 0,
)
const step2Valid = computed(() =>
  winningCriteria.value !== null && groups.value.length >= 2 && groups.value.every(groupComplete) && !overAllocated.value,
)
const stepValid = computed(() => (step.value === 1 ? step1Valid.value : step2Valid.value))
const stepHint = computed(() => {
  if (step.value === 1) return 'Add the campaign name, sender emails, and at least one list or segment.'
  if (winningCriteria.value === null) return 'Choose a winning criteria to continue.'
  if (overAllocated.value) return 'Split group sizes cannot exceed 100%.'
  return 'Every split-group field is required, with two or more groups.'
})

// ── Persistence ───────────────────────────────────────────────────────────────
function buildInput(finalizeMethod: 'send_now' | 'scheduled' | null = null): CampaignDraftInput {
  const parts: string[] = []
  if (audienceListIds.value.length) parts.push(`${audienceListIds.value.length} list${audienceListIds.value.length > 1 ? 's' : ''}`)
  if (audienceSegmentIds.value.length) parts.push(`${audienceSegmentIds.value.length} segment${audienceSegmentIds.value.length > 1 ? 's' : ''}`)
  const first = groups.value[0]
  const earliestDate = groups.value.map(g => g.date).filter(Boolean).sort()[0] ?? null

  return {
    kind: 'ab_email',
    name: name.value,
    subject: first?.subject ?? '',
    preheader: first?.preheader ?? '',
    tag: tag.value ?? '',
    audienceSummary: parts.length ? parts.join(' · ') : '',
    audienceListIds: [...audienceListIds.value],
    audienceSegmentIds: [...audienceSegmentIds.value],
    audienceTableIds: [],
    brand: brand.value,
    senderName: first?.fromName ?? '',
    senderEmail: fromEmail.value,
    replyTo: replyTo.value,
    language: language.value,
    address: address.value,
    suppressListIds: [...suppressListIds.value],
    suppressJourneyIds: [...suppressJourneyIds.value],
    suppressSegmentIds: [...suppressSegmentIds.value],
    suppressSecureListIds: [...suppressSecureListIds.value],
    contentId: first?.contentId ?? null,
    showPreviewLink: showPreviewLink.value,
    dynamicPreview: false,
    spamCheckResult: null,
    scheduleType: finalizeMethod === 'send_now' ? 'now' : 'scheduled',
    scheduleMethod: finalizeMethod === 'send_now' ? 'send_now' : 'tzo',
    scheduleDate: earliestDate,
    scheduleTime: first?.time ?? null,
    timezone: 'America/New_York',
    optimizations: { sto: false, tzo: false, cto: false, preSend: preSendCalc.value },
    winningCriteria: winningCriteria.value ?? undefined,
    splitGroups: groups.value.map(g => ({ ...g })),
  }
}

const savedSnapshot = ref('')
const draftSavedChip = ref(false)
function captureFormSnapshot() { savedSnapshot.value = JSON.stringify(buildInput()) }
const isDirty = computed(() => savedSnapshot.value !== '' && JSON.stringify(buildInput()) !== savedSnapshot.value)
const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave A/B campaign wizard?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function saveProgress(finalize: 'send_now' | 'scheduled' | null = null) {
  if (!step1Valid.value) return
  const input = buildInput(finalize)
  if (draftId.value == null) {
    draftId.value = store.createCampaign(input, finalize !== null)
  } else {
    store.updateCampaignDraft(draftId.value, input, finalize !== null)
  }
  captureFormSnapshot()
  draftSavedChip.value = true
}

function goToStep(target: number) {
  if (target === step.value) return
  if (target > step.value && !stepValid.value) return
  saveProgress()
  step.value = target
  maxStepReached.value = Math.max(maxStepReached.value, target)
}
function prevStep() { goToStep(1) }

function saveDraft() {
  saveProgress(null)
  allowNextLeave()
  toast.success('Draft saved')
  router.push(campaignsRoute.value)
}

// ── Finalize ──────────────────────────────────────────────────────────────────
const confirmAction = ref<'send_now' | 'scheduled' | null>(null)
const confirmOpen = computed({
  get: () => confirmAction.value !== null,
  set: (open: boolean) => { if (!open) confirmAction.value = null },
})
const confirmTitle = computed(() => (confirmAction.value === 'send_now' ? 'Send A/B campaign now' : 'Schedule A/B campaign'))
const confirmMessage = computed(() => {
  const audience = audienceContactTotal.value.toLocaleString()
  return confirmAction.value === 'send_now'
    ? `"${name.value}" will start sending its ${groups.value.length} split groups to ${audience} contacts immediately.`
    : `"${name.value}" will send each split group at its selected date and time to ${audience} contacts.`
})
const confirmConsequences = computed(() => [
  `${allocatedPercent.value}% of the audience is allocated across ${groups.value.length} groups`,
  `The remaining ${winnerPercent.value}% receives the winning variant`,
])

function requestFinalize(action: 'send_now' | 'scheduled') {
  if (!step2Valid.value) return
  confirmAction.value = action
}
function finalizeCampaign() {
  const action = confirmAction.value
  if (!action) return
  saveProgress(action)
  allowNextLeave()
  toast.success(action === 'send_now' ? 'A/B campaign is sending' : 'A/B campaign scheduled')
  router.push(campaignsRoute.value)
}

// ── Edit hydration ────────────────────────────────────────────────────────────
function hydrateFrom(campaign: Campaign) {
  draftId.value = campaign.id
  const c = campaign.config
  if (!c) { name.value = campaign.name; return }
  name.value = c.name
  fromEmail.value = c.senderEmail
  replyTo.value = c.replyTo
  brand.value = c.brand
  audienceListIds.value = [...c.audienceListIds]
  audienceSegmentIds.value = [...c.audienceSegmentIds]
  suppressListIds.value = [...c.suppressListIds]
  suppressSecureListIds.value = [...c.suppressSecureListIds]
  suppressSegmentIds.value = [...c.suppressSegmentIds]
  suppressJourneyIds.value = [...c.suppressJourneyIds]
  tag.value = c.tag || null
  address.value = c.address
  language.value = c.language
  showPreviewLink.value = c.showPreviewLink
  preSendCalc.value = c.optimizations.preSend
  winningCriteria.value = c.winningCriteria ?? null
  if (c.splitGroups?.length) {
    groups.value = c.splitGroups.map(g => ({ ...g }))
    nextGroupId = Math.max(...groups.value.map(g => g.id)) + 1
  }
}

const editingExisting = ref(false)

onMounted(() => {
  const idParam = route.query.id ?? route.params.id
  const existing = idParam ? store.getCampaign(Number(idParam)) : undefined
  if (existing) {
    if (existing.config && existing.config.kind !== 'ab_email') {
      void router.replace({ name: 'CreateEmailCampaign', params: { accountId: accountId.value }, query: route.query })
      return
    }
    hydrateFrom(existing)
    editingExisting.value = true
    maxStepReached.value = totalSteps
  }
  captureFormSnapshot()
})

// "New" for the whole creation session — autosaving a draft mid-wizard must not
// flip the header to "Edit" (that only happens when re-entering from the index).
const pageTitle = computed(() => (editingExisting.value ? 'Edit A/B email campaign' : 'New A/B email campaign'))
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="cab-head px-8 pt-6 pb-4 bg-surface border-b">
      <MpPageHeader
        :title="pageTitle"
        :subtitle="`Step ${step} of ${totalSteps} — ${stepTitles[step - 1]}`"
        :back-to="campaignsRoute"
      >
        <template #actions>
          <v-chip v-if="draftSavedChip" size="small" variant="tonal" color="success" class="font-weight-medium">Draft saved</v-chip>
          <v-btn variant="text" class="text-none text-medium-emphasis" @click="saveDraft">Save &amp; exit</v-btn>
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
      <div class="cab-measure">

        <!-- Step 1: Campaign information + Contacts -->
        <v-card v-if="step === 1" variant="flat" border rounded="lg" class="pa-8">
          <h2 class="text-h6 font-weight-bold mb-1">Campaign information</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">Name the test and set the sender emails shared by every split group.</p>
          <v-divider class="mb-6" />
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="name"
              class="mp-form-grid__full"
              label="Campaign name *"
              placeholder="e.g. Subject line test — spring sale"
              hint="Internal name, not shown to recipients. Emojis are not supported."
              persistent-hint
            />
            <v-text-field v-model="fromEmail" label="From email *" type="email" />
            <v-text-field v-model="replyTo" label="Reply to *" type="email" />
          </MpFormGrid>

          <MpFormSection title="Contacts" description="Choose who receives this campaign — at least one list or segment." />
          <MpFormGrid :cols="2">
            <v-select v-model="brand" class="mp-form-grid__full" label="Brand" :items="BRAND_OPTIONS" />
            <v-select v-model="audienceListIds" :items="listItems" :label="`Select lists (${audienceListIds.length})`" multiple chips closable-chips />
            <v-select v-model="audienceSegmentIds" :items="segmentItems" :label="`Select segments (${audienceSegmentIds.length})`" multiple chips closable-chips />
            <v-alert v-if="audienceCount === 0" type="info" variant="tonal" density="compact" rounded="lg" class="mp-form-grid__full text-body-2">
              Select at least one list or segment.
            </v-alert>
            <v-alert v-else-if="zeroContactAudience" type="warning" variant="tonal" density="compact" rounded="lg" class="mp-form-grid__full text-body-2">
              The selected sources have 0 contacts. The campaign cannot send until the audience includes at least 1 contact.
            </v-alert>
            <v-alert v-else type="success" variant="tonal" density="compact" rounded="lg" class="mp-form-grid__full text-body-2" icon="user-check">
              {{ audienceContactTotal.toLocaleString() }} contacts across {{ audienceCount }} source{{ audienceCount > 1 ? 's' : '' }}.
            </v-alert>
          </MpFormGrid>

          <MpFormSection title="Suppress contacts" description="Contacts in these sources will not receive any split group." />
          <MpFormGrid :cols="2">
            <v-select v-model="suppressListIds" :items="listItems" :label="`Suppress lists (${suppressListIds.length})`" multiple chips closable-chips />
            <v-select v-model="suppressSecureListIds" :items="secureListItems" :label="`Suppress secure lists (${suppressSecureListIds.length})`" multiple chips closable-chips />
            <v-select v-model="suppressSegmentIds" :items="segmentItems" :label="`Suppress segments (${suppressSegmentIds.length})`" multiple chips closable-chips />
            <v-select v-model="suppressJourneyIds" :items="journeyItems" :label="`Suppress journeys (${suppressJourneyIds.length})`" multiple chips closable-chips />
          </MpFormGrid>

          <MpFormSection title="Delivery details" />
          <MpFormGrid :cols="2">
            <v-combobox v-model="tag" label="Campaign tags" :items="tagOptions" clearable />
            <v-select v-model="language" label="Language" :items="LANGUAGES" />
            <v-text-field v-model="address" class="mp-form-grid__full" label="Address" />
            <v-switch
              v-model="showPreviewLink"
              class="mp-form-grid__full"
              label="Show email preview link"
              hint='Adds "Having trouble viewing this email?" to the top of every variant.'
              persistent-hint
            />
          </MpFormGrid>
        </v-card>

        <!-- Step 2: Split groups -->
        <template v-if="step === 2">
          <v-card variant="flat" border rounded="lg" class="pa-8 mb-6">
            <h2 class="text-h6 font-weight-bold mb-1">Split groups</h2>
            <p class="text-body-2 text-medium-emphasis mb-6">
              Define two or more variants. The percentage you don't allocate goes to the winner group automatically.
            </p>
            <v-divider class="mb-6" />
            <MpFormGrid>
              <v-select
                v-model="winningCriteria"
                label="Winning criteria *"
                :items="WINNING_CRITERIA"
                :hint="criteriaDescription"
                persistent-hint
              />
            </MpFormGrid>

            <div class="d-flex align-center mt-6 mb-3">
              <h3 class="text-subtitle-1 font-weight-bold mb-0">Groups</h3>
              <v-spacer />
              <v-btn
                variant="text"
                class="text-none"
                prepend-icon="plus"
                :disabled="groups.length >= MAX_GROUPS"
                @click="addGroup"
              >
                Add group
              </v-btn>
            </div>

            <div class="d-flex flex-column ga-4">
              <v-card v-for="(group, index) in groups" :key="group.id" variant="outlined" rounded="lg" class="pa-5">
                <div class="d-flex align-center mb-4">
                  <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">{{ group.name }}</v-chip>
                  <v-chip v-if="groupComplete(group)" size="small" variant="tonal" color="success" prepend-icon="check" class="ml-2">Complete</v-chip>
                  <v-spacer />
                  <v-btn icon="copy" size="small" variant="text" :disabled="groups.length >= MAX_GROUPS" :aria-label="`Duplicate ${group.name}`" @click="duplicateGroup(index)" />
                  <v-btn icon="trash-2" size="small" variant="text" :disabled="groups.length <= 2" :aria-label="`Delete ${group.name}`" @click="removeGroup(index)" />
                </div>
                <MpFormGrid :cols="2">
                  <v-text-field v-model="group.name" label="Name *" />
                  <v-autocomplete v-model="group.contentId" :items="contentOptions" label="Content name *" />
                  <v-text-field v-model="group.subject" label="Subject *" />
                  <v-text-field v-model="group.preheader" label="Pre-header" />
                  <v-text-field v-model="group.fromName" label="From name *" />
                  <v-text-field
                    v-model.number="group.sizePercent"
                    label="Size (%) *"
                    type="number"
                    min="1"
                    max="100"
                    suffix="%"
                  />
                  <v-text-field v-model="group.date" label="Select date *" type="date" />
                  <v-text-field v-model="group.time" label="Select time *" type="time" />
                </MpFormGrid>
              </v-card>
            </div>

            <v-alert
              :type="overAllocated ? 'error' : 'info'"
              variant="tonal"
              density="compact"
              rounded="lg"
              class="text-body-2 mt-4"
            >
              <template v-if="overAllocated">
                Split groups total {{ allocatedPercent }}% — the sum of allocations cannot exceed 100%.
              </template>
              <template v-else>
                {{ allocatedPercent }}% allocated across {{ groups.length }} groups · the remaining {{ winnerPercent }}% receives the winning variant.
              </template>
            </v-alert>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-8">
            <MpFormSection title="Send test email" description="Send every variant to yourself or teammates first — up to 10 addresses, or lists totalling 20 contacts." class="mt-0" />
            <MpFormGrid :cols="2">
              <v-combobox v-model="testEmails" label="Enter email" multiple chips closable-chips hint="Press Enter after each address" persistent-hint />
              <v-select v-model="testListIds" :items="listItems" :label="`Select list (${testListIds.length})`" multiple chips closable-chips />
              <div class="mp-form-grid__full">
                <v-btn variant="outlined" class="text-none" prepend-icon="send" :disabled="!canSendTest" @click="sendTest">Send test</v-btn>
              </div>
            </MpFormGrid>

            <MpFormSection title="Pre-send calculation" />
            <v-switch
              v-model="preSendCalc"
              label="Pre-send calculation"
              hint="Starts calculating the audience 3 hours ahead of the send time so large campaigns are not delayed."
              persistent-hint
            />
          </v-card>
        </template>

      </div>
    </div>

    <!-- Unified footer -->
    <div class="px-8 py-4 border-t bg-surface d-flex justify-space-between align-center">
      <v-btn v-if="step > 1" variant="text" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      <div v-else></div>
      <div class="d-flex align-center ga-3">
        <span v-if="!stepValid && stepHint" class="text-caption text-medium-emphasis">{{ stepHint }}</span>
        <span class="text-caption text-medium-emphasis num">{{ step }} / {{ totalSteps }}</span>
        <v-btn v-if="step < totalSteps" color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!stepValid" @click="goToStep(2)">
          Continue
        </v-btn>
        <template v-else>
          <v-btn variant="outlined" class="text-none" @click="saveDraft">Save draft</v-btn>
          <v-btn variant="outlined" class="text-none" :disabled="!step2Valid" @click="requestFinalize('send_now')">Send now</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" prepend-icon="calendar-clock" :disabled="!step2Valid" @click="requestFinalize('scheduled')">
            Schedule campaign
          </v-btn>
        </template>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-label="confirmAction === 'send_now' ? 'Send now' : 'Schedule'"
      :consequences="confirmConsequences"
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
  </div>
</template>

<style scoped>
.cab-head .mp-page-header { margin-bottom: 0; }
.cab-measure { max-width: 920px; margin: 0 auto; }
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.num { font-variant-numeric: tabular-nums; }
</style>
