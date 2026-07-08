<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
const router = useRouter()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'Surveys', params: { accountId: accountId.value } }))

const name = ref('')
const closeDate = ref('')
const closeTime = ref('17:00')
const quota = ref<number | null>(null)
const buttonText = ref('Submit response')
const headerFile = ref<File[]>([])
const saved = ref(false)

const canCreate = computed(() => name.value.trim() !== '')

function create() {
  if (!canCreate.value) return
  saved.value = true
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <div class="px-8 pt-6 pb-4 bg-surface page-head">
      <MpPageHeader title="Create Survey" subtitle="Collect feedback and structured responses from your audience" :back-to="backTo" />
    </div>

    <div class="flex-grow-1 overflow-y-auto px-8 py-6 bg-background">
      <div class="csv-form mx-auto d-flex flex-column gap-5">
        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Survey details</div>
          <v-text-field
            v-model="name"
            label="Survey name"
            placeholder="e.g. Post-purchase satisfaction"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-4"
            :rules="[v => !!v || 'Name is required']"
          />
          <v-text-field
            v-model="buttonText"
            label="Submit button text"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
          />
        </v-card>

        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Availability</div>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="closeDate" label="Close date" type="date" variant="outlined" density="comfortable" rounded="lg" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="closeTime" label="Close time" type="time" variant="outlined" density="comfortable" rounded="lg" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="quota"
                label="Response quota"
                type="number"
                placeholder="Unlimited"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>

        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Branding</div>
          <v-file-input
            v-model="headerFile"
            label="Header image"
            prepend-icon=""
            prepend-inner-icon="image"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            accept="image/*"
            hide-details
          />
        </v-card>
      </div>
    </div>

    <div class="px-8 py-4 bg-surface page-foot d-flex justify-end ga-3">
      <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" prepend-icon="check" @click="create">
        Create survey
      </v-btn>
    </div>

    <v-snackbar v-model="saved" color="success" timeout="700" location="bottom right">
      Survey created
    </v-snackbar>
  </div>
</template>

<style scoped>
.csv-form {
  width: 100%;
  max-width: 720px;
}
.page-head { border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.page-head :deep(.mp-page-header) { margin-bottom: 0; }
.page-foot { border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
</style>
