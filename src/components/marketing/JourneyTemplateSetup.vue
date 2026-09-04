<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import MpFormSection from '@/components/MpFormSection.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormField from '@/components/MpFormField.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpAlert from '@/components/MpAlert.vue'
import JourneyMiniPreview from '@/components/marketing/JourneyMiniPreview.vue'
import type { JourneyTemplate } from '@/stores/journeyFlowData'
import {
  EMAIL_RE,
  connectedStores,
  orderStatusHint,
  prerequisiteCopy,
  productRevenueEnabled,
  productSourceTypes,
  type PrerequisiteKind,
  type SetupBindings,
  type TemplateSetupMeta,
} from '@/stores/journeyTemplateSetup'
import { useCdpEntitiesStore, LIST_BRANDS } from '@/stores/useCdpEntities'
import { useContactsStore } from '@/stores/useContacts'
import { useContentStore } from '@/stores/useContent'
import { useCommerceStore } from '@/stores/useCommerce'

/**
 * Step 2 of the template wizard — "Setup for <Template> journey". Checks the
 * template's prerequisites, then collects the sender, the trigger binding
 * (lists / store / segment / products), one content pick per email, and the
 * Do Not Mail list where the template has one. Emits `update:valid` as the
 * Finish gate.
 */
const props = defineProps<{
  template: JourneyTemplate
  meta: TemplateSetupMeta
  modelValue: SetupBindings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SetupBindings]
  'update:valid': [valid: boolean]
}>()

const route = useRoute()
const accountId = computed(() => String(route.params.accountId ?? ''))
const pathFor = (p: string) => p.replace(':accountId', accountId.value)

function patch(part: Partial<SetupBindings>) {
  emit('update:modelValue', { ...props.modelValue, ...part })
}
function setContent(index: number, id: number | null) {
  const contentIds = [...props.modelValue.contentIds]
  contentIds[index] = id
  patch({ contentIds })
}

// ── Option sources (sandbox mock stores) ────────────────────────────────────
const cdp = useCdpEntitiesStore()
const contacts = useContactsStore()
const content = useContentStore()
const commerce = useCommerceStore()

const lists = computed(() => cdp.lists.filter(l => l.type === 'Normal').map(l => ({ id: l.id, name: l.name, count: l.count })))
const segments = computed(() => contacts.segments.map(s => ({ id: s.id, name: s.name, count: s.count })))
const contents = computed(() => content.activeItems.map(c => ({ id: c.id, name: c.name })))
const products = computed(() => commerce.products.map(p => ({ id: p.id, name: p.name })))
const productCount = computed(() => commerce.products.length)
const categories = computed(() => Array.from(new Set(commerce.products.map(p => p.category))).sort())
const brands = LIST_BRANDS
const dnmBrands = ['All Brands', ...LIST_BRANDS]

// ── Prerequisites ───────────────────────────────────────────────────────────
const present: Record<PrerequisiteKind, () => boolean> = {
  list: () => lists.value.length > 0,
  content: () => contents.value.length > 0,
  store: () => connectedStores.length > 0,
  segment: () => segments.value.length > 0,
  product: () => productRevenueEnabled,
}
const prerequisites = computed(() =>
  props.meta.prerequisites.map(kind => ({ kind, ok: present[kind](), ...prerequisiteCopy[kind] })),
)
const missing = computed(() => prerequisites.value.filter(p => !p.ok))
const missingBody = (tooltip?: string) =>
  `${tooltip ? `${tooltip} ` : ''}Come back to this template once it is in place — your settings from the previous step are kept.`
const prerequisitesMet = computed(() => missing.value.length === 0)

// ── Validation (messages on the fields, one computed gate for Finish) ───────
const required = (label: string) => (v: unknown) =>
  (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== '') || `${label} is required.`
const emailRules = [required('From email address'), (v: string) => !v || EMAIL_RE.test(v) || 'Invalid from email address.']

const triggerValid = computed(() => {
  const b = props.modelValue
  switch (props.meta.trigger.kind) {
    case 'list': return b.listIds.length > 0
    case 'store': return !!b.storeId
    case 'segment': return b.segmentId !== null
    case 'product': {
      const orderOk = !b.orderStatusEnabled || b.orderStatus.trim().length > 0
      if (b.productMode === 'product') return (b.allProducts || b.productIds.length > 0) && orderOk
      return !!b.source && orderOk
    }
  }
})
const filterValid = computed(() => !props.meta.filter || props.modelValue.filterSegmentId !== null)
const contentValid = computed(() => props.modelValue.contentIds.every(id => id !== null))
const dnmValid = computed(() => !props.meta.dnm || props.modelValue.dnmType === 'general' || !!props.modelValue.dnmBrand)
const senderValid = computed(() => props.modelValue.fromName.trim().length > 0 && EMAIL_RE.test(props.modelValue.fromEmail))

const isValid = computed(() =>
  prerequisitesMet.value && senderValid.value && triggerValid.value && filterValid.value && contentValid.value && dnmValid.value,
)
watch(isValid, v => emit('update:valid', v), { immediate: true })

// Switching product mode clears the other mode's picks (production resets them too).
function setProductMode(mode: 'product' | 'categories') {
  patch({ productMode: mode, productIds: [], allProducts: false, source: null, brands: [], categories: [] })
}
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <!-- Intro + live flow preview -->
    <v-card flat border rounded="lg" class="jts-card">
      <div class="d-flex ga-6 flex-wrap align-start">
        <p class="text-body-2 ma-0 flex-grow-1 jts-intro">{{ meta.setupDescription }}</p>
        <div class="jts-preview border rounded-lg bg-background flex-shrink-0" aria-label="Flow preview">
          <JourneyMiniPreview :nodes="template.nodes" />
        </div>
      </div>
    </v-card>

    <!-- Prerequisites -->
    <v-card flat border rounded="lg" class="jts-card">
      <MpFormSection title="Prerequisites" description="Everything this template needs before it can run." :heading-level="2" />
      <ul class="jts-list pa-0 ma-0">
        <li v-for="p in prerequisites" :key="p.kind">
          <MpListRow :title="p.ok ? p.success : p.error" variant="plain">
            <template #lead>
              <v-icon :color="p.ok ? 'success' : 'error'" size="20">{{ p.ok ? 'circle-check' : 'circle-x' }}</v-icon>
            </template>
            <template v-if="p.ok && p.tooltip" #trailing>
              <v-tooltip :text="p.tooltip" location="top">
                <template #activator="{ props: tip }">
                  <v-btn v-bind="tip" icon="info" variant="text" size="small" :aria-label="p.tooltip" />
                </template>
              </v-tooltip>
            </template>
          </MpListRow>
        </li>
      </ul>
      <MpAlert v-for="p in missing" :key="`alert-${p.kind}`" tone="warning" class="mt-3" :title="p.error">
        {{ missingBody(p.tooltip) }}
        <template v-if="p.action" #actions>
          <v-btn variant="text" color="warning" class="text-none" :to="pathFor(p.action.path)" append-icon="arrow-right">
            {{ p.action.label }}
          </v-btn>
        </template>
      </MpAlert>
    </v-card>

    <!-- Sender -->
    <v-card flat border rounded="lg" class="jts-card">
      <MpFormSection
        title="Sender"
        description="Defaults for every email in this journey. You can change them in each Send Email step of the builder."
        :heading-level="2"
        required
      />
      <MpFormGrid :cols="2">
        <v-text-field
          :model-value="modelValue.fromName"
          label="From name *"
          placeholder="Your name"
          :rules="[required('From name')]"
          @update:model-value="patch({ fromName: $event })"
        />
        <v-text-field
          :model-value="modelValue.fromEmail"
          label="From email address *"
          placeholder="name@mp2203.com"
          type="email"
          hint="The domain of this address is your account’s default sending domain."
          persistent-hint
          :rules="emailRules"
          @update:model-value="patch({ fromEmail: $event })"
        />
      </MpFormGrid>
      <router-link :to="pathFor('/accounts/:accountId/settings')" class="text-body-2 text-primary d-inline-block mt-3">
        View your account’s sending domains
      </router-link>
    </v-card>

    <!-- Trigger -->
    <v-card flat border rounded="lg" class="jts-card">
      <MpFormSection title="Set up the trigger" :description="meta.trigger.description" :heading-level="2" />
      <MpFormGrid>
        <v-autocomplete
          v-if="meta.trigger.kind === 'list'"
          :model-value="modelValue.listIds"
          label="Lists *"
          :items="lists"
          item-title="name"
          item-value="id"
          multiple
          chips
          closable-chips
          :hint="`${modelValue.listIds.length} selected`"
          persistent-hint
          :rules="[required('Contact list')]"
          @update:model-value="patch({ listIds: $event })"
        >
          <template #item="{ props: item, item: entry }">
            <v-list-item v-bind="item" :subtitle="`${entry.raw.count.toLocaleString()} contacts`" />
          </template>
        </v-autocomplete>

        <v-select
          v-else-if="meta.trigger.kind === 'store'"
          :model-value="modelValue.storeId"
          label="Store *"
          :items="connectedStores"
          item-title="name"
          item-value="id"
          :disabled="connectedStores.length === 0"
          no-data-text="No connected stores"
          :hint="connectedStores.length === 0 ? 'Connect a store above to choose it here.' : undefined"
          persistent-hint
          :rules="[required('Store')]"
          @update:model-value="patch({ storeId: $event })"
        />

        <v-autocomplete
          v-else-if="meta.trigger.kind === 'segment'"
          :model-value="modelValue.segmentId"
          label="Segment *"
          :items="segments"
          item-title="name"
          item-value="id"
          :rules="[required('Segment')]"
          @update:model-value="patch({ segmentId: $event })"
        >
          <template #item="{ props: item, item: entry }">
            <v-list-item v-bind="item" :subtitle="`${entry.raw.count.toLocaleString()} contacts`" />
          </template>
        </v-autocomplete>

        <template v-else>
          <MpFormField label="Trigger on">
            <template #default="{ labelId }">
              <v-radio-group
                :model-value="modelValue.productMode"
                inline
                hide-details
                :aria-labelledby="labelId"
                @update:model-value="setProductMode($event ?? 'product')"
              >
                <v-radio label="Product" value="product" />
                <v-radio label="Product categories" value="categories" />
              </v-radio-group>
            </template>
          </MpFormField>

          <template v-if="modelValue.productMode === 'product'">
            <v-autocomplete
              :model-value="modelValue.productIds"
              label="Products *"
              placeholder="Search products by name"
              :items="products"
              item-title="name"
              item-value="id"
              multiple
              chips
              closable-chips
              :disabled="modelValue.allProducts"
              :hint="`${modelValue.productIds.length} selected`"
              persistent-hint
              :rules="modelValue.allProducts ? [] : [required('Product')]"
              @update:model-value="patch({ productIds: $event })"
            />
            <v-checkbox
              :model-value="modelValue.allProducts"
              :label="`Trigger for all products (${productCount.toLocaleString()})`"
              hide-details
              @update:model-value="patch({ allProducts: !!$event, productIds: [] })"
            />
          </template>
          <template v-else>
            <v-select
              :model-value="modelValue.source"
              label="Source *"
              :items="productSourceTypes"
              :rules="[required('Source')]"
              @update:model-value="patch({ source: $event })"
            />
            <v-autocomplete
              :model-value="modelValue.brands"
              label="Brands"
              :items="brands"
              multiple
              chips
              closable-chips
              @update:model-value="patch({ brands: $event })"
            />
            <v-autocomplete
              :model-value="modelValue.categories"
              label="Product categories"
              :items="categories"
              multiple
              chips
              closable-chips
              @update:model-value="patch({ categories: $event })"
            />
          </template>

          <div class="d-flex align-center ga-1">
            <v-checkbox
              :model-value="modelValue.orderStatusEnabled"
              label="Filter by order status"
              hide-details
              @update:model-value="patch({ orderStatusEnabled: !!$event, orderStatus: $event ? modelValue.orderStatus : '' })"
            />
            <v-tooltip :text="orderStatusHint" location="top" max-width="320">
              <template #activator="{ props: tip }">
                <v-btn v-bind="tip" icon="info" variant="text" size="small" aria-label="About the order status filter" />
              </template>
            </v-tooltip>
          </div>
          <v-text-field
            :model-value="modelValue.orderStatus"
            label="Order status *"
            placeholder="e.g. Completed"
            :disabled="!modelValue.orderStatusEnabled"
            :rules="modelValue.orderStatusEnabled ? [required('Order status')] : []"
            @update:model-value="patch({ orderStatus: $event })"
          />
        </template>
      </MpFormGrid>
    </v-card>

    <!-- Filter (Lapsed Buyer) -->
    <v-card v-if="meta.filter" flat border rounded="lg" class="jts-card">
      <MpFormSection title="Set up the filter" :description="meta.filter.description" :heading-level="2" />
      <MpFormGrid>
        <v-autocomplete
          :model-value="modelValue.filterSegmentId"
          label="Segment *"
          :items="segments"
          item-title="name"
          item-value="id"
          :rules="[required('Segment')]"
          @update:model-value="patch({ filterSegmentId: $event })"
        />
      </MpFormGrid>
    </v-card>

    <!-- Content -->
    <v-card flat border rounded="lg" class="jts-card">
      <MpFormSection title="Set up content" :description="meta.contentIntro" :heading-level="2" />
      <div class="d-flex flex-column ga-6">
        <div v-for="(email, i) in meta.emails" :key="email.title">
          <MpFormSection :title="email.title" :description="email.description" :heading-level="3" />
          <router-link v-if="email.link" :to="pathFor(email.link.path)" class="text-body-2 text-primary d-inline-block mb-3">
            {{ email.link.label }}
          </router-link>
          <MpFormGrid>
            <v-autocomplete
              :model-value="modelValue.contentIds[i] ?? null"
              :label="`Content for ${email.title.split(':')[0]} *`"
              :items="contents"
              item-title="name"
              item-value="id"
              :rules="[required('Email content')]"
              @update:model-value="setContent(i, $event)"
            />
          </MpFormGrid>
        </div>
      </div>
    </v-card>

    <!-- Do Not Mail list (Email Re-Engagement) -->
    <v-card v-if="meta.dnm" flat border rounded="lg" class="jts-card">
      <MpFormSection title="Set up the Do Not Mail list" :description="meta.dnm.description" :heading-level="2" />
      <MpFormGrid>
        <MpFormField label="Do Not Mail list">
          <template #default="{ labelId }">
            <v-radio-group
              :model-value="modelValue.dnmType"
              inline
              hide-details
              :aria-labelledby="labelId"
              @update:model-value="patch({ dnmType: $event ?? 'general' })"
            >
              <v-radio label="General Do Not Mail list" value="general" />
              <v-radio label="Brand Do Not Mail list" value="brand" />
            </v-radio-group>
          </template>
        </MpFormField>
        <v-select
          v-if="modelValue.dnmType === 'brand'"
          :model-value="modelValue.dnmBrand"
          label="Brand *"
          :items="dnmBrands"
          :rules="[required('Brand')]"
          @update:model-value="patch({ dnmBrand: $event })"
        />
      </MpFormGrid>
    </v-card>
  </div>
</template>

<style scoped>
.jts-card { padding: var(--mp-component-card-padding); }
/* Keeps the intro from being squeezed before the wrapping row breaks. The
   token is camelCase; the kebab spelling here resolved to nothing, so this
   declaration was silently dropped. */
.jts-intro { min-width: min(var(--mp-component-toolbar-searchMinWidth), 100%); }
.jts-preview {
  padding: var(--mp-space-16) var(--mp-space-12);
  max-width: 100%;
  overflow-x: auto;
}
.jts-list { list-style: none; }
</style>
