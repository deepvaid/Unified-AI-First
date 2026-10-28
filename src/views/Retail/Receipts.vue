<script setup lang="ts">
/**
 * Retail › Receipts — the receipt template gallery, on the landing-page
 * template pattern: Library | My templates, Start from scratch in the header,
 * and Customise opening the designer. Each template is assigned to POS channels; the stores
 * in a channel fill in their own tax and legal lines.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '@/stores/useRetail'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useToast } from '@/composables/useToast'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDialog from '@/components/MpDialog.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import ReceiptPaper from '@/components/retail/ReceiptPaper.vue'
import { PREVIEW_STORES, RECEIPT_LIBRARY, libraryTemplate, renderReceipt, sampleSale, type ReceiptTemplate } from './receipts/receiptModel'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()
const salesChannels = useSalesChannelsStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const posChannels = computed(() => salesChannels.offlineStoreChannels(accountId.value))
const posChannelIds = computed(() => posChannels.value.map((c) => c.id))

/* ── Tabs (kept in the URL, as the landing-page gallery does) ──── */
type Tab = 'library' | 'mine'
const tab = computed<Tab>({
  get: () => (route.query.tab === 'mine' ? 'mine' : 'library'),
  set: (v) => router.replace({ query: { ...route.query, tab: v === 'library' ? undefined : v } }),
})
const tabs = computed(() => [
  { key: 'library', label: 'Library', count: RECEIPT_LIBRARY.length },
  { key: 'mine', label: 'My templates', count: store.receiptTemplates.length },
])
const shown = computed<ReceiptTemplate[]>(() => (tab.value === 'library' ? RECEIPT_LIBRARY : store.receiptTemplates))

/* ── Cards ─────────────────────────────────────────────────────── */
// Every thumbnail prints the same sample sale at the current store, so the
// cards compare like for like and show that store's tax lines.
const sample = sampleSale()
const previewLocation = computed(() => store.receiptLocationFor(store.activeLocation.id))
const thumbnails = computed(() =>
  new Map(shown.value.map((t) => [t.id, renderReceipt(t, sample, previewLocation.value)])),
)

function usedBy(t: ReceiptTemplate) {
  return posChannels.value.filter((c) => store.templateForChannel(c.id).id === t.id)
}

function origin(t: ReceiptTemplate) {
  if (t.source === 'library') return 'Ready-made'
  const base = t.basedOn ? libraryTemplate(t.basedOn) : undefined
  return base ? `Based on ${base.name}` : 'From scratch'
}

/* ── Preview: the whole receipt, at either sample store, as a sale or a gift ── */
const previewTarget = ref<ReceiptTemplate | null>(null)
const previewOpen = computed({ get: () => !!previewTarget.value, set: (v) => { if (!v) previewTarget.value = null } })
const previewStore = ref(PREVIEW_STORES.some((s) => s.value === store.activeLocation.id) ? store.activeLocation.id : PREVIEW_STORES[0]!.value)
const previewGift = ref(false)
const previewDoc = computed(() =>
  previewTarget.value
    ? renderReceipt(previewTarget.value, sample, store.receiptLocationFor(previewStore.value), { gift: previewGift.value })
    : null,
)

function openPreview(t: ReceiptTemplate) {
  previewGift.value = false
  previewTarget.value = t
}

/** Ready-made templates are copied first; your own open as they are. */
function customise(t: ReceiptTemplate | null) {
  const target = t?.source === 'custom' ? t : store.createReceiptTemplate(t?.id ?? null)
  router.push({ name: 'RetailReceiptDesigner', params: { accountId: accountId.value, templateId: target.id } })
}

/* ── Assign ────────────────────────────────────────────────────── */
const assignTarget = ref<ReceiptTemplate | null>(null)
const assignOpen = computed({ get: () => !!assignTarget.value, set: (v) => { if (!v) assignTarget.value = null } })
const assignSelection = ref<string[]>([])

function openAssign(t: ReceiptTemplate) {
  assignTarget.value = t
  assignSelection.value = usedBy(t).map((c) => c.id)
}

function assignChange(channelId: string): string {
  const t = assignTarget.value
  if (!t) return ''
  const current = store.templateForChannel(channelId)
  const ticked = assignSelection.value.includes(channelId)
  if (ticked && current.id !== t.id) return `Now prints ${current.name} — switches to ${t.name}`
  if (!ticked && current.id === t.id) return `Goes back to Standard`
  return `Prints ${current.name}`
}

function confirmAssign() {
  const t = assignTarget.value
  if (!t) return
  store.setReceiptTemplateChannels(t.id, assignSelection.value, posChannelIds.value)
  const names = usedBy(t).map((c) => c.name)
  toast.success(names.length ? `${t.name} now prints at ${names.join(' and ')}` : `${t.name} isn't used by any POS channel`)
  assignTarget.value = null
}

/* ── Delete ────────────────────────────────────────────────────── */
const deleteTarget = ref<ReceiptTemplate | null>(null)
const deleteOpen = computed({ get: () => !!deleteTarget.value, set: (v) => { if (!v) deleteTarget.value = null } })
const deleteConsequences = computed(() => {
  const t = deleteTarget.value
  if (!t) return []
  const used = usedBy(t)
  return used.length
    ? used.map((c) => `${c.name} will print Standard instead`)
    : ['No POS channel uses it, so no receipts change']
})

function confirmDelete() {
  const t = deleteTarget.value
  if (!t) return
  store.deleteReceiptTemplate(t.id)
  toast.success(`${t.name} deleted`)
  deleteTarget.value = null
}

/* ── Delivery settings ─────────────────────────────────────────── */
const deliveryOpen = ref(false)
const settings = computed(() => store.receiptSettings)
const DELIVERY_OPTIONS = [
  { value: 'ask', title: 'Ask the shopper' },
  { value: 'print', title: 'Print' },
  { value: 'email', title: 'Email' },
  { value: 'both', title: 'Print and email' },
]
</script>

<template>
  <div class="d-flex flex-column ga-5">
    <MpPageHeader
      eyebrow="Retail · Setup"
      title="Receipts"
      subtitle="Choose what your receipts print, and which POS channels use each template."
    >
      <template #actions>
        <v-btn variant="outlined" prepend-icon="send" class="text-none" @click="deliveryOpen = true">
          Delivery settings
        </v-btn>
        <v-btn variant="flat" color="primary" prepend-icon="file-plus" class="text-none" @click="customise(null)">
          Start from scratch
        </v-btn>
      </template>
      <template #tabs>
        <MpFilterTabs v-model="tab" :tabs="tabs" aria-label="Template source" controls-id="receipt-gallery" />
      </template>
    </MpPageHeader>

    <div id="receipt-gallery">
      <MpEmptyState
        v-if="tab === 'mine' && !shown.length"
        icon="receipt-text"
        title="No templates of your own yet"
        description="Customise a ready-made template to make your own. It keeps a note of the one it started from."
        action-label="Browse the library"
        action-icon="library"
        @action="tab = 'library'"
      />

      <v-row v-else>
        <v-col v-for="t in shown" :key="t.id" cols="12" sm="6" lg="4" xl="3">
          <v-card flat border rounded="lg" class="receipt-card h-100">
            <!-- The thumbnail opens the full preview; the pill says so on touch screens too -->
            <button type="button" class="receipt-card__media" :aria-label="`Preview ${t.name}`" @click="openPreview(t)">
              <ReceiptPaper :doc="thumbnails.get(t.id)!" :scale="0.62" aria-hidden="true" />
              <span class="receipt-card__preview" aria-hidden="true">
                <v-icon size="16">eye</v-icon>
                Preview
              </span>
            </button>
            <div class="receipt-card__body">
              <div class="receipt-card__heading">
                <h2 class="receipt-card__title">{{ t.name }}</h2>
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="usedBy(t).length ? 'success' : undefined"
                  :prepend-icon="usedBy(t).length ? 'circle-check' : undefined"
                >
                  {{ usedBy(t).length ? `Used by ${usedBy(t).map((c) => c.name).join(', ')}` : 'Not assigned' }}
                </v-chip>
              </div>
              <div class="receipt-card__meta">{{ t.paper }} mm · {{ origin(t) }}</div>
              <p class="receipt-card__description">{{ t.description }}</p>
            </div>
            <div class="receipt-card__actions">
              <v-btn variant="outlined" class="text-none" :aria-label="`Customise ${t.name}`" @click="customise(t)">
                Customise
              </v-btn>
              <v-btn variant="text" class="text-none" :aria-label="`Assign ${t.name}`" @click="openAssign(t)">
                Assign
              </v-btn>
              <v-spacer />
              <v-btn
                v-if="t.source === 'custom'"
                variant="text"
                color="error"
                class="text-none"
                :aria-label="`Delete ${t.name}`"
                @click="deleteTarget = t"
              >
                Delete
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Preview -->
    <MpDialog
      v-model="previewOpen"
      size="md"
      :title="previewTarget?.name ?? ''"
      :subtitle="previewTarget ? `${previewTarget.paper} mm · ${origin(previewTarget)} · ${usedBy(previewTarget).length ? `Prints at ${usedBy(previewTarget).map((c) => c.name).join(', ')}` : 'Not assigned'}` : ''"
    >
      <div class="receipt-preview__controls">
        <MpSegmentedControl v-model="previewStore" :items="PREVIEW_STORES" size="sm" ariaLabel="Preview at store" />
        <v-switch v-model="previewGift" label="Gift receipt" />
      </div>
      <div class="receipt-preview__bed">
        <ReceiptPaper v-if="previewDoc" :doc="previewDoc" />
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="previewTarget = null">Close</v-btn>
        <v-btn variant="flat" color="primary" prepend-icon="pencil" class="text-none" @click="customise(previewTarget)">
          Customise
        </v-btn>
      </template>
    </MpDialog>

    <!-- Assign to POS channels -->
    <MpDialog
      v-model="assignOpen"
      size="sm"
      :title="`Assign ${assignTarget?.name ?? ''}`"
      subtitle="Each POS channel prints one template. Stores fill in their own tax and legal lines."
    >
      <div role="group" aria-label="POS channels">
        <v-checkbox
          v-for="c in posChannels"
          :key="c.id"
          v-model="assignSelection"
          :value="c.id"
          :label="c.name"
          :messages="assignChange(c.id)"
        />
      </div>
      <template #footer>
        <v-btn variant="text" class="text-none" @click="assignTarget = null">Cancel</v-btn>
        <v-btn variant="flat" color="primary" class="text-none" @click="confirmAssign">Save assignment</v-btn>
      </template>
    </MpDialog>

    <MpConfirmDialog
      v-model="deleteOpen"
      :title="`Delete ${deleteTarget?.name ?? ''}?`"
      message="This can't be undone."
      :consequences="deleteConsequences"
      confirm-label="Delete template"
      danger
      @confirm="confirmDelete"
    />

    <!-- Delivery: how receipts reach the shopper (what they print is the template's job) -->
    <MpFormDrawer v-model="deliveryOpen" title="Delivery settings" subtitle="How receipts reach the shopper at every POS channel." size="sm">
      <MpFormGrid>
        <v-select
          :model-value="settings.defaultDelivery"
          :items="DELIVERY_OPTIONS"
          label="Default at checkout"
          @update:model-value="(v) => store.updateReceiptSettings({ defaultDelivery: v })"
        />
        <v-text-field
          :model-value="settings.emailSubject"
          label="Email subject"
          hint="{{store}} is replaced with the selling location's name."
          persistent-hint
          @update:model-value="(v) => store.updateReceiptSettings({ emailSubject: v })"
        />
        <v-switch
          :model-value="settings.giftReceiptsEnabled"
          label="Offer gift receipts (prices hidden)"
          @update:model-value="(v) => store.updateReceiptSettings({ giftReceiptsEnabled: !!v })"
        />
      </MpFormGrid>
      <template #footer>
        <v-btn variant="flat" color="primary" class="text-none" @click="deliveryOpen = false">Done</v-btn>
      </template>
    </MpFormDrawer>
  </div>
</template>

<style scoped>
.receipt-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Fixed-height window onto the top of the receipt, so the grid scans evenly */
.receipt-card__media {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: calc(var(--mp-space-80) * 3);
  padding: var(--mp-space-20) 0 0;
  overflow: hidden;
  border: 0;
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
  font: inherit;
  cursor: zoom-in;
}

/* Inside the card's clipped corners, so the ring sits inset */
.receipt-card__media:focus-visible { outline-offset: calc(var(--mp-space-2) * -1); }

.receipt-card__media::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: var(--mp-space-40);
  background: linear-gradient(transparent, var(--surface-secondary));
}

.receipt-card__preview {
  position: absolute;
  z-index: 1;
  bottom: var(--mp-space-12);
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-6);
  padding: var(--mp-space-4) var(--mp-space-12);
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-full);
  background: var(--surface-primary);
  box-shadow: var(--mp-shadow-sm);
  color: var(--on-surface);
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  transform: translateX(-50%);
  transition: background var(--mp-motion-duration-fast), color var(--mp-motion-duration-fast);
}

.receipt-card__media:hover .receipt-card__preview,
.receipt-card__media:focus-visible .receipt-card__preview {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.receipt-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
  padding: var(--mp-component-card-padding) var(--mp-component-card-padding) 0;
}

.receipt-card__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-8);
}

.receipt-card__title {
  margin: 0;
  font-size: var(--mp-fontSize-16);
  font-weight: 600;
  color: var(--on-surface);
}

.receipt-card__meta,
.receipt-card__description {
  margin: 0;
  font-size: var(--mp-fontSize-14);
  color: var(--on-surface-muted);
}

.receipt-card__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  padding: var(--mp-component-card-padding);
}

.receipt-preview__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-16);
}

/* Paper on the same quiet bed the gallery uses */
.receipt-preview__bed {
  display: flex;
  justify-content: center;
  padding: var(--mp-space-24) var(--mp-space-16);
  border-radius: var(--mp-component-card-radius);
  background: var(--surface-secondary);
}
</style>
