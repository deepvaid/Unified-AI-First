<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ACTION_LABELS,
  PERMISSION_CATALOG,
  PRODUCT_META,
  PRODUCT_ORDER,
  REQUIRED_BY,
  expandWithDependencies,
  permissionLabel,
  type Permission,
  type PermissionModule,
  type ProductKey,
} from '@/stores/rbacData'

const props = withDefaults(defineProps<{
  /** Granted permission ids. */
  modelValue: string[]
  /** Products to render; defaults to the full catalog. */
  products?: ProductKey[]
  /** Read-only rendering (check / minus icons instead of checkboxes). */
  readonly?: boolean
}>(), {
  products: () => [...PRODUCT_ORDER],
  readonly: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const visibleProducts = computed(() =>
  PERMISSION_CATALOG.filter(p => props.products.includes(p.key)),
)

const activeProduct = ref<ProductKey>(props.products[0] ?? 'platform')
watch(() => props.products, (next) => {
  if (!next.includes(activeProduct.value)) activeProduct.value = next[0] ?? 'platform'
}, { immediate: true })

const currentModules = computed<PermissionModule[]>(() =>
  visibleProducts.value.find(p => p.key === activeProduct.value)?.modules ?? [],
)

const granted = computed(() => new Set(props.modelValue))

function isChecked(id: string): boolean {
  return granted.value.has(id)
}

/** A granted permission is locked while another granted permission requires it. */
function lockedBy(id: string): string | null {
  if (!isChecked(id)) return null
  const holder = (REQUIRED_BY[id] ?? []).find(dependent => granted.value.has(dependent))
  return holder ? permissionLabel(holder) : null
}

function withoutDependents(model: string[], removeId: string): string[] {
  return model.filter(id => id !== removeId && !expandWithDependencies([id]).includes(removeId))
}

function toggle(perm: Permission) {
  if (props.readonly || lockedBy(perm.id)) return
  emit(
    'update:modelValue',
    isChecked(perm.id)
      ? withoutDependents(props.modelValue, perm.id)
      : expandWithDependencies([...props.modelValue, perm.id]),
  )
}

function moduleState(mod: PermissionModule) {
  const ids = mod.permissions.map(p => p.id)
  const count = ids.filter(id => granted.value.has(id)).length
  return { all: count === ids.length && ids.length > 0, some: count > 0, count, total: ids.length }
}

function toggleModule(mod: PermissionModule) {
  if (props.readonly) return
  const ids = mod.permissions.map(p => p.id)
  if (moduleState(mod).all) {
    let next = [...props.modelValue]
    for (const id of ids) next = withoutDependents(next, id)
    emit('update:modelValue', next)
  } else {
    emit('update:modelValue', expandWithDependencies([...props.modelValue, ...ids]))
  }
}

function grantedInProduct(key: ProductKey): number {
  return props.modelValue.filter(id => id.startsWith(`${key}.`)).length
}
</script>

<template>
  <div class="mp-permission-matrix">
    <v-tabs
      v-if="visibleProducts.length > 1"
      v-model="activeProduct"
      density="compact"
      color="primary"
      class="matrix-tabs"
      aria-label="Permission catalog by product"
    >
      <v-tab v-for="p in visibleProducts" :key="p.key" :value="p.key" class="text-none">
        {{ PRODUCT_META[p.key].label }}
        <v-chip v-if="grantedInProduct(p.key) > 0" size="x-small" variant="tonal" color="primary" class="ml-2">
          {{ grantedInProduct(p.key) }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <v-alert
      v-if="PRODUCT_META[activeProduct]?.provisional"
      type="info"
      variant="tonal"
      density="compact"
      rounded="lg"
      class="text-body-2"
    >
      Commerce permissions are provisional — the MCC permission catalog is still being finalized by the product team.
    </v-alert>

    <div class="matrix-modules">
      <section v-for="mod in currentModules" :key="mod.id" class="matrix-module">
        <header class="matrix-module__header">
          <span class="matrix-module__title">{{ mod.label }}</span>
          <span class="matrix-module__meta">{{ moduleState(mod).count }} of {{ moduleState(mod).total }}</span>
          <v-checkbox-btn
            v-if="!readonly"
            :model-value="moduleState(mod).all"
            :indeterminate="moduleState(mod).some && !moduleState(mod).all"
            :aria-label="`Grant all ${mod.label} permissions`"
            density="compact"
            color="primary"
            class="matrix-module__toggle"
            @update:model-value="toggleModule(mod)"
          />
        </header>

        <div class="matrix-module__rows">
          <div
            v-for="perm in mod.permissions"
            :key="perm.id"
            class="matrix-row"
            :class="{ 'matrix-row--readonly': readonly }"
          >
            <template v-if="readonly">
              <v-icon size="16" :color="isChecked(perm.id) ? 'success' : 'grey-lighten-1'">
                {{ isChecked(perm.id) ? 'circle-check' : 'circle-minus' }}
              </v-icon>
            </template>
            <template v-else>
              <v-checkbox-btn
                :model-value="isChecked(perm.id)"
                :disabled="Boolean(lockedBy(perm.id))"
                :aria-label="`${perm.label ?? ACTION_LABELS[perm.action]} — ${mod.label}`"
                density="compact"
                color="primary"
                class="matrix-row__checkbox"
                @update:model-value="toggle(perm)"
              />
            </template>

            <button
              type="button"
              class="matrix-row__label"
              :class="{ 'matrix-row__label--off': readonly && !isChecked(perm.id) }"
              :disabled="readonly || Boolean(lockedBy(perm.id))"
              tabindex="-1"
              @click="toggle(perm)"
            >
              {{ perm.label ?? ACTION_LABELS[perm.action] }}
            </button>

            <v-tooltip v-if="lockedBy(perm.id)" location="top" :text="`Required by ${lockedBy(perm.id)}`">
              <template #activator="{ props: tooltipProps }">
                <v-icon v-bind="tooltipProps" size="13" class="matrix-row__lock" aria-hidden="false" :aria-label="`Required by ${lockedBy(perm.id)}`">
                  lock
                </v-icon>
              </template>
            </v-tooltip>

            <span v-if="perm.label" class="matrix-row__action">{{ ACTION_LABELS[perm.action] }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.matrix-tabs {
  border-bottom: 1px solid var(--border-subtle);
}

/* The matrix owns the space between its tabs, its notice and the module list —
   those two used to carry an `mb-4` each. */
.mp-permission-matrix {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

.matrix-modules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.matrix-module {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--surface-primary);
  overflow: hidden;
}

.matrix-module__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 14px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.matrix-module__title {
  font-size: 13px;
  font-weight: 650;
  color: var(--text-primary);
}

.matrix-module__meta {
  flex: 1;
  font-size: 11.5px;
  color: var(--muted);
}

.matrix-module__toggle {
  flex: 0 0 auto;
}

.matrix-module__rows {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 0 12px;
  padding: 6px 10px;
}

.matrix-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  min-width: 0;
}

.matrix-row--readonly {
  gap: 9px;
  padding-left: 4px;
}

.matrix-row__checkbox {
  flex: 0 0 auto;
}

.matrix-row__label {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-row__label:disabled {
  cursor: default;
}

.matrix-row__label--off {
  color: var(--muted);
}

.matrix-row__lock {
  color: var(--muted);
  flex-shrink: 0;
}

.matrix-row__action {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
</style>
