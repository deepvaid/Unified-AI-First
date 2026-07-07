<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/useContent'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
const router = useRouter()
const content = useContentStore()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'TransactionalEmail', params: { accountId: accountId.value } }))

const name = ref('')
const subject = ref('')
const fromName = ref('Maropost Store')
const fromEmail = ref('hello@maropoststore.com')
const language = ref('English (US)')
const contentId = ref<number | null>(null)
const previewText = ref('')
const saved = ref(false)

const LANGUAGES = ['English (US)', 'English (UK)', 'French', 'German', 'Spanish', 'Italian']
const contentOptions = computed(() => content.items.map(i => ({ title: i.name, value: i.id })))

const canCreate = computed(() => name.value.trim() !== '' && subject.value.trim() !== '')

function create() {
  if (!canCreate.value) return
  saved.value = true
  setTimeout(() => router.push(backTo.value), 700)
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="New Transactional Email" subtitle="Triggered emails like receipts, confirmations, and password resets" :back-to="backTo" />

    <div class="flex-grow-1 overflow-y-auto">
      <div class="cte-form mx-auto d-flex flex-column gap-5">
        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Details</div>
          <v-text-field
            v-model="name"
            label="Transactional event name"
            placeholder="e.g. Order Confirmation"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-4"
            :rules="[v => !!v || 'Name is required']"
          />
          <v-text-field
            v-model="subject"
            label="Subject line"
            placeholder="Your order is confirmed 🎉"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-4"
          />
          <v-text-field
            v-model="previewText"
            label="Preview text"
            placeholder="Shown after the subject line in the inbox"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
          />
        </v-card>

        <v-card flat border rounded="lg" class="pa-6">
          <div class="text-subtitle-2 font-weight-bold mb-4">Sender</div>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field v-model="fromName" label="From name" variant="outlined" density="comfortable" rounded="lg" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="fromEmail" label="From address" variant="outlined" density="comfortable" rounded="lg" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="language" label="Language" :items="LANGUAGES" variant="outlined" density="comfortable" rounded="lg" hide-details />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="contentId"
                label="Content template"
                :items="contentOptions"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                placeholder="Choose a saved template"
                hide-details
                clearable
              />
            </v-col>
          </v-row>
        </v-card>
      </div>
    </div>

    <div class="cte-footer d-flex justify-end ga-3 pt-3">
      <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canCreate" prepend-icon="check" @click="create">
        Create transactional email
      </v-btn>
    </div>

    <v-snackbar v-model="saved" color="success" timeout="700" location="bottom right">
      Transactional email created
    </v-snackbar>
  </div>
</template>

<style scoped>
.cte-form {
  width: 100%;
  max-width: 720px;
}
.cte-footer {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
