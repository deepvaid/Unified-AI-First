<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore, TEMPLATE_LAYOUTS, type TemplateLayout } from '@/stores/useContent'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'

/**
 * Layout step. Rebuilt from UAT `/content_templates/layouts` — the extra step the
 * Drag & Drop template path inserts before its editor, which the WYSIWYG path
 * skips entirely. See docs/rebuild/email-content/.
 */
const route = useRoute()
const router = useRouter()
const store = useContentStore()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const chooserPath = computed(() => `/accounts/${accountId.value}/content_templates/select_editor`)

function choose(layout: TemplateLayout) {
  const item = store.createContent(`Untitled template — ${layout.name.toLowerCase()}`, 'Drag & Drop')
  toast.success(`Template started with the ${layout.name.toLowerCase()} layout`)
  router.push({ name: 'EmailContentEditor', params: { accountId: accountId.value, id: String(item.id) } })
}
</script>

<template>
  <div class="d-flex flex-column ga-6 tl-page">
    <MpPageHeader
      title="Choose a layout"
      subtitle="Pick the row structure to start from. You can add, remove and rearrange rows later."
      :back-to="chooserPath"
      emphasis="prominent"
    />

    <div class="tl-grid">
      <MpOptionCard
        v-for="layout in TEMPLATE_LAYOUTS"
        :key="layout.id"
        :title="layout.name"
        :description="layout.description"
        @click="choose(layout)"
      >
        <template #media>
          <div class="tl-preview">
            <div v-if="!layout.rows.length" class="tl-preview__empty">
              <v-icon size="26">square-dashed</v-icon>
            </div>
            <div
              v-for="(cols, rowIndex) in layout.rows"
              :key="rowIndex"
              class="tl-preview__row"
              :style="{ '--tl-cols': cols }"
            >
              <span v-for="col in cols" :key="col" class="tl-preview__cell" />
            </div>
          </div>
        </template>
      </MpOptionCard>
    </div>
  </div>
</template>

<style scoped>
.tl-page {
  max-width: var(--mp-layout-contentMaxWidth);
}

.tl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--mp-space-20);
}

.tl-preview {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  aspect-ratio: 4 / 3;
  padding: var(--mp-space-12);
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-surface-variant));
}

.tl-preview__empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgb(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-4);
  color: rgb(var(--v-theme-on-surface-variant));
}

.tl-preview__row {
  display: grid;
  grid-template-columns: repeat(var(--tl-cols), 1fr);
  gap: var(--mp-space-6);
  flex: 1;
}

.tl-preview__cell {
  border-radius: var(--mp-radius-4);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
}
</style>
