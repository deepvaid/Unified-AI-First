<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { BUSINESS_CHANGE_LABELS, BUSINESS_TYPE_LABELS } from '@/maropay/model'
import type { BusinessChangeField, MaropayError } from '@/maropay/model'
import { countryLabel, descriptorIssue, isEmail } from '@/maropay/onboarding'

// Settings → Business. Legal details were verified, so a change goes back to
// our payments partner and applies only once approved. What shoppers see on
// statements isn't verified, so it changes straight away.

const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()

const business = computed(() => maropay.business)
const closed = computed(() => Boolean(maropay.account?.closedAt))
const editBlocker = computed(() => {
  if (closed.value) return 'This Maropay account is closed.'
  return maropay.can('change_business') ? null : 'Only the business owner can change business details.'
})

function orDash(value: string): string {
  return value.trim() || '—'
}

const address = computed(() => {
  const a = business.value?.address
  if (!a) return '—'
  return [a.line1, a.city, [a.region, a.postalCode].filter(Boolean).join(' '), countryLabel(a.country)].filter(Boolean).join(', ')
})

const pendingChanges = computed(() => maropay.openTasks.filter((t) => t.kind === 'business_change'))

// ── Request a change ───────────────────────────────────────────────

const FIELDS = Object.entries(BUSINESS_CHANGE_LABELS) as [BusinessChangeField, string][]

const changeOpen = ref(false)
const change = reactive<{ field: BusinessChangeField | null; value: string }>({ field: null, value: '' })
const changeAttempted = ref(false)
const changeProblem = ref<MaropayError | null>(null)

const fieldOptions = computed(() => FIELDS
  .filter(([field]) => !pendingChanges.value.some((t) => t.change?.field === field))
  .map(([value, title]) => ({ value, title })))

const changeLabel = computed(() => (change.field ? BUSINESS_CHANGE_LABELS[change.field] : 'value'))
const changeCurrent = computed(() => (change.field && business.value ? business.value[change.field] : ''))
const changeErrors = computed(() => ({
  field: change.field ? undefined : 'Choose what needs to change.',
  value: change.value.trim() ? undefined : `Enter the new ${changeLabel.value.toLowerCase()}.`,
}))

function openChange(): void {
  Object.assign(change, { field: fieldOptions.value[0]?.value ?? null, value: '' })
  changeAttempted.value = false
  changeProblem.value = null
  changeOpen.value = true
}

function sendChange(): void {
  changeAttempted.value = true
  changeProblem.value = null
  if (!change.field || changeErrors.value.value) return
  const result = maropay.requestBusinessChange(change.field, change.value)
  if (!result.ok) {
    changeProblem.value = result.error
    return
  }
  changeOpen.value = false
  toast.success(`Change sent for review. Your current ${changeLabel.value.toLowerCase()} stays in use until it’s approved.`)
}

function simulate(taskId: string, approved: boolean): void {
  const result = maropay.simulateBusinessChangeOutcome(taskId, approved)
  if (result.ok) toast.info(approved ? 'Simulated: the change was approved.' : 'Simulated: the change was declined.')
  else toast.error(result.error.message)
}

// ── What shoppers see ──────────────────────────────────────────────

const publicOpen = ref(false)
const publicForm = reactive({ statementDescriptor: '', supportEmail: '', supportPhone: '' })
const publicAttempted = ref(false)
const publicProblem = ref<MaropayError | null>(null)

const descriptorMax = (value: string) => value.length <= 22 || 'Use 22 characters or fewer.'
/** The counter rule reports length as the merchant types; the full check waits for Save. */
const descriptorError = computed(() => {
  if (!publicAttempted.value || descriptorMax(publicForm.statementDescriptor) !== true) return undefined
  return descriptorIssue(publicForm.statementDescriptor) ?? undefined
})
const emailError = computed(() => (publicAttempted.value && !isEmail(publicForm.supportEmail) ? 'Enter a support email like help@example.com.' : undefined))

function openPublic(): void {
  if (!business.value) return
  Object.assign(publicForm, business.value.publicDetails)
  publicAttempted.value = false
  publicProblem.value = null
  publicOpen.value = true
}

function savePublic(): void {
  publicAttempted.value = true
  publicProblem.value = null
  if (descriptorIssue(publicForm.statementDescriptor) || !isEmail(publicForm.supportEmail)) return
  const result = maropay.updatePublicDetails({ ...publicForm })
  if (!result.ok) {
    publicProblem.value = result.error
    return
  }
  publicOpen.value = false
  toast.success('Saved. New payments show the updated details.')
}
</script>

<template>
  <v-card v-if="!business" flat border rounded="lg">
    <MpEmptyState
      icon="building-2"
      title="Your business details appear once setup is submitted"
      description="They come from what you enter in setup, checked by our payments partner."
      :action-label="maropay.can('edit_onboarding') ? 'Continue setup' : undefined"
      action-icon="arrow-right"
      :heading-level="2"
      @action="router.push(maropay.routeFor({ name: 'MaropaySetup' }))"
    />
  </v-card>

  <div v-else class="d-flex flex-column gap-5">
    <v-card flat border rounded="lg" class="maropay-business__card">
      <MpSectionHeader title="Legal details" description="Checked by our payments partner. A change is checked again before it applies." :heading-level="2">
        <template #actions>
          <v-tooltip :disabled="!editBlocker && fieldOptions.length > 0" :text="editBlocker ?? 'Every detail already has a change under review.'" location="top">
            <template #activator="{ props: tip }">
              <span v-bind="tip">
                <v-btn variant="outlined" size="small" class="text-none" prepend-icon="pencil" :disabled="!!editBlocker || !fieldOptions.length" @click="openChange">Request a change</v-btn>
              </span>
            </template>
          </v-tooltip>
        </template>
      </MpSectionHeader>

      <div v-if="pendingChanges.length" class="d-flex flex-column gap-3 mb-5">
        <MpAlert v-for="task in pendingChanges" :key="task.id" tone="info" live="off" icon="clock" :title="task.title">
          {{ task.description }}
        </MpAlert>
      </div>

      <dl class="mp-label-value">
        <dt>Legal business name</dt><dd>{{ business.legalName }}</dd>
        <dt>Trading name</dt><dd>{{ orDash(business.tradingName) }}</dd>
        <dt>Business type</dt><dd>{{ BUSINESS_TYPE_LABELS[business.type] }}</dd>
        <dt>Registration number</dt><dd>{{ orDash(business.registrationNumber) }}</dd>
        <dt>Website</dt><dd class="maropay-business__wrap">{{ orDash(business.website) }}</dd>
        <dt>Registered address</dt><dd>{{ address }}</dd>
        <dt>Representative</dt>
        <dd>
          {{ business.representative.name }}{{ business.representative.title ? ` · ${business.representative.title}` : '' }}
          <span class="maropay-business__sub">{{ business.representative.email }}</span>
        </dd>
      </dl>

      <p class="maropay-business__note">
        The registration country, registered address and representative change through Maropost support, because each needs new documents.
      </p>
    </v-card>

    <v-card flat border rounded="lg" class="maropay-business__card">
      <MpSectionHeader title="Shown to shoppers" description="On card statements and receipts. Changes apply to new payments straight away." :heading-level="2">
        <template #actions>
          <v-tooltip :disabled="!editBlocker" :text="editBlocker ?? ''" location="top">
            <template #activator="{ props: tip }">
              <span v-bind="tip">
                <v-btn variant="outlined" size="small" class="text-none" prepend-icon="pencil" :disabled="!!editBlocker" @click="openPublic">Edit</v-btn>
              </span>
            </template>
          </v-tooltip>
        </template>
      </MpSectionHeader>
      <dl class="mp-label-value">
        <dt>Statement descriptor</dt><dd class="maropay-business__statement">{{ business.publicDetails.statementDescriptor.toUpperCase() }}</dd>
        <dt>Support email</dt><dd class="maropay-business__wrap">{{ orDash(business.publicDetails.supportEmail) }}</dd>
        <dt>Support phone</dt><dd>{{ orDash(business.publicDetails.supportPhone) }}</dd>
      </dl>
    </v-card>

    <v-card v-if="pendingChanges.length" flat border rounded="lg" class="maropay-business__card">
      <MpSectionHeader icon="flask-conical" title="Simulate our payments partner" description="Demo controls — not part of the product." :heading-level="2" />
      <div class="d-flex flex-column gap-3">
        <div v-for="task in pendingChanges" :key="task.id" class="d-flex flex-wrap align-center ga-2">
          <span class="maropay-business__demo-label">{{ task.title }}</span>
          <v-btn size="small" variant="outlined" class="text-none" @click="simulate(task.id, true)">Approve</v-btn>
          <v-btn size="small" variant="text" class="text-none" @click="simulate(task.id, false)">Decline</v-btn>
        </div>
      </div>
    </v-card>
  </div>

  <MpFormDrawer v-model="changeOpen" title="Request a change" subtitle="Our payments partner checks it before it applies" size="sm">
    <MpFormGrid>
      <v-select
        v-model="change.field"
        :items="fieldOptions"
        label="What needs to change *"
        :error-messages="changeAttempted ? changeErrors.field : undefined"
      />
      <v-text-field
        v-model="change.value"
        :label="`New ${changeLabel.toLowerCase()} *`"
        :hint="changeCurrent ? `Now: ${changeCurrent}` : undefined"
        persistent-hint
        :error-messages="changeAttempted ? changeErrors.value : undefined"
      />
    </MpFormGrid>
    <MpAlert tone="info" live="off">
      Your current details stay in use until the change is approved, and we’ll let you know the outcome. Payments keep working meanwhile.
    </MpAlert>
    <MpAlert v-if="changeProblem" tone="error" title="The request wasn’t sent">{{ changeProblem.message }}</MpAlert>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="changeOpen = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="sendChange">Send for review</v-btn>
    </template>
  </MpFormDrawer>

  <MpFormDrawer v-model="publicOpen" title="Edit what shoppers see" subtitle="Applies to new payments straight away" size="sm">
    <MpFormGrid>
      <v-text-field
        v-model="publicForm.statementDescriptor"
        label="Statement descriptor *"
        counter="22"
        :rules="[descriptorMax]"
        hint="Use a name shoppers will recognise, usually your store name."
        :error-messages="descriptorError"
      />
      <v-text-field v-model="publicForm.supportEmail" label="Support email *" type="email" autocomplete="email" :error-messages="emailError" />
      <v-text-field v-model="publicForm.supportPhone" label="Support phone" type="tel" autocomplete="tel" />
    </MpFormGrid>
    <MpAlert v-if="publicProblem" tone="error" title="Nothing was changed">{{ publicProblem.message }}</MpAlert>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="publicOpen = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="savePublic">Save</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.maropay-business__card {
  padding: var(--mp-component-card-padding);
}

.maropay-business__sub {
  display: block;
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.maropay-business__wrap {
  overflow-wrap: anywhere;
}

.maropay-business__statement {
  font-family: var(--mp-fontFamily-mono);
  letter-spacing: var(--mp-letterSpacing-eyebrow);
}

.maropay-business__note {
  margin: var(--mp-space-20) 0 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}

.maropay-business__demo-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
}
</style>
