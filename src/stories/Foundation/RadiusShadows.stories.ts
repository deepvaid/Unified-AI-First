import type { Meta, StoryObj } from '@storybook/vue3'
import {
  mp_radius_12,
  mp_fontFamily_mono,
  mp_fontSize_11,
} from '@/design-tokens/generated/tokens'
import { tokensByPrefix, type TokenEntry } from './foundationTokens'

const meta: Meta = {
  title: 'Foundations/Radius & Shadows',
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: `
### Overview
Corner radii and elevation, rendered directly from \`src/design-tokens/generated/tokens.ts\`.

### Radius
One scale, named by pixel value — \`radius.4 · 8 · 10 · 12 · 16 · 20 · full\`. It reads as a
concentric language: **16** for outer surfaces (cards, dialogs, drawers), **12** for anything
nested inside one, **10** for controls and inputs, **8** for chips and menu items, **4** for
micro-marks, \`full\` for pills, buttons and avatars.

Reach for a role token when the system has already made the decision —
\`component.{button,chip,input,menu,card,dialog}.radius\` alias into the scale and are wired into
the Vuetify global defaults, so a plain \`v-btn\` or \`v-card\` picks them up automatically.
The **Component Radius** story lists every \`component.*\` radius, including the POS register's own.

### Shadows
Three softly-tinted elevation levels: \`sm\`, \`md\`, \`lg\`, each with a dark-theme counterpart
under \`shadow.dark.*\`. Depth in this system comes from hairline borders + tint, not
heavy drop shadows — cards are \`flat border rounded="lg"\` by default. Use \`sm\` for resting
cards, \`md\` for hover/popovers, \`lg\` for modals and drawers. Never stack shadows.

The other \`shadow.*\` tokens are **role shadows**: each has one job and is not a step on the
elevation ramp.
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const radii = tokensByPrefix('mp_radius_')
const allComponentRadii = tokensByPrefix('mp_component_').filter((t) => /radius/i.test(t.name))
const isPosRadius = (t: TokenEntry) => t.name.startsWith('pos_')
const componentRadii = allComponentRadii.filter((t) => !isPosRadius(t))
const posRadii = allComponentRadii.filter(isPosRadius)
const motion = tokensByPrefix('mp_motion_')

/** The elevation ramp, in order. Every other `shadow.*` token is a role shadow. */
const ELEVATION_STEPS = ['sm', 'md', 'lg']
const shadows = tokensByPrefix('mp_shadow_')
const isDarkShadow = (s: TokenEntry) => s.name.startsWith('dark_')
const shadowStep = (s: TokenEntry) => s.name.replace(/^dark_/, '')
const isElevation = (s: TokenEntry) => ELEVATION_STEPS.includes(shadowStep(s))
const elevation = (dark: boolean) =>
  shadows
    .filter((s) => isElevation(s) && isDarkShadow(s) === dark)
    .sort((a, b) => ELEVATION_STEPS.indexOf(shadowStep(a)) - ELEVATION_STEPS.indexOf(shadowStep(b)))
const lightElevation = elevation(false)
const darkElevation = elevation(true)
const roleShadows = shadows.filter((s) => !isElevation(s))

const TileLabel = {
  props: ['entry'],
  setup() {
    return { mp_fontFamily_mono, mp_fontSize_11 }
  },
  template: `
    <div
      class="text-medium-emphasis mt-2"
      :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11, wordBreak: 'break-all' }"
    >{{ entry.name }} · {{ entry.value }}</div>
  `,
}

export const RadiusScale: Story = {
  render: () => ({
    components: { TileLabel },
    setup() {
      return { radii }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Radius scale — radius.* (name = px value)</p>
        <div class="d-flex flex-wrap ga-4">
          <div v-for="r in radii" :key="r.token" style="width: 140px;">
            <div
              :style="{
                borderRadius: r.value,
                height: '96px',
                background: 'rgb(var(--v-theme-primary-container))',
                border: '1px solid rgb(var(--v-theme-outline-variant))',
              }"
            />
            <TileLabel :entry="r" />
          </div>
        </div>
      </div>
    `,
  }),
}

export const ComponentRadius: Story = {
  render: () => ({
    components: { TileLabel },
    setup() {
      const groups = [
        { heading: 'Component radius — every component.* radius role', caption: '', radii: componentRadii },
        { heading: 'POS radius — component.pos.radius.*', caption: 'POS only: the in-store register kit (Pos*). Not for app surfaces.', radii: posRadii },
      ]
      return { groups }
    },
    template: `
      <div class="pa-6">
        <div v-for="group in groups" :key="group.heading" class="mb-8">
          <p class="text-overline text-medium-emphasis" :class="group.caption ? 'mb-1' : 'mb-4'">{{ group.heading }}</p>
          <p v-if="group.caption" class="text-caption text-medium-emphasis mb-4">{{ group.caption }}</p>
          <div class="d-flex flex-wrap ga-4">
            <div v-for="r in group.radii" :key="r.token" style="width: 180px;">
              <div
                :style="{
                  borderRadius: r.value,
                  height: '72px',
                  background: 'rgb(var(--v-theme-surface))',
                  border: '1px solid rgb(var(--v-theme-outline))',
                }"
              />
              <TileLabel :entry="r" />
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const Shadows: Story = {
  render: () => ({
    components: { TileLabel },
    setup() {
      return { lightElevation, darkElevation, roleShadows, motion, mp_radius_12 }
    },
    template: `
      <div class="pa-6" style="background: rgb(var(--v-theme-background));">
        <p class="text-overline text-medium-emphasis mb-4">Light elevation — shadow.sm / md / lg</p>
        <div class="d-flex flex-wrap ga-6 mb-8">
          <div v-for="s in lightElevation" :key="s.token" style="width: 220px;">
            <div
              :style="{
                boxShadow: s.value,
                height: '96px',
                borderRadius: mp_radius_12,
                background: 'rgb(var(--v-theme-surface))',
                border: '1px solid rgb(var(--v-theme-outline-variant))',
              }"
            />
            <TileLabel :entry="s" />
          </div>
        </div>
        <p class="text-overline text-medium-emphasis mb-4">Dark elevation — shadow.dark.sm / md / lg</p>
        <div class="d-flex flex-wrap ga-6 mb-8">
          <div v-for="s in darkElevation" :key="s.token" style="width: 220px;">
            <div
              :style="{
                boxShadow: s.value,
                height: '96px',
                borderRadius: mp_radius_12,
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
              }"
            />
            <TileLabel :entry="s" />
          </div>
        </div>
        <p class="text-overline text-medium-emphasis mb-1">Role shadows — one job each, light and dark</p>
        <p class="text-caption text-medium-emphasis mb-4">
          scrollUp: an overlay footer over a body scrolled beneath it. buttonInset: the top-edge sheen on
          filled buttons, light surfaces only. dvOrbit*: the Da Vinci Orbit voice controls only.
        </p>
        <div class="d-flex flex-wrap ga-6 mb-8">
          <div v-for="s in roleShadows" :key="s.token" style="width: 220px;">
            <div
              :style="{
                boxShadow: s.value,
                height: '96px',
                borderRadius: mp_radius_12,
                background: 'var(--surface-primary)',
                border: '1px solid var(--border-subtle)',
              }"
            />
            <TileLabel :entry="s" />
          </div>
        </div>
        <p class="text-overline text-medium-emphasis mb-2">Motion — motion.*</p>
        <TileLabel v-for="t in motion" :key="t.token" :entry="t" />
      </div>
    `,
  }),
}

/** Semantic elevation aliases paired with borders — never shadow without a boundary. */
export const ElevationAliases: Story = {
  render: () => ({
    setup() {
      return { mp_radius_12 }
    },
    template: `
      <div class="pa-6">
        <p class="text-overline text-medium-emphasis mb-4">Semantic elevation — --elevation-* aliases</p>
        <div class="d-flex flex-wrap ga-6">
          <div style="width: 220px;">
            <div
              :style="{
                boxShadow: 'var(--elevation-raised)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: mp_radius_12,
                height: '96px',
              }"
            />
            <p class="text-caption text-medium-emphasis mt-2 font-weight-medium">L2 raised</p>
            <code class="text-caption">--elevation-raised</code>
          </div>
          <div style="width: 220px;">
            <div
              :style="{
                boxShadow: 'var(--elevation-overlay)',
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: mp_radius_12,
                height: '96px',
              }"
            />
            <p class="text-caption text-medium-emphasis mt-2 font-weight-medium">L3 overlay</p>
            <code class="text-caption">--elevation-overlay</code>
          </div>
          <div style="width: 220px;">
            <div
              :style="{
                boxShadow: 'var(--elevation-modal)',
                background: 'var(--surface-overlay)',
                border: '1px solid var(--border-default)',
                borderRadius: mp_radius_12,
                height: '96px',
              }"
            />
            <p class="text-caption text-medium-emphasis mt-2 font-weight-medium">L4 modal</p>
            <code class="text-caption">--elevation-modal</code>
          </div>
        </div>
      </div>
    `,
  }),
}
