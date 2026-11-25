import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canSearch } from '../../src/storefront/storeSearch.ts'
import { demoStoreFor } from '../../src/storefront/demoStores/index.ts'
import type { SalesChannel } from '../../src/stores/useSalesChannels.ts'

// One rule for the storefront's header and the admin's previews of it: a store can be searched once it is
// connected to Merchandise Cloud and sells products of its own.

const store = (patch: Partial<SalesChannel> = {}): SalesChannel => ({
  id: 'own-store',
  accountId: '2000290',
  name: 'Own store',
  type: 'web_store',
  provider: 'maropost_store_builder',
  status: 'active',
  health: 'healthy',
  connectedClouds: [],
  createdAt: '2026-11-01',
  updatedAt: '2026-11-01',
  lastActivityAt: '2026-11-01',
  webStore: { domain: 'own.example', storeBuilderEnabled: true, published: true, merchandiseConnected: false },
  ...patch,
} as SalesChannel)

const connected = { status: 'connected', health: 'healthy' } as const
const ownProducts = [{ channelIds: ['own-store'] }, {}]

test('a store is searchable once it is connected and sells its own products', () => {
  assert.equal(canSearch(store({ merchandising: connected }), ownProducts), true)
  assert.equal(canSearch(store({ webStore: { domain: 'own.example', storeBuilderEnabled: true, published: true, merchandiseConnected: true } }), ownProducts), true)
})

test('a store not yet connected to Merchandise Cloud has no search', () => {
  assert.equal(canSearch(store(), ownProducts), false)
  assert.equal(canSearch(store({ merchandising: { status: 'setup_required', health: 'warning' } }), ownProducts), false)
  assert.equal(canSearch(store({ merchandising: { status: 'sync_issue', health: 'error' } }), ownProducts), false)
})

test('a connected store on the shared catalogue keeps the header it had', () => {
  assert.equal(canSearch(store({ merchandising: connected }), [{}, { channelIds: ['another-store'] }]), false)
})

test('no store, no search', () => {
  assert.equal(canSearch(undefined, ownProducts), false)
})

test('Vitaheal opens without search, and the other demo stores open with it', () => {
  const sells = (id: string) => [{ channelIds: [id] }]
  const vitaheal = demoStoreFor('vitaheal').homeChannel
  assert.equal(canSearch(vitaheal, sells(vitaheal.id)), false, 'Vitaheal connects Merchandise Cloud in the demo')
  assert.equal(canSearch({ ...vitaheal, merchandising: connected }, sells(vitaheal.id)), true)
  for (const id of ['daybloom', 'northfold', 'torqline', 'lumos'] as const) {
    const channel = demoStoreFor(id).homeChannel
    assert.equal(canSearch(channel, sells(channel.id)), true, id)
  }
})
