<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import DeckSlide from '../DeckSlide.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const { mode, setMode } = useAppTheme()
const isDark = computed(() => mode.value === 'dark')

const autoRestock = ref(true)
const segmentName = ref('Holiday repeat buyers')
</script>

<template>
  <DeckSlide eyebrow="One token source" title="Watch the whole system change its mind.">
    <div class="d-flex flex-wrap ga-3 mb-8">
      <v-btn
        size="x-large"
        class="text-none"
        :variant="!isDark ? 'flat' : 'outlined'"
        :color="!isDark ? 'primary' : undefined"
        prepend-icon="sun"
        @click="setMode('light')"
      >
        Light
      </v-btn>
      <v-btn
        size="x-large"
        class="text-none"
        :variant="isDark ? 'flat' : 'outlined'"
        :color="isDark ? 'primary' : undefined"
        prepend-icon="moon"
        @click="setMode('dark')"
      >
        Dark
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12" md="5">
        <MpKpiCard
          label="Total revenue"
          period="Last 30 days"
          value="$48,210"
          icon="circle-dollar-sign"
          trend="+12.4% vs prior"
          class="h-100"
        />
      </v-col>
      <v-col cols="12" md="7">
        <v-card flat border rounded="lg" class="pa-5 h-100">
          <div class="d-flex flex-wrap ga-1 mb-4">
            <MpStatusChip status="Processing" type="order" size="small" />
            <MpStatusChip status="Paid" type="payment" size="small" />
            <MpStatusChip status="Active" type="campaign" size="small" />
            <MpStatusChip status="Open" type="ticket" size="small" />
          </div>
          <v-text-field
            v-model="segmentName"
            label="Segment name"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <v-switch
            v-model="autoRestock"
            label="Notify me when stock runs low"
            color="primary"
            density="compact"
            hide-details
            class="mt-3"
          />
        </v-card>
      </v-col>
    </v-row>

    <p class="s10__footnote mt-6">
      No reload, no second stylesheet — one flip and 297 tokens re-resolve everywhere, including
      this deck. Keys <kbd class="s10__kbd">L</kbd> and <kbd class="s10__kbd">D</kbd> work from any
      slide.
    </p>
  </DeckSlide>
</template>

<style scoped>
.s10__footnote {
  max-width: 720px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-typography-fontSize-body);
}

.s10__kbd {
  display: inline-block;
  padding: 0 var(--mp-spacing-2);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-borderRadius-sm);
  background: rgb(var(--v-theme-surface));
  font-family: var(--mp-typography-fontFamily-mono);
}
</style>
