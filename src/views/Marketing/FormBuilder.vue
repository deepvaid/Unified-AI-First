<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import { useToast } from '@/composables/useToast'
import {
  useFormsStore, newFormDefaults, SUBSCRIPTION_LISTS, POPUP_POSITIONS, defaultFormBlock,
} from '@/stores/useForms'
import type {
  FormType, FormBlock, FormBlockType, FormDisplayRules, FormDesign, FormOptionalFunctions, FormBuilderInput,
} from '@/stores/useForms'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const formsStore = useFormsStore()

// Edit hydration: /acquisition/forms/create?formId=123 (query param — see final report re: path param)
const editId = computed(() => (route.query.formId ? Number(route.query.formId) : null))
const persistedId = ref<number | null>(null)

// ─── Wizard shell ───────────────────────────────────────────────────────
const stepTitles = ['Setup', 'Content', 'Display', 'Style', 'Review & Publish']
const step = ref(1)
const totalSteps = stepTitles.length
const maxStep = ref(1)
function advance(to: number) {
  step.value = to
  if (to > maxStep.value) maxStep.value = to
}
function goToStep(to: number) {
  if (to <= maxStep.value) step.value = to
}

// ─── Step 1: Setup ──────────────────────────────────────────────────────
const seed = newFormDefaults()
const formName = ref(seed.name)
const selectedListIds = ref<string[]>([...seed.subscriptionListIds])
const domains = ref<string[]>([...seed.domains])
const newDomain = ref('')
function addDomain() {
  const v = newDomain.value.trim()
  if (v && !domains.value.includes(v)) domains.value.push(v)
  newDomain.value = ''
}
function removeDomain(d: string) {
  domains.value = domains.value.filter(x => x !== d)
}
const selectAllLists = computed({
  get: () => selectedListIds.value.length === SUBSCRIPTION_LISTS.length,
  set: (v: boolean) => { selectedListIds.value = v ? SUBSCRIPTION_LISTS.map(l => l.id) : [] },
})

// ─── Step 2: Content (Main Form / Thank You) ────────────────────────────
const mainFormBlocks = ref<FormBlock[]>(seed.mainFormBlocks)
const thankYouBlocks = ref<FormBlock[]>(seed.thankYouBlocks)
const contentTab = ref<'main' | 'thankyou'>('main')
const activeBlocks = computed<FormBlock[]>(() => (contentTab.value === 'main' ? mainFormBlocks.value : thankYouBlocks.value))

const FORM_PALETTE: { type: FormBlockType; label: string; icon: string }[] = [
  { type: 'title', label: 'Title', icon: 'heading' },
  { type: 'paragraph', label: 'Paragraph', icon: 'text' },
  { type: 'list', label: 'List', icon: 'list' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'divider', label: 'Divider', icon: 'minus' },
  { type: 'spacer', label: 'Spacer', icon: 'move-vertical' },
  { type: 'social', label: 'Social', icon: 'share-2' },
  { type: 'html', label: 'HTML', icon: 'code' },
  { type: 'video', label: 'Video', icon: 'video' },
  { type: 'icons', label: 'Icons', icon: 'shapes' },
  { type: 'text', label: 'Text', icon: 'type' },
]

const selectedMainId = ref<string | null>(mainFormBlocks.value[0]?.id ?? null)
const selectedThankId = ref<string | null>(thankYouBlocks.value[0]?.id ?? null)
const selectedBlockId = computed<string | null>({
  get: () => (contentTab.value === 'main' ? selectedMainId.value : selectedThankId.value),
  set: (v) => { if (contentTab.value === 'main') selectedMainId.value = v; else selectedThankId.value = v },
})
const selectedBlock = computed(() => activeBlocks.value.find(b => b.id === selectedBlockId.value) ?? null)

function addContentBlock(type: FormBlockType) {
  const block = defaultFormBlock(type)
  const arr = activeBlocks.value
  const idx = selectedBlockId.value ? arr.findIndex(b => b.id === selectedBlockId.value) : arr.length - 1
  arr.splice(idx + 1, 0, block)
  selectedBlockId.value = block.id
}
function removeContentBlock(id: string) {
  const arr = activeBlocks.value
  const idx = arr.findIndex(b => b.id === id)
  if (idx === -1 || arr[idx]?.type === 'email_submit') return
  arr.splice(idx, 1)
  if (selectedBlockId.value === id) selectedBlockId.value = arr[Math.max(0, idx - 1)]?.id ?? null
}
function moveContentBlock(id: string, dir: -1 | 1) {
  const arr = activeBlocks.value
  const idx = arr.findIndex(b => b.id === id)
  const next = idx + dir
  if (idx === -1 || arr[idx]?.type === 'email_submit' || next < 0 || next >= arr.length) return
  if (arr[next]?.type === 'email_submit') return
  const [b] = arr.splice(idx, 1)
  if (b) arr.splice(next, 0, b)
}
function listText(block: FormBlock): string {
  return block.items.join('\n')
}
function setListText(block: FormBlock, value: string) {
  block.items = value.split('\n')
}

// ─── Step 3: Display ────────────────────────────────────────────────────
const formType = ref<FormType>(seed.type)
const display = ref<FormDisplayRules>({ ...seed.display, urlTargets: [...seed.display.urlTargets] })
const newUrlTarget = ref('')
function addUrlTarget() {
  const v = newUrlTarget.value.trim()
  if (v && !display.value.urlTargets.includes(v)) display.value.urlTargets.push(v)
  newUrlTarget.value = ''
}
function removeUrlTarget(u: string) {
  display.value.urlTargets = display.value.urlTargets.filter(x => x !== u)
}

// ─── Step 4: Style ──────────────────────────────────────────────────────
const design = ref<FormDesign>({ ...seed.design })
const optional = ref<FormOptionalFunctions>({ ...seed.optional })
const previewDevice = ref<'desktop' | 'mobile' | 'fullscreen'>('desktop')
const STYLE_THEMES: { id: string; label: string; backgroundColor: string; overlayOpacity: number }[] = [
  { id: 'dark', label: 'Dark', backgroundColor: '#1A1A2E', overlayOpacity: 60 },
  { id: 'light', label: 'Light', backgroundColor: '#FFFFFF', overlayOpacity: 40 },
  { id: 'brand', label: 'Brand', backgroundColor: '#1A56DB', overlayOpacity: 55 },
]
function applyTheme(id: string) {
  const t = STYLE_THEMES.find(x => x.id === id)
  if (!t) return
  design.value.backgroundType = 'color'
  design.value.backgroundColor = t.backgroundColor
  design.value.overlayOpacity = t.overlayOpacity
}
const POSITION_ALIGN: Record<string, { align: string; justify: string }> = {
  'classic-center': { align: 'center', justify: 'center' },
  'top-right': { align: 'flex-start', justify: 'flex-end' },
  'top-left': { align: 'flex-start', justify: 'flex-start' },
  'bottom-right': { align: 'flex-end', justify: 'flex-end' },
  'bottom-left': { align: 'flex-end', justify: 'flex-start' },
  'drawer-left': { align: 'stretch', justify: 'flex-start' },
  'drawer-right': { align: 'stretch', justify: 'flex-end' },
  'bar-bottom': { align: 'flex-end', justify: 'stretch' },
  'bar-top': { align: 'flex-start', justify: 'stretch' },
}
const positionStyle = computed(() => {
  const p = POSITION_ALIGN[design.value.position] ?? POSITION_ALIGN['classic-center']!
  return { alignItems: p.align, justifyContent: p.justify }
})

// ─── Step 5: Review & Publish ────────────────────────────────────────────
const reviewTab = ref<'details' | 'preview'>('details')
const embedId = computed(() => persistedId.value ?? 'draft')
const embedScript = computed(() => `<script src="https://forms.maropost.com/embed/${embedId.value}.js" async><\/script>`)
const manualScript = computed(() => `<div id="mp-form-${embedId.value}"></div>\n<script>\n  window.MaropostForms = window.MaropostForms || [];\n  window.MaropostForms.push({ formId: "${embedId.value}", target: "#mp-form-${embedId.value}" });\n<\/script>`)
const toast = useToast()
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    // clipboard unavailable — no-op in this prototype
  }
}
const listNames = computed(() => selectedListIds.value.map(id => SUBSCRIPTION_LISTS.find(l => l.id === id)?.name).filter(Boolean).join(', ') || '—')
const positionLabel = computed(() => POPUP_POSITIONS.find(p => p.value === design.value.position)?.label ?? '—')
const persistedForm = computed(() => (persistedId.value ? formsStore.forms.find(f => f.id === persistedId.value) : null))

// ─── Validation ───────────────────────────────────────────────────────
const step1Valid = computed(() => formName.value.trim().length > 0 && selectedListIds.value.length > 0)
const step4Valid = computed(() => design.value.width > 0)

// ─── Persistence ─────────────────────────────────────────────────────
function buildInput(): FormBuilderInput {
  const titleBlock = mainFormBlocks.value.find(b => b.type === 'title')
  const submitBlock = mainFormBlocks.value.find(b => b.type === 'email_submit')
  return {
    name: formName.value,
    type: formType.value,
    subscriptionListIds: [...selectedListIds.value],
    domains: [...domains.value],
    display: { ...display.value, urlTargets: [...display.value.urlTargets] },
    design: { ...design.value },
    optional: { ...optional.value },
    mainFormBlocks: mainFormBlocks.value,
    thankYouBlocks: thankYouBlocks.value,
    headline: titleBlock?.text ?? seed.headline,
    buttonLabel: submitBlock?.text ?? seed.buttonLabel,
  }
}
function persist(): number {
  const input = buildInput()
  if (persistedId.value) {
    formsStore.updateForm(persistedId.value, input)
  } else {
    persistedId.value = formsStore.createForm(input)
  }
  return persistedId.value
}

// ─── Hydrate on edit ──────────────────────────────────────────────────
onMounted(() => {
  if (editId.value) {
    const f = formsStore.forms.find(x => x.id === editId.value)
    if (f) {
      persistedId.value = f.id
      formName.value = f.name
      formType.value = f.type
      selectedListIds.value = [...f.subscriptionListIds]
      domains.value = [...f.domains]
      display.value = { ...f.display, urlTargets: [...f.display.urlTargets] }
      design.value = { ...f.design }
      optional.value = { ...f.optional }
      mainFormBlocks.value = f.mainFormBlocks.map(b => ({ ...b, items: [...b.items] }))
      thankYouBlocks.value = f.thankYouBlocks.map(b => ({ ...b, items: [...b.items] }))
      selectedMainId.value = mainFormBlocks.value[0]?.id ?? null
      selectedThankId.value = thankYouBlocks.value[0]?.id ?? null
    }
  }
  baseline = snapshot.value
})

// ─── Dirty tracking + unsaved-changes guard ───────────────────────────
const snapshot = computed(() => JSON.stringify([
  formName.value, formType.value, selectedListIds.value, domains.value, display.value,
  design.value, optional.value, mainFormBlocks.value, thankYouBlocks.value,
]))
let baseline = ''
function markClean() { baseline = snapshot.value }
const dirty = computed(() => snapshot.value !== baseline)

const {
  confirmLeave,
  allowNextLeave,
  discardAndLeave,
  leaveTitle,
  leaveMessage,
  leaveConfirmLabel,
} = useDirtyLeaveGuard(dirty, {
  title: 'Leave the form builder?',
  message: 'You have unsaved changes. Leaving now will discard them.',
})

function saveDraft() { persist(); markClean(); toast.success('Saved') }
function saveAndExit() {
  persist()
  markClean()
  allowNextLeave()
  router.push(backRoute())
}
function backRoute() { return { name: 'AcquisitionForms', params: { accountId: accountId.value } } }
function goBack() { router.push(backRoute()) }
function exitBuilder() {
  allowNextLeave()
  router.push(backRoute())
}
function publishForm() {
  const id = persist()
  formsStore.publish(id)
  markClean()
  allowNextLeave()
  router.push(backRoute())
}
</script>

<template>
  <MpBuilderShell
    :title="formName || 'New Acquisition Form'"
    :subtitle="`Step ${step} of ${totalSteps} · ${stepTitles[step - 1]}`"
    back-label="Back to Forms"
    :dirty="dirty"
    persistence-mode="explicit"
    @back="goBack"
  >
    <template #actions>
      <v-btn variant="text" class="text-none text-medium-emphasis" size="small" prepend-icon="save" @click="saveDraft">Save Draft</v-btn>
      <v-btn variant="outlined" class="text-none" size="small" @click="saveAndExit">Save &amp; exit</v-btn>
    </template>

    <template #steps>
      <MpWizardSteps :steps="stepTitles" :current="step" clickable :max-step="maxStep" @select="goToStep" />
    </template>

    <!-- Content -->
    <div class="h-100 overflow-hidden">
      <!-- STEP 1: Setup -->
      <div v-if="step === 1" class="fb__scroll d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:620px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">New Form</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Name your form and choose which lists subscribers will be added to.</div>

          <MpFormGrid>
            <v-text-field v-model="formName" label="Form Name *" placeholder="e.g. Homepage Exit-Intent Popup" />

            <MpFormField label="Subscription Lists" required>
              <div class="d-flex justify-end">
                <v-checkbox v-model="selectAllLists" label="Select All" class="fb-select-all" />
              </div>
              <v-card variant="flat" border rounded="lg">
                <v-list density="compact" class="py-1">
                  <v-list-item v-for="list in SUBSCRIPTION_LISTS" :key="list.id">
                    <template #prepend>
                      <!-- The only deliberate density/hide-details suppression in this file:
                           these checkboxes belong to compact list rows, not to the form's
                           own field rhythm. -->
                      <v-checkbox
                        :model-value="selectedListIds.includes(list.id)"
                        :aria-label="list.name"
                        density="compact"
                        hide-details
                        @update:model-value="(v) => { if (v) selectedListIds.push(list.id); else selectedListIds = selectedListIds.filter(id => id !== list.id) }"
                      />
                    </template>
                    <v-list-item-title class="text-body-2">{{ list.name }}</v-list-item-title>
                    <template #append>
                      <span class="text-caption text-medium-emphasis num">{{ list.count.toLocaleString() }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </MpFormField>

            <div class="d-flex align-center ga-2">
              <v-text-field v-model="newDomain" label="Domain name" placeholder="e.g. mystore.com" @keydown.enter="addDomain" />
              <v-btn variant="tonal" color="primary" class="text-none" prepend-icon="plus" @click="addDomain">Add Domain</v-btn>
            </div>
            <div v-if="domains.length" class="d-flex flex-wrap ga-2">
              <v-chip v-for="d in domains" :key="d" closable size="small" variant="tonal" @click:close="removeDomain(d)">{{ d }}</v-chip>
            </div>
          </MpFormGrid>

          <div class="d-flex justify-end mt-6">
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!step1Valid" @click="advance(2)">Continue to Content</v-btn>
          </div>
        </v-card>
      </div>

      <!-- STEP 3: Display (formerly Settings & Display) -->
      <div v-else-if="step === 3" class="fb__scroll d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:620px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">Display</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Choose the form type and control when and where it appears.</div>

          <MpFormGrid :cols="2">
            <MpFormField label="Form Type" class="mp-form-grid__full">
              <MpFormGrid :cols="2">
                <MpOptionCard :selected="formType === 'Popup'" title="Popup" description="Triggered overlay on top of page content" icon="smartphone" @click="formType = 'Popup'" />
                <MpOptionCard :selected="formType === 'Embedded'" title="Embedded" description="Inline form inside your page layout" icon="globe" @click="formType = 'Embedded'" />
              </MpFormGrid>
            </MpFormField>

            <v-switch v-model="display.dontShowAgainAfterSubmit" class="mp-form-grid__full" label="Don't show form again after submission" />

            <v-divider class="mp-form-grid__full" />
            <MpFormField label="Display On" class="mp-form-grid__full">
              <template #default="{ labelId }">
                <v-radio-group v-model="display.displayOn" :aria-labelledby="labelId">
                  <v-radio value="entry" label="Entry (page load)" />
                  <v-radio value="exit" label="Exit intent" />
                  <v-radio value="scroll" label="Percentage scrolled" />
                </v-radio-group>
              </template>
            </MpFormField>
            <v-slider
              v-if="display.displayOn === 'scroll'"
              v-model="display.scrollPercent"
              class="mp-form-grid__full"
              :min="10"
              :max="100"
              :step="10"
              thumb-label="always"
              label="Scroll depth %"
            />

            <v-divider class="mp-form-grid__full" />
            <v-checkbox v-model="display.urlTargetingEnabled" class="mp-form-grid__full" label="Only show on these URLs" />
            <template v-if="display.urlTargetingEnabled">
              <div class="mp-form-grid__full d-flex align-center ga-2">
                <v-text-field v-model="newUrlTarget" label="URL path" placeholder="/collections/sale" @keydown.enter="addUrlTarget" />
                <v-btn variant="tonal" color="primary" class="text-none" prepend-icon="plus" @click="addUrlTarget">Add URL</v-btn>
              </div>
              <div v-if="display.urlTargets.length" class="mp-form-grid__full d-flex flex-wrap ga-2">
                <v-chip v-for="u in display.urlTargets" :key="u" closable size="small" variant="tonal" @click:close="removeUrlTarget(u)">{{ u }}</v-chip>
              </div>
            </template>

            <v-divider class="mp-form-grid__full" />
            <v-checkbox v-model="display.hideForDaysEnabled" class="mp-form-grid__full" label="Don't show pop-up for N days after closing" />
            <v-text-field
              v-if="display.hideForDaysEnabled"
              v-model.number="display.hideForDays"
              type="number"
              label="Days"
            />
          </MpFormGrid>

          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="step = 2">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" @click="advance(4)">Continue to Style</v-btn>
          </div>
        </v-card>
      </div>

      <!-- STEP 4: Style (formerly Design) -->
      <div v-else-if="step === 4" class="d-flex h-100 overflow-hidden">
        <div class="fb__panel border-r bg-surface d-flex flex-column overflow-hidden">
          <div class="pa-3 flex-grow-1 overflow-y-auto">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel title="Position">
                <v-expansion-panel-text>
                  <v-radio-group v-model="design.position" aria-label="Position">
                    <v-radio v-for="p in POPUP_POSITIONS" :key="p.value" :value="p.value" :label="p.label" />
                  </v-radio-group>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <MpFormSection title="Theme" />
            <div class="d-flex flex-wrap ga-2 mt-2 mb-3">
              <v-btn
                v-for="t in STYLE_THEMES"
                :key="t.id"
                size="small"
                variant="tonal"
                class="text-none"
                @click="applyTheme(t.id)"
              >{{ t.label }}</v-btn>
            </div>

            <v-expansion-panels variant="accordion" class="mt-2">
              <v-expansion-panel title="Advanced">
                <v-expansion-panel-text>
                  <v-expansion-panels variant="accordion" multiple>
                    <v-expansion-panel title="Dimensions">
                      <v-expansion-panel-text>
                        <MpFormGrid>
                          <v-text-field v-model.number="design.width" type="number" label="Width (px) *" />
                          <v-text-field v-model.number="design.height" type="number" label="Height (px)" :disabled="design.fitHeight" />
                          <v-checkbox v-model="design.fitHeight" label="Fit to content height" />
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <v-expansion-panel title="Padding">
                      <v-expansion-panel-text>
                        <MpFormGrid :cols="2">
                          <v-text-field v-model.number="design.paddingTop" type="number" label="Top *" />
                          <v-text-field v-model.number="design.paddingBottom" type="number" label="Bottom *" />
                          <v-text-field v-model.number="design.paddingLeft" type="number" label="Left *" />
                          <v-text-field v-model.number="design.paddingRight" type="number" label="Right *" />
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <v-expansion-panel title="Border">
                      <v-expansion-panel-text>
                        <MpFormGrid :cols="2">
                          <MpFormField label="Color" class="mp-form-grid__full">
                            <v-menu :close-on-content-click="false" location="start">
                              <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.borderColor }" aria-label="Border color" /></template>
                              <v-color-picker v-model="design.borderColor" mode="hexa" :modes="['hexa']" />
                            </v-menu>
                          </MpFormField>
                          <v-text-field v-model.number="design.borderThickness" type="number" label="Thickness (px) *" />
                          <v-text-field v-model.number="design.borderRadius" type="number" label="Radius (px) *" />
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <v-expansion-panel title="Drop Shadow">
                      <v-expansion-panel-text>
                        <MpFormGrid :cols="2">
                          <MpFormField label="Color" class="mp-form-grid__full">
                            <v-menu :close-on-content-click="false" location="start">
                              <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.shadowColor }" aria-label="Shadow color" /></template>
                              <v-color-picker v-model="design.shadowColor" mode="hexa" :modes="['hexa']" />
                            </v-menu>
                          </MpFormField>
                          <v-text-field v-model.number="design.shadowBlur" class="mp-form-grid__full" type="number" label="Blur (px)" />
                          <v-text-field v-model.number="design.shadowOffsetH" type="number" label="H offset" />
                          <v-text-field v-model.number="design.shadowOffsetV" type="number" label="V offset" />
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <v-expansion-panel title="Overlay">
                      <v-expansion-panel-text>
                        <MpFormGrid>
                          <MpFormField label="Color">
                            <v-menu :close-on-content-click="false" location="start">
                              <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.overlayColor }" aria-label="Overlay color" /></template>
                              <v-color-picker v-model="design.overlayColor" mode="hex" :modes="['hex']" />
                            </v-menu>
                          </MpFormField>
                          <MpFormField :label="`Opacity: ${design.overlayOpacity}%`">
                            <template #default="{ labelId }">
                              <v-slider v-model="design.overlayOpacity" :min="0" :max="90" :step="5" :aria-labelledby="labelId" />
                            </template>
                          </MpFormField>
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <v-expansion-panel title="Background">
                      <v-expansion-panel-text>
                        <MpFormGrid>
                          <MpFormField label="Background type">
                            <template #default="{ labelId }">
                              <v-radio-group v-model="design.backgroundType" inline :aria-labelledby="labelId">
                                <v-radio value="color" label="Colour" />
                                <v-radio value="image" label="Image" />
                              </v-radio-group>
                            </template>
                          </MpFormField>
                          <MpFormField v-if="design.backgroundType === 'color'" label="Background colour">
                            <div class="d-flex align-center ga-2">
                              <v-menu :close-on-content-click="false" location="start">
                                <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.backgroundColor }" aria-label="Background color" /></template>
                                <v-color-picker v-model="design.backgroundColor" mode="hex" :modes="['hex']" />
                              </v-menu>
                              <span class="text-caption text-medium-emphasis">{{ design.backgroundColor }}</span>
                            </div>
                          </MpFormField>
                          <template v-else>
                            <v-text-field v-model="design.backgroundImage" label="Image URL" placeholder="https://" />
                            <v-btn variant="tonal" block prepend-icon="upload" class="text-none">Upload image</v-btn>
                          </template>
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>

                    <v-expansion-panel title="Optional functions">
                      <v-expansion-panel-text>
                        <MpFormGrid>
                          <v-checkbox v-model="optional.redirectEnabled" label="Redirect after submission" />
                          <v-text-field v-if="optional.redirectEnabled" v-model="optional.redirectUrl" label="Redirect URL" placeholder="https://mystore.com/thank-you" />

                          <v-checkbox v-model="optional.notifyEmailEnabled" label="Notify email on subscriber" />
                          <v-text-field v-if="optional.notifyEmailEnabled" v-model="optional.notifyEmail" label="Notify email address" placeholder="team@mystore.com" />

                          <v-switch v-model="optional.recaptchaEnabled" label="ReCaptcha" />
                          <v-switch v-model="optional.doubleOptInEnabled" label="Double opt-in" />
                        </MpFormGrid>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <div class="pa-3 border-t d-flex gap-2">
            <v-btn variant="text" class="text-none flex-grow-1" size="small" prepend-icon="arrow-left" @click="step = 3">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none flex-grow-1" size="small" append-icon="arrow-right" :disabled="!step4Valid" @click="advance(5)">Continue to Review</v-btn>
          </div>
        </div>

        <!-- Live device preview -->
        <div class="flex-grow-1 bg-background d-flex flex-column align-center overflow-auto pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-btn-toggle v-model="previewDevice" density="compact" mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented">
              <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
              <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
              <v-btn value="fullscreen" class="text-none" size="small" prepend-icon="maximize">Fullscreen</v-btn>
            </v-btn-toggle>
          </div>

          <div class="fb-device" :style="{ width: previewDevice === 'mobile' ? '375px' : previewDevice === 'fullscreen' ? '960px' : '780px' }">
            <div class="fb-device__chrome d-flex align-center gap-1 mb-2 px-2">
              <!-- macOS traffic lights: real-world fixed colors, allowlisted -->
              <span class="fb-dot" style="background:#ff5f56;" />
              <span class="fb-dot" style="background:#ffbd2e;" />
              <span class="fb-dot" style="background:#27c93f;" />
              <div class="fb-device__url" />
            </div>
            <div class="fb-page" :style="positionStyle">
              <div class="fb-overlay" :style="{ background: `${design.overlayColor}${Math.round(design.overlayOpacity * 2.55).toString(16).padStart(2, '0')}` }" />
              <div
                class="fb-form"
                :style="{
                  width: design.width + 'px',
                  height: design.fitHeight ? 'auto' : (design.height || undefined) + 'px',
                  padding: `${design.paddingTop}px ${design.paddingRight}px ${design.paddingBottom}px ${design.paddingLeft}px`,
                  background: design.backgroundType === 'color' ? design.backgroundColor : `center/cover url(${design.backgroundImage})`,
                  borderRadius: design.borderRadius + 'px',
                  border: `${design.borderThickness}px solid ${design.borderColor}`,
                  boxShadow: `${design.shadowOffsetH}px ${design.shadowOffsetV}px ${design.shadowBlur}px ${design.shadowColor}`,
                }"
              >
                <div v-for="b in mainFormBlocks.filter(x => x.type !== 'email_submit')" :key="b.id" class="fb-block" :style="{ textAlign: b.align }">
                  <div v-if="b.type === 'title'" class="fb-block__title">{{ b.text }}</div>
                  <div v-else-if="b.type === 'paragraph' || b.type === 'text'" class="fb-block__paragraph">{{ b.text }}</div>
                  <ul v-else-if="b.type === 'list'" class="fb-block__list"><li v-for="(li, i) in b.items" :key="i">{{ li }}</li></ul>
                  <hr v-else-if="b.type === 'divider'" class="fb-block__divider" />
                  <div v-else-if="b.type === 'spacer'" :style="{ height: b.height + 'px' }" />
                </div>
                <div class="fb-form__field">Email address</div>
                <div class="fb-form__btn" :style="{ borderRadius: Math.min(design.borderRadius, 12) + 'px' }">{{ mainFormBlocks.find(b => b.type === 'email_submit')?.text || 'Subscribe' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Content -->
      <div v-else-if="step === 2" class="d-flex flex-column h-100 overflow-hidden">
        <div class="d-flex flex-grow-1 overflow-hidden fb__split">
          <!-- palette -->
          <aside class="fb-palette pa-3">
            <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2 px-1">Blocks</div>
            <button v-for="p in FORM_PALETTE" :key="p.type" type="button" class="fb-palette__item d-flex align-center ga-2" @click="addContentBlock(p.type)">
              <v-icon size="18">{{ p.icon }}</v-icon>
              <span class="text-body-2">{{ p.label }}</span>
              <v-icon size="16" class="fb-palette__add ml-auto">plus</v-icon>
            </button>
          </aside>

          <!-- canvas -->
          <main class="fb-canvas flex-grow-1 pa-6 d-flex flex-column align-center overflow-y-auto">
            <v-btn-toggle v-model="contentTab" density="compact" mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
              <v-btn value="main" class="text-none" size="small">Main Form</v-btn>
              <v-btn value="thankyou" class="text-none" size="small">Thank You</v-btn>
            </v-btn-toggle>

            <div class="fb-doc">
              <div v-if="activeBlocks.length === 0" class="fb-doc__empty text-center pa-8">
                <v-icon size="28" class="text-medium-emphasis mb-2">layout-template</v-icon>
                <div class="text-body-2 font-weight-medium">No blocks yet</div>
                <div class="text-caption text-medium-emphasis">Add one from the Blocks palette on the left.</div>
              </div>
              <div
                v-for="block in activeBlocks"
                :key="block.id"
                class="fb-doc-block"
                :class="{ 'fb-doc-block--selected': block.id === selectedBlockId, 'fb-doc-block--fixed': block.type === 'email_submit' }"
                @click="selectedBlockId = block.id"
              >
                <div v-if="block.type !== 'email_submit'" class="fb-doc-block__controls">
                  <v-btn size="x-small" variant="text" icon="chevron-up" aria-label="Move up" @click.stop="moveContentBlock(block.id, -1)" />
                  <v-btn size="x-small" variant="text" icon="chevron-down" aria-label="Move down" @click.stop="moveContentBlock(block.id, 1)" />
                  <v-btn size="x-small" variant="text" icon="trash-2" color="error" aria-label="Delete" @click.stop="removeContentBlock(block.id)" />
                </div>
                <v-tooltip v-else text="Required block" location="left">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="fb-doc-block__lock">lock</v-icon>
                  </template>
                </v-tooltip>

                <h2 v-if="block.type === 'title'" class="fb-doc__title" :style="{ textAlign: block.align }">{{ block.text }}</h2>
                <p v-else-if="block.type === 'paragraph' || block.type === 'text'" class="fb-doc__paragraph" :style="{ textAlign: block.align }">{{ block.text }}</p>
                <ul v-else-if="block.type === 'list'" class="fb-doc__list"><li v-for="(li, i) in block.items" :key="i">{{ li }}</li></ul>
                <div v-else-if="block.type === 'image'" class="fb-doc__image"><v-icon size="32">image</v-icon><span class="text-caption text-medium-emphasis">{{ block.alt || 'Image' }}</span></div>
                <div v-else-if="block.type === 'video'" class="fb-doc__image"><v-icon size="32">video</v-icon><span class="text-caption text-medium-emphasis">Video embed</span></div>
                <hr v-else-if="block.type === 'divider'" class="fb-doc__divider" />
                <div v-else-if="block.type === 'spacer'" class="fb-doc__spacer" :style="{ height: `${block.height}px` }" />
                <div v-else-if="block.type === 'social'" class="fb-doc__social" :style="{ textAlign: block.align }"><v-icon>facebook</v-icon><v-icon>instagram</v-icon><v-icon>twitter</v-icon><v-icon>linkedin</v-icon></div>
                <div v-else-if="block.type === 'icons'" class="fb-doc__social" :style="{ textAlign: block.align }"><v-icon>star</v-icon><v-icon>heart</v-icon><v-icon>shield-check</v-icon></div>
                <pre v-else-if="block.type === 'html'" class="fb-doc__html">{{ block.text }}</pre>
                <div v-else-if="block.type === 'email_submit'" class="fb-doc__emailsubmit">
                  <div class="fb-doc__field">Email address</div>
                  <div class="fb-doc__submit">{{ block.text || 'Subscribe Now' }}</div>
                </div>
              </div>
            </div>
          </main>

          <!-- settings -->
          <aside class="fb-settings pa-4">
            <template v-if="selectedBlock">
              <MpFormGrid>
                <MpFormSection :title="`${selectedBlock.type.replace('_', ' ')} settings`" />

                <template v-if="selectedBlock.type === 'title' || selectedBlock.type === 'paragraph' || selectedBlock.type === 'text'">
                  <v-textarea v-model="selectedBlock.text" label="Text" auto-grow rows="3" />
                </template>
                <template v-else-if="selectedBlock.type === 'list'">
                  <v-textarea :model-value="listText(selectedBlock)" label="Items (one per line)" auto-grow rows="3" @update:model-value="v => setListText(selectedBlock!, v)" />
                </template>
                <template v-else-if="selectedBlock.type === 'image' || selectedBlock.type === 'video'">
                  <v-text-field v-model="selectedBlock.alt" label="Alt text / caption" />
                  <v-btn variant="tonal" block prepend-icon="upload" class="text-none">Upload media</v-btn>
                </template>
                <template v-else-if="selectedBlock.type === 'spacer'">
                  <v-slider v-model="selectedBlock.height" label="Height" :min="8" :max="96" :step="4" thumb-label />
                </template>
                <template v-else-if="selectedBlock.type === 'html'">
                  <v-textarea v-model="selectedBlock.text" label="HTML" auto-grow rows="5" class="fb-mono" />
                </template>
                <template v-else-if="selectedBlock.type === 'email_submit'">
                  <v-text-field v-model="selectedBlock.text" label="Submit button label" />
                  <div class="text-caption text-medium-emphasis">The email field and submit button are always collected — this managed block can't be removed.</div>
                </template>
                <template v-else>
                  <div class="text-body-2 text-medium-emphasis">No content options for this block.</div>
                </template>

                <MpFormField v-if="['title', 'paragraph', 'text', 'social', 'icons'].includes(selectedBlock.type)" label="Alignment">
                  <div>
                    <v-btn-toggle v-model="selectedBlock.align" mandatory>
                      <v-btn value="left" icon="align-left" size="small" aria-label="Align left" />
                      <v-btn value="center" icon="align-center" size="small" aria-label="Align center" />
                      <v-btn value="right" icon="align-right" size="small" aria-label="Align right" />
                    </v-btn-toggle>
                  </div>
                </MpFormField>

                <div v-if="selectedBlock.type !== 'email_submit'">
                  <v-btn variant="text" color="error" prepend-icon="trash-2" class="text-none" @click="removeContentBlock(selectedBlock.id)">Delete block</v-btn>
                </div>
              </MpFormGrid>
            </template>
            <div v-else class="text-body-2 text-medium-emphasis pt-4">Select a block to edit it, or add one from the left.</div>
          </aside>
        </div>

        <div class="pa-3 border-t bg-surface d-flex justify-space-between">
          <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="step = 1">Back</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" @click="advance(3)">Continue to Display</v-btn>
        </div>
      </div>

      <!-- STEP 5: Review & Publish -->
      <div v-else class="fb__scroll d-flex justify-center pt-8 pa-4">
        <div style="max-width:680px;width:100%;">
          <v-btn-toggle v-model="reviewTab" density="compact" mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
            <v-btn value="details" class="text-none" size="small">Details</v-btn>
            <v-btn value="preview" class="text-none" size="small">Preview</v-btn>
          </v-btn-toggle>

          <template v-if="reviewTab === 'details'">
            <v-alert v-if="!domains.length" type="warning" variant="tonal" density="comfortable" class="mb-3" rounded="lg">
              No domains configured. Add at least one domain in Setup so the form can load on your site.
            </v-alert>
            <v-alert v-if="!selectedListIds.length" type="warning" variant="tonal" density="comfortable" class="mb-3" rounded="lg">
              No subscription lists selected. Subscribers won’t be added to a list until you choose one in Setup.
            </v-alert>

            <v-card variant="flat" border rounded="lg" class="pa-8 mb-4">
              <div class="text-h6 font-weight-bold mb-4">Form Details</div>
              <MpFormGrid>
                <v-text-field v-model="formName" label="Name" />
                <v-list density="compact" class="pa-0">
                  <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">smartphone</v-icon></template><v-list-item-title class="text-body-2"><strong>Type:</strong> {{ formType }}</v-list-item-title></v-list-item>
                  <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">list</v-icon></template><v-list-item-title class="text-body-2"><strong>Lists:</strong> {{ listNames }}</v-list-item-title></v-list-item>
                  <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">layout-panel-top</v-icon></template><v-list-item-title class="text-body-2"><strong>Position:</strong> {{ positionLabel }}</v-list-item-title></v-list-item>
                  <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">calendar-plus</v-icon></template><v-list-item-title class="text-body-2"><strong>Created:</strong> {{ persistedForm?.createdAt ?? 'Not yet saved' }}</v-list-item-title></v-list-item>
                  <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">calendar-clock</v-icon></template><v-list-item-title class="text-body-2"><strong>Modified:</strong> {{ persistedForm?.updated ?? '—' }}</v-list-item-title></v-list-item>
                  <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">rocket</v-icon></template><v-list-item-title class="text-body-2"><strong>Published:</strong> {{ persistedForm?.publishedAt ?? 'Not yet published' }}</v-list-item-title></v-list-item>
                </v-list>
              </MpFormGrid>
            </v-card>

            <v-card variant="flat" border rounded="lg" class="pa-8 mb-4">
              <div class="text-h6 font-weight-bold mb-1">Website Embed</div>
              <div class="text-body-2 text-medium-emphasis mb-3">Paste this snippet before the closing <code>&lt;/body&gt;</code> tag.</div>
              <MpFormGrid>
                <v-textarea :model-value="embedScript" label="Embed script" readonly rows="2" class="fb-mono" />
                <div><v-btn variant="tonal" size="small" class="text-none" prepend-icon="copy" @click="copyText(embedScript)">Copy script</v-btn></div>
              </MpFormGrid>
            </v-card>

            <v-card variant="flat" border rounded="lg" class="pa-8">
              <div class="text-h6 font-weight-bold mb-1">Manual Integration</div>
              <div class="text-body-2 text-medium-emphasis mb-3">For custom placement inside your page markup.</div>
              <MpFormGrid>
                <v-textarea :model-value="manualScript" label="Manual snippet" readonly rows="4" class="fb-mono" />
                <div><v-btn variant="tonal" size="small" class="text-none" prepend-icon="copy" @click="copyText(manualScript)">Copy snippet</v-btn></div>
              </MpFormGrid>
            </v-card>
          </template>

          <template v-else>
            <div class="d-flex justify-center pa-6 fb-preview-stage">
              <div class="fb-device" style="width:420px;">
                <div class="fb-page" :style="positionStyle">
                  <div class="fb-overlay" :style="{ background: `${design.overlayColor}${Math.round(design.overlayOpacity * 2.55).toString(16).padStart(2, '0')}` }" />
                  <div
                    class="fb-form"
                    :style="{
                      width: design.width + 'px',
                      padding: `${design.paddingTop}px ${design.paddingRight}px ${design.paddingBottom}px ${design.paddingLeft}px`,
                      background: design.backgroundType === 'color' ? design.backgroundColor : `center/cover url(${design.backgroundImage})`,
                      borderRadius: design.borderRadius + 'px',
                      border: `${design.borderThickness}px solid ${design.borderColor}`,
                      boxShadow: `${design.shadowOffsetH}px ${design.shadowOffsetV}px ${design.shadowBlur}px ${design.shadowColor}`,
                    }"
                  >
                    <div v-for="b in mainFormBlocks.filter(x => x.type !== 'email_submit')" :key="b.id" class="fb-block" :style="{ textAlign: b.align }">
                      <div v-if="b.type === 'title'" class="fb-block__title">{{ b.text }}</div>
                      <div v-else-if="b.type === 'paragraph' || b.type === 'text'" class="fb-block__paragraph">{{ b.text }}</div>
                      <ul v-else-if="b.type === 'list'" class="fb-block__list"><li v-for="(li, i) in b.items" :key="i">{{ li }}</li></ul>
                      <hr v-else-if="b.type === 'divider'" class="fb-block__divider" />
                    </div>
                    <div class="fb-form__field">Email address</div>
                    <div class="fb-form__btn" :style="{ borderRadius: Math.min(design.borderRadius, 12) + 'px' }">{{ mainFormBlocks.find(b => b.type === 'email_submit')?.text || 'Subscribe' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="d-flex justify-space-between mt-4">
            <v-btn variant="text" class="text-none" prepend-icon="log-out" @click="exitBuilder">Exit</v-btn>
            <div class="d-flex ga-2">
              <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="step = 4">Back</v-btn>
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="rocket" @click="publishForm">Publish</v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <MpConfirmDialog
      v-model="confirmLeave"
      :title="leaveTitle"
      :message="leaveMessage"
      :confirm-label="leaveConfirmLabel"
      danger
      @confirm="discardAndLeave"
    />
  </MpBuilderShell>
</template>

<style scoped>
.fb__scroll { height: 100%; overflow-y: auto; }
.fb__panel { width: 300px; flex-shrink: 0; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.fb-select-all :deep(.v-label) { font-size: 0.75rem; }
.num { font-variant-numeric: tabular-nums; }

.fb-swatch {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  cursor: pointer;
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-surface));
}

/* Device preview (Style & Review) — device chrome uses theme-adaptive
   surfaces so the mock survives dark mode. */
.fb-device {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border: 1px solid var(--mp-border-subtle);
  border-radius: 12px;
  padding: 8px;
  box-shadow: var(--mp-shadow-lg);
  transition: width 0.3s ease;
}
.fb-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.fb-device__url { flex: 1; background: rgb(var(--v-theme-surface)); border-radius: 8px; height: 20px; margin-left: 8px; }
.fb-page {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 8px;
  min-height: 380px;
  position: relative;
  display: flex;
  padding: 24px;
}
.fb-overlay { position: absolute; inset: 0; border-radius: 8px; z-index: 1; }
/* Inside .fb-form the colors are the MERCHANT's popup design (user-picked
   backgroundColor etc.), not app surfaces — the white ink and white-alpha
   accents are preview artifacts and stay hardcoded on purpose. */
.fb-form {
  z-index: 2;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  color: #fff;
}
.fb-block { margin-bottom: 8px; }
.fb-block__title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.fb-block__paragraph { font-size: 12px; opacity: 0.75; }
.fb-block__list { font-size: 12px; opacity: 0.85; padding-left: 18px; }
.fb-block__field, .fb-form__field {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  height: 36px;
  margin-bottom: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-size: 12px;
  opacity: 0.85;
}
.fb-block__divider { border: none; border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 8px 0; }
.fb-form__btn {
  height: 38px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
  cursor: pointer;
}
.fb-preview-stage { background: rgba(var(--v-theme-on-surface), 0.02); border-radius: 12px; }

/* Content step — block editor */
.fb-palette {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  background: rgb(var(--v-theme-surface));
  overflow-y: auto;
}
.fb-palette__item {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  transition: background 100ms ease;
}
.fb-palette__item:hover { background: rgba(var(--v-theme-primary), 0.08); }
.fb-palette__add { opacity: 0; transition: opacity 100ms ease; }
.fb-palette__item:hover .fb-palette__add { opacity: 0.6; }

.fb-canvas { overflow-y: auto; background: rgb(var(--v-theme-background)); }
.fb-doc {
  width: 100%;
  max-width: 600px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  border-radius: 12px;
  padding: 16px;
  min-height: 300px;
}
.fb-doc__empty {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 8px;
}
.fb-doc-block { position: relative; padding: 10px 12px; border: 1.5px solid transparent; border-radius: 8px; transition: border-color 100ms ease; }
.fb-doc-block:hover { border-color: rgba(var(--v-theme-primary), 0.25); }
.fb-doc-block--selected { border-color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.03); }
.fb-doc-block--fixed { background: rgba(var(--v-theme-on-surface), 0.03); }
.fb-doc-block__controls {
  position: absolute; top: -14px; right: 8px; display: none;
  background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 8px; padding: 1px;
}
.fb-doc-block:hover .fb-doc-block__controls, .fb-doc-block--selected .fb-doc-block__controls { display: flex; }
.fb-doc-block__lock { position: absolute; top: 8px; right: 8px; opacity: 0.5; }
.fb-doc__title { font-size: 1.5rem; font-weight: 700; line-height: 1.3; color: rgb(var(--v-theme-on-surface)); }
.fb-doc__paragraph { font-size: 0.95rem; line-height: 1.6; color: rgb(var(--v-theme-on-surface-variant)); }
.fb-doc__list { padding-left: 20px; color: rgb(var(--v-theme-on-surface-variant)); font-size: 0.95rem; line-height: 1.7; }
.fb-doc__image { height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: rgba(var(--v-theme-on-surface), 0.05); border-radius: 8px; color: rgb(var(--v-theme-on-surface-variant)); }
.fb-doc__divider { border: none; border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16); margin: 4px 0; }
.fb-doc__spacer { background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(var(--v-theme-on-surface), 0.05) 6px, rgba(var(--v-theme-on-surface), 0.05) 12px); border-radius: 4px; }
.fb-doc__social { display: flex; gap: 12px; color: rgb(var(--v-theme-on-surface-variant)); }
.fb-doc__html { font-family: monospace; font-size: 0.8rem; background: rgba(var(--v-theme-on-surface), 0.05); padding: 10px; border-radius: 6px; color: rgb(var(--v-theme-on-surface-variant)); white-space: pre-wrap; }
.fb-doc__emailsubmit { display: flex; flex-direction: column; gap: 8px; }
.fb-doc__field { height: 36px; border-radius: 8px; background: rgba(var(--v-theme-on-surface), 0.06); display: flex; align-items: center; padding: 0 12px; font-size: 0.8rem; color: rgb(var(--v-theme-on-surface-variant)); }
.fb-doc__submit { height: 38px; border-radius: 8px; background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 600; }

.fb-settings { width: 300px; flex-shrink: 0; border-left: 1px solid rgba(var(--v-theme-on-surface), 0.10); background: rgb(var(--v-theme-surface)); overflow-y: auto; }
:deep(.fb-mono textarea) { font-family: monospace; font-size: 0.8rem; }

@media (max-width: 1024px) {
  .fb__panel { width: 260px; }
  .fb-settings { width: 260px; }
  .fb-palette { width: 160px; }
}
@media (max-width: 768px) {
  .fb__panel,
  .fb-settings,
  .fb-palette { display: none; }
  .fb__split { flex-direction: column; }
}
</style>
