<script setup lang="ts">
import { computed } from 'vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { useContactsStore } from '@/stores/useContacts'

const props = defineProps<{
  name: string
  rules: string[]
  estimatedSize: number
  /** The segment this card was saved as — recorded on the chat message, so a remount can't save twice. */
  savedSegmentId?: number
}>()

const emit = defineEmits<{
  save: []
  /** Opens the segments list (offered once there is a saved segment in it). */
  open: []
}>()

const contacts = useContactsStore()

/** Saved — and the segment is still there (delete it from the Segments page and Save is offered again). */
const isSaved = computed(
  () => props.savedSegmentId != null && contacts.segments.some((segment) => segment.id === props.savedSegmentId),
)
</script>

<template>
  <v-card variant="outlined" class="segment-card">
    <v-card-text class="pa-4 d-flex flex-column ga-3">
      <div class="d-flex align-center ga-2">
        <v-avatar size="32" color="primary" variant="tonal">
          <v-icon size="18">user-search</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ name }}</div>
          <div class="text-caption text-medium-emphasis">Customer Segment</div>
        </div>
        <v-spacer />
        <v-chip size="x-small" color="primary" variant="tonal" prepend-icon="users">
          ~{{ estimatedSize.toLocaleString() }}
        </v-chip>
      </div>

      <v-divider style="opacity: 0.4;" />

      <div class="d-flex flex-column ga-2">
        <MpFormSection title="Filter rules" />
        <div class="d-flex flex-column ga-1">
          <div v-for="(rule, i) in rules" :key="i" class="d-flex align-center ga-2 pa-2 rounded bg-surface-variant">
            <v-icon size="14" color="primary">filter</v-icon>
            <span class="text-body-2">{{ rule }}</span>
          </div>
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          class="text-none flex-grow-1"
          :prepend-icon="isSaved ? 'check' : 'save'"
          :disabled="isSaved"
          @click="emit('save')"
        >
          {{ isSaved ? 'Saved' : 'Save Segment' }}
        </v-btn>
        <v-btn v-if="isSaved" variant="flat" size="small" class="text-none" color="surface" @click="emit('open')">
          Open segments
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-card.segment-card { border-radius: var(--mp-radius-12) !important; }
</style>
