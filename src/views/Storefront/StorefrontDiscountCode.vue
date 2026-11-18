<script setup lang="ts">
// The discount code field of the cart and the checkout: type a code and apply it,
// or see the applied one with a way to take it off. What a code is worth is the
// page's business (storefrontDiscount.ts); this only asks and reports.

defineProps<{
  /** The code in force, or empty. */
  applied: string
  /** Why the last code typed can't be used. */
  problem: string | null
  /** Unique on the page: the cart and the checkout never share one, but ids must not clash. */
  idPrefix: string
}>()

const typed = defineModel<string>('typed', { required: true })

defineEmits<{ apply: []; remove: [] }>()
</script>

<template>
  <div class="sf-code">
    <p v-if="applied" class="sf-code__applied">
      <v-icon size="16" aria-hidden="true">tag</v-icon>
      <span>Code <strong>{{ applied }}</strong> applied</span>
      <button type="button" class="sf-code__remove" @click="$emit('remove')">Remove<span class="sf-code__sr"> code {{ applied }}</span></button>
    </p>
    <form v-else class="sf-code__form" novalidate @submit.prevent="$emit('apply')">
      <label :for="`${idPrefix}-code`" class="sf-code__label">Discount code</label>
      <div class="sf-code__row">
        <input
          :id="`${idPrefix}-code`"
          v-model="typed"
          class="sf-input sf-code__input"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          :aria-invalid="!!problem"
          :aria-describedby="problem ? `${idPrefix}-code-err` : undefined"
        >
        <button type="submit" class="sf-button sf-button--secondary sf-code__apply">Apply</button>
      </div>
      <span v-if="problem" :id="`${idPrefix}-code-err`" class="sf-field__error" role="alert">{{ problem }}</span>
    </form>
  </div>
</template>

<style scoped src="./storefront-controls.css"></style>
<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. */
.sf-code__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sf-code__label {
  font-size: 14px;
  font-weight: 500;
}

.sf-code__row {
  display: flex;
  gap: 8px;
}

.sf-code__input {
  flex: 1;
  min-width: 0;
  height: 44px;
  text-transform: uppercase;
}

.sf-code__apply {
  height: 44px;
  padding: 0 18px;
  font-size: 14px;
}

.sf-code__applied {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
}

.sf-code__remove {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.sf-code__remove:focus-visible {
  outline: 2px solid var(--sf-accent, #2563eb);
  outline-offset: 2px;
}

.sf-code__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
