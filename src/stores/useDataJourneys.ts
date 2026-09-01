import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlowNode } from '@/stores/journeyFlowData'
import { dataJourneyTemplates, dataTemplateById, instantiateFrom, makeNode } from '@/stores/journeyFlowData'

// Vocabulary mirrors the production platform: a journey is a Draft until first
// enabled, then toggles Enabled ↔ Disabled from the list or the builder.
export type DataJourneyStatus = 'Enabled' | 'Disabled' | 'Draft'

export interface DataJourney {
  id: number
  name: string
  status: DataJourneyStatus
  /** Optional expiry — the journey stops triggering past this date/time. */
  endDate: string
  endTime: string
  allowMultiple: boolean
  /** Set whenever the journey is switched off; surfaced in the Edit dialog. */
  lastDisabledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DataJourneyPayload {
  name: string
  endDate: string
  endTime: string
  enabled: boolean
  allowMultiple: boolean
}

export interface DataJourneyInstance {
  id: number
  name: string
  status: 'Finished' | 'Running'
  finishedAt: string | null
  updatedAt: string
  createdAt: string
}

/** Deterministic run history: `count` runs, one per day counting back from `last`. */
function makeRuns(journeyId: number, name: string, count: number, last: string, running = false): DataJourneyInstance[] {
  const runs: DataJourneyInstance[] = []
  const end = new Date(last).getTime()
  for (let i = 0; i < count; i++) {
    const created = new Date(end - i * 86_400_000 - (i % 3) * 3_600_000)
    const finished = new Date(created.getTime() + 6 * 60_000)
    const isRunning = running && i === 0
    runs.push({
      id: journeyId * 1000 + i,
      name,
      status: isRunning ? 'Running' : 'Finished',
      finishedAt: isRunning ? null : finished.toISOString(),
      updatedAt: finished.toISOString(),
      createdAt: created.toISOString(),
    })
  }
  return runs
}

export const useDataJourneysStore = defineStore('dataJourneys', () => {
  const dataJourneys = ref<DataJourney[]>([
    { id: 1, name: 'Salesforce Lead Sync', status: 'Enabled', endDate: '', endTime: '', allowMultiple: true, lastDisabledAt: null, createdAt: '2025-11-02T09:15:00Z', updatedAt: '2026-08-30T07:23:00Z' },
    { id: 2, name: 'Shopify Order Import', status: 'Enabled', endDate: '', endTime: '', allowMultiple: true, lastDisabledAt: null, createdAt: '2025-08-19T14:58:00Z', updatedAt: '2026-08-30T07:23:00Z' },
    { id: 3, name: 'Data Warehouse Export', status: 'Disabled', endDate: '', endTime: '', allowMultiple: false, lastDisabledAt: '2026-08-12T00:00:00Z', createdAt: '2026-01-12T11:05:00Z', updatedAt: '2026-08-12T00:00:00Z' },
    { id: 4, name: 'Weekly Sales Report', status: 'Enabled', endDate: '2026-12-31', endTime: '23:59', allowMultiple: false, lastDisabledAt: null, createdAt: '2026-02-03T08:00:00Z', updatedAt: '2026-08-24T09:41:00Z' },
    { id: 5, name: 'Abandoned Cart Feed', status: 'Disabled', endDate: '', endTime: '', allowMultiple: true, lastDisabledAt: '2026-07-15T12:00:00Z', createdAt: '2026-03-18T15:46:00Z', updatedAt: '2026-07-15T12:00:00Z' },
    { id: 6, name: 'Contact List Backup', status: 'Draft', endDate: '', endTime: '', allowMultiple: false, lastDisabledAt: null, createdAt: '2026-06-10T03:22:00Z', updatedAt: '2026-06-10T03:22:00Z' },
    { id: 7, name: 'Facebook Audience Sync', status: 'Disabled', endDate: '', endTime: '', allowMultiple: true, lastDisabledAt: '2026-06-08T22:55:00Z', createdAt: '2026-04-18T23:06:00Z', updatedAt: '2026-06-08T22:55:00Z' },
    { id: 8, name: 'Post-Campaign Report', status: 'Draft', endDate: '', endTime: '', allowMultiple: false, lastDisabledAt: null, createdAt: '2026-05-31T02:03:00Z', updatedAt: '2026-05-31T02:03:00Z' },
    { id: 9, name: 'SFTP Catalog Upload', status: 'Disabled', endDate: '', endTime: '', allowMultiple: false, lastDisabledAt: '2026-05-30T01:42:00Z', createdAt: '2026-05-28T01:42:00Z', updatedAt: '2026-05-30T01:42:00Z' },
    { id: 10, name: 'Loyalty Points Import', status: 'Enabled', endDate: '', endTime: '', allowMultiple: true, lastDisabledAt: null, createdAt: '2026-04-27T05:25:00Z', updatedAt: '2026-05-29T07:01:00Z' },
    { id: 11, name: 'Churn Score Export', status: 'Draft', endDate: '', endTime: '', allowMultiple: false, lastDisabledAt: null, createdAt: '2026-04-02T10:12:00Z', updatedAt: '2026-04-02T10:12:00Z' },
    { id: 12, name: 'Quarterly Data Cleanup', status: 'Disabled', endDate: '', endTime: '', allowMultiple: false, lastDisabledAt: '2026-03-04T00:00:00Z', createdAt: '2026-01-29T16:30:00Z', updatedAt: '2026-03-04T00:00:00Z' },
  ])

  // Run history per journey (empty entry = never ran).
  const instances = ref<Record<number, DataJourneyInstance[]>>({
    1: makeRuns(1, 'Salesforce Lead Sync', 4, '2026-08-30T07:24:00Z', true),
    2: makeRuns(2, 'Shopify Order Import', 30, '2026-08-30T02:07:00Z'),
    3: makeRuns(3, 'Data Warehouse Export', 12, '2026-08-11T23:10:00Z'),
    4: makeRuns(4, 'Weekly Sales Report', 8, '2026-08-24T09:00:00Z'),
    5: makeRuns(5, 'Abandoned Cart Feed', 2, '2026-07-14T18:20:00Z'),
    7: makeRuns(7, 'Facebook Audience Sync', 2, '2026-06-08T20:00:00Z'),
    10: makeRuns(10, 'Loyalty Points Import', 5, '2026-05-29T06:45:00Z'),
  })

  const templateIds = ['salesforce-sync', 'shopify-orders', 'warehouse-export']
  const flows = ref<Record<number, FlowNode[]>>(Object.fromEntries(
    dataJourneys.value.map((j, i) => [
      j.id,
      instantiateFrom(dataTemplateById[templateIds[i % templateIds.length]!] ?? dataJourneyTemplates[0]!, `d${j.id}`),
    ]),
  ))

  function getFlow(id: number): FlowNode[] | undefined {
    return flows.value[id]
  }

  function instancesOf(id: number): DataJourneyInstance[] {
    return instances.value[id] ?? []
  }

  function instanceCount(id: number): number {
    return instancesOf(id).length
  }

  function find(id: number): DataJourney | undefined {
    return dataJourneys.value.find(j => j.id === id)
  }

  /** New-journey placeholder flow: an unconfigured trigger, like the marketing "scratch" canvas. */
  function placeholderFlow(id: number): FlowNode[] {
    return [makeNode({
      id: `d${id}-t1`,
      kind: 'dj-api-event',
      title: 'Choose a trigger',
      subtitle: 'Click to configure when this journey runs',
      configured: false,
    })]
  }

  function createDataJourney(payload: DataJourneyPayload): number {
    const id = Math.max(0, ...dataJourneys.value.map(j => j.id)) + 1
    const now = new Date().toISOString()
    dataJourneys.value.unshift({
      id,
      name: payload.name,
      status: payload.enabled ? 'Enabled' : 'Draft',
      endDate: payload.endDate,
      endTime: payload.endTime,
      allowMultiple: payload.allowMultiple,
      lastDisabledAt: null,
      createdAt: now,
      updatedAt: now,
    })
    flows.value[id] = placeholderFlow(id)
    return id
  }

  function updateDataJourney(id: number, payload: DataJourneyPayload) {
    const journey = find(id)
    if (!journey) return
    const now = new Date().toISOString()
    journey.name = payload.name
    journey.endDate = payload.endDate
    journey.endTime = payload.endTime
    journey.allowMultiple = payload.allowMultiple
    if (payload.enabled && journey.status !== 'Enabled') {
      journey.status = 'Enabled'
    } else if (!payload.enabled && journey.status === 'Enabled') {
      journey.status = 'Disabled'
      journey.lastDisabledAt = now
    }
    journey.updatedAt = now
    const run = instances.value[id]?.[0]
    if (run) run.name = payload.name
  }

  function setDataJourneyStatus(id: number, status: DataJourneyStatus) {
    const journey = find(id)
    if (!journey) return
    if (journey.status === 'Enabled' && status !== 'Enabled') {
      journey.lastDisabledAt = new Date().toISOString()
    }
    journey.status = status
    journey.updatedAt = new Date().toISOString()
  }

  /** List toggle: on = Enabled, off = Disabled (a Draft switched on becomes Enabled). */
  function toggleDataJourney(id: number) {
    const journey = find(id)
    if (!journey) return
    setDataJourneyStatus(id, journey.status === 'Enabled' ? 'Disabled' : 'Enabled')
  }

  function duplicateDataJourney(id: number): number | undefined {
    const source = find(id)
    if (!source) return undefined
    const newId = Math.max(0, ...dataJourneys.value.map(j => j.id)) + 1
    const now = new Date().toISOString()
    dataJourneys.value.unshift({
      ...source,
      id: newId,
      name: `${source.name} copy`,
      status: 'Draft',
      lastDisabledAt: null,
      createdAt: now,
      updatedAt: now,
    })
    const sourceFlow = flows.value[id]
    flows.value[newId] = sourceFlow ? (JSON.parse(JSON.stringify(sourceFlow)) as FlowNode[]) : placeholderFlow(newId)
    return newId
  }

  function removeDataJourney(id: number) {
    dataJourneys.value = dataJourneys.value.filter(j => j.id !== id)
    delete flows.value[id]
    delete instances.value[id]
  }

  function removeMany(ids: number[]) {
    ids.forEach(removeDataJourney)
  }

  return {
    dataJourneys,
    flows,
    instances,
    getFlow,
    instancesOf,
    instanceCount,
    createDataJourney,
    updateDataJourney,
    setDataJourneyStatus,
    toggleDataJourney,
    duplicateDataJourney,
    removeDataJourney,
    removeMany,
  }
})
