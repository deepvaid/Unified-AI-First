<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignsStore } from '@/stores/useCampaigns'

const router = useRouter()
const store = useCampaignsStore()

const step = ref(1)
const totalSteps = 5

// Step 1: Setup
const setup = ref({
  name: '',
  subject: '',
  preheader: '',
  senderName: 'MaropostX Store',
  senderEmail: 'hello@mystore.com',
  replyTo: '',
})

// Step 2: Template
const selectedTemplate = ref<number | null>(null)
const templates = [
  { id: 1, name: 'Promotional Sale', icon: 'heart-handshake', color: 'error', desc: 'Highlight discounts and flash deals' },
  { id: 2, name: 'Newsletter', icon: 'newspaper', color: 'primary', desc: 'Curated content updates' },
  { id: 3, name: 'Product Launch', icon: 'rocket', color: 'secondary', desc: 'Announce a new product arrival' },
  { id: 4, name: 'Win-Back', icon: 'heart', color: 'warning', desc: 'Re-engage lapsed customers' },
  { id: 5, name: 'Seasonal', icon: 'snowflake', color: 'info', desc: 'Holiday & seasonal campaigns' },
  { id: 6, name: 'Blank', icon: 'file-plus', color: 'grey', desc: 'Start from scratch' },
]

// Step 3: Audience
const selectedList = ref('Master Subscriber List')
const lists = ['Master Subscriber List', 'Newsletter Opt-in', 'VIP Customer Circle', 'Re-engagement 2024']
const estimatedAudience = computed(() => {
  const base: Record<string, number> = {
    'Master Subscriber List': 45231,
    'Newsletter Opt-in': 18432,
    'VIP Customer Circle': 312,
    'Re-engagement 2024': 8912,
  }
  return (base[selectedList.value] || 0).toLocaleString()
})

// Step 4: Schedule
const scheduleType = ref<'now' | 'scheduled'>('now')
const scheduleDate = ref('')
const scheduleTime = ref('09:00')
const timezone = ref('America/New_York')

// Step 5: Review — computed summary
const reviewItems = computed(() => [
  { label: 'Campaign Name', value: setup.value.name || '—', icon: 'pencil' },
  { label: 'Subject Line', value: setup.value.subject || '—', icon: 'mail' },
  { label: 'Sender', value: `${setup.value.senderName} <${setup.value.senderEmail}>`, icon: 'user' },
  { label: 'Template', value: templates.find(t => t.id === selectedTemplate.value)?.name || '—', icon: 'palette' },
  { label: 'Audience', value: `${selectedList.value} (${estimatedAudience.value} contacts)`, icon: 'users' },
  { label: 'Send Time', value: scheduleType.value === 'now' ? 'Immediately after launch' : `${scheduleDate.value} at ${scheduleTime.value} ${timezone.value}`, icon: 'clock' },
])

const stepValid = computed(() => {
  if (step.value === 1) return setup.value.name.length > 0 && setup.value.subject.length > 0
  if (step.value === 2) return selectedTemplate.value !== null
  if (step.value === 3) return selectedList.value.length > 0
  if (step.value === 4) return scheduleType.value === 'now' || (scheduleDate.value.length > 0)
  return true
})

function nextStep() {
  if (step.value < totalSteps) step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

function launch() {
  store.createCampaign(setup.value.name)
  router.push('/campaigns')
}

function cancel() {
  router.push('/campaigns')
}

const stepTitles = ['Setup', 'Template', 'Audience', 'Schedule', 'Review & Launch']
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between pa-6 border-b bg-surface">
      <div class="d-flex align-center gap-4">
        <v-tooltip text="Back to Campaigns" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon="arrow-left" variant="text" size="small" @click="cancel"></v-btn>
          </template>
        </v-tooltip>
        <div>
          <div class="text-h6 font-weight-bold">New Email Campaign</div>
          <div class="text-caption text-medium-emphasis">Step {{ step }} of {{ totalSteps }} — {{ stepTitles[step - 1] }}</div>
        </div>
      </div>
      <v-btn variant="text" color="error" class="text-none" @click="cancel">Discard</v-btn>
    </div>

    <!-- Stepper Progress Bar -->
    <div class="border-b bg-surface">
      <v-stepper v-model="step" :items="stepTitles" flat elevation="0" hide-actions bg-color="surface" class="pa-0 rounded-0">
        <template v-slot:item.1><!-- content below --></template>
        <template v-slot:item.2><!-- content below --></template>
        <template v-slot:item.3><!-- content below --></template>
        <template v-slot:item.4><!-- content below --></template>
        <template v-slot:item.5><!-- content below --></template>
      </v-stepper>
    </div>

    <!-- Step Content -->
    <div class="flex-grow-1 overflow-y-auto pa-8 bg-background">
      <div style="max-width: 760px; margin: 0 auto;">

        <!-- Step 1: Setup -->
        <v-card v-if="step === 1" variant="flat" border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Campaign Setup</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Name your campaign and configure the sender details that recipients will see.</div>
          <v-divider class="mb-6"></v-divider>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="setup.name"
                label="Campaign Name *"
                placeholder="e.g. Black Friday 2026 — VIP Early Access"
                variant="outlined"
                density="comfortable"
                hint="Internal name, not shown to recipients"
                persistent-hint
                class="mb-4"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="setup.subject"
                label="Email Subject Line *"
                placeholder="e.g. 🔥 40% Off Sitewide — Today Only!"
                variant="outlined"
                density="comfortable"
                :counter="100"
                hint="Keep under 60 characters for best open rates"
                persistent-hint
                class="mb-4"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="setup.preheader"
                label="Preview Text (Preheader)"
                placeholder="e.g. Your favourite brands, now at the lowest prices..."
                variant="outlined"
                density="comfortable"
                hint="Shown in inbox previews after the subject line"
                persistent-hint
                class="mb-4"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="setup.senderName" label="Sender Name" variant="outlined" density="comfortable" class="mb-4"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="setup.senderEmail" label="Sender Email" variant="outlined" density="comfortable" class="mb-4"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="setup.replyTo" label="Reply-To Email (optional)" variant="outlined" density="comfortable" placeholder="support@mystore.com"></v-text-field>
            </v-col>
          </v-row>
        </v-card>

        <!-- Step 2: Template -->
        <v-card v-if="step === 2" variant="flat" border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Choose a Template</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Select a pre-built layout or start from a blank canvas. You can customize everything in the editor.</div>
          <v-divider class="mb-6"></v-divider>
          <v-row dense>
            <v-col v-for="tmpl in templates" :key="tmpl.id" cols="12" sm="6" md="4">
              <v-card
                :variant="selectedTemplate === tmpl.id ? 'elevated' : 'outlined'"
                :border="selectedTemplate !== tmpl.id"
                :color="selectedTemplate === tmpl.id ? 'primary' : 'surface'"
                rounded="lg"
                class="pa-5 cursor-pointer template-card"
                :class="{ 'border-primary': selectedTemplate === tmpl.id }"
                @click="selectedTemplate = tmpl.id"
                style="min-height: 140px;"
              >
                <div class="d-flex flex-column align-center text-center">
                  <v-icon :color="selectedTemplate === tmpl.id ? 'white' : tmpl.color" size="36" class="mb-3">{{ tmpl.icon }}</v-icon>
                  <div class="font-weight-bold mb-1" :class="selectedTemplate === tmpl.id ? 'text-white' : ''">{{ tmpl.name }}</div>
                  <div class="text-caption" :class="selectedTemplate === tmpl.id ? 'text-white' : 'text-medium-emphasis'">{{ tmpl.desc }}</div>
                </div>
                <v-icon v-if="selectedTemplate === tmpl.id" color="white" class="position-absolute top-0 right-0 ma-3" size="18">circle-check</v-icon>
              </v-card>
            </v-col>
          </v-row>
          <v-alert type="info" variant="tonal" density="compact" class="mt-6 text-body-2" rounded="lg" icon="palette">
            You'll be taken to the visual email editor after completing the wizard setup.
          </v-alert>
        </v-card>

        <!-- Step 3: Audience -->
        <v-card v-if="step === 3" variant="flat" border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Select Audience</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Choose which list or segment receives this campaign.</div>
          <v-divider class="mb-6"></v-divider>
          <div class="text-subtitle-2 font-weight-bold mb-3">Send To</div>
          <v-row dense class="mb-6">
            <v-col v-for="list in lists" :key="list" cols="12" sm="6">
              <v-card
                :variant="selectedList === list ? 'tonal' : 'outlined'"
                :color="selectedList === list ? 'primary' : 'surface'"
                rounded="lg"
                class="pa-4 cursor-pointer d-flex align-center gap-3"
                @click="selectedList = list"
              >
                <v-icon :color="selectedList === list ? 'primary' : 'medium-emphasis'" size="20">users</v-icon>
                <div>
                  <div class="text-body-2 font-weight-medium">{{ list }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-icon v-if="selectedList === list" color="primary" size="18">circle-check</v-icon>
              </v-card>
            </v-col>
          </v-row>
          <v-card variant="tonal" color="success" rounded="lg" class="pa-4 d-flex align-center gap-4">
            <v-icon color="success" size="32">user-check</v-icon>
            <div>
              <div class="text-h6 font-weight-bold text-success">{{ estimatedAudience }}</div>
              <div class="text-body-2 text-medium-emphasis">estimated recipients</div>
            </div>
          </v-card>
        </v-card>

        <!-- Step 4: Schedule -->
        <v-card v-if="step === 4" variant="flat" border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Schedule Sending</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Choose when to deliver this campaign to your audience.</div>
          <v-divider class="mb-6"></v-divider>
          <v-radio-group v-model="scheduleType" class="mb-6">
            <v-card variant="outlined" rounded="lg" class="pa-4 mb-3 cursor-pointer" :color="scheduleType === 'now' ? 'primary' : ''" @click="scheduleType = 'now'">
              <v-radio value="now" color="primary">
                <template v-slot:label>
                  <div class="ml-2">
                    <div class="font-weight-bold">Send Immediately</div>
                    <div class="text-caption text-medium-emphasis">Campaign launches as soon as you click "Launch Campaign"</div>
                  </div>
                </template>
              </v-radio>
            </v-card>
            <v-card variant="outlined" rounded="lg" class="pa-4 cursor-pointer" @click="scheduleType = 'scheduled'">
              <v-radio value="scheduled" color="primary">
                <template v-slot:label>
                  <div class="ml-2">
                    <div class="font-weight-bold">Schedule for Later</div>
                    <div class="text-caption text-medium-emphasis">Pick a specific date and time for delivery</div>
                  </div>
                </template>
              </v-radio>
            </v-card>
          </v-radio-group>
          <v-expand-transition>
            <div v-if="scheduleType === 'scheduled'">
              <v-row>
                <v-col cols="12" sm="5">
                  <v-text-field v-model="scheduleDate" label="Date" type="date" variant="outlined" density="comfortable"></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="scheduleTime" label="Time" type="time" variant="outlined" density="comfortable"></v-text-field>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select v-model="timezone" label="Timezone" :items="['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'UTC', 'Europe/London']" variant="outlined" density="comfortable"></v-select>
                </v-col>
              </v-row>
            </div>
          </v-expand-transition>
        </v-card>

        <!-- Step 5: Review & Launch -->
        <v-card v-if="step === 5" variant="flat" border rounded="lg" class="pa-8">
          <div class="text-h6 font-weight-bold mb-1">Review & Launch</div>
          <div class="text-body-2 text-medium-emphasis mb-6">Double-check your configuration before launching.</div>
          <v-divider class="mb-6"></v-divider>
          <v-list lines="two" density="compact" class="mb-6 rounded-xl border pa-0 overflow-hidden">
            <template v-for="(item, idx) in reviewItems" :key="idx">
              <v-list-item class="px-5 py-3" :class="{ 'border-b': idx < reviewItems.length - 1 }">
                <template v-slot:prepend>
                  <v-avatar size="36" color="primary" variant="tonal" class="mr-3">
                    <v-icon color="primary" size="18">{{ item.icon }}</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ item.label }}</v-list-item-title>
                <v-list-item-subtitle class="text-body-2 font-weight-medium mt-1" style="opacity: 1;">{{ item.value }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-tooltip :text="`Edit ${item.label}`" location="top">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="pencil" variant="text" size="small" color="primary" @click="step = Math.ceil(idx / 2) + 1"></v-btn>
                    </template>
                  </v-tooltip>
                </template>
              </v-list-item>
            </template>
          </v-list>

          <v-alert type="success" variant="tonal" density="compact" rounded="xl" class="mb-6">
            <strong>Everything looks good!</strong> Your campaign is ready to go. Click Launch to send to {{ estimatedAudience }} recipients.
          </v-alert>
          <v-btn color="success" size="large" block rounded="xl" prepend-icon="rocket" class="text-none font-weight-bold" @click="launch">Launch Campaign</v-btn>
        </v-card>

      </div>
    </div>

    <!-- Bottom Navigation Bar -->
    <div class="pa-4 border-t bg-surface d-flex justify-space-between align-center">
      <v-btn v-if="step > 1" variant="outlined" class="text-none" prepend-icon="arrow-left" @click="prevStep">Back</v-btn>
      <div v-else></div>
      <div class="d-flex align-center gap-2">
        <span class="text-caption text-medium-emphasis">{{ step }} / {{ totalSteps }}</span>
        <v-btn v-if="step < totalSteps" color="primary" variant="elevated" class="text-none" append-icon="arrow-right" :disabled="!stepValid" @click="nextStep">
          Continue
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.border-b { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-t { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important; }
.border-primary { border-color: rgb(var(--v-theme-primary)) !important; }
.template-card { transition: all 0.2s ease; }
.template-card:hover { transform: translateY(-2px); }
</style>
