<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpStatusToggle from '@/components/MpStatusToggle.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpFormField from '@/components/MpFormField.vue'
import JourneyMiniPreview from '@/components/marketing/JourneyMiniPreview.vue'
import { useDataJourneysStore, type DataJourney } from '@/stores/useDataJourneys'
import { dataJourneyTemplates } from '@/stores/journeyFlowData'
import { parseDataJourneyDescription } from '@/composables/useJourneyGenerator'

const store = useDataJourneysStore()
const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)

function openBuilder(id: number) {
  router.push({ name: 'DataJourneyBuilder', params: { accountId: accountId.value, id: String(id) } })
}

const search = ref('')
const activeTab = ref('all')

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: false, width: 140 },
  { title: 'Instances', key: 'instances', align: 'end' as const, sortable: true },
  { title: 'Updated', key: 'updated', sortable: true },
  { title: 'Created', key: 'created', sortable: true },
  { title: '', key: 'actions', sortable: false, width: 72 },
]

const tabs = [
  { label: 'All', key: 'all' },
  { label: 'Active', key: 'active' },
  { label: 'Paused', key: 'paused' },
  { label: 'Draft', key: 'draft' },
]

const tabCount = (key: string) => {
  if (key === 'all') return store.dataJourneys.length
  return store.dataJourneys.filter(j => j.status.toLowerCase() === key).length
}

const tabsWithCounts = computed(() => tabs.map(t => ({ ...t, count: tabCount(t.key) })))

const filteredJourneys = computed(() => {
  if (activeTab.value === 'all') return store.dataJourneys
  return store.dataJourneys.filter(j => j.status.toLowerCase() === activeTab.value)
})

function toggleStatus(journey: DataJourney) {
  journey.status = journey.status === 'Active' ? 'Paused' : 'Active'
}

// ── Create drawer (template picker + describe-to-draft) ─────────────────────

const createOpen = ref(false)
const newName = ref('')
const selectedTemplateId = ref<string | null>(null)
const describeText = ref('')
const describeMiss = ref(false)
const frequencyHint = ref<string | undefined>()

function openCreate() {
  newName.value = ''
  selectedTemplateId.value = null
  describeText.value = ''
  describeMiss.value = false
  frequencyHint.value = undefined
  createOpen.value = true
}

function chooseTemplate(id: string) {
  selectedTemplateId.value = id
  const tpl = dataJourneyTemplates.find(t => t.id === id)
  if (tpl && !newName.value.trim()) newName.value = tpl.name
}

function draftFromDescription() {
  const hint = parseDataJourneyDescription(describeText.value)
  if (!hint) {
    describeMiss.value = true
    return
  }
  describeMiss.value = false
  selectedTemplateId.value = hint.templateId
  newName.value = hint.name
  frequencyHint.value = hint.frequency
}

const canCreate = computed(() => !!selectedTemplateId.value && newName.value.trim().length > 0)

function createDataJourney() {
  if (!canCreate.value || !selectedTemplateId.value) return
  const id = store.createDataJourney({
    name: newName.value.trim(),
    templateId: selectedTemplateId.value,
    frequency: frequencyHint.value,
  })
  createOpen.value = false
  openBuilder(id)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Data Journeys"
      :subtitle="`${store.dataJourneys.filter(j => j.status === 'Active').length} active · ${store.dataJourneys.reduce((a, j) => a + j.instances, 0).toLocaleString()} total runs`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New Data Journey</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="activeTab" :tabs="tabsWithCounts" aria-label="Filter data journeys by status" />
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Data Journeys"
        search-placeholder="Search data journeys..."
        :total-count="filteredJourneys.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredJourneys"
        :search="search"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="font-weight-medium text-body-2 cursor-pointer text-primary-hover" style="max-width: 320px;"
            @click="openBuilder(item.id)">
            {{ item.name }}
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusToggle :status="item.status" @toggle="toggleStatus(item)" />
        </template>

        <template v-slot:item.instances="{ item }">
          <span class="font-weight-medium">{{ item.instances.toLocaleString() }}</span>
        </template>

        <template v-slot:item.updated="{ item }">
          <span class="text-medium-emphasis text-body-2">{{ item.updated }}</span>
        </template>

        <template v-slot:item.created="{ item }">
          <span class="text-medium-emphasis text-body-2">{{ item.created }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="action-btns d-flex align-center">
            <v-tooltip text="Edit in builder" location="top">
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="pencil" variant="text" size="x-small" class="text-medium-emphasis"
                  aria-label="Edit in builder" @click="openBuilder(item.id)"></v-btn>
              </template>
            </v-tooltip>
            <MpRowActionsMenu ariaLabel="Data journey actions">
              <v-list-item
                :prepend-icon="item.status === 'Active' ? 'circle-pause' : 'circle-play'"
                :title="item.status === 'Active' ? 'Pause' : 'Activate'"
                @click="toggleStatus(item)"
              ></v-list-item>
              <v-divider></v-divider>
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error"
                @click="store.removeDataJourney(item.id)"></v-list-item>
            </MpRowActionsMenu>
          </div>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="workflow"
            :title="search ? 'No data journeys match your search' : 'No data journeys yet'"
            :description="search ? 'Try a different search term.' : 'Automate imports, exports, and syncs on a schedule.'"
            action-label="New Data Journey"
            action-icon="plus"
            class="py-10"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create drawer -->
    <MpFormDrawer v-model="createOpen" title="New data journey" subtitle="Pick a starting point — the builder opens next.">
      <v-text-field v-model="newName" label="Name" placeholder="e.g. Nightly warehouse export" />

      <MpFormField label="Start from">
        <div class="d-flex flex-column ga-3">
          <MpOptionCard v-for="tpl in dataJourneyTemplates" :key="tpl.id"
            :selected="selectedTemplateId === tpl.id" :title="tpl.name" :description="tpl.description" :icon="tpl.icon"
            @click="chooseTemplate(tpl.id)">
            <div class="border rounded-lg bg-background pa-3 d-flex justify-center mt-3">
              <JourneyMiniPreview :nodes="tpl.nodes" />
            </div>
          </MpOptionCard>
        </div>
      </MpFormField>

      <v-divider />

      <v-textarea v-model="describeText" label="Or describe it" prepend-inner-icon="sparkles" rows="3" auto-grow
        placeholder='e.g. "import shopify orders daily then send a campaign"' />
      <v-btn variant="tonal" color="primary" class="text-none" prepend-icon="sparkles" block @click="draftFromDescription">
        Draft from description
      </v-btn>
      <v-alert v-if="describeMiss" type="info" variant="tonal" density="compact" rounded="lg" class="text-caption">
        Couldn't match that yet — try mentioning Salesforce leads, Shopify orders, or a warehouse export.
      </v-alert>

      <template #footer>
        <v-btn variant="outlined" class="text-none flex-grow-1" @click="createOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none flex-grow-1" prepend-icon="workflow"
          :disabled="!canCreate" @click="createDataJourney">Create</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

