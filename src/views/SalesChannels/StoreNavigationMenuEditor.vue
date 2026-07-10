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
          <div class="text-subtitle-2 font-weight-bold mb-3">Menu details</div>
          <v-text-field
            v-model="draft.name"
            label="Menu name"
            placeholder="e.g. Main menu"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :rules="[(v: string) => Boolean(v?.trim()) || 'Menu name is required']"
          />
          <div class="text-caption text-medium-emphasis mt-2 d-flex align-center gap-1">
            <v-icon size="12">code</v-icon>
            Handle: <span class="font-mono">{{ handlePreview || '—' }}</span>
            <span v-if="isNew">(generated from the name; themes reference it)</span>
          </div>
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

          <TransitionGroup v-else name="menu-row" tag="div" class="d-flex flex-column gap-2">
            <div v-for="(item, index) in draft.items" :key="item.id" class="menu-row">
              <v-icon size="16" class="menu-row__grip" aria-hidden="true">grip-vertical</v-icon>

              <v-text-field
                v-model="item.title"
                label="Item name"
                variant="outlined"
                density="compact"
                hide-details
                class="menu-row__name"
              />

              <v-select
                v-model="item.linkType"
                :items="linkTypeItems"
                label="Link to"
                variant="outlined"
                density="compact"
                hide-details
                class="menu-row__type"
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
                variant="outlined"
                density="compact"
                hide-details
                class="menu-row__target"
              />
              <v-text-field
                v-else-if="item.linkType === 'url'"
                v-model="item.target"
                label="https://…"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="link"
                class="menu-row__target"
              />
              <div v-else class="menu-row__target menu-row__fixed text-caption text-medium-emphasis d-flex align-center gap-1">
                <v-icon size="12">link</v-icon>
                <span class="font-mono">{{ resolveItemUrl(item) }}</span>
              </div>

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
            <div class="text-subtitle-2 font-weight-bold mb-3">Status</div>
            <v-select
              v-model="draft.status"
              :items="statusOptions"
              variant="outlined"
              density="comfortable"
              hide-details
            />
            <div class="text-caption text-medium-emphasis mt-2">
              Inactive menus stay hidden from your storefront until you activate them.
            </div>
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
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s ease;
}

.menu-row:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.menu-row__grip {
  opacity: 0.35;
  flex-shrink: 0;
  cursor: default;
}

.menu-row__name {
  flex: 1 1 30%;
  min-width: 140px;
}

.menu-row__type {
  flex: 0 0 190px;
}

.menu-row__target {
  flex: 1 1 34%;
  min-width: 160px;
}

.menu-row__fixed {
  align-self: center;
}

.menu-row__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.editor-rail {
  position: sticky;
  top: 16px;
}

.menu-row-move {
  transition: transform 0.2s ease;
}

@media (max-width: 960px) {
  .menu-row {
    flex-wrap: wrap;
  }

  .menu-row__type,
  .menu-row__target {
    flex: 1 1 45%;
  }

  .editor-rail {
    position: static;
  }
}
</style>
