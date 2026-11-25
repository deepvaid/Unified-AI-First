<script setup lang="ts">
import { computed } from 'vue'
import { unbrokenHyphens } from '@/storefront/listing'

// What a cart, checkout or order line says under its name. On a store that sells parts
// (`unbroken`) the text — "Front · Part # TQ-BRK-4471 · Fits 2019 Ford F-150" — is drawn
// so a line never breaks inside a part number or a model ("F-" | "150") or after
// "Part #"; screen readers get the text as it is. Any other store's text is drawn as it
// always was. P4-8, out of system like the rest of the storefront.

const props = defineProps<{
  text: string
  unbroken?: boolean
}>()

const shown = computed(() => unbrokenHyphens(props.text).replace(/# /g, '# '))
</script>

<template>
  <span v-if="unbroken"><span class="sf-line-text__sr">{{ text }}</span><span aria-hidden="true">{{ shown }}</span></span>
  <span v-else>{{ text }}</span>
</template>

<style scoped>
.sf-line-text__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
