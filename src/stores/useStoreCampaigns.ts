import { ref } from 'vue'
import { defineStore } from 'pinia'
import { localDateKey } from '@/maropay/model'
import { browserStorage, keepInBrowser } from '@/stores/demoKeep'
import { campaignStatus, findByCode } from '@/storefront/campaigns'
import type { CampaignScheduleStatus, StoreCampaign } from '@/storefront/campaigns'
import { demoSlot } from '@/storefront/demoStorage'
import { VITAHEAL_CHANNEL_ID, vitahealCampaigns } from '@/storefront/vitahealDemo'

// Storefront campaigns (store editor ▸ Campaigns — "Campaign Settings").
// Legacy parity notes (sandbox crawl 2026-07-10, docs/uat-parity/parity-tracker.md A06b):
// list columns Campaign Name / Targets / Status / From / To / Updated At; create is a
// small modal: Name*, Targets dropdown, Start Date+Time, End Date+Time. Status is
// derived from the schedule window. Target options weren't enumerable in the crawl —
// modeled as storefront collections (coherent with useStoreNavigation's catalog).
//
// A campaign can also carry an offer (a message for the store and a discount code):
// the rules, and what the storefront does with them, are in src/storefront/campaigns.ts.
// The Vitaheal (demo) store's campaigns are seeded from its own file and kept in the
// browser with the rest of that store's data.

export { campaignStatus }
export type { CampaignScheduleStatus, StoreCampaign }

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

/** Saved campaigns are only read back when they still look like campaigns. */
function isCampaignList(value: unknown): value is StoreCampaign[] {
  return Array.isArray(value) && value.every((c: Partial<StoreCampaign> | null) =>
    !!c && typeof c.id === 'string' && typeof c.channelId === 'string' && typeof c.name === 'string'
    && Array.isArray(c.targets) && typeof c.startDate === 'string' && typeof c.endDate === 'string')
}

const isDemo = (campaign: StoreCampaign): boolean => campaign.channelId === VITAHEAL_CHANNEL_ID

export const useStoreCampaignsStore = defineStore('storeCampaigns', () => {
  // The demo store's campaigns: saved ones if this browser has any, else the seed.
  // v2: campaign revenue in US dollars (2026-11-26).
  const kept = demoSlot('campaigns', 2, browserStorage(), isCampaignList)
  const seededDemo = (): StoreCampaign[] => vitahealCampaigns(localDateKey(Date.now()))

  const campaigns = ref<StoreCampaign[]>([...(kept.load() ?? seededDemo()), ...seedCampaigns()])
  const setDemo = (list: StoreCampaign[]): void => {
    campaigns.value = [...list, ...campaigns.value.filter((c) => !isDemo(c))]
  }
  const keptDemo = keepInBrowser(kept, () => campaigns.value.filter(isDemo), (fromOtherTab) => setDemo(fromOtherTab ?? seededDemo()))

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

  /** An order was placed with a campaign's code: count it, with what it came to (smallest currency unit). */
  function recordUse(channelId: string, code: string, amount: number): void {
    const campaign = findByCode(campaigns.value, channelId, code)
    if (!campaign) return
    campaign.orders = (campaign.orders ?? 0) + 1
    campaign.revenue = (campaign.revenue ?? 0) + amount
  }

  /** Remembers the Marketing email that announces a campaign. */
  function setEmailCampaign(campaignId: string, emailCampaignId: number): void {
    const campaign = campaigns.value.find((c) => c.id === campaignId)
    if (campaign) campaign.emailCampaignId = emailCampaignId
  }

  /** Puts the demo store's campaigns back as seeded. Called by its restore (useCommerce). */
  function restoreDemo(): void {
    kept.clear()
    setDemo(seededDemo())
    keptDemo.adopt()
  }

  return { campaigns, campaignsForChannel, saveCampaign, deleteCampaign, recordUse, setEmailCampaign, restoreDemo }
})
