<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import JourneyMiniPreview from '@/components/marketing/JourneyMiniPreview.vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import type { JourneyTemplate } from '@/stores/journeyFlowData'
import { journeyTemplates } from '@/stores/journeyFlowData'

const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const accountId = computed(() => route.params.accountId as string)

const step = ref(1)
const selectedTemplateId = ref<string | null>(null)
const selectedTemplate = computed(() => journeyTemplates.find(t => t.id === selectedTemplateId.value) ?? null)

const name = ref('')
const endDate = ref('')
const endTime = ref('')
const enableOnSave = ref(false)
const retrigger = ref(false)

const stepCount = (t: JourneyTemplate) => t.nodes.length
const branchCount = (t: JourneyTemplate) => t.nodes.filter(n => n.category === 'filter').length

function chooseTemplate(id: string) {
  selectedTemplateId.value = id
  const tpl = journeyTemplates.find(t => t.id === id)
  // Prefill a sensible name from the template (user can overwrite in step 2).
  if (tpl && tpl.id !== 'scratch' && !name.value.trim()) name.value = tpl.name
}

function continueToSettings() {
  if (selectedTemplateId.value) step.value = 2
}

const canCreate = computed(() => !!selectedTemplateId.value && name.value.trim().length > 0)

function createJourney() {
  if (!canCreate.value || !selectedTemplateId.value) return
  const id = store.createJourney({
    name: name.value.trim(),
    templateId: selectedTemplateId.value,
    settings: {
      endDate: endDate.value || undefined,
      endTime: endTime.value || undefined,
      enabled: enableOnSave.value,
      retrigger: retrigger.value,
    },
  })
  router.replace({ name: 'JourneyBuilder', params: { accountId: accountId.value, id } })
}

function cancel() {
  router.push({ name: 'Journeys', params: { accountId: accountId.value } })
}
</script>

<template>
  <div class="cj-root d-flex flex-column">
    <!-- Toolbar -->
    <div class="cj-toolbar d-flex align-center justify-space-between px-5 border-b bg-surface">
      <div class="d-flex align-center gap-3">
        <v-tooltip text="Back to Journeys" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Journeys" @click="cancel"></v-btn>
          </template>
        </v-tooltip>
        <div class="font-weight-bold text-body-1">New Journey</div>
      </div>

      <div class="d-flex align-center gap-2" role="list" aria-label="Wizard steps">
        <div class="cj-step" :class="{ 'cj-step--active': step === 1, 'cj-step--done': step > 1 }" role="listitem">
          <span class="cj-step__num"><v-icon v-if="step > 1" size="12">check</v-icon><template v-else>1</template></span>
          Choose template
        </div>
        <div class="cj-step__rail"></div>
        <div class="cj-step" :class="{ 'cj-step--active': step === 2 }" role="listitem">
          <span class="cj-step__num">2</span>
          Settings
        </div>
      </div>

      <v-btn variant="text" size="small" class="text-none" @click="cancel">Cancel</v-btn>
    </div>

    <!-- Step 1 — template gallery -->
    <div v-if="step === 1" class="flex-grow-1 overflow-y-auto bg-background">
      <div class="cj-content mx-auto px-6 py-8">
        <h2 class="text-h6 font-weight-bold mb-1">Start with a template</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Every template is a working flow you can preview before committing — pick one and make it yours, or start from scratch.
        </p>

        <v-row>
          <v-col v-for="tpl in journeyTemplates" :key="tpl.id" cols="12" sm="6" md="4">
            <v-card flat border rounded="lg" class="cj-card h-100 d-flex flex-column"
              :class="{ 'cj-card--selected': selectedTemplateId === tpl.id }"
              :aria-pressed="selectedTemplateId === tpl.id"
              @click="chooseTemplate(tpl.id)" @dblclick="chooseTemplate(tpl.id); continueToSettings()">
              <div class="pa-4 pb-3">
                <div class="d-flex align-center gap-3 mb-2">
                  <v-avatar color="primary" size="34" rounded="lg" variant="tonal">
                    <v-icon size="18">{{ tpl.icon }}</v-icon>
                  </v-avatar>
                  <div class="font-weight-bold text-body-2">{{ tpl.name }}</div>
                  <v-icon v-if="selectedTemplateId === tpl.id" color="primary" size="20" class="ml-auto">circle-check</v-icon>
                </div>
                <div class="text-caption text-medium-emphasis cj-card__desc">{{ tpl.description }}</div>
                <div class="d-flex gap-2 mt-3">
                  <v-chip size="x-small" variant="tonal" color="primary">{{ stepCount(tpl) }} {{ stepCount(tpl) === 1 ? 'step' : 'steps' }}</v-chip>
                  <v-chip v-if="branchCount(tpl)" size="x-small" variant="tonal" color="secondary">
                    {{ branchCount(tpl) }} {{ branchCount(tpl) === 1 ? 'branch' : 'branches' }}
                  </v-chip>
                </div>
              </div>
              <div class="cj-card__preview border-t bg-background mt-auto">
                <JourneyMiniPreview :nodes="tpl.nodes" />
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Step 2 — settings + persistent preview -->
    <div v-else class="flex-grow-1 overflow-y-auto bg-background">
      <div class="cj-content mx-auto px-6 py-8">
        <v-row>
          <v-col cols="12" md="6">
            <v-card flat border rounded="lg" class="pa-5">
              <h2 class="text-h6 font-weight-bold mb-1">Journey settings</h2>
              <p class="text-body-2 text-medium-emphasis mb-5">Name it now — everything else can change later.</p>

              <v-text-field v-model="name" label="Journey name" variant="outlined" density="comfortable"
                autofocus :rules="[(v: string) => !!v.trim() || 'Journey name is required']" class="mb-2" />

              <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">Schedule (optional)</div>
              <div class="d-flex gap-3 mb-4">
                <v-text-field v-model="endDate" label="End date" type="date" variant="outlined" density="comfortable" hide-details />
                <v-text-field v-model="endTime" label="End time" type="time" variant="outlined" density="comfortable" hide-details />
              </div>

              <v-divider class="mb-4" />

              <v-switch v-model="enableOnSave" color="primary" density="compact" hide-details class="mb-2"
                label="Enable journey on save" />
              <div class="text-caption text-medium-emphasis mb-4 ml-12">Off = journey is created as a draft you can activate later.</div>

              <v-switch v-model="retrigger" color="primary" density="compact" hide-details class="mb-2"
                label="Allow contacts to re-enter (retrigger)" />
              <div class="text-caption text-medium-emphasis ml-12">Contacts who finish the journey can enter it again.</div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card flat border rounded="lg" class="pa-5 h-100 d-flex flex-column">
              <div class="d-flex align-center gap-2 mb-1">
                <v-icon size="16" class="text-medium-emphasis">eye</v-icon>
                <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase">Flow preview</span>
              </div>
              <div class="text-body-2 font-weight-bold mb-3">{{ selectedTemplate?.name }}</div>
              <div class="cj-preview-panel border rounded-lg bg-background flex-grow-1">
                <JourneyMiniPreview v-if="selectedTemplate" :nodes="selectedTemplate.nodes" />
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Footer -->
    <div class="cj-footer d-flex align-center justify-space-between px-5 border-t bg-surface">
      <v-btn variant="text" class="text-none" :disabled="step === 1" prepend-icon="arrow-left" @click="step = 1">Back</v-btn>
      <div class="d-flex gap-2">
        <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" append-icon="arrow-right"
          :disabled="!selectedTemplateId" @click="continueToSettings">Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="workflow"
          :disabled="!canCreate" @click="createJourney">Create journey</v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cj-root { height: 100vh; overflow: hidden; }
.cj-toolbar { height: 56px; flex-shrink: 0; }
.cj-footer { height: 64px; flex-shrink: 0; }
.cj-content { max-width: 1160px; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* Step chips */
.cj-step {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.8125rem; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.cj-step__num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.25);
  font-size: 0.6875rem; font-weight: 700;
}
.cj-step--active { color: rgb(var(--v-theme-on-surface)); }
.cj-step--active .cj-step__num {
  background: rgb(var(--v-theme-primary)); border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.cj-step--done .cj-step__num {
  background: rgba(var(--v-theme-primary), 0.12); border-color: transparent;
  color: rgb(var(--v-theme-primary));
}
.cj-step__rail { width: 32px; height: 1.5px; background: rgba(var(--v-border-color), var(--v-border-opacity)); }

/* Small screens: step chips collapse to numbers so the toolbar fits */
@media (max-width: 700px) {
  .cj-step { font-size: 0; gap: 0; }
  .cj-step__rail { width: 14px; }
}

/* Template cards */
.cj-card { cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
.cj-card:hover { border-color: rgba(var(--v-theme-primary), 0.5); }
.cj-card--selected { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)); }
.cj-card__desc { min-height: 44px; }
.cj-card__preview {
  padding: 14px 10px; max-height: 240px; overflow: hidden;
  display: flex; justify-content: center;
}

.cj-preview-panel { padding: 20px 12px; overflow: auto; min-height: 320px; display: flex; justify-content: center; }
</style>
