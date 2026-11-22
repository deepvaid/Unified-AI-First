<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import MpAlert from '@/components/MpAlert.vue'
import MpFormDrawer from '@/components/MpFormDrawer.vue'
import MpFormGrid from '@/components/MpFormGrid.vue'
import MpFormSection from '@/components/MpFormSection.vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { connectionOf, providerLabel } from '@/maropay/providers'
import type { OwnProviderKind } from '@/maropay/providers'

// Configure a manual method (bank deposit, cheque, cash on delivery): what the
// shopper reads at checkout and after the order — the real product's display
// name, checkout description and payment instructions — and whether it's offered.

const model = defineModel<boolean>({ default: false })

const props = defineProps<{
  channelId: string
  kind: OwnProviderKind | null
}>()

const maropay = useMaropayStore()
const toast = useToast()

const connection = computed(() => (props.kind ? connectionOf(maropay.storeProvidersFor(props.channelId), props.kind) : null))
const name = computed(() => (props.kind ? providerLabel(props.kind) : ''))
const canManage = computed(() => maropay.can('manage_methods', props.channelId))

const form = reactive({ displayName: '', checkoutDescription: '', paymentInstructions: '', offered: true })

watch(model, (open) => {
  if (!open || !connection.value?.manual) return
  form.displayName = connection.value.manual.displayName
  form.checkoutDescription = connection.value.manual.checkoutDescription
  form.paymentInstructions = connection.value.manual.paymentInstructions
  form.offered = connection.value.status === 'active'
})

const nameError = computed(() => (form.displayName.trim() ? '' : 'Give the method a name shoppers will see at checkout.'))

function save(): void {
  if (!props.kind || nameError.value) return
  const saved = maropay.updateManualMethod(props.channelId, props.kind, {
    displayName: form.displayName, checkoutDescription: form.checkoutDescription, paymentInstructions: form.paymentInstructions,
  })
  if (!saved.ok) {
    toast.error(saved.error.message)
    return
  }
  const wanted = form.offered ? 'active' : 'inactive'
  if (connection.value && connection.value.status !== wanted) {
    const toggled = maropay.setProviderStatus(props.channelId, props.kind, wanted)
    if (!toggled.ok) {
      toast.error(toggled.error.message)
      return
    }
  }
  toast.success(form.offered ? `${name.value} is on at checkout.` : `${name.value} saved — off at checkout.`)
  model.value = false
}
</script>

<template>
  <MpFormDrawer v-model="model" :title="`Configure ${name}`" subtitle="Paid outside the store. You record the payment from the order once it arrives." size="md">
    <MpFormSection title="At checkout" />
    <MpFormGrid :cols="1">
      <v-text-field
        v-model="form.displayName"
        class="mp-form-grid__full"
        label="Display name *"
        :placeholder="name"
        :error-messages="nameError ? [nameError] : []"
        :disabled="!canManage"
      />
      <v-textarea
        v-model="form.checkoutDescription"
        class="mp-form-grid__full"
        label="Checkout description"
        rows="3"
        hint="Shown under the method when a shopper picks it."
        persistent-hint
        :disabled="!canManage"
      />
      <v-switch v-model="form.offered" class="mp-form-grid__full" label="Offer at checkout" hide-details :disabled="!canManage" />
    </MpFormGrid>

    <MpFormSection title="After the order" />
    <MpFormGrid :cols="1">
      <v-textarea
        v-model="form.paymentInstructions"
        class="mp-form-grid__full"
        label="Payment instructions"
        rows="5"
        hint="Shown on the order confirmation and in the order email — account details, where to post a cheque, or what to have ready."
        persistent-hint
        :disabled="!canManage"
      />
    </MpFormGrid>
    <MpAlert tone="info" live="off" title="Orders wait as Pending">
      Orders paid this way stay Pending until you mark the payment received from the order.
    </MpAlert>

    <template #footer>
      <v-btn variant="text" class="text-none" @click="model = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" class="text-none" :disabled="!canManage || !!nameError" @click="save">Save</v-btn>
    </template>
  </MpFormDrawer>
</template>
