<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { GOALS, type TrialGoal } from '@/stores/trialLabData'
import { useTrialRun } from './useTrialRun'
import { useEnterWorkspace } from './useEnterWorkspace'
import { stepIndexFor, stepLabelsFor } from './trialLabSteps'

/**
 * Choose a goal — identical in all four variants so the comparison isolates
 * the onboarding decisions. Each goal maps to one clickable sample task.
 */
const { store, variant, run, config, family, arrive, advanceFrom } = useTrialRun()
const { enterWorkspace } = useEnterWorkspace()
const realJourney = computed(() => family.value === 'signup')

const selected = ref<TrialGoal | null>(null)
const steps = computed(() => stepLabelsFor(config.value, family.value))
const current = computed(() => stepIndexFor(config.value, 'goal', family.value))

onMounted(() => {
  arrive('goal')
  selected.value = run.value?.goal ?? null
})

function savedLabel(goal: TrialGoal): string | null {
  return run.value?.drafts[goal].savedAt ? 'Draft saved' : null
}

function proceed() {
  if (!selected.value) return
  store.setGoal(variant.value, selected.value)
  // The real journey opens the workspace here; the lab runs the sample task first.
  if (realJourney.value) void enterWorkspace(variant.value)
  else void advanceFrom('goal')
}
</script>

<template>
  <div class="tl-stage tl-stage--wide">
    <MpWizardSteps :steps="steps" :current="current" class="tl-stage__steps" />

    <v-card flat border rounded="lg" class="tl-stage__card">
      <h1 class="tl-stage__title">What would you like to try first?</h1>
      <p class="tl-stage__lede">{{ realJourney ? 'We’ll shape your Get started plan around it. You can change this later.' : 'Each takes a couple of minutes with sample data. You can explore the others afterwards.' }}</p>

      <div class="tl-goal__grid" role="group" aria-label="Goals">
        <MpOptionCard
          v-for="goal in GOALS"
          :key="goal.key"
          :selected="selected === goal.key"
          :title="goal.title"
          :description="realJourney ? goal.cloud : goal.description"
          :icon="goal.icon"
          :heading-level="2"
          class="h-100"
          @click="selected = goal.key"
        >
          <template v-if="savedLabel(goal.key)" #title-append>
            <v-chip size="x-small" variant="tonal" color="success" label>{{ savedLabel(goal.key) }}</v-chip>
          </template>
          <div class="tl-goal__cloud">{{ goal.cloud }}</div>
        </MpOptionCard>
      </div>

      <div class="tl-stage__actions tl-stage__actions--end">
        <v-btn color="primary" variant="flat" class="text-none" :append-icon="realJourney ? 'arrow-up-right' : 'arrow-right'" :disabled="!selected" @click="proceed">{{ realJourney ? 'Open my workspace' : 'Continue' }}</v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped src="./trialStage.css"></style>
<style scoped>
.tl-goal__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--mp-component-card-gap);
}

.tl-goal__cloud {
  margin-top: var(--mp-space-8);
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
</style>
