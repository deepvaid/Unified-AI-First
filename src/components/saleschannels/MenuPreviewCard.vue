<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { itemLinkLabel, type StoreMenu } from '@/stores/useStoreNavigation'

const props = withDefaults(
  defineProps<{
    menu: StoreMenu
    storeName?: string
  }>(),
  {
    storeName: 'Your store',
  },
)

type PreviewVariant = 'header' | 'footer'

const variant = ref<PreviewVariant>('header')

// Menus named/handled like a footer menu preview as a footer by default.
watch(
  () => props.menu.handle + props.menu.name,
  () => {
    const key = `${props.menu.handle} ${props.menu.name}`.toLowerCase()
    variant.value = key.includes('footer') ? 'footer' : 'header'
  },
  { immediate: true },
)

const previewItems = computed(() =>
  props.menu.items.map((item) => ({
    id: item.id,
    title: item.title.trim() || 'Untitled',
    caption: itemLinkLabel(item),
    placeholder: !item.title.trim(),
  })),
)
</script>

<template>
  <v-card variant="flat" border rounded="lg">
    <div class="d-flex align-center justify-space-between px-4 pt-3">
      <div class="text-subtitle-2 font-weight-bold">Storefront preview</div>
      <v-btn-toggle v-model="variant" density="compact" variant="outlined" divided mandatory rounded="lg">
        <v-btn value="header" size="x-small" class="text-none px-3">Header</v-btn>
        <v-btn value="footer" size="x-small" class="text-none px-3">Footer</v-btn>
      </v-btn-toggle>
    </div>

    <div class="pa-4">
      <div class="mpv-frame" :class="variant === 'footer' ? 'mpv-frame--footer' : ''">
        <!-- Header variant: top navigation bar -->
        <template v-if="variant === 'header'">
          <div class="mpv-topbar">
            <div class="d-flex align-center gap-2 min-width-0">
              <span class="mpv-logo" aria-hidden="true" />
              <span class="text-caption font-weight-bold text-truncate">{{ storeName }}</span>
            </div>
            <div class="d-flex align-center gap-2">
              <v-icon size="12" class="mpv-muted">search</v-icon>
              <v-icon size="12" class="mpv-muted">shopping-bag</v-icon>
            </div>
          </div>
          <nav class="mpv-navrow" aria-label="Menu preview">
            <v-tooltip v-for="item in previewItems" :key="item.id" location="top" :text="item.caption">
              <template v-slot:activator="{ props: tooltipProps }">
                <span v-bind="tooltipProps" class="mpv-link" :class="item.placeholder ? 'mpv-link--placeholder' : ''">
                  {{ item.title }}
                </span>
              </template>
            </v-tooltip>
            <span v-if="previewItems.length === 0" class="text-caption mpv-muted">Add items to see them here</span>
          </nav>
          <div class="mpv-hero">
            <div class="mpv-hero__bar" />
            <div class="mpv-hero__bar mpv-hero__bar--short" />
          </div>
        </template>

        <!-- Footer variant: stacked footer links -->
        <template v-else>
          <div class="mpv-footer">
            <div class="text-caption font-weight-bold mb-2 mpv-footer__title">{{ menu.name.trim() || 'Menu' }}</div>
            <div class="d-flex flex-column gap-1">
              <v-tooltip v-for="item in previewItems" :key="item.id" location="top" :text="item.caption">
                <template v-slot:activator="{ props: tooltipProps }">
                  <span v-bind="tooltipProps" class="mpv-footer__link" :class="item.placeholder ? 'mpv-link--placeholder' : ''">
                    {{ item.title }}
                  </span>
                </template>
              </v-tooltip>
              <span v-if="previewItems.length === 0" class="text-caption mpv-footer__muted">Add items to see them here</span>
            </div>
            <div class="mpv-footer__legal">© {{ storeName }}</div>
          </div>
        </template>
      </div>

      <div class="text-caption text-medium-emphasis mt-3">
        Hover a link to see where it points. Themes reference this menu by its handle.
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.mpv-frame {
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-chip);
  overflow: hidden;
  background: var(--surface-primary);
}

.mpv-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-8);
  padding: var(--mp-space-8) var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
}

.mpv-logo {
  width: 14px;
  height: 14px;
  border-radius: var(--mp-radius-4);
  background: var(--accent);
  flex-shrink: 0;
}

.mpv-navrow {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
  flex-wrap: wrap;
  padding: var(--mp-space-8) var(--mp-space-12);
  border-bottom: 1px solid var(--border-subtle);
}

.mpv-link {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-medium);
  cursor: default;
  white-space: nowrap;
}

.mpv-link--placeholder {
  opacity: 0.45;
  font-style: italic;
}

.mpv-muted {
  opacity: 0.55;
}

.mpv-hero {
  padding: var(--mp-space-16) var(--mp-space-12) var(--mp-space-20);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}

.mpv-hero__bar {
  height: 8px;
  width: 70%;
  border-radius: var(--mp-radius-4);
  background: rgba(var(--v-border-color), calc(var(--v-border-opacity) * 2));
}

.mpv-hero__bar--short {
  width: 45%;
}

.mpv-footer {
  padding: var(--mp-space-12);
  background: rgb(var(--v-theme-on-surface));
  color: rgb(var(--v-theme-surface));
}

.mpv-footer__title {
  opacity: 0.9;
}

.mpv-footer__link {
  font-size: var(--mp-fontSize-11);
  opacity: 0.75;
  cursor: default;
}

.mpv-footer__muted {
  opacity: 0.5;
}

.mpv-footer__legal {
  margin-top: var(--mp-space-12);
  font-size: var(--mp-fontSize-10);
  opacity: 0.45;
}

.min-width-0 {
  min-width: 0;
}
</style>
