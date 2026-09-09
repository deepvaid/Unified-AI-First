<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MpSectionRail from '@/components/MpSectionRail.vue'
import TemplateSpecPanel from './TemplateSpecPanel.vue'
import { specForRoute } from './templateSpecs'
import { templatesRailGroups } from './templatesMenu'
import { useElementSize } from '@/composables/useElementSize'
import { useAccountsStore } from '@/stores/useAccounts'
import {
  mp_layout_sectionRailWidth,
  mp_layout_specPanelWidth,
  mp_layout_specPanelYieldWidth,
} from '@/design-tokens/generated/tokens'

// Shell of the page-archetype gallery. Same three moves as SettingsLayout — the
// route's railShell meta collapses the global AppSidebar, MpSectionRail becomes
// the visible navigation, and <main> is the single scroller — plus a spec aside
// and a fill mode for the two children that host a standalone wizard/builder.

const route = useRoute()
const accounts = useAccountsStore()

const groups = computed(() => templatesRailGroups())
const spec = computed(() => specForRoute(route.name))
/** Wizard and builder children host a shell that measures its own height. */
const fill = computed(() => route.meta.templateFill === true)

const SPEC_KEY = 'mp-templates-spec'
const specOpen = ref(readSpecPref())

function readSpecPref(): boolean {
  try {
    return localStorage.getItem(SPEC_KEY) !== 'closed'
  } catch {
    return true
  }
}

watch(specOpen, (open) => {
  try {
    localStorage.setItem(SPEC_KEY, open ? 'open' : 'closed')
  } catch {
    /* private browsing — the toggle still works for this session */
  }
})

const backTo = computed(() => ({
  name: 'DesignSystemDemo',
  params: { accountId: accounts.activeId },
}))

/* The aside yields rather than squeeze the specimen. A builder is two fixed
   asides plus a canvas, and a detail page is a fixed sidebar plus a body; below
   the yield width the template stops representing what it is supposed to teach,
   and a docs column is the thing that can wait. The three widths are tokens, so
   this reads them from the generated constants rather than restating pixels. */
const px = (token: string) => Number.parseInt(token, 10)
const shell = ref<HTMLElement | null>(null)
const { size } = useElementSize(shell)

const roomForSpec = computed(() => {
  if (size.value.width === 0) return true
  const templateRoom = size.value.width - px(mp_layout_sectionRailWidth) - px(mp_layout_specPanelWidth)
  return templateRoom >= px(mp_layout_specPanelYieldWidth)
})

const specVisible = computed(() => specOpen.value && !!spec.value && roomForSpec.value)
const specYielded = computed(() => specOpen.value && !!spec.value && !roomForSpec.value)
</script>

<template>
  <div ref="shell" class="templates-shell mp-frame-fill d-flex">
    <MpSectionRail
      ariaLabel="Templates navigation"
      title="Templates"
      :back-to="backTo"
      back-label="Design System"
      :groups="groups"
    >
      <template #footer>
        <!-- Rail chrome, not a form: hide-details is deliberate here, no validation exists. -->
        <v-switch
          v-model="specOpen"
          label="Spec panel"
          color="primary"
          density="compact"
          hide-details
        />
        <p v-if="specYielded" class="templates-shell__yield mb-0">
          Hidden while the window is this narrow — the template needs the room.
        </p>
      </template>
    </MpSectionRail>

    <main
      class="templates-shell__content"
      :class="{ 'templates-shell__content--fill': fill }"
    >
      <router-view />
    </main>

    <TemplateSpecPanel
      v-if="specVisible && spec"
      :spec="spec"
      class="templates-shell__spec"
      @close="specOpen = false"
    />
  </div>
</template>

<style scoped lang="scss">
/* .mp-frame-fill owns the bleed-to-edge margins and the frame height; these rules
   only add the column geometry — same division of labour as SettingsLayout. */
.templates-shell {
  align-items: stretch;
}

.templates-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--mp-space-24) var(--mp-layout-shellInsetInline) var(--mp-layout-shellInsetBlock) var(--mp-layout-shellInsetBlock);
}

/* A standalone MpWizardShell / MpBuilderShell is height:100% and scrolls its own
   body, so the column must be a definite-height flex parent with no padding. */
.templates-shell__content--fill {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.templates-shell__content--fill > * {
  flex: 1 1 auto;
  min-height: 0;
}

.templates-shell__yield {
  margin-top: var(--mp-space-4);
  color: var(--text-secondary);
  font-size: var(--mp-fontSize-11);
  line-height: 1.4;
}

.templates-shell__spec {
  flex: 0 0 var(--mp-layout-specPanelWidth);
  min-height: 0;
  overflow-y: auto;
  border-inline-start: 1px solid var(--border-subtle);
}

@media (max-width: 1024px) {
  .templates-shell__content {
    padding: var(--mp-space-20) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium) var(--mp-layout-shellInsetMedium);
  }
}

/* Desktop reference surface: below the split the rail stacks and the spec aside
   steps aside entirely rather than squeezing the template it describes. */
@media (max-width: 960px) {
  .templates-shell {
    flex-direction: column;
    height: auto;
    overflow: visible;
  }

  .templates-shell__content {
    overflow: visible;
  }

  .templates-shell__yield {
  margin-top: var(--mp-space-4);
  color: var(--text-secondary);
  font-size: var(--mp-fontSize-11);
  line-height: 1.4;
}

.templates-shell__spec {
    display: none;
  }
}

@media (max-width: 640px) {
  .templates-shell__content {
    padding: var(--mp-space-16) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact) var(--mp-layout-shellInsetCompact);
  }
}
</style>
