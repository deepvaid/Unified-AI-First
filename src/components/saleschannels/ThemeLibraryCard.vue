<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import type { ThemeCard } from '@/storefront/demoStores'

/**
 * ThemeLibraryCard — one theme in a store's theme library (Store › Themes): a
 * picture of its storefront, its name, version, kind and description, the store
 * it is shown on, and what this store can do with it.
 *
 * A static card, never a button: it holds its own buttons. The page decides the
 * state; the card only shows it. Until the picture loads, or when it is missing,
 * the frame keeps its 16:10 shape on a quiet surface with a mark in the middle.
 */
export type ThemeLibraryAction = 'apply' | 'restore' | 'current' | 'none'

const props = withDefaults(defineProps<{
  card: ThemeCard
  /** The store the theme is shown on: "Northfold (demo)". */
  showcaseName: string
  /**
   * What this store can do with the theme: `apply` it; `restore` it (the store's
   * original theme while another one runs); `current`, it runs it now (a "Current
   * theme" chip, and Preview reads Show store); `none`, the store can't take a theme.
   */
  action?: ThemeLibraryAction
  /** Where Preview (or Show store) opens, in a new tab. Absent: there is no Preview. */
  previewHref?: string
  /** The other theme the showcase store runs now. Without a `previewHref`, the card says Preview is unavailable because of it. */
  showcaseRuns?: string
  /** The showcase store is the store whose library this is: the note then says how to see the theme again. */
  showcaseIsHere?: boolean
  headingLevel?: 2 | 3 | 4
}>(), {
  action: 'apply',
  headingLevel: 3,
})

const emit = defineEmits<{
  apply: []
  restore: []
}>()

const titleTag = computed(() => `h${props.headingLevel}`)
const previewLabel = computed(() => (props.action === 'current' ? 'Show store' : 'Preview'))
const previewName = computed(() => (props.action === 'current' ? 'Show store (opens in a new tab)' : `Preview ${props.card.name} (opens in a new tab)`))
const previewNote = computed(() => {
  if (props.previewHref || !props.showcaseRuns) return ''
  return props.showcaseIsHere
    ? `This store runs ${props.showcaseRuns} right now. Restore it to see this theme again.`
    : `Its showcase store runs ${props.showcaseRuns} right now, so it can't be previewed.`
})
const hasButtons = computed(() => props.action === 'apply' || props.action === 'restore' || !!props.previewHref)

const loaded = ref(false)
const failed = ref(false)
watch(() => props.card.thumbnail, () => {
  loaded.value = false
  failed.value = false
})
</script>

<template>
  <v-card flat border rounded="lg" class="theme-card d-flex flex-column">
    <div class="theme-card__frame">
      <img
        v-if="!failed"
        :key="card.thumbnail"
        :src="card.thumbnail"
        :alt="`Storefront of the ${card.name} theme`"
        class="theme-card__picture"
        :class="{ 'theme-card__picture--loaded': loaded }"
        loading="lazy"
        decoding="async"
        @load="loaded = true"
        @error="failed = true"
      >
      <v-icon v-if="!loaded" size="28" class="theme-card__mark" aria-hidden="true">layout-template</v-icon>
    </div>

    <div class="theme-card__body">
      <div class="theme-card__head">
        <div class="min-width-0">
          <div class="theme-card__title">
            <component :is="titleTag" class="text-subtitle-1 font-weight-medium ma-0">{{ card.name }}</component>
            <span class="text-caption text-medium-emphasis">v{{ card.version }}</span>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ card.kind }}</div>
        </div>
        <MpStatusChip v-if="action === 'current'" status="Current theme" size="sm" class="flex-shrink-0" />
      </div>

      <p class="text-body-2 text-medium-emphasis ma-0">{{ card.description }}</p>

      <div class="theme-card__showcase text-caption text-medium-emphasis">
        <v-icon size="14" aria-hidden="true">store</v-icon>
        <span>Showcase: {{ showcaseName }}</span>
      </div>

      <div v-if="hasButtons || previewNote" class="theme-card__footer">
        <div v-if="hasButtons" class="theme-card__actions">
          <v-btn v-if="action === 'apply'" color="primary" variant="flat" class="text-none" :aria-label="`Apply ${card.name}`" @click="emit('apply')">
            Apply
          </v-btn>
          <v-btn v-else-if="action === 'restore'" color="primary" variant="flat" prepend-icon="rotate-ccw" class="text-none" @click="emit('restore')">
            Restore original store
          </v-btn>
          <v-btn
            v-if="previewHref"
            variant="outlined"
            prepend-icon="external-link"
            class="text-none"
            :href="previewHref"
            target="_blank"
            rel="noopener"
            :aria-label="previewName"
          >
            {{ previewLabel }}
          </v-btn>
        </div>
        <p v-if="previewNote" class="text-caption text-medium-emphasis ma-0">{{ previewNote }}</p>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.theme-card__frame {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 10;
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
}

/* Picture and mark share the one cell, so the frame never changes size. */
.theme-card__picture,
.theme-card__mark {
  grid-area: 1 / 1;
}

.theme-card__picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  opacity: 0;
  transition: opacity var(--mp-motion-duration-base) var(--mp-motion-easing-standard);
}

.theme-card__picture--loaded {
  opacity: 1;
}

.theme-card__mark {
  color: var(--icon-secondary);
}

.theme-card__body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: var(--mp-space-12);
  padding: var(--mp-component-card-padding);
}

.theme-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.theme-card__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--mp-space-6);
}

/* The mark stays on the first line when a long store name wraps. */
.theme-card__showcase {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-6);
}

.theme-card__showcase .v-icon {
  flex-shrink: 0;
  margin-top: var(--mp-space-2);
}

/* The actions sit at the foot of the card, so cards in one row line them up. */
.theme-card__footer {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  margin-top: auto;
  padding-top: var(--mp-space-4);
}

.theme-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
}

.min-width-0 {
  min-width: 0;
}
</style>
