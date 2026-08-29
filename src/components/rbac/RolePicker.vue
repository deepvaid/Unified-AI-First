<script setup lang="ts">
import { computed } from 'vue'
import { useRbacStore } from '@/stores/useRbac'
import type { Role } from '@/stores/rbacData'

const props = withDefaults(defineProps<{
  /** Selected role ids. */
  modelValue: string[]
  /** Disables every checkbox (e.g. the account owner's roles can't change). */
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const rbac = useRbacStore()
const groups = computed(() => rbac.assignableRoles)

function isChecked(id: string): boolean {
  return props.modelValue.includes(id)
}

function toggle(role: Role, locked: boolean) {
  if (props.disabled || locked) return
  emit(
    'update:modelValue',
    isChecked(role.id) ? props.modelValue.filter(id => id !== role.id) : [...props.modelValue, role.id],
  )
}

/** Name of an already-selected role this one conflicts with, if any. */
function conflictWithSelection(role: Role): string | null {
  if (isChecked(role.id)) return null
  const selected = props.modelValue.map(id => rbac.roleById(id)).filter((r): r is Role => Boolean(r))
  const hit = selected.find(s => (role.conflictsWith ?? []).includes(s.id) || (s.conflictsWith ?? []).includes(role.id))
  return hit?.name ?? null
}

function usage(id: string): number {
  return rbac.roleUsage[id] ?? 0
}
</script>

<template>
  <div class="mp-role-picker">
    <section v-for="group in groups" :key="group.product" class="picker-group">
      <header class="picker-group__header">
        <span class="picker-group__title">{{ group.label }}</span>
        <v-chip v-if="group.provisional && !group.locked" size="x-small" variant="tonal" color="warning">Provisional</v-chip>
        <v-icon v-if="group.locked" size="14" class="picker-group__lock">lock</v-icon>
      </header>

      <p v-if="group.locked" class="picker-group__locked-note">
        Requires a {{ group.label }} subscription — not included in this account’s plan.
      </p>

      <div v-else class="picker-group__roles">
        <div
          v-for="role in group.roles"
          :key="role.id"
          class="picker-role"
          :class="{ 'picker-role--selected': isChecked(role.id) }"
        >
          <v-checkbox-btn
            :model-value="isChecked(role.id)"
            :disabled="disabled"
            :aria-label="`${role.name} — ${group.label}`"
            density="compact"
            class="picker-role__checkbox"
            @update:model-value="toggle(role, false)"
          />
          <button type="button" class="picker-role__body" :disabled="disabled" tabindex="-1" @click="toggle(role, false)">
            <span class="picker-role__name-row">
              <span class="picker-role__name">{{ role.name }}</span>
              <v-chip size="x-small" variant="tonal" :color="role.system ? 'secondary' : 'primary'">
                {{ role.system ? 'System' : 'Custom' }}
              </v-chip>
              <span class="picker-role__usage">{{ usage(role.id) }} user{{ usage(role.id) === 1 ? '' : 's' }}</span>
            </span>
            <span class="picker-role__description">{{ role.description }}</span>
            <span v-if="conflictWithSelection(role)" class="picker-role__conflict">
              <v-icon size="12">alert-triangle</v-icon>
              Conflicts with {{ conflictWithSelection(role) }}
            </span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.mp-role-picker {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picker-group__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
}

.picker-group__title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.picker-group__lock {
  color: var(--muted);
}

.picker-group__locked-note {
  margin: 0;
  padding: 10px 12px;
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  font-size: 12.5px;
  color: var(--muted);
  background: var(--surface-secondary);
}

.picker-group__roles {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.picker-role {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 8px 10px 8px 4px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--surface-primary);
  transition: border-color 120ms ease, background 120ms ease;
}

.picker-role--selected {
  border-color: color-mix(in oklch, rgb(var(--v-theme-primary)) 45%, transparent);
  background: color-mix(in oklch, rgb(var(--v-theme-primary)) 4%, var(--surface-primary));
}

.picker-role__checkbox {
  flex: 0 0 auto;
  margin-top: -2px;
}

.picker-role__body {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 2px 0 0;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.picker-role__body:disabled {
  cursor: default;
}

.picker-role__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.picker-role__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.picker-role__usage {
  font-size: 11.5px;
  color: var(--muted);
}

.picker-role__description {
  font-size: 12px;
  line-height: 1.45;
  color: var(--muted);
}

.picker-role__conflict {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgb(var(--v-theme-warning));
}
</style>
