<script setup lang="ts">
/**
 * Report-type chooser — step zero of the Custom Report create flow.
 *
 * GAP: the source renders this on a full-bleed branded canvas with per-type line-art
 * illustrations. Neither exists in the design system, so this uses the standard page
 * shell with Lucide icons — see docs/rebuild/GAPS.md §3 and §4.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import { REPORT_TYPES, type ReportTypeSlug } from './customReportCatalog'

const route = useRoute()
const router = useRouter()

const accountId = computed(() => route.params.accountId as string)
const backTo = computed(() => ({ name: 'CustomReports', params: { accountId: accountId.value } }))

const selected = ref<ReportTypeSlug | null>(null)

function choose(slug: ReportTypeSlug) {
  selected.value = slug
}

function continueToWizard() {
  if (!selected.value) return
  router.push({
    name: 'CreateCustomReportWizard',
    params: { accountId: accountId.value, type: selected.value },
  })
}
</script>

<template>
  <div class="d-flex flex-column ga-5">
    <MpPageHeader
      title="New custom report"
      subtitle="Choose the type of report you want to create. Each type collects a different set of details."
      :back-to="backTo"
    />

    <v-card flat border rounded="lg" class="pa-6">
      <v-row>
        <v-col v-for="t in REPORT_TYPES" :key="t.slug" cols="12" sm="6" lg="4">
          <MpOptionCard
            :selected="selected === t.slug"
            :title="t.title"
            :icon="t.icon"
            class="h-100"
            @click="choose(t.slug)"
            @dblclick="choose(t.slug); continueToWizard()"
          >
            <p class="text-body-2 text-medium-emphasis mb-0">{{ t.description }}</p>
            <div class="d-flex ga-2 mt-3">
              <v-chip size="x-small" variant="tonal" color="primary">
                {{ t.steps.length }} steps
              </v-chip>
            </div>
          </MpOptionCard>
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <div class="d-flex justify-space-between align-center">
        <v-btn variant="text" class="text-none" :to="backTo">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none"
          append-icon="arrow-right"
          :disabled="!selected"
          @click="continueToWizard"
        >
          Continue
        </v-btn>
      </div>
    </v-card>
  </div>
</template>
