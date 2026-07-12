<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
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
const stepTitles = ['Setup', 'Settings & Display', 'Design', 'Content', 'Review & Publish']
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

// ─── Step 2: Settings & Display ─────────────────────────────────────────
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

// ─── Step 3: Design ──────────────────────────────────────────────────────
const design = ref<FormDesign>({ ...seed.design })
const optional = ref<FormOptionalFunctions>({ ...seed.optional })
const previewDevice = ref<'desktop' | 'mobile' | 'fullscreen'>('desktop')
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

// ─── Step 4: Content (Main Form / Thank You) ────────────────────────────
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

// ─── Step 5: Review & Publish ────────────────────────────────────────────
const reviewTab = ref<'details' | 'preview'>('details')
const embedId = computed(() => persistedId.value ?? 'draft')
const embedScript = computed(() => `<script src="https://forms.maropost.com/embed/${embedId.value}.js" async><\/script>`)
const manualScript = computed(() => `<div id="mp-form-${embedId.value}"></div>\n<script>\n  window.MaropostForms = window.MaropostForms || [];\n  window.MaropostForms.push({ formId: "${embedId.value}", target: "#mp-form-${embedId.value}" });\n<\/script>`)
const copiedSnack = ref(false)
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedSnack.value = true
  } catch {
    // clipboard unavailable — no-op in this prototype
  }
}
const listNames = computed(() => selectedListIds.value.map(id => SUBSCRIPTION_LISTS.find(l => l.id === id)?.name).filter(Boolean).join(', ') || '—')
const positionLabel = computed(() => POPUP_POSITIONS.find(p => p.value === design.value.position)?.label ?? '—')
const persistedForm = computed(() => (persistedId.value ? formsStore.forms.find(f => f.id === persistedId.value) : null))

// ─── Validation ───────────────────────────────────────────────────────
const step1Valid = computed(() => formName.value.trim().length > 0 && selectedListIds.value.length > 0)
const step3Valid = computed(() => design.value.width > 0)

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

const saveSnack = ref(false)
const confirmLeave = ref(false)
let allowLeave = false
let pendingTo: string | null = null

function saveDraft() { persist(); markClean(); saveSnack.value = true }
function backRoute() { return { name: 'AcquisitionForms', params: { accountId: accountId.value } } }
function goBack() { router.push(backRoute()) }
function exitBuilder() { allowLeave = true; router.push(backRoute()) }
function publishForm() {
  const id = persist()
  formsStore.publish(id)
  markClean()
  allowLeave = true
  router.push(backRoute())
}

onBeforeRouteLeave((to) => {
  if (allowLeave || !dirty.value) return true
  pendingTo = to.fullPath
  confirmLeave.value = true
  return false
})
function discardAndLeave() {
  allowLeave = true
  confirmLeave.value = false
  if (pendingTo) router.push(pendingTo)
}
</script>

<template>
  <div class="fb d-flex flex-column">
    <!-- Top bar -->
    <div class="fb__bar d-flex align-center justify-space-between px-5 border-b bg-surface">
      <div class="d-flex align-center gap-3 min-width-0">
        <v-tooltip text="Back to Forms" location="bottom">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Forms" @click="goBack" />
          </template>
        </v-tooltip>
        <div class="min-width-0">
          <div class="font-weight-bold text-body-1 text-truncate">{{ formName || 'New Acquisition Form' }}</div>
          <div class="text-caption text-medium-emphasis">
            Step {{ step }} of {{ totalSteps }} · {{ stepTitles[step - 1] }}
            <span v-if="dirty" class="fb__dirty">• Unsaved</span>
          </div>
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none text-medium-emphasis" size="small" prepend-icon="save" @click="saveDraft">Save Draft</v-btn>
        <v-btn
          v-if="step < totalSteps"
          color="primary"
          variant="flat"
          size="small"
          class="text-none"
          append-icon="arrow-right"
          :disabled="(step === 1 && !step1Valid) || (step === 3 && !step3Valid)"
          @click="advance(step + 1)"
        >Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" size="small" class="text-none" prepend-icon="check" @click="publishForm">Publish</v-btn>
      </div>
    </div>

    <!-- Step indicator -->
    <div class="fb__steps border-b bg-surface px-5 d-flex align-center">
      <MpWizardSteps :steps="stepTitles" :current="step" clickable :max-step="maxStep" @select="goToStep" />
    </div>

    <!-- Content -->
    <div class="flex-grow-1 overflow-hidden">
      <!-- STEP 1: Setup -->
      <div v-if="step === 1" class="fb__scroll d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:620px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">New Form</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Name your form and choose which lists subscribers will be added to.</div>

          <v-text-field v-model="formName" label="Form Name *" placeholder="e.g. Homepage Exit-Intent Popup" variant="outlined" density="comfortable" class="mb-5" />

          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase">Subscription Lists *</span>
            <v-checkbox v-model="selectAllLists" label="Select All" density="compact" hide-details class="fb-select-all" />
          </div>
          <v-card variant="flat" border rounded="lg" class="mb-5">
            <v-list density="compact" class="py-1">
              <v-list-item v-for="list in SUBSCRIPTION_LISTS" :key="list.id">
                <template #prepend>
                  <v-checkbox
                    :model-value="selectedListIds.includes(list.id)"
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

          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Domain Name</div>
          <div class="d-flex ga-2 mb-2">
            <v-text-field v-model="newDomain" placeholder="e.g. mystore.com" variant="outlined" density="compact" hide-details @keydown.enter="addDomain" />
            <v-btn variant="tonal" color="primary" class="text-none" prepend-icon="plus" @click="addDomain">Add Domain</v-btn>
          </div>
          <div v-if="domains.length" class="d-flex flex-wrap ga-2 mb-2">
            <v-chip v-for="d in domains" :key="d" closable size="small" variant="tonal" @click:close="removeDomain(d)">{{ d }}</v-chip>
          </div>

          <div class="d-flex justify-end mt-6">
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!step1Valid" @click="advance(2)">Continue to Settings</v-btn>
          </div>
        </v-card>
      </div>

      <!-- STEP 2: Settings & Display -->
      <div v-else-if="step === 2" class="fb__scroll d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:620px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">Settings &amp; Display</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Choose the form type and control when and where it appears.</div>

          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Form Type</div>
          <v-row dense class="mb-4">
            <v-col cols="6">
              <MpOptionCard :selected="formType === 'Popup'" title="Popup" description="Triggered overlay on top of page content" icon="smartphone" @click="formType = 'Popup'" />
            </v-col>
            <v-col cols="6">
              <MpOptionCard :selected="formType === 'Embedded'" title="Embedded" description="Inline form inside your page layout" icon="globe" @click="formType = 'Embedded'" />
            </v-col>
          </v-row>

          <v-switch v-model="display.dontShowAgainAfterSubmit" label="Don't show form again after submission" color="primary" density="compact" hide-details class="mb-4" />

          <v-divider class="my-4" />
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Display On</div>
          <v-radio-group v-model="display.displayOn" class="mb-2">
            <v-radio value="entry" label="Entry (page load)" />
            <v-radio value="exit" label="Exit intent" />
            <v-radio value="scroll" label="Percentage scrolled" />
          </v-radio-group>
          <div v-if="display.displayOn === 'scroll'" class="mb-4">
            <v-slider v-model="display.scrollPercent" :min="10" :max="100" :step="10" color="primary" thumb-label="always" label="Scroll depth %" />
          </div>

          <v-divider class="my-4" />
          <v-checkbox v-model="display.urlTargetingEnabled" label="Only show on these URLs" color="primary" density="compact" hide-details class="mb-2" />
          <template v-if="display.urlTargetingEnabled">
            <div class="d-flex ga-2 mb-2">
              <v-text-field v-model="newUrlTarget" placeholder="/collections/sale" variant="outlined" density="compact" hide-details @keydown.enter="addUrlTarget" />
              <v-btn variant="tonal" color="primary" class="text-none" prepend-icon="plus" @click="addUrlTarget">Add URL</v-btn>
            </div>
            <div v-if="display.urlTargets.length" class="d-flex flex-wrap ga-2 mb-2">
              <v-chip v-for="u in display.urlTargets" :key="u" closable size="small" variant="tonal" @click:close="removeUrlTarget(u)">{{ u }}</v-chip>
            </div>
          </template>

          <v-divider class="my-4" />
          <v-checkbox v-model="display.hideForDaysEnabled" label="Don't show pop-up for N days after closing" color="primary" density="compact" hide-details class="mb-2" />
          <v-text-field
            v-if="display.hideForDaysEnabled"
            v-model.number="display.hideForDays"
            type="number"
            label="Days"
            variant="outlined"
            density="compact"
            style="max-width:160px;"
            class="mb-2"
          />

          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="step = 1">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" @click="advance(3)">Continue to Design</v-btn>
          </div>
        </v-card>
      </div>

      <!-- STEP 3: Design -->
      <div v-else-if="step === 3" class="d-flex h-100 overflow-hidden">
        <div class="fb__panel border-r bg-surface d-flex flex-column overflow-hidden">
          <div class="pa-3 flex-grow-1 overflow-y-auto">
            <v-expansion-panels variant="accordion" multiple>
              <v-expansion-panel title="Position">
                <v-expansion-panel-text>
                  <v-radio-group v-model="design.position" density="compact" hide-details>
                    <v-radio v-for="p in POPUP_POSITIONS" :key="p.value" :value="p.value" :label="p.label" />
                  </v-radio-group>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel title="Dimensions">
                <v-expansion-panel-text>
                  <v-text-field v-model.number="design.width" type="number" label="Width (px) *" variant="outlined" density="compact" class="mb-2" />
                  <v-text-field v-model.number="design.height" type="number" label="Height (px)" variant="outlined" density="compact" :disabled="design.fitHeight" class="mb-2" />
                  <v-checkbox v-model="design.fitHeight" label="Fit to content height" density="compact" hide-details />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel title="Padding">
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col cols="6"><v-text-field v-model.number="design.paddingTop" type="number" label="Top *" variant="outlined" density="compact" /></v-col>
                    <v-col cols="6"><v-text-field v-model.number="design.paddingBottom" type="number" label="Bottom *" variant="outlined" density="compact" /></v-col>
                    <v-col cols="6"><v-text-field v-model.number="design.paddingLeft" type="number" label="Left *" variant="outlined" density="compact" /></v-col>
                    <v-col cols="6"><v-text-field v-model.number="design.paddingRight" type="number" label="Right *" variant="outlined" density="compact" /></v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel title="Border">
                <v-expansion-panel-text>
                  <div class="d-flex align-center ga-2 mb-3">
                    <v-menu :close-on-content-click="false" location="start">
                      <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.borderColor }" aria-label="Border color" /></template>
                      <v-color-picker v-model="design.borderColor" mode="hexa" :modes="['hexa']" />
                    </v-menu>
                    <span class="text-caption text-medium-emphasis">Color</span>
                  </div>
                  <v-text-field v-model.number="design.borderThickness" type="number" label="Thickness (px) *" variant="outlined" density="compact" class="mb-2" />
                  <v-text-field v-model.number="design.borderRadius" type="number" label="Radius (px) *" variant="outlined" density="compact" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel title="Drop Shadow">
                <v-expansion-panel-text>
                  <div class="d-flex align-center ga-2 mb-3">
                    <v-menu :close-on-content-click="false" location="start">
                      <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.shadowColor }" aria-label="Shadow color" /></template>
                      <v-color-picker v-model="design.shadowColor" mode="hexa" :modes="['hexa']" />
                    </v-menu>
                    <span class="text-caption text-medium-emphasis">Color</span>
                  </div>
                  <v-text-field v-model.number="design.shadowBlur" type="number" label="Blur (px)" variant="outlined" density="compact" class="mb-2" />
                  <v-row dense>
                    <v-col cols="6"><v-text-field v-model.number="design.shadowOffsetH" type="number" label="H offset" variant="outlined" density="compact" /></v-col>
                    <v-col cols="6"><v-text-field v-model.number="design.shadowOffsetV" type="number" label="V offset" variant="outlined" density="compact" /></v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel title="Overlay">
                <v-expansion-panel-text>
                  <div class="d-flex align-center ga-2 mb-3">
                    <v-menu :close-on-content-click="false" location="start">
                      <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.overlayColor }" aria-label="Overlay color" /></template>
                      <v-color-picker v-model="design.overlayColor" mode="hex" :modes="['hex']" />
                    </v-menu>
                    <span class="text-caption text-medium-emphasis">Color</span>
                  </div>
                  <div class="text-caption mb-1">Opacity: {{ design.overlayOpacity }}%</div>
                  <v-slider v-model="design.overlayOpacity" :min="0" :max="90" :step="5" color="primary" hide-details />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel title="Background">
                <v-expansion-panel-text>
                  <v-radio-group v-model="design.backgroundType" inline class="mb-2">
                    <v-radio value="color" label="Colour" />
                    <v-radio value="image" label="Image" />
                  </v-radio-group>
                  <div v-if="design.backgroundType === 'color'" class="d-flex align-center ga-2">
                    <v-menu :close-on-content-click="false" location="start">
                      <template #activator="{ props }"><button v-bind="props" class="fb-swatch" :style="{ background: design.backgroundColor }" aria-label="Background color" /></template>
                      <v-color-picker v-model="design.backgroundColor" mode="hex" :modes="['hex']" />
                    </v-menu>
                    <span class="text-caption text-medium-emphasis">{{ design.backgroundColor }}</span>
                  </div>
                  <template v-else>
                    <v-text-field v-model="design.backgroundImage" label="Image URL" placeholder="https://" variant="outlined" density="compact" class="mb-2" />
                    <v-btn variant="tonal" block prepend-icon="upload" class="text-none">Upload image</v-btn>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mt-4 mb-2 px-1">Optional Functions</div>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel title="Optional functions">
                <v-expansion-panel-text>
                  <v-checkbox v-model="optional.redirectEnabled" label="Redirect after submission" density="compact" hide-details class="mb-1" />
                  <v-text-field v-if="optional.redirectEnabled" v-model="optional.redirectUrl" label="Redirect URL" placeholder="https://mystore.com/thank-you" variant="outlined" density="compact" class="mb-3" />

                  <v-checkbox v-model="optional.notifyEmailEnabled" label="Notify email on subscriber" density="compact" hide-details class="mb-1" />
                  <v-text-field v-if="optional.notifyEmailEnabled" v-model="optional.notifyEmail" label="Notify email address" placeholder="team@mystore.com" variant="outlined" density="compact" class="mb-3" />

                  <v-switch v-model="optional.recaptchaEnabled" label="ReCaptcha" color="primary" density="compact" hide-details class="mb-1" />
                  <v-switch v-model="optional.doubleOptInEnabled" label="Double opt-in" color="primary" density="compact" hide-details />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <div class="pa-3 border-t d-flex gap-2">
            <v-btn variant="text" class="text-none flex-grow-1" size="small" prepend-icon="arrow-left" @click="step = 2">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none flex-grow-1" size="small" append-icon="arrow-right" :disabled="!step3Valid" @click="advance(4)">Next</v-btn>
          </div>
        </div>

        <!-- Live device preview -->
        <div class="flex-grow-1 bg-background d-flex flex-column align-center overflow-auto pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-btn-toggle v-model="previewDevice" density="compact" variant="outlined" divided mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented">
              <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
              <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
              <v-btn value="fullscreen" class="text-none" size="small" prepend-icon="maximize">Fullscreen</v-btn>
            </v-btn-toggle>
          </div>

          <div class="fb-device" :style="{ width: previewDevice === 'mobile' ? '375px' : previewDevice === 'fullscreen' ? '960px' : '780px' }">
            <div class="fb-device__chrome d-flex align-center gap-1 mb-2 px-2">
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

      <!-- STEP 4: Content -->
      <div v-else-if="step === 4" class="d-flex h-100 overflow-hidden">
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
          <v-btn-toggle v-model="contentTab" density="compact" variant="outlined" divided mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
            <v-btn value="main" class="text-none" size="small">Main Form</v-btn>
            <v-btn value="thankyou" class="text-none" size="small">Thank You</v-btn>
          </v-btn-toggle>

          <div class="fb-doc">
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
              <v-icon v-else size="14" class="fb-doc-block__lock">lock</v-icon>

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
            <div class="text-subtitle-2 font-weight-bold mb-4 text-capitalize">{{ selectedBlock.type.replace('_', ' ') }} settings</div>

            <template v-if="selectedBlock.type === 'title' || selectedBlock.type === 'paragraph' || selectedBlock.type === 'text'">
              <v-textarea v-model="selectedBlock.text" label="Text" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="3" class="mb-4" hide-details />
            </template>
            <template v-else-if="selectedBlock.type === 'list'">
              <v-textarea :model-value="listText(selectedBlock)" label="Items (one per line)" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="3" class="mb-4" hide-details @update:model-value="v => setListText(selectedBlock!, v)" />
            </template>
            <template v-else-if="selectedBlock.type === 'image' || selectedBlock.type === 'video'">
              <v-text-field v-model="selectedBlock.alt" label="Alt text / caption" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
              <v-btn variant="tonal" block prepend-icon="upload" class="text-none mb-4">Upload media</v-btn>
            </template>
            <template v-else-if="selectedBlock.type === 'spacer'">
              <v-slider v-model="selectedBlock.height" label="Height" :min="8" :max="96" :step="4" thumb-label class="mb-4" hide-details />
            </template>
            <template v-else-if="selectedBlock.type === 'html'">
              <v-textarea v-model="selectedBlock.text" label="HTML" variant="outlined" density="comfortable" rounded="lg" auto-grow rows="5" class="mb-4 fb-mono" hide-details />
            </template>
            <template v-else-if="selectedBlock.type === 'email_submit'">
              <v-text-field v-model="selectedBlock.text" label="Submit button label" variant="outlined" density="comfortable" rounded="lg" class="mb-4" hide-details />
              <div class="text-caption text-medium-emphasis mb-4">The email field and submit button are always collected — this managed block can't be removed.</div>
            </template>
            <template v-else>
              <div class="text-body-2 text-medium-emphasis mb-4">No content options for this block.</div>
            </template>

            <template v-if="['title', 'paragraph', 'text', 'social', 'icons'].includes(selectedBlock.type)">
              <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Alignment</div>
              <v-btn-toggle v-model="selectedBlock.align" mandatory density="comfortable" variant="outlined" divided class="mb-4">
                <v-btn value="left" icon="align-left" size="small" />
                <v-btn value="center" icon="align-center" size="small" />
                <v-btn value="right" icon="align-right" size="small" />
              </v-btn-toggle>
            </template>

            <v-btn v-if="selectedBlock.type !== 'email_submit'" variant="text" color="error" prepend-icon="trash-2" class="text-none" @click="removeContentBlock(selectedBlock.id)">Delete block</v-btn>
          </template>
          <div v-else class="text-body-2 text-medium-emphasis pt-4">Select a block to edit it, or add one from the left.</div>
        </aside>
      </div>

      <!-- STEP 5: Review & Publish -->
      <div v-else class="fb__scroll d-flex justify-center pt-8 pa-4">
        <div style="max-width:680px;width:100%;">
          <v-btn-toggle v-model="reviewTab" density="compact" variant="outlined" divided mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented mb-4">
            <v-btn value="details" class="text-none" size="small">Details</v-btn>
            <v-btn value="preview" class="text-none" size="small">Preview</v-btn>
          </v-btn-toggle>

          <template v-if="reviewTab === 'details'">
            <v-card variant="flat" border rounded="lg" class="pa-8 mb-4">
              <div class="text-h6 font-weight-bold mb-4">Form Details</div>
              <v-text-field v-model="formName" label="Name" variant="outlined" density="compact" class="mb-4" />
              <v-list density="compact" class="pa-0">
                <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">smartphone</v-icon></template><v-list-item-title class="text-body-2"><strong>Type:</strong> {{ formType }}</v-list-item-title></v-list-item>
                <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">list</v-icon></template><v-list-item-title class="text-body-2"><strong>Lists:</strong> {{ listNames }}</v-list-item-title></v-list-item>
                <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">layout-panel-top</v-icon></template><v-list-item-title class="text-body-2"><strong>Position:</strong> {{ positionLabel }}</v-list-item-title></v-list-item>
                <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">calendar-plus</v-icon></template><v-list-item-title class="text-body-2"><strong>Created:</strong> {{ persistedForm?.createdAt ?? 'Not yet saved' }}</v-list-item-title></v-list-item>
                <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">calendar-clock</v-icon></template><v-list-item-title class="text-body-2"><strong>Modified:</strong> {{ persistedForm?.updated ?? '—' }}</v-list-item-title></v-list-item>
                <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">rocket</v-icon></template><v-list-item-title class="text-body-2"><strong>Published:</strong> {{ persistedForm?.publishedAt ?? 'Not yet published' }}</v-list-item-title></v-list-item>
              </v-list>
            </v-card>

            <v-card variant="flat" border rounded="lg" class="pa-8 mb-4">
              <div class="text-h6 font-weight-bold mb-1">Website Embed</div>
              <div class="text-body-2 text-medium-emphasis mb-3">Paste this snippet before the closing <code>&lt;/body&gt;</code> tag.</div>
              <v-textarea :model-value="embedScript" readonly variant="outlined" density="compact" rows="2" class="fb-mono mb-2" hide-details />
              <v-btn variant="tonal" size="small" class="text-none" prepend-icon="copy" @click="copyText(embedScript)">Copy script</v-btn>
            </v-card>

            <v-card variant="flat" border rounded="lg" class="pa-8">
              <div class="text-h6 font-weight-bold mb-1">Manual Integration</div>
              <div class="text-body-2 text-medium-emphasis mb-3">For custom placement inside your page markup.</div>
              <v-textarea :model-value="manualScript" readonly variant="outlined" density="compact" rows="4" class="fb-mono mb-2" hide-details />
              <v-btn variant="tonal" size="small" class="text-none" prepend-icon="copy" @click="copyText(manualScript)">Copy snippet</v-btn>
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

    <v-snackbar v-model="saveSnack" :timeout="2200" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Saved</div>
    </v-snackbar>
    <v-snackbar v-model="copiedSnack" :timeout="1800" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Copied to clipboard</div>
    </v-snackbar>

    <MpConfirmDialog
      v-model="confirmLeave"
      title="Leave the form builder?"
      message="You have unsaved changes. Leaving now will discard them."
      confirm-label="Discard changes"
      danger
      @confirm="discardAndLeave"
    />
  </div>
</template>

<style scoped>
.fb { height: 100vh; overflow: hidden; }
.fb__bar { height: 56px; flex-shrink: 0; }
.fb__steps { height: 52px; flex-shrink: 0; }
.fb__scroll { height: 100%; overflow-y: auto; }
.fb__panel { width: 300px; flex-shrink: 0; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.fb__dirty { color: rgb(var(--v-theme-warning)); font-weight: 600; margin-left: 4px; }
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

/* Device preview (steps 3 & 5) */
.fb-device {
  background: #e5e5e5;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
  transition: width 0.3s ease;
}
.fb-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.fb-device__url { flex: 1; background: #fff; border-radius: 8px; height: 20px; margin-left: 8px; }
.fb-page {
  background: #f0f0f0;
  border-radius: 8px;
  min-height: 380px;
  position: relative;
  display: flex;
  padding: 24px;
}
.fb-overlay { position: absolute; inset: 0; border-radius: 8px; z-index: 1; }
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
  color: #fff;
  background: rgb(var(--v-theme-primary));
  cursor: pointer;
}
.fb-preview-stage { background: rgba(var(--v-theme-on-surface), 0.02); border-radius: 12px; }

/* Content step (step 4) — block editor */
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
</style>
