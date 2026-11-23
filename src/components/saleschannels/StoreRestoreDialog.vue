<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import { useToast } from '@/composables/useToast'
import { useDemoStores } from '@/stores/useDemoStores'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'

// "Restore original store", confirmed: the one dialog the store's Settings tab and
// its Themes page both open. What it lists comes from restoreSummary
// (src/storefront/demoStores/summary.ts), counted by useDemoStores().restorePreview.

const props = defineProps<{
  modelValue: boolean
  channelId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  restored: []
}>()

const demoStores = useDemoStores()
const toast = useToast()
const channel = computed(() => useSalesChannelsStore().channels.find((c) => c.id === props.channelId))
// Counted as the dialog opens and kept while it closes, so the list does not change under the fade.
const preview = ref<ReturnType<typeof demoStores.restorePreview>>(null)
watch(() => props.modelValue, (open) => {
  if (open) preview.value = demoStores.restorePreview(props.channelId)
}, { immediate: true })
const blank = computed(() => demoStores.restoreFacts(props.channelId)?.original === null)

function restore() {
  const name = channel.value?.name ?? 'The store'
  const wasBlank = blank.value
  if (!demoStores.restore(props.channelId)) return
  toast.success(wasBlank ? `${name} is blank again` : `${name} is back to how it started`)
  emit('restored')
}
</script>

<template>
  <MpConfirmDialog
    :model-value="modelValue"
    title="Restore the original store?"
    :message="preview?.message ?? ''"
    :consequences="preview?.lines ?? []"
    confirm-label="Restore store"
    danger
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="restore"
  />
</template>
