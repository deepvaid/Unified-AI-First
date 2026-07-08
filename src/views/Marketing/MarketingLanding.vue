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

const route = useRoute()
const accountId = computed(() => (route.params.accountId as string) ?? '1')

const base = computed(() => `/accounts/${accountId.value}`)

const primaryActions = computed<PrimaryAction[]>(() => [
  { label: 'New campaign', icon: 'plus', to: `${base.value}/campaigns/new` },
])

const quickActions = computed<QuickAction[]>(() => [
  { icon: 'send', label: 'New campaign', description: 'Send an email to a list', to: `${base.value}/campaigns/new`, color: 'blue' },
  { icon: 'route', label: 'Build a journey', description: 'Multi-step automation', to: `${base.value}/journeys`, color: 'violet' },
  { icon: 'clipboard-list', label: 'Create form', description: 'Capture new contacts', to: `${base.value}/signup_forms`, color: 'green' },
  { icon: 'file-text', label: 'Browse templates', description: 'Reusable email content', to: `${base.value}/contents`, color: 'cyan' },
])

const childPages = computed<ChildPage[]>(() => [
  {
    icon: 'megaphone',
    title: 'Campaigns',
    description: 'Email blasts, transactional sends, and campaign tags.',
    to: `${base.value}/campaigns`,
    count: 24,
    color: 'blue',
  },
  {
    icon: 'route',
    title: 'Journeys',
    description: 'Multi-step automated customer journeys with branching logic.',
    to: `${base.value}/journeys`,
    count: 8,
    color: 'violet',
  },
  {
    icon: 'file-text',
    title: 'Templates',
    description: 'Reusable email content and dynamic blocks for fast composition.',
    to: `${base.value}/contents`,
    count: 47,
    color: 'cyan',
  },
  {
    icon: 'zap',
    title: 'Automations',
    description: 'Triggered flows: cart abandon, win-back, post-purchase, and more.',
    to: `${base.value}/data_journeys`,
    count: 12,
    color: 'amber',
  },
  {
    icon: 'clipboard-list',
    title: 'Forms',
    description: 'Signup forms, landing pages, and surveys to grow your audience.',
    to: `${base.value}/signup_forms`,
    count: 6,
    color: 'green',
  },
  {
    icon: 'bar-chart-3',
    title: 'Reports',
    description: 'Email performance, deliverability, and engagement analytics.',
    to: `${base.value}/reports`,
    count: '13',
    color: 'rose',
  },
])

const recentActivity = computed<ActivityItem[]>(() => [
  { icon: 'mail', tag: 'email', eyebrow: '2m ago', title: 'Spring Refresh sent to Segment A · 12,408 recipients', meta: '58.2% open' },
  { icon: 'route', tag: 'automation', eyebrow: '14m ago', title: 'Cart abandoned · Step 2 enrolled 84 contacts', meta: 'In flow' },
  { icon: 'users', tag: 'audience', eyebrow: '32m ago', title: 'VIP repeat buyers segment refreshed', meta: '+312' },
  { icon: 'mail', tag: 'email', eyebrow: '1h ago', title: 'Loyalty · April delivered to 4,210 contacts', meta: '63.1% open' },
  { icon: 'clipboard-list', tag: 'audience', eyebrow: '3h ago', title: 'Spring giveaway form published — receiving submissions', meta: '47 signups' },
])

const setupCard = computed<SetupCardConfig>(() => ({
  title: 'Marketing setup',
  description: 'Finish these to send your first campaign with confidence.',
  items: [
    { label: 'Verify sending domain (DKIM, SPF)', complete: true },
    { label: 'Connect a contact list', complete: true },
    { label: 'Send a test campaign', complete: false, to: `${base.value}/campaigns/new` },
    { label: 'Set up a welcome journey', complete: false, to: `${base.value}/journeys` },
  ],
  ctaLabel: 'Open setup guide',
  ctaTo: `${base.value}/campaigns`,
}))

const daVinciCard = computed<DaVinciCardConfig>(() => ({
  title: 'Da Vinci AI · Marketing',
  description: 'Smart suggestions tuned to your audience and recent campaigns.',
  suggestions: [
    { label: 'Find best send time for VIP segment', to: `${base.value}/da-vinci/dashboard` },
    { label: 'Generate subject line variants', to: `${base.value}/da-vinci/dashboard` },
    { label: 'Score audience engagement risk', to: `${base.value}/da-vinci/dashboard` },
  ],
}))
</script>

<template>
  <ModuleLandingPage
    title="Marketing"
    description="Plan, send, and automate every customer touch — campaigns, journeys, content, and forms in one place."
    :primary-actions="primaryActions"
    :quick-actions="quickActions"
    :child-pages="childPages"
    :recent-activity="recentActivity"
    :setup-card="setupCard"
    :da-vinci-card="daVinciCard"
  />
</template>
