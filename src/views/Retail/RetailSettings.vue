<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpComingSoonTiles, { type ComingSoonTile } from '@/components/MpComingSoonTiles.vue'

const groups: ComingSoonTile[] = [
  { icon: 'cloud-off',   title: 'Offline mode',   desc: 'Per-store offline limits, sync cadence, and post-sync reconciliation defaults.' },
  { icon: 'shield',      title: 'Security',       desc: 'Inactivity lock window, PIN policy, manager-override approvals.' },
  { icon: 'tag',         title: 'Tax & rounding', desc: 'Per-region tax tables, rounding rules, surcharging (Phase 2).' },
  { icon: 'flag',        title: 'Market settings',desc: 'Enable Retail per country (US / CA / AU / NZ).' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Retail Settings"
      subtitle="Platform-level configuration for your Retail — payments, receipts, offline behavior, security."
    />

    <MpComingSoonTiles
      icon="settings"
      title="Retail settings coming soon"
      description="The MVP exposes the following configuration surfaces. Tap a tile to preview the planned controls — interactive setup will land in Phase 1."
      :tiles="groups"
    />
  </div>
</template>
