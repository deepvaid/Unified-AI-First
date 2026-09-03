<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import { useToast } from '@/composables/useToast'
import { useMerchandisingStore, type PageRedirect } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
const toast = useToast()
const createOpen = ref(true)
const draftQueries = ref<string[]>([])
const draftQueryInput = ref('')
const draftUrl = ref('')

const search = ref('')

const headers = [
  { title: 'Queries', key: 'queries', sortable: false },
  { title: 'Lead to URL', key: 'leadsTo', sortable: false },
  { title: 'Updated', key: 'updatedAt', sortable: true, align: 'end' as const, width: 160 },
  { title: '', key: 'actions', sortable: false, width: 64 },
]

const filteredRedirects = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.redirectList
  return store.redirectList.filter(
    (r) =>
      r.queries.some((qq) => qq.toLowerCase().includes(q)) ||
      r.leadsTo.toLowerCase().includes(q),
  )
})

function addQuery() {
  const trimmed = draftQueryInput.value.trim()
  if (!trimmed || draftQueries.value.includes(trimmed)) {
    draftQueryInput.value = ''
    return
  }
  draftQueries.value.push(trimmed)
  draftQueryInput.value = ''
}

function removeQuery(q: string) {
  draftQueries.value = draftQueries.value.filter((x) => x !== q)
}

function resetDraft() {
  draftQueries.value = []
  draftQueryInput.value = ''
  draftUrl.value = ''
}

function createRedirect() {
  if (draftQueries.value.length === 0 || !draftUrl.value.trim()) {
    toast.error('Add at least one query and a destination URL.')
    return
  }
  store.createRedirect({ queries: [...draftQueries.value], leadsTo: draftUrl.value.trim() })
  toast.info('Page redirect created')
  resetDraft()
}

function deleteRow(id: string) {
  store.deleteRedirect(id)
  toast.info('Page redirect deleted')
}

function duplicate(item: PageRedirect) {
  const copy = store.duplicateRedirect(item.id)
  if (copy) toast.info('Page redirect duplicated')
}

/* ── Edit drawer ───────────────────────────────────────────────── */
const editDrawer = ref(false)
const editTarget = ref<PageRedirect | null>(null)
const editQueries = ref<string[]>([])
const editQueryInput = ref('')
const editUrl = ref('')

function openEdit(item: PageRedirect) {
  editTarget.value = item
  editQueries.value = [...item.queries]
  editUrl.value = item.leadsTo
  editQueryInput.value = ''
  editDrawer.value = true
}

function addEditQuery() {
  const trimmed = editQueryInput.value.trim()
  if (!trimmed || editQueries.value.includes(trimmed)) {
    editQueryInput.value = ''
    return
  }
  editQueries.value.push(trimmed)
  editQueryInput.value = ''
}

function removeEditQuery(q: string) {
  editQueries.value = editQueries.value.filter((x) => x !== q)
}

function submitEdit() {
  if (!editTarget.value) return
  if (editQueries.value.length === 0 || !editUrl.value.trim()) {
    toast.error('Add at least one query and a destination URL.')
    return
  }
  store.saveRedirect(editTarget.value.id, { queries: [...editQueries.value], leadsTo: editUrl.value.trim() })
  editDrawer.value = false
  toast.info('Page redirect updated')
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Page Redirects"
      :subtitle="`Send shoppers to specific pages when they search for known queries on ${store.activeStore.domain}`"
    />

    <!-- Create panel (a proper card, not a raw form) -->
    <v-card flat border rounded="lg">
      <div class="merch-create__header">
        <div>
          <h2 class="mp-section-title">Create new page redirect</h2>
          <div class="text-caption text-medium-emphasis mt-1">
            Type a query and press Enter to add it as a chip. Add multiple queries to trigger the same redirect.
          </div>
        </div>
        <v-tooltip :text="createOpen ? 'Collapse form' : 'Expand form'" location="bottom">
          <template #activator="{ props: tooltip }">
            <v-btn
              v-bind="tooltip"
              icon="chevron-down"
              variant="text"
              size="small"
              :aria-label="createOpen ? 'Collapse form' : 'Expand form'"
              :aria-expanded="createOpen"
              :style="{ transform: createOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
              @click="createOpen = !createOpen"
            />
          </template>
        </v-tooltip>
      </div>

      <v-expand-transition>
        <div v-show="createOpen" class="merch-create__body">
          <MpFormGrid :cols="2">
            <v-text-field
              v-model="draftQueryInput"
              label="Queries *"
              hint="Type a query, then press Enter"
              persistent-hint
              prepend-inner-icon="search"
              @keydown.enter.prevent="addQuery"
            />
            <v-text-field
              v-model="draftUrl"
              label="Lead to URL *"
              placeholder="https://your-store.com/page"
              prepend-inner-icon="link"
            />
            <div v-if="draftQueries.length > 0" class="mp-form-grid__full d-flex flex-wrap gap-1">
              <v-chip
                v-for="q in draftQueries"
                :key="q"
                size="small"
                variant="tonal"
                color="default"
                closable
                @click:close="removeQuery(q)"
              >
                {{ q }}
              </v-chip>
            </div>
          </MpFormGrid>

          <div class="d-flex justify-end gap-2 mt-5">
            <v-btn variant="outlined" class="text-none" @click="resetDraft">Close</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="createRedirect">
              Create
            </v-btn>
          </div>
        </div>
      </v-expand-transition>
    </v-card>

    <!-- Table -->
    <v-card flat border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="All page redirects"
        search-placeholder="Search queries or URLs…"
        :total-count="filteredRedirects.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredRedirects"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="20"
        fixed-header
        class="flex-grow-1"
      >
        <template #item.queries="{ item }">
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="q in item.queries"
              :key="q"
              size="x-small"
              variant="tonal"
              color="default"
              class="font-weight-medium"
            >
              {{ q }}
            </v-chip>
          </div>
        </template>

        <template #item.leadsTo="{ item }">
          <a
            class="merch-link text-body-2 text-primary"
            :href="item.leadsTo"
            target="_blank"
            rel="noopener noreferrer"
            :title="item.leadsTo"
          >
            {{ item.leadsTo }}
          </a>
        </template>

        <template #item.updatedAt="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.updatedAt }}</span>
        </template>

        <template #item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Page redirect actions">
            <MpMenuItem icon="pencil" title="Edit" @click="openEdit(item)" />
            <MpMenuItem icon="copy" title="Duplicate" @click="duplicate(item)" />
            <v-divider class="my-1" />
            <MpMenuItem icon="trash-2" title="Delete" danger @click="deleteRow(item.id)" />
          </MpRowActionsMenu>
        </template>

        <template #no-data>
          <MpEmptyState
            icon="arrow-right"
            title="No page redirects yet"
            description="Send shoppers to landing pages, sale pages, or FAQs when they search for specific terms."
          />
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit redirect drawer -->
    <MpFormDrawer v-model="editDrawer" title="Edit page redirect" subtitle="Update the queries and destination URL">
      <MpFormGrid>
        <v-text-field
          v-model="editQueryInput"
          label="Queries *"
          hint="Type a query, then press Enter"
          persistent-hint
          prepend-inner-icon="search"
          @keydown.enter.prevent="addEditQuery"
        />
        <div v-if="editQueries.length > 0" class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="q in editQueries"
            :key="q"
            size="small"
            variant="tonal"
            color="default"
            closable
            @click:close="removeEditQuery(q)"
          >
            {{ q }}
          </v-chip>
        </div>
        <v-text-field
          v-model="editUrl"
          label="Lead to URL *"
          placeholder="https://your-store.com/page"
          prepend-inner-icon="link"
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="editDrawer = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          :disabled="editQueries.length === 0 || !editUrl.trim()"
          @click="submitEdit"
        >
          Save changes
        </v-btn>
      </template>
    </MpFormDrawer>

  </div>
</template>

<style scoped lang="scss">
/* Card insets on component.card.*: the header band and the body share one
   inline inset; the body's top inset is the header's gap below the caption. */
.merch-create__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-component-card-gap);
  padding: var(--mp-component-card-padding) var(--mp-component-card-padding) var(--mp-component-card-gap);
}

.merch-create__body {
  padding: 0 var(--mp-component-card-padding) var(--mp-component-card-padding);
}

.merch-link {
  text-decoration: none;
  max-width: var(--mp-component-state-measure);
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.merch-link:hover {
  text-decoration: underline;
}
</style>
