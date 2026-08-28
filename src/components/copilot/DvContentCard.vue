<script setup lang="ts">
defineProps<{
  type: 'email' | 'product' | 'blog' | 'sms'
  title: string
  content: string
}>()

const emit = defineEmits<{
  copy: []
  edit: []
  use: []
}>()

// Colors use Vuetify semantic names — no hardcoded hex
const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  email: { icon: 'mail', color: 'primary', label: 'Email Copy' },
  product: { icon: 'package', color: 'success', label: 'Product Description' },
  blog: { icon: 'file-text', color: 'warning', label: 'Blog Post' },
  sms: { icon: 'message-circle', color: 'secondary', label: 'SMS Message' },
}
</script>

<template>
  <v-card variant="outlined" class="content-card">
    <v-card-text class="pa-4">
      <div class="d-flex align-center ga-2 mb-3">
        <v-avatar size="28" :color="typeConfig[type]?.color" variant="tonal">
          <v-icon size="16">{{ typeConfig[type]?.icon }}</v-icon>
        </v-avatar>
        <span class="text-caption font-weight-bold text-uppercase" style="letter-spacing: 0.5px;">{{ typeConfig[type]?.label }}</span>
      </div>

      <div class="text-subtitle-2 font-weight-bold mb-2">{{ title }}</div>

      <div class="content-preview pa-3 text-body-2 bg-surface-variant" style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); white-space: pre-line; line-height: var(--mp-lineHeight-loose); max-height: 160px; overflow-y: auto;">
        {{ content }}
      </div>

      <div class="d-flex ga-2 mt-3">
        <v-btn variant="flat" size="small" class="text-none" prepend-icon="copy" @click="emit('copy')" color="surface">Copy</v-btn>
        <v-btn variant="flat" size="small" class="text-none" prepend-icon="pencil" @click="emit('edit')" color="surface">Edit</v-btn>
        <v-btn color="primary" variant="flat" size="small" class="text-none" prepend-icon="check" @click="emit('use')">Use in Campaign</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-card.content-card { border-radius: var(--mp-radius-12) !important; }
.content-preview { border-radius: var(--mp-radius-10); }
</style>
