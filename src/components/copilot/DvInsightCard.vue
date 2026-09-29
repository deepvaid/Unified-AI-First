<script setup lang="ts">
import MpAlert from '@/components/MpAlert.vue'

defineProps<{
  icon?: string
  headline: string
  description: string
  actionLabel?: string
  /** Destination the host navigates to on `action` (declared so it does not leak onto the root as an attribute). */
  routeName?: string
  severity?: 'info' | 'warning' | 'success' | 'error'
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <!-- An insight is in-page feedback, so it is MpAlert — soft fill on the semantic container pairs, ink paired with it.
       (It used to be a tonal v-card painted with the raw theme colours, whose text/ink pairing nothing guaranteed.)
       live="off": the chat transcript is already a live log, so the insight isn't announced twice. -->
  <MpAlert :tone="severity ?? 'info'" :title="headline" :icon="icon || 'lightbulb'" live="off">
    {{ description }}
    <template v-if="actionLabel" #actions>
      <v-btn variant="flat" color="surface" size="small" class="text-none" @click="emit('action')">
        {{ actionLabel }}
      </v-btn>
    </template>
  </MpAlert>
</template>
