<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
const activeTab = ref<'get-started' | 'dashboard'>(
  route.path.endsWith('/dashboard') ? 'dashboard' : 'get-started',
)

const features = [
  {
    title: 'Generate content and grow your audience',
    description: 'Email subject lines, campaign briefs, and creative variations on demand — tuned to your brand voice.',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)',
    icon: 'sparkles',
  },
  {
    title: 'Scale revenue without scaling complexity',
    description: 'Predictive send times, churn signals, and AI-tuned audience targeting working quietly in the background.',
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #cffafe 100%)',
    icon: 'trending-up',
  },
  {
    title: 'Resolve tickets faster with AI',
    description: 'Auto-summarize threads, draft replies in your tone, and route conversations to the right agent.',
    gradient: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
    icon: 'headset',
  },
]

const metrics = [
  { label: 'Avg. Lift via Smart Send', value: '+ 14.2%', color: 'primary', icon: 'trending-up' },
  { label: 'Orders Saved (Churn Prevention)', value: '1,402', color: 'success', icon: 'shopping-cart' },
  { label: 'Dynamic Recommendations Revenue', value: '$84,300', color: 'info', icon: 'dollar-sign' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column">
    <MpPageHeader title="Da Vinci AI" subtitle="Your AI copilot for marketing, commerce, and service" />

    <v-tabs
      v-model="activeTab"
      color="primary"
      class="dv-tabs mb-6"
      slider-color="primary"
    >
      <v-tab value="get-started" class="text-none">Get started</v-tab>
      <v-tab value="dashboard" class="text-none">
        Dashboard
        <v-chip
          size="x-small"
          color="primary"
          variant="flat"
          class="ml-2 font-weight-bold"
          style="height: 18px; font-size: 10px; letter-spacing: 0.04em;"
        >
          BETA
        </v-chip>
      </v-tab>
    </v-tabs>

    <!-- Get started tab -->
    <section v-if="activeTab === 'get-started'" class="dv-landing">
      <v-card flat rounded="lg" class="dv-hero pa-10 mb-6 text-center">
        <div class="dv-hero__brand d-inline-flex align-center justify-center mb-6">
          <v-icon size="32" color="primary" class="mr-2">sparkles</v-icon>
          <span class="text-h5 font-weight-bold">Da Vinci AI</span>
        </div>
        <h1 class="text-h3 font-weight-bold mb-4 dv-hero__headline">
          The complete AI solution<br />that's easy to use.
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-0 mx-auto" style="max-width: 640px;">
          Unify your marketing, commerce, and service teams with AI built for merchants — predictive send times, content generation, and intelligent routing, all in one place.
        </p>
      </v-card>

      <v-row>
        <v-col v-for="f in features" :key="f.title" cols="12" md="4">
          <v-card flat border rounded="lg" class="h-100 d-flex flex-column">
            <div class="dv-feature-media d-flex align-center justify-center" :style="{ background: f.gradient }">
              <div class="dv-feature-play">
                <v-icon size="22" color="primary">play</v-icon>
              </div>
            </div>
            <div class="pa-5 d-flex flex-column flex-grow-1">
              <div class="d-flex align-center mb-3">
                <v-icon size="20" color="primary" class="mr-2">{{ f.icon }}</v-icon>
                <div class="text-subtitle-1 font-weight-bold">{{ f.title }}</div>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ f.description }}</p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <!-- Dashboard tab -->
    <section v-else-if="activeTab === 'dashboard'">
      <v-row>
        <v-col v-for="m in metrics" :key="m.label" cols="12" md="4">
          <v-card flat border rounded="lg" class="pa-5">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase">{{ m.label }}</div>
              <v-icon :color="m.color" size="20">{{ m.icon }}</v-icon>
            </div>
            <div class="text-h4 font-weight-bold" :class="`text-${m.color}`">{{ m.value }}</div>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </div>
</template>

<style scoped>
.dv-tabs {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.dv-hero {
  background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 50%, #cffafe 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.dv-hero__headline {
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.dv-feature-media {
  aspect-ratio: 16 / 9;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  position: relative;
  overflow: hidden;
}

.dv-feature-play {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
