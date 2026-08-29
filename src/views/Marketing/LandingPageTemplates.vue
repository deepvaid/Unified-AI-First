<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  useLandingPagesStore,
  LANDING_FACETS,
  LANDING_FACET_GROUPS,
  LANDING_TEMPLATES,
  type LandingTemplate,
  type LandingTemplateRecord,
} from '@/stores/useLandingPages'
import { useFoldersStore } from '@/stores/useFolders'
import { useToast } from '@/composables/useToast'
import { useInitialLoad } from '@/composables/useInitialLoad'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFolderSelect from '@/components/MpFolderSelect.vue'
import MpManageFoldersDrawer from '@/components/MpManageFoldersDrawer.vue'
import MpMoveToFolderDialog from '@/components/MpMoveToFolderDialog.vue'

/**
 * Select Template — step 1 of "create a landing page".
 * Rebuilt from UAT `/accounts/:id/landing_pages/template`; see
 * docs/rebuild/landing-pages/AUDIT.md §2.
 *
 * The source's cards carry no text at all (names live in a hover scrim), have no
 * aspect ratio (300px → 1660px tall), and its tab state never reaches the URL.
 * All three are fixed here.
 */
const store = useLandingPagesStore()
const foldersStore = useFoldersStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { savedTemplates } = storeToRefs(store)
const { loading } = useInitialLoad()

const accountId = computed(() => String(route.params.accountId))

// ── Tab, in the URL ──────────────────────────────────────────────────
const tab = ref(route.query.tab === 'mine' ? 'mine' : 'library')
const tabs = computed(() => [
  { label: 'Library', key: 'library', count: LANDING_TEMPLATES.length },
  { label: 'My templates', key: 'mine', count: savedTemplates.value.length },
])

// ── Library search + facets ──────────────────────────────────────────
function queryList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  return typeof value === 'string' && value ? value.split(',') : []
}

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const facetFilter = ref<string[]>(queryList(route.query.facets))
const mineSearch = ref('')
const selectedFolderId = ref<string | null>(
  typeof route.query.folder === 'string' && route.query.folder ? route.query.folder : null,
)

watch([tab, search, facetFilter, selectedFolderId], () => {
  const query: Record<string, string> = {}
  if (tab.value !== 'library') query.tab = tab.value
  if (tab.value === 'library') {
    if (search.value.trim()) query.q = search.value.trim()
    if (facetFilter.value.length) query.facets = facetFilter.value.join(',')
  } else if (selectedFolderId.value) {
    query.folder = selectedFolderId.value
  }
  void router.replace({ query })
}, { deep: true })

const facetCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const facet of LANDING_FACETS) {
    counts[facet.value] = LANDING_TEMPLATES.filter(t => t.facets.includes(facet.value)).length
  }
  return counts
})

function facetsOfGroup(group: string) {
  return LANDING_FACETS.filter(f => f.group === group)
}

function toggleFacet(value: string) {
  facetFilter.value = facetFilter.value.includes(value)
    ? facetFilter.value.filter(v => v !== value)
    : [...facetFilter.value, value]
}

function facetLabel(value: string) {
  return LANDING_FACETS.find(f => f.value === value)?.label ?? value
}

/**
 * The source combines facets with OR — ticking `Fashion` and `Christmas` returns
 * everything in either. That behaviour is kept, and the drawer says so.
 */
const filteredTemplates = computed(() => {
  const term = search.value.trim().toLowerCase()
  return LANDING_TEMPLATES.filter((t) => {
    if (facetFilter.value.length && !t.facets.some(f => facetFilter.value.includes(f))) return false
    if (!term) return true
    const haystack = `${t.name} ${t.description} ${t.facets.map(facetLabel).join(' ')}`.toLowerCase()
    return haystack.includes(term)
  })
})

const libraryActiveFilters = computed(() =>
  facetFilter.value.length
    ? [{ key: 'facets', label: `Categories: ${facetFilter.value.map(facetLabel).join(', ')}` }]
    : [],
)

function clearLibraryFilters() {
  search.value = ''
  facetFilter.value = []
}

/** Two or three chips is enough to place a template; the rest are searchable. */
function visibleFacets(t: LandingTemplate) {
  return t.facets.slice(0, 3).map(facetLabel)
}

// ── My templates ─────────────────────────────────────────────────────
const manageFoldersOpen = ref(false)
const landingFolders = computed(() => foldersStore.foldersByScope('landing_pages'))

const templateFolderCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const folder of landingFolders.value) {
    const ids = [folder.id, ...foldersStore.childrenOf(folder.id).map(f => f.id)]
    counts[folder.id] = savedTemplates.value.filter(t => t.folderId && ids.includes(t.folderId)).length
  }
  return counts
})

function folderName(id: string | null) {
  return foldersStore.getFolder(id)?.name ?? 'Unfiled'
}

const savedRows = computed(() => {
  const term = mineSearch.value.trim().toLowerCase()
  const folderIds = selectedFolderId.value
    ? [selectedFolderId.value, ...foldersStore.childrenOf(selectedFolderId.value).map(f => f.id)]
    : null
  return savedTemplates.value.filter((t) => {
    if (folderIds && !(t.folderId && folderIds.includes(t.folderId))) return false
    return !term || t.name.toLowerCase().includes(term)
  })
})

const mineActiveFilters = computed(() =>
  selectedFolderId.value ? [{ key: 'folder', label: `Folder: ${folderName(selectedFolderId.value)}` }] : [],
)

const mineHasFilters = computed(() => Boolean(mineSearch.value.trim()) || selectedFolderId.value !== null)

function clearMineFilters() {
  mineSearch.value = ''
  selectedFolderId.value = null
}

const savedHeaders = [
  { title: 'Name', key: 'name', sortable: true, minWidth: '220px' },
  { title: 'Updated At', key: 'updatedAt', sortable: true, minWidth: '170px' },
  { title: 'Created At', key: 'createdAt', sortable: true, minWidth: '170px' },
  { title: '', key: 'actions', sortable: false, width: 56 },
]

function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date} at ${time}`
}

// ── Choosing a starting point ────────────────────────────────────────
// UAT: template → Select Builder → editor. The choice of template is carried in
// the URL so the builder step can name it and seed the page from it.
function goToBuilder(templateId?: string) {
  void router.push({
    name: 'LandingPageBuilderChooser',
    params: { accountId: accountId.value },
    query: templateId ? { template: templateId } : {},
  })
}

// ── Saved-template row actions ───────────────────────────────────────
const moveTarget = ref<LandingTemplateRecord | null>(null)
const moveOpen = computed({
  get: () => moveTarget.value !== null,
  set: (open: boolean) => { if (!open) moveTarget.value = null },
})

function onMove(folderId: string | null) {
  if (!moveTarget.value) return
  store.moveTemplateToFolder(moveTarget.value.id, folderId)
  toast.success(`“${moveTarget.value.name}” moved to ${folderName(folderId)}`)
}

const pendingDelete = ref<LandingTemplateRecord | null>(null)
// Held separately: the dialog outlives its target by one close transition, and
// reading the name off a cleared target renders "undefined" mid-fade.
const deleteLabel = ref('')
const deleteOpen = computed({
  get: () => pendingDelete.value !== null,
  set: (open: boolean) => { if (!open) pendingDelete.value = null },
})

function askDelete(template: LandingTemplateRecord) {
  deleteLabel.value = template.name
  pendingDelete.value = template
}

function doDelete() {
  if (!pendingDelete.value) return
  store.removeTemplates([pendingDelete.value.id])
  toast.success(`“${pendingDelete.value.name}” deleted`)
  pendingDelete.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Marketing · Acquisition"
      title="Select template"
      subtitle="Pick a starting point for your new landing page — you choose the builder next"
      :back-to="{ name: 'LandingPages', params: { accountId } }"
    >
      <template #actions>
        <!-- One label for one action. The source calls it START DESIGNING on the
             Library tab and START FROM SCRATCH in the header of the other. -->
        <v-btn variant="outlined" prepend-icon="file-plus" class="text-none" @click="goToBuilder()">
          Start from scratch
        </v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="tab" :tabs="tabs" aria-label="Template source" controls-id="lpt-panel" />
      </template>
    </MpPageHeader>

    <div id="lpt-panel" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <!-- LIBRARY -->
      <v-card
        v-if="tab === 'library'"
        variant="flat"
        border
        rounded="lg"
        class="flex-grow-1 d-flex flex-column overflow-hidden"
      >
        <MpDataTableToolbar
          v-model:search="search"
          title="Template library"
          filter-title="Categories"
          filter-subtitle="Filters apply as you tick them"
          search-placeholder="Search templates"
          :total-count="filteredTemplates.length"
          :active-filters="libraryActiveFilters"
          @remove-filter="facetFilter = []"
          @clear-filters="clearLibraryFilters"
        >
          <template #filter-content>
            <p class="text-body-2 text-medium-emphasis ma-0">
              Templates matching <strong>any</strong> ticked category are shown. Ticking
              more categories widens the results rather than narrowing them.
            </p>

            <MpFormField
              v-for="group in LANDING_FACET_GROUPS"
              :key="group.key"
              :label="group.label"
            >
              <!-- Dense facet panel: compact and detail-free on purpose, so a
                   12-option group can't push the drawer past the viewport. -->
              <v-checkbox
                v-for="facet in facetsOfGroup(group.key)"
                :key="facet.value"
                :label="`${facet.label} (${facetCounts[facet.value]})`"
                :model-value="facetFilter.includes(facet.value)"
                density="compact"
                hide-details
                class="lpt-facet"
                @update:model-value="toggleFacet(facet.value)"
              />
            </MpFormField>
          </template>
        </MpDataTableToolbar>

        <div class="lpt-gallery flex-grow-1 overflow-y-auto pa-6">
          <MpEmptyState
            v-if="!filteredTemplates.length"
            icon="search-x"
            title="No templates match your categories"
            description="Categories widen the results rather than narrowing them, so clearing one usually helps. You can also start from a blank page."
            action-label="Clear filters"
            class="py-10"
            @action="clearLibraryFilters"
          />

          <v-row v-else dense>
            <!-- The blank card leads the grid, as it does in the source. -->
            <v-col cols="12" sm="6" md="4" lg="3">
              <MpOptionCard
                :selected="false"
                title="Blank template"
                description="Start from scratch on an empty page."
                icon="file-plus"
                class="h-100"
                @click="goToBuilder()"
              >
                <template #media>
                  <div class="lpt-preview lpt-preview--blank" aria-hidden="true">
                    <v-icon size="24">plus</v-icon>
                  </div>
                </template>
              </MpOptionCard>
            </v-col>

            <v-col v-for="tpl in filteredTemplates" :key="tpl.id" cols="12" sm="6" md="4" lg="3">
              <MpOptionCard
                :selected="false"
                :title="tpl.name"
                :description="tpl.description"
                class="h-100"
                @click="goToBuilder(tpl.id)"
              >
                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip
                    v-for="label in visibleFacets(tpl)"
                    :key="label"
                    size="x-small"
                    variant="tonal"
                    class="flex-shrink-0"
                  >
                    {{ label }}
                  </v-chip>
                </div>
                <template #media>
                  <!-- Fixed aspect ratio, so the grid scans. The source's cards
                       range from 300px to 1660px tall (AUDIT D20).
                       GAP: MpOptionCard anchors `#media` below the body, so the
                       preview sits under the name rather than leading the card —
                       see docs/rebuild/marketing-acquisition/GAPS.md G1. -->
                  <div class="lpt-preview" :class="`lpt-preview--${tpl.accent}`" aria-hidden="true">
                    <span class="lpt-bar lpt-bar--hero" />
                    <span class="lpt-bar" />
                    <span class="lpt-bar lpt-bar--short" />
                    <span class="lpt-bar lpt-bar--cta" />
                  </div>
                </template>
              </MpOptionCard>
            </v-col>
          </v-row>
        </div>
      </v-card>

      <!-- MY TEMPLATES -->
      <v-card
        v-else
        variant="flat"
        border
        rounded="lg"
        class="flex-grow-1 d-flex flex-column overflow-hidden"
      >
        <MpDataTableToolbar
          v-model:search="mineSearch"
          title="My templates"
          search-placeholder="Search saved templates"
          :total-count="savedRows.length"
          :active-filters="mineActiveFilters"
          @remove-filter="selectedFolderId = null"
          @clear-filters="clearMineFilters"
        >
          <template #actions>
            <MpFolderSelect
              v-model="selectedFolderId"
              :folders="landingFolders"
              :counts="templateFolderCounts"
              :total-count="savedTemplates.length"
              @manage="manageFoldersOpen = true"
            />
          </template>
        </MpDataTableToolbar>

        <MpTableSkeleton v-if="loading" :rows="4" :columns="4" />

        <v-data-table
          v-else
          :headers="savedHeaders"
          :items="savedRows"
          item-value="id"
          hover
          density="comfortable"
          fixed-header
          :items-per-page="10"
          class="flex-grow-1"
        >
          <template #item.name="{ item }">
            <button type="button" class="lpt-name" @click="goToBuilder(`saved-${item.id}`)">
              {{ item.name }}
            </button>
            <div v-if="item.folderId && !selectedFolderId" class="text-caption text-medium-emphasis">
              {{ folderName(item.folderId) }}
            </div>
          </template>

          <template #item.updatedAt="{ item }">
            <span class="text-body-2 text-medium-emphasis">{{ formatDateTime(item.updatedAt) }}</span>
          </template>

          <template #item.createdAt="{ item }">
            <span class="text-body-2 text-medium-emphasis">{{ formatDateTime(item.createdAt) }}</span>
          </template>

          <template #item.actions="{ item }">
            <MpRowActionsMenu ariaLabel="Template actions" :item-label="item.name">
              <MpMenuItem title="Create new page" icon="file-plus" @click="goToBuilder(`saved-${item.id}`)" />
              <MpMenuItem title="Move to folder…" icon="folder-input" @click="moveTarget = item" />
              <v-divider class="my-1" />
              <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete(item)" />
            </MpRowActionsMenu>
          </template>

          <template #no-data>
            <MpEmptyState
              v-if="mineHasFilters"
              icon="search-x"
              title="No saved templates match your filters"
              description="Try a different search term, or switch back to all folders."
              action-label="Clear filters"
              class="py-10"
              @action="clearMineFilters"
            />
            <MpEmptyState
              v-else
              icon="layout-template"
              title="No saved templates yet"
              description="Save any landing page as a template from the editor’s overflow menu and it shows up here for reuse."
              action-label="Browse the library"
              action-icon="layout-template"
              class="py-10"
              @action="tab = 'library'"
            />
          </template>
        </v-data-table>
      </v-card>
    </div>

    <MpManageFoldersDrawer
      v-model="manageFoldersOpen"
      scope="landing_pages"
      :counts="templateFolderCounts"
      @deleted="store.reassignFolder"
    />

    <MpMoveToFolderDialog
      v-model="moveOpen"
      scope="landing_pages"
      :current-folder-id="moveTarget?.folderId ?? null"
      :item-label="moveTarget?.name"
      @move="onMove"
    />

    <MpConfirmDialog
      v-model="deleteOpen"
      :title="`Delete “${deleteLabel}”?`"
      message="The saved template is removed. Landing pages already created from it are not affected."
      confirm-label="Delete template"
      danger
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
/* One fixed-ratio preview strip per card — the whole point of the rebuild's
   gallery is that the grid scans at a glance. */
.lpt-preview {
  aspect-ratio: 16 / 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-6);
  padding: var(--mp-component-card-paddingCompact);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.lpt-preview--primary { color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), 0.06); }
.lpt-preview--info { color: rgb(var(--v-theme-info)); background: rgba(var(--v-theme-info), 0.08); }
.lpt-preview--success { color: rgb(var(--v-theme-success)); background: rgba(var(--v-theme-success), 0.08); }
.lpt-preview--warning { color: rgb(var(--v-theme-warning)); background: rgba(var(--v-theme-warning), 0.10); }
.lpt-preview--error { color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), 0.08); }
.lpt-preview--secondary { color: rgb(var(--v-theme-secondary)); background: rgba(var(--v-theme-secondary), 0.08); }

.lpt-preview--blank {
  color: var(--text-muted);
  background: var(--surface-canvas);
}

.lpt-bar {
  width: 70%;
  height: var(--mp-space-6);
  border-radius: var(--mp-radius-full);
  background: currentColor;
  opacity: 0.3;
}

.lpt-bar--hero {
  width: 46%;
  height: var(--mp-space-10);
  opacity: 0.5;
  margin-bottom: var(--mp-space-2);
}

.lpt-bar--short { width: 52%; }

.lpt-bar--cta {
  width: 34%;
  height: var(--mp-space-8);
  opacity: 0.65;
  margin-top: var(--mp-space-4);
}

.lpt-facet :deep(.v-label) {
  font-size: var(--mp-fontSize-13);
}

.lpt-name {
  color: rgb(var(--v-theme-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
  text-align: left;
}

.lpt-name:hover {
  text-decoration: underline;
}
</style>
