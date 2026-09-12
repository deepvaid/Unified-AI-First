<script setup lang="ts">
import MpMenuItem from '@/components/MpMenuItem.vue'

/**
 * TrialLabHeader — the lab's own top bar for a brand-new trial user.
 *
 * Renders only what the prototype store supplies, so the real demo identity
 * (AppBar's hard-coded user and account list) can never appear inside a
 * flow that is supposed to start from nothing. Fallback labels are supplied
 * by the caller — this component never derives a name from an email.
 */
export interface TrialHeaderWorkspace {
  id: string
  /** Display label — already resolved to the "Trial workspace" fallback when unnamed. */
  label: string
  /** The stable ID, present only while the workspace is unnamed. */
  caption?: string
}

withDefaults(defineProps<{
  workspaces: TrialHeaderWorkspace[]
  activeId: string
  /** "Preview · Trial not started" or "Trial · N days left". */
  trialLabel: string
  /** Paints the trial chip in the brand colour once the clock is running. */
  trialStarted: boolean
  /** Signed-in address; the only identity shown until the user supplies a name. */
  email: string
  /** User-supplied name, or null (never inferred). */
  personName: string | null
  reviewerOpen: boolean
}>(), {
  personName: null,
})

const emit = defineEmits<{
  switch: [id: string]
  renameWorkspace: []
  addName: []
  toggleReviewer: []
}>()
</script>

<template>
  <header class="tl-header" role="banner">
    <div class="tl-header__start">
      <span class="tl-header__wordmark">MAROPOST</span>

      <v-menu location="bottom start">
        <template #activator="{ props: activator }">
          <v-btn
            v-bind="activator"
            variant="text"
            class="text-none tl-header__switcher"
            append-icon="chevron-down"
            aria-haspopup="menu"
          >
            <span class="tl-header__ws">
              <span class="tl-header__ws-label">{{ workspaces.find(w => w.id === activeId)?.label }}</span>
              <span v-if="workspaces.find(w => w.id === activeId)?.caption" class="tl-header__ws-caption">
                {{ workspaces.find(w => w.id === activeId)?.caption }}
              </span>
            </span>
          </v-btn>
        </template>
        <v-list role="menu" density="compact" aria-label="Workspaces">
          <MpMenuItem
            v-for="ws in workspaces"
            :key="ws.id"
            :title="ws.label"
            :subtitle="ws.caption"
            :active="ws.id === activeId"
            @click="emit('switch', ws.id)"
          >
            <template #prepend>
              <v-avatar size="24" color="primary" variant="tonal" rounded="lg">
                <v-icon size="14">building-2</v-icon>
              </v-avatar>
            </template>
            <template v-if="ws.id === activeId" #append>
              <v-icon size="16" color="primary">check</v-icon>
            </template>
          </MpMenuItem>
          <v-divider class="my-1" />
          <MpMenuItem title="Rename workspace" icon="pencil" @click="emit('renameWorkspace')" />
        </v-list>
      </v-menu>
    </div>

    <div class="tl-header__end">
      <v-chip
        size="small"
        variant="tonal"
        :color="trialStarted ? 'primary' : undefined"
        :prepend-icon="trialStarted ? 'timer' : 'eye'"
        class="tl-header__trial"
      >
        {{ trialLabel }}
      </v-chip>

      <v-btn
        :icon="'flask-conical'"
        variant="text"
        size="small"
        :aria-pressed="reviewerOpen"
        aria-label="Toggle reviewer controls"
        :class="{ 'tl-header__lab--on': reviewerOpen }"
        @click="emit('toggleReviewer')"
      />

      <v-menu location="bottom end">
        <template #activator="{ props: activator }">
          <v-btn v-bind="activator" icon variant="text" size="small" aria-label="Account menu" aria-haspopup="menu">
            <v-avatar size="30" class="tl-header__avatar">
              <v-icon size="16">user</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-card flat border rounded="lg" class="tl-header__profile" min-width="260">
          <div class="tl-header__profile-head">
            <div class="tl-header__profile-name">{{ personName ?? email }}</div>
            <div v-if="personName" class="tl-header__profile-email">{{ email }}</div>
          </div>
          <v-divider />
          <v-list role="menu" density="compact" aria-label="Account">
            <MpMenuItem :title="personName ? 'Edit your name' : 'Add your name'" icon="user-pen" @click="emit('addName')" />
            <MpMenuItem title="Sign out" icon="log-out" disabled />
          </v-list>
        </v-card>
      </v-menu>
    </div>
  </header>
</template>

<style scoped>
.tl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-space-16);
  height: var(--mp-layout-appbarHeight);
  padding: 0 var(--mp-space-20);
  background: var(--surface-primary);
  color: var(--on-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.tl-header__start,
.tl-header__end {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  min-width: 0;
}

.tl-header__wordmark {
  font-weight: 800;
  font-size: var(--mp-fontSize-16);
  letter-spacing: 0.01em;
  color: var(--text-primary);
  margin-inline-end: var(--mp-space-8);
}

.tl-header__switcher {
  height: var(--mp-component-control-height);
}

.tl-header__ws {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  text-align: start;
}

.tl-header__ws-label {
  font-weight: 600;
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
}

.tl-header__ws-caption {
  font-size: var(--mp-fontSize-11);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.tl-header__trial {
  font-variant-numeric: tabular-nums;
}

.tl-header__lab--on {
  color: rgb(var(--v-theme-primary));
}

.tl-header__avatar {
  background: var(--surface-secondary);
  color: var(--on-surface-muted);
}

.tl-header__profile-head {
  padding: var(--mp-component-card-paddingCompact) var(--mp-space-16);
}

.tl-header__profile-name {
  font-weight: 600;
  font-size: var(--mp-fontSize-14);
  color: var(--text-primary);
  word-break: break-all;
}

.tl-header__profile-email {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
  word-break: break-all;
}

@media (max-width: 640px) {
  .tl-header__wordmark { display: none; }
  .tl-header__trial { display: none; }
}
</style>
