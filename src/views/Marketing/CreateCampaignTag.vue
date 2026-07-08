<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
const router = useRouter()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'CampaignTags', params: { accountId: accountId.value } }))

const name = ref('')
const description = ref('')
const color = ref('blue')
const saved = ref(false)

// Vuetify named Material colours — resolve independently of the active brand theme.
const COLORS = [
  { key: 'blue', label: 'Blue' },
  { key: 'purple', label: 'Purple' },
  { key: 'green', label: 'Green' },
  { key: 'amber', label: 'Amber' },
  { key: 'red', label: 'Red' },
  { key: 'teal', label: 'Teal' },
]

const canCreate = computed(() => name.value.trim() !== '')

function create() {
  if (!canCreate.value) return
  saved.value = true
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Create Campaign Tag" subtitle="Group and filter campaigns with a colour-coded label" :back-to="backTo" />

    <div class="flex-grow-1 overflow-y-auto">
      <div class="cct-grid mx-auto">
        <!-- Form -->
        <div class="d-flex flex-column gap-5">
          <v-card flat border rounded="lg" class="pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-icon size="18" class="text-medium-emphasis">tag</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Tag details</span>
            </div>
            <v-text-field
              v-model="name"
              label="Tag name"
              placeholder="e.g. Promotions"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              class="mb-4"
              :rules="[v => !!v || 'Name is required']"
            />
            <v-textarea
              v-model="description"
              label="Description (optional)"
              placeholder="What is this tag used for?"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              rows="2"
              auto-grow
              hide-details
            />
          </v-card>

          <v-card flat border rounded="lg" class="pa-6">
            <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-3">Colour</div>
            <div class="d-flex ga-2 flex-wrap">
              <v-btn
                v-for="c in COLORS"
                :key="c.key"
                :color="c.key"
                icon
                size="36"
                variant="flat"
                class="cct-swatch"
                :class="{ 'cct-swatch--active': color === c.key }"
                :aria-label="c.label"
                :aria-pressed="color === c.key"
                @click="color = c.key"
              >
                <v-icon v-if="color === c.key" size="16" color="white">check</v-icon>
              </v-btn>
            </div>
          </v-card>
        </div>

        <!-- Live preview -->
        <aside class="cct-preview">
          <div class="cct-preview__sticky">
            <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">Preview</div>
            <v-card flat border rounded="lg" class="pa-5">
              <div class="d-flex justify-center py-2">
                <v-chip :color="color" size="default" variant="flat">{{ name.trim() || 'Tag name' }}</v-chip>
              </div>
              <p v-if="description.trim()" class="text-caption text-medium-emphasis text-center mb-0 mt-1">{{ description.trim() }}</p>

              <v-divider class="my-4" />

              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">On your campaigns</div>
              <div v-for="ex in ['Summer Sale 2026', 'Welcome Series']" :key="ex" class="cct-ctx">
                <v-icon size="16" class="text-medium-emphasis">mail</v-icon>
                <span class="cct-ctx__name text-truncate">{{ ex }}</span>
                <v-chip :color="color" size="x-small" variant="flat">{{ name.trim() || 'Tag name' }}</v-chip>
              </div>
            </v-card>
          </div>
        </aside>
      </div>
    </div>

    <div class="cct-footer d-flex justify-end ga-3 pt-3">
      <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" prepend-icon="check" @click="create">
        Create tag
      </v-btn>
    </div>

    <v-snackbar v-model="saved" color="success" timeout="700" location="bottom right">
      Campaign tag created
    </v-snackbar>
  </div>
</template>

<style scoped>
.cct-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  max-width: 1040px;
  align-items: start;
}
@media (max-width: 900px) {
  .cct-grid { grid-template-columns: 1fr; }
}
.cct-preview__sticky { position: sticky; top: 0; }
.cct-ctx {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--mp-border-subtle);
}
.cct-ctx__name { flex: 1 1 auto; min-width: 0; font-size: 0.8125rem; font-weight: 500; }
.cct-swatch {
  transition: transform 100ms ease, box-shadow 100ms ease;
}
.cct-swatch--active {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-surface)), 0 0 0 4px rgba(var(--v-theme-on-surface), 0.4);
}
.cct-swatch:hover {
  transform: scale(1.08);
}
.cct-footer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
