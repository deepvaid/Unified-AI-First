<script setup lang="ts">
import { RouterLink } from 'vue-router'
import MpPageHeader from '@/components/MpPageHeader.vue'

export interface PrimaryAction {
  label: string
  icon?: string
  to?: string
  href?: string
  variant?: 'primary' | 'secondary'
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
}

defineProps<{
  title: string
  description?: string
  primaryActions?: PrimaryAction[]
  quickActions?: QuickAction[]
  childPages: ChildPage[]
  recentActivity?: ActivityItem[]
  setupCard?: SetupCardConfig | null
  daVinciCard?: DaVinciCardConfig | null
}>()
</script>

<template>
  <div class="module-landing">
    <MpPageHeader :title="title" :subtitle="description">
      <template v-if="primaryActions?.length" #actions>
        <v-btn
          v-for="(action, idx) in primaryActions"
          :key="action.label"
          :prepend-icon="action.icon"
          :to="action.to"
          :href="action.href"
          :color="(action.variant ?? (idx === 0 ? 'primary' : undefined))"
          :variant="action.variant === 'secondary' ? 'outlined' : 'flat'"
          rounded="pill"
          density="comfortable"
        >
          {{ action.label }}
        </v-btn>
      </template>
    </MpPageHeader>

    <!-- Quick actions row -->
    <section v-if="quickActions?.length" class="quick-actions" aria-label="Quick actions">
      <button
        v-for="qa in quickActions"
        :key="qa.label"
        type="button"
        class="quick-action"
        :class="qa.color ? `tint-${qa.color}` : ''"
        @click="$router.push(qa.to)"
      >
        <span class="quick-action__icon">
          <v-icon size="18">{{ qa.icon }}</v-icon>
        </span>
        <span class="quick-action__body">
          <span class="quick-action__label">{{ qa.label }}</span>
          <span v-if="qa.description" class="quick-action__desc">{{ qa.description }}</span>
        </span>
      </button>
    </section>

    <!-- Two-column main layout -->
    <v-row class="module-landing__grid mt-2">
      <v-col cols="12" md="8">
        <!-- Child page cards -->
        <div class="section-eyebrow" role="heading" aria-level="2">Sections</div>
        <div class="child-grid">
          <router-link
            v-for="cp in childPages"
            :key="cp.title"
            :to="cp.to"
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
          </router-link>
        </div>

        <!-- Recent activity -->
        <div v-if="recentActivity?.length" class="activity-section mt-6">
          <div class="section-eyebrow" role="heading" aria-level="2">Recent activity</div>
          <div class="activity-card">
            <component
              :is="item.to ? RouterLink : 'div'"
              v-for="(item, idx) in recentActivity"
              :key="idx"
              :to="item.to"
              class="activity-row"
              :class="{ 'activity-row--last': idx === recentActivity.length - 1, 'activity-row--link': item.to }"
            >
              <span class="activity-row__chip" :class="`activity-row__chip--${item.tag ?? 'email'}`">
                <v-icon size="14">{{ item.icon }}</v-icon>
              </span>
              <div class="activity-row__body">
                <div class="activity-row__eyebrow">{{ item.eyebrow }}</div>
                <div class="activity-row__title">{{ item.title }}</div>
              </div>
              <div v-if="item.meta" class="activity-row__meta">{{ item.meta }}</div>
            </component>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4">
        <!-- Setup / help card -->
        <div v-if="setupCard" class="side-card setup-card">
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
          <ul class="setup-list">
            <li
              v-for="item in setupCard.items"
              :key="item.label"
              class="setup-list__item"
              :class="{ 'setup-list__item--done': item.complete }"
            >
              <v-icon size="14" class="setup-list__check">
                {{ item.complete ? 'circle-check' : 'circle' }}
              </v-icon>
              <component
                :is="item.to ? 'router-link' : 'span'"
                :to="item.to"
                class="setup-list__label"
              >{{ item.label }}</component>
            </li>
          </ul>
          <v-btn
            v-if="setupCard.ctaLabel"
            :to="setupCard.ctaTo"
            variant="text"
            color="primary"
            density="comfortable"
            class="mt-2"
            append-icon="arrow-right"
          >{{ setupCard.ctaLabel }}</v-btn>
        </div>

        <!-- Da Vinci AI card -->
        <div v-if="daVinciCard" class="side-card davinci-card mt-4">
          <div class="side-card__header">
            <span class="side-card__chip side-card__chip--davinci">
              <v-icon size="14">sparkles</v-icon>
            </span>
            <div class="side-card__title">{{ daVinciCard.title }}</div>
          </div>
          <div class="side-card__desc">{{ daVinciCard.description }}</div>
          <ul class="davinci-list">
            <li v-for="s in daVinciCard.suggestions" :key="s.label">
              <!-- Separate branches per link kind — binding an unconditional :href
                   alongside RouterLink's :to clobbers the href it computes internally
                   (fallthrough attrs win over the component's own render), so each
                   kind gets only the attribute it needs. -->
              <router-link v-if="s.to" :to="s.to" class="davinci-list__item">
                <v-icon size="13" class="davinci-list__icon">sparkles</v-icon>
                <span>{{ s.label }}</span>
                <v-icon size="13" class="davinci-list__arrow">arrow-right</v-icon>
              </router-link>
              <a v-else-if="s.href" :href="s.href" class="davinci-list__item">
                <v-icon size="13" class="davinci-list__icon">sparkles</v-icon>
                <span>{{ s.label }}</span>
                <v-icon size="13" class="davinci-list__arrow">arrow-right</v-icon>
              </a>
              <button v-else type="button" class="davinci-list__item">
                <v-icon size="13" class="davinci-list__icon">sparkles</v-icon>
                <span>{{ s.label }}</span>
                <v-icon size="13" class="davinci-list__arrow">arrow-right</v-icon>
              </button>
            </li>
          </ul>
        </div>
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
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

/* ===== Per-tile accent tints (icon tile, count pill, hover/focus) ===== */
.tint-blue   { --tile-accent: #2563eb; --tile-accent-ink: #1d4ed8; }
.tint-violet { --tile-accent: #7c3aed; --tile-accent-ink: #6d28d9; }
.tint-rose   { --tile-accent: #e11d48; --tile-accent-ink: #be123c; }
.tint-green  { --tile-accent: #16a34a; --tile-accent-ink: #15803d; }
.tint-amber  { --tile-accent: #f59e0b; --tile-accent-ink: #b45309; }
.tint-cyan   { --tile-accent: #0891b2; --tile-accent-ink: #0e7490; }
.tint-indigo { --tile-accent: #4f46e5; --tile-accent-ink: #4338ca; }
.tint-teal   { --tile-accent: #0d9488; --tile-accent-ink: #0f766e; }

/* ===== Quick actions ===== */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--hairline);
  border-radius: 10px;
  background: var(--surface-1);
  color: var(--ink);
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
}

.quick-action:hover {
  background: var(--surface-2);
  border-color: color-mix(in oklch, var(--tile-accent, var(--accent)) 30%, var(--hairline));
}

.quick-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--tile-accent, var(--accent)) 18%, transparent);
}

.quick-action__icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, var(--tile-accent, var(--accent)) 12%, transparent);
  color: var(--tile-accent-ink, var(--accent-ink));
  border-radius: 8px;
  flex-shrink: 0;
}

.quick-action__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.quick-action__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}

.quick-action__desc {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Child page cards ===== */
.child-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.child-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px 16px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  color: var(--ink);
  text-decoration: none;
  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
  min-height: 110px;
}

.child-card:hover {
  background: var(--surface-2);
  border-color: color-mix(in oklch, var(--tile-accent, var(--accent)) 30%, var(--hairline));
}

.child-card:hover .child-card__arrow {
  opacity: 1;
  transform: translateX(2px);
}

.child-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--tile-accent, var(--accent)) 18%, transparent);
}

.child-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.child-card__icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, var(--tile-accent, var(--accent)) 12%, transparent);
  color: var(--tile-accent-ink, var(--accent-ink));
  border-radius: 8px;
  flex-shrink: 0;
}

.child-card__count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--tile-accent-ink, var(--accent-ink));
  background: color-mix(in oklch, var(--tile-accent, var(--accent)) 10%, transparent);
  padding: 2px 8px;
  border-radius: 999px;
}

.child-card__status {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.child-card__arrow {
  margin-left: 4px;
  color: var(--muted);
  opacity: 0.5;
  transition: opacity 120ms ease, transform 120ms ease;
  display: flex;
  align-items: center;
}

.child-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
  margin-bottom: 4px;
}

.child-card__desc {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.45;
}

/* ===== Activity feed ===== */
.activity-card {
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  padding: 4px 14px;
}

.activity-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--hairline);
}

.activity-row--last {
  border-bottom: none;
}

.activity-row--link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  margin: 0 -14px;
  padding-inline: 14px;
  border-radius: 8px;
  transition: background 120ms ease;
}

.activity-row--link:hover,
.activity-row--link:focus-visible {
  background: var(--surface-2);
}

.activity-row--link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 18%, transparent);
}

.activity-row__chip {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.activity-row__chip--email {
  background: color-mix(in oklch, var(--accent) 14%, transparent);
  color: var(--accent-ink);
}

.activity-row__chip--order {
  background: color-mix(in oklch, oklch(0.7 0.15 155) 14%, transparent);
  color: oklch(0.45 0.15 155);
}

.activity-row__chip--audience {
  background: color-mix(in oklch, oklch(0.75 0.12 90) 18%, transparent);
  color: oklch(0.45 0.12 90);
}

.activity-row__chip--automation {
  background: color-mix(in oklch, oklch(0.7 0.13 300) 14%, transparent);
  color: oklch(0.45 0.13 300);
}

.activity-row__body {
  flex: 1;
  min-width: 0;
}

.activity-row__eyebrow {
  font-family: ui-monospace, "SF Mono", monospace;
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 2px;
}

.activity-row__title {
  font-size: 13.5px;
  color: var(--ink);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-row__meta {
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ===== Side cards ===== */
.side-card {
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: var(--surface-1);
  padding: 16px 18px;
}

.side-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.side-card__chip {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.side-card__chip--setup {
  background: color-mix(in oklch, var(--accent) 12%, transparent);
  color: var(--accent-ink);
}

.side-card__chip--davinci {
  background: linear-gradient(135deg, color-mix(in oklch, var(--accent) 18%, transparent), color-mix(in oklch, oklch(0.7 0.13 300) 18%, transparent));
  color: var(--accent-ink);
}

.side-card__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.side-card__desc {
  font-size: 12.5px;
  color: var(--muted);
  line-height: 1.45;
}

/* ===== Setup list ===== */
.setup-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setup-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--ink);
}

.setup-list__check {
  color: var(--muted);
  flex-shrink: 0;
}

.setup-list__item--done .setup-list__check {
  color: oklch(0.5 0.15 155);
}

.setup-list__item--done .setup-list__label {
  color: var(--muted);
  text-decoration: line-through;
  text-decoration-color: var(--hairline);
}

.setup-list__label {
  color: inherit;
  text-decoration: none;
}

a.setup-list__label:hover {
  color: var(--accent-ink);
  text-decoration: underline;
}

/* ===== Da Vinci suggestions ===== */
.davinci-card {
  background: linear-gradient(180deg, color-mix(in oklch, var(--accent) 4%, var(--surface-1)), var(--surface-1));
}

.davinci-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.davinci-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--hairline);
  border-radius: 8px;
  background: var(--surface-1);
  color: var(--ink);
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}

.davinci-list__item:hover {
  background: var(--surface-2);
  border-color: color-mix(in oklch, var(--tile-accent, var(--accent)) 30%, var(--hairline));
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

  .activity-row__meta {
    display: none;
  }
}
</style>
