<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLandingPagesStore, defaultLandingBlock, cloneLandingBlock } from '@/stores/useLandingPages'
import type { LandingPageBlock, LandingPageStyle, LandingTemplateRecord } from '@/stores/useLandingPages'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpWizardSteps from '@/components/MpWizardSteps.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'

const router = useRouter()
const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const lpStore = useLandingPagesStore()

type UsageTag = 'newsletter' | 'events' | 'product-promotion' | 'service-promotion' | 'dark-mode-optimized'
type IndustryTag = 'e-commerce' | 'small-business' | 'home-goods'
type SeasonalTag = 'christmas' | 'new-year'

interface LandingTemplate {
  id: string
  name: string
  group: 'Usage' | 'Industry' | 'Seasonal'
  tag: UsageTag | IndustryTag | SeasonalTag
  desc: string
  accent: string
  icon: string
  /** Starter blocks seeded into the page when this template is chosen. */
  blocks: () => LandingPageBlock[]
  style?: Partial<LandingPageStyle>
}

const TEMPLATES: LandingTemplate[] = [
  {
    id: 'fresh-drop', name: 'Fresh Drop Announcement', group: 'Usage', tag: 'product-promotion', desc: 'Hero + countdown for a new product launch', accent: 'primary', icon: 'rocket',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'Something new just dropped', titleSize: 'XL', align: 'center' },
      { ...defaultLandingBlock('paragraph'), text: 'Be the first to shop our latest release before it sells out.', align: 'center' },
      { ...defaultLandingBlock('image'), alt: 'New product hero' },
      { ...defaultLandingBlock('button'), label: 'Shop the drop', align: 'center' },
    ],
  },
  {
    id: 'newsletter-digest', name: 'Newsletter Digest', group: 'Usage', tag: 'newsletter', desc: 'Sign-up form + latest issue preview', accent: 'info', icon: 'newspaper',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'Get our newsletter', titleSize: 'L', align: 'center' },
      { ...defaultLandingBlock('paragraph'), text: 'Product news, tips, and offers — straight to your inbox, every other week.', align: 'center' },
      { ...defaultLandingBlock('form'), label: 'Subscribe' },
    ],
  },
  {
    id: 'webinar-rsvp', name: 'Webinar RSVP', group: 'Usage', tag: 'events', desc: 'Event details + registration form', accent: 'secondary', icon: 'video',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'Join our live webinar', titleSize: 'L', align: 'center' },
      { ...defaultLandingBlock('paragraph'), text: 'Save your seat for a live walkthrough with our product team.', align: 'center' },
      { ...defaultLandingBlock('list'), items: ['Live Q&A with the team', 'Free resource pack for attendees', 'Recording sent afterward'] },
      { ...defaultLandingBlock('form'), label: 'Reserve my seat' },
    ],
  },
  {
    id: 'midnight-mode', name: 'Midnight Mode Showcase', group: 'Usage', tag: 'dark-mode-optimized', desc: 'Dark, high-contrast product showcase', accent: 'marketing', icon: 'moon',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'Built for the night owls', titleSize: 'XL', align: 'center', colorOverride: '#F5F5F5' },
      { ...defaultLandingBlock('paragraph'), text: 'A high-contrast showcase for a product that looks best after dark.', align: 'center', colorOverride: '#D4D4D4' },
      { ...defaultLandingBlock('button'), label: 'See it in action', align: 'center' },
    ],
    style: { backgroundColor: '#121212', accentColor: '#2CC4FF' },
  },
  {
    id: 'boutique-storefront', name: 'Boutique Storefront', group: 'Industry', tag: 'e-commerce', desc: 'Product grid + limited-time offer', accent: 'commerce', icon: 'shopping-bag',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'This week’s edit', titleSize: 'L', align: 'center' },
      { ...defaultLandingBlock('image'), alt: 'Featured products' },
      { ...defaultLandingBlock('paragraph'), text: 'Limited-time picks from our boutique collection — while stocks last.', align: 'center' },
      { ...defaultLandingBlock('button'), label: 'Shop the edit', align: 'center' },
    ],
  },
  {
    id: 'neighborhood-spotlight', name: 'Neighborhood Spotlight', group: 'Industry', tag: 'small-business', desc: 'Local story + contact form', accent: 'success', icon: 'store',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'A local favorite, now online', titleSize: 'L', align: 'center' },
      { ...defaultLandingBlock('paragraph'), text: 'Our story, our neighborhood, and how to reach us.' },
      { ...defaultLandingBlock('image'), alt: 'Storefront photo' },
      { ...defaultLandingBlock('form'), label: 'Get in touch', fieldName: true, fieldPhone: true },
    ],
  },
  {
    id: 'holiday-wishlist', name: 'Holiday Wishlist', group: 'Seasonal', tag: 'christmas', desc: 'Gift guide + curated picks', accent: 'error', icon: 'gift',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'The holiday gift guide', titleSize: 'XL', align: 'center' },
      { ...defaultLandingBlock('list'), items: ['Gifts under $50', 'Best sellers of the season', 'Free gift wrapping'] },
      { ...defaultLandingBlock('button'), label: 'Browse the guide', align: 'center' },
    ],
    style: { accentColor: '#C0392B' },
  },
  {
    id: 'countdown-new-year', name: 'Countdown to New Year', group: 'Seasonal', tag: 'new-year', desc: 'Sitewide sale + countdown timer', accent: 'warning', icon: 'sparkles',
    blocks: () => [
      { ...defaultLandingBlock('title'), text: 'New year, new savings', titleSize: 'XL', align: 'center' },
      { ...defaultLandingBlock('paragraph'), text: 'Sitewide savings end at midnight — don’t miss out.', align: 'center' },
      { ...defaultLandingBlock('button'), label: 'Shop the sale', align: 'center' },
    ],
    style: { accentColor: '#F59E0B' },
  },
]

const USAGE_OPTIONS: UsageTag[] = ['newsletter', 'events', 'product-promotion', 'service-promotion', 'dark-mode-optimized']
const INDUSTRY_OPTIONS: IndustryTag[] = ['e-commerce', 'small-business', 'home-goods']
const SEASONAL_OPTIONS: SeasonalTag[] = ['christmas', 'new-year']

// ─── Stage 1: gallery ────────────────────────────────────────────────────
const galleryView = ref<'library' | 'mine'>('library')
const viewTabs = computed(() => [
  { label: 'Library', key: 'library', count: TEMPLATES.length },
  { label: 'My Templates', key: 'mine', count: lpStore.savedTemplates.length },
])

const usageFilter = ref<UsageTag[]>([])
const industryFilter = ref<IndustryTag[]>([])
const seasonalFilter = ref<SeasonalTag[]>([])
const hasActiveFilters = computed(() => usageFilter.value.length + industryFilter.value.length + seasonalFilter.value.length > 0)
function clearAllFilters() { usageFilter.value = []; industryFilter.value = []; seasonalFilter.value = [] }

const filtered = computed(() =>
  TEMPLATES.filter(t => {
    if (!hasActiveFilters.value) return true
    if (t.group === 'Usage') return usageFilter.value.includes(t.tag as UsageTag)
    if (t.group === 'Industry') return industryFilter.value.includes(t.tag as IndustryTag)
    return seasonalFilter.value.includes(t.tag as SeasonalTag)
  }),
)

// ─── Stage machine: gallery → details (single DnD editor — no false WYSIWYG choice)
type Stage = 'gallery' | 'details'
const stage = ref<Stage>('gallery')
const stageTitles = ['Template', 'Details']
const stageIndex = computed(() => ({ gallery: 1, details: 2 }[stage.value]))

const selectedTemplate = ref<LandingTemplate | null>(null)
const selectedTemplateName = computed(() => selectedTemplate.value?.name ?? null)
function chooseTemplate(tpl: LandingTemplate | null) {
  selectedTemplate.value = tpl
  stage.value = 'details'
}

/** Wrap a merchant-saved template into the library shape so the details stage works unchanged. */
function chooseSaved(t: LandingTemplateRecord) {
  chooseTemplate({
    id: `saved-${t.id}`,
    name: t.name,
    group: 'Usage',
    tag: 'product-promotion',
    desc: 'Saved template',
    accent: 'primary',
    icon: 'layout-template',
    blocks: () => t.blocks.map(cloneLandingBlock),
    style: { ...t.style },
  })
}
function backToGallery() { stage.value = 'gallery' }

// ─── Stage 3: details ────────────────────────────────────────────────────
const pageName = ref('')
const pageUrl = ref('')
const publishDate = ref('')
const publishTime = ref('')
const expireDate = ref('')
const expireTime = ref('')
const tracking = ref('')

const urlPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/[\w-]*)*\/?$/i
const urlTouched = ref(false)
const urlValid = computed(() => urlPattern.test(pageUrl.value.trim()))
const detailsValid = computed(() => pageName.value.trim().length > 0 && pageUrl.value.trim().length > 0 && urlValid.value)

function formatDateTime(date: string, time: string): string {
  if (!date) return ''
  if (!time) return date
  const d = new Date(`${date}T${time}`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function createPage() {
  if (!detailsValid.value) return
  const id = lpStore.create({
    name: pageName.value.trim(),
    url: pageUrl.value.trim(),
    editorType: 'dnd',
    publishAt: formatDateTime(publishDate.value, publishTime.value),
    expireAt: formatDateTime(expireDate.value, expireTime.value),
    tracking: tracking.value,
    blocks: selectedTemplate.value?.blocks(),
    style: selectedTemplate.value?.style,
  })
  router.push({ name: 'LandingPageEditor', params: { accountId: accountId.value, id: String(id) } })
}

</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      :title="stage === 'gallery' ? 'Landing Page Templates' : 'Create Landing Page'"
      :subtitle="stage === 'gallery' ? 'Start from a template or build from scratch' : undefined"
      :back-to="stage === 'gallery' ? { name: 'LandingPages', params: { accountId } } : undefined"
    >
      <template v-if="stage === 'gallery'" #actions>
        <v-btn variant="flat" color="surface" prepend-icon="file-plus" class="text-none" @click="chooseTemplate(null)">Start from scratch</v-btn>
      </template>
      <template v-if="stage === 'gallery'" #tabs>
        <MpFilterTabs v-model="galleryView" :tabs="viewTabs" aria-label="Template source" class="mt-2" />
      </template>
    </MpPageHeader>

    <!-- STAGE 1: Gallery -->
    <template v-if="stage === 'gallery'">
      <template v-if="galleryView === 'library'">
        <!-- Gallery filter bar, not a form: compact + hide-details are deliberate here. -->
        <div class="d-flex ga-3 flex-wrap align-center">
          <v-select v-model="usageFilter" :items="USAGE_OPTIONS" label="Usage" multiple chips closable-chips clearable density="compact" hide-details class="lpt-filter" />
          <v-select v-model="industryFilter" :items="INDUSTRY_OPTIONS" label="Industry" multiple chips closable-chips clearable density="compact" hide-details class="lpt-filter" />
          <v-select v-model="seasonalFilter" :items="SEASONAL_OPTIONS" label="Seasonal" multiple chips closable-chips clearable density="compact" hide-details class="lpt-filter" />
          <v-btn v-if="hasActiveFilters" variant="text" size="small" class="text-none" @click="clearAllFilters">Clear All</v-btn>
        </div>

        <div class="flex-grow-1 overflow-y-auto">
          <v-row dense>
            <v-col cols="12" sm="6" md="4" lg="3">
              <v-card flat border rounded="lg" class="lpt-card lpt-card--blank h-100 d-flex flex-column align-center justify-center text-center pa-6" role="button" tabindex="0" @click="chooseTemplate(null)" @keydown.enter="chooseTemplate(null)">
                <v-icon size="32" color="primary" class="mb-2">file-plus</v-icon>
                <div class="text-body-2 font-weight-bold mb-1">Blank Template</div>
                <div class="text-caption text-medium-emphasis mb-3">Start from scratch</div>
                <v-btn variant="tonal" color="primary" size="small" class="text-none">Start designing</v-btn>
              </v-card>
            </v-col>
            <v-col v-for="tpl in filtered" :key="tpl.id" cols="12" sm="6" md="4" lg="3">
              <v-card flat border rounded="lg" class="lpt-card h-100" role="button" tabindex="0" @click="chooseTemplate(tpl)" @keydown.enter="chooseTemplate(tpl)">
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
                    <v-chip size="x-small" variant="tonal" class="flex-shrink-0">{{ tpl.group }}</v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">{{ tpl.desc }}</div>
                  <v-btn variant="tonal" color="primary" size="small" block class="text-none mt-3">Use template</v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </template>

      <template v-else>
        <div v-if="lpStore.savedTemplates.length" class="flex-grow-1 overflow-y-auto">
          <v-row dense>
            <v-col v-for="t in lpStore.savedTemplates" :key="t.id" cols="12" sm="6" md="4" lg="3">
              <v-card flat border rounded="lg" class="lpt-card h-100" role="button" tabindex="0" @click="chooseSaved(t)" @keydown.enter="chooseSaved(t)">
                <div class="lpt-card__preview lpt-card__preview--primary">
                  <v-icon size="30">layout-template</v-icon>
                  <div class="lpt-card__skeleton">
                    <span class="lpt-bar lpt-bar--wide" />
                    <span class="lpt-bar" />
                    <span class="lpt-bar lpt-bar--btn" />
                  </div>
                </div>
                <div class="pa-4">
                  <div class="d-flex align-center justify-space-between ga-2">
                    <div class="text-subtitle-2 font-weight-bold text-truncate">{{ t.name }}</div>
                    <v-chip size="x-small" variant="tonal" class="flex-shrink-0">Saved</v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">Saved {{ t.savedAt }} · {{ t.blocks.length }} block{{ t.blocks.length === 1 ? '' : 's' }}</div>
                  <v-btn variant="tonal" color="primary" size="small" block class="text-none mt-3">Use template</v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <MpEmptyState
          v-else
          icon="layout-template"
          title="No saved templates yet"
          description="Save any landing page as a template and it will show up here for reuse."
          action-label="Browse the library"
          action-icon="layout-template"
          class="my-auto"
          @action="galleryView = 'library'"
        />
      </template>
    </template>

    <!-- STAGE 2: details -->
    <template v-else>
      <div class="d-flex justify-center px-5">
        <MpWizardSteps :steps="stageTitles" :current="stageIndex" />
      </div>

      <div class="d-flex justify-center pt-4 pa-4 flex-grow-1 overflow-y-auto">
        <v-card variant="flat" border rounded="lg" style="max-width:640px;width:100%;" class="pa-8 align-self-start">
          <div class="text-h5 font-weight-bold mb-1">Page Details</div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            {{ selectedTemplateName ? `Starting from “${selectedTemplateName}”.` : 'Starting from a blank page.' }}
            Name your page and set its URL and schedule.
          </div>

          <MpFormGrid :cols="2">
            <v-text-field v-model="pageName" class="mp-form-grid__full" label="Name *" placeholder="e.g. Spring Promo Landing Page" />
            <v-text-field
              v-model="pageUrl"
              class="mp-form-grid__full"
              label="Page URL *"
              placeholder="promo.mystore.com/spring"
              :error="urlTouched && !!pageUrl && !urlValid"
              :error-messages="urlTouched && !!pageUrl && !urlValid ? ['Invalid URL'] : []"
              @blur="urlTouched = true"
            />

            <v-text-field v-model="publishDate" type="date" label="Publish at — Date" />
            <v-text-field v-model="publishTime" type="time" label="Publish at — Time" />
            <v-text-field v-model="expireDate" type="date" label="Expire at — Date" />
            <v-text-field v-model="expireTime" type="time" label="Expire at — Time" />

            <v-textarea v-model="tracking" class="mp-form-grid__full" label="Page Tracking (optional)" placeholder="Paste analytics / pixel tracking code" rows="3" />
          </MpFormGrid>

          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="text" class="text-none" prepend-icon="arrow-left" @click="backToGallery">Back</v-btn>
            <v-btn color="primary" variant="flat" class="text-none" append-icon="arrow-right" :disabled="!detailsValid" @click="createPage">Create Page</v-btn>
          </div>
        </v-card>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lpt-filter { max-width: 200px; }

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
.lpt-card--blank { background: rgba(var(--v-theme-primary), 0.03); border-style: dashed !important; }
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
