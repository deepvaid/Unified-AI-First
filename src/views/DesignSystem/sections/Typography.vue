<script setup lang="ts">
import tokens from '@/design-tokens/tokens.json'

const typo = tokens.typography

const fontSizes = Object.entries(typo.fontSize).map(([key, val]) => ({
  key,
  value: (val as { $value: string }).$value,
  token: `typography.fontSize.${key}`,
}))

const fontWeights = Object.entries(typo.fontWeight).map(([key, val]) => ({
  key,
  value: (val as { $value: string }).$value,
  token: `typography.fontWeight.${key}`,
}))

const lineHeights = Object.entries(typo.lineHeight).map(([key, val]) => ({
  key,
  value: (val as { $value: string }).$value,
  token: `typography.lineHeight.${key}`,
}))

const sampleText = 'The quick brown fox jumps over the lazy dog'
const headingSample = 'Maropost Dashboard'
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="d-flex align-center gap-2 mb-2">
        <v-chip size="x-small" variant="tonal" color="secondary" label>Readable hierarchy</v-chip>
        <span class="text-caption text-medium-emphasis">Inter-based scale with restrained contrast</span>
      </div>
      <div class="design-kit-section-title">Typography</div>
      <div class="text-medium-emphasis mt-1">
        Type scale using <strong>Inter</strong> and a mono companion, sourced from <code>tokens.json</code>.
      </div>
    </div>

    <!-- Font Families -->
    <v-card flat border rounded="xl" class="mb-6 pa-6 design-kit-panel">
      <div class="design-kit-card-title">Font Families</div>
      <div class="mb-4">
        <div class="design-kit-sans design-kit-specimen-lg">
          Inter — Base typeface
        </div>
        <div class="design-kit-mono design-kit-token">
          typography.fontFamily.base
        </div>
        <div class="design-kit-sans design-kit-supporting">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
        </div>
      </div>
      <v-divider class="mb-4" />
      <div>
        <div class="design-kit-mono design-kit-specimen-md">
          JetBrains Mono — Code typeface
        </div>
        <div class="design-kit-mono design-kit-token">
          typography.fontFamily.mono
        </div>
        <div class="design-kit-mono design-kit-supporting">
          const tokens = import('./tokens.json')
        </div>
      </div>
    </v-card>

    <!-- Font Size Scale -->
    <v-card flat border rounded="xl" class="mb-6 pa-6 design-kit-panel">
      <div class="design-kit-card-title">Font Size Scale</div>
      <div
        v-for="size in [...fontSizes].reverse()"
        :key="size.key"
        class="design-kit-spec-row"
      >
        <div class="design-kit-spec-label">
          <div class="design-kit-spec-key">{{ size.key }}</div>
          <div class="design-kit-mono design-kit-token">{{ size.value }}</div>
        </div>
        <div
          class="design-kit-sans design-kit-size-sample"
          :style="{ fontSize: size.value }"
        >
          {{ size.key === 'xs' || size.key === 'sm' || size.key === 'body' ? sampleText : headingSample }}
        </div>
      </div>
    </v-card>

    <!-- Font Weights -->
    <div class="design-kit-two-col mb-6">
      <v-card flat border rounded="xl" class="pa-6 design-kit-panel">
        <div class="design-kit-card-title">Font Weights</div>
        <div
          v-for="w in fontWeights"
          :key="w.key"
          class="design-kit-spec-row design-kit-spec-row--tight"
        >
          <div class="design-kit-spec-label design-kit-spec-label--tight">
            <div class="design-kit-spec-key">{{ w.key }}</div>
            <div class="design-kit-mono design-kit-token">{{ w.value }}</div>
          </div>
          <div class="design-kit-sans design-kit-weight-sample" :style="{ fontWeight: w.value }">
            Maropost Commerce
          </div>
        </div>
      </v-card>

      <v-card flat border rounded="xl" class="pa-6 design-kit-panel">
        <div class="design-kit-card-title">Line Heights</div>
        <div
          v-for="lh in lineHeights"
          :key="lh.key"
          class="design-kit-line-height-row"
        >
          <div class="d-flex justify-space-between mb-1">
            <span class="design-kit-spec-key">{{ lh.key }}</span>
            <span class="design-kit-mono design-kit-token">{{ lh.value }}</span>
          </div>
          <div class="design-kit-line-sample design-kit-sans" :style="{ lineHeight: lh.value }">
            Manage your orders, customers, and campaigns from a unified dashboard.
          </div>
        </div>
      </v-card>
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

.design-kit-panel {
  background: rgba(var(--v-theme-surface), 0.85);
}

.design-kit-card-title {
  font-size: 16px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 16px;
}

.design-kit-sans {
  font-family: Inter, system-ui, sans-serif;
  color: rgb(var(--v-theme-on-surface));
}

.design-kit-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: rgb(var(--v-theme-on-surface-variant));
}

.design-kit-token {
  font-size: 11px;
  margin-top: 4px;
}

.design-kit-supporting {
  font-size: 12px;
  margin-top: 4px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.design-kit-specimen-lg {
  font-size: 24px;
}

.design-kit-specimen-md {
  font-size: 18px;
}

.design-kit-spec-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.design-kit-spec-row--tight {
  padding: 10px 0;
}

.design-kit-spec-label {
  width: 100px;
  flex-shrink: 0;
}

.design-kit-spec-label--tight {
  width: 90px;
}

.design-kit-spec-key {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.design-kit-size-sample {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.design-kit-weight-sample {
  font-size: 16px;
}

.design-kit-line-height-row {
  padding: 12px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.design-kit-line-sample {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-surface-variant), 0.55);
  padding: 8px 10px;
  border-radius: 8px;
}

.design-kit-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 960px) {
  .design-kit-two-col {
    grid-template-columns: 1fr;
  }
}
</style>
