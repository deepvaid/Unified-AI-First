<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'

const timers = [
  { name: 'Black Friday Sale Ends', endDate: '2026-11-27T23:59:59Z', display: '04 : 12 : 59 : 00' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Countdown Timers"
      :subtitle="`${timers.length} active timers`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none">Create Timer</v-btn>
      </template>
    </MpPageHeader>

    <v-row>
      <v-col cols="12" md="6" v-for="timer in timers" :key="timer.name">
        <v-card variant="flat" border rounded="lg">
          <div class="text-center py-8 bg-surface-variant rounded-t-xl">
            <div class="text-h2 font-weight-bold mb-2" style="font-family: monospace; letter-spacing: 4px;">
              {{ timer.display }}
            </div>
            <div class="text-overline text-medium-emphasis">Days : Hours : Mins : Secs</div>
          </div>
          <v-card-text class="pb-2">
            <div class="text-subtitle-1 font-weight-bold">{{ timer.name }}</div>
            <div class="text-body-2 text-medium-emphasis">Ends: {{ timer.endDate }}</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn variant="flat" size="small" class="text-none" prepend-icon="code-2" color="surface">Get Embed Code</v-btn>
            <v-spacer />
            <v-btn icon="pencil" variant="text" size="small" />
            <v-btn icon="trash-2" variant="text" size="small" color="error" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
