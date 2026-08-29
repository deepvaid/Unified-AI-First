<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ModuleLandingPage from '@/components/ModuleLandingPage.vue'
import type {
  PrimaryAction,
  QuickAction,
  ChildPage,
  ActivityItem,
  SetupCardConfig,
  DaVinciCardConfig,
} from '@/components/ModuleLandingPage.vue'
import { useCampaignsStore } from '@/stores/useCampaigns'
import { useFormsStore } from '@/stores/useForms'
import { useLandingPagesStore } from '@/stores/useLandingPages'
import { useContentStore } from '@/stores/useContent'
import { useDataJourneysStore } from '@/stores/useDataJourneys'

const route = useRoute()
const accountId = computed(() => (route.params.accountId as string) ?? '1')

const base = computed(() => `/accounts/${accountId.value}`)

const campaignsStore = useCampaignsStore()
const formsStore = useFormsStore()
const landingPagesStore = useLandingPagesStore()
const contentStore = useContentStore()
const dataJourneysStore = useDataJourneysStore()

const primaryActions = computed<PrimaryAction[]>(() => [
  { label: 'New Campaign', icon: 'plus', to: `${base.value}/campaigns/new` },
])

const quickActions = computed<QuickAction[]>(() => [
  { icon: 'send', label: 'New Campaign', description: 'Send an email to a list', to: `${base.value}/campaigns/new`, color: 'blue' },
  { icon: 'route', label: 'Build a journey', description: 'Multi-step automation', to: `${base.value}/journeys`, color: 'violet' },
  { icon: 'clipboard-list', label: 'New Form', description: 'Capture new contacts', to: `${base.value}/acquisition`, color: 'green' },
  { icon: 'file-text', label: 'Browse Email Content', description: 'Reusable email templates', to: `${base.value}/contents`, color: 'cyan' },
])

const childPages = computed<ChildPage[]>(() => [
  {
    icon: 'megaphone',
    title: 'Campaigns',
    description: 'Email blasts, transactional sends, and campaign tags.',
    to: `${base.value}/campaigns`,
    count: campaignsStore.campaigns.length,
    color: 'blue',
  },
  {
    icon: 'route',
    title: 'Journeys',
    description: 'Multi-step automated customer journeys with branching logic: cart abandon, win-back, post-purchase, and more.',
    to: `${base.value}/journeys`,
    count: campaignsStore.journeys.length,
    color: 'violet',
  },
  {
    icon: 'file-text',
    title: 'Templates',
    description: 'Reusable email content and dynamic blocks for fast composition.',
    to: `${base.value}/contents`,
    count: contentStore.items.length,
    color: 'cyan',
  },
  {
    icon: 'database',
    title: 'Data Journeys',
    description: 'Sync data with Salesforce, Shopify, and your data warehouse on a schedule.',
    to: `${base.value}/data_journeys`,
    count: dataJourneysStore.dataJourneys.length,
    color: 'amber',
  },
  {
    icon: 'clipboard-list',
    title: 'Forms',
    description: 'Popup and embedded forms, landing pages, and surveys to grow your audience.',
    to: `${base.value}/acquisition`,
    count: formsStore.forms.length,
    color: 'green',
  },
  {
    icon: 'bar-chart-3',
    title: 'Reports',
    description: 'Email performance, deliverability, and engagement analytics.',
    to: `${base.value}/reports`,
    count: campaignsStore.campaigns.filter(c => c.status === 'Sent').length,
    color: 'rose',
  },
])

function fmtShortDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Parses the mixed date formats seeded across stores ("2026-03-07", "Mar 5, 2026", "Just now") into a sortable timestamp. */
function looseDateValue(s: string): number {
  if (s === 'Just now') return Date.now()
  const t = Date.parse(s)
  return Number.isNaN(t) ? 0 : t
}

/** Stores mix ISO timestamps with already-formatted strings; render either readably. */
function formatLooseDate(s: string): string {
  const t = Date.parse(s)
  if (Number.isNaN(t)) return s
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const recentActivity = computed<ActivityItem[]>(() => {
  const entries: (ActivityItem & { sortKey: number })[] = []

  const sentCampaigns = [...campaignsStore.campaigns]
    .filter(c => c.status === 'Sent' && c.sentDate)
    .sort((a, b) => looseDateValue(b.sentDate!) - looseDateValue(a.sentDate!))
    .slice(0, 2)
  for (const c of sentCampaigns) {
    const openRate = c.metrics.sent ? Math.floor((c.metrics.opens / c.metrics.sent) * 100) : 0
    entries.push({
      icon: 'mail', tag: 'email',
      eyebrow: fmtShortDate(c.sentDate!),
      title: `${c.name} sent to ${c.listName}`,
      meta: `${openRate}% open`,
      to: `${base.value}/campaigns/${c.id}/report`,
      sortKey: looseDateValue(c.sentDate!),
    })
  }

  const recentJourneys = [...campaignsStore.journeys]
    .filter(j => j.status === 'Active')
    .sort((a, b) => looseDateValue(b.created) - looseDateValue(a.created))
    .slice(0, 2)
  for (const j of recentJourneys) {
    entries.push({
      icon: 'route', tag: 'automation',
      eyebrow: fmtShortDate(j.created),
      title: `${j.name} · ${j.enrolled.toLocaleString()} enrolled`,
      meta: `${j.completed.toLocaleString()} completed`,
      to: `${base.value}/journeys/${j.id}/builder`,
      sortKey: looseDateValue(j.created),
    })
  }

  const recentForm = [...formsStore.forms].sort((a, b) => looseDateValue(b.createdAt) - looseDateValue(a.createdAt))[0]
  if (recentForm) {
    entries.push({
      icon: 'clipboard-list', tag: 'audience',
      eyebrow: formatLooseDate(recentForm.createdAt),
      title: `${recentForm.name} — ${recentForm.status.toLowerCase()}`,
      meta: `${recentForm.type} form`,
      to: `${base.value}/acquisition/forms`,
      sortKey: looseDateValue(recentForm.createdAt),
    })
  }

  const recentPage = [...landingPagesStore.pages].sort((a, b) => looseDateValue(b.createdAt) - looseDateValue(a.createdAt))[0]
  if (recentPage) {
    entries.push({
      icon: 'clipboard-list', tag: 'audience',
      eyebrow: recentPage.updatedAt,
      title: `${recentPage.name} — ${recentPage.publishStatus}`,
      meta: recentPage.status,
      to: `${base.value}/landing_pages`,
      sortKey: looseDateValue(recentPage.createdAt),
    })
  }

  return entries.sort((a, b) => b.sortKey - a.sortKey).slice(0, 5)
})

const setupCard = computed<SetupCardConfig>(() => ({
  title: 'Marketing setup',
  description: 'Finish these to send your first campaign with confidence.',
  items: [
    { label: 'Verify sending domain (DKIM, SPF)', complete: true },
    { label: 'Connect a contact list', complete: true },
    { label: 'Send a test campaign', complete: false, to: `${base.value}/campaigns/new` },
    { label: 'Set up a welcome journey', complete: false, to: `${base.value}/journeys` },
  ],
  ctaLabel: 'New Campaign',
  ctaTo: `${base.value}/campaigns/new`,
}))

const daVinciCard = computed<DaVinciCardConfig>(() => ({
  title: 'Da Vinci AI · Marketing',
  headline: 'Let Da Vinci draft your next move',
  description: 'Smart suggestions tuned to your audience and recent campaigns — send times, subject lines, and engagement risk.',
  ctaLabel: 'Open Da Vinci',
  ctaTo: `${base.value}/da-vinci/dashboard`,
  suggestions: [
    { label: 'Find best send time for VIP segment', to: `${base.value}/da-vinci/dashboard` },
    { label: 'Generate subject line variants', to: `${base.value}/da-vinci/dashboard` },
    { label: 'Score audience engagement risk', to: `${base.value}/da-vinci/dashboard` },
  ],
}))
</script>

<template>
  <ModuleLandingPage
    eyebrow="Marketing"
    title="Marketing"
    description="Campaigns, journeys, and the people they reach."
    :primary-actions="primaryActions"
    :quick-actions="quickActions"
    :child-pages="childPages"
    :recent-activity="recentActivity"
    :setup-card="setupCard"
    :da-vinci-card="daVinciCard"
    ink-da-vinci-card
  />
</template>
