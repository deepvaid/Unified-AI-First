<script setup lang="ts">
import { ref, watch } from 'vue'
import MpDialog from '@/components/MpDialog.vue'

// The Activate dialog: one choice when the store already has a gateway taking
// cards — Maropay takes them (the default), or the gateway keeps them and Maropay
// adds only what it lacks — and a consequences list that restates whichever the
// owner picked. Composes MpDialog because MpConfirmDialog has no room for a control.

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  storeName: string
  /** The merchant's gateway that takes cards today, by name — shows the choice. Null when there is none. */
  gateway: string | null
  /** What happens, for a given answer to the choice. */
  consequences: (takeCards: boolean) => string[]
  confirmLabel?: string
}>(), {
  confirmLabel: 'Activate Maropay',
})

const emit = defineEmits<{ confirm: [takeCards: boolean] }>()

const takeCards = ref(true)

// Every opening starts from the default, whatever was ticked last time.
watch(model, (open) => {
  if (open) takeCards.value = true
})

function confirm(): void {
  emit('confirm', props.gateway ? takeCards.value : true)
  model.value = false
}
</script>

<template>
  <MpDialog v-model="model" size="sm" icon="rocket" :title="`Activate Maropay on ${storeName}?`">
    <p class="maropay-activate__message">New checkouts start using Maropay straight away.</p>
    <v-checkbox
      v-if="gateway"
      v-model="takeCards"
      :label="`Use Maropay for cards and switch ${gateway} off for cards`"
      :hint="`Untick to keep ${gateway} for cards — Maropay then adds only the methods ${gateway} doesn’t offer.`"
      persistent-hint
      density="compact"
    />
    <ul class="maropay-activate__consequences">
      <li v-for="(line, index) in consequences(gateway ? takeCards : true)" :key="index">{{ line }}</li>
    </ul>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="confirm">{{ confirmLabel }}</v-btn>
    </template>
  </MpDialog>
</template>

<style scoped>
.maropay-activate__message {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.maropay-activate__consequences {
  margin: 0;
  padding-left: var(--mp-space-20);
  color: var(--muted);
  line-height: 1.5;
}

.maropay-activate__consequences li + li {
  margin-top: var(--mp-space-4);
}
</style>
