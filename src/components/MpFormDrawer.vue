<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  title: string
  subtitle?: string
  width?: number
}>(), {
  width: 480,
})

const drawerWidth = computed(() => props.width)
</script>

<template>
  <v-navigation-drawer
    v-model="model"
    :width="drawerWidth"
    location="right"
    temporary
    scrim
    class="mp-form-drawer"
    aria-label="Side panel"
  >
    <div class="mp-form-drawer__panel d-flex flex-column h-100">
      <div class="mp-form-drawer__header d-flex align-start ga-3 pa-5">
        <div class="min-width-0 flex-grow-1">
          <div class="text-subtitle-1 font-weight-bold">{{ title }}</div>
          <div v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</div>
        </div>
        <v-btn
          icon="x"
          variant="text"
          size="small"
          density="comfortable"
          aria-label="Close"
          @click="model = false"
        />
      </div>
      <v-divider />

      <div class="mp-form-drawer__body flex-grow-1 overflow-auto pa-5">
        <slot />
      </div>

      <template v-if="$slots.footer">
        <v-divider />
        <div class="mp-form-drawer__footer d-flex align-center justify-end ga-2 pa-4">
          <slot name="footer" />
        </div>
      </template>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.mp-form-drawer {
  z-index: 2005;
}

.mp-form-drawer__panel {
  background: rgb(var(--v-theme-surface));
}
</style>
