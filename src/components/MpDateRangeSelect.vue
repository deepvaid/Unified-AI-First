<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  dateRangePresets,
  dateRangeLabel,
  type DateRangePreset,
  type DateRangeValue,
} from '@/stores/useAnalytics'

// Shared report date-range control: the standard presets plus a Custom range
// (From/To) — used by every Analytics report view so Custom is available and
// behaves identically everywhere. Pair with isWithinRange() to filter rows.
const props = defineProps<{ modelValue: DateRangeValue }>()
const emit = defineEmits<{ 'update:modelValue': [value: DateRangeValue] }>()

const menu = ref(false)
const showCustom = ref(props.modelValue.preset === 'Custom')
const customFrom = ref(props.modelValue.from ?? '')
const customTo = ref(props.modelValue.to ?? '')

// Re-sync the custom fields whenever the popover opens.
watch(menu, (open) => {
  if (!open) return
  showCustom.value = props.modelValue.preset === 'Custom'
  customFrom.value = props.modelValue.from ?? ''
  customTo.value = props.modelValue.to ?? ''
})

const label = computed(() => dateRangeLabel(props.modelValue))
const customValid = computed(() => Boolean(customFrom.value || customTo.value))

// Presets close the menu via Vuetify's native close-on-content-click; the
// custom sub-panel uses @click.stop so it stays open while being filled.
function selectPreset(preset: DateRangePreset) {
  emit('update:modelValue', { preset })
}

function applyCustom() {
  if (!customValid.value) return
  emit('update:modelValue', { preset: 'Custom', from: customFrom.value || undefined, to: customTo.value || undefined })
  menu.value = false
}
</script>

<template>
  <v-menu v-model="menu" location="bottom end" offset="6">
    <template v-slot:activator="{ props: activator }">
      <button v-bind="activator" type="button" class="mp-range-trigger" :class="{ 'mp-range-trigger--active': menu }">
        <v-icon size="18" class="mp-range-trigger__lead">calendar-range</v-icon>
        <span class="mp-range-trigger__label text-truncate">{{ label }}</span>
        <v-icon size="18" class="mp-range-trigger__chev">{{ menu ? 'chevron-up' : 'chevron-down' }}</v-icon>
      </button>
    </template>

    <v-card variant="flat" border rounded="lg" min-width="240" class="mp-range-menu">
      <v-list density="compact" nav class="py-1">
        <v-list-item
          v-for="preset in dateRangePresets"
          :key="preset"
          :active="modelValue.preset === preset"
          :title="preset"
          rounded="md"
          @click="selectPreset(preset)"
        />
        <v-divider class="my-1" />
        <!-- @click.stop keeps the menu open so the custom panel can be filled -->
        <v-list-item
          :active="modelValue.preset === 'Custom'"
          title="Custom range"
          prepend-icon="sliders-horizontal"
          rounded="md"
          @click.stop="showCustom = true"
        />
      </v-list>

      <div v-if="showCustom" class="mp-range-custom pa-3 pt-2">
        <!-- @click.stop on the fields only, so filling them never closes the menu.
             The buttons below stay un-stopped so their clicks close it natively. -->
        <div class="d-flex flex-column gap-2" @click.stop>
          <v-text-field
            v-model="customFrom"
            type="date"
            label="From"
            variant="outlined"
            density="compact"
            hide-details
          />
          <v-text-field
            v-model="customTo"
            type="date"
            label="To"
            variant="outlined"
            density="compact"
            hide-details
          />
        </div>
        <div class="d-flex justify-end gap-2 mt-3">
          <v-btn variant="text" size="small" class="text-none">Cancel</v-btn>
          <v-btn color="primary" variant="flat" size="small" class="text-none" :disabled="!customValid" @click="applyCustom">
            Apply
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped>
.mp-range-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  max-width: 240px;
  padding: 0 12px;
  border: 1px solid var(--border-default);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.mp-range-trigger:hover,
.mp-range-trigger--active {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus-ring) 35%, transparent);
}

.mp-range-trigger__lead,
.mp-range-trigger__chev {
  color: var(--icon-secondary);
  flex-shrink: 0;
}

.mp-range-trigger__label {
  flex: 1 1 auto;
  min-width: 0;
}

.mp-range-custom {
  border-top: 1px solid var(--hairline);
}
</style>
