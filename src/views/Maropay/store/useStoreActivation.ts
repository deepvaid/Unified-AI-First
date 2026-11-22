import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { useMaropayStore } from '@/stores/useMaropay'
import { activeConnections, cardGateway, connectionOfferedMethods, providerLabel } from '@/maropay/providers'
import { joinList, payoutScheduleLabel } from '@/maropay/readiness'

/**
 * Activating and stopping Maropay on one store — shared by the store's Payments
 * page (the Maropay card) and Maropay's own page for the store, so the two never
 * say different things. The consequences follow the Activate dialog's choice:
 * Maropay takes cards from the merchant's gateway, or sits beside it.
 */
export function useStoreActivation(channelId: Ref<string>, storeName: Ref<string>) {
  const maropay = useMaropayStore()
  const toast = useToast()

  const binding = computed(() => maropay.bindingFor(channelId.value))
  const setup = computed(() => maropay.storeProvidersFor(channelId.value))
  const gateway = computed(() => cardGateway(setup.value))
  const gatewayName = computed(() => (gateway.value ? providerLabel(gateway.value.kind) : null))
  const checklist = computed(() => maropay.checklistFor(channelId.value))
  const canActivate = computed(() => maropay.can('activate_store', channelId.value))

  const activateOpen = ref(false)
  const deactivateOpen = ref(false)
  /** Set by a successful activation, for the page to show its live notice. */
  const justActivated = ref(false)

  const activateHint = computed(() => {
    if (!canActivate.value) return 'Only the business owner can activate Maropay.'
    const left = checklist.value?.blockedBy.length ?? 0
    return left ? `Finish the checklist first — ${left} left` : ''
  })

  function activateConsequences(takeCards: boolean): string[] {
    const store = storeName.value
    const gw = gatewayName.value
    const cardsVia = takeCards ? 'maropay' : 'existing'
    const added = maropay.maropayOfferedFor(channelId.value, cardsVia).map((m) => m.label)
    const impact = maropay.migrationImpactFor(channelId.value, cardsVia)
    const pending = maropay.methodsForStore(channelId.value).filter((m) => m.status === 'pending_approval').map((m) => m.label)
    const staying = (impact?.rows ?? []).filter((r) => r.change === 'stays').map((r) => r.label)
    const others = (impact?.coexisting ?? []).filter((name) => name !== gw)
    const paypalOwn = setup.value.connections.some((c) => c.kind === 'paypal' && c.status === 'active')
    const lines = [
      `Shoppers can pay with ${added.length ? joinList(added) : 'nothing yet'} through Maropay.${pending.length ? ` ${joinList(pending)} turns on once it’s approved.` : ''}`,
    ]
    if (!gw) lines.push(`Maropay takes new checkouts on ${store}.`)
    else if (takeCards) {
      lines.push(`New checkouts on ${store} go through Maropay instead of ${gw} for cards${staying.length ? ` — ${joinList(staying)} ${staying.length === 1 ? 'stays' : 'stay'} connected through ${gw}` : ''}. Earlier payments, refunds and payouts stay with ${gw}.`)
    } else {
      lines.push(`${gw} keeps taking cards on ${store}. Maropay adds ${added.length ? joinList(added) : 'nothing yet'} beside it.`)
    }
    if (others.length) lines.push(`${joinList(others)} ${others.length === 1 ? 'stays as it is' : 'stay as they are'}.`)
    // The illustrative platform fee moves with the cards: PayPal's is waived once Maropay takes them.
    if (takeCards && paypalOwn) lines.push('No more Maropost platform fee on PayPal (illustrative 1% today). Other providers keep theirs while they stay connected.')
    else if (!takeCards && gw) lines.push(`The illustrative Maropost platform fees on ${gw}${paypalOwn ? ' and PayPal' : ''} stay as they are.`)
    const destination = maropay.account?.payoutDestination
    if (destination && maropay.account) {
      lines.push(`Money is paid out to ${destination.bankName} •••• ${destination.last4} — ${payoutScheduleLabel(maropay.account.payoutSchedule).toLowerCase()}.`)
    }
    if (binding.value?.captureMode === 'manual') lines.push('Payments are authorised at checkout — capture each one from its order.')
    return lines
  }

  const deactivateConsequences = computed(() => {
    const others = activeConnections(setup.value)
      .filter((c) => c !== gateway.value && connectionOfferedMethods(c, setup.value).length > 0)
      .map((c) => providerLabel(c.kind))
    return [
      gatewayName.value
        ? `Cards on ${storeName.value} go back to ${gatewayName.value} straight away.`
        : `${storeName.value} won’t take card payments until you activate Maropay again or connect another provider.`,
      ...(others.length ? [`${joinList(others)} ${others.length === 1 ? 'keeps working as it does' : 'keep working as they do'}.`] : []),
      'Payments already taken — with their refunds, disputes and payouts — stay in Maropay.',
      'To switch back, you’ll review the changes again first.',
    ]
  })

  function activate(takeCards: boolean): boolean {
    const result = maropay.activateStore(channelId.value, { takeCards })
    if (!result.ok) {
      toast.error(result.error.message)
      return false
    }
    justActivated.value = true
    return true
  }

  function deactivate(): boolean {
    const result = maropay.deactivateStore(channelId.value)
    if (!result.ok) {
      toast.error(result.error.message)
      return false
    }
    justActivated.value = false
    toast.info(`Maropay stopped on ${storeName.value}. ${gatewayName.value ? `Cards go back to ${gatewayName.value}.` : 'No card processor is connected.'}`)
    return true
  }

  return {
    binding, setup, gateway, gatewayName, checklist, canActivate,
    activateOpen, deactivateOpen, justActivated, activateHint,
    activateConsequences, deactivateConsequences, activate, deactivate,
  }
}
