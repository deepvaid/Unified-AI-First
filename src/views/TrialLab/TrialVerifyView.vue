<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import TrialVerifyForm from '@/components/triallab/TrialVerifyForm.vue'
import { useToast } from '@/composables/useToast'
import type { CodeResult } from '@/stores/useTrialLab'
import { useTrialRun } from './useTrialRun'
import { stepIndexFor, stepLabelsFor } from './trialLabSteps'

/**
 * Verify — A/B: verification blocks entry. C/D: the same card, plus
 * "Explore while you wait", which moves on to workspace preparation with the
 * email still unverified. Either way, verification completing in another tab
 * advances this one.
 */
const toast = useToast()
const { store, variant, run, config, isVerified, arrive, advanceFrom } = useTrialRun()

const lastResult = ref<CodeResult | null>(null)
const submitting = ref(false)
const steps = computed(() => stepLabelsFor(config.value))
const current = computed(() => stepIndexFor(config.value, config.value.verifyBeforeEntry ? 'verify' : 'signup'))

onMounted(() => arrive('verify'))

async function submit(code: string) {
  submitting.value = true
  await new Promise(r => setTimeout(r, 400))
  lastResult.value = store.submitCode(variant.value, code)
  submitting.value = false
}

watch(isVerified, (verified) => {
  if (verified) {
    toast.success('Email verified')
    void advanceFrom('verify', true)
  }
}, { immediate: true })

function explore() {
  store.enterPreview(variant.value)
  void advanceFrom('verify')
}
</script>

<template>
  <div class="tl-stage">
    <MpWizardSteps :steps="steps" :current="current" class="tl-stage__steps" />

    <v-card v-if="run" flat border rounded="lg" class="tl-stage__card">
      <h1 class="tl-stage__title">Check your email</h1>
      <p class="tl-stage__lede">
        {{ config.verifyBeforeEntry ? 'One quick step and your workspace is ready.' : 'Verify whenever it arrives — you can start exploring now.' }}
      </p>

      <TrialVerifyForm
        :email="run.account.email ?? ''"
        :challenge-state="store.challengeState(variant)"
        :last-result="lastResult"
        :sent-at="run.challenge?.sentAt ?? null"
        :now="store.tick"
        :submitting="submitting"
        @submit="submit"
        @resend="store.resend(variant)"
        @change-email="store.changeEmail(variant, $event)"
        @open-inbox="store.ui.reviewerOpen = true"
      />

      <div v-if="!config.verifyBeforeEntry" class="tl-verify-view__explore">
        <v-divider class="mb-4" />
        <div class="tl-verify-view__explore-row">
          <div>
            <div class="tl-verify-view__explore-title">Explore while you wait</div>
            <div class="tl-verify-view__explore-copy">Try a sample task now. Your 14-day trial starts once the email is verified.</div>
          </div>
          <v-btn variant="outlined" class="text-none" append-icon="arrow-right" @click="explore">Explore</v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped src="./trialStage.css"></style>
<style scoped>
.tl-verify-view__explore {
  margin-top: var(--mp-space-24);
}

.tl-verify-view__explore-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
}

.tl-verify-view__explore-title {
  font-weight: 600;
  color: var(--text-primary);
}

.tl-verify-view__explore-copy {
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}
</style>
