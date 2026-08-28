<script setup lang="ts">
import MpStatusChip from '@/components/MpStatusChip.vue'

withDefaults(defineProps<{
  name: string
  subject: string
  audience: string
  audienceSize: number
  sendTime: string
  channel: string
  status?: string
  draftId?: number
  remaining?: string[]
}>(), {
  status: 'Draft',
  draftId: undefined,
  remaining: () => [],
})

const emit = defineEmits<{
  review: []
  change: []
}>()
</script>

<template>
  <v-card flat border rounded="lg" class="campaign-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-center ga-2 mb-3">
        <v-avatar size="32" color="primary" variant="tonal">
          <v-icon size="18">file-pen-line</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ name }}</div>
          <div class="text-caption text-medium-emphasis">Editable campaign draft</div>
        </div>
        <v-spacer />
        <MpStatusChip :status="status" type="campaign" size="sm" />
      </div>

      <v-divider class="campaign-card__divider mb-3" />

      <div class="d-flex flex-column ga-2 text-body-2">
        <div class="d-flex align-center ga-2">
          <v-icon size="14" class="text-medium-emphasis">text</v-icon>
          <span class="campaign-card__label text-medium-emphasis">Subject</span>
          <span class="font-weight-medium">{{ subject }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="14" class="text-medium-emphasis">users</v-icon>
          <span class="campaign-card__label text-medium-emphasis">Audience</span>
          <span class="font-weight-medium">{{ audience }}</span>
          <v-chip size="x-small" variant="tonal" color="primary">{{ audienceSize.toLocaleString() }}</v-chip>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="14" class="text-medium-emphasis">clock</v-icon>
          <span class="campaign-card__label text-medium-emphasis">Send</span>
          <span class="font-weight-medium">{{ sendTime }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="14" class="text-medium-emphasis">send</v-icon>
          <span class="campaign-card__label text-medium-emphasis">Channel</span>
          <span class="font-weight-medium">{{ channel }}</span>
        </div>
      </div>

      <div v-if="remaining.length" class="campaign-card__remaining d-flex align-start ga-2 pa-3 mt-3">
        <v-icon size="16" color="info">info</v-icon>
        <div class="text-caption">
          <strong>Still to review:</strong> {{ remaining.join(', ') }}
        </div>
      </div>

      <div class="d-flex flex-wrap ga-2 mt-4">
        <v-btn color="primary" variant="flat" size="small" prepend-icon="arrow-up-right" @click="emit('review')">
          Review editable draft
        </v-btn>
        <v-btn variant="outlined" size="small" prepend-icon="refresh-cw" @click="emit('change')">
          Change brief
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.campaign-card__divider {
  opacity: 0.4;
}

.campaign-card__label {
  min-width: var(--mp-space-80);
}

.campaign-card__remaining {
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface-variant));
}
</style>
