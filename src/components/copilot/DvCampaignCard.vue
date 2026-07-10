<script setup lang="ts">
defineProps<{
  name: string
  subject: string
  audience: string
  audienceSize: number
  sendTime: string
  channel: string
  status?: string
}>()

const emit = defineEmits<{
  launch: []
  edit: []
}>()
</script>

<template>
  <v-card variant="outlined" rounded="lg" class="campaign-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-center ga-2 mb-3">
        <v-avatar size="32" color="primary" variant="tonal">
          <v-icon size="18">send</v-icon>
        </v-avatar>
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ name }}</div>
          <div class="text-caption text-medium-emphasis">Campaign Draft</div>
        </div>
        <v-spacer />
        <v-chip size="x-small" color="warning" variant="tonal">Draft</v-chip>
      </div>

      <v-divider class="mb-3" style="opacity: 0.4;" />

      <div class="d-flex flex-column ga-2 text-body-2">
        <div class="d-flex align-center ga-2">
          <v-icon size="14" color="medium-emphasis">text</v-icon>
          <span class="text-medium-emphasis" style="min-width: 70px;">Subject</span>
          <span class="font-weight-medium">{{ subject }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="14" color="medium-emphasis">users</v-icon>
          <span class="text-medium-emphasis" style="min-width: 70px;">Audience</span>
          <span class="font-weight-medium">{{ audience }}</span>
          <v-chip size="x-small" variant="tonal" color="primary">{{ audienceSize.toLocaleString() }}</v-chip>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="14" color="medium-emphasis">clock</v-icon>
          <span class="text-medium-emphasis" style="min-width: 70px;">Send</span>
          <span class="font-weight-medium">{{ sendTime }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="14" color="medium-emphasis">send</v-icon>
          <span class="text-medium-emphasis" style="min-width: 70px;">Channel</span>
          <span class="font-weight-medium">{{ channel }}</span>
        </div>
      </div>

      <div class="d-flex ga-2 mt-4">
        <v-btn color="primary" variant="flat" size="small" class="text-none flex-grow-1" prepend-icon="rocket" @click="emit('launch')">
          Launch Campaign
        </v-btn>
        <v-btn variant="flat" size="small" class="text-none" @click="emit('edit')" color="surface">
          Edit
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.campaign-card { transition: box-shadow var(--mp-transition-base); }
.campaign-card:hover { box-shadow: var(--mp-shadow-md); }
</style>
