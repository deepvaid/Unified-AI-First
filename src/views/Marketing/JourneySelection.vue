<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import JourneyTemplateDialog from '@/components/marketing/JourneyTemplateDialog.vue'
import { journeyTemplates, type JourneyTemplate } from '@/stores/journeyFlowData'

/**
 * Journey Selection — `/journeys/new`. Mirrors production: one "Create from
 * scratch" card, six template cards that open a detail dialog, and "Build with
 * AI", which is the from-scratch form with an AI flag. Nothing is created here.
 */
const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

const scratch = computed(() => journeyTemplates.find(t => t.id === 'scratch')!)
const templates = computed(() => journeyTemplates.filter(t => t.id !== 'scratch'))

const dialogOpen = ref(false)
const dialogTemplate = ref<JourneyTemplate | null>(null)

function openTemplate(tpl: JourneyTemplate) {
  dialogTemplate.value = tpl
  dialogOpen.value = true
}

function createFromScratch() {
  router.push({ name: 'CreateJourneyScratch', params: { accountId: accountId.value } })
}

function buildWithAI() {
  router.push({ name: 'CreateJourneyScratch', params: { accountId: accountId.value }, query: { buildWithAI: 'true' } })
}

function createFromTemplate(templateId: string) {
  dialogOpen.value = false
  router.push({ name: 'CreateJourneyFromTemplate', params: { accountId: accountId.value }, query: { template: templateId } })
}

function cancel() {
  router.push({ name: 'Journeys', params: { accountId: accountId.value } })
}

// Da Vinci copilot deep link (`?ai=1`) lands on the Build-with-AI path.
onMounted(() => {
  if (route.query.ai) {
    router.replace({ name: 'CreateJourneyScratch', params: { accountId: accountId.value }, query: { buildWithAI: 'true' } })
  }
})
</script>

<template>
  <div class="mp-frame-fill d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface js-head">
      <MpPageHeader
        title="Journey selection"
        subtitle="Select your journey experience."
        :back-to="{ name: 'Journeys', params: { accountId } }"
      >
        <template #actions>
          <v-btn variant="text" class="text-none" @click="cancel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" prepend-icon="sparkles" @click="buildWithAI">
            Build with AI
          </v-btn>
        </template>
      </MpPageHeader>
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="js-body mx-auto">
        <v-row>
          <v-col cols="12" sm="6" md="4" lg="3">
            <MpOptionCard
              :title="scratch.name"
              :description="scratch.description"
              :icon="scratch.icon"
              :heading-level="2"
              class="h-100"
              @click="createFromScratch"
            />
          </v-col>
          <v-col v-for="tpl in templates" :key="tpl.id" cols="12" sm="6" md="4" lg="3">
            <MpOptionCard
              :title="tpl.name"
              :description="tpl.description"
              :icon="tpl.icon"
              :heading-level="2"
              class="h-100"
              aria-haspopup="dialog"
              @click="openTemplate(tpl)"
            />
          </v-col>
        </v-row>
      </div>
    </div>

    <JourneyTemplateDialog
      v-model="dialogOpen"
      :template="dialogTemplate"
      @create="createFromTemplate"
    />
  </div>
</template>

<style scoped>
.js-head { border-bottom: 1px solid rgb(var(--v-border-color), var(--v-border-opacity)); }
.js-body { max-width: var(--mp-layout-content-max-width); }
</style>
