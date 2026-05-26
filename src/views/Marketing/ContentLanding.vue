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
const commerceBase = computed(() => `/commerce/${accountId.value}`)

const primaryActions = computed<PrimaryAction[]>(() => [
  { label: 'New email content', icon: 'plus', to: `${base.value}/contents` },
])

const quickActions = computed<QuickAction[]>(() => [
  { icon: 'file-text', label: 'New email template', description: 'Start a reusable email block', to: `${base.value}/contents` },
  { icon: 'image', label: 'Upload images', description: 'Add to your image library', to: `${base.value}/images` },
  { icon: 'layers', label: 'New dynamic rule', description: 'Personalize content blocks', to: `${base.value}/dynamic_contents` },
  { icon: 'rss', label: 'Connect a feed', description: 'Stream data into emails', to: `${base.value}/content_feeds` },
])

const childPages = computed<ChildPage[]>(() => [
  {
    icon: 'file-text',
    title: 'Email Content',
    description: 'Reusable email templates and modular blocks for fast composition.',
    to: `${base.value}/contents`,
    count: 47,
  },
  {
    icon: 'layers',
    title: 'Dynamic Content',
    description: 'Conditional content blocks that personalize by audience attributes.',
    to: `${base.value}/dynamic_contents`,
    count: 12,
  },
  {
    icon: 'image',
    title: 'Image Library',
    description: 'Centralized media for emails, landing pages, and campaigns.',
    to: `${base.value}/images`,
    count: 234,
  },
  {
    icon: 'panel-bottom',
    title: 'Footer Management',
    description: 'Standardize footers across brands with unsubscribe and compliance.',
    to: `${base.value}/footers`,
    count: 8,
  },
  {
    icon: 'sparkles',
    title: 'Optimise on Open',
    description: 'Real-time images that personalize when the email is opened.',
    to: `${base.value}/image_groups`,
    count: 5,
  },
  {
    icon: 'rss',
    title: 'Content Feeds',
    description: 'RSS, JSON, and product feeds streamed into your email content.',
    to: `${base.value}/content_feeds`,
    count: 3,
  },
  {
    icon: 'shopping-bag',
    title: 'Product Recommendations',
    description: 'AI-driven product picks shown inside email and on-site placements.',
    to: `${commerceBase.value}/product_recommendations`,
    count: 18,
  },
  {
    icon: 'ticket-percent',
    title: 'Coupon Banks',
    description: 'Pools of unique coupon codes assigned per recipient at send time.',
    to: `${base.value}/coupon_banks`,
    count: 6,
  },
])

const recentActivity = computed<ActivityItem[]>(() => [
  { icon: 'file-text', tag: 'email', eyebrow: '8m ago', title: 'Spring Refresh template edited by Sarah Connor', meta: '12 blocks' },
  { icon: 'image', tag: 'audience', eyebrow: '32m ago', title: '12 new product images uploaded to library', meta: '+12 assets' },
  { icon: 'layers', tag: 'automation', eyebrow: '1h ago', title: 'Dynamic rule "VIP banner" updated — applied to 4 templates', meta: '4 templates' },
  { icon: 'panel-bottom', tag: 'email', eyebrow: '2h ago', title: 'Welcome footer marked as default for all brands', meta: 'Default' },
  { icon: 'ticket-percent', tag: 'order', eyebrow: '3h ago', title: 'Coupon bank "July Promo" generated 500 unique codes', meta: '500 codes' },
])

const setupCard = computed<SetupCardConfig>(() => ({
  title: 'Content setup',
  description: 'Finish these so every campaign has a polished, on-brand foundation.',
  items: [
    { label: 'Upload your brand logo', complete: true },
    { label: 'Configure a default footer', complete: true, to: `${base.value}/footers` },
    { label: 'Create your first email template', complete: false, to: `${base.value}/contents` },
    { label: 'Add at least 10 product images', complete: false, to: `${base.value}/images` },
  ],
  ctaLabel: 'Open content guide',
  ctaTo: `${base.value}/contents`,
}))

const daVinciCard = computed<DaVinciCardConfig>(() => ({
  title: 'Da Vinci AI · Content',
  description: 'AI-assisted creation and personalization across every content surface.',
  suggestions: [
    { label: 'Generate subject line variants', to: `${base.value}/da-vinci/dashboard` },
    { label: 'Suggest dynamic content rules for VIPs', to: `${base.value}/da-vinci/dashboard` },
    { label: 'Auto-write product descriptions', to: `${base.value}/da-vinci/dashboard` },
  ],
}))
</script>

<template>
  <ModuleLandingPage
    title="Content"
    description="Reusable email templates, dynamic blocks, images, footers, and feeds — manage every piece of marketing content in one place."
    :primary-actions="primaryActions"
    :quick-actions="quickActions"
    :child-pages="childPages"
    :recent-activity="recentActivity"
    :setup-card="setupCard"
    :da-vinci-card="daVinciCard"
  />
</template>
