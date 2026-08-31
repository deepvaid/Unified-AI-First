<script setup lang="ts">
/**
 * Custom Report create wizard. One component drives all five report types; the
 * per-type shape (step count, date-range heading, which step-2 body renders)
 * comes from REPORT_TYPES in `customReportCatalog.ts`.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnalyticsStore, type CustomReport } from '@/stores/useAnalytics'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import ReportFieldPicker from '@/components/analytics/ReportFieldPicker.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useToast } from '@/composables/useToast'
import {
  reportTypeBySlug, FILE_FORMATS, DATE_FORMATS, RECUR_INTERVALS,
  CAMPAIGN_TYPES, CAMPAIGN_SELECTION_CAP, CAMPAIGN_MANDATORY_FIELDS, CAMPAIGN_OPTIONAL_FIELDS,
  SMS_CAMPAIGN_SOURCES, SMS_MANDATORY_METRICS, SMS_OPTIONAL_METRICS, SMS_CAMPAIGNS,
  ASSIGNED_NUMBERS, ISPS, DELIVERABILITY_METRICS, GROWTH_METRICS,
  MOCK_CAMPAIGNS, CAMPAIGN_TAGS, BRANDS,
} from './customReportCatalog'

const route = useRoute()
const router = useRouter()
const analytics = useAnalyticsStore()
const cdp = useCdpEntitiesStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'CustomReports', params: { accountId: accountId.value } }))
const chooserTo = computed(() => ({ name: 'CreateCustomReport', params: { accountId: accountId.value } }))

const reportType = computed(() => reportTypeBySlug(route.params.type as string))
const stepCount = computed(() => reportType.value?.steps.length ?? 0)

const submitted = ref(false)

// ── Step 1 · Schedule & delivery ──────────────────────────────────────────────
const reportName = ref('')
const scheduleMode = ref<'Once' | 'Recurring'>('Once')
const breakupByDays = ref(false)
const assignedNumbers = ref<string[]>([])

const today = new Date()
const yearStart = new Date(today.getFullYear(), 0, 1)
/** Local calendar date — toISOString() would shift midnight into the previous day east of UTC. */
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fromDate = ref(toIso(yearStart))
const toDate = ref(toIso(today))
const recurEvery = ref<string | null>(null)
const recurTime = ref('')
const deliveryDate = ref(toIso(today))
const recipientEmail = ref('')
const subject = ref('')
const message = ref('')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const recipientRequired = computed(() => scheduleMode.value === 'Recurring')
const recipientError = computed(() => {
  const v = recipientEmail.value.trim()
  if (!submitted.value) return ''
  if (recipientRequired.value && v === '') return 'Enter a recipient email address'
  if (v !== '' && !EMAIL_RE.test(v)) return 'Enter a valid email address'
  return ''
})
const dateRangeError = computed(() =>
  scheduleMode.value === 'Once' && fromDate.value && toDate.value && fromDate.value > toDate.value
    ? 'The start date must be on or before the end date'
    : '',
)

const step1Valid = computed(() => {
  if (reportName.value.trim() === '') return false
  if (dateRangeError.value) return false
  if (scheduleMode.value === 'Recurring') {
    if (!recurEvery.value || recurTime.value.trim() === '') return false
    if (!EMAIL_RE.test(recipientEmail.value.trim())) return false
  } else if (recipientEmail.value.trim() !== '' && !EMAIL_RE.test(recipientEmail.value.trim())) {
    return false
  }
  return true
})

// ── Step 2 · Report details ───────────────────────────────────────────────────
const fileFormat = ref(FILE_FORMATS[0])
const dateFormat = ref(DATE_FORMATS[0])

// Email campaign
const campaignTypes = ref<string[]>([])
const campaignTags = ref<string[]>([])
const tagLogic = ref<'OR' | 'AND'>('OR')
const brands = ref<string[]>([])
const campaignNames = ref<string[]>([])

const tagLogicEnabled = computed(() => campaignTags.value.length >= 2)

const matchedCampaigns = computed(() => {
  if (reportType.value?.slug !== 'campaign') return []
  if (!hasCampaignScope.value) return []
  return MOCK_CAMPAIGNS.filter(c => {
    if (campaignNames.value.length) return campaignNames.value.includes(c.name)
    if (campaignTypes.value.length && !campaignTypes.value.includes(c.type)) return false
    if (brands.value.length && !brands.value.includes(c.brand)) return false
    if (campaignTags.value.length) {
      const hits = campaignTags.value.filter(t => c.tags.includes(t))
      if (tagLogic.value === 'AND' ? hits.length !== campaignTags.value.length : hits.length === 0) return false
    }
    return true
  })
})

const campaignNameOptions = computed(() => {
  if (reportType.value?.slug !== 'campaign') return []
  return MOCK_CAMPAIGNS.filter(c => {
    if (campaignTypes.value.length && !campaignTypes.value.includes(c.type)) return false
    if (brands.value.length && !brands.value.includes(c.brand)) return false
    return true
  }).map(c => c.name)
})

const hasCampaignScope = computed(() =>
  campaignTypes.value.length > 0 || campaignTags.value.length > 0
  || brands.value.length > 0 || campaignNames.value.length > 0,
)
const overCap = computed(() => matchedCampaigns.value.length > CAMPAIGN_SELECTION_CAP)

const selectionSummary = computed(() => {
  if (!hasCampaignScope.value) return 'No campaigns selected yet — choose a campaign type, tag, brand or campaign name.'
  const parts: string[] = []
  if (campaignNames.value.length) {
    parts.push(`${campaignNames.value.length} named campaign${campaignNames.value.length === 1 ? '' : 's'}`)
  } else {
    parts.push(campaignTypes.value.length ? campaignTypes.value.join(', ') : 'All campaign types')
    if (campaignTags.value.length) {
      parts.push(`tagged ${campaignTags.value.join(tagLogic.value === 'AND' ? ' and ' : ' or ')}`)
    }
    if (brands.value.length) parts.push(`from ${brands.value.join(', ')}`)
  }
  if (scheduleMode.value === 'Once') parts.push(`sent between ${fromDate.value} and ${toDate.value}`)
  return parts.join(', ')
})

// SMS campaign + SMS message
const smsSources = ref<string[]>([])
const smsCampaignNames = ref<string[]>([])
const includeTestMessages = ref(false)
const includeAllCampaignMessages = ref(false)
const includeAllMessages = ref(false)

const smsCampaignOptions = computed(() =>
  smsSources.value.flatMap(s => SMS_CAMPAIGNS[s] ?? []),
)

// Deliverability
const isps = ref<string[]>([])
const ispPickerOpen = ref(false)
const deliverabilityMetrics = ref<string[]>([])
const deliverabilityPickerOpen = ref(false)

// Growth & attrition
const lists = ref<number[]>([])
const growthMetrics = ref<string[]>([])
const growthPickerOpen = ref(false)

const listOptions = computed(() =>
  cdp.lists.map(l => ({ title: `${l.name} (${l.count.toLocaleString()})`, value: l.id })),
)

const step2Valid = computed(() => {
  switch (reportType.value?.slug) {
    case 'campaign': return hasCampaignScope.value && !overCap.value
    case 'sms':
    case 'message': return smsSources.value.length > 0 && smsCampaignNames.value.length > 0
    case 'deliverability': return isps.value.length > 0
    case 'growth_attrition': return lists.value.length > 0
    default: return false
  }
})

// ── Step 3 · Fields / metrics ─────────────────────────────────────────────────
const optionalFields = ref<string[]>([])
const optionalPickerOpen = ref(false)

const isSms = computed(() => reportType.value?.slug === 'sms')
const mandatoryFields = computed(() => (isSms.value ? SMS_MANDATORY_METRICS : CAMPAIGN_MANDATORY_FIELDS))
const optionalCatalogue = computed(() => (isSms.value ? SMS_OPTIONAL_METRICS : CAMPAIGN_OPTIONAL_FIELDS))
const fieldNoun = computed(() => (isSms.value ? 'metrics' : 'fields'))

// ── Navigation ────────────────────────────────────────────────────────────────
const { step, maxStep, isLast: isLastStep, goTo, next: advance, prev } = useWizardSteps(() => stepCount.value)

const currentStepTitle = computed(() => reportType.value?.steps[step.value - 1] ?? '')

const currentStepValid = computed(() => {
  if (step.value === 1) return step1Valid.value
  if (step.value === 2) return step2Valid.value
  return true
})

// The submitted flag drives validate-on-click: Continue stays enabled, a failed
// click surfaces the field errors instead of a disabled button.
function next() {
  submitted.value = true
  if (!currentStepValid.value) return
  submitted.value = false
  advance()
}

function back() {
  submitted.value = false
  if (step.value === 1) router.push(chooserTo.value)
  else prev()
}

function goToStep(n: number) {
  submitted.value = false
  goTo(n)
}

// ── Unsaved-changes guard ─────────────────────────────────────────────────────
function serializeForm() {
  return JSON.stringify([
    reportName.value, scheduleMode.value, breakupByDays.value, assignedNumbers.value,
    fromDate.value, toDate.value, recurEvery.value, recurTime.value, deliveryDate.value,
    recipientEmail.value, subject.value, message.value, fileFormat.value, dateFormat.value,
    campaignTypes.value, campaignTags.value, tagLogic.value, brands.value, campaignNames.value,
    smsSources.value, smsCampaignNames.value, includeTestMessages.value,
    includeAllCampaignMessages.value, includeAllMessages.value,
    isps.value, deliverabilityMetrics.value, lists.value, growthMetrics.value, optionalFields.value,
  ])
}
const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
const {
  confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel,
} = useDirtyLeaveGuard(isDirty, {
  title: 'Leave without creating this report?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

const saving = ref(false)

function submit() {
  submitted.value = true
  if (!step2Valid.value || !step1Valid.value || saving.value) return
  saving.value = true

  const nextId = analytics.customReports.reduce((m, r) => Math.max(m, r.id), 0) + 1
  const record: CustomReport = {
    id: nextId,
    name: reportName.value.trim(),
    reportType: reportType.value!.listLabel,
    scheduleMode: scheduleMode.value,
    updatedAt: new Date().toISOString().slice(0, 19),
    recipientEmail: recipientEmail.value.trim() || undefined,
    subject: subject.value.trim() || undefined,
    message: message.value.trim() || undefined,
  }
  analytics.customReports.unshift(record)

  savedSnapshot.value = serializeForm()
  toast.success(`Report “${record.name}” created`)
  allowNextLeave()
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div v-if="!reportType" class="d-flex flex-column ga-5">
    <MpPageHeader title="New custom report" :back-to="chooserTo" />
    <MpErrorState
      title="Unknown report type"
      description="That report type does not exist. Choose one from the list to start again."
      action-label="Choose a report type"
      @action="router.push(chooserTo)"
    />
  </div>

  <MpWizardShell
    v-else
    :title="reportType.label"
    :steps="reportType.steps"
    :current="step"
    :max-step="maxStep"
    :back-to="chooserTo"
    @select="goToStep"
    @back="back"
  >
    <!-- ── Step 1 · Schedule & delivery ─────────────────────────────── -->
    <MpWizardStepCard v-if="step === 1" :title="currentStepTitle" :description="reportType.description">
        <section class="d-flex flex-column ga-2">
          <MpFormGrid :cols="2">
            <MpFormSection
              title="Report name"
              description="Used to identify this report in the reports list and in the delivery email."
              required
            />
            <v-text-field
              v-model="reportName"
              label="Report name *"
              class="mp-form-grid__full"
              :error-messages="submitted && !reportName.trim() ? ['Enter a report name'] : []"
            />

            <template v-if="reportType.hasAssignedNumbers">
              <v-select
                v-model="assignedNumbers"
                label="Assigned numbers"
                :items="ASSIGNED_NUMBERS"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
                hint="Leave empty to include messages from every number on the account."
                persistent-hint
              />
            </template>

            <MpFormSection title="Schedule" />
            <MpFormField label="How often should this report run?" class="mp-form-grid__full">
              <template #default="{ labelId }">
                <v-radio-group v-model="scheduleMode" inline :aria-labelledby="labelId" hide-details>
                  <v-radio label="Once" value="Once" />
                  <v-radio label="Recurring" value="Recurring" />
                </v-radio-group>
              </template>
            </MpFormField>

            <template v-if="reportType.hasBreakupToggle">
              <MpFormField
                label="Break the report up by day"
                hint="Adds a day-by-day breakdown of the report data instead of one total per campaign."
                class="mp-form-grid__full"
              >
                <template #default="{ labelId, descriptionId }">
                  <v-switch
                    v-model="breakupByDays"
                    :aria-labelledby="labelId"
                    :aria-describedby="descriptionId"
                    :label="breakupByDays ? 'On' : 'Off'"
                    hide-details
                  />
                </template>
              </MpFormField>
            </template>

            <template v-if="scheduleMode === 'Once'">
              <MpFormSection
                v-if="reportType.dateRangeTitle"
                :title="reportType.dateRangeTitle"
                :description="reportType.slug === 'campaign' || reportType.slug === 'sms'
                  ? 'Only campaigns sent inside this range are available to select on the next step.'
                  : 'The report covers activity inside this range.'"
              />
              <v-text-field
                v-model="fromDate"
                label="From date"
                type="date"
                :error-messages="dateRangeError ? [dateRangeError] : []"
              />
              <v-text-field v-model="toDate" label="To date" type="date" />
            </template>

            <template v-else>
              <MpFormSection title="Recurrence" required />
              <v-select
                v-model="recurEvery"
                label="Recur every *"
                :items="RECUR_INTERVALS"
                :error-messages="submitted && !recurEvery ? ['Choose how often the report repeats'] : []"
              />
              <v-text-field
                v-model="recurTime"
                label="Time *"
                type="time"
                :error-messages="submitted && !recurTime.trim() ? ['Choose a delivery time'] : []"
              />
              <v-text-field
                v-model="deliveryDate"
                label="First delivery date"
                type="date"
                class="mp-form-grid__full"
              />
            </template>

            <MpFormSection
              title="Delivery"
              :description="recipientRequired
                ? 'A recurring report has to be emailed to someone.'
                : 'Optional. Leave blank to download the report from the reports list instead.'"
              :required="recipientRequired"
            />
            <v-text-field
              v-model="recipientEmail"
              :label="recipientRequired ? 'Recipient email *' : 'Recipient email'"
              type="email"
              inputmode="email"
              placeholder="name@company.com"
              class="mp-form-grid__full"
              :error-messages="recipientError ? [recipientError] : []"
            />
            <v-text-field v-model="subject" label="Subject" class="mp-form-grid__full" />
            <v-textarea v-model="message" label="Message" rows="3" class="mp-form-grid__full" />
          </MpFormGrid>
        </section>
    </MpWizardStepCard>

    <!-- ── Step 2 · Report details ──────────────────────────────────── -->
    <MpWizardStepCard v-else-if="step === 2" :title="currentStepTitle">
        <section class="d-flex flex-column ga-2">
          <MpFormGrid :cols="2">
            <MpFormSection
              title="Output format"
              description="How the finished report is delivered."
            />
            <v-select v-model="fileFormat" label="File format" :items="FILE_FORMATS" />
            <v-select v-model="dateFormat" label="Date format" :items="DATE_FORMATS" />

            <!-- Email campaign scope -->
            <template v-if="reportType.slug === 'campaign'">
              <MpFormSection
                title="Campaigns to include"
                description="Pick at least one campaign type, tag, brand or campaign name. Changing any of these refreshes the options below it."
                required
              />
              <v-select
                v-model="campaignTypes"
                label="Campaign types"
                :items="CAMPAIGN_TYPES"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
                :error-messages="submitted && !hasCampaignScope
                  ? ['Choose at least one campaign type, tag, brand or campaign name'] : []"
              />
              <v-select
                v-model="campaignTags"
                label="Campaign tags"
                :items="CAMPAIGN_TAGS"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
              />
              <MpFormField
                v-if="tagLogicEnabled"
                label="Match campaigns that have"
                hint="“Any” includes a campaign carrying at least one selected tag. “All” requires every selected tag."
                class="mp-form-grid__full"
              >
                <template #default="{ labelId, descriptionId }">
                  <v-radio-group
                    v-model="tagLogic"
                    inline
                    :aria-labelledby="labelId"
                    :aria-describedby="descriptionId"
                    hide-details
                  >
                    <v-radio label="Any of these tags" value="OR" />
                    <v-radio label="All of these tags" value="AND" />
                  </v-radio-group>
                </template>
              </MpFormField>
              <v-select
                v-model="brands"
                label="Brands"
                :items="BRANDS"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
              />
              <v-select
                v-model="campaignNames"
                label="Specific campaigns"
                :items="campaignNameOptions"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
                hint="Optional. Choosing individual campaigns overrides the filters above."
                persistent-hint
              />
            </template>

            <!-- SMS scope -->
            <template v-else-if="reportType.slug === 'sms' || reportType.slug === 'message'">
              <MpFormSection
                title="Messages to include"
                description="Choose where the messages came from, then which campaigns to report on."
                required
              />
              <MpFormField
                label="Message source *"
                class="mp-form-grid__full"
                :error="submitted && !smsSources.length ? 'Choose at least one message source' : undefined"
              >
                <template #default="{ labelId }">
                  <div role="group" class="d-flex flex-wrap ga-6" :aria-labelledby="labelId">
                    <v-checkbox
                      v-for="s in SMS_CAMPAIGN_SOURCES"
                      :key="s"
                      v-model="smsSources"
                      :label="s"
                      :value="s"
                      hide-details
                    />
                  </div>
                </template>
              </MpFormField>
              <v-select
                v-model="smsCampaignNames"
                label="Campaigns *"
                :items="smsCampaignOptions"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
                :disabled="!smsSources.length"
                :hint="smsSources.length
                  ? undefined
                  : 'Choose a message source above to load its campaigns.'"
                :persistent-hint="!smsSources.length"
                :error-messages="submitted && smsSources.length && !smsCampaignNames.length
                  ? ['Choose at least one campaign'] : []"
              />
              <MpFormField label="Also include" class="mp-form-grid__full">
                <template #default="{ labelId }">
                  <div role="group" class="d-flex flex-wrap ga-6" :aria-labelledby="labelId">
                    <v-checkbox v-model="includeTestMessages" label="Test messages" hide-details />
                    <v-checkbox
                      v-if="reportType.slug === 'sms'"
                      v-model="includeAllCampaignMessages"
                      label="All campaign messages"
                      :disabled="!smsSources.length"
                      hide-details
                    />
                    <v-checkbox v-model="includeAllMessages" label="All messages" hide-details />
                  </div>
                </template>
              </MpFormField>
            </template>

            <!-- Deliverability scope -->
            <template v-else-if="reportType.slug === 'deliverability'">
              <MpFormSection
                title="Inbox providers"
                description="Deliverability is measured separately for each provider you choose."
                required
              />
              <MpFormField
                label="Providers *"
                class="mp-form-grid__full"
                :error="submitted && !isps.length ? 'Choose at least one inbox provider' : undefined"
              >
                <template #default="{ labelId }">
                  <div role="group" :aria-labelledby="labelId">
                    <div v-if="isps.length" class="d-flex flex-wrap ga-2 mb-3">
                      <v-chip
                        v-for="i in isps"
                        :key="i"
                        size="small"
                        closable
                        @click:close="isps = isps.filter(x => x !== i)"
                      >
                        {{ i }}
                      </v-chip>
                    </div>
                    <v-btn variant="outlined" class="text-none" prepend-icon="plus" @click="ispPickerOpen = true">
                      {{ isps.length ? 'Edit providers' : 'Choose providers' }}
                    </v-btn>
                  </div>
                </template>
              </MpFormField>

              <MpFormSection
                title="Performance metrics"
                description="Optional. Adds engagement columns alongside the deliverability figures."
              />
              <MpFormField label="Metrics" class="mp-form-grid__full">
                <template #default="{ labelId }">
                  <div role="group" :aria-labelledby="labelId">
                    <div v-if="deliverabilityMetrics.length" class="d-flex flex-wrap ga-2 mb-3">
                      <v-chip
                        v-for="m in deliverabilityMetrics"
                        :key="m"
                        size="small"
                        closable
                        @click:close="deliverabilityMetrics = deliverabilityMetrics.filter(x => x !== m)"
                      >
                        {{ m }}
                      </v-chip>
                    </div>
                    <v-btn
                      variant="outlined"
                      class="text-none"
                      prepend-icon="plus"
                      @click="deliverabilityPickerOpen = true"
                    >
                      {{ deliverabilityMetrics.length ? 'Edit metrics' : 'Add metrics' }}
                    </v-btn>
                  </div>
                </template>
              </MpFormField>
            </template>

            <!-- Growth & attrition scope -->
            <template v-else-if="reportType.slug === 'growth_attrition'">
              <MpFormSection
                title="Lists to measure"
                description="Growth and attrition are reported per list."
                required
              />
              <v-select
                v-model="lists"
                label="Lists *"
                :items="listOptions"
                multiple
                chips
                closable-chips
                class="mp-form-grid__full"
                :error-messages="submitted && !lists.length ? ['Choose at least one list'] : []"
              />

              <MpFormSection
                title="Performance metrics"
                description="Optional. Choose which growth and attrition figures to include."
              />
              <MpFormField label="Metrics" class="mp-form-grid__full">
                <template #default="{ labelId }">
                  <div role="group" :aria-labelledby="labelId">
                    <div v-if="growthMetrics.length" class="d-flex flex-wrap ga-2 mb-3">
                      <v-chip
                        v-for="m in growthMetrics"
                        :key="m"
                        size="small"
                        closable
                        @click:close="growthMetrics = growthMetrics.filter(x => x !== m)"
                      >
                        {{ m }}
                      </v-chip>
                    </div>
                    <v-btn
                      variant="outlined"
                      class="text-none"
                      prepend-icon="plus"
                      @click="growthPickerOpen = true"
                    >
                      {{ growthMetrics.length ? 'Edit metrics' : 'Add metrics' }}
                    </v-btn>
                  </div>
                </template>
              </MpFormField>
            </template>
          </MpFormGrid>

          <!--
            Live selection summary (email campaign only).
            GAP: no MpInlineAlert exists, so these use raw v-alert and wire role/aria-live
            by hand — see docs/rebuild/GAPS.md §2.
          -->
          <template v-if="reportType.slug === 'campaign'">
            <v-alert
              v-if="overCap"
              type="error"
              variant="tonal"
              density="comfortable"
              class="mt-4"
              :text="`${matchedCampaigns.length} campaigns match — a report can cover at most ${CAMPAIGN_SELECTION_CAP}. Narrow the date range or the filters above.`"
            />
            <v-alert
              v-else
              :type="hasCampaignScope && !matchedCampaigns.length ? 'warning' : 'info'"
              variant="tonal"
              density="comfortable"
              class="mt-4"
              role="status"
              aria-live="polite"
            >
              <template v-if="!hasCampaignScope">{{ selectionSummary }}</template>
              <template v-else-if="!matchedCampaigns.length">
                No campaigns match {{ selectionSummary }}. This report would come back empty —
                widen the date range or the filters above.
              </template>
              <template v-else>
                <strong>{{ matchedCampaigns.length }}</strong>
                campaign{{ matchedCampaigns.length === 1 ? '' : 's' }} match:
                {{ selectionSummary }}
              </template>
            </v-alert>
          </template>
        </section>
    </MpWizardStepCard>

    <!-- ── Step 3 · Fields / metrics ────────────────────────────────── -->
    <MpWizardStepCard v-else :title="currentStepTitle">
        <section class="d-flex flex-column ga-2">
          <MpFormSection
            :title="isSms ? 'Always included' : 'Always included'"
            :description="`These ${fieldNoun} are always in the report and cannot be removed.`"
          />
          <div class="d-flex flex-wrap ga-2 mb-2">
            <v-chip v-for="f in mandatoryFields" :key="f" size="small" variant="tonal">{{ f }}</v-chip>
          </div>

          <v-divider class="my-4" />

          <MpFormSection
            title="Optional"
            :description="`Add extra ${fieldNoun} for more detail. Everything here is optional.`"
          />
          <div v-if="optionalFields.length" class="d-flex flex-wrap ga-2 mb-3">
            <v-chip
              v-for="f in optionalFields"
              :key="f"
              size="small"
              closable
              @click:close="optionalFields = optionalFields.filter(x => x !== f)"
            >
              {{ f }}
            </v-chip>
          </div>
          <div>
            <v-btn
              variant="outlined"
              class="text-none"
              prepend-icon="plus"
              @click="optionalPickerOpen = true"
            >
              {{ optionalFields.length ? `Edit optional ${fieldNoun}` : `Add optional ${fieldNoun}` }}
            </v-btn>
          </div>
        </section>
    </MpWizardStepCard>

    <template #footerStart>
      <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="back">
        {{ step === 1 ? 'Change report type' : 'Back' }}
      </v-btn>
    </template>
    <template #footer>
      <v-btn
        v-if="!isLastStep"
        color="primary"
        variant="flat"
        class="text-none"
        append-icon="arrow-right"
        @click="next"
      >
        Continue
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="flat"
        class="text-none"
        prepend-icon="check"
        :loading="saving"
        @click="submit"
      >
        Create report
      </v-btn>
    </template>
  </MpWizardShell>

  <template v-if="reportType">
    <!-- Pickers -->
    <ReportFieldPicker
      v-model="optionalPickerOpen"
      v-model:selected="optionalFields"
      :title="`Optional ${fieldNoun}`"
      :subtitle="`Choose the ${fieldNoun} you would like to include in your report.`"
      :items="optionalCatalogue"
      :noun="fieldNoun"
    />
    <ReportFieldPicker
      v-model="ispPickerOpen"
      v-model:selected="isps"
      title="Inbox providers"
      subtitle="Choose the providers you want to measure deliverability for."
      :items="ISPS"
      noun="providers"
    />
    <ReportFieldPicker
      v-model="deliverabilityPickerOpen"
      v-model:selected="deliverabilityMetrics"
      title="Performance metrics"
      subtitle="Choose the engagement metrics to report alongside deliverability."
      :items="DELIVERABILITY_METRICS"
      noun="metrics"
    />
    <ReportFieldPicker
      v-model="growthPickerOpen"
      v-model:selected="growthMetrics"
      title="Performance metrics"
      subtitle="Choose the growth and attrition figures to include."
      :items="GROWTH_METRICS"
      noun="metrics"
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
</template>
