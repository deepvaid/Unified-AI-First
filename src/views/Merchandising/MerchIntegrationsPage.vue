<script setup lang="ts">
import { ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import { useMerchandisingStore } from '@/stores/useMerchandising'

const store = useMerchandisingStore()

interface ReviewProvider {
  id: string
  name: string
  description: string
}

const PROVIDERS: ReviewProvider[] = [
  { id: 'yotpo', name: 'Yotpo', description: 'Sync Yotpo review ratings into search and collection ranking.' },
  { id: 'stamped', name: 'Stamped', description: 'Import Stamped ratings to boost highly reviewed products.' },
  { id: 'lipscore', name: 'Lipscore', description: 'Use Lipscore review data in relevance and merchandising rules.' },
  { id: 'reviewsio', name: 'Reviews.io', description: 'Bring Reviews.io ratings into product ranking signals.' },
  { id: 'custom', name: 'Custom', description: 'Connect your own review source through product feed fields.' },
]

const connectedIds = ref<string[]>([])

const snackbar = ref({ visible: false, message: '' })

function toggleProvider(id: string) {
  if (connectedIds.value.includes(id)) {
    connectedIds.value = connectedIds.value.filter((c) => c !== id)
    snackbar.value = { visible: true, message: 'Disconnected — prototype only' }
  } else {
    connectedIds.value = [...connectedIds.value, id]
    snackbar.value = { visible: true, message: 'Connected — prototype only' }
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Integrations"
      :subtitle="`Enrich merchandising with third-party data for ${store.activeStore.domain}`"
    />

    <div>
      <h2 class="text-subtitle-1 font-weight-bold mb-1">Rating &amp; Reviews</h2>
      <p class="text-caption text-medium-emphasis mb-4">
        Feed review ratings into ranking so highly rated products surface first.
      </p>
      <v-row dense>
        <v-col v-for="provider in PROVIDERS" :key="provider.id" cols="12" sm="6" md="4">
          <v-card flat border rounded="lg" class="pa-5 h-100 d-flex flex-column">
            <div class="d-flex align-center ga-3 mb-3">
              <v-avatar size="40" color="warning" variant="tonal" rounded="lg">
                <v-icon size="20">star</v-icon>
              </v-avatar>
              <div class="text-subtitle-2 font-weight-bold">{{ provider.name }}</div>
            </div>
            <p class="text-body-2 text-medium-emphasis flex-grow-1 mb-4">{{ provider.description }}</p>
            <v-btn
              variant="outlined"
              class="text-none align-self-start"
              :color="connectedIds.includes(provider.id) ? 'success' : 'primary'"
              :prepend-icon="connectedIds.includes(provider.id) ? 'check' : 'plug'"
              @click="toggleProvider(provider.id)"
            >
              {{ connectedIds.includes(provider.id) ? 'Connected' : 'Integrate' }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-snackbar v-model="snackbar.visible" :timeout="2000" location="bottom">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>
