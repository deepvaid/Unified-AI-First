<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

// ─── Wizard state ─────────────────────────────────────────────────────
const stepTitles = ['Setup', 'Display Rules', 'Design', 'Success']
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

// Step 1: Setup
const formName = ref('')
const selectedList = ref('')
const formType = ref<'popup' | 'embedded'>('popup')
const lists = ['Newsletter Subscribers', 'VIP Customer Circle', 'Master Subscriber List', 'Promotional List']

// Step 2: Display Rules
const displayTrigger = ref('time')
const timeOnPage = ref(5)
const scrollPercent = ref(50)
const pageTarget = ref<'all' | 'specific'>('all')
const specificUrl = ref('')
const deviceTarget = ref<'all' | 'desktop' | 'mobile'>('all')
const frequency = ref('once_per_session')

// Step 3: Design — colors + content
const previewDevice = ref<'desktop' | 'mobile'>('desktop')
const selectedTab = ref<'content' | 'styles'>('content')
const bgColor = ref('#1A1A2E')
const textColor = ref('#FFFFFF')
const accentColor = ref('#6366F1')
const borderRadius = ref(16)
const showOverlay = ref(true)
const overlayOpacity = ref(60)
const formTitle = ref('Join our VIP list')
const formSubtitle = ref('Get exclusive deals, early access & more.')
const buttonLabel = ref('Subscribe Now')

// Step 3: Design — field palette
type FieldType = 'email' | 'first_name' | 'last_name' | 'phone' | 'custom'
interface BuilderField { key: string; type: FieldType; label: string; required: boolean; locked?: boolean }
let fieldSeq = 0
const fields = ref<BuilderField[]>([
  { key: 'f-email', type: 'email', label: 'Email Address', required: true, locked: true },
  { key: 'f-first', type: 'first_name', label: 'First Name', required: false },
])
const FIELD_LIBRARY: { type: FieldType; label: string; icon: string; unique: boolean }[] = [
  { type: 'first_name', label: 'First Name', icon: 'user', unique: true },
  { type: 'last_name', label: 'Last Name', icon: 'user', unique: true },
  { type: 'phone', label: 'Phone Number', icon: 'phone', unique: true },
  { type: 'custom', label: 'Custom Field', icon: 'text-cursor-input', unique: false },
]
const availableFields = computed(() =>
  FIELD_LIBRARY.filter(l => !l.unique || !fields.value.some(f => f.type === l.type)),
)
function fieldIcon(type: FieldType) {
  return type === 'email' ? 'mail' : (FIELD_LIBRARY.find(l => l.type === type)?.icon ?? 'text-cursor-input')
}
function addField(type: FieldType, label: string) {
  fields.value.push({ key: `f-${++fieldSeq}`, type, label, required: false })
}
function removeField(key: string) {
  fields.value = fields.value.filter(f => f.key !== key || f.locked)
}
function moveField(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 1 || j >= fields.value.length) return // keep the locked email pinned at index 0
  const arr = fields.value
  ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
}

// Step 4: Success
const successType = ref<'message' | 'redirect'>('message')
const successTitle = ref("You're in! 🎉")
const successMessage = ref('Thanks for subscribing. Watch your inbox for exclusive offers.')
const redirectUrl = ref('')

// ─── Validation ───────────────────────────────────────────────────────
const step1Valid = computed(() => formName.value.trim().length > 0 && selectedList.value.length > 0)

// ─── Dirty tracking + unsaved-changes guard ───────────────────────────
const snapshot = computed(() =>
  JSON.stringify([
    formName.value, selectedList.value, formType.value, displayTrigger.value, timeOnPage.value,
    scrollPercent.value, pageTarget.value, specificUrl.value, deviceTarget.value, frequency.value,
    bgColor.value, textColor.value, accentColor.value, borderRadius.value, showOverlay.value,
    overlayOpacity.value, formTitle.value, formSubtitle.value, buttonLabel.value, fields.value,
    successType.value, successTitle.value, successMessage.value, redirectUrl.value,
  ]),
)
let baseline = ''
onMounted(() => { baseline = snapshot.value })
const dirty = computed(() => snapshot.value !== baseline)
function markClean() { baseline = snapshot.value }

const saveSnack = ref(false)
const confirmLeave = ref(false)
let allowLeave = false
let pendingTo: string | null = null

function saveDraft() { markClean(); saveSnack.value = true }
function finish() { markClean(); saveSnack.value = true; allowLeave = true; setTimeout(() => router.push(backRoute()), 900) }
function backRoute() { return { name: 'AcquisitionForms', params: { accountId: accountId.value } } }
function goBack() { router.push(backRoute()) }

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
          :disabled="step === 1 && !step1Valid"
          @click="advance(step + 1)"
        >Continue</v-btn>
        <v-btn v-else color="primary" variant="flat" size="small" class="text-none" prepend-icon="check" @click="finish">Publish Form</v-btn>
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
        <v-card variant="flat" border rounded="lg" style="max-width:600px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">Form Setup</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Name your form and choose which list subscribers will be added to.</div>
          <v-text-field v-model="formName" label="Form Name *" placeholder="e.g. Homepage Exit-Intent Popup" variant="outlined" density="comfortable" class="mb-4" />
          <v-select v-model="selectedList" label="Subscribe to List *" :items="lists" variant="outlined" density="comfortable" class="mb-6" />
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Form Type</div>
          <v-row dense>
            <v-col cols="6">
              <v-card variant="flat" border rounded="lg" class="pa-4 text-center cursor-pointer fb-type" :class="{ 'fb-type--on': formType === 'popup' }" @click="formType = 'popup'">
                <v-icon size="32" :color="formType === 'popup' ? 'primary' : undefined" class="mb-2">smartphone</v-icon>
                <div class="text-body-2 font-weight-bold">Popup</div>
                <div class="text-caption text-medium-emphasis">Triggered overlay on top of page content</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="flat" border rounded="lg" class="pa-4 text-center cursor-pointer fb-type" :class="{ 'fb-type--on': formType === 'embedded' }" @click="formType = 'embedded'">
                <v-icon size="32" :color="formType === 'embedded' ? 'primary' : undefined" class="mb-2">globe</v-icon>
                <div class="text-body-2 font-weight-bold">Embedded</div>
                <div class="text-caption text-medium-emphasis">Inline form inside your page layout</div>
              </v-card>
            </v-col>
          </v-row>
          <div class="d-flex justify-end mt-6">
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!step1Valid" @click="advance(2)">Continue to Display Rules</v-btn>
          </div>
        </v-card>
      </div>

      <!-- STEP 2: Display Rules -->
      <div v-else-if="step === 2" class="fb__scroll d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:600px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">Display Rules</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Control when and where your form appears.</div>
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Show Form When</div>
          <v-radio-group v-model="displayTrigger" class="mb-4">
            <v-radio value="time" label="After time on page" />
            <v-radio value="exit" label="Exit intent (cursor leaves page)" />
            <v-radio value="scroll" label="After scroll percentage" />
            <v-radio value="immediate" label="Immediately on page load" />
          </v-radio-group>
          <div v-if="displayTrigger === 'time'" class="mb-4">
            <v-slider v-model="timeOnPage" :min="1" :max="60" :step="1" color="primary" thumb-label="always" label="Seconds on page" />
          </div>
          <div v-if="displayTrigger === 'scroll'" class="mb-4">
            <v-slider v-model="scrollPercent" :min="10" :max="100" :step="10" color="primary" thumb-label="always" label="Scroll depth %" />
          </div>
          <v-divider class="my-4" />
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Target Pages</div>
          <v-radio-group v-model="pageTarget" inline class="mb-3">
            <v-radio value="all" label="All pages" />
            <v-radio value="specific" label="Specific URL" />
          </v-radio-group>
          <v-text-field v-if="pageTarget === 'specific'" v-model="specificUrl" label="URL Pattern (supports *)" variant="outlined" density="compact" class="mb-4" />
          <v-divider class="my-4" />
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Devices</div>
          <v-btn-toggle v-model="deviceTarget" density="compact" variant="outlined" divided rounded="lg" mandatory class="mp-toggle-group mp-toggle-group--segmented mb-4">
            <v-btn value="all" class="text-none" size="small">All</v-btn>
            <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
            <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
          </v-btn-toggle>
          <v-divider class="my-4" />
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Show Frequency</div>
          <v-select
            v-model="frequency"
            :items="[
              { title: 'Once per session', value: 'once_per_session' },
              { title: 'Once per visitor (ever)', value: 'once_ever' },
              { title: 'Every visit', value: 'every_visit' },
              { title: 'Every 7 days', value: 'every_7d' },
            ]"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
          />
          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="step = 1">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" @click="advance(3)">Continue to Design</v-btn>
          </div>
        </v-card>
      </div>

      <!-- STEP 3: Design -->
      <div v-else-if="step === 3" class="d-flex h-100 overflow-hidden">
        <!-- Left panel -->
        <div class="fb__panel border-r bg-surface d-flex flex-column overflow-hidden">
          <div class="pa-3 border-b">
            <v-btn-toggle v-model="selectedTab" density="compact" variant="outlined" divided mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented" style="width:100%;">
              <v-btn value="content" class="text-none" size="small" style="flex:1;">Content</v-btn>
              <v-btn value="styles" class="text-none" size="small" style="flex:1;">Styles</v-btn>
            </v-btn-toggle>
          </div>

          <div class="pa-3 flex-grow-1 overflow-y-auto">
            <!-- Content tab -->
            <template v-if="selectedTab === 'content'">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Copy</div>
              <v-text-field v-model="formTitle" label="Headline" variant="outlined" density="compact" class="mb-2" />
              <v-textarea v-model="formSubtitle" label="Subheadline" variant="outlined" density="compact" rows="2" auto-grow class="mb-3" />
              <v-text-field v-model="buttonLabel" label="Button label" variant="outlined" density="compact" prepend-inner-icon="square-mouse-pointer" class="mb-3" />

              <v-divider class="mb-3" />
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase">Fields</span>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="x-small" variant="tonal" color="primary" prepend-icon="plus" class="text-none" :disabled="!availableFields.length">Add field</v-btn>
                  </template>
                  <v-list density="compact" rounded="xl" nav min-width="180" elevation="8">
                    <v-list-item v-for="lib in availableFields" :key="lib.label" :prepend-icon="lib.icon" @click="addField(lib.type, lib.label)">{{ lib.label }}</v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <div v-for="(f, i) in fields" :key="f.key" class="fb-field mb-2">
                <div class="d-flex align-center ga-2">
                  <v-icon size="16" class="text-medium-emphasis">{{ fieldIcon(f.type) }}</v-icon>
                  <span class="flex-grow-1 text-body-2 font-weight-medium text-truncate">{{ f.label }}</span>
                  <template v-if="f.locked">
                    <v-icon size="14" class="text-medium-emphasis" title="Required — always collected">lock</v-icon>
                  </template>
                  <template v-else>
                    <v-btn icon="chevron-up" variant="text" size="x-small" :disabled="i <= 1" aria-label="Move up" @click="moveField(i, -1)" />
                    <v-btn icon="chevron-down" variant="text" size="x-small" :disabled="i >= fields.length - 1" aria-label="Move down" @click="moveField(i, 1)" />
                    <v-btn icon="x" variant="text" size="x-small" aria-label="Remove field" @click="removeField(f.key)" />
                  </template>
                </div>
                <v-switch v-if="!f.locked" v-model="f.required" label="Required" color="primary" density="compact" hide-details class="fb-field__req" />
              </div>
            </template>

            <!-- Styles tab -->
            <template v-else>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Colors</div>
              <div v-for="c in [
                { label: 'Background', model: 'bg' },
                { label: 'Text', model: 'text' },
                { label: 'Accent / Button', model: 'accent' },
              ]" :key="c.model" class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption">{{ c.label }}</span>
                <v-menu :close-on-content-click="false" location="start">
                  <template #activator="{ props }">
                    <button
                      v-bind="props"
                      class="fb-swatch"
                      :style="{ background: c.model === 'bg' ? bgColor : c.model === 'text' ? textColor : accentColor }"
                      :aria-label="`Pick ${c.label} color`"
                    />
                  </template>
                  <v-color-picker
                    v-if="c.model === 'bg'"
                    v-model="bgColor"
                    mode="hex"
                    :modes="['hex']"
                  />
                  <v-color-picker
                    v-else-if="c.model === 'text'"
                    v-model="textColor"
                    mode="hex"
                    :modes="['hex']"
                  />
                  <v-color-picker
                    v-else
                    v-model="accentColor"
                    mode="hex"
                    :modes="['hex']"
                  />
                </v-menu>
              </div>

              <v-divider class="my-3" />
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Shape</div>
              <div class="text-caption mb-1">Corner radius: {{ borderRadius }}px</div>
              <v-slider v-model="borderRadius" :min="0" :max="32" :step="2" color="primary" hide-details class="mb-3" />

              <v-divider class="my-3" />
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Overlay</div>
              <v-switch v-model="showOverlay" label="Dark overlay" color="primary" density="compact" hide-details class="mb-1" />
              <div v-if="showOverlay">
                <div class="text-caption mb-1">Opacity: {{ overlayOpacity }}%</div>
                <v-slider v-model="overlayOpacity" :min="10" :max="90" :step="5" color="primary" hide-details />
              </div>
            </template>
          </div>

          <div class="pa-3 border-t d-flex gap-2">
            <v-btn variant="text" class="text-none flex-grow-1" size="small" prepend-icon="arrow-left" @click="step = 2">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none flex-grow-1" size="small" append-icon="arrow-right" @click="advance(4)">Next</v-btn>
          </div>
        </div>

        <!-- Preview -->
        <div class="flex-grow-1 bg-background d-flex flex-column align-center overflow-auto pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-btn-toggle v-model="previewDevice" density="compact" variant="outlined" divided mandatory rounded="lg" class="mp-toggle-group mp-toggle-group--segmented">
              <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
              <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
            </v-btn-toggle>
          </div>

          <div class="fb-device" :style="{ width: previewDevice === 'desktop' ? '780px' : '375px' }">
            <div class="fb-device__chrome d-flex align-center gap-1 mb-2 px-2">
              <span class="fb-dot" style="background:#ff5f56;" />
              <span class="fb-dot" style="background:#ffbd2e;" />
              <span class="fb-dot" style="background:#27c93f;" />
              <div class="fb-device__url" />
            </div>
            <div class="fb-page">
              <div v-if="showOverlay && formType === 'popup'" class="fb-overlay" :style="{ background: `rgba(0,0,0,${overlayOpacity / 100})` }" />
              <div
                class="fb-form"
                :style="{
                  background: bgColor,
                  color: textColor,
                  borderRadius: borderRadius + 'px',
                  position: formType === 'popup' ? 'relative' : 'static',
                }"
              >
                <div class="fb-form__title" :style="{ color: textColor }">{{ formTitle }}</div>
                <div class="fb-form__sub" :style="{ color: textColor }">{{ formSubtitle }}</div>
                <div
                  v-for="f in fields"
                  :key="f.key"
                  class="fb-form__field"
                  :style="{ color: textColor }"
                >{{ f.label }}{{ f.required ? ' *' : '' }}</div>
                <div class="fb-form__btn" :style="{ background: accentColor, borderRadius: Math.min(borderRadius, 12) + 'px' }">{{ buttonLabel }}</div>
                <div class="fb-form__legal" :style="{ color: textColor }">We respect your privacy. Unsubscribe anytime.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 4: Success & Publish -->
      <div v-else class="fb__scroll d-flex justify-center pt-8 pa-4">
        <div style="max-width:600px;width:100%;">
          <v-card variant="flat" border rounded="lg" class="pa-8 mb-4">
            <div class="text-h5 font-weight-bold mb-1">Success Message</div>
            <div class="text-body-2 text-medium-emphasis mb-6">What happens after a visitor submits the form?</div>
            <v-radio-group v-model="successType">
              <v-radio value="message" label="Show a success message" />
              <v-radio value="redirect" label="Redirect to a URL" />
            </v-radio-group>
            <template v-if="successType === 'message'">
              <v-text-field v-model="successTitle" label="Success Heading" variant="outlined" density="compact" class="mb-3" />
              <v-textarea v-model="successMessage" label="Success Body" variant="outlined" density="compact" rows="3" />
            </template>
            <v-text-field v-else v-model="redirectUrl" label="Redirect URL" placeholder="https://mysite.com/thank-you" variant="outlined" density="compact" />
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-8">
            <div class="text-h6 font-weight-bold mb-4">Form Summary</div>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">list-checks</v-icon></template><v-list-item-title class="text-body-2"><strong>Name:</strong> {{ formName || '—' }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">list</v-icon></template><v-list-item-title class="text-body-2"><strong>List:</strong> {{ selectedList || '—' }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">smartphone</v-icon></template><v-list-item-title class="text-body-2"><strong>Type:</strong> {{ formType === 'popup' ? 'Popup Overlay' : 'Embedded Form' }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">text-cursor-input</v-icon></template><v-list-item-title class="text-body-2"><strong>Fields:</strong> {{ fields.map(f => f.label).join(', ') }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template #prepend><v-icon size="18" color="primary">eye</v-icon></template><v-list-item-title class="text-body-2"><strong>Trigger:</strong> {{ { time: 'Time on page', exit: 'Exit intent', scroll: 'Scroll depth', immediate: 'Immediate' }[displayTrigger] }}</v-list-item-title></v-list-item>
            </v-list>
            <v-divider class="my-4" />
            <div class="d-flex gap-3 justify-end">
              <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="step = 3">Back to Design</v-btn>
              <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="finish">Publish Form</v-btn>
            </div>
          </v-card>
        </div>
      </div>
    </div>

    <v-snackbar v-model="saveSnack" :timeout="2200" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Saved</div>
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
.fb__panel { width: 280px; flex-shrink: 0; }

.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }

.fb__dirty { color: rgb(var(--v-theme-warning)); font-weight: 600; margin-left: 4px; }

.fb-type { transition: border-color 120ms ease, background 120ms ease; }
.fb-type--on {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.06);
}

.fb-field {
  border: 1px solid var(--mp-border-subtle);
  border-radius: 8px;
  padding: 8px 8px 8px 10px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.fb-field__req :deep(.v-label) { font-size: 0.75rem; }
.fb-field__req { margin-top: 2px; }

.fb-swatch {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  cursor: pointer;
  box-shadow: inset 0 0 0 2px rgb(var(--v-theme-surface));
}

/* Device preview */
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
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.fb-overlay { position: absolute; inset: 0; border-radius: 8px; z-index: 1; }
.fb-form {
  z-index: 2;
  padding: 28px;
  width: 90%;
  max-width: 340px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
.fb-form__title { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.fb-form__sub { font-size: 12px; opacity: 0.75; margin-bottom: 16px; }
.fb-form__field {
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
.fb-form__btn {
  height: 38px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.fb-form__legal { text-align: center; margin-top: 10px; font-size: 10px; opacity: 0.5; }
</style>
