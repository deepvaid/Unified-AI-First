<script setup lang="ts">
import { computed } from 'vue'
import ModuleLandingPage, {
  type ActivityItem,
  type ChildPage,
  type DaVinciCardConfig,
  type PrimaryAction,
  type QuickAction,
  type SetupCardConfig,
} from '@/components/ModuleLandingPage.vue'

// MODULE LANDING TEMPLATE — the front door of a module.
// ModuleLandingPage is fully prop-driven: a consumer supplies data, never layout.
// Copied from src/views/Marketing/MarketingLanding.vue.

const primaryActions = computed<PrimaryAction[]>(() => [
  { label: 'Primary action', icon: 'plus', to: '/templates/wizard' },
  { label: 'Secondary action', icon: 'upload', to: '/templates/form-drawer' },
])

const quickActions = computed<QuickAction[]>(() => [
  { icon: 'table', label: 'Quick action A', description: 'Supporting line', to: '/templates/list', color: 'blue' },
  { icon: 'panel-right', label: 'Quick action B', description: 'Supporting line', to: '/templates/form-drawer', color: 'violet' },
  { icon: 'list-checks', label: 'Quick action C', description: 'Supporting line', to: '/templates/wizard', color: 'green' },
  { icon: 'layout-panel-left', label: 'Quick action D', description: 'Supporting line', to: '/templates/builder', color: 'cyan' },
])

const childPages = computed<ChildPage[]>(() => [
  { icon: 'table', title: 'Child page A', description: 'What this section holds, in one line.', to: '/templates/list', count: 24, color: 'blue' },
  { icon: 'file-text', title: 'Child page B', description: 'What this section holds, in one line.', to: '/templates/detail', count: 12, color: 'violet' },
  { icon: 'panel-right', title: 'Child page C', description: 'What this section holds, in one line.', to: '/templates/form-drawer', count: 8, color: 'green' },
  { icon: 'list-checks', title: 'Child page D', description: 'What this section holds, in one line.', to: '/templates/wizard', count: 3, color: 'amber' },
  { icon: 'layout-panel-left', title: 'Child page E', description: 'What this section holds, in one line.', to: '/templates/builder', color: 'cyan' },
  { icon: 'circle-dashed', title: 'Child page F', description: 'Not built yet — the card says so.', to: '/templates/states', status: 'Coming soon', color: 'indigo' },
])

const recentActivity = computed<ActivityItem[]>(() => [
  { icon: 'file-text', eyebrow: 'Date value 01', title: 'Activity description one', meta: 'Owner A', to: '/templates/detail' },
  { icon: 'send', eyebrow: 'Date value 02', title: 'Activity description two', meta: 'Owner B', to: '/templates/detail' },
  { icon: 'users', eyebrow: 'Date value 03', title: 'Activity description three', meta: 'Owner A', to: '/templates/detail' },
  { icon: 'zap', eyebrow: 'Date value 04', title: 'Activity description four', meta: 'Owner C', to: '/templates/detail' },
])

const setupCard = computed<SetupCardConfig>(() => ({
  title: 'Finish setup',
  description: 'Three steps stand between this module and its first result.',
  items: [
    { label: 'Setup step A', complete: true },
    { label: 'Setup step B', complete: true },
    { label: 'Setup step C', complete: false, to: '/templates/wizard' },
  ],
  ctaLabel: 'Continue setup',
  ctaTo: '/templates/wizard',
}))

const daVinciCard = computed<DaVinciCardConfig>(() => ({
  title: 'Da Vinci',
  headline: 'Ask for the next move',
  description: 'The assistant card is part of the landing template, not a bolt-on.',
  suggestions: [
    { label: 'Suggestion one', to: '/templates/list' },
    { label: 'Suggestion two', to: '/templates/detail' },
    { label: 'Suggestion three', to: '/templates/wizard' },
  ],
  ctaLabel: 'Open Da Vinci',
  ctaTo: '/templates/list',
}))
</script>

<template>
  <ModuleLandingPage
    eyebrow="Module"
    title="Module name"
    description="One sentence describing what this module holds and who it is for."
    :primary-actions="primaryActions"
    :quick-actions="quickActions"
    :child-pages="childPages"
    :recent-activity="recentActivity"
    :setup-card="setupCard"
    :da-vinci-card="daVinciCard"
    ink-da-vinci-card
  />
</template>
