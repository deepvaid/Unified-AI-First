import type { Meta, StoryObj } from '@storybook/vue3'
import * as generated from '@/design-tokens/generated/tokens'
import tokenSource from '@/design-tokens/tokens.json'
import { tokensByPrefix } from '@/stories/Foundation/foundationTokens'
import { SwatchGrid } from '@/stories/Foundation/SwatchGrid'
import { posSurface } from '@/stories/decorators'

const meta = {
  title: 'Product/POS/Foundations/Colors',
  tags: ['autodocs'],
  decorators: [posSurface],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The register's palette, \`color.light.pos.*\` in \`tokens.json\`. It is **light-only by design**: a counter
terminal never follows the app theme, so there is no \`color.dark.pos\` and these stories stay light under
the Theme toggle.

In CSS the tokens are \`var(--mp-color-light-pos-*)\` — never shortened to \`--pos-*\`, which already means
"positive" in \`mp-theme-aliases.css\`. Every \`*Ink\` is text-safe (≥ 4.5:1) on the surface, the background
and its own \`*Soft\` fill; the pairs below are the ones \`npm run contrast:check\` enforces.
        `,
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const palette = tokensByPrefix('mp_color_light_pos_')
const tokenValue = (path: string) => (generated as Record<string, string>)[`mp_${path.replaceAll('.', '_')}`] ?? ''

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const LEVEL_MIN: Record<string, number> = { text: 4.5, ui: 3 }

const pairs = (tokenSource.$contrastPairs as { surface: string; foreground: string; level: string }[])
  .filter((p) => p.surface.startsWith('color.light.pos.'))
  .map((p) => {
    const surface = tokenValue(p.surface)
    const foreground = tokenValue(p.foreground)
    const value = ratio(surface, foreground)
    return {
      ...p,
      surfaceName: p.surface.replace('color.light.pos.', ''),
      foregroundName: p.foreground.replace('color.light.pos.', ''),
      surfaceValue: surface,
      foregroundValue: foreground,
      ratio: value.toFixed(2),
      pass: !LEVEL_MIN[p.level] || value >= LEVEL_MIN[p.level]!,
    }
  })

export const Colors: Story = {
  render: () => ({
    components: { SwatchGrid },
    setup: () => ({ palette, pairs }),
    template: `
      <SwatchGrid
        :heading="'Palette — color.light.pos.* (' + palette.length + ' tokens)'"
        :swatches="palette"
        panel-bg="var(--mp-color-light-pos-surface)"
        panel-text="var(--mp-color-light-pos-ink)"
        panel-muted="var(--mp-color-light-pos-muted)"
        panel-border="var(--mp-color-light-pos-hairline)"
      />
      <section style="padding: var(--mp-space-24); border: 1px solid var(--mp-color-light-pos-hairline); border-radius: var(--mp-radius-12); background: var(--mp-color-light-pos-surface);">
        <p class="text-overline" style="margin-bottom: var(--mp-space-12); color: var(--mp-color-light-pos-muted);">Pairs — enforced by contrast:check</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--mp-space-12);">
          <div
            v-for="p in pairs"
            :key="p.surface + p.foreground"
            :style="{
              display: 'flex', flexDirection: 'column', gap: 'var(--mp-space-4)',
              padding: 'var(--mp-space-12)', borderRadius: 'var(--mp-radius-10)',
              border: '1px solid var(--mp-color-light-pos-hairline)',
              background: p.surfaceValue, color: p.foregroundValue,
            }"
          >
            <strong style="font-size: var(--mp-fontSize-14);">{{ p.foregroundName }} on {{ p.surfaceName }}</strong>
            <span style="font-family: var(--mp-fontFamily-mono); font-size: var(--mp-fontSize-12);">
              {{ p.ratio }}:1 · {{ p.level }} {{ p.pass ? '✓' : '✗' }}
            </span>
          </div>
        </div>
      </section>
    `,
  }),
}
