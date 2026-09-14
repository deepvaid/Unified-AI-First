<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpEmptyState from '@/components/MpEmptyState.vue'
import type { LinkResult } from '@/stores/useTrialLab'
import { useTrialRun } from './useTrialRun'

/**
 * Verify link — the landing for the "Verify email" link in the simulated
 * inbox, typically opened in a second tab. Consumes the token once and tells
 * the user what happened; the original tab advances on its own.
 */
const route = useRoute()
const { store, variant, base, run } = useTrialRun()

const result = ref<LinkResult | null>(null)

onMounted(() => {
  const raw = Array.isArray(route.params.token) ? route.params.token[0] : route.params.token
  result.value = store.consumeLink(variant.value, String(raw ?? ''))
})

const continueTo = computed(() => store.entryRouteFor(variant.value, base.value))

const state = computed(() => {
  switch (result.value) {
    case 'ok':
      return { icon: 'circle-check', title: 'Email verified', description: 'You can close this tab — the one you signed up in has moved on. Or continue here.', action: 'Continue here', tone: 'neutral' as const }
    case 'used':
      return { icon: 'badge-check', title: 'Already verified', description: 'This email address was confirmed earlier. Nothing else to do.', action: 'Continue', tone: 'neutral' as const }
    case 'expired':
      return { icon: 'clock', title: 'This link has expired', description: 'Verification links stay valid for a short while. Send a new email and use the fresh link or code.', action: 'Send a new email', tone: 'error' as const }
    case 'superseded':
      return { icon: 'mail-x', title: 'A newer email was sent', description: 'This link belongs to an earlier email. Open the most recent one, or continue and enter its code.', action: 'Continue', tone: 'error' as const }
    default:
      return null
  }
})

function act() {
  if (result.value === 'expired') {
    store.resend(variant.value)
    result.value = null
    // Show the fresh-email state rather than bouncing straight to the verify screen.
    result.value = 'superseded'
  }
}
</script>

<template>
  <div class="tl-stage">
    <v-card v-if="state && run" flat border rounded="lg" class="tl-stage__card tl-link">
      <MpEmptyState
        :icon="state.icon"
        :title="state.title"
        :description="state.description"
        :tone="state.tone"
        emphasis="prominent"
        :heading-level="1"
      />
      <div class="tl-link__actions">
        <v-btn v-if="result === 'expired'" color="primary" variant="flat" class="text-none" @click="act">Send a new email</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" :to="continueTo">{{ state.action }}</v-btn>
      </div>
    </v-card>
    <v-card v-else flat border rounded="lg" class="tl-stage__card">
      <MpEmptyState icon="mail-question" title="Nothing to verify here" description="Start a trial first, then use the link from the verification email." />
      <div class="tl-link__actions">
        <v-btn color="primary" variant="flat" class="text-none" :to="base">Go to the trial</v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped src="./trialStage.css"></style>
<style scoped>
.tl-link__actions {
  display: flex;
  justify-content: center;
  margin-top: var(--mp-space-8);
}
</style>
