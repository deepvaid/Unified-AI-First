<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MpBanner from '@/components/MpBanner.vue'
import MpDialog from '@/components/MpDialog.vue'
import TrialLabHeader from '@/components/triallab/TrialLabHeader.vue'
import TrialNameDrawer from '@/components/triallab/TrialNameDrawer.vue'
import TrialReviewerPanel from '@/components/triallab/TrialReviewerPanel.vue'
import TrialVerifyForm from '@/components/triallab/TrialVerifyForm.vue'
import { useToast } from '@/composables/useToast'
import type { CodeResult } from '@/stores/useTrialLab'
import { useTrialRun } from './useTrialRun'

/**
 * Shell for one variant: the lab header (simulated identity only), the
 * preview notice for unverified C/D users, the main scroller, the reviewer
 * aside, the two name drawers and the verify dialog that gated actions open.
 * Renders on a fullPage route, so nothing from the app chrome is around it.
 */
const route = useRoute()
const toast = useToast()
const { store, variant, run, workspace, isVerified, inPreview, trialLabel, trialStarted } = useTrialRun()

const showHeader = computed(() => !!run.value?.account.signedUpAt)
const fill = computed(() => route.name === 'TrialTask')

const workspaces = computed(() => (run.value?.workspaces ?? []).map(ws => ({
  id: ws.id,
  label: store.workspaceLabel(ws),
  caption: store.workspaceCaption(ws),
})))

// ── Name drawers ───────────────────────────────────────────────────────────
const personOpen = computed({
  get: () => store.ui.nameDrawer === 'person',
  set: (v: boolean) => { store.ui.nameDrawer = v ? 'person' : null },
})
const workspaceOpen = computed({
  get: () => store.ui.nameDrawer === 'workspace',
  set: (v: boolean) => { store.ui.nameDrawer = v ? 'workspace' : null },
})

function savePerson(value: string | null) {
  store.setPersonName(variant.value, value)
  toast.success(value ? 'Name saved' : 'Name removed')
}

function saveWorkspace(value: string | null) {
  if (!workspace.value) return
  store.renameWorkspace(variant.value, workspace.value.id, value)
  toast.success(value ? 'Workspace renamed' : 'Workspace name removed')
}

// ── Verify dialog (gated actions + banner "Enter code") ────────────────────
const verifyOpen = computed({
  get: () => store.ui.verifyDialog !== null,
  set: (v: boolean) => { if (!v) store.ui.verifyDialog = null },
})
const lastResult = ref<CodeResult | null>(null)
const submitting = ref(false)

async function submitCode(code: string) {
  submitting.value = true
  await new Promise(r => setTimeout(r, 400))
  lastResult.value = store.submitCode(variant.value, code)
  submitting.value = false
}

watch(isVerified, (verified, was) => {
  if (verified && !was) {
    lastResult.value = null
    if (store.ui.verifyDialog) {
      store.ui.verifyDialog = null
      toast.success('Email verified — you’re all set')
    }
  }
})

function openInbox() {
  store.ui.reviewerOpen = true
}
</script>

<template>
  <div class="tl-shell" :class="{ 'tl-shell--aside': store.ui.reviewerOpen }">
    <TrialLabHeader
      v-if="showHeader && run"
      class="tl-shell__header"
      :workspaces="workspaces"
      :active-id="run.activeWorkspaceId"
      :trial-label="trialLabel"
      :trial-started="trialStarted"
      :email="run.account.email ?? ''"
      :person-name="run.account.personName"
      :reviewer-open="store.ui.reviewerOpen"
      @switch="store.switchWorkspace(variant, $event)"
      @rename-workspace="store.ui.nameDrawer = 'workspace'"
      @add-name="store.ui.nameDrawer = 'person'"
      @toggle-reviewer="store.ui.reviewerOpen = !store.ui.reviewerOpen"
    />
    <div v-else class="tl-shell__header tl-shell__header--bare">
      <span class="tl-shell__wordmark">MAROPOST</span>
      <v-btn
        icon="flask-conical"
        variant="text"
        size="small"
        :aria-pressed="store.ui.reviewerOpen"
        aria-label="Toggle reviewer controls"
        @click="store.ui.reviewerOpen = !store.ui.reviewerOpen"
      />
    </div>

    <MpBanner
      v-if="inPreview && showHeader"
      class="tl-shell__banner"
      tone="info"
      icon="eye"
    >
      <strong>You’re previewing.</strong> Verify your email to send, import, publish, invite or upgrade — your sample work is kept either way.
      <template #actions>
        <v-btn size="small" variant="text" class="text-none" @click="store.ui.verifyDialog = { reason: 'Enter the code from your email to activate the trial.' }">Enter code</v-btn>
        <v-btn size="small" variant="text" class="text-none" @click="store.resend(variant)">Resend email</v-btn>
      </template>
    </MpBanner>

    <main class="tl-shell__main" :class="{ 'tl-shell__main--fill': fill }">
      <router-view />
    </main>

    <TrialReviewerPanel
      v-if="store.ui.reviewerOpen"
      class="tl-shell__aside"
      :variant="variant"
      @close="store.ui.reviewerOpen = false"
    />

    <TrialNameDrawer v-model="personOpen" kind="person" :initial="run?.account.personName ?? null" @save="savePerson" />
    <TrialNameDrawer v-model="workspaceOpen" kind="workspace" :initial="workspace?.name ?? null" @save="saveWorkspace" />

    <MpDialog v-model="verifyOpen" size="sm" title="Verify your email to continue" icon="shield-check">
      <p class="tl-shell__reason">{{ store.ui.verifyDialog?.reason }}</p>
      <TrialVerifyForm
        v-if="run"
        :email="run.account.email ?? ''"
        :challenge-state="store.challengeState(variant)"
        :last-result="lastResult"
        :sent-at="run.challenge?.sentAt ?? null"
        :now="store.tick"
        :submitting="submitting"
        @submit="submitCode"
        @resend="store.resend(variant)"
        @change-email="store.changeEmail(variant, $event)"
        @open-inbox="openInbox"
      />
    </MpDialog>
  </div>
</template>

<style scoped lang="scss">
.tl-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-areas:
    'header'
    'banner'
    'main';
  min-height: 100dvh;
  height: 100dvh;
  background: var(--surface-canvas);
  color: var(--on-surface);
}

.tl-shell--aside {
  grid-template-columns: minmax(0, 1fr) var(--mp-layout-specPanelWidth);
  grid-template-areas:
    'header header'
    'banner banner'
    'main   aside';
}

.tl-shell__header { grid-area: header; }
.tl-shell__banner { grid-area: banner; }
.tl-shell__aside { grid-area: aside; min-height: 0; overflow-y: auto; }

.tl-shell__header--bare {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--mp-layout-appbarHeight);
  padding: 0 var(--mp-space-20);
}

.tl-shell__wordmark {
  font-weight: 800;
  font-size: var(--mp-fontSize-16);
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

.tl-shell__main {
  grid-area: main;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetInline);
}

/* The task screen hosts a standalone MpWizardShell that scrolls its own body. */
.tl-shell__main--fill {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.tl-shell__main--fill > * {
  flex: 1 1 auto;
  min-height: 0;
}

.tl-shell__reason {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

@media (max-width: $mp-layout-breakpointSplit) {
  .tl-shell,
  .tl-shell--aside {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'header'
      'banner'
      'main'
      'aside';
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    height: auto;
  }

  .tl-shell__main {
    overflow: visible;
    padding: var(--mp-layout-shellInsetMedium);
  }

  .tl-shell__main--fill {
    padding: 0;
  }
}

@media (max-width: $mp-layout-breakpointCompact) {
  .tl-shell__main {
    padding: var(--mp-layout-shellInsetCompact);
  }

  .tl-shell__main--fill {
    padding: 0;
  }
}
</style>
