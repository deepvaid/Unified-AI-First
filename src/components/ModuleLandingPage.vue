<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpListRow from '@/components/MpListRow.vue'

export interface PrimaryAction {
  label: string
  icon?: string
  to?: string
  href?: string
  emphasis?: 'default' | 'prominent'
}

export interface QuickAction {
  icon: string
  label: string
  description?: string
  to: string
  /** Accent hue for the icon tile — blue|violet|rose|green|amber|cyan|indigo|teal. Defaults to the module accent. */
  color?: string
}

export interface ChildPage {
  icon: string
  title: string
  description: string
  to: string
  count?: number | string
  status?: string
  /** Accent hue for the icon tile — blue|violet|rose|green|amber|cyan|indigo|teal. Defaults to the module accent. */
  color?: string
}

export type ActivityTag = 'email' | 'order' | 'audience' | 'automation'

export interface ActivityItem {
  icon: string
  eyebrow: string
  title: string
  meta?: string
  tag?: ActivityTag
  to?: string
}

export interface SetupItem {
  label: string
  complete: boolean
  to?: string
}

export interface SetupCardConfig {
  title: string
  description: string
  items: SetupItem[]
  ctaLabel?: string
  ctaTo?: string
}

export interface DaVinciSuggestion {
  label: string
  to?: string
  href?: string
}

export interface DaVinciCardConfig {
  title: string
  description: string
  suggestions: DaVinciSuggestion[]
  /** Ink-panel headline (used only when the card is rendered as the ink moment). */
  headline?: string
  /** Ink-panel single action label + target. */
  ctaLabel?: string
  ctaTo?: string
}

withDefaults(defineProps<{
  title: string
  description?: string
  /** Muted, tracked kicker above the display headline. */
  eyebrow?: string
  primaryActions?: PrimaryAction[]
  quickActions?: QuickAction[]
  childPages: ChildPage[]
  recentActivity?: ActivityItem[]
  setupCard?: SetupCardConfig | null
  daVinciCard?: DaVinciCardConfig | null
  /** Render the Da Vinci card as the page's single ink-panel branded moment. */
  inkDaVinciCard?: boolean
}>(), {
  inkDaVinciCard: false,
})
</script>

<template>
  <div class="module-landing">
    <MpPageHeader :title="title" :subtitle="description" :eyebrow="eyebrow" emphasis="prominent">
      <template v-if="primaryActions?.length" #actions>
        <v-btn
          v-for="(action, idx) in primaryActions"
          :key="action.label"
          :prepend-icon="action.icon"
          :to="action.to"
          :href="action.href"
          :color="(action.emphasis ?? (idx === 0 ? 'prominent' : 'default')) === 'prominent' ? 'primary' : undefined"
          :variant="(action.emphasis ?? (idx === 0 ? 'prominent' : 'default')) === 'prominent' ? 'flat' : 'outlined'"
          rounded="pill"
          density="comfortable"
        >
          {{ action.label }}
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- Quick actions row -->
    <section v-if="quickActions?.length" class="quick-actions mp-enter-stagger" aria-label="Quick actions">
      <v-card
        v-for="qa in quickActions"
        :key="qa.label"
        :to="qa.to"
        flat
        border
        rounded="lg"
        class="quick-action"
        :class="qa.color ? `tint-${qa.color}` : ''"
      >
        <span class="quick-action__icon">
          <v-icon size="18">{{ qa.icon }}</v-icon>
        </span>
        <span class="quick-action__body">
          <span class="quick-action__label">{{ qa.label }}</span>
          <span v-if="qa.description" class="quick-action__desc">{{ qa.description }}</span>
        </span>
      </v-card>
    </section>

    <!-- Two-column main layout -->
    <v-row class="module-landing__grid mt-2">
      <v-col cols="12" md="8">
        <!-- Child page cards -->
        <div class="section-eyebrow" role="heading" aria-level="2">Sections</div>
        <div class="child-grid mp-enter-stagger">
          <v-card
            v-for="cp in childPages"
            :key="cp.title"
            :to="cp.to"
            flat
            border
            rounded="lg"
            class="child-card"
            :class="cp.color ? `tint-${cp.color}` : ''"
          >
            <div class="child-card__top">
              <span class="child-card__icon">
                <v-icon size="16">{{ cp.icon }}</v-icon>
              </span>
              <span v-if="cp.count !== undefined" class="child-card__count">{{ cp.count }}</span>
              <span v-else-if="cp.status" class="child-card__status">{{ cp.status }}</span>
              <span class="child-card__arrow">
                <v-icon size="14">arrow-right</v-icon>
              </span>
            </div>
            <div class="child-card__title">{{ cp.title }}</div>
            <div class="child-card__desc">{{ cp.description }}</div>
          </v-card>
        </div>

        <!-- Recent activity -->
        <div v-if="recentActivity?.length" class="activity-section mt-6 mp-enter">
          <div class="section-eyebrow" role="heading" aria-level="2">Recent activity</div>
          <v-card flat border rounded="lg" class="activity-card">
            <MpListRow
              v-for="(item, idx) in recentActivity"
              :key="idx"
              :to="item.to"
              variant="divided"
              :eyebrow="item.eyebrow"
              :title="item.title"
              :meta="item.meta"
              class="activity-row"
            >
              <template #lead>
                <span class="activity-row__chip" :class="`activity-row__chip--${item.tag ?? 'email'}`">
                  <v-icon size="14">{{ item.icon }}</v-icon>
                </span>
              </template>
            </MpListRow>
          </v-card>
        </div>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Setup / help card -->
        <v-card v-if="setupCard" flat border rounded="lg" class="side-card setup-card mp-enter">
          <div class="side-card__header">
            <span class="side-card__chip side-card__chip--setup">
              <v-icon size="14">list-checks</v-icon>
            </span>
            <div class="side-card__title">{{ setupCard.title }}</div>
          </div>
          <div class="side-card__desc">{{ setupCard.description }}</div>
          <v-progress-linear
            v-if="setupCard.items.length"
            :model-value="(setupCard.items.filter(i => i.complete).length / setupCard.items.length) * 100"
            color="primary"
            bg-color="surface-variant"
            height="3"
            rounded
            class="mt-3 mb-3"
          />
          <div class="setup-list">
            <MpListRow
              v-for="item in setupCard.items"
              :key="item.label"
              :to="item.to"
              :title="item.label"
              density="compact"
              class="setup-list__item"
              :class="{ 'setup-list__item--done': item.complete }"
            >
              <template #lead>
                <v-icon size="14" class="setup-list__check">
                  {{ item.complete ? 'circle-check' : 'circle' }}
                </v-icon>
              </template>
            </MpListRow>
          </div>
          <v-btn
            v-if="setupCard.ctaLabel"
            :to="setupCard.ctaTo"
            variant="text"
            color="primary"
            density="comfortable"
            class="mt-2"
            append-icon="arrow-right"
          >{{ setupCard.ctaLabel }}</v-btn>
        </v-card>

        <!-- Da Vinci AI — ink-panel branded moment (single message + one action) -->
        <div
          v-if="daVinciCard && inkDaVinciCard"
          class="davinci-ink mp-ink-panel mt-4 mp-enter"
        >
          <span class="davinci-ink__eyebrow mp-meta-label">{{ daVinciCard.title }}</span>
          <h2 class="davinci-ink__headline">{{ daVinciCard.headline ?? daVinciCard.title }}</h2>
          <p class="davinci-ink__desc mp-ink-panel__muted">{{ daVinciCard.description }}</p>
          <v-btn
            v-if="daVinciCard.ctaTo"
            :to="daVinciCard.ctaTo"
            class="ink-cta"
            variant="outlined"
            rounded="pill"
            density="comfortable"
            prepend-icon="sparkles"
            append-icon="arrow-right"
          >{{ daVinciCard.ctaLabel ?? 'Open Da Vinci' }}</v-btn>
        </div>

        <!-- Da Vinci AI card -->
        <v-card v-else-if="daVinciCard" flat border rounded="lg" class="side-card davinci-card mt-4">
          <div class="side-card__header">
            <span class="side-card__chip side-card__chip--davinci">
              <v-icon size="14">sparkles</v-icon>
            </span>
            <div class="side-card__title">{{ daVinciCard.title }}</div>
          </div>
          <div class="side-card__desc">{{ daVinciCard.description }}</div>
          <div class="davinci-list">
            <!-- MpListRow resolves the tag from which target prop is set, so the three
                 link kinds no longer need three hand-written branches here. -->
            <MpListRow
              v-for="s in daVinciCard.suggestions"
              :key="s.label"
              :to="s.to"
              :href="s.to ? undefined : s.href"
              :clickable="!s.to && !s.href"
              :title="s.label"
              variant="boxed"
              density="compact"
              class="davinci-list__item"
            >
              <template #lead>
                <v-icon size="13" class="davinci-list__icon">sparkles</v-icon>
              </template>
              <template #trailing>
                <v-icon size="13" class="davinci-list__arrow">arrow-right</v-icon>
              </template>
            </MpListRow>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.module-landing {
  display: flex;
  flex-direction: column;
}

.section-eyebrow {
  font-size: var(--mp-fontSize-11);
  font-weight: var(--mp-fontWeight-semibold);
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: var(--mp-space-10);
}

/* ===== Per-tile accent tints (icon tile, count pill, hover/focus) =====
   AUD-L02: sourced from the color.{light,dark}.moduleTile.* tokens (tokens.json)
   instead of raw hex — see that group's $description for the tint ledger. */
.tint-blue   { --tile-accent: var(--mp-color-light-moduleTile-blue-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-blue-ink); }
.tint-violet { --tile-accent: var(--mp-color-light-moduleTile-violet-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-violet-ink); }
.tint-rose   { --tile-accent: var(--mp-color-light-moduleTile-rose-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-rose-ink); }
.tint-green  { --tile-accent: var(--mp-color-light-moduleTile-green-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-green-ink); }
.tint-amber  { --tile-accent: var(--mp-color-light-moduleTile-amber-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-amber-ink); }
.tint-cyan   { --tile-accent: var(--mp-color-light-moduleTile-cyan-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-cyan-ink); }
.tint-indigo { --tile-accent: var(--mp-color-light-moduleTile-indigo-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-indigo-ink); }
.tint-teal   { --tile-accent: var(--mp-color-light-moduleTile-teal-accent); --tile-accent-ink: var(--mp-color-light-moduleTile-teal-ink); }

/* Dark surfaces need lightened tints (same hue family) to stay readable. */
.v-theme--maropostDark .tint-blue   { --tile-accent: var(--mp-color-dark-moduleTile-blue-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-blue-ink); }
.v-theme--maropostDark .tint-violet { --tile-accent: var(--mp-color-dark-moduleTile-violet-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-violet-ink); }
.v-theme--maropostDark .tint-rose   { --tile-accent: var(--mp-color-dark-moduleTile-rose-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-rose-ink); }
.v-theme--maropostDark .tint-green  { --tile-accent: var(--mp-color-dark-moduleTile-green-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-green-ink); }
.v-theme--maropostDark .tint-amber  { --tile-accent: var(--mp-color-dark-moduleTile-amber-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-amber-ink); }
.v-theme--maropostDark .tint-cyan   { --tile-accent: var(--mp-color-dark-moduleTile-cyan-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-cyan-ink); }
.v-theme--maropostDark .tint-indigo { --tile-accent: var(--mp-color-dark-moduleTile-indigo-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-indigo-ink); }
.v-theme--maropostDark .tint-teal   { --tile-accent: var(--mp-color-dark-moduleTile-teal-accent); --tile-accent-ink: var(--mp-color-dark-moduleTile-teal-ink); }

/* ===== Quick actions ===== */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--mp-space-10);
  margin-bottom: var(--mp-space-20);
}

/* Border, radius, surface and the link behaviour now come from v-card. What is
   left here is layout and the per-tile tint. */
.quick-action {
  display: flex;
  align-items: center;
  gap: var(--mp-space-10);
  padding: var(--mp-component-card-paddingCompact);
  color: var(--text-primary);
  text-align: left;
}

.quick-action:hover {
  border-color: color-mix(in oklch, var(--text-primary) 32%, var(--border-subtle));
}

.quick-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--tile-accent, var(--accent)) 18%, transparent);
}

.quick-action__icon {
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-secondary);
  color: var(--muted);
  border-radius: var(--mp-component-chip-radius);
  flex-shrink: 0;
}

.quick-action__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quick-action__label {
  font-size: var(--mp-fontSize-13);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  line-height: 1.4;
}

/* P3-2: the old `margin-top: 1px` optical nudge is gone — the label's 1.4
   line-height now does the separating, so the pair aligns at any font size. */
.quick-action__desc {
  font-size: var(--mp-fontSize-12);
  color: var(--muted);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Child page cards ===== */
.child-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--mp-space-12);
}

.child-card {
  display: flex;
  flex-direction: column;
  padding: var(--mp-component-card-padding);
  color: var(--text-primary);
}

.child-card:hover {
  border-color: color-mix(in oklch, var(--text-primary) 32%, var(--border-subtle));
}

.child-card:hover .child-card__arrow {
  opacity: 1;
  transform: translateX(var(--mp-space-2));
}

.child-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--tile-accent, var(--accent)) 18%, transparent);
}

.child-card__top {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-space-10);
}

.child-card__icon {
  width: var(--mp-space-32);
  height: var(--mp-space-32);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-secondary);
  color: var(--muted);
  border-radius: var(--mp-component-chip-radius);
  flex-shrink: 0;
}

.child-card__count {
  margin-left: auto;
  font-size: var(--mp-fontSize-12);
  font-weight: 600;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.child-card__status {
  margin-left: auto;
  font-size: var(--mp-fontSize-10);
  font-weight: var(--mp-fontWeight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.child-card__arrow {
  margin-left: var(--mp-space-4);
  color: var(--muted);
  opacity: 0.5;
  transition:
    opacity var(--mp-motion-duration-fast) var(--mp-motion-easing-standard),
    transform var(--mp-motion-duration-fast) var(--mp-motion-easing-standard);
  display: flex;
  align-items: center;
}

.child-card__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: var(--mp-space-4);
}

.child-card__desc {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  line-height: 1.45;
}

/* ===== Activity feed ===== */
/* Row geometry, hover, focus ring and the between-rows hairline all live in
   MpListRow now — the card only supplies its own inset and the tinted glyph. */
.activity-card {
  padding-inline: var(--mp-component-card-paddingCompact);
}

.activity-row__chip {
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-component-chip-radius);
  flex-shrink: 0;
}

.activity-row__chip--email {
  background: color-mix(in oklch, var(--accent) 14%, transparent);
  color: var(--accent-ink);
}

.activity-row__chip--order {
  background: color-mix(in oklch, var(--cloud-commerce-accent) 12%, transparent);
  color: var(--cloud-commerce-text);
}

.activity-row__chip--audience {
  background: color-mix(in oklch, var(--cloud-contacts-accent) 12%, transparent);
  color: var(--cloud-contacts-text);
}

.activity-row__chip--automation {
  background: color-mix(in oklch, var(--cloud-marketing-accent) 12%, transparent);
  color: var(--cloud-marketing-text);
}

/* The activity eyebrow is the one place a monospace face is wanted (IDs, codes). */
.activity-row :deep(.mp-list-row__eyebrow) {
  font-family: ui-monospace, "SF Mono", monospace;
}

/* ===== Side cards ===== */
.side-card {
  padding: var(--mp-component-card-padding);
}

.side-card__header {
  display: flex;
  align-items: center;
  gap: var(--mp-space-8);
  margin-bottom: var(--mp-component-card-gapCompact);
}

.side-card__chip {
  width: var(--mp-space-28);
  height: var(--mp-space-28);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--mp-component-chip-radius);
  flex-shrink: 0;
}

.side-card__chip--setup {
  background: color-mix(in oklch, var(--accent) 12%, transparent);
  color: var(--accent-ink);
}

.side-card__chip--davinci {
  background: linear-gradient(135deg, color-mix(in oklch, var(--accent) 18%, transparent), color-mix(in oklch, var(--cloud-marketing-accent) 18%, transparent));
  color: var(--accent-ink);
}

.side-card__title {
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-semibold);
  color: var(--text-primary);
}

.side-card__desc {
  font-size: var(--mp-fontSize-13);
  color: var(--muted);
  line-height: 1.45;
}

/* ===== Setup list ===== */
.setup-list {
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-2);
}

.setup-list__check {
  color: var(--muted);
  flex-shrink: 0;
}

.setup-list__item--done .setup-list__check {
  color: var(--pos);
}

.setup-list__item--done :deep(.mp-list-row__title) {
  color: var(--muted);
  text-decoration: line-through;
  text-decoration-color: var(--border-subtle);
}

/* ===== Da Vinci suggestions ===== */
.davinci-card {
  background: linear-gradient(180deg, color-mix(in oklch, var(--accent) 4%, var(--surface-primary)), var(--surface-primary));
}

.davinci-list {
  margin-top: var(--mp-component-card-gapCompact);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}

.davinci-list__icon {
  color: var(--accent-ink);
  flex-shrink: 0;
}

.davinci-list__arrow {
  margin-left: auto;
  color: var(--muted);
  opacity: 0.6;
}

.davinci-list__item:hover .davinci-list__arrow {
  opacity: 1;
  color: var(--accent-ink);
}

/* ===== Da Vinci ink panel (single branded moment) ===== */
.davinci-ink {
  display: flex;
  flex-direction: column;
  padding: var(--mp-space-28); /* generous — calibration calls for 28–32px inside ink panels */
  border-radius: var(--r-card); /* match the neighbouring setup card (not the ink default lg) */
}

.davinci-ink__eyebrow {
  display: block;
  margin-bottom: var(--mp-space-14);
}

.davinci-ink__headline {
  margin: 0 0 var(--mp-space-8);
  font-size: var(--mp-fontSize-20);
  font-weight: var(--mp-fontWeight-bold);
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--ink-panel-fg);
}

.davinci-ink__desc {
  margin: 0 0 var(--mp-space-20);
  font-size: var(--mp-fontSize-13);
  line-height: 1.5;
}

/* v-btn supplies shape, height, focus ring and motion. The ink panel inverts the
   surface, so only the palette is restated here. */
.ink-cta {
  align-self: flex-start;
  border-color: var(--ink-panel-fg);
  color: var(--ink-panel-fg);
}

.ink-cta:hover {
  background: color-mix(in oklch, var(--ink-panel-fg) 12%, transparent);
}

.ink-cta :deep(.v-btn__prepend) {
  color: var(--ink-panel-accent);
}

.ink-cta :deep(.v-btn__append) {
  opacity: 0.7;
}

/* Cap entrance stagger to the first row so long grids don't cascade for too long. */
.child-grid.mp-enter-stagger > *:nth-child(n + 4) {
  animation-delay: calc(var(--stagger-step) * 3);
}

/* ===== Responsive ===== */
@media (max-width: 960px) {
  .quick-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .child-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }

  .child-grid {
    grid-template-columns: 1fr;
  }

  /* Timestamps are the first thing to go at phone width — the row title needs
     the full measure. Targets MpListRow's trailing slot. */
  .activity-row :deep(.mp-list-row__trailing) {
    display: none;
  }
}
</style>
