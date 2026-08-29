<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import DeckSlide from '../DeckSlide.vue'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

const { mode, setMode } = useAppTheme()
const isDark = computed(() => mode.value === 'dark')

const autoRestock = ref(true)
const segmentName = ref('Holiday repeat buyers')

// While the film is rolling, this scene flips the lights by itself:
// darkness falls a few seconds in, then morning comes back before we move on.
const deckPlaying = inject<Readonly<Ref<boolean>>>('deckPlaying', ref(false))
let nightTimer: number | undefined
let morningTimer: number | undefined

function clearTimers() {
  window.clearTimeout(nightTimer)
  window.clearTimeout(morningTimer)
}

function choreograph() {
  clearTimers()
  nightTimer = window.setTimeout(() => setMode('dark'), 4200)
  morningTimer = window.setTimeout(() => setMode('light'), 8600)
}

onMounted(() => {
  if (deckPlaying.value) choreograph()
})

watch(deckPlaying, playing => {
  if (playing) choreograph()
  else clearTimers()
})

onBeforeUnmount(clearTimers)
</script>

<template>
  <DeckSlide eyebrow="Design tokens in action" title="One change updates everything.">
    <div class="d-flex flex-wrap ga-3 mb-8 cine" :style="{ '--ci': 1.2 }">
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
          :trend-positive="true"
          class="h-100 cine"
          :style="{ '--ci': 1.7 }"
        />
      </v-col>
      <v-col cols="12" md="7">
        <v-card flat border rounded="lg" class="pa-5 h-100 cine" :style="{ '--ci': 2 }">
          <div class="d-flex flex-wrap ga-1 mb-4">
            <MpStatusChip status="Processing" type="order" size="md" />
            <MpStatusChip status="Paid" type="payment" size="md" />
            <MpStatusChip status="Active" type="campaign" size="md" />
            <MpStatusChip status="Open" type="ticket" size="md" />
          </div>
          <v-text-field
            v-model="segmentName"
            label="Segment name"
            hide-details
          />
          <v-switch
            v-model="autoRestock"
            label="Tell me when stock runs low"
            density="compact"
            hide-details
            class="mt-3"
          />
        </v-card>
      </v-col>
    </v-row>

    <p class="s10__footnote mt-6 cine--soft" :style="{ '--ci': 2.8 }">
      297 token values switch at once — every color and surface, on every screen, with no
      per-screen rework. That's the payoff of defining things once.
      <span class="text-medium-emphasis">(During autoplay this slide switches themes by itself.
      <kbd class="s10__kbd">L</kbd> and <kbd class="s10__kbd">D</kbd> work anytime.)</span>
    </p>
  </DeckSlide>
</template>

<style scoped>
.s10__footnote {
  max-width: 760px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--mp-fontSize-14);
}

.s10__kbd {
  display: inline-block;
  padding: 0 var(--mp-space-8);
  border: 1px solid var(--mp-border-subtle);
  border-radius: var(--mp-radius-4);
  background: rgb(var(--v-theme-surface));
  font-family: var(--mp-fontFamily-mono);
}
</style>
