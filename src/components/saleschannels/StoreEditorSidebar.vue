<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore, type SalesChannel } from '@/stores/useSalesChannels'
import { STORE_EDITOR_ITEMS, sectionRootForRoute, type StoreEditorItem } from './storeEditorMenu'

const props = defineProps<{
  channel: SalesChannel
}>()

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()

const accountId = computed(() => {
  const id = Array.isArray(route.params.accountId) ? route.params.accountId[0] : route.params.accountId
  return id ?? '2000290'
})

const otherWebStores = computed(() =>
  salesChannelsStore.webStoreChannels(accountId.value).filter((channel) => channel.id !== props.channel.id),
)

function isActive(item: StoreEditorItem): boolean {
  return typeof route.name === 'string' && item.match.includes(route.name)
}

function routeTo(item: StoreEditorItem) {
  return { name: item.routeName, params: { accountId: accountId.value, channelId: props.channel.id } }
}

// Switch stores but stay on the same section (editors land on their section root).
function switchStore(target: SalesChannel) {
  const sectionRoot = sectionRootForRoute(typeof route.name === 'string' ? route.name : undefined)
  router.push({ name: sectionRoot, params: { accountId: accountId.value, channelId: target.id } })
}
</script>

<template>
  <aside class="store-rail" aria-label="Store editor navigation">
    <router-link class="store-rail__exit" :to="{ name: 'SalesChannels', params: { accountId } }">
      <v-icon size="14">arrow-left</v-icon>
      All sales channels
    </router-link>

    <div class="store-rail__identity">
      <v-avatar size="34" rounded="lg" color="primary" variant="tonal">
        <v-icon size="18">globe</v-icon>
      </v-avatar>
      <div class="store-rail__identity-copy">
        <div class="store-rail__name text-truncate">{{ channel.name }}</div>
        <div class="store-rail__domain text-truncate">{{ channel.webStore?.domain || 'Web store' }}</div>
      </div>
      <v-menu v-if="otherWebStores.length > 0" location="bottom end">
        <template v-slot:activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon="chevrons-up-down" variant="text" size="x-small" aria-label="Switch store" />
        </template>
        <v-list density="compact" rounded="lg">
          <v-list-subheader>Switch store</v-list-subheader>
          <v-list-item
            v-for="store in otherWebStores"
            :key="store.id"
            :title="store.name"
            :subtitle="store.webStore?.domain"
            prepend-icon="globe"
            @click="switchStore(store)"
          />
        </v-list>
      </v-menu>
    </div>

    <nav class="store-rail__nav">
      <router-link
        v-for="item in STORE_EDITOR_ITEMS"
        :key="item.slug"
        :to="routeTo(item)"
        class="store-rail__item"
        :class="{ 'store-rail__item--active': isActive(item) }"
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <v-icon size="16" class="store-rail__item-icon">{{ item.icon }}</v-icon>
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.store-rail {
  flex-shrink: 0;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 12px;
  border-right: 1px solid var(--hairline);
  align-self: stretch;
  min-height: 0;
  background: var(--surface-1);
}

.store-rail__exit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  border-radius: 6px;
  transition: color 120ms ease, background 120ms ease;
}

.store-rail__exit:hover {
  color: var(--ink);
  background: var(--surface-2);
}

.store-rail__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 4px;
  padding: 10px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface-1);
}

.store-rail__identity-copy {
  flex: 1;
  min-width: 0;
}

.store-rail__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.store-rail__domain {
  font-size: 11.5px;
  color: var(--muted);
}

.store-rail__nav {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  padding-right: 4px;
}

.store-rail__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--ink);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}

.store-rail__item-icon {
  color: var(--muted);
  flex-shrink: 0;
  transition: color 120ms ease;
}

.store-rail__item:hover {
  background: var(--surface-2);
}

.store-rail__item:focus-visible {
  outline: 2px solid color-mix(in oklch, rgb(var(--v-theme-primary)) 42%, transparent);
  outline-offset: 2px;
}

.store-rail__item--active {
  background: var(--surface-2);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.store-rail__item--active .store-rail__item-icon {
  color: rgb(var(--v-theme-primary));
}

.store-rail__item--active::before {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: rgb(var(--v-theme-primary));
}

@media (max-width: 900px) {
  .store-rail {
    width: 100%;
    max-height: 320px;
    border-right: 0;
    border-bottom: 1px solid var(--hairline);
  }
}

@media (max-width: 640px) {
  .store-rail {
    padding: 12px;
  }
}
</style>
