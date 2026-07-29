<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useMerchandisingStore, type MerchBanner, type MerchPromoScope } from '@/stores/useMerchandising'

const route = useRoute()
const store = useMerchandisingStore()

// Same component instance serves both routes — everything scope-derived is computed.
const scope = computed<MerchPromoScope>(() =>
  route.meta.merchScope === 'collections' ? 'collections' : 'search',
)
const scopeLabel = computed(() => (scope.value === 'collections' ? 'Smart collections' : 'Search results'))
const termsLabel = computed(() => (scope.value === 'collections' ? 'Collections' : 'Search terms'))
const termsHint = computed(() =>
  scope.value === 'collections'
    ? 'Collections where this banner appears — press Enter to add'
    : 'Search terms that trigger this banner — press Enter to add',
)

const banners = computed(() => store.bannerList.filter((b) => b.scope === scope.value))

const snackbar = ref({ visible: false, message: '' })
function showToast(message: string) {
  snackbar.value = { visible: true, message }
}

/* — Create drawer — */
const drawer = ref(false)
const form = ref<{ title: string; imageLabel: string; targetUrl: string; terms: string[] }>({ title: '', imageLabel: '', targetUrl: '', terms: [] })
const canSave = computed(() =>
  form.value.title.trim() !== '' && form.value.imageLabel.trim() !== '' && form.value.targetUrl.trim() !== '',
)

function openCreate() {
  form.value = { title: '', imageLabel: '', targetUrl: '', terms: [] }
  drawer.value = true
}

function save() {
  if (!canSave.value) return
  store.createBanner({
    scope: scope.value,
    title: form.value.title.trim(),
    imageLabel: form.value.imageLabel.trim(),
    targetUrl: form.value.targetUrl.trim(),
    terms: form.value.terms,
  })
  drawer.value = false
  showToast('Banner created')
}

/* — Delete — */
const confirmDelete = ref(false)
const pendingDelete = ref<MerchBanner | null>(null)

function askDelete(banner: MerchBanner) {
  pendingDelete.value = banner
  confirmDelete.value = true
}

function doDelete() {
  if (!pendingDelete.value) return
  store.deleteBanner(pendingDelete.value.id)
  pendingDelete.value = null
  showToast('Banner deleted')
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Banners"
      :subtitle="`Clickable banners shown in ${scopeLabel.toLowerCase()} for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openCreate">
          Create banner
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card v-if="banners.length === 0" flat border rounded="lg" class="pa-6">
      <MpEmptyState
        icon="tags"
        title="No banners yet"
        :description="`Create a banner to promote a destination inside ${scopeLabel.toLowerCase()}.`"
        action-label="Create banner"
        action-icon="plus"
        @action="openCreate"
      />
    </v-card>

    <div v-else class="banner-grid">
      <v-card v-for="banner in banners" :key="banner.id" flat border rounded="lg" class="banner-card">
        <div class="banner-card__art">
          <v-icon size="22" color="primary">tags</v-icon>
          <span class="text-caption font-weight-medium text-primary text-center px-3">{{ banner.imageLabel }}</span>
        </div>
        <div class="pa-4">
          <div class="text-body-2 font-weight-bold text-truncate" :title="banner.title">{{ banner.title }}</div>
          <div class="banner-card__url text-caption text-medium-emphasis mt-1" :title="banner.targetUrl">
            {{ banner.targetUrl }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Updated {{ banner.updatedAt }}</div>
          <div class="d-flex align-center mt-3">
            <v-switch
              :model-value="banner.status === 'active'"
              color="success"
              density="compact"
              hide-details
              :aria-label="`Toggle ${banner.title}`"
              @update:model-value="store.toggleBanner(banner.id)"
            />
            <span
              class="text-caption font-weight-medium ml-2"
              :class="banner.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ banner.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
            <v-spacer />
            <v-btn
              icon="trash-2"
              variant="text"
              size="x-small"
              class="text-medium-emphasis"
              :aria-label="`Delete ${banner.title}`"
              @click="askDelete(banner)"
            />
          </div>
        </div>
      </v-card>
    </div>

    <MpFormDrawer v-model="drawer" title="Create banner" :subtitle="`Shown in ${scopeLabel.toLowerCase()}`">
      <div class="d-flex flex-column gap-4">
        <v-text-field
          v-model="form.title"
          label="Title"
          placeholder="e.g. Free shipping over $75"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-text-field
          v-model="form.imageLabel"
          label="Image label"
          placeholder="Describes the banner artwork"
          variant="outlined"
          density="comfortable"
          hint="Stands in for the artwork upload in this prototype"
          persistent-hint
        />
        <v-text-field
          v-model="form.targetUrl"
          label="Target URL"
          placeholder="https://yourstore.com/pages/promo"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-combobox
          v-model="form.terms"
          :label="termsLabel"
          :hint="termsHint"
          persistent-hint
          variant="outlined"
          density="comfortable"
          multiple
          chips
          closable-chips
        />
        <div class="text-caption text-medium-emphasis">
          Placement: {{ scopeLabel }} — preset from the current section.
        </div>
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete banner?"
      :message="`“${pendingDelete?.title ?? ''}” will be removed from ${scopeLabel.toLowerCase()}. This can't be undone.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.banner-card__art {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 3 / 1;
  background: rgba(var(--v-theme-primary), 0.06);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.banner-card__url {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
