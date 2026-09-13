<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MpListRow from '@/components/MpListRow.vue'
import MpOptionCard from '@/components/MpOptionCard.vue'
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpSectionHeader from '@/components/MpSectionHeader.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import { useToast } from '@/composables/useToast'
import { formatAgo } from '@/composables/useRelativeTime'
import { GATED_ACTIONS, GATE_REASON, GOALS } from '@/stores/trialLabData'
import { useTrialRun } from './useTrialRun'

/**
 * Home — where every variant converges after the first task. Greeting and
 * workspace label fall back neutrally when no names were supplied; the
 * "Next steps" rows are the live actions that stay gated until verification.
 */
const toast = useToast()
const router = useRouter()
const { store, variant, run, workspace, isVerified, arrive } = useTrialRun()

onMounted(() => arrive('home'))

const greeting = computed(() => store.greeting(variant.value))
const subtitle = computed(() => {
  const label = store.workspaceLabel(workspace.value)
  const caption = store.workspaceCaption(workspace.value)
  return caption ? `${label} · ${caption}` : label
})

const goals = computed(() => GOALS.map(g => ({
  ...g,
  savedAt: run.value?.drafts[g.key].savedAt ?? null,
})))

const upgraded = computed(() => store.isUpgraded(variant.value))

const actions = computed(() => GATED_ACTIONS.map(a => (
  a.key === 'upgrade' && upgraded.value
    ? { ...a, label: 'Manage your plan', description: `You’re on the ${store.planDef(variant.value)?.name ?? 'paid'} plan.`, icon: 'badge-check' }
    : a
)))

function tryAction(key: string, label: string) {
  if (!store.requestGated(variant.value, GATE_REASON)) return
  if (key === 'upgrade') {
    if (upgraded.value) toast.info('Simulated: plan management')
    else {
      store.startUpgrade(variant.value)
      void router.push({ name: 'TrialUpgrade', params: { variant: variant.value } })
    }
    return
  }
  toast.success(`Simulated: ${label}`)
}
</script>

<template>
  <div class="tl-home">
    <MpPageHeader :title="greeting" :subtitle="subtitle" eyebrow="Your workspace">
      <template #actions>
        <v-btn v-if="!store.hasPersonName(variant)" variant="text" class="text-none" prepend-icon="user-pen" @click="store.ui.nameDrawer = 'person'">Add your name</v-btn>
        <v-btn v-if="!store.hasWorkspaceName(variant)" variant="outlined" class="text-none" prepend-icon="pencil" @click="store.ui.nameDrawer = 'workspace'">Name this workspace</v-btn>
      </template>
    </MpPageHeader>

    <section>
      <MpSectionHeader title="Sample tasks" description="Try each Cloud with sample data. Drafts stay in this workspace." />
      <div class="tl-home__grid">
        <MpOptionCard
          v-for="g in goals"
          :key="g.key"
          :title="g.title"
          :description="g.description"
          :icon="g.icon"
          :heading-level="3"
          :to="{ name: 'TrialTask', params: { variant, goal: g.key } }"
        >
          <template #title-append>
            <MpStatusChip :status="g.savedAt ? 'draft' : 'pending'" type="general" size="sm" class="ml-auto" />
          </template>
          <div class="tl-home__saved">{{ g.savedAt ? `Draft saved ${formatAgo(g.savedAt)}` : 'Not started' }}</div>
        </MpOptionCard>
      </div>
    </section>

    <section>
      <MpSectionHeader
        title="Next steps"
        :description="isVerified ? 'Ready when you are — these connect to real data.' : 'These affect real people, so they unlock once your email is verified.'"
      />
      <v-card flat border rounded="lg" class="tl-home__actions">
        <MpListRow
          v-for="a in actions"
          :key="a.key"
          variant="divided"
          :title="a.label"
          :eyebrow="a.description"
          clickable
          @click="tryAction(a.key, a.label)"
        >
          <template #lead>
            <v-avatar size="32" color="primary" variant="tonal" rounded="lg">
              <v-icon size="16">{{ a.icon }}</v-icon>
            </v-avatar>
          </template>
          <template #trailing>
            <v-icon size="16" :class="isVerified ? 'tl-home__go' : 'tl-home__lock'">{{ isVerified ? 'arrow-right' : 'lock' }}</v-icon>
          </template>
        </MpListRow>
      </v-card>
    </section>
  </div>
</template>

<style scoped>
.tl-home {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-32);
  max-width: var(--mp-layout-contentMaxWidth);
  margin: 0 auto;
}

.tl-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--mp-component-card-gridMin), 1fr));
  gap: var(--mp-component-card-gap);
}

.tl-home__saved {
  margin-top: var(--mp-space-8);
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-home__actions {
  padding: 0 var(--mp-component-card-paddingCompact);
}

.tl-home__lock {
  color: var(--text-muted);
}

.tl-home__go {
  color: rgb(var(--v-theme-primary));
}
</style>
