<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useWizardSteps } from '@/composables/useWizardSteps'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import { CATEGORY_OPTIONS, OWNER_OPTIONS } from './placeholder'

// WIZARD TEMPLATE — a multi-step create flow.
// MpWizardShell owns the head band, the step indicator, the reading measure and
// the footer; the page owns validation and the leave guard.
// Copied from src/views/Marketing/CreateCampaign.vue.

const router = useRouter()
const toast = useToast()

const stepTitles = ['Step one', 'Step two', 'Step three', 'Review']
const totalSteps = stepTitles.length

const form = ref({
  name: '',
  category: null as string | null,
  option: '' as '' | 'Option A' | 'Option B' | 'Option C',
  owner: null as string | null,
  notes: '',
})

const stepValid = computed(() => {
  switch (step.value) {
    case 1:
      return form.value.name.trim().length > 0
    case 2:
      return form.value.option !== ''
    default:
      return true
  }
})

/** Why Continue is disabled — a dead button with no explanation is a defect. */
const stepHint = computed(() => {
  switch (step.value) {
    case 1:
      return 'Give the record a name to continue.'
    case 2:
      return 'Choose one option to continue.'
    default:
      return undefined
  }
})

const { step, maxStep, goTo, next, prev } = useWizardSteps(totalSteps, {
  canAdvance: () => stepValid.value,
})

const isDirty = computed(
  () =>
    form.value.name.trim().length > 0 ||
    form.value.category !== null ||
    form.value.option !== '' ||
    form.value.owner !== null ||
    form.value.notes.trim().length > 0,
)

// The shell deliberately does not own this — a wizard decides for itself what
// counts as unsaved work.
const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } =
  useDirtyLeaveGuard(isDirty, {
    title: 'Leave the wizard?',
    message: 'This flow has unsaved input. Leaving now will discard it.',
  })

function saveDraft() {
  toast.info('Draft saved')
}

function finish() {
  toast.success('Record created')
  allowNextLeave()
  router.push({ name: 'TemplateList' })
}

const reviewFields = computed(() => [
  { label: 'Name', value: form.value.name || '—' },
  { label: 'Category', value: form.value.category ?? '—' },
  { label: 'Option', value: form.value.option || '—' },
  { label: 'Owner', value: form.value.owner ?? '—' },
])
</script>

<template>
  <!-- standalone: this wizard is hosted inside the templates layout. A product
       route drops it and sets meta.builderShell, so the shell fills the frame. -->
  <MpWizardShell
    standalone
    eyebrow="Section · Records"
    title="Create record"
    :steps="stepTitles"
    :current="step"
    :max-step="maxStep"
    :clickable="maxStep > 1"
    measure="md"
    :hint="stepValid ? undefined : stepHint"
    :back-to="{ name: 'TemplatesIndex' }"
    @select="goTo"
    @back="prev"
  >
    <template #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" @click="saveDraft">Save &amp; exit</v-btn>
    </template>

    <MpWizardStepCard
      v-if="step === 1"
      title="Step one"
      description="The fields a record cannot exist without."
    >
      <MpFormGrid :cols="2">
        <v-text-field v-model="form.name" label="Name *" placeholder="Record name" class="mp-form-grid__full" />
        <v-select v-model="form.category" label="Category" :items="CATEGORY_OPTIONS" />
        <v-select v-model="form.owner" label="Owner" :items="OWNER_OPTIONS" />
      </MpFormGrid>
    </MpWizardStepCard>

    <MpWizardStepCard
      v-else-if="step === 2"
      title="Step two"
      description="A chooser gallery — select, then commit."
    >
      <MpFormField label="Choose an option" hint="One of these decides how the record behaves.">
        <div class="tpl-options">
          <!-- Toggle mode: `selected` makes each card a keyboard-operable button.
               A card with `to` would be a link instead. -->
          <MpOptionCard
            v-for="option in ['Option A', 'Option B', 'Option C']"
            :key="option"
            :title="option"
            description="What picking this one means."
            icon="square-check"
            :selected="form.option === option"
            @click="form.option = option as typeof form.option"
          />
        </div>
      </MpFormField>
    </MpWizardStepCard>

    <MpWizardStepCard
      v-else-if="step === 3"
      title="Step three"
      description="Everything optional lives on the last step before review."
    >
      <MpFormGrid>
        <v-textarea v-model="form.notes" label="Notes" placeholder="Supporting description text" rows="3" />
      </MpFormGrid>
    </MpWizardStepCard>

    <MpWizardStepCard v-else title="Review" description="Confirm before anything is created.">
      <dl class="mp-label-value">
        <template v-for="field in reviewFields" :key="field.label">
          <dt class="mp-meta-label">{{ field.label }}</dt>
          <dd class="mp-meta-value">{{ field.value }}</dd>
        </template>
      </dl>
      <MpAlert tone="info" class="mt-6">
        Nothing is created until Finish is pressed.
      </MpAlert>
    </MpWizardStepCard>

    <template #footer>
      <v-btn
        v-if="step < totalSteps"
        color="primary"
        variant="flat"
        append-icon="arrow-right"
        class="text-none"
        :disabled="!stepValid"
        @click="next"
      >
        Continue
      </v-btn>
      <template v-else>
        <v-btn variant="outlined" class="text-none" @click="saveDraft">Save draft</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="check" class="text-none" @click="finish">Finish</v-btn>
      </template>
    </template>
  </MpWizardShell>

  <MpConfirmDialog
    v-model="confirmLeave"
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    danger
    @confirm="discardAndLeave"
  />
</template>

<style scoped lang="scss">
.tpl-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--mp-space-12);
}

@media (max-width: $mp-layout-breakpointCompact) {
  .tpl-options {
    grid-template-columns: 1fr;
  }
}
</style>
