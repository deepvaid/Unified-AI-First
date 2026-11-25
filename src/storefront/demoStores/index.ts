// The demo stores, each also a theme in the library. Pure, so Node tests every one.
// Append a new store here (never insert: the order is the library's, and the home
// channels follow the seeded stores so Atlas stays Maropay's first store).

import type { SalesChannel } from '../../stores/useSalesChannels.ts'
import type { DemoStoreBlueprint, DemoStoreId } from './types.ts'
import { AURORA_BLUEPRINT } from './aurora.ts'
import { LUMOS_BLUEPRINT } from './lumos.ts'
import { DAYBLOOM_BLUEPRINT } from './daybloom.ts'
import { NORTHFOLD_BLUEPRINT } from './northfold.ts'
import { TORQLINE_BLUEPRINT } from './torqline.ts'
import { VITAHEAL_BLUEPRINT } from './vitaheal.ts'

export type {
  AdminFacts, AssistantProfileId, DemoStoreBlueprint, DemoStoreId, InstallContext, SizeChart, SnapshotCheckout, SnapshotCollection,
  StoreBlueprintRef, StoreCapabilities, StoreHistory, StoreSnapshot, ThemeCard,
} from './types.ts'

export const DEMO_STORES: readonly DemoStoreBlueprint[] = [VITAHEAL_BLUEPRINT, NORTHFOLD_BLUEPRINT, TORQLINE_BLUEPRINT, LUMOS_BLUEPRINT, AURORA_BLUEPRINT, DAYBLOOM_BLUEPRINT]

/** A blueprint id this build knows (one read from the browser may name a store that no longer exists). */
export function isDemoStoreId(id: unknown): id is DemoStoreId {
  return DEMO_STORES.some((blueprint) => blueprint.id === id)
}

export function demoStoreFor(id: DemoStoreId): DemoStoreBlueprint {
  const blueprint = DEMO_STORES.find((entry) => entry.id === id)
  if (!blueprint) throw new Error(`No demo store "${id}"`)
  return blueprint
}

/** The blueprint seeded on this channel: its own store, whatever theme it runs now. */
export function homeBlueprintOf(channelId: string): DemoStoreBlueprint | undefined {
  return DEMO_STORES.find((blueprint) => blueprint.homeChannel.id === channelId)
}

/** One of the seeded demo stores' own channels. */
export function isDemoChannelId(channelId: string): boolean {
  return homeBlueprintOf(channelId) !== undefined
}

/** Whether a theme from the library can be applied to the store: exactly the stores with `webStore.blueprint`. */
export function canApplyTheme(channel: Pick<SalesChannel, 'webStore'> | null | undefined): boolean {
  return !!channel?.webStore?.blueprint
}
