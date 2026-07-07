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
      <div class="cct-form mx-auto d-flex flex-column gap-5">
        <v-card flat border rounded="lg" class="pa-6">
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
            class="mb-4"
            hide-details
          />
          <div class="text-caption text-uppercase text-medium-emphasis font-weight-medium mb-2">Colour</div>
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

        <v-card flat border rounded="lg" class="pa-5 d-flex align-center ga-3">
          <span class="text-body-2 text-medium-emphasis">Preview:</span>
          <v-chip :color="color" size="small" variant="flat">{{ name.trim() || 'Tag name' }}</v-chip>
        </v-card>
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
.cct-form {
  width: 100%;
  max-width: 560px;
}
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
