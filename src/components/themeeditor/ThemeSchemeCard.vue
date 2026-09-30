<script setup lang="ts">
import MpIconButton from '@/components/MpIconButton.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

// A colour or type scheme in Theme Settings (store builder re-skin): name, the "Default" mark,
// edit/remove controls, and a preview swatch supplied by the host. The default scheme cannot be
// removed — the control is disabled rather than hidden so the row keeps its shape.
defineProps<{
  name: string
  isDefault?: boolean
}>()

const emit = defineEmits<{
  edit: []
  remove: []
}>()

defineSlots<{
  /** The scheme's preview (swatches or type sample). */
  default(): unknown
}>()
</script>

<template>
  <v-card variant="flat" border rounded="lg" class="te-scheme">
    <div class="te-scheme__head">
      <span class="te-scheme__name text-truncate">{{ name }}</span>
      <MpStatusChip v-if="isDefault" status="Default" type="general" size="sm" />
      <span class="te-scheme__actions">
        <MpIconButton size="sm" icon="pencil" :ariaLabel="`Edit ${name}`" @click="emit('edit')" />
        <!-- The default scheme can't be removed; the control stays (disabled) so the row keeps its shape. -->
        <MpIconButton size="sm" icon="trash-2" :ariaLabel="`Remove ${name}`" :disabled="isDefault" @click="emit('remove')" />
      </span>
    </div>
    <div class="te-scheme__preview">
      <slot />
    </div>
  </v-card>
</template>

<style scoped>
.te-scheme {
  overflow: hidden;
}

.te-scheme__head {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  min-height: var(--mp-component-control-height);
  padding-inline: var(--mp-space-12) var(--mp-space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
}

.te-scheme__name {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
}

.te-scheme__actions {
  display: inline-flex;
  gap: var(--mp-space-2);
  margin-left: auto;
}

.te-scheme__preview {
  padding: var(--mp-component-card-paddingCompact);
}
</style>
