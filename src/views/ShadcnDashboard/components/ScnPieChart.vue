<script setup lang="ts">
// Solid pie ("Orders by sales channel") — wedge paths from the mockup.
defineProps<{ wedges: Array<{ d: string; color: string }>; label: string }>()

</script>

<template>
  <svg viewBox="0 0 120 120" class="dt-pie" role="img" :aria-label="label">
    <path v-for="wedge in wedges" :key="wedge.color" :d="wedge.d" :fill="wedge.color" />
  </svg>
</template>

<style scoped>
.dt-pie {
  width: 132px;
  height: 132px;
  flex: none;
  display: block;
}
</style>
