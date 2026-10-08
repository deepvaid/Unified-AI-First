<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpAlert from '@/components/MpAlert.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpListRow from '@/components/MpListRow.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { PROVIDER_LABELS, STORE_ACTIVATION_LABELS } from '@/maropay/model'
import { cardGateway } from '@/maropay/providers'
import type { MaropayError } from '@/maropay/model'
import { formatDay, joinList, storePaymentsTarget } from '@/maropay/readiness'

// Settings → Stores: one Maropay account, activated store by store. Linking a
// store reuses the verified business — no second setup — and changes nothing
// at checkout until the store is activated (M07).

const router = useRouter()
const maropay = useMaropayStore()
const toast = useToast()


const rows = computed(() => maropay.bindings
  .filter((b) => maropay.can('view_transactions', b.channelId))
  .map((binding) => {
    const state = maropay.storeStateFor(binding.channelId) ?? 'inactive'
    const methods = joinList(maropay.checkoutMethodsFor(binding.channelId).map((m) => m.label))
    const gateway = cardGateway(maropay.storeProvidersFor(binding.channelId))
    const previous = gateway ? PROVIDER_LABELS[gateway.kind] : null
    let note: string
    if (state === 'live') note = `Maropay since ${formatDay(binding.activatedAt ?? binding.linkedAt)}${methods ? ` · ${methods}` : ''}`
    else if (previous) note = `Checkout uses ${previous} until you activate Maropay`
    else note = `Linked ${formatDay(binding.linkedAt)} · not taking payments with Maropay yet`
    return {
      id: binding.channelId,
      name: maropay.channelName(binding.channelId),
      status: STORE_ACTIVATION_LABELS[state],
      note,
      to: maropay.routeFor(storePaymentsTarget(binding.channelId)),
    }
  }))

const unlinked = computed(() => maropay.eligibleChannels.filter((c) => !maropay.bindings.some((b) => b.channelId === c.id)))

const linkBlocker = computed(() => {
  const account = maropay.account
  if (account?.closedAt) return 'This Maropay account is closed.'
  if (account?.setup !== 'submitted') return 'Finish Maropay setup first.'
  if (!maropay.can('link_store')) return 'Only the business owner can link stores.'
  if (!unlinked.value.length) return 'Every Maropost store is already linked.'
  return null
})

// ── Link a store ───────────────────────────────────────────────────

const linkOpen = ref(false)
const linkChannelId = ref<string | null>(null)
const linkProblem = ref<MaropayError | null>(null)
const storeOptions = computed(() => unlinked.value.map((c) => ({ value: c.id, title: c.name, subtitle: c.domain ?? undefined })))

function openLink(): void {
  linkChannelId.value = unlinked.value[0]?.id ?? null
  linkProblem.value = null
  linkOpen.value = true
}

function link(): void {
  const channelId = linkChannelId.value
  if (!channelId) return
  const result = maropay.linkStore(channelId)
  if (!result.ok) {
    linkProblem.value = result.error
    return
  }
  linkOpen.value = false
  toast.success(`${maropay.channelName(channelId)} is linked. Nothing changes at checkout until you activate it.`)
  void router.push(maropay.routeFor(storePaymentsTarget(channelId)))
}
</script>

<template>
  <v-card flat border rounded="lg" class="maropay-stores__card">
    <MpSectionHeader title="Stores" description="One Maropay account, activated store by store. Linking a store doesn’t change its checkout." :heading-level="2">
      <template #actions>
        <v-tooltip :disabled="!linkBlocker" :text="linkBlocker ?? ''" location="top">
          <template #activator="{ props: tip }">
            <span v-bind="tip">
              <v-btn variant="outlined" size="small" class="text-none" prepend-icon="link" :disabled="!!linkBlocker" @click="openLink">Link a store</v-btn>
            </span>
          </template>
        </v-tooltip>
      </template>
    </MpSectionHeader>

    <MpListRow v-for="row in rows" :key="row.id" variant="divided" :to="row.to">
      <template #lead><v-icon size="18" class="maropay-stores__icon">globe</v-icon></template>
      <span class="maropay-stores__title">{{ row.name }}</span>
      <span class="maropay-stores__sub">{{ row.note }}</span>
      <template #trailing>
        <MpStatusChip :status="row.status" type="readiness" size="sm" show-icon />
        <v-icon size="16" class="ms-2 maropay-stores__icon">chevron-right</v-icon>
      </template>
    </MpListRow>

    <MpEmptyState
      v-if="!rows.length"
      icon="store"
      :title="maropay.account?.setup === 'submitted' ? 'No stores are linked yet' : 'Stores you choose in setup appear here'"
      :description="maropay.account?.setup === 'submitted' ? 'Link a Maropost store to start choosing its payment methods.' : 'They’re linked once setup is submitted.'"
      :heading-level="3"
    />

    <p class="maropay-stores__note">
      Shopify stores and point-of-sale channels take payments through their own setup, so they aren’t listed here.
    </p>
  </v-card>

  <MpFormDrawer v-model="linkOpen" title="Link a store" subtitle="Uses your verified business — no second setup" size="sm">
    <MpFormGrid>
      <v-select v-model="linkChannelId" :items="storeOptions" label="Store *" item-props />
    </MpFormGrid>
    <MpAlert tone="info" live="off">
      The store keeps its current checkout. Next you choose its payment methods, run a test checkout and activate it when you’re ready.
    </MpAlert>
    <MpAlert v-if="linkProblem" tone="error" title="The store wasn’t linked">{{ linkProblem.message }}</MpAlert>
    <template #footer>
      <v-btn variant="text" class="text-none" @click="linkOpen = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!linkChannelId" @click="link">Link store</v-btn>
    </template>
  </MpFormDrawer>
</template>

<style scoped>
.maropay-stores__card {
  padding: var(--mp-component-card-padding);
}

.maropay-stores__icon {
  color: var(--text-secondary);
}

.maropay-stores__title {
  display: block;
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.maropay-stores__sub {
  display: block;
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.maropay-stores__note {
  margin: var(--mp-space-20) 0 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-secondary);
}
</style>
