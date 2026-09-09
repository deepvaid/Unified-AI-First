<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpFilterTabs from '@/components/MpFilterTabs.vue'
import MpDataTableToolbar from '@/components/MpDataTableToolbar.vue'
import MpTableSkeleton from '@/components/MpTableSkeleton.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpErrorState from '@/components/MpErrorState.vue'
import MpComingSoonTiles from '@/components/MpComingSoonTiles.vue'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import { useToast } from '@/composables/useToast'

// SURFACE STATES TEMPLATE — the five things a surface can be showing instead of
// its content, side by side so the differences are obvious.

const toast = useToast()
const state = ref('loading')
const tabs = [
  { label: 'Loading', key: 'loading' },
  { label: 'Empty', key: 'empty' },
  { label: 'Error', key: 'error' },
  { label: 'Coming soon', key: 'coming-soon' },
  { label: 'Confirm', key: 'confirm' },
]

/* A local timer, not useInitialLoad — that composable only fires on mount, and
   this demo needs to replay. */
const loading = ref(true)
let timer: ReturnType<typeof setTimeout> | undefined

function replayLoading() {
  clearTimeout(timer)
  loading.value = true
  timer = setTimeout(() => {
    loading.value = false
  }, 1200)
}
replayLoading()
onBeforeUnmount(() => clearTimeout(timer))

const search = ref('')

const comingSoonTiles = [
  { icon: 'sparkles', title: 'Capability A', desc: 'What it will do once it exists.' },
  { icon: 'workflow', title: 'Capability B', desc: 'What it will do once it exists.' },
  { icon: 'chart-line', title: 'Capability C', desc: 'What it will do once it exists.' },
  { icon: 'shield-check', title: 'Capability D', desc: 'What it will do once it exists.' },
]

const confirmNeutral = ref(false)
const confirmDanger = ref(false)
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      eyebrow="Section · States"
      title="Surface states"
      subtitle="Empty is nothing to show, error is something failed, coming soon is not built yet"
    >
      <template #tabs>
        <MpFilterTabs v-model="state" :tabs="tabs" aria-label="Choose a surface state" />
      </template>
    </MpPageHeader>

    <v-card variant="flat" border rounded="lg" class="flex-grow-1 d-flex flex-column overflow-hidden">
      <!-- Loading: measured against the chrome it stands in for -->
      <template v-if="state === 'loading'">
        <MpDataTableToolbar v-model:search="search" title="Records" search-placeholder="Search records">
          <template #actions>
            <v-btn variant="text" prepend-icon="refresh-cw" class="text-none" @click="replayLoading">Replay</v-btn>
          </template>
        </MpDataTableToolbar>
        <MpTableSkeleton v-if="loading" :rows="6" :columns="5" />
        <div v-else class="tpl-state-body">
          <MpEmptyState
            icon="check"
            title="Loaded"
            description="The skeleton holds the table's shape until the rows arrive."
            action-label="Replay"
            action-icon="refresh-cw"
            @action="replayLoading"
          />
        </div>
      </template>

      <!-- Empty: two variants, because a card and a whole surface are not the same -->
      <div v-else-if="state === 'empty'" class="tpl-state-body tpl-state-split">
        <div class="tpl-state-pane">
          <MpSectionHeader title="stack · inside a card" :heading-level="2" />
          <MpEmptyState
            icon="inbox"
            title="No records yet"
            description="The default block, sized for a card or a table's no-data slot."
            action-label="Create record"
            action-icon="plus"
            @action="toast.info('Create record')"
          />
        </div>
        <v-divider vertical class="tpl-state-divider" />
        <div class="tpl-state-pane">
          <MpSectionHeader title="launcher · prominent" :heading-level="2" />
          <MpEmptyState
            variant="launcher"
            emphasis="prominent"
            illustration="start-here"
            title="Nothing here yet"
            description="The whole-surface block, for a page that has never been used."
            action-label="Get started"
            action-icon="arrow-right"
            @action="toast.info('Get started')"
          />
        </div>
      </div>

      <!-- Error: the only one of the five that announces itself -->
      <div v-else-if="state === 'error'" class="tpl-state-body">
        <MpErrorState @action="toast.info('Retrying…')" />
      </div>

      <!-- Coming soon: the surface does not exist yet, so there is nothing to be empty -->
      <div v-else-if="state === 'coming-soon'" class="tpl-state-body">
        <MpComingSoonTiles
          icon="hard-hat"
          title="Feature area coming soon"
          description="What lands here when the work ships."
          :tiles="comingSoonTiles"
        />
      </div>

      <!-- Confirm: neutral for reversible work, danger for the rest -->
      <div v-else class="tpl-state-body d-flex flex-wrap gap-3 align-start">
        <v-btn variant="outlined" class="text-none" @click="confirmNeutral = true">Neutral confirm</v-btn>
        <v-btn color="error" variant="flat" class="text-none" @click="confirmDanger = true">Destructive confirm</v-btn>
      </div>
    </v-card>

    <MpConfirmDialog
      v-model="confirmNeutral"
      title="Apply this change?"
      message="The change takes effect immediately and can be undone afterwards."
      confirm-label="Apply"
      @confirm="toast.success('Change applied')"
    />

    <MpConfirmDialog
      v-model="confirmDanger"
      title="Delete record?"
      message="Record name 01 will be removed. This cannot be undone."
      confirm-label="Delete"
      :consequences="['Linked items lose their reference', 'Activity history is kept for audit']"
      danger
      @confirm="toast.success('Record removed')"
    />
  </div>
</template>

<style scoped>
.tpl-state-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-component-card-padding);
}

.tpl-state-split {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-component-card-gap);
}

.tpl-state-pane {
  flex: 1 1 var(--mp-component-state-measure);
  min-width: 0;
}

.tpl-state-divider {
  align-self: stretch;
}
</style>
