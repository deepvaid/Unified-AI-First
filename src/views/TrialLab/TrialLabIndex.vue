<script setup lang="ts">
import { computed, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useTrialLabStore } from '@/stores/useTrialLab'
import { VARIANTS } from '@/stores/trialLabData'

// Comparison page for the four free-trial onboarding hypotheses. Reference
// surface for design review — never linked from product navigation.
const store = useTrialLabStore()
const confirmReset = ref(false)

const rows = computed(() => VARIANTS.map((v) => {
  const run = store.run(v.key)
  const stageLabel = !run?.account.signedUpAt
    ? 'Not started'
    : run.stage.charAt(0).toUpperCase() + run.stage.slice(1)
  return {
    ...v,
    run,
    stageLabel,
    status: run?.account.verifiedAt ? 'verified' : run?.account.signedUpAt ? 'unverified' : 'inactive',
    trial: run?.account.signedUpAt ? store.trialLabel(v.key) : '',
    inApp: run?.accountId ? `In app · account #${run.accountId}` : '',
  }
}))
</script>

<template>
  <div class="tl-index">
    <div class="tl-index__inner">
      <MpPageHeader
        title="Trial Lab"
        subtitle="Four ways into a Maropost free trial, built to compare two decisions: verify before entering, and ask for names early or later."
        eyebrow="Design research"
      >
        <template #actions>
          <v-btn variant="outlined" class="text-none" prepend-icon="rotate-ccw" @click="confirmReset = true">Reset all runs</v-btn>
        </template>
      </MpPageHeader>

      <MpAlert tone="info" title="Reference, not a product surface">
        Every flow here is simulated — no email is sent and nothing is billed. Use the Reviewer controls (flask icon)
        inside a flow to open the simulated inbox. After the first sample task, <strong>Open your workspace</strong> drops
        you into the real app as that trial user; use the profile menu → <strong>Exit trial session</strong> to come back.
      </MpAlert>

      <MpAlert tone="success" title="The actual journey lives at /signup" icon="rocket">
        <a href="/signup">/signup</a> is the classic one-page form and <a href="/signup/minimal">/signup/minimal</a> the
        email + password form — both verify, prepare the workspace, ask for a goal and open the real app. The
        one-question-at-a-time orb flow is kept at <a href="/signup-legacy">/signup-legacy</a>. The cards below are the
        lab variants, which add the sample-task step.
      </MpAlert>

      <div class="tl-index__grid">
        <MpOptionCard
          v-for="v in rows"
          :key="v.key"
          :title="`${v.key.toUpperCase()} — ${v.label}`"
          :description="v.hypothesis"
          :icon="v.signupForm === 'classic' ? 'layout-list' : v.verifyBeforeEntry ? 'shield-check' : 'eye'"
          :to="{ name: 'TrialLabEntry', params: { variant: v.key } }"
          :heading-level="2"
        >
          <div class="d-flex flex-wrap ga-1 mt-3">
            <v-chip size="x-small" variant="tonal" label>{{ v.verifyBeforeEntry ? 'Verify first' : 'Preview first' }}</v-chip>
            <v-chip size="x-small" variant="tonal" label>{{ v.signupForm === 'classic' ? 'Names at signup' : v.askNamesEarly ? 'Names early' : 'Names later' }}</v-chip>
            <v-chip v-if="v.signupForm === 'classic'" size="x-small" variant="tonal" label>Classic form</v-chip>
          </div>
          <p class="tl-index__tradeoff">Watch for: {{ v.tradeOff }}</p>
        </MpOptionCard>
      </div>

      <v-card flat border rounded="lg" class="tl-index__runs">
        <MpListRow
          v-for="v in rows"
          :key="v.key"
          variant="divided"
          :title="`Variant ${v.key.toUpperCase()}`"
          :eyebrow="v.stageLabel"
          :meta="v.trial"
        >
          <template #trailing>
            <div class="d-flex align-center ga-2">
              <span v-if="v.inApp" class="tl-index__meta">{{ v.inApp }}</span>
              <span class="tl-index__meta">{{ v.trial }}</span>
              <MpStatusChip :status="v.status" type="general" size="sm" />
            </div>
          </template>
        </MpListRow>
      </v-card>
    </div>

    <MpConfirmDialog
      v-model="confirmReset"
      title="Reset all runs?"
      message="Clears every variant's signup, verification, names and sample drafts."
      confirm-label="Reset all"
      danger
      @confirm="store.resetAll()"
    />
  </div>
</template>

<style scoped>
.tl-index {
  min-height: 100dvh;
  background: var(--surface-canvas);
  color: var(--on-surface);
  padding: var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetInline);
}

.tl-index__inner {
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-24);
}

.tl-index__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--mp-component-card-gridMin), 1fr));
  gap: var(--mp-component-card-gap);
}

.tl-index__tradeoff {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-index__runs {
  padding: 0 var(--mp-component-card-paddingCompact);
}

.tl-index__meta {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
  .tl-index {
    padding: var(--mp-layout-shellInsetCompact);
  }
}
</style>
