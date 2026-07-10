import { ref } from 'vue'
import { defineStore } from 'pinia'

// Storefront campaigns (store editor ▸ Campaigns — "Campaign Settings").
// Legacy parity notes (sandbox crawl 2026-07-10, docs/uat-parity/parity-tracker.md A06b):
// list columns Campaign Name / Targets / Status / From / To / Updated At; create is a
// small modal: Name*, Targets dropdown, Start Date+Time, End Date+Time. Status is
// derived from the schedule window. Target options weren't enumerable in the crawl —
// modeled as storefront collections (coherent with useStoreNavigation's catalog).

export interface StoreCampaign {
  id: string
  channelId: string
  name: string
  /** Collection ids from useStoreNavigation's LINK_RESOURCES.collection catalog. */
  targets: string[]
  /** ISO date (yyyy-mm-dd). */
  startDate: string
  /** 24h time (HH:mm). */
  startTime: string
  endDate: string
  endTime: string
  updatedAt: string
}

export type CampaignScheduleStatus = 'Scheduled' | 'Active' | 'Ended'

export function campaignStatus(campaign: StoreCampaign, now = new Date()): CampaignScheduleStatus {
  const start = new Date(`${campaign.startDate}T${campaign.startTime || '00:00'}`)
  const end = new Date(`${campaign.endDate}T${campaign.endTime || '23:59'}`)
  if (now < start) return 'Scheduled'
  if (now > end) return 'Ended'
  return 'Active'
}

let campaignIdCounter = 0

export function createCampaignDraft(channelId: string): StoreCampaign {
  campaignIdCounter += 1
  return {
    id: `camp-${Date.now().toString(36)}-${campaignIdCounter}`,
    channelId,
    name: '',
    targets: [],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    updatedAt: '',
  }
}

function seedCampaigns(): StoreCampaign[] {
  return [
    {
      id: 'camp-summer-sale',
      channelId: 'retest-sales-notification',
      name: 'Summer sale',
      targets: ['col-summer', 'col-sale'],
      startDate: '2026-06-01',
      startTime: '09:00',
      endDate: '2026-08-31',
      endTime: '23:59',
      updatedAt: 'Jun 1, 2026',
    },
    {
      id: 'camp-back-to-school',
      channelId: 'retest-sales-notification',
      name: 'Back to school',
      targets: ['col-accessories'],
      startDate: '2026-08-15',
      startTime: '00:00',
      endDate: '2026-09-15',
      endTime: '23:59',
      updatedAt: 'Jul 3, 2026',
    },
    {
      id: 'camp-spring-launch',
      channelId: 'retest-sales-notification',
      name: 'Spring launch',
      targets: ['col-new-arrivals'],
      startDate: '2026-03-01',
      startTime: '08:00',
      endDate: '2026-04-30',
      endTime: '23:59',
      updatedAt: 'Apr 30, 2026',
    },
  ]
}

export const useStoreCampaignsStore = defineStore('storeCampaigns', () => {
  const campaigns = ref<StoreCampaign[]>(seedCampaigns())

  function campaignsForChannel(channelId: string): StoreCampaign[] {
    return campaigns.value.filter((campaign) => campaign.channelId === channelId)
  }

  /** Upsert by id (create + edit share it); stamps updatedAt. */
  function saveCampaign(draft: StoreCampaign): StoreCampaign {
    const saved: StoreCampaign = {
      ...draft,
      targets: [...draft.targets],
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }
    const index = campaigns.value.findIndex((campaign) => campaign.id === draft.id)
    if (index === -1) campaigns.value.push(saved)
    else campaigns.value[index] = saved
    return saved
  }

  function deleteCampaign(campaignId: string): void {
    campaigns.value = campaigns.value.filter((campaign) => campaign.id !== campaignId)
  }

  return { campaigns, campaignsForChannel, saveCampaign, deleteCampaign }
})
