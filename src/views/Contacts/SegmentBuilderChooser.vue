<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'

const route = useRoute()
const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'Segments', params: { accountId: accountId.value } }))

/**
 * Navigation chooser: the tiles compose MpOptionCard's navigation mode
 * (`to`, no `selected`) — real anchors, keyboard operable natively, h2
 * landmark titles. GAPS.md §8 (closed in the wizard pass) records why the
 * selection mode was wrong here; the source's tiles are focusable but NOT
 * operable by keyboard, and their titles are dead `<a href="#">` links.
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
      emphasis="prominent"
      :back-to="backTo"
    />

    <div class="sbc-grid">
      <!-- Real h2 headings via heading-level, so the two choices appear in a
           screen reader's heading list; the source's "New!" is an image that
           never reaches assistive tech — the chip carries it as text. -->
      <MpOptionCard
        v-for="b in builders"
        :key="b.id"
        :to="b.to"
        :title="b.title"
        :description="b.description"
        :icon="b.icon"
        :heading-level="2"
        class="h-100"
      >
        <template v-if="b.badge" #title-append>
          <v-chip size="small" color="primary" variant="tonal" class="ml-auto">{{ b.badge }}</v-chip>
        </template>
        <p v-if="b.recommended" class="text-caption font-weight-medium text-primary mb-0 mt-2">
          Recommended for new segments
        </p>
      </MpOptionCard>
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

@media (max-width: $mp-layout-breakpointCompact) {
  .sbc-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
