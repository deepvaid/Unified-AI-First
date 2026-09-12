<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import MpConfirmDialog from '@/components/MpConfirmDialog.vue'
import MpEmptyState from '@/components/MpEmptyState.vue'
import MpListRow from '@/components/MpListRow.vue'
import { useToast } from '@/composables/useToast'
import { formatAgo } from '@/composables/useRelativeTime'
import { useTrialLabStore } from '@/stores/useTrialLab'
import type { TrialVariant } from '@/stores/trialLabData'

/**
 * TrialReviewerPanel — the aside reviewers use to drive a run. Sunken surface,
 * uppercase eyebrow and a hairline keep it reading as instrumentation, never
 * as customer UI, while every child keeps the standard surface colour pair.
 * Slice 1: variant summary, simulated inbox, reset this run.
 */
const props = defineProps<{ variant: TrialVariant }>()
const emit = defineEmits<{ close: [] }>()

const store = useTrialLabStore()
const router = useRouter()
const toast = useToast()

const config = computed(() => store.config(props.variant))
const run = computed(() => store.run(props.variant))
const inbox = computed(() => store.visibleInbox(props.variant))
const pendingCount = computed(() => (run.value?.inbox.length ?? 0) - inbox.value.length)
const openEmailId = ref<string | null>(null)
const confirmReset = ref(false)

function challengeFor(id: string) {
  const c = run.value?.challenge
  return c && c.id === id ? c : null
}

function isCurrent(challengeId: string) {
  return run.value?.challenge?.id === challengeId
}

function linkFor(token: string) {
  return router.resolve({ name: 'TrialVerifyLink', params: { variant: props.variant, token } })
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    toast.success('Code copied')
  } catch {
    toast.error('Couldn’t copy — select the code instead')
  }
}

function resetRun() {
  store.resetRun(props.variant)
  router.replace({ name: 'TrialSignup', params: { variant: props.variant } })
}
</script>

<template>
  <aside class="tl-reviewer" aria-label="Reviewer controls">
    <div class="tl-reviewer__head">
      <div>
        <span class="tl-reviewer__eyebrow">Reviewer controls</span>
        <div class="tl-reviewer__title">Variant {{ variant.toUpperCase() }} — {{ config.label }}</div>
      </div>
      <v-btn icon="x" variant="text" size="small" aria-label="Close reviewer controls" @click="emit('close')" />
    </div>

    <div class="tl-reviewer__flags">
      <v-chip size="small" variant="outlined" :prepend-icon="config.verifyBeforeEntry ? 'shield-check' : 'eye'">
        {{ config.verifyBeforeEntry ? 'Verify first' : 'Preview first' }}
      </v-chip>
      <v-chip size="small" variant="outlined" :prepend-icon="config.askNamesEarly ? 'user-pen' : 'clock'">
        {{ config.askNamesEarly ? 'Names early' : 'Names later' }}
      </v-chip>
    </div>

    <section class="tl-reviewer__section">
      <div class="tl-reviewer__section-head">
        <span class="tl-reviewer__label">Simulated inbox</span>
        <span v-if="pendingCount > 0" class="tl-reviewer__pending">{{ pendingCount }} on the way…</span>
      </div>

      <MpEmptyState
        v-if="inbox.length === 0"
        icon="inbox"
        title="No emails yet"
        description="Verification emails land here as soon as they are sent."
        class="tl-reviewer__empty"
      />

      <div v-else class="tl-reviewer__inbox">
        <div v-for="mail in inbox" :key="mail.id" class="tl-reviewer__mail" :class="{ 'tl-reviewer__mail--stale': !isCurrent(mail.challengeId) }">
          <MpListRow
            :title="mail.subject"
            :eyebrow="`To ${mail.to}`"
            :meta="formatAgo(mail.sentAt)"
            density="compact"
            clickable
            :aria-expanded="openEmailId === mail.id"
            @click="openEmailId = openEmailId === mail.id ? null : mail.id"
          >
            <template #lead>
              <v-icon size="18">mail</v-icon>
            </template>
          </MpListRow>

          <div v-if="openEmailId === mail.id" class="tl-reviewer__mail-body">
            <p v-if="challengeFor(mail.challengeId)?.usedAt" class="tl-reviewer__mail-copy tl-reviewer__mail-copy--stale">
              Used — this email’s link and code have already verified the address.
            </p>
            <template v-else-if="challengeFor(mail.challengeId)">
              <p class="tl-reviewer__mail-copy">Confirm your email to finish setting up your Maropost trial.</p>
              <div class="tl-reviewer__mail-actions">
                <v-btn color="primary" variant="flat" size="small" class="text-none" :to="linkFor(challengeFor(mail.challengeId)!.token)">
                  Verify email
                </v-btn>
                <v-btn variant="outlined" size="small" class="text-none" :href="linkFor(challengeFor(mail.challengeId)!.token).href" target="_blank" rel="noopener" append-icon="external-link">
                  Open in new tab
                </v-btn>
              </div>
              <div class="tl-reviewer__code-row">
                <span class="tl-reviewer__code-label">Or enter this code</span>
                <code class="tl-reviewer__code">{{ challengeFor(mail.challengeId)!.code }}</code>
                <v-btn icon="copy" variant="text" size="x-small" aria-label="Copy code" @click="copyCode(challengeFor(mail.challengeId)!.code)" />
              </div>
            </template>
            <p v-else class="tl-reviewer__mail-copy tl-reviewer__mail-copy--stale">
              Superseded — a newer verification email replaced this one.
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="tl-reviewer__foot">
      <v-btn variant="text" class="text-none" prepend-icon="layout-grid" :to="{ name: 'TrialLabIndex' }">All variants</v-btn>
      <v-btn variant="outlined" class="text-none" prepend-icon="rotate-ccw" @click="confirmReset = true">Reset this run</v-btn>
    </div>

    <MpConfirmDialog
      v-model="confirmReset"
      title="Reset this run?"
      message="Clears the signup, verification, names and sample drafts for this variant only. Other variants are untouched."
      confirm-label="Reset run"
      danger
      @confirm="resetRun"
    />
  </aside>
</template>

<style scoped>
.tl-reviewer {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-20);
  height: 100%;
  padding: var(--mp-component-card-padding);
  background: var(--surface-sunken);
  color: var(--on-surface);
  border-inline-start: 1px solid var(--border-default);
}

.tl-reviewer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.tl-reviewer__eyebrow,
.tl-reviewer__label {
  display: block;
  font-size: var(--mp-fontSize-11);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.tl-reviewer__title {
  margin-top: var(--mp-space-4);
  font-weight: 600;
  color: var(--text-primary);
}

.tl-reviewer__flags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-6);
}

.tl-reviewer__section {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
}

.tl-reviewer__section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-space-8);
}

.tl-reviewer__pending {
  font-size: var(--mp-fontSize-12);
  color: rgb(var(--v-theme-primary));
}

.tl-reviewer__empty {
  color: var(--text-primary);
}

.tl-reviewer__inbox {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-6);
}

.tl-reviewer__mail {
  border: 1px solid var(--border-subtle);
  border-radius: var(--mp-radius-12);
  background: var(--surface-primary);
  overflow: hidden;
}

.tl-reviewer__mail--stale {
  opacity: 0.7;
}

.tl-reviewer__mail-body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-12);
  padding: var(--mp-space-12);
  border-top: 1px solid var(--border-subtle);
}

.tl-reviewer__mail-copy {
  margin: 0;
  font-size: var(--mp-fontSize-13);
  color: var(--text-primary);
}

.tl-reviewer__mail-copy--stale {
  color: var(--text-secondary);
}

.tl-reviewer__mail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-space-8);
}

.tl-reviewer__code-row {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
}

.tl-reviewer__code-label {
  font-size: var(--mp-fontSize-12);
  color: var(--text-secondary);
}

.tl-reviewer__code {
  font-size: var(--mp-fontSize-18);
  font-weight: 600;
  letter-spacing: 0.12em;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-primary));
}

.tl-reviewer__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--mp-space-8);
  margin-top: auto;
}
</style>
