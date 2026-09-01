<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpListRow from '@/components/MpListRow.vue'
import FooterRender from '@/components/marketing/FooterRender.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/footers/:id — the footer detail: a settings card
// (name + preference-page mappings) beside a device-framed preview, with
// desktop/mobile/full-width toggles and EXIT. The content editor the pencils
// open in production is a cross-origin builder (GAPS.md).

const route = useRoute()
const router = useRouter()
const store = useMarketingAssetsStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const footer = computed(() => store.footers.find(f => f.id === Number(route.params.id)))

const device = ref<string | null>('desktop')
const DEVICE_ITEMS = [
  { value: 'desktop', icon: 'monitor', label: 'Desktop preview' },
  { value: 'mobile', icon: 'smartphone', label: 'Mobile preview' },
  { value: 'full', icon: 'rectangle-horizontal', label: 'Full-width preview' },
]

const PAGE_ROWS = [
  { key: 'oneClickUnsub' as const, label: '1-Click Unsubscribe Page', emptyLabel: 'Default' },
  { key: 'reportSpam' as const, label: 'Report Spam Page', emptyLabel: 'Default' },
  { key: 'manageSubscription' as const, label: 'Manage Subscriptions Page', emptyLabel: 'Default' },
  { key: 'editProfile' as const, label: 'Edit Profile Page', emptyLabel: 'Not Required' },
]

function pageName(id: number | null, emptyLabel: string): string {
  if (id === null) return emptyLabel
  return store.preferencePages.find(p => p.id === id)?.name ?? emptyLabel
}

// Rename dialog (the left card's pencil)
const renameOpen = ref(false)
const renameValue = ref('')
function openRename() {
  renameValue.value = footer.value?.name ?? ''
  renameOpen.value = true
}
function confirmRename() {
  if (!footer.value || renameValue.value.trim() === '') return
  store.updateFooter(footer.value.id, { name: renameValue.value.trim() })
  toast.success('Footer renamed')
  renameOpen.value = false
}

function editContent() {
  toast.info('The footer content editor is a production builder — out of sandbox scope (see GAPS.md)')
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <template v-if="footer">
      <MpPageHeader
        :title="footer.name"
        eyebrow="Footer Management"
        :back-to="`/accounts/${accountId}/footers`"
      >
        <template #actions>
          <MpSegmentedControl v-model="device" :items="DEVICE_ITEMS" size="sm" ariaLabel="Preview device" />
          <v-btn
            icon="external-link"
            variant="text"
            aria-label="Open full preview"
            :to="{ name: 'FooterPreview', params: { accountId, id: footer.id } }"
          />
          <v-btn variant="flat" color="surface" class="text-none" :to="`/accounts/${accountId}/footers`">Exit</v-btn>
        </template>
      </MpPageHeader>

      <v-row dense>
        <v-col cols="12" md="4">
          <v-card variant="flat" border rounded="lg" class="settings-card">
            <div class="d-flex align-center justify-space-between">
              <h2 class="settings-card__name">{{ footer.name }}</h2>
              <v-btn icon="pencil" variant="text" size="small" aria-label="Rename footer" @click="openRename" />
            </div>
            <v-chip size="small" variant="outlined" class="align-self-start">{{ footer.editorType }}</v-chip>

            <div>
              <MpListRow
                v-for="row in PAGE_ROWS"
                :key="row.key"
                variant="divided"
                :eyebrow="row.label"
                :title="pageName(footer.prefPages[row.key], row.emptyLabel)"
              />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card variant="flat" border rounded="lg" class="preview-card">
            <div class="d-flex justify-end">
              <v-btn icon="pencil" variant="text" size="small" aria-label="Edit footer content" @click="editContent" />
            </div>
            <div class="preview-frame" :class="`preview-frame--${device}`">
              <FooterRender :footer="footer" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <MpDialog v-model="renameOpen" title="Rename Footer" size="sm">
        <v-text-field
          v-model="renameValue"
          label="Name *"
          :rules="[v => !!v || 'Name is required']"
          @keydown.enter="confirmRename"
        />
        <template #footer>
          <v-btn variant="text" class="text-none" @click="renameOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="text-none" :disabled="!renameValue.trim()" @click="confirmRename">Confirm</v-btn>
        </template>
      </MpDialog>
    </template>

    <MpEmptyState
      v-else
      icon="panel-bottom"
      title="Footer not found"
      description="This footer does not exist or has been deleted."
      action-label="Back to Footer Management"
      @action="router.push(`/accounts/${accountId}/footers`)"
      class="py-10"
    />
  </div>
</template>

<style scoped>
.settings-card,
.preview-card {
  padding: var(--mp-component-card-padding);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-card-gap);
  height: 100%;
}

.settings-card__name {
  font-size: var(--mp-fontSize-18);
  font-weight: 600;
}

.preview-frame {
  margin-inline: auto;
  width: 100%;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-12);
  background: rgb(var(--v-theme-surface));
  transition: max-width 0.2s ease;
}

.preview-frame--desktop {
  max-width: 640px;
}

.preview-frame--mobile {
  max-width: 375px;
}

.preview-frame--full {
  max-width: none;
}
</style>
