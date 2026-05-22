<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  MbTabItem,
  MbTabsChangePayload,
  MbTabsProps,
  MbTabsState
} from './MbTabs.types';
import '../styles/mb-tabs.css';

const defaultItems: MbTabItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'profile', label: 'Profile', dot: true },
  { id: 'notifications', label: 'Notifications', badge: 1 },
  { id: 'more', label: '...', icon: 'more' }
];

const props = withDefaults(defineProps<MbTabsProps>(), {
  items: () => [],
  modelValue: undefined,
  state: 'default',
  disabled: false,
  ariaLabel: 'Tabs',
  variant: 'pill',
  orientation: 'horizontal'
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'tab-change', payload: MbTabsChangePayload): void;
}>();

const hasFocus = ref(false);

const items = computed<MbTabItem[]>(() => {
  if (props.items.length > 0) {
    return props.items;
  }

  return defaultItems;
});

function firstEnabledId() {
  return items.value.find((item) => !item.disabled)?.id ?? items.value[0]?.id ?? '';
}

const internalActive = ref(firstEnabledId());
const isControlled = computed(() => props.modelValue !== undefined);

watch(
  () => props.modelValue,
  (next) => {
    if (typeof next === 'string' && next.length > 0) {
      internalActive.value = next;
    }
  },
  { immediate: true }
);

watch(
  () => items.value,
  () => {
    if (!items.value.some((item) => item.id === internalActive.value)) {
      internalActive.value = firstEnabledId();
    }
  },
  { deep: true }
);

const activeId = computed(() => {
  const candidate = isControlled.value ? props.modelValue ?? '' : internalActive.value;
  if (candidate && items.value.some((item) => item.id === candidate && !item.disabled)) {
    return candidate;
  }

  return firstEnabledId();
});

const state = computed<MbTabsState>(() => {
  if (props.disabled) {
    return 'disabled';
  }

  if (props.state !== 'default') {
    return props.state;
  }

  if (hasFocus.value) {
    return 'focus';
  }

  return 'default';
});

function isDisabled(item: MbTabItem): boolean {
  return props.disabled || Boolean(item.disabled);
}

function isActive(item: MbTabItem): boolean {
  return item.id === activeId.value;
}

function setActive(item: MbTabItem, index: number, event: MouseEvent | KeyboardEvent) {
  if (isDisabled(item)) {
    return;
  }

  if (!isControlled.value) {
    internalActive.value = item.id;
  }

  emit('update:modelValue', item.id);
  emit('tab-change', { item, index, event });
}

function moveFocus(current: HTMLButtonElement, direction: 1 | -1) {
  const root = current.closest('[data-mb-tabs]');
  if (!root) {
    return;
  }

  const controls = Array.from(root.querySelectorAll<HTMLButtonElement>('.mb-tabs__tab:not(:disabled)'));
  if (controls.length === 0) {
    return;
  }

  const currentIndex = controls.indexOf(current);
  if (currentIndex < 0) {
    return;
  }

  const nextIndex = (currentIndex + direction + controls.length) % controls.length;
  controls[nextIndex]?.focus();
}

function onTabKeydown(item: MbTabItem, index: number, event: KeyboardEvent) {
  const target = event.currentTarget as HTMLButtonElement | null;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    setActive(item, index, event);
    return;
  }

  if (!target) {
    return;
  }

  if (
    (props.orientation === 'horizontal' && event.key === 'ArrowRight') ||
    (props.orientation === 'vertical' && event.key === 'ArrowDown')
  ) {
    event.preventDefault();
    moveFocus(target, 1);
    return;
  }

  if (
    (props.orientation === 'horizontal' && event.key === 'ArrowLeft') ||
    (props.orientation === 'vertical' && event.key === 'ArrowUp')
  ) {
    event.preventDefault();
    moveFocus(target, -1);
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    const first = target
      .closest('[data-mb-tabs]')
      ?.querySelector<HTMLButtonElement>('.mb-tabs__tab:not(:disabled)');
    first?.focus();
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    const controls = Array.from(
      target
        .closest('[data-mb-tabs]')
        ?.querySelectorAll<HTMLButtonElement>('.mb-tabs__tab:not(:disabled)') ?? []
    );
    controls[controls.length - 1]?.focus();
  }
}
</script>

<template>
  <nav
    class="mb-tabs"
    data-mb-tabs
    :data-state="state"
    :data-variant="variant"
    :data-orientation="orientation"
    :aria-label="ariaLabel"
    @focusin="hasFocus = true"
    @focusout="hasFocus = false"
  >
    <div class="mb-tabs__list" role="tablist" :aria-orientation="orientation">
      <button
        v-for="(item, index) in items"
        :id="`mb-tab-${item.id}`"
        :key="item.id"
        class="mb-tabs__tab"
        role="tab"
        type="button"
        :aria-label="item.ariaLabel ?? (item.badge !== undefined ? `${item.label} (${item.badge})` : item.label)"
        :aria-selected="isActive(item) ? 'true' : 'false'"
        :aria-controls="`mb-tab-panel-${item.id}`"
        :tabindex="isActive(item) ? 0 : -1"
        :data-active="isActive(item) ? 'true' : 'false'"
        :disabled="isDisabled(item)"
        @click="setActive(item, index, $event)"
        @keydown="onTabKeydown(item, index, $event)"
      >
        <span v-if="item.icon && item.icon !== 'none'" class="mb-tabs__icon" aria-hidden="true">
          <svg
            v-if="item.icon === 'home'"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.75 10.2L12 3.5L20.25 10.2V20.5H14.75V14H9.25V20.5H3.75V10.2Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>

          <svg
            v-else-if="item.icon === 'more'"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="6" cy="12" r="1.8" fill="currentColor" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
            <circle cx="18" cy="12" r="1.8" fill="currentColor" />
          </svg>

          <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 4.5L19.5 12L12 19.5L4.5 12L12 4.5Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>
        </span>

        <span class="mb-tabs__label">{{ item.label }}</span>

        <span v-if="item.dot" class="mb-tabs__dot" aria-hidden="true" />

        <span v-if="item.badge !== undefined" class="mb-tabs__badge" aria-hidden="true">
          {{ item.badge }}
        </span>
      </button>
    </div>
  </nav>
</template>
