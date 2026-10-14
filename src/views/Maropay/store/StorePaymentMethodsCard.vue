<script setup lang="ts">
import { computed, ref } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MaropayMethodRow from '@/components/maropay/MaropayMethodRow.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { METHOD_CATEGORY_LABELS } from '@/maropay/model'
import type { MethodCategory, MethodStatus, PaymentMethodCatalogEntry } from '@/maropay/model'
import { joinList } from '@/maropay/readiness'

// A store's payment methods, grouped by category: each with its mark, rate and
// what it needs, and the switch that offers it at checkout. A method that needs
// a review opens its requirements in a drawer instead of switching on.

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  channelId: string
  live: boolean
  canManage: boolean
}>()

type StoreMethod = PaymentMethodCatalogEntry & { status: MethodStatus }

const maropay = useMaropayStore()
const toast = useToast()

const CATEGORY_ORDER: MethodCategory[] = ['cards', 'wallets', 'bnpl', 'local']
const storeMethods = computed(() => maropay.methodsForStore(props.channelId))
const methodGroups = computed(() =>
  CATEGORY_ORDER
    .map((category) => ({ category, label: METHOD_CATEGORY_LABELS[category], methods: storeMethods.value.filter((m) => m.category === category && m.status !== 'unavailable') }))
    .filter((group) => group.methods.length),
)
const unavailableCount = computed(() => storeMethods.value.filter((m) => m.status === 'unavailable').length)
const checkoutMethods = computed(() => maropay.checkoutMethodsFor(props.channelId))
const pendingMethods = computed(() => storeMethods.value.filter((m) => m.status === 'pending_approval'))

function disabledReason(method: StoreMethod): string | null {
  if (!props.canManage) return 'Only the business owner can change this.'
  const lastReady = props.live && checkoutMethods.value.length === 1 && checkoutMethods.value[0]!.id === method.id
  return lastReady ? 'A live store needs at least one payment method.' : null
}

function toggle(method: StoreMethod, enabled: boolean): void {
  const result = maropay.setMethodEnabled(props.channelId, method.id, enabled)
  if (!result.ok) toast.error(result.error.message)
}

// ── Set up a method that needs a review ─────────────────────────────

const setupOpen = ref(false)
const setupMethod = ref<StoreMethod | null>(null)
/** Answers go to our payments partner's review; the prototype doesn't keep them. */
const setupAnswers = ref<string[]>([])
const setupAttempted = ref(false)

function openSetup(method: StoreMethod): void {
  setupMethod.value = method
  setupAnswers.value = method.requirements.map(() => '')
  setupAttempted.value = false
  setupOpen.value = true
}

function submitSetup(): void {
  const method = setupMethod.value
  if (!method) return
  setupAttempted.value = true
  if (setupAnswers.value.some((answer) => !answer.trim())) return
  const result = maropay.setMethodEnabled(props.channelId, method.id, true)
  if (!result.ok) {
    toast.error(result.error.message)
    return
  }
  setupOpen.value = false
  toast.success(`${method.label} requested. It turns on at checkout once our payments partner approves it.`)
}
</script>

<template>
  <v-card v-bind="$attrs" flat border rounded="lg" class="mp-card-inset">
    <MpSectionHeader
      icon="credit-card"
      title="Payment methods"
      :description="live ? 'Changes apply to new checkouts straight away.' : 'Changing methods means running the test checkout and reviewing the changes again.'"
      :heading-level="2"
    />
    <div v-for="group in methodGroups" :key="group.category" class="store-methods__group">
      <h3 class="store-methods__subhead">{{ group.label }}</h3>
      <MaropayMethodRow
        v-for="method in group.methods"
        :key="method.id"
        :method="method"
        :disabled-reason="disabledReason(method)"
        @toggle="toggle(method, $event)"
        @setup="openSetup(method)"
      />
    </div>
    <p v-if="pendingMethods.length && checkoutMethods.length" class="store-methods__note">
      {{ joinList(checkoutMethods.map((m) => m.label)) }} can go live while {{ joinList(pendingMethods.map((m) => m.label)) }} {{ pendingMethods.length === 1 ? 'awaits' : 'await' }} approval.
    </p>
    <p v-if="unavailableCount" class="store-methods__note">
      {{ unavailableCount }} {{ unavailableCount === 1 ? 'method isn’t' : 'methods aren’t' }} available for {{ maropay.account?.currency ?? 'USD' }} accounts.
    </p>
  </v-card>

  <MpFormDrawer v-model="setupOpen" :title="`Set up ${setupMethod?.label ?? 'payment method'}`" subtitle="Our payments partner reviews this before shoppers see it." size="sm">
    <template v-if="setupMethod">
      <MpFormGrid>
        <v-text-field
          v-for="(requirement, index) in setupMethod.requirements"
          :key="requirement"
          v-model="setupAnswers[index]"
          :label="`${requirement} *`"
          :error-messages="setupAttempted && !setupAnswers[index]?.trim() ? 'Answer this so the review can start.' : undefined"
        />
      </MpFormGrid>
      <MpAlert tone="info" live="off">
        Your other methods keep working while {{ setupMethod.label }} is reviewed. It turns on at checkout once it’s approved.
      </MpAlert>
    </template>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="setupOpen = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" @click="submitSetup">Submit for review</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.store-methods__group + .store-methods__group {
  margin-top: var(--mp-space-20);
}

.store-methods__subhead {
  margin: 0 0 var(--mp-space-4);
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-fontWeight-semibold);
  line-height: var(--mp-lineHeight-snug);
  color: var(--on-surface);
}

.store-methods__note {
  margin: var(--mp-space-12) 0 0;
  font-size: var(--mp-fontSize-13);
  line-height: var(--mp-lineHeight-normal);
  color: var(--on-surface-muted);
}
</style>
