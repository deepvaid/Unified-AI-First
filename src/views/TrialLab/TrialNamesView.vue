<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { useTrialRun } from './useTrialRun'
import { stepIndexFor, stepLabelsFor } from './trialLabSteps'

/**
 * About you — variants A/C only. Two independently optional fields; Continue
 * saves whichever are filled, Skip keeps the neutral defaults. Nothing here
 * is required and nothing is inferred from the email address.
 */
const { store, variant, config, family, workspace, arrive, advanceFrom } = useTrialRun()

const personName = ref('')
const workspaceName = ref('')
const steps = computed(() => stepLabelsFor(config.value, family.value))
const current = computed(() => stepIndexFor(config.value, 'names', family.value))

onMounted(() => {
  arrive('names')
  store.recordEvent(variant.value, 'name_prompt_shown', { variant: variant.value })
  personName.value = store.run(variant.value)?.account.personName ?? ''
  workspaceName.value = workspace.value?.name ?? ''
})

function proceed(save: boolean) {
  if (save) {
    if (personName.value.trim()) store.setPersonName(variant.value, personName.value)
    if (workspace.value && workspaceName.value.trim()) store.renameWorkspace(variant.value, workspace.value.id, workspaceName.value)
  }
  void advanceFrom('names')
}
</script>

<template>
  <div class="tl-stage">
    <MpWizardSteps :steps="steps" :current="current" class="tl-stage__steps" />

    <v-card flat border rounded="lg" class="tl-stage__card">
      <h1 class="tl-stage__title">A little about you</h1>
      <p class="tl-stage__lede">Both are optional — fill in what helps, skip what doesn’t.</p>

      <form novalidate @submit.prevent="proceed(true)">
        <MpFormGrid :cols="1">
          <v-text-field
            v-model="personName"
            label="Your name"
            placeholder="What should we call you?"
            autocomplete="name"
            hint="Shown in your profile and greetings. One word is fine."
            autofocus
          />
          <v-text-field
            v-model="workspaceName"
            label="Workspace name"
            placeholder="e.g. Northwind Trading"
            autocomplete="organization"
            hint="A name to help you recognise this account. You can change it later."
          />
        </MpFormGrid>

        <div class="tl-stage__actions">
          <v-btn variant="text" class="text-none" @click="proceed(false)">Skip for now</v-btn>
          <v-btn type="submit" color="primary" variant="flat" class="text-none" append-icon="arrow-right">Continue</v-btn>
        </div>
      </form>
    </v-card>
  </div>
</template>

<style scoped src="./trialStage.css"></style>
