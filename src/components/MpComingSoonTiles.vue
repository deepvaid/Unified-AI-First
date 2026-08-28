<script setup lang="ts">
// "Coming soon" panel: a centered icon + headline + blurb above a grid of
// feature tiles previewing what the surface will offer. Extracted from the
// Retail Settings / Hardware pages, which were 86% identical.

export interface ComingSoonTile {
  /** Lucide icon name. */
  icon: string
  title: string
  /** One sentence describing the planned capability. */
  desc: string
}

withDefaults(defineProps<{
  /** Lucide icon for the panel's centered badge. */
  icon: string
  /** Headline, e.g. "Hardware management coming soon". */
  title: string
  /** Supporting paragraph under the headline. */
  description?: string
  tiles: ComingSoonTile[]
  /** Tile column width at the sm breakpoint. */
  smCols?: string | number
  /** Tile column width at the md breakpoint. Omit to keep the sm width. */
  mdCols?: string | number
  /** Heading level for the headline — match the surrounding page outline. */
  headingLevel?: 'h2' | 'h3' | 'h4'
}>(), {
  description: '',
  smCols: 6,
  mdCols: undefined,
  headingLevel: 'h3',
})
</script>

<template>
  <v-card flat border rounded="lg" class="coming-soon-card">
    <div class="text-center mb-5">
      <div class="coming-soon-card__icon mx-auto mb-3">
        <v-icon size="28">{{ icon }}</v-icon>
      </div>
      <component :is="headingLevel" class="text-h6 mb-1">{{ title }}</component>
      <p v-if="description" class="text-body-2 text-medium-emphasis mb-0 mx-auto" style="max-width: var(--mp-component-state-measureWide);">
        {{ description }}
      </p>
    </div>

    <v-row dense>
      <v-col v-for="tile in tiles" :key="tile.title" cols="12" :sm="smCols" :md="mdCols">
        <div class="coming-soon-tile">
          <div class="coming-soon-tile__icon">
            <v-icon size="18">{{ tile.icon }}</v-icon>
          </div>
          <div>
            <div class="coming-soon-tile__title">{{ tile.title }}</div>
            <div class="coming-soon-tile__desc">{{ tile.desc }}</div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped lang="scss">
.coming-soon-card {
  background: var(--surface-primary) !important;
  border-color: color-mix(in oklch, var(--text-primary) 7%, transparent) !important;
  border-radius: var(--mp-component-card-radius) !important;
  padding: var(--mp-component-card-padding);
}

.coming-soon-card__icon {
  width: var(--mp-space-48);
  height: var(--mp-space-48);
  border-radius: var(--mp-component-card-radius);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
}

.coming-soon-tile {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-space-12);
  padding: var(--mp-component-card-paddingCompact);
  border: 1px solid color-mix(in oklch, var(--text-primary) 8%, transparent);
  border-radius: var(--mp-component-card-radius);
  background: var(--surface-primary);
  height: 100%;
}

.coming-soon-tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  border-radius: var(--mp-component-chip-radius);
  background: color-mix(in oklch, var(--cloud-retail-accent) 12%, transparent);
  color: var(--cloud-retail-text);
  flex-shrink: 0;
}

.coming-soon-tile__title {
  font-size: var(--mp-fontSize-13);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.coming-soon-tile__desc {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  line-height: 1.4;
  margin-top: var(--mp-space-2);
}
</style>
