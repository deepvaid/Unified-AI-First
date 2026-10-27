<script setup lang="ts">
/**
 * Receipt designer — the builder the Receipts gallery opens. Left: the sections on
 * the receipt (reorder, hide, remove, add). Centre: the receipt as the printer
 * prints it, for a sample sale at an AU or CA store. Right: the selected
 * section's settings, or the template's own.
 *
 * Explicit Save with a leave guard: a template can be printing at live
 * registers, so nothing changes until the merchant says so.
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetailStore } from '@/stores/useRetail'
import { useSalesChannelsStore } from '@/stores/useSalesChannels'
import { useToast } from '@/composables/useToast'
import { useDirtyLeaveGuard } from '@/composables/useDirtyLeaveGuard'
import MpBuilderShell from '@/components/MpBuilderShell.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpSegmentedControl from '@/components/MpSegmentedControl.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpDialog from '@/components/MpDialog.vue'
import ReceiptPaper from '@/components/retail/ReceiptPaper.vue'
import {
  REQUIRED_SECTIONS, SECTION_META, SECTION_ORDER, libraryTemplate, renderReceipt, sampleSale, section,
  type PaperWidth, type ReceiptTemplate, type SectionKind,
} from './receipts/receiptModel'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()
const salesChannels = useSalesChannelsStore()
const toast = useToast()

const accountId = computed(() => route.params.accountId as string)
const templateId = computed(() => route.params.templateId as string)
const backTo = computed(() => ({ name: 'RetailReceipts', params: { accountId: accountId.value }, query: { tab: 'mine' } }))
const posChannels = computed(() => salesChannels.offlineStoreChannels(accountId.value))

/* ── Working copy ──────────────────────────────────────────────── */
const draft = ref<ReceiptTemplate | null>(null)
const saved = ref('')
const isDirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== saved.value)

const clone = (t: ReceiptTemplate): ReceiptTemplate => JSON.parse(JSON.stringify(t))
const selectedId = ref<SectionKind | null>(null)

watch(templateId, (id) => {
  const t = store.receiptTemplate(id)
  // The library is never edited in place — a ready-made template opens as your copy.
  if (t?.source === 'library') {
    const copy = store.createReceiptTemplate(t.id)
    router.replace({ name: 'RetailReceiptDesigner', params: { accountId: accountId.value, templateId: copy.id } })
    return
  }
  draft.value = t ? clone(t) : null
  saved.value = draft.value ? JSON.stringify(draft.value) : ''
  selectedId.value = null
}, { immediate: true })

const { confirmLeave, allowNextLeave, discardAndLeave, leaveTitle, leaveMessage, leaveConfirmLabel } =
  useDirtyLeaveGuard(isDirty, {
    title: 'Leave the designer?',
    message: 'This template has unsaved changes. Leaving now will discard them.',
  })

/* ── Where it prints ───────────────────────────────────────────── */
const usedBy = computed(() => posChannels.value.filter((c) => store.templateForChannel(c.id).id === templateId.value))
const storesAffected = computed(() =>
  usedBy.value.reduce((n, c) => n + (c.offlineStore?.locationIds.length ?? 0), 0),
)
const basedOnName = computed(() => (draft.value?.basedOn ? libraryTemplate(draft.value.basedOn)?.name : undefined))

/* ── Preview ───────────────────────────────────────────────────── */
const SAMPLE_STORES = [
  { value: 'loc-bondi', label: 'Bondi (AU)' },
  { value: 'loc-robson', label: 'Robson (CA)' },
]
const PAPER_ITEMS = [
  { value: '80', label: '80 mm' },
  { value: '58', label: '58 mm' },
]
const sampleStore = ref('loc-bondi')
const gift = ref(false)
const sale = sampleSale()
const doc = computed(() =>
  draft.value ? renderReceipt(draft.value, sale, store.receiptLocationFor(sampleStore.value), { gift: gift.value }) : null,
)

/* ── Sections ──────────────────────────────────────────────────── */
const selected = computed(() => draft.value?.sections.find((s) => s.id === selectedId.value) ?? null)
const missingKinds = computed(() =>
  SECTION_ORDER.filter((k) => !draft.value?.sections.some((s) => s.kind === k)),
)
const isRequired = (k: SectionKind) => REQUIRED_SECTIONS.includes(k)

function move(index: number, delta: number) {
  const list = draft.value?.sections
  if (!list) return
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [s] = list.splice(index, 1)
  if (s) list.splice(target, 0, s)
}

function remove(index: number) {
  const [s] = draft.value?.sections.splice(index, 1) ?? []
  if (s && selectedId.value === s.id) selectedId.value = null
}

/** Added where it naturally sits on a receipt, then selected. */
function addSection(kind: SectionKind) {
  const list = draft.value?.sections
  if (!list) return
  const rank = SECTION_ORDER.indexOf(kind)
  const at = list.findIndex((s) => SECTION_ORDER.indexOf(s.kind) > rank)
  list.splice(at === -1 ? list.length : at, 0, section(kind))
  selectedId.value = kind
}

const ALIGN_ITEMS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Centre' },
]

/* ── Save and assign ───────────────────────────────────────────── */
const nameError = computed(() => (draft.value && !draft.value.name.trim() ? 'Give the template a name' : ''))

function save(): boolean {
  if (!draft.value) return false
  if (nameError.value) {
    toast.error(nameError.value)
    return false
  }
  draft.value.name = draft.value.name.trim()
  store.updateReceiptTemplate(draft.value.id, draft.value)
  saved.value = JSON.stringify(draft.value)
  toast.success(usedBy.value.length
    ? `Saved. Receipts at ${usedBy.value.map((c) => c.name).join(' and ')} use it from the next sale`
    : 'Template saved')
  return true
}

function saveAndClose() {
  if (!save()) return
  allowNextLeave()
  router.push(backTo.value)
}

const assignOpen = ref(false)
const assignSelection = ref<string[]>([])
function openAssign() {
  assignSelection.value = usedBy.value.map((c) => c.id)
  assignOpen.value = true
}
function confirmAssign() {
  store.setReceiptTemplateChannels(templateId.value, assignSelection.value, posChannels.value.map((c) => c.id))
  assignOpen.value = false
  toast.success(usedBy.value.length ? `Assigned to ${usedBy.value.map((c) => c.name).join(' and ')}` : 'Not assigned to any POS channel')
}
</script>

<template>
  <MpBuilderShell
    :back-to="backTo"
    back-label="Back to Receipts"
    :title="draft?.name ?? 'Receipt template'"
    :dirty="isDirty"
    persistence-mode="explicit"
    :left-width="320"
    :right-width="320"
  >
    <template #title>
      <!-- The name is an editable field, so the page heading is screen-reader only (W-18). -->
      <h1 class="d-sr-only">{{ draft?.name ?? 'Receipt template' }}</h1>
      <!-- Toolbar chrome, not a form: plain/compact/hide-details are deliberate here. -->
      <v-text-field
        v-if="draft"
        v-model="draft.name"
        variant="plain"
        density="compact"
        hide-details
        class="rd-name"
        aria-label="Template name"
        :error="!!nameError"
      />
      <span v-if="basedOnName" class="rd-lineage">Based on {{ basedOnName }}</span>
    </template>

    <template #toolbar-center>
      <template v-if="draft">
        <MpSegmentedControl
          :model-value="String(draft.paper)"
          :items="PAPER_ITEMS"
          size="sm"
          ariaLabel="Paper width"
          @update:model-value="(v) => { if (v && draft) draft.paper = Number(v) as PaperWidth }"
        />
        <MpSegmentedControl
          v-model="sampleStore"
          :items="SAMPLE_STORES"
          size="sm"
          ariaLabel="Preview at store"
        />
        <v-switch v-model="gift" label="Gift receipt" color="primary" class="rd-gift" />
      </template>
    </template>

    <template #actions>
      <span v-if="usedBy.length" class="rd-usage">
        <v-icon size="14">store</v-icon>
        Prints at {{ usedBy.map((c) => c.name).join(', ') }} · {{ storesAffected }} {{ storesAffected === 1 ? 'store' : 'stores' }}
      </span>
      <v-btn variant="text" class="text-none" :disabled="!draft" @click="openAssign">Assign</v-btn>
      <v-btn variant="outlined" class="text-none" :disabled="!draft" @click="save">Save</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!draft" @click="saveAndClose">Save &amp; close</v-btn>
    </template>

    <template #left>
      <div v-if="draft" class="rd-left">
        <p class="mp-meta-label mb-0">On the receipt</p>
        <MpListRow
          v-for="(s, i) in draft.sections"
          :key="s.id"
          variant="boxed"
          density="compact"
          clickable
          :title="SECTION_META[s.kind].label"
          :subtitle="s.visible ? undefined : 'Hidden'"
          class="rd-row"
          :class="{ 'rd-row--selected': selectedId === s.id, 'rd-row--hidden': !s.visible }"
          @click="selectedId = s.id"
        >
          <template #lead><v-icon size="16">{{ SECTION_META[s.kind].icon }}</v-icon></template>
          <template #actions>
            <v-btn icon="chevron-up" size="x-small" variant="text" :disabled="i === 0" :aria-label="`Move ${SECTION_META[s.kind].label} up`" @click.stop="move(i, -1)" />
            <v-btn icon="chevron-down" size="x-small" variant="text" :disabled="i === draft.sections.length - 1" :aria-label="`Move ${SECTION_META[s.kind].label} down`" @click.stop="move(i, 1)" />
            <v-btn
              :icon="s.visible ? 'eye' : 'eye-off'"
              size="x-small"
              variant="text"
              :disabled="isRequired(s.kind)"
              :aria-label="`${s.visible ? 'Hide' : 'Show'} ${SECTION_META[s.kind].label}`"
              @click.stop="s.visible = !s.visible"
            />
            <v-btn
              v-if="!isRequired(s.kind)"
              icon="trash-2"
              size="x-small"
              variant="text"
              :aria-label="`Remove ${SECTION_META[s.kind].label}`"
              @click.stop="remove(i)"
            />
          </template>
        </MpListRow>

        <template v-if="missingKinds.length">
          <p class="mp-meta-label mb-0 mt-3">Add a section</p>
          <MpListRow
            v-for="kind in missingKinds"
            :key="kind"
            variant="boxed"
            density="compact"
            clickable
            :title="SECTION_META[kind].label"
            :subtitle="SECTION_META[kind].hint"
            @click="addSection(kind)"
          >
            <template #lead><v-icon size="16">plus</v-icon></template>
          </MpListRow>
        </template>
      </div>
    </template>

    <!-- Canvas: the receipt as printed -->
    <div class="rd-canvas">
      <ReceiptPaper
        v-if="doc"
        :doc="doc"
        :scale="1.3"
        selectable
        :selected-section-id="selectedId"
        @select="selectedId = $event"
      />
      <MpEmptyState
        v-else
        icon="receipt-text"
        title="This template doesn't exist any more"
        description="It may have been deleted. Go back to Receipts to pick another."
        action-label="Back to Receipts"
        @action="router.push(backTo)"
      />
    </div>

    <template #right>
      <div v-if="draft" class="rd-right">
        <template v-if="selected">
          <MpFormSection :title="SECTION_META[selected.kind].label" :description="SECTION_META[selected.kind].hint" />
          <MpFormGrid>
            <template v-if="selected.kind === 'header' || selected.kind === 'returns' || selected.kind === 'footer'">
              <v-textarea
                v-model="selected.settings.text"
                label="Text"
                rows="3"
                :counter="selected.kind === 'returns' ? 160 : 80"
                :rules="[(v: string) => (v ?? '').length <= (selected?.kind === 'returns' ? 160 : 80) || 'Keep it short — receipts are narrow']"
                :placeholder="selected.kind === 'footer' ? 'Thanks for shopping with us!' : selected.kind === 'header' ? 'Spring sale on now' : 'Returns within 30 days with this receipt.'"
              />
              <MpFormField label="Alignment">
                <MpSegmentedControl
                  :model-value="selected.settings.align ?? 'center'"
                  :items="ALIGN_ITEMS"
                  size="sm"
                  ariaLabel="Text alignment"
                  @update:model-value="(v) => { if (v && selected) selected.settings.align = v as 'left' | 'center' }"
                />
              </MpFormField>
            </template>

            <MpFormField v-else-if="selected.kind === 'logo'" label="Logo size">
              <MpSegmentedControl
                :model-value="selected.settings.logoSize ?? 'sm'"
                :items="[{ value: 'sm', label: 'Small' }, { value: 'lg', label: 'Large' }]"
                size="sm"
                ariaLabel="Logo size"
                @update:model-value="(v) => { if (v && selected) selected.settings.logoSize = v as 'sm' | 'lg' }"
              />
            </MpFormField>

            <template v-else-if="selected.kind === 'store'">
              <v-switch v-model="selected.settings.showAddress" label="Store address" />
              <v-switch v-model="selected.settings.showPhone" label="Store phone" />
              <p class="rd-note">The tax number always prints: ABN in Australia, GST/HST number in Canada. Australian receipts also print "Tax invoice".</p>
            </template>

            <template v-else-if="selected.kind === 'details'">
              <v-switch v-model="selected.settings.showRegister" label="Register" />
              <v-switch v-model="selected.settings.showStaff" label="Staff member" />
              <p class="rd-note">Receipt number and date always print.</p>
            </template>

            <template v-else-if="selected.kind === 'items'">
              <v-switch v-model="selected.settings.showVariant" label="Variant (colour, size)" />
              <v-switch v-model="selected.settings.showSku" label="SKU" />
              <v-switch v-model="selected.settings.showNotes" label="Discount notes under each item" />
            </template>

            <MpFormField v-else-if="selected.kind === 'barcode'" label="Code type" hint="Encodes the receipt number, for returns and lookups.">
              <MpSegmentedControl
                :model-value="selected.settings.format ?? 'code128'"
                :items="[{ value: 'code128', label: 'Barcode' }, { value: 'qr', label: 'QR code' }]"
                size="sm"
                ariaLabel="Code type"
                @update:model-value="(v) => { if (v && selected) selected.settings.format = v as 'code128' | 'qr' }"
              />
            </MpFormField>

            <p v-else class="rd-note">
              {{ selected.kind === 'totals'
                ? 'Subtotal, discounts and the total. Tax follows the store: included GST in Australia, GST and PST added in British Columbia.'
                : selected.kind === 'payment'
                  ? 'How the sale was paid. Cash shows rounding to 5c and the change given.'
                  : 'Name and points balance, when a customer is on the sale.' }}
            </p>
          </MpFormGrid>
          <v-btn variant="text" class="text-none mt-2" prepend-icon="arrow-left" @click="selectedId = null">Template settings</v-btn>
        </template>

        <template v-else>
          <MpFormSection title="Template" description="Select a section on the receipt to change it." />
          <MpFormGrid>
            <v-textarea v-model="draft.description" label="Description" rows="3" placeholder="What this receipt is for" />
            <MpFormField label="Spacing" hint="Compact removes the gaps between sections to save paper.">
              <MpSegmentedControl
                :model-value="draft.density"
                :items="[{ value: 'standard', label: 'Standard' }, { value: 'compact', label: 'Compact' }]"
                size="sm"
                ariaLabel="Spacing"
                @update:model-value="(v) => { if (v && draft) draft.density = v as 'standard' | 'compact' }"
              />
            </MpFormField>
            <p class="rd-note">80 mm paper prints 48 characters a line, 58 mm prints 32. Long names wrap.</p>
          </MpFormGrid>
        </template>
      </div>
    </template>
  </MpBuilderShell>

  <MpDialog
    v-model="assignOpen"
    size="sm"
    :title="`Assign ${draft?.name ?? ''}`"
    subtitle="Each POS channel prints one template. Stores fill in their own tax and legal lines."
  >
    <div role="group" aria-label="POS channels">
      <v-checkbox
        v-for="c in posChannels"
        :key="c.id"
        v-model="assignSelection"
        :value="c.id"
        :label="c.name"
        :messages="`Prints ${store.templateForChannel(c.id).name} now`"
      />
    </div>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="assignOpen = false">Cancel</v-btn>
      <v-btn variant="flat" color="primary" class="text-none" @click="confirmAssign">Save assignment</v-btn>
    </template>
  </MpDialog>

  <MpConfirmDialog
    v-model="confirmLeave"
    :title="leaveTitle"
    :message="leaveMessage"
    :confirm-label="leaveConfirmLabel"
    danger
    @confirm="discardAndLeave"
  />
</template>

<style scoped>
.rd-name {
  min-width: calc(var(--mp-space-80) * 2.5);
  font-weight: 600;
}

.rd-lineage,
.rd-usage {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-space-4);
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
  white-space: nowrap;
}

.rd-gift { flex: 0 0 auto; }

.rd-left,
.rd-right {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  padding: var(--mp-space-16);
}

.rd-row--selected {
  border-color: var(--accent-default);
  box-shadow: inset 0 0 0 1px var(--accent-default);
}

.rd-row--hidden :deep(.mp-list-row__title) { color: var(--on-surface-muted); }

.rd-canvas {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100%;
  padding: var(--mp-space-40) var(--mp-space-24);
  background: var(--surface-secondary);
}

.rd-note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}
</style>
