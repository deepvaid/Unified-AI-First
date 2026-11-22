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
import { useCommerceStore } from '@/stores/useCommerce'
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
import MpMenuItem from '@/components/MpMenuItem.vue'
import ReceiptPaper from '@/components/retail/ReceiptPaper.vue'
import {
  PREVIEW_STORES, REQUIRED_SECTIONS, SECTION_META, SECTION_ORDER, libraryTemplate, renderReceipt, sampleSale, section,
  type PaperWidth, type ReceiptTemplate, type SectionKind,
} from './receipts/receiptModel'
import { prepareLogo } from './receipts/logoImage'
import { isEmail } from './pos/saleModel'

const route = useRoute()
const router = useRouter()
const store = useRetailStore()
const salesChannels = useSalesChannelsStore()
const commerce = useCommerceStore()
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

/** Merchant text can say who and where; unknown names drop out when printed. */
const PLACEHOLDERS = ['{{first_name}}', '{{store}}']
function insertPlaceholder(field: 'text' | 'headline' | 'label', token: string) {
  const s = selected.value
  if (s) s.settings[field] = `${(s.settings[field] ?? '').trimEnd()} ${token}`.trim()
}

/* ── Promotion: POS coupons, so what prints can be redeemed at the register ── */
const today = new Date().toISOString().slice(0, 10)
const CUSTOM_CODE = '__custom'
const posCoupons = computed(() =>
  commerce.promotions.filter((p) =>
    p.mechanism === 'Code' && p.code && p.status === 'Active'
    && p.salesChannels.includes('POS') && (!p.endDate || p.endDate >= today)),
)
const couponItems = computed(() => [
  ...posCoupons.value.map((c) => ({ title: `${c.code} · ${c.title}`, value: c.code! })),
  { title: 'Custom code', value: CUSTOM_CODE },
])
const couponChoice = computed(() => {
  const code = selected.value?.settings.code?.trim().toUpperCase()
  return posCoupons.value.find((c) => c.code === code)?.code ?? CUSTOM_CODE
})
const promoNotRedeemable = computed(() =>
  selected.value?.kind === 'promo' && !!selected.value.settings.code?.trim() && couponChoice.value === CUSTOM_CODE,
)

function chooseCoupon(code: string) {
  const s = selected.value
  if (!s) return
  if (code === CUSTOM_CODE) {
    s.settings.code = ''
    s.settings.validUntil = undefined
    return
  }
  const c = posCoupons.value.find((p) => p.code === code)
  if (!c) return
  s.settings.code = c.code
  s.settings.headline = c.discountType === 'Percentage' ? `${c.value}% off your next visit` : `$${c.value} off your next visit`
  s.settings.validUntil = c.endDate
}

/* ── Logo upload: prepared as the printer prints it ───────────── */
const logoInput = ref<HTMLInputElement | null>(null)
const logoError = ref('')
async function onLogoFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  const s = selected.value
  if (!file || !draft.value || !s) return
  const result = await prepareLogo(file, draft.value.paper)
  if (!result.ok) {
    logoError.value = result.reason
    return
  }
  logoError.value = ''
  s.settings.image = result.dataUrl
  toast.success(`Logo ready: ${result.width} × ${result.height} dots, black and white`)
}

const httpsRule = (v: string) => !v || /^https:\/\/\S+\.\S+/.test(v.trim()) || 'Use a full link starting with https://'

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

/* ── Test print, test email ────────────────────────────────────── */
// Tests send what's on screen, saved or not, so a change can be checked before it goes live.
const printerRegisters = computed(() =>
  store.registerList
    .filter((r) => r.pairedPrinter)
    .map((r) => ({ id: r.id, name: r.name, printer: r.pairedPrinter!, location: store.locationName(r.locationId) })),
)
const testPrintOpen = ref(false)
const testRegisterId = ref<string | null>(null)
function openTestPrint() {
  testRegisterId.value = printerRegisters.value[0]?.id ?? null
  testPrintOpen.value = true
}
function sendTestPrint() {
  const r = printerRegisters.value.find((x) => x.id === testRegisterId.value)
  if (!r) return
  testPrintOpen.value = false
  toast.success(`Test receipt sent to ${r.printer} · ${r.location}, ${r.name}`)
}

const testEmailOpen = ref(false)
const testEmail = ref('')
const testEmailTouched = ref(false)
const testEmailError = computed(() =>
  testEmailTouched.value && !isEmail(testEmail.value) ? 'Enter an email like name@example.com' : '',
)
function openTestEmail() {
  testEmailTouched.value = false
  testEmailOpen.value = true
}
function sendTestEmail() {
  testEmailTouched.value = true
  if (!isEmail(testEmail.value)) return
  testEmailOpen.value = false
  toast.success(`Test receipt emailed to ${testEmail.value.trim()}`)
}

/* ── Reset to the ready-made template it started from ─────────── */
const baseTemplate = computed(() => (draft.value?.basedOn ? libraryTemplate(draft.value.basedOn) : undefined))
const resetOpen = ref(false)
function resetToBase() {
  const base = baseTemplate.value
  if (!draft.value || !base) return
  const fresh = clone(base)
  draft.value.sections = fresh.sections
  draft.value.paper = fresh.paper
  draft.value.density = fresh.density
  selectedId.value = null
  resetOpen.value = false
  toast.info(`Reset to ${base.name}. Save to keep it.`)
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
          :items="PREVIEW_STORES"
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
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" variant="text" class="text-none" prepend-icon="flask-conical" :disabled="!draft">Test</v-btn>
        </template>
        <v-list role="menu" aria-label="Test this template" density="compact">
          <MpMenuItem icon="printer" title="Print test receipt…" @click="openTestPrint" />
          <MpMenuItem icon="mail" title="Send test email…" @click="openTestEmail" />
        </v-list>
      </v-menu>
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
                :placeholder="selected.kind === 'footer' ? 'Thanks {{first_name}}, see you soon!' : selected.kind === 'header' ? 'Spring sale on now' : 'Returns within 30 days with this receipt.'"
              />
              <MpFormField label="Insert" hint="{{first_name}} is left out when no customer is on the sale.">
                <div class="rd-chips">
                  <v-chip v-for="t in PLACEHOLDERS" :key="t" size="small" variant="outlined" @click="insertPlaceholder('text', t)">{{ t }}</v-chip>
                </div>
              </MpFormField>
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

            <template v-else-if="selected.kind === 'logo'">
              <MpFormField label="Logo image" :error="logoError || undefined" hint="PNG or JPG, under 1 MB. Wide logos around 400 × 200 px print best.">
                <div class="rd-logo">
                  <div class="rd-logo__preview" aria-hidden="true">
                    <img v-if="selected.settings.image" :src="selected.settings.image" alt="">
                    <v-icon v-else size="24">image</v-icon>
                  </div>
                  <div class="d-flex flex-column ga-1">
                    <v-btn variant="outlined" size="small" class="text-none" prepend-icon="image-up" @click="logoInput?.click()">
                      {{ selected.settings.image ? 'Replace logo' : 'Upload logo' }}
                    </v-btn>
                    <v-btn v-if="selected.settings.image" variant="text" size="small" color="error" class="text-none" @click="selected.settings.image = undefined">Remove</v-btn>
                  </div>
                </div>
              </MpFormField>
              <input ref="logoInput" type="file" accept="image/png,image/jpeg" class="d-sr-only" tabindex="-1" aria-hidden="true" @change="onLogoFile">
              <p class="rd-note">Receipt printers print in black and white, so the logo is converted here exactly as it will print. Without an image, your initials print.</p>
              <MpFormField label="Logo size">
                <MpSegmentedControl
                  :model-value="selected.settings.logoSize ?? 'sm'"
                  :items="[{ value: 'sm', label: 'Small' }, { value: 'lg', label: 'Large' }]"
                  size="sm"
                  ariaLabel="Logo size"
                  @update:model-value="(v) => { if (v && selected) selected.settings.logoSize = v as 'sm' | 'lg' }"
                />
              </MpFormField>
            </template>

            <template v-else-if="selected.kind === 'store'">
              <v-switch v-model="selected.settings.showAddress" label="Store address" />
              <v-switch v-model="selected.settings.showPhone" label="Store phone" />
              <p class="rd-note">The tax number always prints: ABN in Australia, GST/HST number in Canada. Australian receipts also print "Tax invoice", and sales of $1,000 or more print the buyer's name or ABN, as the ATO requires.</p>
            </template>

            <template v-else-if="selected.kind === 'details'">
              <v-switch v-model="selected.settings.showRegister" label="Register" />
              <v-switch v-model="selected.settings.showStaff" label="Staff member" />
              <p class="rd-note">Receipt number and date always print.</p>
            </template>

            <template v-else-if="selected.kind === 'customer'">
              <v-switch v-model="selected.settings.showPointsEarned" label="Points earned on this sale" />
              <p class="rd-note">Prints when a customer is on the sale: their name, points earned and new balance.</p>
            </template>

            <template v-else-if="selected.kind === 'items'">
              <v-switch v-model="selected.settings.showVariant" label="Variant (colour, size)" />
              <v-switch v-model="selected.settings.showSku" label="SKU" />
              <v-switch v-model="selected.settings.showNotes" label="Discount notes under each item" />
            </template>

            <template v-else-if="selected.kind === 'totals'">
              <v-switch v-model="selected.settings.showSavings" label="&quot;You saved&quot; line" />
              <p class="rd-note">Subtotal, discounts and the total always print. Tax follows the store: GST included in Australia, GST and PST added in British Columbia.</p>
            </template>

            <template v-else-if="selected.kind === 'promo'">
              <v-select
                :model-value="couponChoice"
                :items="couponItems"
                label="Coupon"
                hint="POS coupons from Marketing › Promotions can be redeemed at the register."
                persistent-hint
                @update:model-value="chooseCoupon"
              />
              <v-text-field
                v-if="couponChoice === CUSTOM_CODE"
                v-model="selected.settings.code"
                label="Code"
                placeholder="THANKS10"
                :error-messages="promoNotRedeemable ? 'Not a coupon in Promotions yet, so the register won\'t accept it' : undefined"
              />
              <v-text-field
                v-model="selected.settings.headline"
                label="Headline"
                placeholder="15% off your next visit"
                counter="48"
                :rules="[(v: string) => (v ?? '').length <= 48 || 'Keep it to one or two lines']"
              />
              <div class="rd-chips">
                <v-chip v-for="t in PLACEHOLDERS" :key="t" size="small" variant="outlined" @click="insertPlaceholder('headline', t)">{{ t }}</v-chip>
              </div>
              <MpFormField label="Print the code as">
                <MpSegmentedControl
                  :model-value="selected.settings.codeFormat ?? 'code128'"
                  :items="[{ value: 'text', label: 'Text' }, { value: 'code128', label: 'Barcode' }, { value: 'qr', label: 'QR' }]"
                  size="sm"
                  ariaLabel="Print the code as"
                  @update:model-value="(v) => { if (v && selected) selected.settings.codeFormat = v as 'text' | 'code128' | 'qr' }"
                />
              </MpFormField>
              <p v-if="selected.settings.validUntil" class="rd-note">Valid until the coupon's end date ({{ selected.settings.validUntil }}).</p>
              <v-text-field
                v-else
                v-model.number="selected.settings.validDays"
                label="Valid for (days after the sale)"
                type="number"
                min="1"
                placeholder="30"
              />
              <v-text-field
                v-model.number="selected.settings.minSpend"
                label="Only print on sales over"
                type="number"
                min="0"
                prefix="$"
                placeholder="50"
                hint="Leave at 0 to print on every receipt."
                persistent-hint
              />
            </template>

            <template v-else-if="selected.kind === 'qr'">
              <v-text-field
                v-model="selected.settings.label"
                label="Label"
                placeholder="Tell us how we did"
                counter="32"
              />
              <v-text-field
                v-model="selected.settings.url"
                label="Link"
                type="url"
                inputmode="url"
                placeholder="https://yourstore.com/feedback"
                hint="A survey, a review page or your loyalty sign-up."
                persistent-hint
                :rules="[httpsRule]"
              />
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

            <p v-else class="rd-note">How the sale was paid. Cash shows rounding to 5c and the change given; card is exact.</p>
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
            <p class="rd-note">80 mm paper prints 48 characters a line. 58 mm prints 32, the width that fits both Epson and Star printers. Long names wrap.</p>
          </MpFormGrid>
          <v-btn
            v-if="baseTemplate"
            variant="outlined"
            class="text-none mt-4"
            prepend-icon="rotate-ccw"
            @click="resetOpen = true"
          >
            Reset to {{ baseTemplate.name }}
          </v-btn>
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

  <MpDialog v-model="testPrintOpen" size="sm" title="Print a test receipt" subtitle="Prints what's on screen, saved or not, with the sample sale.">
    <v-radio-group v-model="testRegisterId" aria-label="Register">
      <v-radio v-for="r in printerRegisters" :key="r.id" :value="r.id" :label="`${r.location} · ${r.name} — ${r.printer}`" />
    </v-radio-group>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="testPrintOpen = false">Cancel</v-btn>
      <v-btn variant="flat" color="primary" class="text-none" :disabled="!testRegisterId" @click="sendTestPrint">Print test</v-btn>
    </template>
  </MpDialog>

  <MpDialog v-model="testEmailOpen" size="sm" title="Send a test email" subtitle="Sends what's on screen, saved or not, with the sample sale.">
    <v-text-field
      v-model="testEmail"
      label="Email address"
      type="email"
      inputmode="email"
      autocomplete="email"
      placeholder="name@example.com"
      :error-messages="testEmailError || undefined"
      @keydown.enter="sendTestEmail"
    />
    <template #footer>
      <v-btn variant="text" class="text-none" @click="testEmailOpen = false">Cancel</v-btn>
      <v-btn variant="flat" color="primary" class="text-none" @click="sendTestEmail">Send test</v-btn>
    </template>
  </MpDialog>

  <MpConfirmDialog
    v-model="resetOpen"
    :title="`Reset to ${baseTemplate?.name ?? 'the original'}?`"
    message="Your sections, paper width and spacing go back to the ready-made template."
    :consequences="['The name and POS channel assignments stay', 'Nothing changes on receipts until you save']"
    confirm-label="Reset"
    @confirm="resetToBase"
  />

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

.rd-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-6);
}

.rd-logo {
  display: flex;
  align-items: center;
  gap: var(--mp-space-12);
}

.rd-logo__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--mp-space-80) + var(--mp-space-20));
  height: var(--mp-space-64);
  padding: var(--mp-space-6);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--mp-radius-8);
  /* Paper preview: always the light surface/ink pair, like ReceiptPaper */
  background: var(--mp-color-light-surface);
  color: var(--mp-color-light-onSurfaceMuted);
}

.rd-logo__preview img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}

.rd-note {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--on-surface-muted);
}
</style>
