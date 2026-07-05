import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlowNode } from '@/stores/journeyFlowData'
import { dataJourneyTemplates, dataTemplateById, instantiateFrom } from '@/stores/journeyFlowData'

export type DataJourneyStatus = 'Active' | 'Paused' | 'Draft'

export interface DataJourney {
  id: number
  name: string
  status: DataJourneyStatus
  instances: number
  created: string
  updated: string
}

export const useDataJourneysStore = defineStore('dataJourneys', () => {
  const dataJourneys = ref<DataJourney[]>([
    { id: 1, name: 'Salesforce Lead Sync', status: 'Active', instances: 1240, created: '2025-11-02', updated: '2026-07-01' },
    { id: 2, name: 'Shopify Order Import', status: 'Active', instances: 8210, created: '2025-08-19', updated: '2026-07-04' },
    { id: 3, name: 'Data Warehouse Export', status: 'Paused', instances: 96, created: '2026-01-12', updated: '2026-05-28' },
  ])

  const flows = ref<Record<number, FlowNode[]>>({
    1: instantiateFrom(dataTemplateById['salesforce-sync']!, 'd1'),
    2: instantiateFrom(dataTemplateById['shopify-orders']!, 'd2'),
    3: instantiateFrom(dataTemplateById['warehouse-export']!, 'd3'),
  })

  function getFlow(id: number): FlowNode[] | undefined {
    return flows.value[id]
  }

  /** Creates a data journey from a template (optionally overriding the schedule). */
  function createDataJourney(payload: { name: string; templateId: string; frequency?: string }): number {
    const id = Math.max(0, ...dataJourneys.value.map(j => j.id)) + 1
    const template = dataTemplateById[payload.templateId] ?? dataJourneyTemplates[0]!
    const flow = instantiateFrom(template, `d${id}`)
    if (payload.frequency) {
      const trigger = flow.find(n => n.kind === 'dj-recurring')
      if (trigger) {
        trigger.config = { ...trigger.config, frequency: payload.frequency }
        trigger.subtitle = payload.frequency
      }
    }
    const today = new Date().toISOString().slice(0, 10)
    dataJourneys.value.unshift({ id, name: payload.name, status: 'Draft', instances: 0, created: today, updated: today })
    flows.value[id] = flow
    return id
  }

  function setDataJourneyStatus(id: number, status: DataJourneyStatus) {
    const journey = dataJourneys.value.find(j => j.id === id)
    if (journey) journey.status = status
  }

  function removeDataJourney(id: number) {
    dataJourneys.value = dataJourneys.value.filter(j => j.id !== id)
    delete flows.value[id]
  }

  return { dataJourneys, flows, getFlow, createDataJourney, setDataJourneyStatus, removeDataJourney }
})
