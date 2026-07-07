<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'

interface LandingTemplate {
  id: string
  name: string
  category: 'Usage' | 'Industry' | 'Seasonal'
  tag: string
  accent: string
  icon: string
}

const TEMPLATES: LandingTemplate[] = [
  { id: 'lead-capture', name: 'Lead Capture', category: 'Usage', tag: 'Sign-up form + hero', accent: 'primary', icon: 'user-plus' },
  { id: 'product-launch', name: 'Product Launch', category: 'Usage', tag: 'Announcement + CTA', accent: 'marketing', icon: 'rocket' },
  { id: 'webinar', name: 'Webinar Registration', category: 'Usage', tag: 'Event + agenda', accent: 'info', icon: 'video' },
  { id: 'coming-soon', name: 'Coming Soon', category: 'Usage', tag: 'Countdown + notify', accent: 'secondary', icon: 'clock' },
  { id: 'ecommerce', name: 'Storefront Promo', category: 'Industry', tag: 'Product grid + offer', accent: 'commerce', icon: 'shopping-bag' },
  { id: 'saas', name: 'SaaS Trial', category: 'Industry', tag: 'Features + pricing', accent: 'analytics', icon: 'layout-dashboard' },
  { id: 'realestate', name: 'Real Estate Listing', category: 'Industry', tag: 'Gallery + enquiry', accent: 'retail', icon: 'home' },
  { id: 'nonprofit', name: 'Nonprofit Donation', category: 'Industry', tag: 'Story + donate', accent: 'success', icon: 'heart' },
  { id: 'blackfriday', name: 'Black Friday', category: 'Seasonal', tag: 'Deal grid + timer', accent: 'error', icon: 'tag' },
  { id: 'holiday', name: 'Holiday Gift Guide', category: 'Seasonal', tag: 'Curated picks', accent: 'marketing', icon: 'gift' },
  { id: 'newyear', name: 'New Year Sale', category: 'Seasonal', tag: 'Sitewide offer', accent: 'warning', icon: 'sparkles' },
  { id: 'summer', name: 'Summer Collection', category: 'Seasonal', tag: 'Lookbook + shop', accent: 'info', icon: 'sun' },
]

const view = ref<'library' | 'mine'>('library')
const viewTabs = [
  { label: 'Template Library', key: 'library', count: TEMPLATES.length },
  { label: 'My Templates', key: 'mine', count: 0 },
]

const CATEGORIES = ['All', 'Usage', 'Industry', 'Seasonal'] as const
const category = ref<(typeof CATEGORIES)[number]>('All')

const filtered = computed(() =>
  category.value === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === category.value),
)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader title="Landing Page Templates" subtitle="Start from a template or build from scratch">
      <template #actions>
        <v-btn variant="flat" color="surface" prepend-icon="file-plus" class="text-none">Start from scratch</v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="view" :tabs="viewTabs" aria-label="Template source" class="mt-2" />
      </template>
    </MpPageHeader>

    <template v-if="view === 'library'">
      <div class="d-flex ga-2 flex-wrap">
        <v-chip
          v-for="cat in CATEGORIES"
          :key="cat"
          :variant="category === cat ? 'flat' : 'outlined'"
          :color="category === cat ? 'primary' : undefined"
          size="small"
          class="text-none"
          @click="category = cat"
        >{{ cat }}</v-chip>
      </div>

      <div class="flex-grow-1 overflow-y-auto">
        <v-row dense>
          <v-col v-for="tpl in filtered" :key="tpl.id" cols="12" sm="6" md="4" lg="3">
            <v-card flat border rounded="lg" class="lpt-card h-100" role="button" tabindex="0">
              <div class="lpt-card__preview" :class="`lpt-card__preview--${tpl.accent}`">
                <v-icon size="30">{{ tpl.icon }}</v-icon>
                <div class="lpt-card__skeleton">
                  <span class="lpt-bar lpt-bar--wide" />
                  <span class="lpt-bar" />
                  <span class="lpt-bar lpt-bar--btn" />
                </div>
              </div>
              <div class="pa-4">
                <div class="d-flex align-center justify-space-between ga-2">
                  <div class="text-subtitle-2 font-weight-bold text-truncate">{{ tpl.name }}</div>
                  <v-chip size="x-small" variant="tonal" class="flex-shrink-0">{{ tpl.category }}</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">{{ tpl.tag }}</div>
                <v-btn variant="tonal" color="primary" size="small" block class="text-none mt-3">Use template</v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </template>

    <MpEmptyState
      v-else
      icon="layout-template"
      title="No saved templates yet"
      description="Save any landing page as a template and it will show up here for reuse."
      action-label="Browse the library"
      action-icon="layout-template"
      class="my-auto"
      @action="view = 'library'"
    />
  </div>
</template>

<style scoped>
.lpt-card {
  overflow: hidden;
  transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease;
  cursor: pointer;
}
.lpt-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--v-theme-on-surface), 0.06);
}
.lpt-card:focus-visible {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.25);
}
.lpt-card__preview {
  height: 132px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.lpt-card__preview--primary { background: rgba(var(--v-theme-primary), 0.08); color: rgb(var(--v-theme-primary)); }
.lpt-card__preview--info { background: rgba(var(--v-theme-info), 0.10); color: rgb(var(--v-theme-info)); }
.lpt-card__preview--success { background: rgba(var(--v-theme-success), 0.10); color: rgb(var(--v-theme-success)); }
.lpt-card__preview--warning { background: rgba(var(--v-theme-warning), 0.12); color: rgb(var(--v-theme-warning)); }
.lpt-card__preview--error { background: rgba(var(--v-theme-error), 0.10); color: rgb(var(--v-theme-error)); }
.lpt-card__preview--secondary { background: rgba(var(--v-theme-secondary), 0.10); color: rgb(var(--v-theme-secondary)); }
.lpt-card__preview--marketing { background: color-mix(in oklch, var(--cloud-marketing-accent) 12%, transparent); color: var(--cloud-marketing-text); }
.lpt-card__preview--commerce { background: color-mix(in oklch, var(--cloud-commerce-accent) 12%, transparent); color: var(--cloud-commerce-text); }
.lpt-card__preview--analytics { background: color-mix(in oklch, var(--cloud-analytics-accent) 12%, transparent); color: var(--cloud-analytics-text); }
.lpt-card__preview--retail { background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent); color: var(--cloud-retail-text); }
.lpt-card__skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 60%;
}
.lpt-bar {
  height: 5px;
  width: 100%;
  border-radius: 3px;
  background: currentColor;
  opacity: 0.28;
}
.lpt-bar--wide { width: 80%; opacity: 0.42; }
.lpt-bar--btn { width: 40%; height: 8px; opacity: 0.6; margin-top: 2px; }
</style>
