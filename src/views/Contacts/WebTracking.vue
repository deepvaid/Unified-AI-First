<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import { useToast } from '@/composables/useToast'

const script = `<script src="https://track.maropost.com/js/track.js"><\/script>
<script>mp.init('12345-ABCD');<\/script>`

const toast = useToast()

async function copyScript() {
  try {
    await navigator.clipboard.writeText(script)
    toast.success('Tracking script copied to clipboard')
  } catch {
    toast.error('Could not copy — select the snippet and copy manually')
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Web Tracking"
      subtitle="Embed the tracking script to capture website activity from your contacts."
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="copy" class="text-none" color="surface" @click="copyScript">Copy Script</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-subtitle-1 font-weight-bold">Primary Tracking Domain</h3>
        <v-chip color="success" size="small" variant="tonal">Verified</v-chip>
      </div>
      <!-- aria-label, not `label`: the <h3> above is the visible label, so a Vuetify
           label would duplicate it on screen. Without either, Vuetify still emits
           aria-labelledby pointing at a label element it never renders, leaving the
           field with a dangling reference and no accessible name at all. -->
      <v-text-field
        readonly
        variant="outlined"
        density="comfortable"
        model-value="track.maropost.com"
        aria-label="Primary tracking domain"
        class="mb-4"
      />
      <div class="text-body-2 text-medium-emphasis mb-3">Place the following script snippet in the &lt;head&gt; of your website.</div>
      <div class="code-block">
        &lt;script src="https://track.maropost.com/js/track.js"&gt;&lt;/script&gt;<br>
        &lt;script&gt;mp.init('12345-ABCD');&lt;/script&gt;
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.code-block {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  padding: 16px;
  border-radius: var(--r-card, 12px);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
}
</style>
