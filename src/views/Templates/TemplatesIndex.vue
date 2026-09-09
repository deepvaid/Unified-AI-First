<script setup lang="ts">
import { computed, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpAlert from '@/components/MpAlert.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import { TEMPLATE_SPECS } from './templateSpecs'
import { useAccountsStore } from '@/stores/useAccounts'

// The gallery index: every archetype, and which product pages follow each one.

const accounts = useAccountsStore()

const specs = TEMPLATE_SPECS

const search = ref('')
const usageHeaders = [
  { title: 'Product page', key: 'path' },
  { title: 'Template', key: 'template' },
  { title: 'Note', key: 'note' },
]

const usageRows = computed(() =>
  specs.flatMap((spec) =>
    spec.usedBy.map((entry) => ({
      path: entry.path,
      template: spec.title,
      routeName: spec.routeName,
      note: entry.note ?? '',
    })),
  ),
)

const totalFollowing = computed(() =>
  specs.reduce((sum, spec) => sum + (spec.usedByCount ?? spec.usedBy.length), 0),
)
</script>

<template>
  <!-- No h-100 here: the index is a page that grows and lets <main> scroll, not
       a full-height table page that pins one card to the viewport. -->
  <div class="d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Design system"
      title="Page templates"
      subtitle="Seven page archetypes, built only from the Mp* components, with placeholder data"
    >
      <template #actions>
        <v-btn
          variant="outlined"
          prepend-icon="palette"
          class="text-none"
          :to="{ name: 'DesignSystemDemo', params: { accountId: accounts.activeId } }"
        >
          Design System
        </v-btn>
      </template>
    </MpPageHeader>

    <MpAlert tone="info" title="Reference, not a product surface">
      Every label here is structural on purpose — "Record name 01", "Column A", "Status" — so nothing
      reads as real data. Open a template and turn on the spec panel in the left rail to see what it is
      made of, which file to copy, and which token owns each gap.
    </MpAlert>

    <section>
      <div class="tpl-gallery">
        <MpOptionCard
          v-for="spec in specs"
          :key="spec.slug"
          :to="{ name: spec.routeName }"
          :icon="spec.icon"
          :title="spec.title"
          :description="spec.summary"
          :heading-level="2"
        />
      </div>
    </section>

    <v-card variant="flat" border rounded="lg" class="overflow-hidden">
      <MpDataTableToolbar
        v-model:search="search"
        title="Where each archetype is used"
        search-placeholder="Search product pages"
        :total-count="usageRows.length"
      >
        <template #title>
          <p class="text-medium-emphasis text-body-2 mb-0">
            A sample of the {{ totalFollowing }} product views that follow one of these templates.
          </p>
        </template>
      </MpDataTableToolbar>
      <v-data-table
        :headers="usageHeaders"
        :items="usageRows"
        :search="search"
        density="comfortable"
        :items-per-page="10"
        hover
      >
        <template #item.path="{ item }">
          <code class="tpl-path">{{ item.path }}</code>
        </template>
        <template #item.template="{ item }">
          <router-link :to="{ name: item.routeName }" class="tpl-link">{{ item.template }}</router-link>
        </template>
        <template #item.note="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ item.note || '—' }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.tpl-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--mp-component-card-gridMin), 1fr));
  gap: var(--mp-space-20);
}

.tpl-path {
  font-size: var(--mp-fontSize-12);
}

.tpl-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-decoration: none;
}

.tpl-link:hover {
  text-decoration: underline;
}
</style>
