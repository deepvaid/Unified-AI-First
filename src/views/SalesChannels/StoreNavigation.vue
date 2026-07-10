<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useStoreNavigationStore, type StoreMenu } from '@/stores/useStoreNavigation'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'

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

const channel = computed(() => salesChannelsStore.getChannel(accountId.value, channelId.value))

const search = ref('')

const menus = computed(() => navigationStore.menusForChannel(channelId.value))

const filteredMenus = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return menus.value
  return menus.value.filter(
    (menu) =>
      menu.name.toLowerCase().includes(term) ||
      menu.items.some((item) => item.title.toLowerCase().includes(term)),
  )
})

const headers = [
  { title: 'Menu', key: 'name', sortable: true },
  { title: 'Menu items', key: 'items', sortable: false },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]

function openEditor(menu: StoreMenu) {
  router.push({ name: 'StoreNavigationMenuEdit', params: { accountId: accountId.value, channelId: channelId.value, menuId: menu.id } })
}

function toggleStatus(menu: StoreMenu) {
  navigationStore.setMenuStatus(menu.id, menu.status === 'Active' ? 'Inactive' : 'Active')
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const menuPendingDelete = ref<StoreMenu | null>(null)

function askDelete(menu: StoreMenu) {
  menuPendingDelete.value = menu
  deleteDialog.value = true
}

function confirmDelete() {
  if (menuPendingDelete.value) navigationStore.deleteMenu(menuPendingDelete.value.id)
  menuPendingDelete.value = null
}

const deleteMessage = computed(() => {
  const menu = menuPendingDelete.value
  if (!menu) return ''
  return `"${menu.name}" and its ${menu.items.length} menu item${menu.items.length === 1 ? '' : 's'} will be removed. Theme sections referencing the "${menu.handle}" handle will stop showing this menu.`
})
</script>

<template>
  <div v-if="!channel" class="h-100 d-flex align-center justify-center">
    <v-card variant="flat" border rounded="lg" class="pa-6" max-width="420">
      <MpEmptyState
        icon="store"
        title="Sales channel not found"
        description="The store you're trying to manage doesn't exist or was removed."
        action-label="Back to sales channels"
        @action="router.push({ name: 'SalesChannels', params: { accountId } })"
      />
    </v-card>
  </div>

  <div v-else class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Navigation"
      :subtitle="`Storefront menus for ${channel.name}`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="plus"
          class="text-none"
          :to="{ name: 'StoreNavigationMenuCreate', params: { accountId, channelId } }"
        >
          Add menu
        </v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Menus"
        search-placeholder="Search menus or items…"
        :total-count="filteredMenus.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredMenus"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <v-avatar size="30" rounded="lg" color="primary" variant="tonal">
              <v-icon size="16">list-tree</v-icon>
            </v-avatar>
            <div class="min-width-0">
              <a class="text-body-2 font-weight-bold text-primary cursor-pointer" @click="openEditor(item)">{{ item.name }}</a>
              <div class="text-caption text-medium-emphasis font-mono">{{ item.handle }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.items="{ item }">
          <div class="d-flex align-center gap-1 flex-wrap py-1">
            <v-chip
              v-for="menuItem in item.items.slice(0, 4)"
              :key="menuItem.id"
              size="x-small"
              variant="tonal"
              class="font-weight-medium"
            >
              {{ menuItem.title }}
            </v-chip>
            <v-tooltip v-if="item.items.length > 4" location="top" :text="item.items.slice(4).map(itemRow => itemRow.title).join(', ')">
              <template v-slot:activator="{ props }">
                <span v-bind="props" class="text-caption text-medium-emphasis">+{{ item.items.length - 4 }} more</span>
              </template>
            </v-tooltip>
            <span v-if="item.items.length === 0" class="text-caption text-medium-emphasis">No items yet</span>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="item.status" type="general" size="x-small" />
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2">{{ item.updatedAt }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
            <v-list-item :title="item.status === 'Active' ? 'Set inactive' : 'Set active'" :prepend-icon="item.status === 'Active' ? 'eye-off' : 'eye'" @click="toggleStatus(item)" />
            <v-list-item title="Edit" prepend-icon="pencil" @click="openEditor(item)" />
            <v-divider class="my-1" />
            <v-list-item title="Delete" prepend-icon="trash-2" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="list-tree"
            title="No menus yet"
            description="Create a menu to control the links shoppers see in your storefront header and footer."
            action-label="Add menu"
            action-icon="plus"
            @action="router.push({ name: 'StoreNavigationMenuCreate', params: { accountId, channelId } })"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete menu?"
      :message="deleteMessage"
      confirm-label="Delete menu"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.min-width-0 {
  min-width: 0;
}
</style>
