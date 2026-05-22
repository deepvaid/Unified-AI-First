<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Web Tracking"
      subtitle="Embed the tracking script to capture website activity from your contacts."
    >
      <template #actions>
        <v-btn variant="flat" prepend-icon="copy" class="text-none" color="surface">Copy Script</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-4">
        <h3 class="text-subtitle-1 font-weight-bold">Primary Tracking Domain</h3>
        <v-chip color="success" size="small" variant="tonal">Verified</v-chip>
      </div>
      <v-text-field readonly variant="outlined" density="comfortable" model-value="track.maropost.com" class="mb-4" />
      <div class="text-body-2 text-medium-emphasis mb-3">Place the following script snippet in the &lt;head&gt; of your website.</div>
      <div class="bg-black pa-4 rounded-lg font-family-monospace text-body-2 text-green">
        &lt;script src="https://track.maropost.com/js/track.js"&gt;&lt;/script&gt;<br>
        &lt;script&gt;mp.init('12345-ABCD');&lt;/script&gt;
      </div>
    </v-card>
  </div>
</template>
