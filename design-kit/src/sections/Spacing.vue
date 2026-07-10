<script setup lang="ts">
import tokens from '@/design-tokens/tokens.json'

// Spacing
const spacingEntries = Object.entries(tokens.spacing)
  .filter(([k]) => k !== '$description')
  .map(([key, val]) => ({
    key,
    value: (val as { $value: string }).$value,
    token: `spacing.${key}`,
  }))

// Border radius
const radiusEntries = Object.entries(tokens.borderRadius)
  .filter(([k]) => k !== '$description')
  .map(([key, val]) => ({
    key,
    value: (val as { $value: string }).$value,
    token: `borderRadius.${key}`,
  }))

// Shadows
const shadowEntries = Object.entries(tokens.shadow)
  .filter(([k]) => k !== '$description')
  .map(([key, val]) => ({
    key,
    value: (val as { $value: string }).$value,
    token: `shadow.${key}`,
  }))

// Layout
const layoutEntries = Object.entries(tokens.layout)
  .filter(([k]) => k !== '$description')
  .map(([key, val]) => ({
    key,
    value: (val as { $value: string }).$value,
    token: `layout.${key}`,
  }))
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="d-flex align-center gap-2 mb-2">
        <v-chip size="x-small" variant="tonal" color="primary" label>Spatial rhythm</v-chip>
        <span class="text-caption text-medium-emphasis">4px base spacing with structured surfaces</span>
      </div>
      <div class="design-kit-section-title">Spacing &amp; Layout</div>
      <div class="text-medium-emphasis mt-1">
        4px base spacing scale, radii, shadows, and layout dimensions.
      </div>
    </div>

    <!-- Spacing scale -->
    <v-card flat border rounded="xl" class="mb-6 pa-6 design-kit-panel">
      <div class="design-kit-card-title">Spacing Scale</div>
      <div
        v-for="s in spacingEntries"
        :key="s.key"
        class="design-kit-spec-row design-kit-spec-row--tight design-kit-spec-row--center"
      >
        <!-- Label -->
        <div class="design-kit-spacing-label">
          <span class="design-kit-spec-key">{{ s.key }}</span>
        </div>
        <!-- Bar -->
        <div
          class="design-kit-spacing-bar"
          :style="{ width: s.value }"
        />
        <!-- Value -->
        <div>
          <span class="design-kit-mono design-kit-token">{{ s.value }}</span>
          <span class="design-kit-token-path ml-2">{{ s.token }}</span>
        </div>
      </div>
    </v-card>

    <!-- Border radius + Shadows side by side -->
    <div class="design-kit-two-col mb-6">
      <!-- Border Radius -->
      <v-card flat border rounded="xl" class="pa-6 design-kit-panel">
        <div class="design-kit-card-title">Border Radius</div>
        <div class="design-kit-radius-grid">
          <div v-for="r in radiusEntries" :key="r.key" class="text-center">
            <div
              class="design-kit-radius-swatch"
              :style="{ borderRadius: r.value }"
            />
            <div class="design-kit-spec-key">{{ r.key }}</div>
            <div class="design-kit-mono design-kit-token">{{ r.value }}</div>
          </div>
        </div>
      </v-card>

      <!-- Shadows -->
      <v-card flat border rounded="xl" class="pa-6 design-kit-panel">
        <div class="design-kit-card-title">Shadows</div>
        <div class="design-kit-shadow-stack">
          <div v-for="s in shadowEntries" :key="s.key" class="design-kit-shadow-row">
            <div
              class="design-kit-shadow-sample"
              :style="{ boxShadow: s.value }"
            />
            <div>
              <div class="design-kit-spec-key">{{ s.key }}</div>
              <div class="design-kit-mono design-kit-token mt-1">{{ s.value }}</div>
            </div>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Layout dimensions -->
    <v-card flat border rounded="xl" class="pa-6 design-kit-panel">
      <div class="design-kit-card-title">Layout Dimensions</div>
      <div class="design-kit-layout-grid">
        <div
          v-for="l in layoutEntries"
          :key="l.key"
          class="design-kit-layout-card"
        >
          <div class="design-kit-spec-key">{{ l.key }}</div>
          <div class="design-kit-layout-value">{{ l.value }}</div>
          <div class="design-kit-mono design-kit-token">{{ l.token }}</div>
        </div>
      </div>
    </v-card>
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

.design-kit-spec-row--center {
  align-items: center;
}

.design-kit-spacing-label {
  width: 60px;
  flex-shrink: 0;
  text-align: right;
}

.design-kit-spec-key {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.design-kit-mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: rgb(var(--v-theme-on-surface-variant));
}

.design-kit-token {
  font-size: 11px;
}

.design-kit-token-path {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.design-kit-spacing-bar {
  height: 16px;
  min-width: 4px;
  flex-shrink: 0;
  border-radius: 4px;
  background: rgb(var(--v-theme-primary));
}

.design-kit-radius-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.design-kit-radius-swatch {
  width: 64px;
  height: 64px;
  margin: 0 auto 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1.5px solid rgba(var(--v-theme-primary), 0.35);
}

.design-kit-shadow-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.design-kit-shadow-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.design-kit-shadow-sample {
  width: 80px;
  height: 48px;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  flex-shrink: 0;
}

.design-kit-layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.design-kit-layout-card {
  background: rgba(var(--v-theme-surface-variant), 0.35);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.design-kit-layout-value {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-primary));
  margin: 4px 0;
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
