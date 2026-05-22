<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

// ─── Wizard Steps ─────────────────────────────────────────────────────
const step = ref(1)
const totalSteps = 4

// Step 1: Setup
const formName = ref('')
const selectedList = ref('')
const formType = ref<'popup'|'embedded'>('popup')
const lists = ['Newsletter Subscribers', 'VIP Customer Circle', 'Master Subscriber List', 'Promotional List']

// Step 2: Display Rules
const displayTrigger = ref('time')
const timeOnPage = ref(5)
const scrollPercent = ref(50)
const pageTarget = ref<'all'|'specific'>('all')
const specificUrl = ref('')
const deviceTarget = ref<'all'|'desktop'|'mobile'>('all')
const frequency = ref('once_per_session')

// Step 3: Design
const previewDevice = ref<'desktop'|'mobile'>('desktop')
const selectedTab = ref('elements')
const bgColor = ref('#1a1a2e')
const textColor = ref('#ffffff')
const accentColor = ref('#6366f1')
const borderRadius = ref(16)
const showOverlay = ref(true)
const overlayOpacity = ref(60)
const formTitle = ref('Join our VIP list')
const formSubtitle = ref('Get exclusive deals, early access & more.')
const buttonLabel = ref('Subscribe Now')
const showFirstName = ref(true)
const showPhone = ref(false)

// Step 4: Success
const successType = ref<'message'|'redirect'>('message')
const successTitle = ref("You're in! 🎉")
const successMessage = ref('Thanks for subscribing. Watch your inbox for exclusive offers.')
const redirectUrl = ref('')

// ─── Validation ───────────────────────────────────────────────────────
const step1Valid = computed(() => formName.value.trim().length > 0 && selectedList.value.length > 0)

const saveSnack = ref(false)

function goBack() { router.push({ name: 'AcquisitionForms', params: { accountId: accountId.value } }) }
function finish() { saveSnack.value = true; setTimeout(() => goBack(), 2000) }
</script>

<template>
  <div class="d-flex flex-column" style="height:100vh;overflow:hidden;">

    <!-- ── Top Bar ──────────────────────────────────────────────────────── -->
    <div class="d-flex align-center justify-space-between px-5 border-b bg-surface" style="height:56px;flex-shrink:0;">
      <div class="d-flex align-center gap-3">
        <v-tooltip text="Back to Forms" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" aria-label="Back to Forms" @click="goBack()"></v-btn>
          </template>
        </v-tooltip>
        <div>
          <div class="font-weight-bold text-body-1">{{ formName || 'New Acquisition Form' }}</div>
          <div class="text-caption text-medium-emphasis">Step {{ step }} of {{ totalSteps }}</div>
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn variant="text" class="text-none text-medium-emphasis" size="small" @click="saveSnack=true">Save Draft</v-btn>
        <v-btn v-if="step < totalSteps" color="primary" variant="elevated" size="small" class="text-none" append-icon="arrow-right"
          :disabled="step===1 && !step1Valid" @click="step++">Continue</v-btn>
        <v-btn v-else color="success" variant="elevated" size="small" class="text-none" prepend-icon="check" @click="finish()">Publish Form</v-btn>
      </div>
    </div>

    <!-- ── Step Tabs ────────────────────────────────────────────────────── -->
    <div class="border-b bg-surface px-5" style="flex-shrink:0;">
      <v-tabs :model-value="step" density="compact" color="primary" show-arrows>
        <v-tab :value="1" @click="step=1" class="text-none">1. Setup</v-tab>
        <v-tab :value="2" @click="step > 1 && (step=2)" :disabled="step < 2" class="text-none">2. Display Rules</v-tab>
        <v-tab :value="3" @click="step > 2 && (step=3)" :disabled="step < 3" class="text-none">3. Design</v-tab>
        <v-tab :value="4" @click="step > 3 && (step=4)" :disabled="step < 4" class="text-none">4. Success &amp; Publish</v-tab>
      </v-tabs>
    </div>

    <!-- ── Content ─────────────────────────────────────────────────────── -->
    <div class="flex-grow-1 overflow-hidden">

      <!-- ── STEP 1: Setup ─────────────────────────────────────────────── -->
      <div v-if="step===1" class="overflow-y-auto h-100 d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:600px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">Form Setup</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Name your form and choose which list subscribers will be added to.</div>
          <v-text-field v-model="formName" label="Form Name *" placeholder="e.g. Homepage Exit-Intent Popup" variant="outlined" density="comfortable" class="mb-4"></v-text-field>
          <v-select v-model="selectedList" label="Subscribe to List *" :items="lists" variant="outlined" density="comfortable" class="mb-6"></v-select>
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Form Type</div>
          <v-row dense>
            <v-col cols="6">
              <v-card :variant="formType==='popup'?'elevated':'flat'" :elevation="formType==='popup'?4:0" border rounded="lg"
                class="pa-4 text-center cursor-pointer" :class="{'type-selected':formType==='popup'}" @click="formType='popup'">
                <v-icon size="32" :color="formType==='popup'?'primary':undefined" class="mb-2">smartphone</v-icon>
                <div class="text-body-2 font-weight-bold">Popup</div>
                <div class="text-caption text-medium-emphasis">Triggered overlay on top of page content</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card :variant="formType==='embedded'?'elevated':'flat'" :elevation="formType==='embedded'?4:0" border rounded="lg"
                class="pa-4 text-center cursor-pointer" :class="{'type-selected':formType==='embedded'}" @click="formType='embedded'">
                <v-icon size="32" :color="formType==='embedded'?'primary':undefined" class="mb-2">globe</v-icon>
                <div class="text-body-2 font-weight-bold">Embedded</div>
                <div class="text-caption text-medium-emphasis">Inline form inside your page layout</div>
              </v-card>
            </v-col>
          </v-row>
          <div class="d-flex justify-end mt-6">
            <v-btn color="primary" variant="elevated" class="text-none" append-icon="arrow-right" :disabled="!step1Valid" @click="step=2">Continue to Display Rules</v-btn>
          </div>
        </v-card>
      </div>

      <!-- ── STEP 2: Display Rules ──────────────────────────────────────── -->
      <div v-else-if="step===2" class="overflow-y-auto h-100 d-flex justify-center pt-8 pa-4">
        <v-card variant="flat" border rounded="lg" style="max-width:600px;width:100%;" class="pa-8">
          <div class="text-h5 font-weight-bold mb-1">Display Rules</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Control when and where your form appears.</div>
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Show Form When</div>
          <v-radio-group v-model="displayTrigger" class="mb-4">
            <v-radio value="time" label="After time on page"></v-radio>
            <v-radio value="exit" label="Exit intent (cursor leaves page)"></v-radio>
            <v-radio value="scroll" label="After scroll percentage"></v-radio>
            <v-radio value="immediate" label="Immediately on page load"></v-radio>
          </v-radio-group>
          <div v-if="displayTrigger==='time'" class="mb-4">
            <v-slider v-model="timeOnPage" :min="1" :max="60" :step="1" color="primary" thumb-label="always" label="Seconds on page">
              <template v-slot:append><v-text-field v-model="timeOnPage" type="number" density="compact" style="width:70px;" variant="outlined" hide-details></v-text-field></template>
            </v-slider>
          </div>
          <div v-if="displayTrigger==='scroll'" class="mb-4">
            <v-slider v-model="scrollPercent" :min="10" :max="100" :step="10" color="primary" thumb-label="always" label="Scroll depth %" suffix="%"></v-slider>
          </div>
          <v-divider class="my-4"></v-divider>
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Target Pages</div>
          <v-radio-group v-model="pageTarget" inline class="mb-3">
            <v-radio value="all" label="All pages"></v-radio>
            <v-radio value="specific" label="Specific URL"></v-radio>
          </v-radio-group>
          <v-text-field v-if="pageTarget==='specific'" v-model="specificUrl" label="URL Pattern (supports *)" variant="outlined" density="compact" class="mb-4"></v-text-field>
          <v-divider class="my-4"></v-divider>
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Devices</div>
          <v-btn-toggle
            v-model="deviceTarget"
            density="compact"
            variant="outlined"
            divided
            rounded="lg"
            mandatory
            class="mp-toggle-group mp-toggle-group--segmented mb-4"
          >
            <v-btn value="all" class="text-none" size="small">All</v-btn>
            <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
            <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
          </v-btn-toggle>
          <v-divider class="my-4"></v-divider>
          <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Show Frequency</div>
          <v-select v-model="frequency" :items="[
            {title:'Once per session', value:'once_per_session'},
            {title:'Once per visitor (ever)', value:'once_ever'},
            {title:'Every visit', value:'every_visit'},
            {title:'Every 7 days', value:'every_7d'},
          ]" item-title="title" item-value="value" variant="outlined" density="compact"></v-select>
          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="flat" class="text-none" @click="step=1" color="surface">Back</v-btn>
            <v-btn color="primary" variant="elevated" class="text-none" append-icon="arrow-right" @click="step=3">Continue to Design</v-btn>
          </div>
        </v-card>
      </div>

      <!-- ── STEP 3: Design Editor ──────────────────────────────────────── -->
      <div v-else-if="step===3" class="d-flex h-100 overflow-hidden">

        <!-- Left: Elements / Styles Panel -->
        <div class="border-r bg-surface d-flex flex-column overflow-hidden" style="width:260px;flex-shrink:0;">
          <div class="pa-3 border-b">
            <v-btn-toggle
              v-model="selectedTab"
              density="compact"
              variant="outlined"
              divided
              mandatory
              rounded="lg"
              class="mp-toggle-group mp-toggle-group--segmented"
              style="width:100%;"
            >
              <v-btn value="elements" class="text-none" size="small" style="flex:1;">Elements</v-btn>
              <v-btn value="styles" class="text-none" size="small" style="flex:1;">Styles</v-btn>
            </v-btn-toggle>
          </div>
          <div class="pa-3 flex-grow-1 overflow-y-auto">
            <!-- Elements Tab -->
            <template v-if="selectedTab==='elements'">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Form Content</div>
              <v-text-field v-model="formTitle" label="Headline" variant="outlined" density="compact" class="mb-2"></v-text-field>
              <v-textarea v-model="formSubtitle" label="Subheadline" variant="outlined" density="compact" rows="2" auto-grow class="mb-3"></v-textarea>
              <v-divider class="mb-3"></v-divider>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Fields</div>
              <v-switch v-model="showFirstName" label="First Name field" color="primary" density="compact" hide-details class="mb-1"></v-switch>
              <v-switch model-value="true" label="Email field" color="primary" density="compact" hide-details disabled class="mb-1"></v-switch>
              <v-switch v-model="showPhone" label="Phone Number field" color="primary" density="compact" hide-details class="mb-3"></v-switch>
              <v-divider class="mb-3"></v-divider>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Button</div>
              <v-text-field v-model="buttonLabel" label="Button Label" variant="outlined" density="compact" class="mb-2"></v-text-field>
            </template>

            <!-- Styles Tab -->
            <template v-else>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Colors</div>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption">Background</span>
                <div class="color-swatch cursor-pointer" :style="{background: bgColor}" @click="()=>{}">
                  <v-tooltip :text="bgColor" location="top"><template v-slot:activator="{props}"><div v-bind="props" style="width:28px;height:28px;border-radius:6px;border:1px solid rgba(0,0,0,.15);"></div></template></v-tooltip>
                </div>
              </div>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption">Text Color</span>
                <div :style="{background: textColor, width:'28px', height:'28px', borderRadius:'6px', border:'1px solid rgba(0,0,0,.15)', cursor:'pointer'}"></div>
              </div>
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="text-caption">Accent / Button</span>
                <div :style="{background: accentColor, width:'28px', height:'28px', borderRadius:'6px', border:'1px solid rgba(0,0,0,.15)', cursor:'pointer'}"></div>
              </div>
              <v-divider class="mb-3"></v-divider>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Shape</div>
              <div class="text-caption mb-1">Border Radius: {{ borderRadius }}px</div>
              <v-slider v-model="borderRadius" :min="0" :max="32" :step="2" color="primary" class="mb-3"></v-slider>
              <v-divider class="mb-3"></v-divider>
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Overlay</div>
              <v-switch v-model="showOverlay" label="Dark overlay" color="primary" density="compact" hide-details class="mb-2"></v-switch>
              <div v-if="showOverlay">
                <div class="text-caption mb-1">Opacity: {{ overlayOpacity }}%</div>
                <v-slider v-model="overlayOpacity" :min="10" :max="90" :step="5" color="primary"></v-slider>
              </div>
            </template>
          </div>
          <div class="pa-3 border-t d-flex gap-2">
            <v-btn variant="flat" class="text-none flex-grow-1" size="small" @click="step=2" color="surface">Back</v-btn>
            <v-btn color="primary" variant="elevated" class="text-none flex-grow-1" size="small" @click="step=4">Next</v-btn>
          </div>
        </div>

        <!-- Center: Device Preview -->
        <div class="flex-grow-1 bg-background d-flex flex-column align-center overflow-auto pa-6">
          <div class="d-flex align-center gap-2 mb-4">
            <v-btn-toggle
              v-model="previewDevice"
              density="compact"
              variant="outlined"
              divided
              mandatory
              rounded="lg"
              class="mp-toggle-group mp-toggle-group--segmented"
            >
              <v-btn value="desktop" class="text-none" size="small" prepend-icon="monitor">Desktop</v-btn>
              <v-btn value="mobile" class="text-none" size="small" prepend-icon="smartphone">Mobile</v-btn>
            </v-btn-toggle>
          </div>

          <!-- Device frame -->
          <div :style="{
            width: previewDevice==='desktop' ? '780px' : '375px',
            background: '#e5e5e5',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 8px 40px rgba(0,0,0,.25)',
            transition: 'width 0.3s ease'
          }">
            <!-- Browser bar -->
            <div class="d-flex align-center gap-1 mb-2 px-2">
              <div style="width:10px;height:10px;border-radius:50%;background:#ff5f56;"></div>
              <div style="width:10px;height:10px;border-radius:50%;background:#ffbd2e;"></div>
              <div style="width:10px;height:10px;border-radius:50%;background:#27c93f;"></div>
              <div style="flex:1;background:#fff;border-radius:8px;height:20px;margin-left:8px;"></div>
            </div>
            <!-- Page mock -->
            <div :style="{background:'#f0f0f0', borderRadius:'8px', minHeight:'380px', position:'relative', display:'flex', alignItems:'center', justifyContent:'center'}">
              <!-- Overlay -->
              <div v-if="showOverlay" :style="{position:'absolute',inset:0,background:`rgba(0,0,0,${overlayOpacity/100})`,borderRadius:'8px',zIndex:1}"></div>
              <!-- Form popup card -->
              <div :style="{
                position:'relative', zIndex:2,
                background: bgColor, color: textColor,
                borderRadius: borderRadius + 'px',
                padding: '28px', width: '90%', maxWidth: '340px',
                boxShadow: '0 20px 60px rgba(0,0,0,.4)'
              }">
                <div :style="{fontSize:'18px', fontWeight:700, marginBottom:'6px', color:textColor}">{{ formTitle }}</div>
                <div :style="{fontSize:'12px', opacity:0.75, marginBottom:'16px', color:textColor}">{{ formSubtitle }}</div>
                <div v-if="showFirstName" :style="{background:'rgba(255,255,255,.12)', borderRadius:'8px', height:'36px', marginBottom:'8px', padding:'0 12px', display:'flex', alignItems:'center', fontSize:'12px', color:textColor, opacity:0.8}">First Name</div>
                <div :style="{background:'rgba(255,255,255,.12)', borderRadius:'8px', height:'36px', marginBottom:'8px', padding:'0 12px', display:'flex', alignItems:'center', fontSize:'12px', color:textColor, opacity:0.8}">Email Address *</div>
                <div v-if="showPhone" :style="{background:'rgba(255,255,255,.12)', borderRadius:'8px', height:'36px', marginBottom:'8px', padding:'0 12px', display:'flex', alignItems:'center', fontSize:'12px', color:textColor, opacity:0.8}">Phone Number</div>
                <div :style="{background:accentColor, borderRadius:'8px', height:'38px', marginTop:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:600, color:'#fff', cursor:'pointer'}">{{ buttonLabel }}</div>
                <div :style="{textAlign:'center', marginTop:'10px', fontSize:'10px', opacity:0.5, color:textColor}">We respect your privacy. Unsubscribe anytime.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── STEP 4: Success & Publish ──────────────────────────────────── -->
      <div v-else class="overflow-y-auto h-100 d-flex justify-center pt-8 pa-4">
        <div style="max-width:600px;width:100%;">
          <v-card variant="flat" border rounded="lg" class="pa-8 mb-4">
            <div class="text-h5 font-weight-bold mb-1">Success Message</div>
            <div class="text-body-2 text-medium-emphasis mb-6">What happens after a visitor submits the form?</div>
            <v-radio-group v-model="successType">
              <v-radio value="message" label="Show a success message"></v-radio>
              <v-radio value="redirect" label="Redirect to a URL"></v-radio>
            </v-radio-group>
            <template v-if="successType==='message'">
              <v-text-field v-model="successTitle" label="Success Heading" variant="outlined" density="compact" class="mb-3"></v-text-field>
              <v-textarea v-model="successMessage" label="Success Body" variant="outlined" density="compact" rows="3"></v-textarea>
            </template>
            <v-text-field v-else v-model="redirectUrl" label="Redirect URL" placeholder="https://mysite.com/thank-you" variant="outlined" density="compact"></v-text-field>
          </v-card>

          <v-card variant="flat" border rounded="lg" class="pa-8">
            <div class="text-h6 font-weight-bold mb-4">Form Summary</div>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0"><template v-slot:prepend><v-icon size="18" color="primary">list-checks</v-icon></template><v-list-item-title class="text-body-2"><strong>Name:</strong> {{ formName }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template v-slot:prepend><v-icon size="18" color="primary">list</v-icon></template><v-list-item-title class="text-body-2"><strong>List:</strong> {{ selectedList }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template v-slot:prepend><v-icon size="18" color="primary">smartphone</v-icon></template><v-list-item-title class="text-body-2"><strong>Type:</strong> {{ formType === 'popup' ? 'Popup Overlay' : 'Embedded Form' }}</v-list-item-title></v-list-item>
              <v-list-item class="px-0"><template v-slot:prepend><v-icon size="18" color="primary">eye</v-icon></template><v-list-item-title class="text-body-2"><strong>Trigger:</strong> {{ {time:'Time on page', exit:'Exit intent', scroll:'Scroll depth', immediate:'Immediate'}[displayTrigger] }}</v-list-item-title></v-list-item>
            </v-list>
            <v-divider class="my-4"></v-divider>
            <div class="d-flex gap-3 justify-end">
              <v-btn variant="flat" class="text-none" @click="step=3" color="surface">Back to Design</v-btn>
              <v-btn color="success" variant="elevated" class="text-none" prepend-icon="check" @click="finish()">Publish Form</v-btn>
            </div>
          </v-card>
        </div>
      </div>
    </div>

    <v-snackbar v-model="saveSnack" :timeout="2500" color="success" rounded="pill" location="bottom center">
      <div class="d-flex align-center gap-2"><v-icon>circle-check</v-icon> Form published!</div>
    </v-snackbar>
  </div>
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-r { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.type-selected { border-color: rgb(var(--v-theme-primary)) !important; }
</style>
