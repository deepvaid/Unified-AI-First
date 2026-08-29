<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useContentStore, CONTENT_FACETS, type ContentTemplate } from '@/stores/useContent'
import { useFoldersStore } from '@/stores/useFolders'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

/**
 * Select Template. Rebuilt from UAT `/contents/template`;
 * see docs/rebuild/email-content/.
 *
 * The source's `activeTab` query param is a load-time seed only — clicking a tab
 * never updates it, so a tab cannot be linked to. Here the tab IS the URL.
 * Library cards also carry their names permanently; the source shows them only
 * on hover, so a card is unreadable by keyboard or touch.
 */
const store = useContentStore()
const foldersStore = useFoldersStore()
const { library, templates } = storeToRefs(store)
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/accounts/${accountId.value}/contents`)

// ── Tabs (routable, unlike the source) ───────────────────────────────
const TABS = [
  { key: 'library', label: 'Library' },
  { key: 'mine', label: 'My templates' },
]
const tab = ref(route.query.tab === 'mine' ? 'mine' : 'library')
watch(tab, (next) => {
  router.replace({ query: { ...route.query, tab: next === 'library' ? undefined : next } })
})

// ── Library facets ───────────────────────────────────────────────────
const facets = ref<Record<string, string[]>>({ industry: [], automated: [], seasonal: [], usage: [] })
const librarySearch = ref('')

function clearFacets() {
  facets.value = { industry: [], automated: [], seasonal: [], usage: [] }
}

/** Count of library templates carrying a given facet value, for the checkbox labels. */
function facetCount(group: keyof typeof CONTENT_FACETS, value: string) {
  return library.value.filter(t => (t[group] as string[]).includes(value)).length
}

const filteredLibrary = computed(() => {
  const term = librarySearch.value.trim().toLowerCase()
  return library.value.filter((t) => {
    if (term && !t.name.toLowerCase().includes(term)) return false
    // The source's facets combine with OR — adding a filter widens the result set.
    // Kept, because narrowing would change which templates people find.
    const groups = Object.entries(facets.value).filter(([, v]) => v.length)
    if (!groups.length) return true
    return groups.some(([group, values]) =>
      values.some(v => (t[group as keyof typeof CONTENT_FACETS] as string[]).includes(v)),
    )
  })
})

const libraryFilterEntries = computed(() =>
  Object.entries(facets.value)
    .filter(([, values]) => values.length)
    .map(([group, values]) => ({ key: group, label: `${group[0]!.toUpperCase()}${group.slice(1)}: ${values.join(', ')}` })),
)

function removeLibraryFilter(key: string) {
  facets.value[key] = []
}

/** Card tags, resolved once per template rather than on every render. */
const libraryCards = computed(() =>
  filteredLibrary.value.map(t => ({
    ...t,
    tags: [...t.usage, ...t.seasonal, ...t.automated].filter(Boolean).slice(0, 2),
  })),
)

function chooseLibrary(id: string) {
  const t = library.value.find(x => x.id === id)
  if (!t) return
  const item = store.createContent(t.name, 'Drag & Drop')
  toast.success(`"${t.name}" copied into your content`)
  router.push({ name: 'EmailContentEditor', params: { accountId: accountId.value, id: String(item.id) } })
}

function startFromScratch() {
  router.push({ name: 'ContentEditorChooser', params: { accountId: accountId.value } })
}

function newTemplate() {
  router.push({ name: 'TemplateEditorChooser', params: { accountId: accountId.value } })
}

// ── My templates ─────────────────────────────────────────────────────
const templateSearch = ref('')
const selectedFolderId = ref<string | null>(null)
const templateFolders = computed(() => foldersStore.foldersByScope('content_templates'))
const templateFolderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of templateFolders.value) {
    counts[folder.id] = templates.value.filter(t => t.folderId === folder.id).length
  }
  return counts
})

const filteredTemplates = computed(() => {
  const term = templateSearch.value.trim().toLowerCase()
  return templates.value.filter((t) => {
    if (selectedFolderId.value && t.folderId !== selectedFolderId.value) return false
    if (term && !t.name.toLowerCase().includes(term)) return false
    return true
  })
})

const templateFilterEntries = computed(() => {
  const folder = foldersStore.getFolder(selectedFolderId.value)
  return folder ? [{ key: 'folder', label: `Folder: ${folder.name}` }] : []
})

const templateHeaders = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '240px' },
  { title: 'Editor type', key: 'editorType', sortable: true, minWidth: '160px' },
  { title: 'Created by', key: 'createdBy', sortable: true, minWidth: '150px' },
  { title: 'Updated at', key: 'updatedAt', sortable: true, minWidth: '150px' },
  { title: 'Created at', key: 'createdAt', sortable: true, minWidth: '150px' },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

function formatDate(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function useTemplate(t: ContentTemplate) {
  const item = store.createContent(t.name, t.editorType === 'WYSIWYG' ? 'WYSIWYG' : 'Drag & Drop')
  toast.success(`New content started from "${t.name}"`)
  router.push({ name: 'EmailContentEditor', params: { accountId: accountId.value, id: String(item.id) } })
}

const confirmDeleteTemplate = ref(false)
const pendingTemplate = ref<ContentTemplate | null>(null)

function askDeleteTemplate(t: ContentTemplate) {
  pendingTemplate.value = t
  confirmDeleteTemplate.value = true
}

function doDeleteTemplate() {
  if (!pendingTemplate.value) return
  store.removeTemplate([pendingTemplate.value.id])
  toast.success(`"${pendingTemplate.value.name}" deleted`)
  pendingTemplate.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      title="Select a template"
      subtitle="Start from a Maropost design, one of your own, or a blank canvas"
      :back-to="listPath"
    >
      <template #actions>
        <v-btn variant="outlined" class="text-none" prepend-icon="layout-template" @click="newTemplate">
          New template
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="pencil" @click="startFromScratch">
          Start from scratch
        </v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="tab" :tabs="TABS" aria-label="Template source" controls-id="ct-panel" />
      </template>
    </MpPageHeader>

    <!-- ── LIBRARY ──────────────────────────────────────────────────── -->
    <v-card
      v-if="tab === 'library'"
      id="ct-panel"
      variant="flat"
      border
      rounded="lg"
      class="flex-grow-1 d-flex flex-column overflow-hidden"
    >
      <MpDataTableToolbar
        v-model:search="librarySearch"
        title="Maropost library"
        search-placeholder="Search templates by name"
        :total-count="filteredLibrary.length"
        :active-filters="libraryFilterEntries"
        @remove-filter="removeLibraryFilter"
        @clear-filters="clearFacets"
      >
        <template #filter-content>
          <p class="text-caption text-medium-emphasis mb-4">
            Ticking values across groups <strong>widens</strong> the results — a template matching any
            ticked value is shown.
          </p>
          <div class="d-flex flex-column ga-5">
            <MpFormField
              v-for="(values, group) in CONTENT_FACETS"
              :key="group"
              :label="`${String(group)[0]!.toUpperCase()}${String(group).slice(1)}`"
            >
              <template #default="{ labelId }">
                <div role="group" :aria-labelledby="labelId" class="d-flex flex-column">
                  <v-checkbox
                    v-for="value in values"
                    :key="value"
                    v-model="facets[group]"
                    :value="value"
                    :label="`${value} (${facetCount(group, value)})`"
                    density="compact"
                    hide-details
                  />
                </div>
              </template>
            </MpFormField>
          </div>
        </template>
      </MpDataTableToolbar>

      <div class="ct-scroll flex-grow-1">
        <div v-if="filteredLibrary.length" class="ct-grid">
          <!-- Blank canvas always leads the gallery, as in the source. -->
          <MpOptionCard
            :selected="false"
            title="Blank template"
            description="Start from scratch and build the email yourself."
            @click="startFromScratch"
          >
            <template #media>
              <div class="ct-thumb ct-thumb--blank">
                <v-icon size="30">square-dashed-mouse-pointer</v-icon>
              </div>
            </template>
          </MpOptionCard>

          <MpOptionCard
            v-for="t in libraryCards"
            :key="t.id"
            :selected="false"
            :title="t.name"
            @click="chooseLibrary(t.id)"
          >
            <template #media>
              <div
                class="ct-thumb"
                :class="`ct-thumb--${t.layout}`"
                :style="{ '--ct-accent': `rgb(var(--v-theme-${t.palette}))` }"
              >
                <span class="ct-thumb__band" />
                <span class="ct-thumb__line ct-thumb__line--wide" />
                <span class="ct-thumb__line" />
                <span class="ct-thumb__cta" />
              </div>
            </template>
            <div v-if="t.tags.length" class="d-flex flex-wrap ga-1 mt-2">
              <MpStatusChip
                v-for="tag in t.tags"
                :key="tag"
                :status="tag"
                type="general"
                size="sm"
                variant="outlined"
              />
            </div>
          </MpOptionCard>
        </div>

        <MpEmptyState
          v-else
          icon="search-x"
          title="No templates match your filters"
          description="Try a different search term, or clear the category filters."
          action-label="Clear filters"
          class="py-10"
          @action="clearFacets(); librarySearch = ''"
        />
      </div>
    </v-card>

    <!-- ── MY TEMPLATES ─────────────────────────────────────────────── -->
    <v-card
      v-else
      id="ct-panel"
      variant="flat"
      border
      rounded="lg"
      class="flex-grow-1 d-flex flex-column overflow-hidden"
    >
      <MpDataTableToolbar
        v-model:search="templateSearch"
        title="My templates"
        search-placeholder="Search your templates"
        :total-count="filteredTemplates.length"
        :active-filters="templateFilterEntries"
        @remove-filter="selectedFolderId = null"
        @clear-filters="selectedFolderId = null"
      >
        <template #actions>
          <MpFolderSelect
            v-model="selectedFolderId"
            :folders="templateFolders"
            :counts="templateFolderCounts"
            :total-count="templates.length"
            label="All folders"
          />
        </template>
      </MpDataTableToolbar>

      <v-data-table
        :headers="templateHeaders"
        :items="filteredTemplates"
        :items-per-page="10"
        hover
        density="comfortable"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.name="{ item }">
          <button type="button" class="ct-name" @click="useTemplate(item)">{{ item.name }}</button>
        </template>
        <template #item.editorType="{ item }">
          <MpStatusChip :status="item.editorType" type="general" size="sm" variant="tonal" />
        </template>
        <template #item.createdBy="{ item }">
          <span class="text-body-2">{{ item.createdBy }}</span>
        </template>
        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.updatedAt) }}</span>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
        </template>
        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Template actions" :item-label="item.name">
            <MpMenuItem icon="file-plus-2" title="Start content from this" @click="useTemplate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="askDeleteTemplate(item)" />
          </MpRowActionsMenu>
        </template>
        <template #no-data>
          <MpEmptyState
            :icon="templateSearch || selectedFolderId ? 'search-x' : 'layout-template'"
            :variant="templateSearch || selectedFolderId ? 'stack' : 'launcher'"
            :title="templateSearch || selectedFolderId ? 'No templates match your filters' : 'No saved templates yet'"
            :description="templateSearch || selectedFolderId
              ? 'Try a different search term, or switch back to all folders.'
              : 'Save an email body as a template and it becomes a starting point for everyone on your team.'"
            :action-label="templateSearch || selectedFolderId ? 'Clear filters' : 'New template'"
            class="py-10"
            @action="templateSearch || selectedFolderId ? (templateSearch = '', selectedFolderId = null) : newTemplate()"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="confirmDeleteTemplate"
      :title="`Delete &quot;${pendingTemplate?.name}&quot;?`"
      message="This template is removed permanently. Content already started from it is not affected."
      confirm-label="Delete template"
      danger
      @confirm="doDeleteTemplate"
    />
  </div>
</template>

<style scoped>
.ct-scroll {
  overflow-y: auto;
  padding: var(--mp-component-card-padding);
}

.ct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--mp-space-16);
}

.ct-name {
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-align: left;
}

.ct-name:hover {
  text-decoration: underline;
}

/* A fixed ratio so the gallery is a grid. The source's cards range 300–1660px tall. */
.ct-thumb {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  aspect-ratio: 3 / 4;
  padding: var(--mp-space-12);
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
}

.ct-thumb--blank {
  align-items: center;
  justify-content: center;
  color: rgb(var(--v-theme-on-surface-variant));
  border: 1px dashed rgb(var(--v-border-color), var(--v-border-opacity));
}

.ct-thumb__band {
  display: block;
  height: 38%;
  border-radius: var(--mp-radius-4);
  background: var(--ct-accent);
}

.ct-thumb__line {
  display: block;
  height: var(--mp-space-6);
  width: 60%;
  border-radius: var(--mp-radius-4);
  background: rgb(var(--v-theme-on-surface));
  opacity: 0.28;
}

.ct-thumb__line--wide {
  width: 88%;
  height: var(--mp-space-8);
  opacity: 0.6;
}

.ct-thumb__cta {
  display: block;
  margin-top: auto;
  height: var(--mp-space-12);
  width: 52%;
  border-radius: var(--mp-radius-full);
  background: var(--ct-accent);
}

/* The four layouts differ in how much of the frame the accent band takes. */
.ct-thumb--hero .ct-thumb__band { height: 52%; }
.ct-thumb--minimal .ct-thumb__band { height: 14%; }
.ct-thumb--split .ct-thumb__band { height: 30%; }

.ct-thumb--grid .ct-thumb__band {
  height: 42%;
  background:
    linear-gradient(var(--ct-accent), var(--ct-accent)) left top / 48% 48% no-repeat,
    linear-gradient(var(--ct-accent), var(--ct-accent)) right top / 48% 48% no-repeat,
    linear-gradient(var(--ct-accent), var(--ct-accent)) left bottom / 48% 48% no-repeat,
    linear-gradient(var(--ct-accent), var(--ct-accent)) right bottom / 48% 48% no-repeat;
  background-color: transparent;
}
</style>
