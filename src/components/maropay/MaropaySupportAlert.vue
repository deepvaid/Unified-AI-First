<script setup lang="ts">
import { computed } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import { useToast } from '@/composables/useToast'

// Maropost support is the first contact for Maropay (plan §1). This alert
// carries the references a support agent needs — account, store, payment,
// payout or dispute — instead of a separate support case view. Nothing is
// sent anywhere from the prototype.

const props = withDefaults(defineProps<{
  references: Array<{ label: string; value: string }>
  title?: string
  message?: string
}>(), {
  title: 'Need help with this?',
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
  <MpAlert tone="info" icon="life-buoy" :title="title" live="off">
    {{ message }}
    <dl class="maropay-support__refs">
      <template v-for="ref in references" :key="ref.label">
        <dt>{{ ref.label }}</dt>
        <dd>{{ ref.value }}</dd>
      </template>
    </dl>
    <template #actions>
      <v-btn size="small" variant="outlined" class="text-none" prepend-icon="copy" @click="copyReferences">Copy references</v-btn>
      <v-btn size="small" variant="text" class="text-none" @click="contactSupport">Contact support</v-btn>
    </template>
  </MpAlert>
</template>

<style scoped>
.maropay-support__refs {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: var(--mp-space-2) var(--mp-space-12);
  margin: var(--mp-space-8) 0 0;
  font-size: var(--mp-fontSize-13);
}

.maropay-support__refs dt {
  font-weight: var(--mp-fontWeight-semibold);
}

.maropay-support__refs dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
</style>
