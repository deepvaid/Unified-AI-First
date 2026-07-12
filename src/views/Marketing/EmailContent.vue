<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/useContent'
import type { ContentItem } from '@/stores/useContent'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

const route = useRoute()
const content = useContentStore()
const items = computed(() => content.items)
const accountId = computed(() => route.params.accountId as string)
// "New Content" opens the drag-&-drop editor on the blank-canvas starter template.
const blankId = computed(
  () => content.items.find(i => i.name.includes('Blank'))?.id ?? content.items[0]?.id,
)

const deleteTarget = ref<ContentItem | null>(null)
function askDelete(item: ContentItem) {
  deleteTarget.value = item
}
function confirmDelete() {
  if (deleteTarget.value) content.removeContent(deleteTarget.value.id)
  deleteTarget.value = null
}
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Email Content"
      :subtitle="`${items.length} templates`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          :to="{ name: 'EmailContentEditor', params: { accountId, id: blankId } }"
        >
          New Content
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row v-if="items.length">
      <v-col cols="12" md="4" v-for="item in items" :key="item.name">
        <v-card variant="flat" border rounded="lg" class="h-100 d-flex flex-column">
          <div class="content-thumb rounded-t-xl" :class="item.type === 'HTML Builder' ? 'content-thumb--html' : 'content-thumb--dnd'">
            <div class="doc-mock">
              <div class="doc-mock__title text-truncate">{{ item.name }}</div>
              <div class="doc-mock__line doc-mock__line--80"></div>
              <div class="doc-mock__line doc-mock__line--60"></div>
              <div class="doc-mock__cta"></div>
            </div>
          </div>
          <v-card-text class="pa-4 flex-grow-1">
            <div class="d-flex align-start justify-space-between ga-2">
              <div class="text-subtitle-1 font-weight-bold mb-1">{{ item.name }}</div>
              <MpRowActionsMenu :ariaLabel="`${item.name} actions`">
                <v-list-item
                  prepend-icon="pencil"
                  rounded="lg"
                  :to="{ name: 'EmailContentEditor', params: { accountId, id: item.id } }"
                >Edit</v-list-item>
                <v-list-item prepend-icon="copy" rounded="lg" @click="content.cloneContent(item.id)">Clone</v-list-item>
                <v-list-item prepend-icon="trash-2" rounded="lg" class="text-error mt-1" @click="askDelete(item)">Delete</v-list-item>
              </MpRowActionsMenu>
            </div>
            <div class="text-body-2 text-medium-emphasis mb-1">{{ item.type }}</div>
            <div class="text-caption text-medium-emphasis">Last updated: {{ item.lastUpdated }}</div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4 pt-0">
            <v-btn
              variant="flat"
              size="small"
              class="text-none"
              color="surface"
              :to="{ name: 'EmailContentEditor', params: { accountId, id: item.id } }"
            >
              Edit
            </v-btn>
            <v-btn variant="text" size="small" class="text-none" @click="content.cloneContent(item.id)">Clone</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-card v-else variant="flat" border rounded="lg">
      <MpEmptyState
        icon="mail"
        title="No email content yet"
        description="Create a reusable email template to use across campaigns and journeys."
        action-label="New Content"
        action-icon="plus"
      />
    </v-card>

    <MpConfirmDialog
      :model-value="!!deleteTarget"
      title="Delete this content?"
      :message="`“${deleteTarget?.name}” will be permanently deleted. This can't be undone.`"
      confirm-label="Delete"
      danger
      @update:model-value="(v) => { if (!v) deleteTarget = null }"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.content-thumb {
  height: 150px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-on-surface), 0.03);
  overflow: hidden;
}
.content-thumb--html { background: rgba(var(--v-theme-primary), 0.05); }
.content-thumb--dnd { background: rgba(var(--v-theme-secondary), 0.05); }

.doc-mock {
  width: 100%;
  max-width: 220px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.06);
}
.doc-mock__title {
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
}
.doc-mock__line {
  height: 6px;
  border-radius: 3px;
  background: rgba(var(--v-theme-on-surface), 0.10);
  margin-bottom: 6px;
}
.doc-mock__line--80 { width: 80%; }
.doc-mock__line--60 { width: 60%; }
.doc-mock__cta {
  width: 44%;
  height: 14px;
  border-radius: 4px;
  margin-top: 8px;
  background: rgba(var(--v-theme-primary), 0.35);
}
</style>
