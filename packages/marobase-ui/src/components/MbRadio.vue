<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MbRadioProps, MbRadioState } from './MbRadio.types';
import '../styles/mb-radio.css';

const props = withDefaults(defineProps<MbRadioProps>(), {
  modelValue: false,
  size: 'lg',
  state: 'default',
  label: 'Label',
  caption: '',
  hint: 'Hint text',
  errorMessage: 'Error message',
  disabled: false,
  allowDeselect: false,
  required: false,
  ariaLabel: undefined
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'change', value: boolean): void;
  (event: 'focus', payload: FocusEvent): void;
  (event: 'blur', payload: FocusEvent): void;
}>();

const hasFocus = ref(false);

const checked = computed(() => Boolean(props.modelValue));
const state = computed<MbRadioState>(() => {
  if (props.disabled) return 'disabled';
  return props.state;
});
const isDisabled = computed(() => state.value === 'disabled');
const isError = computed(() => state.value === 'error');

const visualState = computed<MbRadioState>(() => {
  if (isDisabled.value) return 'disabled';
  if (props.state !== 'default') return props.state;
  if (hasFocus.value) return 'focus';
  return 'default';
});

const message = computed(() => (isError.value ? props.errorMessage : props.hint));

function onToggle() {
  if (isDisabled.value) return;

  if (checked.value && !props.allowDeselect) {
    return;
  }

  const next = !checked.value;
  emit('update:modelValue', next);
  emit('change', next);
}

function onFocus(event: FocusEvent) {
  if (isDisabled.value) return;
  hasFocus.value = true;
  emit('focus', event);
}

function onBlur(event: FocusEvent) {
  hasFocus.value = false;
  emit('blur', event);
}

function onKeydown(event: KeyboardEvent) {
  if (isDisabled.value) return;

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    onToggle();
  }
}
</script>

<template>
  <div class="mb-rd" :data-size="size" :data-state="visualState" :data-checked="checked ? 'true' : 'false'">
    <button
      type="button"
      class="mb-rd__button"
      role="radio"
      :aria-label="ariaLabel ?? label"
      :aria-checked="checked ? 'true' : 'false'"
      :disabled="isDisabled"
      @click="onToggle"
      @keydown="onKeydown"
      @focus="onFocus"
      @blur="onBlur"
    >
      <span class="mb-rd__control" aria-hidden="true">
        <span class="mb-rd__dot" />
      </span>

      <span class="mb-rd__content">
        <span class="mb-rd__label">
          {{ label }}
          <span v-if="required" class="mb-rd__required">*</span>
        </span>
        <span v-if="caption" class="mb-rd__caption">{{ caption }}</span>
      </span>
    </button>

    <p v-if="message" class="mb-rd__message" :class="isError ? 'mb-rd__message--error' : 'mb-rd__message--hint'">
      {{ message }}
    </p>
  </div>
</template>
