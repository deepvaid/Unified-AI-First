<script setup lang="ts">
import tokens from '@/design-tokens/tokens.json'

interface ColorEntry {
  name: string
  value: string
  token: string
}

interface ColorGroup {
  label: string
  colors: ColorEntry[]
}

const colorData = tokens.color as Record<string, Record<string, { $value: string }> | { $description?: string }>

function buildGroups(): ColorGroup[] {
  const groups: ColorGroup[] = []

  for (const [groupKey, groupVal] of Object.entries(colorData)) {
    if (typeof groupVal !== 'object' || '$value' in groupVal) continue
    const colors: ColorEntry[] = []

    for (const [colorKey, colorVal] of Object.entries(groupVal)) {
      if (colorKey === '$description') continue
      if (typeof colorVal === 'object' && '$value' in colorVal) {
        colors.push({
          name: colorKey,
          value: (colorVal as { $value: string }).$value,
          token: `color.${groupKey}.${colorKey}`,
        })
      }
    }

    if (colors.length > 0) {
      groups.push({
        label: groupKey.charAt(0).toUpperCase() + groupKey.slice(1),
        colors,
      })
    }
  }

  return groups
}

const groups = buildGroups()

function textColor(hex: string): string {
  // Return black or white based on luminance
  const clean = hex.replace('#', '')
  if (clean.startsWith('rgba') || clean.length < 6) return '#111928'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#111928' : '#FFFFFF'
}
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="d-flex align-center gap-2 mb-2">
        <v-chip size="x-small" variant="tonal" color="primary" label>Token source</v-chip>
        <span class="text-caption text-medium-emphasis">Structured palette exploration</span>
      </div>
      <div class="design-kit-section-title">Colors</div>
      <div class="text-medium-emphasis mt-1">
        Semantic color palette from <code>tokens.json</code> with light, dark, and sidebar sets.
      </div>
    </div>

    <div v-for="group in groups" :key="group.label" class="mb-8">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="design-kit-group-title">{{ group.label }}</div>
        <v-chip size="x-small" variant="tonal" color="secondary">{{ group.colors.length }} tokens</v-chip>
      </div>

      <div class="design-kit-color-grid">
        <div
          v-for="color in group.colors"
          :key="color.token"
          class="design-kit-color-card"
        >
          <!-- Color swatch -->
          <div
            class="design-kit-swatch"
            :style="{ background: color.value }"
          >
            <span
              class="design-kit-mono design-kit-swatch-text"
              :style="{ color: textColor(color.value) }"
            >
              {{ color.value }}
            </span>
          </div>

          <!-- Meta -->
          <div class="design-kit-card-meta">
            <div class="design-kit-token-name">
              {{ color.name }}
            </div>
            <div class="design-kit-mono design-kit-token-path">
              {{ color.token }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.design-kit-section-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: rgb(var(--v-theme-on-surface));
}

.design-kit-group-title {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.design-kit-color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.design-kit-color-card {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.design-kit-swatch {
  height: 76px;
  display: flex;
  align-items: flex-end;
  padding: 10px;
}

.design-kit-swatch-text {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.95;
}

.design-kit-card-meta {
  background: rgba(var(--v-theme-surface-variant), 0.45);
  padding: 10px 12px;
}

.design-kit-token-name {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.design-kit-token-path {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.design-kit-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
</style>
