import type { Meta, StoryObj } from '@storybook/vue3'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Foundations/Type & Targets',
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The register is read at arm's length and tapped one-handed, often with a product in the other hand. Type
sits a step above the back office's (body 13–14, money 14–18), and **nothing tappable is under 44px**
(\`component.pos.touchTarget\`, Apple's 44pt). The controls a cashier hits most — Charge, the cart actions —
are 52 (\`touchTargetLarge\`); money presets use Android's 48dp row.

Radii are role aliases on the concentric scale: \`component.pos.radius.control\` 10 (buttons, fields),
\`.card\` 12 (tiles, tender rows, chips' containers), \`.sheet\` 16 (sheet tops), pills \`radius.full\`.
        `,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const TYPE = [
  { size: 11, weight: 'bold', use: 'Badges — stock, sale status, tier', sample: 'Low stock · 3' },
  { size: 12, weight: 'medium', use: 'Meta, line notes, hints, field labels', sample: 'Black · TEE-001-BLK-M' },
  { size: 13, weight: 'semibold', use: 'Buttons, chips, tile names, notices', sample: 'Apply discount' },
  { size: 14, weight: 'semibold', use: 'Line names, prices, tender rows', sample: 'Classic crew tee   $54.60' },
  { size: 15, weight: 'bold', use: 'Sheet titles, field values', sample: 'Classic crew tee — Black' },
  { size: 16, weight: 'bold', use: 'Charge', sample: 'Charge $111.90' },
  { size: 18, weight: 'bold', use: 'The sale total', sample: 'Total   $111.90' },
]

const TARGETS = [
  { token: 'component.pos.touchTarget', size: 'var(--mp-component-pos-touchTarget)', label: '44 · every control' },
  { token: 'space.48', size: 'var(--mp-space-48)', label: '48 · money presets' },
  { token: 'component.pos.touchTargetLarge', size: 'var(--mp-component-pos-touchTargetLarge)', label: '52 · Charge, cart actions' },
]

const RADII = [
  { token: 'component.pos.radius.control', value: 'var(--mp-component-pos-radius-control)', label: 'control · 10' },
  { token: 'component.pos.radius.card', value: 'var(--mp-component-pos-radius-card)', label: 'card · 12' },
  { token: 'component.pos.radius.sheet', value: 'var(--mp-component-pos-radius-sheet)', label: 'sheet · 16' },
  { token: 'radius.full', value: 'var(--mp-radius-full)', label: 'pill · full' },
]

export const TypeAndTargets: Story = {
  name: 'Type & Targets',
  render: () => ({
    setup: () => ({ TYPE, TARGETS, RADII }),
    template: `
      <div style="display: grid; gap: var(--mp-space-32);">
        <section>
          <p class="text-overline" style="margin-bottom: var(--mp-space-12); color: var(--mp-color-light-pos-muted);">Type</p>
          <div v-for="t in TYPE" :key="t.size" style="display: grid; grid-template-columns: 64px 1fr 1fr; align-items: baseline; gap: var(--mp-space-16); padding: var(--mp-space-8) 0; border-bottom: 1px solid var(--mp-color-light-pos-hairline);">
            <code style="font-size: var(--mp-fontSize-12); color: var(--mp-color-light-pos-muted);">{{ t.size }} / {{ t.weight }}</code>
            <span :style="{ fontSize: 'var(--mp-fontSize-' + t.size + ')', fontWeight: 'var(--mp-fontWeight-' + t.weight + ')', whiteSpace: 'pre' }">{{ t.sample }}</span>
            <span style="font-size: var(--mp-fontSize-12); color: var(--mp-color-light-pos-muted);">{{ t.use }}</span>
          </div>
        </section>
        <section>
          <p class="text-overline" style="margin-bottom: var(--mp-space-12); color: var(--mp-color-light-pos-muted);">Touch targets</p>
          <div style="display: flex; align-items: flex-end; gap: var(--mp-space-24);">
            <div v-for="t in TARGETS" :key="t.token" style="display: grid; justify-items: center; gap: var(--mp-space-8);">
              <div :style="{ width: t.size, height: t.size, borderRadius: 'var(--mp-component-pos-radius-control)', border: '2px dashed var(--mp-color-light-pos-accent)', background: 'var(--mp-color-light-pos-accentSoft)' }" />
              <code style="font-size: var(--mp-fontSize-12);">{{ t.label }}</code>
            </div>
          </div>
        </section>
        <section>
          <p class="text-overline" style="margin-bottom: var(--mp-space-12); color: var(--mp-color-light-pos-muted);">Radii</p>
          <div style="display: flex; gap: var(--mp-space-24);">
            <div v-for="r in RADII" :key="r.token" style="display: grid; justify-items: center; gap: var(--mp-space-8);">
              <div :style="{ width: 'var(--mp-space-80)', height: 'var(--mp-space-48)', borderRadius: r.value, border: '1px solid var(--mp-color-light-pos-hairline)', background: 'var(--mp-color-light-pos-surface)' }" />
              <code style="font-size: var(--mp-fontSize-12);">{{ r.label }}</code>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
}
