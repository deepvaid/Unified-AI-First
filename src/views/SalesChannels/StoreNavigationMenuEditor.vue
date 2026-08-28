<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  LINK_RESOURCES,
  MENU_LINK_TYPES,
  createMenuDraft,
  createMenuItem,
  itemIsComplete,
  linkTypeDef,
  moveItem,
  removeItem,
  resolveItemUrl,
  slugifyHandle,
  useStoreNavigationStore,
  type MenuStatus,
  type StoreMenu,
} from '@/stores/useStoreNavigation'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MenuPreviewCard from '@/components/saleschannels/MenuPreviewCard.vue'

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const navigationStore = useStoreNavigationStore()

const accountId = computed(() => {
  const value = route.params.accountId
  return (Array.isArray(value) ? value[0] : value) ?? '2000290'
})

const channelId = computed(() => {
  const value = route.params.channelId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const menuId = computed(() => {
  const value = route.params.menuId
  return (Array.isArray(value) ? value[0] : value) ?? ''
})

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))
const isNew = computed(() => !menuId.value)

// ── Local draft (save-on-submit, like the legacy editor) ─────────
function loadDraft(): StoreMenu | null {
  if (!menuId.value) return createMenuDraft(channelId.value)
  const existing = navigationStore.getMenu(menuId.value)
  if (!existing) return null
  return { ...existing, items: existing.items.map((item) => ({ ...item })) }
}

const draft = ref<StoreMenu | null>(loadDraft())
const savedSnapshot = ref(draft.value ? JSON.stringify(draft.value) : '')

const isDirty = computed(() => draft.value !== null && JSON.stringify(draft.value) !== savedSnapshot.value)

const handlePreview = computed(() => {
  if (!draft.value) return ''
  if (!isNew.value) return draft.value.handle
  const taken = navigationStore.menusForChannel(channelId.value).map((menu) => menu.handle)
  return slugifyHandle(draft.value.name, taken)
})

const itemsValid = computed(() => draft.value?.items.every((item) => itemIsComplete(item)) ?? false)
const canSave = computed(() => Boolean(draft.value && draft.value.name.trim() && itemsValid.value && isDirty.value))

const statusOptions: MenuStatus[] = ['Active', 'Inactive']

// ── Link target options per row ──────────────────────────────────
const linkTypeItems = MENU_LINK_TYPES.map((def) => ({ value: def.value, title: def.label, props: { prependIcon: def.icon } }))

function resourceItems(type: StoreMenu['items'][number]['linkType']) {
  return (LINK_RESOURCES[type] ?? []).map((resource) => ({ value: resource.id, title: resource.label, props: { subtitle: resource.url } }))
}

function onLinkTypeChange(item: StoreMenu['items'][number]) {
  item.target = ''
}

function addItem() {
  draft.value?.items.push(createMenuItem())
}

// ── Save / discard ───────────────────────────────────────────────
const discardDialog = ref(false)
let leaveConfirmed = false

function save() {
  if (!draft.value || !canSave.value) return
  navigationStore.saveMenu(draft.value)
  savedSnapshot.value = JSON.stringify(draft.value)
  leaveConfirmed = true
  router.push({ name: 'StoreNavigation', params: { accountId: accountId.value, channelId: channelId.value } })
}

function requestCancel() {
  if (!isDirty.value) {
    backToList()
    return
  }
  pendingTarget.value = null
  discardDialog.value = true
}

function backToList() {
  leaveConfirmed = true
  router.push({ name: 'StoreNavigation', params: { accountId: accountId.value, channelId: channelId.value } })
}

const pendingTarget = ref<string | null>(null)

onBeforeRouteLeave((to) => {
  if (!isDirty.value || leaveConfirmed) return true
  pendingTarget.value = to.fullPath
  discardDialog.value = true
  return false
})

function confirmDiscard() {
  leaveConfirmed = true
  const target = pendingTarget.value
  pendingTarget.value = null
  if (target) {
    router.push(target)
    return
  }
  backToList()
}
</script>

<template>
  <div v-if="!channel || !draft" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="list-tree"
        title="Menu not found"
        description="This menu doesn't exist or was deleted."
        action-label="Back to navigation"
        @action="backToList"
      />
    </v-card>
  </div>

  <div v-else class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      :title="draft.name.trim() || 'New menu'"
      :subtitle="`Navigation · ${channel.name}`"
      :back-to="{ name: 'StoreNavigation', params: { accountId, channelId } }"
    >
      <template #actions>
        <v-btn variant="text" class="text-none" @click="requestCancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!canSave" @click="save">
          {{ isNew ? 'Create menu' : 'Save menu' }}
        </v-btn>
      </template>
    </MpPageHeader>

    <v-row class="flex-grow-1" dense>
      <v-col cols="12" md="8">
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
          <MpFormSection title="Menu details" />
          <MpFormGrid>
            <v-text-field
              v-model="draft.name"
              label="Menu name"
              placeholder="e.g. Main menu"
              :rules="[(v: string) => Boolean(v?.trim()) || 'Menu name is required']"
            />
            <div class="text-caption text-medium-emphasis d-flex align-center gap-1">
              <v-icon size="12">code</v-icon>
              Handle: <span class="font-mono">{{ handlePreview || '—' }}</span>
              <span v-if="isNew">(generated from the name; themes reference it)</span>
            </div>
          </MpFormGrid>
        </v-card>

        <v-card variant="flat" border rounded="lg" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-2 font-weight-bold">Menu items</div>
              <div class="text-caption text-medium-emphasis">Shown in the order below · {{ draft.items.length }} item{{ draft.items.length === 1 ? '' : 's' }}</div>
            </div>
            <v-btn variant="tonal" color="primary" size="small" prepend-icon="plus" class="text-none" @click="addItem">Add item</v-btn>
          </div>

          <MpEmptyState
            v-if="draft.items.length === 0"
            icon="list-plus"
            title="No items in this menu"
            description="Add links to pages, collections, products, or any URL."
            action-label="Add item"
            action-icon="plus"
            @action="addItem"
          />

          <!-- A menu item carries three actions (reorder up, reorder down, remove), so it
               does not fit `mp-form-grid__trailing`'s single control-height track. The row
               keeps its own bordered container and grip; only the fields inside it move
               onto the form grid. -->
          <TransitionGroup v-else name="menu-row" tag="div" class="d-flex flex-column ga-3">
            <div v-for="(item, index) in draft.items" :key="item.id" class="menu-row">
              <v-icon size="16" class="menu-row__grip" aria-hidden="true">grip-vertical</v-icon>

              <MpFormGrid :cols="2" class="menu-row__fields">
                <v-text-field v-model="item.title" label="Item name" />

                <v-select
                  v-model="item.linkType"
                  :items="linkTypeItems"
                  label="Link to"
                  @update:model-value="onLinkTypeChange(item)"
                >
                  <template v-slot:selection="{ item: selection }">
                    <span class="d-flex align-center gap-1 text-body-2">
                      <v-icon size="14">{{ linkTypeDef(item.linkType).icon }}</v-icon>
                      {{ selection.title }}
                    </span>
                  </template>
                </v-select>

                <v-autocomplete
                  v-if="linkTypeDef(item.linkType).requiresResource"
                  v-model="item.target"
                  :items="resourceItems(item.linkType)"
                  :label="`Select ${linkTypeDef(item.linkType).label.toLowerCase()}`"
                  class="mp-form-grid__full"
                />
                <v-text-field
                  v-else-if="item.linkType === 'url'"
                  v-model="item.target"
                  label="URL"
                  placeholder="https://…"
                  prepend-inner-icon="link"
                  class="mp-form-grid__full"
                />
                <div v-else class="mp-form-grid__full text-caption text-medium-emphasis d-flex align-center gap-1">
                  <v-icon size="12">link</v-icon>
                  <span class="font-mono">{{ resolveItemUrl(item) }}</span>
                </div>
              </MpFormGrid>

              <div class="menu-row__actions">
                <v-btn icon="chevron-up" variant="text" size="x-small" :disabled="index === 0" :aria-label="`Move ${item.title || 'item'} up`" @click="moveItem(draft.items, item.id, -1)" />
                <v-btn icon="chevron-down" variant="text" size="x-small" :disabled="index === draft.items.length - 1" :aria-label="`Move ${item.title || 'item'} down`" @click="moveItem(draft.items, item.id, 1)" />
                <v-btn icon="trash-2" variant="text" size="x-small" color="error" :aria-label="`Remove ${item.title || 'item'}`" @click="removeItem(draft.items, item.id)" />
              </div>
            </div>
          </TransitionGroup>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <div class="editor-rail">
          <v-card variant="flat" border rounded="lg" class="pa-4 mb-4">
            <MpFormGrid>
              <v-select
                v-model="draft.status"
                label="Status"
                :items="statusOptions"
              />
              <div class="text-caption text-medium-emphasis">
                Inactive menus stay hidden from your storefront until you activate them.
              </div>
            </MpFormGrid>
          </v-card>

          <MenuPreviewCard :menu="draft" :store-name="channel.name" />
        </div>
      </v-col>
    </v-row>

    <MpConfirmDialog
      v-model="discardDialog"
      title="Discard unsaved changes?"
      :message="`Your edits to “${draft.name.trim() || 'this menu'}” haven't been saved and will be lost.`"
      confirm-label="Discard changes"
      danger
      @confirm="confirmDiscard"
    />

  </div>
</template>

<style scoped>
.menu-row {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-component-listItem-gap);
  padding: var(--mp-component-card-paddingCompact);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--mp-component-nav-itemRadius);
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s ease;
}

.menu-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

/* Grip and actions sit against the first field's box, not the row's full height. */
.menu-row__grip,
.menu-row__actions {
  flex-shrink: 0;
  block-size: var(--mp-component-control-height);
  display: flex;
  align-items: center;
}

.menu-row__grip {
  opacity: 0.35;
  cursor: default;
}

.menu-row__fields {
  flex: 1 1 auto;
  min-width: 0;
}

.menu-row__actions {
  gap: var(--mp-component-widget-actionGap);
}

.menu-row-move {
  transition: transform 0.2s ease;
}

.editor-rail {
  position: sticky;
  top: 16px;
}

@media (max-width: 960px) {
  .editor-rail {
    position: static;
  }
}
</style>
