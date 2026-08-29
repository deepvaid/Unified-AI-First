<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/useContent'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'

/**
 * Content preview. Rebuilt from UAT `/contents/:id/preview`;
 * see docs/rebuild/email-content/.
 *
 * A read-only look at an email body before using it. The desktop / mobile toggle
 * is the same one the editor offers, so a preview and an editor agree.
 */
const store = useContentStore()
const route = useRoute()
const router = useRouter()

const accountId = computed(() => String(route.params.accountId))
const listPath = computed(() => `/accounts/${accountId.value}/contents`)
const item = computed(() => store.getItem(Number(route.params.id)))

const device = ref<'desktop' | 'mobile'>('desktop')

/** A merge tag, shown unresolved as it would appear before a send. Held here
 *  rather than inline because Vue's template parser reads `{{` as interpolation. */
const MERGE_TAG = '{{ first_name }}'

function formatDate(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function edit() {
  if (!item.value) return
  router.push({ name: 'EmailContentEditor', params: { accountId: accountId.value, id: String(item.value.id) } })
}

function createCampaign() {
  if (!item.value) return
  router.push({
    name: 'CreateEmailCampaign',
    params: { accountId: accountId.value },
    query: { contentId: String(item.value.id) },
  })
}
</script>

<template>
  <div class="h-100 d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Email Content"
      :title="item?.name ?? 'Content preview'"
      :subtitle="item ? `Last updated ${formatDate(item.updatedAt)}` : undefined"
      :back-to="listPath"
      back-label="Back to Email Content"
    >
      <template v-if="item" #actions>
        <v-btn-toggle v-model="device" mandatory density="compact" variant="outlined" divided>
          <v-btn value="desktop" class="text-none" aria-label="Preview at desktop width">
            <v-icon size="18">monitor</v-icon>
          </v-btn>
          <v-btn value="mobile" class="text-none" aria-label="Preview at mobile width">
            <v-icon size="18">smartphone</v-icon>
          </v-btn>
        </v-btn-toggle>
        <v-btn variant="outlined" class="text-none" prepend-icon="send" @click="createCampaign">
          Create a campaign
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="pencil" @click="edit">
          Edit content
        </v-btn>
      </template>
    </MpPageHeader>

    <MpEmptyState
      v-if="!item"
      icon="file-question"
      variant="launcher"
      title="That content no longer exists"
      description="It may have been deleted since this link was created."
      action-label="Back to Email Content"
      @action="router.push(listPath)"
    />

    <v-card v-else variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <div class="ecp-meta">
        <MpStatusChip :status="item.editorType" type="general" size="sm" variant="tonal" />
        <span class="text-body-2 text-medium-emphasis">Created {{ formatDate(item.createdAt) }}</span>
        <span v-if="item.usedByCampaigns" class="text-body-2 text-medium-emphasis">
          Used by {{ item.usedByCampaigns }} campaign{{ item.usedByCampaigns === 1 ? '' : 's' }}
        </span>
      </div>

      <div class="ecp-stage flex-grow-1">
        <article class="ecp-email" :class="`ecp-email--${device}`" :aria-label="`${item.name} preview`">
          <header class="ecp-email__band" />
          <h2 class="ecp-email__headline">{{ item.name }}</h2>
          <p class="ecp-email__body">
            This is a read-only preview of the email body. Open the editor to change its content,
            layout or styling.
          </p>
          <p class="ecp-email__body">
            Hi {{ MERGE_TAG }}, here is what is new this month — hand-picked for you, with
            free delivery on everything until the end of the week.
          </p>
          <span class="ecp-email__cta">Shop the collection</span>
          <footer class="ecp-email__footer">
            You are receiving this because you subscribed. Unsubscribe at any time.
          </footer>
        </article>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.ecp-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-12);
  padding: var(--mp-component-card-padding);
  border-bottom: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
}

.ecp-stage {
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: var(--mp-component-card-paddingSpacious);
  background: rgb(var(--v-theme-surface-variant));
}

.ecp-email {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-16);
  align-self: flex-start;
  width: 100%;
  max-width: 640px;
  padding: var(--mp-component-card-paddingSpacious);
  border-radius: var(--mp-component-card-radius);
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--mp-shadow-md);
}

.ecp-email--mobile {
  max-width: 375px;
}

.ecp-email__band {
  height: var(--mp-space-48);
  border-radius: var(--mp-radius-8);
  background: rgb(var(--v-theme-primary));
}

.ecp-email__headline {
  margin: 0;
  font-size: var(--mp-fontSize-24);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-snug);
  color: rgb(var(--v-theme-on-surface));
}

.ecp-email__body {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  line-height: var(--mp-lineHeight-normal);
  color: rgb(var(--v-theme-on-surface-variant));
}

.ecp-email__cta {
  align-self: flex-start;
  padding: var(--mp-space-10) var(--mp-space-20);
  border-radius: var(--mp-component-button-radius);
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-medium);
}

.ecp-email__footer {
  padding-top: var(--mp-space-16);
  border-top: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
