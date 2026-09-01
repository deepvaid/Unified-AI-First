<script setup lang="ts">
import { computed } from 'vue'
import { useMarketingAssetsStore } from '@/stores/useMarketingAssets'

/**
 * One editable body block of a dynamic content record — the "Original Content
 * Preview" and each rule reuse it. A plain textarea stands in for UAT's
 * CKEditor (GAPS.md); the tag menus mirror the editor's Maropost dropdowns
 * and insert unresolved merge tags.
 */
const props = defineProps<{
  content: string
  contentFeedId: number | null
  /** Accessible name for the body textarea, e.g. "Original content body". */
  bodyLabel: string
}>()

const emit = defineEmits<{
  'update:content': [value: string]
  'update:contentFeedId': [value: number | null]
  preview: []
}>()

const store = useMarketingAssetsStore()

const feedOptions = computed(() => store.feeds.map(f => ({ title: f.name, value: f.id })))

/** The CKEditor dropdown groups observed in UAT, reduced to insertable tags. */
const TAG_MENUS: Array<{ label: string; tags: string[] }> = [
  { label: 'Campaign Tags', tags: ['{{campaign.name}}', '{{campaign.subject}}', '{{campaign.from_email}}'] },
  { label: 'Contact Tags', tags: ['{{contact.first_name}}', '{{contact.last_name}}', '{{contact.email}}'] },
  { label: 'Other Tags', tags: ['{{account.address}}', '{{current.year}}'] },
  { label: 'Dynamic Areas', tags: ['{{dynamic_area:hero}}', '{{dynamic_area:offer}}'] },
  { label: 'Table Tags', tags: ['{{table.order_items}}'] },
  { label: 'Coupon Tags', tags: ['{{coupon.code}}'] },
  { label: 'Product Feeds', tags: ['{{feed.products | limit: 3}}'] },
]

function insertTag(tag: string) {
  const body = props.content
  emit('update:content', body ? `${body} ${tag}` : tag)
}
</script>

<template>
  <div class="dc-block">
    <v-select
      :model-value="contentFeedId"
      :items="[{ title: 'No content feed', value: null as number | null }, ...feedOptions]"
      label="Content Feed"
      clearable
      class="dc-block__feed"
      @update:model-value="(v: number | null) => emit('update:contentFeedId', v)"
    />

    <div class="dc-block__toolbar" role="toolbar" aria-label="Insert merge tags">
      <v-menu v-for="menu in TAG_MENUS" :key="menu.label">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" size="small" variant="outlined" class="text-none" append-icon="chevron-down">
            {{ menu.label }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-for="tag in menu.tags" :key="tag" :title="tag" @click="insertTag(tag)" />
        </v-list>
      </v-menu>
    </div>

    <v-textarea
      :model-value="content"
      :label="bodyLabel"
      rows="5"
      auto-grow
      placeholder="Write the block's HTML or text — merge tags render at send time"
      @update:model-value="(v: string) => emit('update:content', v)"
    />

    <v-btn variant="flat" color="surface" class="text-none align-self-start" @click="emit('preview')">Preview</v-btn>
  </div>
</template>

<style scoped>
.dc-block {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

.dc-block__feed {
  max-width: 420px;
}

.dc-block__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
}
</style>
