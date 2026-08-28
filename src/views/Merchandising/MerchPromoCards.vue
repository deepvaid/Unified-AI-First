<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { useMerchandisingStore, type MerchPromoScope, type PromoCard } from '@/stores/useMerchandising'

const route = useRoute()
const store = useMerchandisingStore()
const toast = useToast()

// Same component instance serves both routes — everything scope-derived is computed.
const scope = computed<MerchPromoScope>(() =>
  route.meta.merchScope === 'collections' ? 'collections' : 'search',
)
const scopeLabel = computed(() => (scope.value === 'collections' ? 'Smart collections' : 'Search results'))
const termsLabel = computed(() => (scope.value === 'collections' ? 'Collections' : 'Search terms'))
const termsHint = computed(() =>
  scope.value === 'collections'
    ? 'Collections where this card appears — press Enter to add'
    : 'Search terms that trigger this card — press Enter to add',
)

const cards = computed(() => store.promoCardList.filter((c) => c.scope === scope.value))

/* — Create drawer — */
const drawer = ref(false)
const form = ref<{ title: string; imageLabel: string; terms: string[] }>({ title: '', imageLabel: '', terms: [] })
const canSave = computed(() => form.value.title.trim() !== '' && form.value.imageLabel.trim() !== '')

function openCreate() {
  form.value = { title: '', imageLabel: '', terms: [] }
  drawer.value = true
}

function save() {
  if (!canSave.value) return
  store.createPromoCard({
    scope: scope.value,
    title: form.value.title.trim(),
    imageLabel: form.value.imageLabel.trim(),
    terms: form.value.terms,
  })
  drawer.value = false
  toast.info('Promo card created')
}

/* — Delete — */
const confirmDelete = ref(false)
const pendingDelete = ref<PromoCard | null>(null)

function askDelete(card: PromoCard) {
  pendingDelete.value = card
  confirmDelete.value = true
}

function doDelete() {
  if (!pendingDelete.value) return
  store.deletePromoCard(pendingDelete.value.id)
  pendingDelete.value = null
  toast.info('Promo card deleted')
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Promo Cards"
      :subtitle="`Promotional cards injected into ${scopeLabel.toLowerCase()} for ${store.activeStore.domain}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="plus" @click="openCreate">
          Create promo card
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card v-if="cards.length === 0" flat border rounded="lg" class="pa-6">
      <MpEmptyState
        icon="tags"
        title="No promo cards yet"
        :description="`Create a promo card to highlight promotions inside ${scopeLabel.toLowerCase()}.`"
        action-label="Create promo card"
        action-icon="plus"
        @action="openCreate"
      />
    </v-card>

    <div v-else class="promo-grid">
      <v-card v-for="card in cards" :key="card.id" flat border rounded="lg" class="promo-card">
        <div class="promo-card__art">
          <v-icon size="22" color="primary">tags</v-icon>
          <span class="text-caption font-weight-medium text-primary text-center px-3">{{ card.imageLabel }}</span>
        </div>
        <div class="pa-4">
          <div class="text-body-2 font-weight-bold text-truncate" :title="card.title">{{ card.title }}</div>
          <div class="text-caption text-medium-emphasis mt-1">Updated {{ card.updatedAt }}</div>
          <!-- Card-row switch: `hide-details` is deliberate so the row stays one line tall. -->
          <div class="d-flex align-center mt-3">
            <v-switch
              :model-value="card.status === 'active'"
              color="success"
              density="compact"
              hide-details
              :aria-label="`Toggle ${card.title}`"
              @update:model-value="store.togglePromoCard(card.id)"
            />
            <span
              class="text-caption font-weight-medium ml-2"
              :class="card.status === 'active' ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ card.status === 'active' ? 'Active' : 'Inactive' }}
            </span>
            <v-spacer />
            <v-btn
              icon="trash-2"
              variant="text"
              size="x-small"
              class="text-medium-emphasis"
              :aria-label="`Delete ${card.title}`"
              @click="askDelete(card)"
            />
          </div>
        </div>
      </v-card>
    </div>

    <MpFormDrawer v-model="drawer" title="Create promo card" :subtitle="`Shown in ${scopeLabel.toLowerCase()}`">
      <MpFormGrid>
        <v-text-field
          v-model="form.title"
          label="Title *"
          placeholder="e.g. Summer sale — up to 40% off"
        />
        <v-text-field
          v-model="form.imageLabel"
          label="Image label *"
          placeholder="Describes the card artwork"
          hint="Stands in for the artwork upload in this prototype"
          persistent-hint
        />
        <v-combobox
          v-model="form.terms"
          :label="termsLabel"
          :hint="termsHint"
          persistent-hint
          multiple
          chips
          closable-chips
        />
        <div class="text-caption text-medium-emphasis">
          Placement: {{ scopeLabel }} — preset from the current section.
        </div>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save</v-btn>
      </template>
    </MpFormDrawer>

    <MpConfirmDialog
      v-model="confirmDelete"
      title="Delete promo card?"
      :message="`“${pendingDelete?.title ?? ''}” will be removed from ${scopeLabel.toLowerCase()}. This can't be undone.`"
      confirm-label="Delete"
      danger
      @confirm="doDelete"
    />

  </div>
</template>

<style scoped>
.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.promo-card__art {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 4 / 3;
  background: rgba(var(--v-theme-primary), 0.06);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
