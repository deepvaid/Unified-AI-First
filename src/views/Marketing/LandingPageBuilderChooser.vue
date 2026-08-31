<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useLandingPagesStore,
  getLandingTemplate,
  cloneLandingBlock,
  EDITOR_TYPE_LABEL,
  type EditorType,
  type LandingPageBlock,
  type LandingPageStyle,
} from '@/stores/useLandingPages'
import { useToast } from '@/composables/useToast'
import MpWizardShell from '@/components/MpWizardShell.vue'
import MpWizardStepCard from '@/components/MpWizardStepCard.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpFormField from '@/components/MpFormField.vue'

/**
 * Select Builder — step 2 of "create a landing page".
 * Rebuilt from UAT `/accounts/:id/landing_pages/create`; see
 * docs/rebuild/landing-pages/AUDIT.md §3.
 *
 * The source's two options are PNG background-images on bare `<div>`s: no role,
 * no tabindex, no text, no alt. A keyboard user cannot choose a builder at all
 * (AUDIT D23/D24). Here each option is a real MpOptionCard — focusable,
 * Enter/Space-operable, with a text label and a line explaining the difference
 * the source never explains.
 */
const store = useLandingPagesStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.accountId))
const templateId = computed(() => (typeof route.query.template === 'string' ? route.query.template : null))

/** Either a library template, a saved template, or nothing (blank page). */
const starting = computed<{ name: string; blocks: LandingPageBlock[]; style: Partial<LandingPageStyle> } | null>(() => {
  const id = templateId.value
  if (!id) return null
  if (id.startsWith('saved-')) {
    const saved = store.getTemplate(Number(id.slice('saved-'.length)))
    if (!saved) return null
    return { name: saved.name, blocks: saved.blocks.map(cloneLandingBlock), style: { ...saved.style } }
  }
  const tpl = getLandingTemplate(id)
  if (!tpl) return null
  return { name: tpl.name, blocks: tpl.blocks(), style: tpl.style ?? {} }
})

const startingLabel = computed(() =>
  starting.value ? `Starting from “${starting.value.name}”.` : 'Starting from a blank page.',
)

const BUILDERS: Array<{ value: EditorType; title: string; icon: string; description: string }> = [
  {
    value: 'dnd',
    title: EDITOR_TYPE_LABEL.dnd,
    icon: 'layout-dashboard',
    description: 'Assemble the page from blocks — headings, images, buttons and forms. No code, and it stays responsive on its own.',
  },
  {
    value: 'wysiwyg',
    title: EDITOR_TYPE_LABEL.wysiwyg,
    icon: 'text-cursor-input',
    description: 'Edit one rich-text canvas with full HTML access. Best when you are pasting in markup you already have.',
  },
]

const builder = ref<EditorType | null>(null)

function createPage() {
  if (!builder.value) return
  const id = store.create({
    name: starting.value?.name ?? 'Untitled landing page',
    // The source collects no name or URL before the editor either — both are
    // set in the editor, which blocks publishing until the URL is valid.
    url: '',
    editorType: builder.value,
    blocks: starting.value?.blocks,
    style: starting.value?.style,
  })
  toast.success(`Landing page created in the ${EDITOR_TYPE_LABEL[builder.value]} builder — name it and set its URL before publishing.`)
  void router.push({ name: 'LandingPageEditor', params: { accountId: accountId.value, id: String(id) } })
}
</script>

<template>
  <!-- The source has three breadcrumb levels and no step indicator; step 1
       (Select template) lives on its own route. -->
  <MpWizardShell
    eyebrow="Marketing · Acquisition"
    title="Create new landing page"
    :steps="['Select template', 'Select builder']"
    :current="2"
    :max-step="2"
    :back-to="{ name: 'LandingPageTemplates', params: { accountId } }"
    :hint="builder ? undefined : 'Choose a builder to continue'"
    @select="(s: number) => s === 1 && router.push({ name: 'LandingPageTemplates', params: { accountId } })"
  >
    <MpWizardStepCard
      title="Select builder"
      :description="`${startingLabel} You can't switch builders after the page is created, so pick the one that fits how you work.`"
    >
          <MpFormField label="Builder" required>
            <v-row dense>
              <v-col v-for="option in BUILDERS" :key="option.value" cols="12" sm="6">
                <MpOptionCard
                  :selected="builder === option.value"
                  :title="option.title"
                  :description="option.description"
                  :icon="option.icon"
                  class="h-100"
                  @click="builder = option.value"
                />
              </v-col>
            </v-row>
          </MpFormField>

          <!-- A third of the pages in the list use `Drag & Drop (Legacy)`, and the
               source's picker never mentions it exists or that it is going away. -->
          <p class="text-caption text-medium-emphasis d-flex align-start ga-2 ma-0 mt-6">
            <v-icon size="16" class="flex-shrink-0" aria-hidden="true">info</v-icon>
            <span>
              Older pages in your account show <strong>{{ EDITOR_TYPE_LABEL.dnd_legacy }}</strong>. That builder is
              being retired and can't be chosen for a new page — recreate those pages in Drag &amp; Drop when you next
              edit them.
            </span>
          </p>
    </MpWizardStepCard>

    <template #footerStart>
      <v-btn
        variant="text"
        class="text-none"
        prepend-icon="arrow-left"
        :to="{ name: 'LandingPageTemplates', params: { accountId } }"
      >
        Back
      </v-btn>
    </template>
    <template #footer>
      <v-btn
        color="primary"
        variant="flat"
        class="text-none"
        append-icon="arrow-right"
        :disabled="!builder"
        @click="createPage"
      >
        Create page
      </v-btn>
    </template>
  </MpWizardShell>
</template>
