<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { KnowledgeEntry } from '@/stores/useChatbot'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'

export type CrawlState = 'idle' | 'crawling' | 'discovered' | 'empty' | 'failed' | 'extracting' | 'done'

const props = withDefaults(defineProps<{
  /** Pre-fills the URL field (the chatbot's store URL). */
  initialUrl?: string
  /** Starting state. The flow always starts idle in the app; stories use this to show each state. */
  initialState?: CrawlState
}>(), {
  initialUrl: '',
  initialState: 'idle',
})

const emit = defineEmits<{
  /** The merchant extracted text from the selected pages of a site. */
  extracted: [payload: { domain: string; entries: KnowledgeEntry[] }]
}>()

interface CrawlPage { path: string; title: string; text: string; selected: boolean }

// What a crawl of a typical store turns up. Mock: the same pages for any domain.
const PAGES: Omit<CrawlPage, 'selected'>[] = [
  { path: '/', title: 'Home', text: 'Welcome to our store — new arrivals every week and free delivery on orders over $75.' },
  { path: '/about', title: 'About us', text: 'We are an independent store, founded in 2015, shipping to customers across the country.' },
  { path: '/shipping', title: 'Shipping and delivery', text: 'Standard delivery takes 3–5 business days and is free on orders over $75. Express delivery arrives in 1–2 business days.' },
  { path: '/returns', title: 'Returns and refunds', text: 'Return unworn items within 30 days for a full refund. Refunds reach the original payment method within 5 business days.' },
  { path: '/faq', title: 'Frequently asked questions', text: 'Answers to common questions about orders, payments, sizing and gift cards.' },
  { path: '/contact', title: 'Contact us', text: 'Email support@store.com or call us Monday to Friday, 9am to 5pm.' },
  { path: '/size-guide', title: 'Size guide', text: 'Our sizes run true to size. Use the chart on each product page to find your fit.' },
  { path: '/gift-cards', title: 'Gift cards', text: 'Gift cards are delivered by email, never expire and can be combined with discounts.' },
  { path: '/loyalty', title: 'Loyalty programme', text: 'Earn one point per dollar spent and redeem 100 points for $5 off.' },
  { path: '/privacy', title: 'Privacy policy', text: 'How we collect, use and protect your personal information.' },
  { path: '/terms', title: 'Terms of service', text: 'The terms that apply when you shop with us.' },
  { path: '/blog/care-guide', title: 'Blog: Caring for leather', text: 'Clean leather with a damp cloth and condition it every three months.' },
]
// Pages a chatbot rarely needs; found by the crawl but left unticked.
const LOW_VALUE = new Set(['/', '/privacy', '/terms'])

const url = ref(props.initialUrl)
const state = ref<CrawlState>(props.initialState)
const pages = ref<CrawlPage[]>(
  ['discovered', 'extracting', 'done'].includes(props.initialState)
    ? PAGES.map(p => ({ ...p, selected: !LOW_VALUE.has(p.path) }))
    : [],
)
const progress = ref(props.initialState === 'extracting' ? 40 : 0)

const domain = computed(() => url.value.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase())
const isValidUrl = computed(() => /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(url.value.trim()))
const selectedPages = computed(() => pages.value.filter(p => p.selected))
const allSelected = computed(() => selectedPages.value.length === pages.value.length)
const someSelected = computed(() => selectedPages.value.length > 0 && !allSelected.value)

let timer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(timer))

function findPages() {
  if (!isValidUrl.value) return
  state.value = 'crawling'
  clearTimeout(timer)
  timer = setTimeout(() => {
    // Deterministic outcomes so every state can be demoed: empty.* finds nothing, down.* fails.
    if (domain.value.startsWith('down.')) {
      state.value = 'failed'
    } else if (domain.value.startsWith('empty.')) {
      state.value = 'empty'
    } else {
      pages.value = PAGES.map(p => ({ ...p, selected: !LOW_VALUE.has(p.path) }))
      state.value = 'discovered'
    }
  }, 1400)
}

function toggleAll(on: boolean | null) {
  pages.value.forEach(p => { p.selected = !!on })
}

function extract() {
  if (!selectedPages.value.length) return
  state.value = 'extracting'
  progress.value = 0
  const tick = () => {
    progress.value = Math.min(100, progress.value + 20)
    if (progress.value < 100) {
      timer = setTimeout(tick, 300)
      return
    }
    state.value = 'done'
    emit('extracted', {
      domain: domain.value,
      entries: selectedPages.value.map(p => ({ title: p.title, text: p.text, url: `https://${domain.value}${p.path}` })),
    })
  }
  timer = setTimeout(tick, 300)
}

function reset() {
  clearTimeout(timer)
  state.value = 'idle'
  pages.value = []
  progress.value = 0
}
function startOver() {
  reset()
  url.value = ''
}
</script>

<template>
  <div class="site-crawl">
    <!-- IDLE: one field, one action -->
    <template v-if="state === 'idle'">
      <div class="d-flex align-start ga-2">
        <!-- `hide-details` is deliberate: a chrome control row, like a toolbar search.
             The helper line below carries the guidance. -->
        <v-text-field
          v-model="url"
          placeholder="https://mystore.com"
          prepend-inner-icon="globe"
          hide-details
          class="flex-grow-1"
          aria-label="Website URL"
          @keyup.enter="findPages"
        />
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="search" :disabled="!isValidUrl" @click="findPages">
          Find pages
        </v-btn>
      </div>
      <div class="text-caption text-medium-emphasis">
        We’ll look for pages on this site. You choose which ones the chatbot learns from.
      </div>
    </template>

    <!-- CRAWLING -->
    <div v-else-if="state === 'crawling'" role="status" aria-live="polite">
      <div class="text-body-2 text-medium-emphasis mb-2">Looking for pages on {{ domain }}…</div>
      <MpTableSkeleton :rows="4" :columns="2" :show-header="false" />
    </div>

    <!-- DISCOVERED: pick pages -->
    <template v-else-if="state === 'discovered'">
      <div class="site-crawl__bar">
        <!-- `hide-details` is deliberate on these checkboxes: a dense pick list,
             where a details slot would add height to every row. -->
        <v-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          hide-details
          density="compact"
          :label="`Pages found on ${domain}`"
          @update:model-value="toggleAll"
        />
        <span class="text-caption text-medium-emphasis flex-shrink-0" aria-live="polite">
          {{ selectedPages.length }} of {{ pages.length }} selected
        </span>
      </div>
      <div class="site-crawl__list" role="group" :aria-label="`Pages found on ${domain}`">
        <v-checkbox
          v-for="p in pages"
          :key="p.path"
          v-model="p.selected"
          hide-details
          density="compact"
          class="site-crawl__page"
        >
          <template #label>
            <span class="min-width-0">
              <span class="d-block text-body-2 text-high-emphasis">{{ p.title }}</span>
              <span class="d-block text-caption text-medium-emphasis text-truncate">{{ domain }}{{ p.path }}</span>
            </span>
          </template>
        </v-checkbox>
      </div>
      <div class="d-flex align-center justify-space-between ga-2">
        <v-btn variant="text" class="text-none" @click="startOver">Start over</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="file-text" :disabled="!selectedPages.length" @click="extract">
          Extract text
        </v-btn>
      </div>
    </template>

    <!-- EMPTY -->
    <MpEmptyState
      v-else-if="state === 'empty'"
      icon="file-search"
      title="No pages found"
      :description="`We couldn’t find any readable pages on ${domain}. Check the address, or try a specific page such as your FAQ.`"
      action-label="Try another URL"
      :heading-level="3"
      @action="reset"
    />

    <!-- FAILED -->
    <MpErrorState
      v-else-if="state === 'failed'"
      title="We couldn’t reach this site"
      :description="`${domain} didn’t respond. Check that the address is right and the site is public, then try again.`"
      :heading-level="3"
      @action="findPages"
    />

    <!-- EXTRACTING -->
    <div v-else-if="state === 'extracting'" role="status" aria-live="polite">
      <div class="text-body-2 text-medium-emphasis mb-2">
        Extracting text from {{ selectedPages.length }} {{ selectedPages.length === 1 ? 'page' : 'pages' }}…
      </div>
      <v-progress-linear :model-value="progress" color="primary" rounded aria-label="Extraction progress" />
    </div>

    <!-- DONE -->
    <MpAlert v-else tone="success" title="Website added">
      Text from {{ selectedPages.length }} {{ selectedPages.length === 1 ? 'page' : 'pages' }} on {{ domain }} is now in your knowledge base.
      <template #actions>
        <v-btn variant="text" size="small" class="text-none" @click="startOver">Add another website</v-btn>
      </template>
    </MpAlert>
  </div>
</template>

<style scoped>
.site-crawl {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}
.site-crawl__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-12);
}
/* About six rows tall, then it scrolls — a real site can return dozens of pages. */
.site-crawl__list {
  max-height: calc(var(--mp-component-table-rowMinHeight) * 6);
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-component-input-radius);
  padding: var(--mp-space-4) var(--mp-space-12);
}
.site-crawl__page + .site-crawl__page { border-top: 1px solid var(--border-subtle); }
.site-crawl__page { padding-block: var(--mp-space-4); }
</style>
