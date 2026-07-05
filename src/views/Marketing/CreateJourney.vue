<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import JourneyMiniPreview from '@/components/marketing/JourneyMiniPreview.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import type { JourneyTemplate } from '@/stores/journeyFlowData'
import { journeyTemplates } from '@/stores/journeyFlowData'
import type { JourneyBrief, JourneyDraft, JourneyGoal, RefinementKind } from '@/composables/useJourneyGenerator'
import { applyRefinement, generateJourneyDraft, goalOptions } from '@/composables/useJourneyGenerator'
import { audiences } from '@/composables/dvIntentData'

const router = useRouter()
const route = useRoute()
const store = useCampaignsStore()
const accountId = computed(() => route.params.accountId as string)

const mode = ref<'template' | 'ai'>('template')

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

// ── Build with Da Vinci ──────────────────────────────────────────────────────

const audienceOptions = Object.values(audiences).map(a => a.label)

const brief = reactive<JourneyBrief>({ goal: 'welcome', audience: audienceOptions[0] ?? 'All Contacts', brand: '', offer: '', notes: '' })
const draft = ref<JourneyDraft | null>(null)
const copySeed = ref(0)
const aiName = ref('')
const aiEnable = ref(false)

const refineChips: { kind: RefinementKind; label: string; icon: string }[] = [
  { kind: 'add-winback-branch', label: 'Add win-back branch', icon: 'split' },
  { kind: 'more-urgent', label: 'Tighter timing', icon: 'timer' },
  { kind: 'shorter', label: 'One less email', icon: 'minus' },
  { kind: 'regenerate', label: 'Regenerate copy', icon: 'refresh-ccw' },
]

function generateDraft() {
  draft.value = generateJourneyDraft(brief, copySeed.value)
  aiName.value = draft.value.suggestedName
}

function refineDraft(kind: RefinementKind) {
  if (!draft.value) return
  if (kind === 'regenerate') copySeed.value++
  draft.value = applyRefinement(draft.value, kind, brief, copySeed.value)
  if (kind === 'regenerate') aiName.value = draft.value.suggestedName
}

const canCreateFromDraft = computed(() => !!draft.value && aiName.value.trim().length > 0)

function createFromDraft() {
  if (!draft.value || !canCreateFromDraft.value) return
  const id = store.createJourney({
    name: aiName.value.trim(),
    nodes: draft.value.nodes,
    settings: { enabled: aiEnable.value, retrigger: false },
  })
  router.replace({ name: 'JourneyBuilder', params: { accountId: accountId.value, id } })
}

// Deep link from the Da Vinci copilot: /journeys/new?ai=1&goal=abandoned-cart
onMounted(() => {
  if (!route.query.ai) return
  mode.value = 'ai'
  const goal = String(route.query.goal ?? '')
  if (goalOptions.some(g => g.key === goal)) {
    brief.goal = goal as JourneyGoal
    generateDraft()
  }
})
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

      <MpWizardSteps v-if="mode === 'template'" :steps="['Choose template', 'Settings']" :current="step" />
      <v-chip v-else color="primary" variant="tonal" size="small" class="font-weight-bold">
        <v-icon size="14" class="mr-1">sparkles</v-icon> Build with Da Vinci
      </v-chip>

      <v-btn variant="text" size="small" class="text-none" @click="cancel">Cancel</v-btn>
    </div>

    <!-- Step 1 — template gallery -->
    <div v-if="mode === 'template' && step === 1" class="flex-grow-1 overflow-y-auto bg-background">
      <div class="cj-content mx-auto px-6 py-8">
        <h2 class="text-h6 font-weight-bold mb-1">Start with a template</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Every template is a working flow you can preview before committing — pick one and make it yours, or start from scratch.
        </p>

        <!-- Build with Da Vinci hero -->
        <v-card flat rounded="lg" class="cj-hero pa-5 mb-6 d-flex align-center gap-4 flex-wrap" role="button"
          aria-label="Build with Da Vinci" @click="mode = 'ai'">
          <v-avatar color="primary" size="44" rounded="lg">
            <v-icon color="white" size="22">sparkles</v-icon>
          </v-avatar>
          <div style="min-width: 200px; flex: 1;">
            <div class="font-weight-bold text-body-1">Build with Da Vinci</div>
            <div class="text-body-2 text-medium-emphasis">
              Describe your goal and audience — Da Vinci drafts the whole flow, and you review it before anything is created.
            </div>
          </div>
          <v-btn color="primary" variant="flat" class="text-none flex-shrink-0" append-icon="arrow-right">Start</v-btn>
        </v-card>

        <v-row>
          <v-col v-for="tpl in journeyTemplates" :key="tpl.id" cols="12" sm="6" md="4">
            <MpOptionCard :selected="selectedTemplateId === tpl.id" :title="tpl.name" :icon="tpl.icon"
              class="h-100"
              @click="chooseTemplate(tpl.id)" @dblclick="chooseTemplate(tpl.id); continueToSettings()">
              <div class="text-caption text-medium-emphasis cj-card__desc">{{ tpl.description }}</div>
              <div class="d-flex gap-2 mt-3">
                <v-chip size="x-small" variant="tonal" color="primary">{{ stepCount(tpl) }} {{ stepCount(tpl) === 1 ? 'step' : 'steps' }}</v-chip>
                <v-chip v-if="branchCount(tpl)" size="x-small" variant="tonal" color="secondary">
                  {{ branchCount(tpl) }} {{ branchCount(tpl) === 1 ? 'branch' : 'branches' }}
                </v-chip>
              </div>
              <template #media>
                <div class="cj-card__preview">
                  <JourneyMiniPreview :nodes="tpl.nodes" />
                </div>
              </template>
            </MpOptionCard>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Step 2 — settings + persistent preview -->
    <div v-else-if="mode === 'template'" class="flex-grow-1 overflow-y-auto bg-background">
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

    <!-- Build with Da Vinci — brief + live draft -->
    <div v-else class="flex-grow-1 overflow-y-auto bg-background">
      <div class="cj-content mx-auto px-6 py-8">
        <v-row>
          <!-- Brief -->
          <v-col cols="12" md="5">
            <v-card flat border rounded="lg" class="pa-5">
              <h2 class="text-h6 font-weight-bold mb-1">Tell Da Vinci the goal</h2>
              <p class="text-body-2 text-medium-emphasis mb-4">One short brief replaces the interview — you can refine after.</p>

              <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">Goal</div>
              <div class="d-flex flex-wrap gap-2 mb-4">
                <v-chip v-for="g in goalOptions" :key="g.key" :prepend-icon="g.icon" size="small"
                  :color="brief.goal === g.key ? 'primary' : undefined"
                  :variant="brief.goal === g.key ? 'flat' : 'outlined'"
                  class="text-none" @click="brief.goal = g.key">
                  {{ g.label }}
                </v-chip>
              </div>

              <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">Audience</div>
              <div class="d-flex flex-wrap gap-2 mb-4">
                <v-chip v-for="a in audienceOptions" :key="a" size="small"
                  :color="brief.audience === a ? 'primary' : undefined"
                  :variant="brief.audience === a ? 'flat' : 'outlined'"
                  class="text-none" @click="brief.audience = a">
                  {{ a }}
                </v-chip>
              </div>

              <v-text-field v-model="brief.brand" label="Brand / store name" placeholder="e.g. Acme Coffee"
                variant="outlined" density="comfortable" class="mb-3" hide-details />
              <v-text-field v-model="brief.offer" label="Offer or hook (optional)" placeholder="e.g. 15% off your first order"
                variant="outlined" density="comfortable" class="mb-4" hide-details />

              <v-btn color="primary" variant="flat" block class="text-none" prepend-icon="sparkles" @click="generateDraft">
                {{ draft ? 'Update draft' : 'Generate draft' }}
              </v-btn>
            </v-card>
          </v-col>

          <!-- Draft preview -->
          <v-col cols="12" md="7">
            <v-card flat border rounded="lg" class="pa-5 h-100 d-flex flex-column">
              <template v-if="draft">
                <div class="d-flex align-start gap-3 mb-4">
                  <v-avatar color="primary" size="34" rounded="lg" class="flex-shrink-0">
                    <v-icon color="white" size="17">sparkles</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase">Da Vinci's draft</div>
                    <div class="text-body-2">{{ draft.rationale }}</div>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-2 mb-4">
                  <v-chip v-for="chip in refineChips" :key="chip.kind" size="small" variant="outlined"
                    :prepend-icon="chip.icon" class="text-none" @click="refineDraft(chip.kind)">
                    {{ chip.label }}
                  </v-chip>
                </div>

                <div class="cj-preview-panel border rounded-lg bg-background mb-4" style="min-height: 220px; max-height: 320px;">
                  <JourneyMiniPreview :nodes="draft.nodes" />
                </div>

                <v-table density="compact" class="border rounded-lg mb-4">
                  <thead>
                    <tr>
                      <th style="width: 36px;">#</th>
                      <th>Subject line</th>
                      <th>Preheader</th>
                      <th style="width: 160px;">Timing</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in draft.sequence" :key="row.order">
                      <td class="text-medium-emphasis">{{ row.order }}</td>
                      <td class="font-weight-medium">{{ row.subject }}</td>
                      <td class="text-medium-emphasis">{{ row.preheader }}</td>
                      <td class="text-medium-emphasis">{{ row.delay }}</td>
                    </tr>
                  </tbody>
                </v-table>

                <div class="d-flex align-center gap-4 mt-auto flex-wrap">
                  <v-text-field v-model="aiName" label="Journey name" variant="outlined" density="comfortable"
                    hide-details style="min-width: 240px; flex: 1;" />
                  <v-switch v-model="aiEnable" color="primary" density="compact" hide-details label="Enable on save" />
                </div>
              </template>

              <div v-else class="flex-grow-1 d-flex flex-column align-center justify-center text-center pa-8">
                <v-avatar color="primary" variant="tonal" size="56" class="mb-4">
                  <v-icon size="28">sparkles</v-icon>
                </v-avatar>
                <div class="font-weight-bold mb-1">Nothing is created yet</div>
                <div class="text-body-2 text-medium-emphasis" style="max-width: 340px;">
                  Fill in the brief and generate — you'll see the whole flow and every email before the journey exists.
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Footer -->
    <div class="cj-footer d-flex align-center justify-space-between px-5 border-t bg-surface">
      <v-btn v-if="mode === 'template'" variant="text" class="text-none" :disabled="step === 1" prepend-icon="arrow-left" @click="step = 1">Back</v-btn>
      <v-btn v-else variant="text" class="text-none" prepend-icon="arrow-left" @click="mode = 'template'">Templates</v-btn>
      <div class="d-flex gap-2">
        <template v-if="mode === 'template'">
          <v-btn v-if="step === 1" color="primary" variant="flat" class="text-none" append-icon="arrow-right"
            :disabled="!selectedTemplateId" @click="continueToSettings">Continue</v-btn>
          <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="workflow"
            :disabled="!canCreate" @click="createJourney">Create journey</v-btn>
        </template>
        <v-btn v-else color="primary" variant="flat" class="text-none" prepend-icon="workflow"
          :disabled="!canCreateFromDraft" @click="createFromDraft">Create journey</v-btn>
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

/* Build with Da Vinci hero */
.cj-hero {
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.06);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cj-hero:hover { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 1px rgba(var(--v-theme-primary), 0.4); }
.cj-hero:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }

/* Template cards (chrome lives in MpOptionCard) */
.cj-card__desc { min-height: 44px; }
.cj-card__preview {
  padding: 14px 10px; max-height: 240px; overflow: hidden;
  display: flex; justify-content: center;
}

.cj-preview-panel { padding: 20px 12px; overflow: auto; min-height: 320px; display: flex; justify-content: center; }
</style>
