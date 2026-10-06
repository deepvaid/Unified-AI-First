<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useToast } from '@/composables/useToast'

// Maropost support is the first contact for Maropay (plan §1). This alert
// carries the references a support agent needs — account, store, payment,
// payout or dispute — instead of a separate support case view. Nothing is
// sent anywhere from the prototype. By default it's a quiet card beside the
// record; `emphasis="prominent"` makes it an alert, for when something is wrong
// (a declined business asking for its decision to be reviewed).

const props = withDefaults(defineProps<{
  references: Array<{ label: string; value: string }>
  title?: string
  message?: string
  emphasis?: 'default' | 'prominent'
}>(), {
  title: 'Need help with this?',
  emphasis: 'default',
  message: 'Maropost support is your first contact for Maropay. Share these references and we can look into it straight away.',
})

const toast = useToast()

const text = computed(() => props.references.map((r) => `${r.label}: ${r.value}`).join('\n'))

async function copyReferences(): Promise<void> {
  try {
    await navigator.clipboard.writeText(text.value)
    toast.success('References copied')
  } catch {
    toast.info(text.value, { title: 'Copy these references' })
  }
}

function contactSupport(): void {
  toast.info('A support request with these references would open here — nothing is sent from the prototype.')
}
</script>

<template>
  <MpAlert v-if="emphasis === 'prominent'" tone="info" icon="life-buoy" :title="title" live="off">
    {{ message }}
    <dl class="mp-label-value mp-label-value--inline maropay-support__refs maropay-support__refs--alert">
      <div v-for="ref in references" :key="ref.label"><dt>{{ ref.label }}</dt><dd>{{ ref.value }}</dd></div>
    </dl>
    <template #actions>
      <v-btn size="small" variant="outlined" class="text-none" prepend-icon="copy" @click="copyReferences">Copy references</v-btn>
      <v-btn size="small" variant="text" class="text-none" @click="contactSupport">Contact support</v-btn>
    </template>
  </MpAlert>

  <v-card v-else flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader icon="life-buoy" :title="title" :description="message" :heading-level="2" />
    <dl class="mp-label-value mp-label-value--inline maropay-support__refs">
      <div v-for="ref in references" :key="ref.label"><dt>{{ ref.label }}</dt><dd>{{ ref.value }}</dd></div>
    </dl>
    <div class="maropay-support__actions">
      <v-btn size="small" variant="outlined" class="text-none" prepend-icon="copy" @click="copyReferences">Copy references</v-btn>
      <v-btn size="small" variant="text" class="text-none" @click="contactSupport">Contact support</v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.maropay-support__refs {
  gap: var(--mp-space-6) var(--mp-space-16);
}

.maropay-support__refs dd {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-regular);
  font-variant-numeric: tabular-nums;
}

/* On the alert's container fill, labels and values take the alert's own ink. */
.maropay-support__refs--alert {
  margin-top: var(--mp-space-8);
}

.maropay-support__refs--alert dt,
.maropay-support__refs--alert dd {
  color: inherit;
}

.maropay-support__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
  margin-top: var(--mp-space-16);
}
</style>
