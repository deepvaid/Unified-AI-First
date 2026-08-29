import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Meta (Facebook) Lead Ads → CDP sync rules.
 *
 * The source calls each record a "Lead Ad", but it is not an advertisement: it is a connection
 * between one Meta instant form and one or more Maropost contact lists. Nothing here creates,
 * budgets or publishes an ad.
 */

export type LeadAdStatus = 'Active' | 'Inactive'

/** A Facebook Page the account has already connected through the Meta app. */
export interface FacebookPage {
  id: string
  name: string
  /** Page id shown as a suffix in the source's list cell, e.g. `Maropost Integrations (74)`. */
  pageNumber: number
  connected: boolean
  profileUrl: string
}

/** An instant form defined on the Meta side of a connected Page. */
export interface FacebookLeadForm {
  id: string
  pageId: string
  name: string
  /** Meta's own creation timestamp — the only way to tell same-named forms apart. */
  createdAt: string
}

export interface LeadAd {
  id: number
  name: string
  pageId: string
  leadFormId: string
  contactListIds: string[]
  status: LeadAdStatus
  createdAt: string
  updatedAt: string
}

/** Contact lists available as sync destinations, with their current contact counts. */
export interface LeadContactList {
  id: string
  name: string
  count: number
}

export const FACEBOOK_PAGES: FacebookPage[] = [
  {
    id: 'pg-maropost',
    name: 'Maropost Integrations',
    pageNumber: 74,
    connected: true,
    profileUrl: 'https://www.facebook.com/maropost-integrations',
  },
  {
    id: 'pg-storefront',
    name: 'Northwind Storefront',
    pageNumber: 118,
    connected: true,
    profileUrl: 'https://www.facebook.com/northwind-storefront',
  },
]

export const FACEBOOK_LEAD_FORMS: FacebookLeadForm[] = [
  { id: 'lf-launch', pageId: 'pg-maropost', name: 'Product launch waitlist', createdAt: '2026-03-31T14:16:00Z' },
  { id: 'lf-verify', pageId: 'pg-maropost', name: 'Sandbox verification form', createdAt: '2026-03-25T13:38:00Z' },
  { id: 'lf-demo', pageId: 'pg-maropost', name: 'Book a demo', createdAt: '2026-03-10T09:04:00Z' },
  { id: 'lf-newsletter', pageId: 'pg-maropost', name: 'Newsletter sign-up', createdAt: '2025-09-29T12:58:00Z' },
  { id: 'lf-untitled', pageId: 'pg-maropost', name: 'Untitled form', createdAt: '2025-10-08T13:38:00Z' },
  { id: 'lf-catalogue', pageId: 'pg-storefront', name: 'Request the catalogue', createdAt: '2026-05-02T10:20:00Z' },
  { id: 'lf-trade', pageId: 'pg-storefront', name: 'Trade account enquiry', createdAt: '2026-01-18T16:45:00Z' },
]

export const LEAD_CONTACT_LISTS: LeadContactList[] = [
  { id: 'cl-newsletter', name: 'Newsletter Subscribers', count: 48213 },
  { id: 'cl-vip', name: 'VIP Customer Circle', count: 5120 },
  { id: 'cl-master', name: 'Master Subscriber List', count: 92044 },
  { id: 'cl-promo', name: 'Promotional List', count: 21876 },
  { id: 'cl-waitlist', name: 'Product Launch Waitlist', count: 1342 },
  { id: 'cl-demo', name: 'Demo Requests', count: 418 },
  { id: 'cl-trade', name: 'Trade Accounts', count: 96 },
  { id: 'cl-webinar', name: 'Webinar Attendees', count: 2765 },
  { id: 'cl-winback', name: 'Win-back Audience', count: 8890 },
  { id: 'cl-catalogue', name: 'Catalogue Requests', count: 634 },
]

let seq = 60

export const useSocialLeadsStore = defineStore('socialLeads', () => {
  const leadAds = ref<LeadAd[]>([
    {
      id: 53,
      name: 'Demo requests → sales follow-up',
      pageId: 'pg-maropost',
      leadFormId: 'lf-demo',
      contactListIds: ['cl-demo'],
      status: 'Active',
      createdAt: '2026-07-03T03:25:00Z',
      updatedAt: '2026-07-03T03:27:00Z',
    },
    {
      id: 54,
      name: 'Launch waitlist → VIP circle',
      pageId: 'pg-maropost',
      leadFormId: 'lf-launch',
      contactListIds: ['cl-waitlist', 'cl-vip'],
      status: 'Active',
      createdAt: '2026-04-02T11:12:00Z',
      updatedAt: '2026-06-19T08:41:00Z',
    },
    {
      id: 55,
      name: 'Catalogue requests → fulfilment',
      pageId: 'pg-storefront',
      leadFormId: 'lf-catalogue',
      contactListIds: ['cl-catalogue'],
      status: 'Inactive',
      createdAt: '2026-05-04T14:02:00Z',
      updatedAt: '2026-05-04T14:02:00Z',
    },
    {
      id: 56,
      name: 'Trade enquiries → wholesale team',
      pageId: 'pg-storefront',
      leadFormId: 'lf-trade',
      contactListIds: ['cl-trade', 'cl-master'],
      status: 'Inactive',
      createdAt: '2026-01-20T09:30:00Z',
      updatedAt: '2026-02-11T15:18:00Z',
    },
  ])

  function getLeadAd(id: number): LeadAd | undefined {
    return leadAds.value.find(l => l.id === id)
  }

  function pageById(id: string): FacebookPage | undefined {
    return FACEBOOK_PAGES.find(p => p.id === id)
  }

  function leadFormById(id: string): FacebookLeadForm | undefined {
    return FACEBOOK_LEAD_FORMS.find(f => f.id === id)
  }

  function leadFormsForPage(pageId: string | null): FacebookLeadForm[] {
    return pageId ? FACEBOOK_LEAD_FORMS.filter(f => f.pageId === pageId) : []
  }

  function contactListsById(ids: string[]): LeadContactList[] {
    return LEAD_CONTACT_LISTS.filter(l => ids.includes(l.id))
  }

  /** Meta is connected when at least one Page reports a live connection. */
  const metaConnected = computed(() => FACEBOOK_PAGES.some(p => p.connected))

  function createLeadAd(input: Omit<LeadAd, 'id' | 'createdAt' | 'updatedAt' | 'status'>): LeadAd {
    const now = new Date().toISOString()
    const record: LeadAd = { ...input, id: (seq += 1), status: 'Inactive', createdAt: now, updatedAt: now }
    leadAds.value.unshift(record)
    return record
  }

  function updateLeadAd(id: number, patch: Partial<Omit<LeadAd, 'id' | 'createdAt'>>) {
    const record = getLeadAd(id)
    if (!record) return
    Object.assign(record, patch, { updatedAt: new Date().toISOString() })
  }

  function setStatus(id: number, status: LeadAdStatus) {
    updateLeadAd(id, { status })
  }

  function remove(ids: number[]) {
    leadAds.value = leadAds.value.filter(l => !ids.includes(l.id))
  }

  return {
    leadAds,
    metaConnected,
    getLeadAd,
    pageById,
    leadFormById,
    leadFormsForPage,
    contactListsById,
    createLeadAd,
    updateLeadAd,
    setStatus,
    remove,
  }
})
