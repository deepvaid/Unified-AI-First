<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const store = useMerchandisingStore()
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

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

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
    showToast('Add at least one query and a destination URL.')
    return
  }
  store.createRedirect({ queries: [...draftQueries.value], leadsTo: draftUrl.value.trim() })
  showToast('Page redirect created')
  resetDraft()
}

function deleteRow(id: string) {
  store.deleteRedirect(id)
  showToast('Page redirect deleted')
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
          <div class="text-subtitle-2 font-weight-bold">Create new page redirect</div>
          <div class="text-caption text-medium-emphasis mt-1">
            Type a query and press Enter to add it as a chip. Add multiple queries to trigger the same redirect.
          </div>
        </div>
        <v-btn
          icon="chevron-down"
          variant="text"
          size="small"
          :aria-label="createOpen ? 'Collapse form' : 'Expand form'"
          :style="{ transform: createOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
          @click="createOpen = !createOpen"
        />
      </div>

      <v-expand-transition>
        <div v-show="createOpen" class="merch-create__body">
          <div class="merch-create__grid">
            <div>
              <label class="merch-create__label">Queries</label>
              <v-text-field
                v-model="draftQueryInput"
                placeholder="Type a query, then press Enter"
                density="comfortable"
                variant="outlined"
                hide-details
                prepend-inner-icon="search"
                @keydown.enter.prevent="addQuery"
              />
              <div v-if="draftQueries.length > 0" class="d-flex flex-wrap gap-1 mt-2">
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
            </div>
            <div>
              <label class="merch-create__label">Lead to URL</label>
              <v-text-field
                v-model="draftUrl"
                placeholder="https://your-store.com/page"
                density="comfortable"
                variant="outlined"
                hide-details
                prepend-inner-icon="link"
              />
            </div>
          </div>

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
      <div class="merch-table__header">
        <div class="text-subtitle-2 font-weight-bold">All page redirects</div>
        <v-text-field
          v-model="search"
          placeholder="Search queries or URLs…"
          density="comfortable"
          variant="outlined"
          hide-details
          prepend-inner-icon="search"
          max-width="320"
        />
      </div>

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
            class="merch-link text-body-2"
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
          <v-menu>
            <template #activator="{ props: activator }">
              <v-btn
                v-bind="activator"
                icon="more-vertical"
                variant="text"
                size="x-small"
                color="medium-emphasis"
                aria-label="Row actions"
              />
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item prepend-icon="pencil" title="Edit" @click="showToast('Edit — coming soon')" />
              <v-list-item prepend-icon="copy" title="Duplicate" @click="showToast('Duplicated')" />
              <v-divider />
              <v-list-item prepend-icon="trash-2" title="Delete" class="text-error" @click="deleteRow(item.id)" />
            </v-list>
          </v-menu>
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

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped lang="scss">
.merch-create__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px 22px;
}

.merch-create__body {
  padding: 0 22px 22px 22px;
}

.merch-create__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 720px) {
  .merch-create__grid {
    grid-template-columns: 1fr;
  }
}

.merch-create__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 6px;
}

.merch-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.merch-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  max-width: 420px;
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
