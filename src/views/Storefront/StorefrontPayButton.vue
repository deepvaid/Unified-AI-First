<script setup lang="ts">
import { ref } from 'vue'

// The checkout's pay button and, under it, who secures the payment. Shared by the
// checkout and the admin's "What shoppers see" preview.

defineProps<{
  label: string
  busy?: boolean
  /** Show "Payments secured by Maropay" under the button. */
  secured?: boolean
}>()

const button = ref<HTMLButtonElement | null>(null)

defineExpose({ focus: () => button.value?.focus() })
</script>

<template>
  <div class="sf-co__pay-block">
    <button ref="button" type="submit" class="sf-button sf-button--block sf-co__pay" :disabled="busy">
      {{ label }}
    </button>
    <p v-if="secured" class="sf-co__secured sf-muted"><v-icon size="14">lock</v-icon> Payments secured by Maropay</p>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-co__pay-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-co__pay {
  height: 56px;
  font-size: 16px;
}

.sf-co__secured {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  font-size: 13px;
}
</style>
