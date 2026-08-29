<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'Segments', params: { accountId: accountId.value } }))

/**
 * GAP: MpOptionCard is a *selection* control — it sets role="button" and
 * aria-pressed, which would announce these navigation tiles as unpressed
 * toggles. These are links, so they compose v-card with `to` instead, which
 * renders a real anchor and is keyboard operable natively. See GAPS.md.
 *
 * The source's tiles are focusable but NOT operable by keyboard (Enter does
 * nothing), and their titles are dead `<a href="#">` links.
 */
const builders = computed(() => [
  {
    id: 'next-gen',
    title: 'Next-Gen segment builder',
    // The source describes mechanism ("using Contact Attributes, with Standard
    // Fields e.g. First Name, Email or Custom Fields") and gives no steer on
    // which builder to pick. Rewritten — see IMPROVEMENTS.md.
    description: 'Build rules from contact attributes, purchases, list membership, site visits and campaign activity.',
    icon: 'sparkles',
    badge: 'New',
    recommended: true,
    to: { name: 'CreateSegmentNextGen', params: { accountId: accountId.value } },
  },
  {
    id: 'legacy',
    title: 'Legacy segment builder',
    description: 'The original builder, with multiple sets of rules. Use it to match how your existing segments were built.',
    icon: 'layers',
    badge: null,
    recommended: false,
    to: { name: 'Segments', params: { accountId: accountId.value }, query: { create: 'legacy' } },
  },
])
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <MpPageHeader
      title="Create a segment"
      subtitle="Choose how you want to build it."
      :back-to="backTo"
    />

    <div class="sbc-grid">
      <v-card
        v-for="b in builders"
        :key="b.id"
        flat
        border
        rounded="lg"
        :to="b.to"
        class="sbc-tile pa-6 d-flex flex-column ga-3"
      >
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal" size="34" rounded="lg" class="flex-shrink-0">
            <v-icon size="18">{{ b.icon }}</v-icon>
          </v-avatar>
          <!-- Real headings, so the two choices appear in a screen reader's
               heading list. The source renders both titles as dead links. -->
          <h2 class="text-body-1 font-weight-bold mb-0">{{ b.title }}</h2>
          <!-- The source renders "New!" as an image, so the status never
               reaches assistive tech. A chip carries it as text. -->
          <v-chip v-if="b.badge" size="small" color="primary" variant="tonal" class="ml-auto">
            {{ b.badge }}
          </v-chip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-0">{{ b.description }}</p>
        <p v-if="b.recommended" class="text-caption font-weight-medium text-primary mb-0">
          Recommended for new segments
        </p>
      </v-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* The source floats two ~250px tiles in a ~1300px column. These fill the
   measure and stack below the compact breakpoint. */
.sbc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-space-20);
  max-width: var(--mp-layout-contentMaxWidth);
}

.sbc-tile {
  height: 100%;
  transition: border-color 0.15s ease;
}

.sbc-tile:hover,
.sbc-tile:focus-visible {
  border-color: rgb(var(--v-theme-primary));
}

@media (max-width: $mp-layout-breakpointCompact) {
  .sbc-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
