<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore, type DynamicContentRule } from '@/stores/useMarketingAssets'
import { useContactsStore } from '@/stores/useContacts'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import DynamicContentBlockEditor from '@/components/marketing/DynamicContentBlockEditor.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/dynamic_contents/new and /:id/edit — the
// full-page dynamic content editor: Name (lowercase/numbers/underscores),
// the Original Content Preview block, and one block per segment rule with
// + ADD NEW RULE. CKEditor is out of sandbox scope (GAPS.md); each block is
// the shared DynamicContentBlockEditor stand-in.

const route = useRoute()
const router = useRouter()
const store = useMarketingAssetsStore()
const contactsStore = useContactsStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const editingId = computed(() => (route.name === 'DynamicContentEdit' ? Number(route.params.id) : null))
const existing = computed(() => store.dynamicContents.find(d => d.id === editingId.value))
const notFound = computed(() => editingId.value !== null && !existing.value)

const segmentOptions = computed(() => contactsStore.segments.map(s => ({ title: s.name, value: s.id })))

const NAME_PATTERN = /^[a-z0-9_]+$/
const name = ref(existing.value?.name ?? '')
const nameTouched = ref(false)
const contentFeedId = ref<number | null>(existing.value?.contentFeedId ?? null)
const originalContent = ref(existing.value?.originalContent ?? '')

let ruleSeq = Math.max(0, ...(existing.value?.rules.map(r => r.id) ?? [0]))
function blankRule(): DynamicContentRule {
  ruleSeq += 1
  return { id: ruleSeq, segmentId: null, segmentName: '', contentFeedId: null, content: '' }
}

const rules = ref<DynamicContentRule[]>(
  existing.value ? existing.value.rules.map(r => ({ ...r })) : [blankRule()],
)

const nameError = computed(() => {
  if (!nameTouched.value) return ''
  if (!name.value.trim()) return 'Name is required'
  if (!NAME_PATTERN.test(name.value)) return 'Must only contain lowercase letters, numbers or underscores.'
  return ''
})

const canSave = computed(() =>
  name.value.trim() !== '' &&
  NAME_PATTERN.test(name.value) &&
  rules.value.every(r => r.segmentId !== null),
)

function addRule() {
  rules.value.push(blankRule())
}

function removeRule(id: number) {
  rules.value = rules.value.filter(r => r.id !== id)
}

function onSegmentChange(rule: DynamicContentRule) {
  rule.segmentName = segmentOptions.value.find(o => o.value === rule.segmentId)?.title ?? ''
}

// Content Preview modal (per block)
const previewOpen = ref(false)
const previewHtml = ref('')
function openPreview(content: string) {
  previewHtml.value = content
  previewOpen.value = true
}

function cancel() {
  router.push(`/accounts/${accountId.value}/dynamic_contents`)
}

function save() {
  nameTouched.value = true
  if (!canSave.value) return
  const payload = {
    name: name.value.trim(),
    contentFeedId: contentFeedId.value,
    originalContent: originalContent.value,
    rules: rules.value.map(r => ({ ...r })),
    archived: existing.value?.archived ?? false,
  }
  if (editingId.value !== null) {
    store.updateDynamicContent(editingId.value, payload)
    toast.success('Dynamic content updated')
  } else {
    store.addDynamicContent(payload)
    toast.success('Dynamic content created')
  }
  cancel()
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <template v-if="!notFound">
      <MpPageHeader
        :title="editingId !== null ? 'Edit Dynamic Content' : 'New Dynamic Content'"
        eyebrow="Dynamic Content"
        :back-to="`/accounts/${accountId}/dynamic_contents`"
      />

      <v-card variant="flat" border rounded="lg" class="editor-card">
        <v-text-field
          v-model="name"
          label="Name *"
          placeholder="e.g. spring_hero_block"
          hint="Must only contain lowercase letters, numbers or underscores."
          persistent-hint
          :error-messages="nameError ? [nameError] : []"
          class="name-field"
          @blur="nameTouched = true"
        />

        <MpFormSection
          title="Original Content Preview"
          description="This content will be displayed to the contacts who do not fall into any of the below segment groups (under rules)."
          :heading-level="2"
        />
        <DynamicContentBlockEditor
          v-model:content="originalContent"
          v-model:content-feed-id="contentFeedId"
          body-label="Original content body"
          @preview="openPreview(originalContent)"
        />

        <template v-for="(rule, index) in rules" :key="rule.id">
          <div class="rule-heading">
            <MpFormSection :title="`Rule ${index + 1}`" :heading-level="2" />
            <v-btn
              icon="trash-2"
              variant="text"
              size="small"
              :aria-label="`Remove rule ${index + 1}`"
              :disabled="rules.length === 1"
              @click="removeRule(rule.id)"
            />
          </div>
          <v-select
            v-model="rule.segmentId"
            :items="segmentOptions"
            label="Segment *"
            clearable
            class="segment-field"
            :rules="[v => v !== null || 'Segment is required']"
            @update:model-value="onSegmentChange(rule)"
          />
          <DynamicContentBlockEditor
            v-model:content="rule.content"
            v-model:content-feed-id="rule.contentFeedId"
            :body-label="`Rule ${index + 1} body`"
            @preview="openPreview(rule.content)"
          />
        </template>

        <v-btn variant="text" color="primary" prepend-icon="plus" class="text-none align-self-start" @click="addRule">
          Add new rule
        </v-btn>

        <div class="d-flex justify-end ga-3">
          <v-btn variant="flat" color="surface" class="text-none" @click="cancel">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">Save</v-btn>
        </div>
      </v-card>

      <MpDialog v-model="previewOpen" title="Content Preview" size="md">
        <p v-if="previewHtml" class="preview-body">{{ previewHtml }}</p>
        <p v-else class="text-medium-emphasis">This block has no content yet.</p>
      </MpDialog>
    </template>

    <MpEmptyState
      v-else
      icon="shuffle"
      title="Dynamic content not found"
      description="This record does not exist or has been archived."
      action-label="Back to Dynamic Content"
      @action="cancel"
      class="py-10"
    />
  </div>
</template>

<style scoped>
.editor-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  max-width: 1080px;
}

.name-field,
.segment-field {
  max-width: 480px;
}

.rule-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.preview-body {
  white-space: pre-wrap;
  margin: 0;
}
</style>
