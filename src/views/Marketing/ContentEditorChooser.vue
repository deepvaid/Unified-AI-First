<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore, type ContentEditorType } from '@/stores/useContent'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'

/**
 * Select Builder. Rebuilt from UAT `/contents/select` (4 options, creates
 * *content*) and `/content_templates/select_editor` (2 options, creates a
 * *template*). See docs/rebuild/email-content/.
 *
 * The source ships these as two near-identical pages whose titles differ by one
 * word, with no description on any card — `Pull from URL` in particular is left
 * completely unexplained. One component serves both, and every option says what
 * it does.
 */
const route = useRoute()
const router = useRouter()
const store = useContentStore()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
/** Route meta decides which of the two choosers this is. */
const mode = computed<'content' | 'template'>(() => (route.meta.chooserMode === 'template' ? 'template' : 'content'))
const galleryPath = computed(() => `/accounts/${accountId.value}/contents/template`)

interface EditorChoice {
  type: ContentEditorType
  icon: string
  description: string
}

const ALL_CHOICES: EditorChoice[] = [
  {
    type: 'Drag & Drop',
    icon: 'layout-dashboard',
    description: 'Build the email visually from blocks. The best choice if you are not writing code.',
  },
  {
    type: 'WYSIWYG',
    icon: 'type',
    description: 'Write and format in a rich-text editor, like a word processor.',
  },
  {
    type: 'HTML Code Editor',
    icon: 'code',
    description: 'Paste or hand-write the HTML yourself, with full control over the markup.',
  },
  {
    type: 'Pull from URL',
    icon: 'link',
    description: 'Point at a live web page and import its markup as the email body.',
  },
]

// Templates can only be authored in the two visual builders.
const choices = computed(() => (mode.value === 'template' ? ALL_CHOICES.slice(0, 2) : ALL_CHOICES))

function choose(choice: EditorChoice) {
  if (mode.value === 'template' && choice.type === 'Drag & Drop') {
    // The Drag & Drop template path inserts a layout step before its editor.
    router.push({ name: 'TemplateLayouts', params: { accountId: accountId.value } })
    return
  }
  const name = mode.value === 'template' ? 'Untitled template' : 'Untitled content'
  const item = store.createContent(name, choice.type)
  toast.success(`New ${mode.value} started in ${choice.type}`)
  router.push({ name: 'EmailContentEditor', params: { accountId: accountId.value, id: String(item.id) } })
}
</script>

<template>
  <div class="d-flex flex-column ga-6 cec-page">
    <MpPageHeader
      :title="mode === 'template' ? 'Create an email template' : 'Create email content'"
      :subtitle="mode === 'template'
        ? 'A template is a reusable starting point. Choose how you want to build it.'
        : 'Choose how you want to build this email body.'"
      :back-to="galleryPath"
      emphasis="prominent"
    />

    <div class="cec-grid">
      <MpOptionCard
        v-for="choice in choices"
        :key="choice.type"
        :title="choice.type"
        :description="choice.description"
        :icon="choice.icon"
        @click="choose(choice)"
      />
    </div>
  </div>
</template>

<style scoped>
.cec-page {
  max-width: var(--mp-layout-contentMaxWidth);
}

.cec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--mp-space-20);
}
</style>
