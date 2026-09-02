<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpDialog from '@/components/MpDialog.vue'
import JourneyMiniPreview from '@/components/marketing/JourneyMiniPreview.vue'
import type { JourneyTemplate } from '@/stores/journeyFlowData'
import { templateSetupById, type DetailBlock } from '@/stores/journeyTemplateSetup'

/**
 * The template detail dialog of Journey Selection: flow preview + the
 * template's long description + Create. Production shows a static PNG of the
 * flow; here the preview is the live template graph.
 */
const props = defineProps<{
  modelValue: boolean
  template: JourneyTemplate | null
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  create: [templateId: string]
}>()

const route = useRoute()
const accountId = computed(() => String(route.params.accountId ?? ''))

const blocks = computed<DetailBlock[]>(() =>
  props.template ? templateSetupById[props.template.id]?.details ?? [] : [],
)

function hrefFor(href: string): string {
  return href.replace(':accountId', accountId.value)
}
function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href)
}
</script>

<template>
  <MpDialog
    :model-value="modelValue"
    :title="template?.name ?? ''"
    subtitle="Template"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="template" class="jtd-preview border rounded-lg bg-background" aria-label="Flow preview">
      <JourneyMiniPreview :nodes="template.nodes" />
    </div>

    <div class="d-flex flex-column ga-3 text-body-2">
      <template v-for="(block, i) in blocks" :key="i">
        <p v-if="block.text" class="ma-0">
          {{ block.text }}
          <template v-if="block.link">
            {{ ' ' }}
            <a
              :href="hrefFor(block.link.href)"
              class="text-primary"
              :target="isExternal(block.link.href) ? '_blank' : undefined"
              :rel="isExternal(block.link.href) ? 'noopener' : undefined"
            >{{ block.link.label }}</a>
          </template>
        </p>
        <ul v-if="block.items" class="pl-6 ma-0">
          <li v-for="item in block.items" :key="item">{{ item }}</li>
        </ul>
      </template>
    </div>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="emit('update:modelValue', false)">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        append-icon="arrow-right"
        @click="template && emit('create', template.id)"
      >
        Create
      </v-btn>
    </template>
  </MpDialog>
</template>

<style scoped>
.jtd-preview {
  padding: var(--mp-space-20) var(--mp-space-16);
  overflow-x: auto;
  display: flex;
  justify-content: center;
}
</style>
