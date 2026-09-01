<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore, type FooterEditorType, type PreferencePageType } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormField from '@/components/MpFormField.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/footers/new — "Fill out Details", step 1 of the
// footer wizard: name, the four preference-page selects (each with a preview
// eye), and the editor-type choice. NEXT opens the chosen editor in
// production — a cross-origin builder (GAPS.md) — so here it creates the
// footer and lands on its detail page.

const route = useRoute()
const router = useRouter()
const store = useMarketingAssetsStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)

const name = ref('')
const editorType = ref<FooterEditorType>('Drag & Drop')
const pages = ref<{ oneClickUnsub: number | null; reportSpam: number | null; manageSubscription: number | null; editProfile: number | null }>({
  oneClickUnsub: null,
  reportSpam: null,
  manageSubscription: null,
  editProfile: null,
})

const PAGE_SELECTS: Array<{ key: keyof typeof pages.value; label: string; pageType: PreferencePageType }> = [
  { key: 'oneClickUnsub', label: 'Select 1-Click Unsubscribe Page', pageType: 'One Click Unsubscribe' },
  { key: 'reportSpam', label: 'Select Report Spam Page', pageType: 'Report Spam' },
  { key: 'manageSubscription', label: 'Select Manage Subscription Page', pageType: 'Manage Subscriptions' },
  { key: 'editProfile', label: 'Select Edit Profile Page', pageType: 'Edit Profile' },
]

function optionsFor(pageType: PreferencePageType) {
  return [
    { title: 'Default', value: null as number | null },
    ...store.preferencePages.filter(p => p.pageType === pageType).map(p => ({ title: p.name, value: p.id as number | null })),
  ]
}

function previewPage(key: keyof typeof pages.value) {
  const id = pages.value[key]
  const page = store.preferencePages.find(p => p.id === id)
  toast.info(page ? `Production previews “${page.name}” here` : 'Production previews the default page here')
}

const canContinue = computed(() => name.value.trim() !== '')

function cancel() {
  router.push(`/accounts/${accountId.value}/footers`)
}

function next() {
  if (!canContinue.value) return
  const footer = store.addFooter({
    name: name.value.trim(),
    editorType: editorType.value,
    prefPages: { ...pages.value },
    body: '',
  })
  toast.success(`Footer created — the ${editorType.value} editor opens here in production`)
  router.push({ name: 'FooterDetail', params: { accountId: accountId.value, id: footer.id } })
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Fill out Details"
      eyebrow="Footer Management · New Footer"
      :back-to="`/accounts/${accountId}/footers`"
    />

    <v-card variant="flat" border rounded="lg" class="create-card">
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="name"
          class="mp-form-grid__full"
          label="Name *"
          placeholder="e.g. Standard Compliance (CAN-SPAM)"
          :rules="[v => !!v || 'Name is required']"
        />

        <MpFormSection
          title="Preference Page Type"
          description="The hosted pages this footer's compliance links point at."
        />
        <div v-for="sel in PAGE_SELECTS" :key="sel.key" class="mp-form-grid__trailing">
          <v-select
            :model-value="pages[sel.key]"
            :items="optionsFor(sel.pageType)"
            :label="sel.label"
            @update:model-value="(v: number | null) => (pages[sel.key] = v)"
          />
          <v-btn icon="eye" variant="text" :aria-label="`Preview ${sel.label.replace('Select ', '')}`" @click="previewPage(sel.key)" />
        </div>

        <MpFormSection title="Select Editor Type" />
        <MpFormField label="Editor" class="mp-form-grid__full">
          <template #default="{ labelId }">
            <v-radio-group v-model="editorType" inline :aria-labelledby="labelId" hide-details>
              <v-radio label="Drag & Drop" value="Drag & Drop" />
              <v-radio label="WYSIWYG" value="WYSIWYG" />
            </v-radio-group>
          </template>
        </MpFormField>
      </MpFormGrid>

      <div class="d-flex ga-3 mt-6">
        <v-btn variant="flat" color="surface" class="text-none" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canContinue" @click="next">Next</v-btn>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.create-card {
  padding: var(--mp-component-card-padding);
  max-width: 880px;
}
</style>
