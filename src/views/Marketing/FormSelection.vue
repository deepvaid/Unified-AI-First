<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import type { FormType, PopupPosition } from '@/stores/useForms'

/**
 * Form Selection. Rebuilt from UAT `/acquisition/forms/select` — a full route,
 * not a dialog. See docs/rebuild/acquisition-forms/.
 *
 * The source renders every card as a blank ~370px box for several seconds while
 * its preview loads, puts "Create from scratch" title at the top while every
 * other card puts it at the bottom, and orphans the seventh card on its own row.
 * Here the cards are a uniform grid with a drawn preview that needs no network.
 */
const route = useRoute()
const router = useRouter()
const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/accounts/${accountId.value}/acquisition/forms`)

interface FormTemplate {
  id: string
  name: string
  description: string
  type: FormType | null
  position: PopupPosition | null
  /** Drives the drawn preview's layout. */
  layout: 'scratch' | 'split' | 'stacked' | 'bar' | 'inline'
  accent: string
}

const TEMPLATES: FormTemplate[] = [
  {
    id: 'scratch',
    name: 'Create from scratch',
    description: 'Start with an empty canvas and build the form yourself.',
    type: null, position: null, layout: 'scratch', accent: 'surface-variant',
  },
  {
    id: 'first-order-discount',
    name: 'First order discount',
    description: 'Offer a percentage off in exchange for an email address.',
    type: 'Popup', position: 'classic-center', layout: 'split', accent: 'primary',
  },
  {
    id: 'neutral-modern',
    name: 'Neutral modern',
    description: 'A plain, brand-agnostic popup that suits any storefront.',
    type: 'Popup', position: 'classic-center', layout: 'stacked', accent: 'secondary',
  },
  {
    id: 'looking-for-something',
    name: 'Looking for something?',
    description: 'Catch visitors who are about to leave without buying.',
    type: 'Popup', position: 'classic-center', layout: 'split', accent: 'info',
  },
  {
    id: 'be-the-first-to-know',
    name: 'Be the first to know',
    description: 'A slim strip for restock and launch announcements.',
    type: 'Embedded', position: null, layout: 'bar', accent: 'success',
  },
  {
    id: 'join-the-club',
    name: 'Join the club',
    description: 'A membership pitch for loyalty and rewards programmes.',
    type: 'Embedded', position: null, layout: 'inline', accent: 'warning',
  },
  {
    id: 'welcome-coupon',
    name: 'Welcome coupon',
    description: 'Hand new subscribers a coupon code as soon as they sign up.',
    type: 'Embedded', position: null, layout: 'inline', accent: 'primary',
  },
]

function choose(template: FormTemplate) {
  router.push({
    name: 'FormBuilder',
    params: { accountId: accountId.value },
    query: {
      template: template.id,
      ...(template.type ? { type: template.type } : {}),
      ...(template.position ? { position: template.position } : {}),
    },
  })
}
</script>

<template>
  <div class="d-flex flex-column ga-6 fs-page">
    <MpPageHeader
      title="Form selection"
      subtitle="Start from a template, or build a form from scratch"
      :back-to="listPath"
      emphasis="prominent"
    />

    <div class="fs-grid">
      <MpOptionCard
        v-for="template in TEMPLATES"
        :key="template.id"
        :selected="false"
        :title="template.name"
        :description="template.description"
        @click="choose(template)"
      >
        <template #media>
          <div class="fs-preview" :class="`fs-preview--${template.layout}`" :style="{ '--fs-accent': `rgb(var(--v-theme-${template.accent}))` }">
            <template v-if="template.layout === 'scratch'">
              <v-icon size="32" class="fs-preview__icon">square-dashed-mouse-pointer</v-icon>
            </template>
            <template v-else>
              <div class="fs-preview__panel">
                <span class="fs-preview__title" />
                <span class="fs-preview__line" />
                <span class="fs-preview__field" />
                <span class="fs-preview__cta" />
              </div>
            </template>
          </div>
        </template>

        <div v-if="template.type" class="d-flex ga-2 mt-2">
          <MpStatusChip :status="template.type" type="general" size="sm" variant="outlined" />
          <MpStatusChip v-if="template.position" status="Center" type="general" size="sm" variant="outlined" />
        </div>
      </MpOptionCard>
    </div>
  </div>
</template>

<style scoped>
.fs-page {
  max-width: var(--mp-layout-contentMaxWidth);
}

.fs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--mp-space-20);
}

/* A fixed ratio, so the gallery is a grid rather than a ragged column. */
.fs-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
}

.fs-preview__icon {
  color: rgb(var(--v-theme-on-surface-variant));
}

.fs-preview__panel {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  width: 62%;
  padding: var(--mp-space-16);
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--mp-shadow-sm);
}

.fs-preview__title,
.fs-preview__line,
.fs-preview__field,
.fs-preview__cta {
  display: block;
  border-radius: var(--mp-radius-4);
}

.fs-preview__title {
  height: var(--mp-space-10);
  width: 80%;
  background: rgb(var(--v-theme-on-surface));
  opacity: 0.75;
}

.fs-preview__line {
  height: var(--mp-space-6);
  width: 60%;
  background: rgb(var(--v-theme-on-surface));
  opacity: 0.3;
}

.fs-preview__field {
  height: var(--mp-space-14);
  width: 100%;
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
}

.fs-preview__cta {
  height: var(--mp-space-12);
  width: 55%;
  background: var(--fs-accent);
}

/* The layouts differ in how the panel sits inside the frame. */
.fs-preview--split {
  background: var(--fs-accent);
  justify-content: flex-end;
  padding-right: var(--mp-space-16);
}

.fs-preview--stacked .fs-preview__panel {
  width: 72%;
}

.fs-preview--bar {
  align-items: flex-end;
  padding-bottom: var(--mp-space-12);
}

.fs-preview--bar .fs-preview__panel {
  width: 88%;
  flex-direction: row;
  align-items: center;
}

.fs-preview--inline .fs-preview__panel {
  width: 80%;
}
</style>
