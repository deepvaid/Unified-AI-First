<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  subtitle?: string
  icon?: string
  maxWidth?: number | string
  width?: number | string
  closeLabel?: string
}>(), {
  icon: 'sparkles',
  maxWidth: 720,
  closeLabel: 'Close',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const localOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <v-dialog v-model="localOpen" :max-width="maxWidth" :width="width" scrollable>
    <v-card flat border rounded="lg" class="dv-dialog-shell">
      <header class="dv-dialog-shell__head">
        <v-icon color="primary" size="18">{{ icon }}</v-icon>
        <div class="dv-dialog-shell__head-text">
          <div class="dv-dialog-shell__title">{{ title }}</div>
          <div v-if="subtitle" class="dv-dialog-shell__sub">{{ subtitle }}</div>
        </div>
        <v-btn icon size="32" variant="text" :aria-label="closeLabel" @click="localOpen = false">
          <v-icon size="16">x</v-icon>
        </v-btn>
      </header>

      <slot />

      <template v-if="$slots.footer">
        <v-divider />
        <footer class="dv-dialog-shell__foot">
          <slot name="footer" />
        </footer>
      </template>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.dv-dialog-shell {
  background: rgb(var(--v-theme-surface));
  border-radius: 14px !important;
  overflow: hidden;
}

.dv-dialog-shell__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgb(var(--v-theme-outline-variant));
}

.dv-dialog-shell__head-text {
  flex: 1;
  min-width: 0;
}

.dv-dialog-shell__title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.1px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dv-dialog-shell__sub {
  font-size: 12.5px;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
  line-height: 1.3;
}

.dv-dialog-shell__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface-light, var(--v-theme-surface)));
}
</style>
