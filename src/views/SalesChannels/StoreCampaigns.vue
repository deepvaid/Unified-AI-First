<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useElementSize } from '@/composables/useElementSize'
import { mp_layout_tableColumnsLg, mp_layout_tableColumnsMd } from '@/design-tokens/generated/tokens'
import { useToast } from '@/composables/useToast'
import { money } from '@/maropay/money'
import { STORE_CAMPAIGN_TAG, useCampaignsStore } from '@/stores/useCampaigns'
import { useCdpEntitiesStore } from '@/stores/useCdpEntities'
import { useCommerceStore } from '@/stores/useCommerce'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import {
  campaignStatus,
  createCampaignDraft,
  useStoreCampaignsStore,
  type StoreCampaign,
} from '@/stores/useStoreCampaigns'
import { LINK_RESOURCES } from '@/stores/useStoreNavigation'
import { offerErrors } from '@/storefront/campaigns'
import type { CampaignOffer } from '@/storefront/campaigns'
import { catalogFor, storesWithOwnCatalogue } from '@/storefront/catalog'
import { homeBlueprintOf } from '@/storefront/demoStores'
import { formatStorePrice } from '@/storefront/price'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import MpMenuItem from '@/components/MpMenuItem.vue'
import MpRowActionsMenu from '@/components/MpRowActionsMenu.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpAlert from '@/components/MpAlert.vue'

// Store editor › Campaigns: what a store runs and when. A campaign is a name and
// a date window; it may carry an offer (a message for the store's announcement bar
// and a discount code), which is what shoppers see and use while it runs. The
// rules are in src/storefront/campaigns.ts. A store with an audience of its own
// can announce a campaign by email: that opens Marketing's email wizard on a
// draft already filled in for the store's customers.

const route = useRoute()
const router = useRouter()
const toast = useToast()
const salesChannelsStore = useSalesChannelsStore()
const campaignsStore = useStoreCampaignsStore()
const commerce = useCommerceStore()
const emails = useCampaignsStore()
const cdp = useCdpEntitiesStore()

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

const storeCampaigns = computed(() => campaignsStore.campaignsForChannel(channelId.value))
const filteredCampaigns = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return storeCampaigns.value
  return storeCampaigns.value.filter((campaign) =>
    campaign.name.toLowerCase().includes(term) || (campaign.offer?.code ?? '').toLowerCase().includes(term))
})

// The store editor's content column is much narrower than the window, so the table
// chooses its columns by its own width, at the system's table stops. A column that
// is dropped folds into a cell that stays: nothing is lost.
const WIDE = parseFloat(mp_layout_tableColumnsLg)
const MEDIUM = parseFloat(mp_layout_tableColumnsMd)
const headers = [
  { title: 'Campaign', key: 'name', sortable: true, from: 0 },
  { title: 'Targets', key: 'targets', sortable: false, from: WIDE },
  { title: 'Offer', key: 'offer', sortable: false, from: 0 },
  { title: 'Status', key: 'status', sortable: false, from: 0 },
  { title: 'From', key: 'startDate', sortable: true, from: MEDIUM },
  { title: 'To', key: 'endDate', sortable: true, from: 0 },
  { title: 'Orders', key: 'orders', sortable: true, align: 'end' as const, from: 0 },
  { title: 'Email', key: 'email', sortable: false, from: MEDIUM },
  { title: 'Updated', key: 'updatedAt', sortable: true, from: WIDE },
  { title: 'Actions', key: 'actions', headerProps: { class: 'mp-th-sr' }, align: 'end' as const, sortable: false, from: 0 },
]
const tableCard = ref<HTMLElement | null>(null)
const { size: tableSize } = useElementSize(tableCard)
// Until the table has been measured, every column shows.
const visibleHeaders = computed(() => {
  const kept = headers.filter((header) => !tableSize.value.width || tableSize.value.width >= header.from)
  // Without its own "From" column, the "To" column carries both dates and is named for that.
  return kept.some((header) => header.key === 'startDate') ? kept : kept.map((header) => (header.key === 'endDate' ? { ...header, title: 'Runs' } : header))
})
const shows = (key: string): boolean => visibleHeaders.value.some((header) => header.key === key)

// A store with products of its own targets its own collections, by name; the
// others pick from the shared link catalogue, as the legacy page did.
const ownCatalogue = computed(() => storesWithOwnCatalogue(commerce.products).includes(channelId.value))
const targetOptions = computed(() => {
  if (!ownCatalogue.value) return (LINK_RESOURCES.collection ?? []).map((collection) => ({ value: collection.id, title: collection.label }))
  const names = [...new Set(catalogFor(commerce.products, channelId.value).flatMap((product) => product.collections))].sort()
  return names.map((name) => ({ value: name, title: name }))
})

function targetLabel(id: string): string {
  return LINK_RESOURCES.collection?.find((collection) => collection.id === id)?.label ?? id
}

function formatWindow(date: string, time: string): string {
  if (!date) return '—'
  const parsed = new Date(`${date}T${time || '00:00'}`)
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** What a campaign's code has brought in, the way the store writes money. */
function revenueText(campaign: StoreCampaign): string {
  const store = channel.value?.webStore
  return formatStorePrice(money(campaign.revenue ?? 0, store?.currency ?? 'USD'), store?.locale)
}

// ── Create / edit drawer (legacy uses a small modal; house style = drawer) ──
type CampaignForm = StoreCampaign & { offer: CampaignOffer }
const blankOffer = (): CampaignOffer => ({ message: '', code: '', discountPct: 10 })

const drawer = ref(false)
const form = ref<CampaignForm>({ ...createCampaignDraft(''), offer: blankOffer() })
const editing = ref(false)
const tried = ref(false)

const offerProblems = computed(() => offerErrors(form.value.offer, storeCampaigns.value.filter((campaign) => campaign.id !== form.value.id)))
const windowProblem = computed(() => {
  const { startDate, startTime, endDate, endTime } = form.value
  if (!startDate || !endDate) return null
  return `${endDate}T${endTime || '23:59'}` < `${startDate}T${startTime || '00:00'}` ? 'The campaign has to end after it starts.' : null
})
const formValid = computed(() =>
  Boolean(form.value.name.trim() && form.value.startDate && form.value.endDate)
  && !windowProblem.value && Object.keys(offerProblems.value).length === 0)

function openCreate() {
  form.value = { ...createCampaignDraft(channelId.value), offer: blankOffer() }
  editing.value = false
  tried.value = false
  drawer.value = true
}

function openEdit(campaign: StoreCampaign) {
  form.value = { ...campaign, targets: [...campaign.targets], offer: campaign.offer ? { ...campaign.offer } : blankOffer() }
  editing.value = true
  tried.value = false
  drawer.value = true
}

function saveCampaign() {
  tried.value = true
  if (!formValid.value) return
  const { offer, ...rest } = form.value
  const kept: CampaignOffer = { message: offer.message.trim(), code: offer.code.trim().toUpperCase(), discountPct: offer.discountPct }
  // A campaign with neither a message nor a code has no offer: it is a name and its dates, as before.
  const saved = campaignsStore.saveCampaign(kept.message || kept.code ? { ...rest, offer: kept } : rest)
  drawer.value = false
  const status = campaignStatus(saved)
  const where = channel.value?.name ?? 'the store'
  toast.success(status === 'Active' && saved.offer
    ? `“${saved.name}” is running on ${where} now.`
    : status === 'Scheduled'
      ? `“${saved.name}” is saved. It starts ${formatWindow(saved.startDate, saved.startTime)}.`
      : `“${saved.name}” is saved.`)
}

// ── Announce by email ────────────────────────────────────────────
// A store with an audience of its own (a demo store whose facts name one) can send
// the campaign to its customers. This writes a draft in Marketing and opens the
// email wizard on it: the merchant reviews it there and sends it. The audience,
// the email content and the time zone are the store's own, whatever theme it runs.
const storeFacts = computed(() => homeBlueprintOf(channelId.value)?.admin)
const audience = computed(() => {
  const listId = storeFacts.value?.audienceListId
  return listId === undefined ? undefined : cdp.lists.find((list) => list.id === listId)
})

function emailOf(campaign: StoreCampaign) {
  return campaign.emailCampaignId ? emails.getCampaign(campaign.emailCampaignId) : undefined
}

function emailRoute(emailCampaignId: number) {
  const email = emails.getCampaign(emailCampaignId)
  // A draft opens in the wizard; a sent one opens its report.
  return email?.status === 'Draft'
    ? { name: 'CreateEmailCampaign', params: { accountId: accountId.value }, query: { id: String(emailCampaignId) } }
    : { name: 'CampaignReport', params: { accountId: accountId.value, id: String(emailCampaignId) } }
}

function canAnnounce(campaign: StoreCampaign): boolean {
  return !!audience.value && !!campaign.offer && campaignStatus(campaign) !== 'Ended' && !emailOf(campaign)
}

function announce(campaign: StoreCampaign) {
  const list = audience.value
  const facts = storeFacts.value
  if (!list || !facts || !campaign.offer) return
  const ends = formatWindow(campaign.endDate, campaign.endTime)
  const id = emails.createCampaign({
    kind: 'email',
    name: `${campaign.name}: announcement`,
    subject: campaign.offer.message || campaign.name,
    preheader: campaign.offer.code ? `Use code ${campaign.offer.code} at checkout. Ends ${ends}.` : `Until ${ends}.`,
    tag: STORE_CAMPAIGN_TAG,
    audienceSummary: list.name,
    audienceListIds: [list.id],
    audienceSegmentIds: [],
    audienceTableIds: [],
    brand: list.brand,
    senderName: list.fromName,
    senderEmail: list.fromEmail,
    replyTo: list.replyTo,
    language: 'English (US)',
    address: list.address,
    suppressListIds: [],
    suppressJourneyIds: [],
    suppressSegmentIds: [],
    suppressSecureListIds: [],
    contentId: facts.announcementContentId ?? null,
    showPreviewLink: false,
    dynamicPreview: false,
    spamCheckResult: null,
    scheduleType: 'now',
    scheduleDate: null,
    scheduleTime: null,
    timezone: facts.timezone,
    optimizations: { sto: false, tzo: false, cto: false, preSend: false },
  })
  campaignsStore.setEmailCampaign(campaign.id, id)
  void router.push(emailRoute(id))
}

// ── Delete flow ──────────────────────────────────────────────────
const deleteDialog = ref(false)
const campaignPendingDelete = ref<StoreCampaign | null>(null)

function askDelete(campaign: StoreCampaign) {
  campaignPendingDelete.value = campaign
  deleteDialog.value = true
}

function confirmDelete() {
  const campaign = campaignPendingDelete.value
  if (campaign) {
    campaignsStore.deleteCampaign(campaign.id)
    toast.success(`“${campaign.name}” is deleted.`)
  }
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
      :subtitle="`What ${channel.name} runs and when: the message on the store, the discount code, and its dates`"
    >
      <template #actions>
        <v-btn color="primary" variant="flat" prepend-icon="plus" class="text-none" @click="openCreate">New campaign</v-btn>
      </template>
    </MpPageHeader>

    <div ref="tableCard" class="flex-grow-1 d-flex flex-column min-width-0">
    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Campaign settings"
        search-placeholder="Search campaigns…"
        :total-count="filteredCampaigns.length"
      />

      <v-data-table
        :headers="visibleHeaders"
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
            <div class="min-width-0">
              <button type="button" class="mp-link text-body-2 font-weight-medium sc-name" @click="openEdit(item)">{{ item.name }}</button>
              <div v-if="!shows('targets')" class="text-caption text-medium-emphasis">{{ item.targets.length ? item.targets.map(targetLabel).join(', ') : 'Whole store' }}</div>
              <div v-if="!shows('email') && emailOf(item)" class="text-caption text-medium-emphasis">Email: {{ emailOf(item)!.status.toLowerCase() }}</div>
            </div>
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

        <template v-slot:item.offer="{ item }">
          <div v-if="item.offer?.code" class="py-1">
            <div class="text-body-2 font-weight-medium text-no-wrap">{{ item.offer.discountPct }}% off</div>
            <div class="text-caption text-medium-emphasis text-no-wrap">Code {{ item.offer.code }}</div>
          </div>
          <span v-else-if="item.offer?.message" class="text-body-2">Message only</span>
          <span v-else class="text-body-2 text-medium-emphasis">—</span>
        </template>

        <template v-slot:item.orders="{ item }">
          <div v-if="item.orders" class="py-1">
            <div class="text-body-2 font-weight-medium">{{ item.orders.toLocaleString() }}</div>
            <div class="text-caption text-medium-emphasis text-no-wrap">{{ revenueText(item) }}</div>
          </div>
          <span v-else class="text-body-2 text-medium-emphasis">{{ item.offer?.code ? '0' : '—' }}</span>
        </template>

        <template v-slot:item.email="{ item }">
          <RouterLink v-if="emailOf(item)" :to="emailRoute(item.emailCampaignId!)" class="mp-link text-body-2 text-no-wrap">{{ emailOf(item)!.status }}</RouterLink>
          <span v-else class="text-body-2 text-medium-emphasis">Not sent</span>
        </template>

        <template v-slot:item.status="{ item }">
          <MpStatusChip :status="campaignStatus(item)" type="campaign" size="sm" />
        </template>

        <template v-slot:item.startDate="{ item }">
          <span class="text-body-2">{{ formatWindow(item.startDate, item.startTime) }}</span>
        </template>

        <template v-slot:item.endDate="{ item }">
          <span class="text-body-2">
            <template v-if="!shows('startDate')">{{ formatWindow(item.startDate, item.startTime) }} to<br></template>{{ formatWindow(item.endDate, item.endTime) }}
          </span>
        </template>

        <template v-slot:item.updatedAt="{ item }">
          <span class="text-body-2">{{ item.updatedAt }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <MpRowActionsMenu ariaLabel="Campaign actions" :itemLabel="item.name">
            <MpMenuItem title="Edit" icon="pencil" @click="openEdit(item)" />
            <MpMenuItem v-if="canAnnounce(item)" title="Announce by email" icon="mail" @click="announce(item)" />
            <MpMenuItem v-else-if="emailOf(item)" title="Open the email" icon="mail" :to="emailRoute(item.emailCampaignId!)" />
            <v-divider class="my-1" />
            <MpMenuItem title="Delete" icon="trash-2" danger @click="askDelete(item)" />
          </MpRowActionsMenu>
        </template>

        <template v-slot:no-data>
          <MpEmptyState
            icon="megaphone"
            title="No campaigns yet"
            description="A campaign puts a message on the store and gives shoppers a discount code, for the dates you choose."
            action-label="New campaign"
            action-icon="plus"
            @action="openCreate"
          />
        </template>
      </v-data-table>
    </v-card>
    </div>

    <MpConfirmDialog
      v-model="deleteDialog"
      title="Delete campaign?"
      :message="campaignPendingDelete ? `“${campaignPendingDelete.name}” will be removed. Its message leaves the store and its code stops working.` : ''"
      confirm-label="Delete campaign"
      danger
      @confirm="confirmDelete"
    />

    <MpFormDrawer v-model="drawer" :title="editing ? 'Edit campaign' : 'New campaign'" :subtitle="channel.name">
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="form.name"
          label="Campaign name *"
          placeholder="Summer sale"
          class="mp-form-grid__full"
          :error-messages="tried && !form.name.trim() ? 'Give the campaign a name.' : undefined"
        />
        <v-select
          v-model="form.targets"
          :items="targetOptions"
          label="Targets"
          hint="The collections it covers. Leave empty for the whole store."
          persistent-hint
          multiple
          chips
          closable-chips
          class="mp-form-grid__full"
        />
        <v-text-field v-model="form.startDate" label="Start date *" type="date" :error-messages="tried && !form.startDate ? 'Choose a start date.' : undefined" />
        <v-text-field v-model="form.startTime" label="Start time" type="time" />
        <v-text-field v-model="form.endDate" label="End date *" type="date" :error-messages="tried && !form.endDate ? 'Choose an end date.' : windowProblem ?? undefined" />
        <v-text-field v-model="form.endTime" label="End time" type="time" />
      </MpFormGrid>

      <MpFormSection title="Offer" description="What shoppers see and use while the campaign runs. Leave both empty for a campaign with dates only." />
      <MpFormGrid :cols="2">
        <v-text-field
          v-model="form.offer.message"
          label="Message on the store"
          placeholder="Summer sale: 20% off with code SUMMER20"
          hint="Shown in the store’s announcement bar while the campaign runs."
          persistent-hint
          class="mp-form-grid__full"
        />
        <v-text-field
          v-model="form.offer.code"
          label="Discount code"
          placeholder="SUMMER20"
          :error-messages="tried ? offerProblems.code : undefined"
        />
        <v-text-field
          v-model.number="form.offer.discountPct"
          label="Percent off"
          type="number"
          min="1"
          max="90"
          suffix="%"
          :disabled="!form.offer.code.trim()"
          :error-messages="tried ? offerProblems.discountPct : undefined"
        />
      </MpFormGrid>

      <MpAlert v-if="form.startDate && form.endDate && !windowProblem" :tone="campaignStatus(form) === 'Ended' ? 'warning' : 'info'" live="off">
        <template v-if="campaignStatus(form) === 'Active'">This campaign runs now: saving it changes the store at once.</template>
        <template v-else-if="campaignStatus(form) === 'Scheduled'">This campaign is scheduled. The store changes when it starts, on {{ formatWindow(form.startDate, form.startTime) }}.</template>
        <template v-else>These dates are in the past, so this campaign has ended and the store does not show it.</template>
      </MpAlert>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="drawer = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="text-none" prepend-icon="check" @click="saveCampaign">{{ editing ? 'Save campaign' : 'Create campaign' }}</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
/* A campaign's name opens its drawer: a button that reads as the table's link. */
.sc-name {
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
  cursor: pointer;
}
</style>
