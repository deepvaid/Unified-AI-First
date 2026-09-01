<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketingAssetsStore } from '@/stores/useMarketingAssets'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import FooterRender from '@/components/marketing/FooterRender.vue'
import { useToast } from '@/composables/useToast'

// UAT parity: /accounts/:id/footers/:id/preview — the full-screen footer
// preview (device toggles, EDIT CONTENT, close). UAT's close lands on the
// footer detail; kept here.

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

function editContent() {
  toast.info('The footer content editor is a production builder — out of sandbox scope (see GAPS.md)')
}

function close() {
  if (footer.value) {
    router.push({ name: 'FooterDetail', params: { accountId: accountId.value, id: footer.value.id } })
  } else {
    router.push(`/accounts/${accountId.value}/footers`)
  }
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <template v-if="footer">
      <MpPageHeader :title="footer.name" eyebrow="Footer Preview">
        <template #actions>
          <v-btn variant="flat" color="surface" class="text-none" prepend-icon="pencil" @click="editContent">Edit Content</v-btn>
          <MpSegmentedControl v-model="device" :items="DEVICE_ITEMS" size="sm" ariaLabel="Preview device" />
          <v-btn icon="x" variant="text" aria-label="Close preview" @click="close" />
        </template>
      </MpPageHeader>

      <v-card variant="flat" border rounded="lg" class="preview-stage">
        <div class="preview-frame" :class="`preview-frame--${device}`">
          <FooterRender :footer="footer" />
        </div>
      </v-card>
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
.preview-stage {
  flex-grow: 1;
  padding: var(--mp-component-card-paddingSpacious);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: rgb(var(--v-theme-background));
}

.preview-frame {
  width: 100%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-radius-12);
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
