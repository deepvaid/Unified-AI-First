<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  campaignStatus,
  createCampaignDraft,
  useStoreCampaignsStore,
  type StoreCampaign,
} from '@/stores/useStoreCampaigns'
import { LINK_RESOURCES } from '@/stores/useStoreNavigation'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'

const route = useRoute()
const router = useRouter()
const salesChannelsStore = useSalesChannelsStore()
const campaignsStore = useStoreCampaignsStore()

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

const filteredCampaigns = computed(() => {
  const list = campaignsStore.campaignsForChannel(channelId.value)
  const term = search.value.trim().toLowerCase()
  if (!term) return list
  return list.filter((campaign) => campaign.name.toLowerCase().includes(term))
})

const headers = [
  { title: 'Campaign', key: 'name', sortable: true },
  { title: 'Targets', key: 'targets', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'From', key: 'startDate', sortable: true },
  { title: 'To', key: 'endDate', sortable: true },
  { title: 'Updated', key: 'updatedAt', sortable: true },
  { title: '', key: 'actions', align: 'end' as const, sortable: false },
]

const targetOptions = (LINK_RESOURCES.collection ?? []).map((collection) => ({ value: collection.id, title: collection.label }))

function targetLabel(id: string): string {
  return LINK_RESOURCES.collection?.find((collection) => collection.id === id)?.label ?? id
}

function formatWindow(date: string, time: string): string {
  if (!date) return '—'
  const parsed = new Date(`${date}T${time || '00:00'}`)
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Create / edit drawer (legacy uses a small modal; house style = drawer) ──
const drawer = ref(false)
const form = ref<StoreCampaign>(createCampaignDraft(''))
const editing = ref(false)

const formValid = computed(() => Boolean(form.value.name.trim() && form.value.startDate && form.value.endDate))

function openCreate() {
  form.value = createCampaignDraft(channelId.value)
  editing.value = false
  drawer.value = true
}

function openEdit(campaign: StoreCampaign) {
  form.value = { ...campaign, targets: [...campaign.targets] }
  editing.value = true
  drawer.value = true
}

function saveCampaign() {
  if (!formValid.value) return
  campaignsStore.saveCampaign(form.value)
  drawer.value = false
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const campaignPendingDelete = ref<StoreCampaign | null>(null)

function askDelete(campaign: StoreCampaign) {
  campaignPendingDelete.value = campaign
  deleteDialog.value = true
}

function confirmDelete() {
  if (campaignPendingDelete.value) campaignsStore.deleteCampaign(campaignPendingDelete.value.id)
  campaignPendingDelete.value = null
}
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
      title="Campaigns"
      :subtitle="`Scheduled storefront campaigns for ${channel.name}`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New campaign</v-btn>
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Campaign settings"
        search-placeholder="Search campaigns…"
        :total-count="filteredCampaigns.length"
      />

      <v-data-table
        :headers="headers"
        :items="filteredCampaigns"
        item-value="id"
        hover
        density="comfortable"
        :items-per-page="15"
        fixed-header
        class="flex-grow-1"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <v-avatar size="30" rounded="lg" color="warning" variant="tonal">
              <v-icon size="16">megaphone</v-icon>
            </v-avatar>
            <a class="text-body-2 font-weight-bold text-primary cursor-pointer" @click="openEdit(item)">{{ item.name }}</a>
          </div>
        </template>

        <template v-slot:item.targets="{ item }">
          <div class="d-flex align-center gap-1 flex-wrap py-1">
            <v-chip v-for="target in item.targets" :key="target" size="x-small" variant="tonal" class="font-weight-medium">
              {{ targetLabel(target) }}
            </v-chip>
            <span v-if="item.targets.length === 0" class="text-caption text-medium-emphasis">Whole store</span>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="campaignStatus(item)" type="campaign" size="sm" />
        </template>

        <template v-slot:item.startDate="{ item }">
          <span class="text-body-2">{{ formatWindow(item.startDate, item.startTime) }}</span>
        </template>

        <template v-slot:item.endDate="{ item }">
          <span class="text-body-2">{{ formatWindow(item.endDate, item.endTime) }}</span>
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2">{{ item.updatedAt }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu :ariaLabel="`Actions for ${item.name}`">
            <v-list-item title="Edit" prepend-icon="pencil" @click="openEdit(item)" />
            <v-divider class="my-1" />
            <v-list-item title="Delete" prepend-icon="trash-2" class="text-error" @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="megaphone"
            title="No campaigns yet"
            description="Schedule storefront campaigns with a start and end window and the collections they target."
            action-label="New campaign"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete campaign?"
      :message="campaignPendingDelete ? `“${campaignPendingDelete.name}” will be removed and will stop running on your storefront.` : ''"
      confirm-label="Delete campaign"
      danger
      @confirm="confirmDelete"
    />

    <MpFormDrawer v-model="drawer" :title="editing ? 'Edit campaign' : 'New campaign'" :subtitle="channel.name">
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="form.name"
          label="Campaign name"
          placeholder="e.g. Summer sale"
          class="mp-form-grid__full"
          :rules="[(v: string) => Boolean(v?.trim()) || 'Campaign name is required']"
        />
        <v-select
          v-model="form.targets"
          :items="targetOptions"
          label="Targets"
          hint="Collections this campaign applies to — leave empty for the whole store"
          persistent-hint
          multiple
          chips
          closable-chips
          class="mp-form-grid__full"
        />
        <v-text-field v-model="form.startDate" label="Start date" type="date" />
        <v-text-field v-model="form.startTime" label="Start time" type="time" />
        <v-text-field v-model="form.endDate" label="End date" type="date" />
        <v-text-field v-model="form.endTime" label="End time" type="time" />
        <v-alert v-if="form.startDate && form.endDate" density="compact" variant="tonal" :type="campaignStatus(form) === 'Ended' ? 'warning' : 'info'" class="text-body-2 mp-form-grid__full">
          This campaign is {{ campaignStatus(form).toLowerCase() }}{{ campaignStatus(form) === 'Scheduled' ? ' — it starts ' + formatWindow(form.startDate, form.startTime) : '' }}.
        </v-alert>
      </MpFormGrid>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" :disabled="!formValid" @click="saveCampaign">{{ editing ? 'Save campaign' : 'Create campaign' }}</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
