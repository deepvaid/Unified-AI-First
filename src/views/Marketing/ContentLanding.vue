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
import { useContentStore } from '@/stores/useContent'
import { useImagesStore } from '@/stores/useImages'
import { useMarketingAssetsStore } from '@/stores/useMarketingAssets'
import { useProductExtrasStore } from '@/stores/useProductExtras'

const route = useRoute()
const accountId = computed(() => (route.params.accountId as string) ?? '1')

const base = computed(() => `/accounts/${accountId.value}`)
const commerceBase = computed(() => `/commerce/${accountId.value}`)

const contentStore = useContentStore()
const imagesStore = useImagesStore()
const assetsStore = useMarketingAssetsStore()
const productExtrasStore = useProductExtrasStore()

const primaryActions = computed<PrimaryAction[]>(() => [
  { label: 'New Email Content', icon: 'plus', to: `${base.value}/contents` },
])

const quickActions = computed<QuickAction[]>(() => [
  { icon: 'file-text', label: 'New Email Template', description: 'Start a reusable email block', to: `${base.value}/contents`, color: 'blue' },
  { icon: 'image', label: 'Upload images', description: 'Add to your image library', to: `${base.value}/images`, color: 'cyan' },
  { icon: 'layers', label: 'New Dynamic Rule', description: 'Personalize content blocks', to: `${base.value}/dynamic_contents`, color: 'violet' },
  { icon: 'rss', label: 'Connect a feed', description: 'Stream data into emails', to: `${base.value}/content_feeds`, color: 'green' },
])

const childPages = computed<ChildPage[]>(() => [
  {
    icon: 'file-text',
    title: 'Email Content',
    description: 'Reusable email templates and modular blocks for fast composition.',
    to: `${base.value}/contents`,
    count: contentStore.items.length,
    color: 'blue',
  },
  {
    icon: 'layers',
    title: 'Dynamic Content',
    description: 'Conditional content blocks that personalize by audience attributes.',
    to: `${base.value}/dynamic_contents`,
    count: assetsStore.dynamicContents.length,
    color: 'violet',
  },
  {
    icon: 'image',
    title: 'Image Library',
    description: 'Centralized media for emails, landing pages, and campaigns.',
    to: `${base.value}/images`,
    count: imagesStore.items.length,
    color: 'cyan',
  },
  {
    icon: 'panel-bottom',
    title: 'Footer Management',
    description: 'Standardize footers across brands with unsubscribe and compliance.',
    to: `${base.value}/footers`,
    count: assetsStore.footers.length,
    color: 'amber',
  },
  {
    icon: 'sparkles',
    title: 'Optimise on Open',
    description: 'Real-time images that personalize when the email is opened.',
    to: `${base.value}/image_groups`,
    count: assetsStore.imageGroups.length,
    color: 'rose',
  },
  {
    icon: 'rss',
    title: 'Content Feeds',
    description: 'RSS, JSON, and product feeds streamed into your email content.',
    to: `${base.value}/content_feeds`,
    count: assetsStore.feeds.length,
    color: 'green',
  },
  {
    icon: 'shopping-bag',
    title: 'Product Recommendations',
    description: 'AI-driven product picks shown inside email and on-site placements.',
    to: `${commerceBase.value}/product_recommendations`,
    count: productExtrasStore.recommendations.length,
    color: 'indigo',
  },
  {
    icon: 'ticket-percent',
    title: 'Coupon Banks',
    description: 'Pools of unique coupon codes assigned per recipient at send time.',
    to: `${base.value}/coupon_banks`,
    count: assetsStore.coupons.length,
    color: 'teal',
  },
  {
    icon: 'sliders-horizontal',
    title: 'Preference Management',
    description: 'Subscription, unsubscribe, and profile pages your contacts see.',
    to: `${base.value}/preference_pages`,
    count: assetsStore.preferencePages.length,
    color: 'blue',
  },
])

/** Parses the mixed date formats seeded across stores ("2026-03-07", "Yesterday", "Just now") into a sortable timestamp. */
function looseDateValue(s: string): number {
  if (s === 'Just now') return Date.now()
  if (s === 'Yesterday') return Date.now() - 86400000
  const t = Date.parse(s)
  return Number.isNaN(t) ? 0 : t
}

/** Formats an ISO date ("2026-03-07") to a short display date; passes through relative strings unchanged. */
function fmtEyebrow(s: string) {
  const t = Date.parse(s)
  if (Number.isNaN(t) || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const recentActivity = computed<ActivityItem[]>(() => {
  const entries: (ActivityItem & { sortKey: number })[] = []

  // ContentItem.lastUpdated is a relative-time string ("2 hours ago", "Last week") rather
  // than a parseable date — the seed data is already ordered newest-first, so trust that.
  const recentContent = contentStore.items[0]
  if (recentContent) {
    entries.push({
      icon: 'file-text', tag: 'email',
      eyebrow: recentContent.lastUpdated,
      title: `${recentContent.name} updated`,
      meta: recentContent.type,
      to: `${base.value}/contents/editor/${recentContent.id}`,
      sortKey: Date.now(),
    })
  }

  const recentImage = [...imagesStore.items].sort((a, b) => looseDateValue(b.date) - looseDateValue(a.date))[0]
  if (recentImage) {
    entries.push({
      icon: 'image', tag: 'audience',
      eyebrow: fmtEyebrow(recentImage.date),
      title: `${recentImage.name} uploaded to the image library`,
      meta: recentImage.size,
      to: `${base.value}/images`,
      sortKey: looseDateValue(recentImage.date),
    })
  }

  const recentRule = [...assetsStore.dynamicContents].sort((a, b) => looseDateValue(b.updatedAt) - looseDateValue(a.updatedAt))[0]
  if (recentRule) {
    entries.push({
      icon: 'layers', tag: 'automation',
      eyebrow: fmtEyebrow(recentRule.updatedAt),
      title: `Dynamic rule "${recentRule.name}" updated`,
      meta: `${recentRule.rules.length} rule${recentRule.rules.length === 1 ? '' : 's'}`,
      to: `${base.value}/dynamic_contents`,
      sortKey: looseDateValue(recentRule.updatedAt),
    })
  }

  const defaultFooter = assetsStore.footers.find(f => f.isDefault) ?? assetsStore.footers[0]
  if (defaultFooter) {
    entries.push({
      icon: 'panel-bottom', tag: 'email',
      eyebrow: fmtEyebrow(defaultFooter.updatedAt),
      title: `${defaultFooter.name}${defaultFooter.isDefault ? ' marked as default' : ''}`,
      meta: defaultFooter.isDefault ? 'Default' : undefined,
      to: `${base.value}/footers`,
      sortKey: looseDateValue(defaultFooter.updatedAt),
    })
  }

  const recentCoupon = [...assetsStore.coupons].sort((a, b) => looseDateValue(b.updatedAt) - looseDateValue(a.updatedAt))[0]
  if (recentCoupon) {
    entries.push({
      icon: 'ticket-percent', tag: 'order',
      eyebrow: fmtEyebrow(recentCoupon.updatedAt),
      title: `Coupon bank "${recentCoupon.name}" — ${recentCoupon.unused.toLocaleString()} unused codes`,
      meta: `${recentCoupon.redeemed.toLocaleString()} redeemed`,
      to: `${base.value}/coupon_banks`,
      sortKey: looseDateValue(recentCoupon.updatedAt),
    })
  }

  return entries.sort((a, b) => b.sortKey - a.sortKey).slice(0, 5)
})

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
