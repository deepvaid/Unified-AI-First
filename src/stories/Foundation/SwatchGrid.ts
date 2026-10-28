// Shared swatch grid for color foundations — the app palette (Foundations/Colors)
// and the register's (Product/POS/Foundations/Colors) render the same way.
import {
  mp_radius_12,
  mp_space_12,
  mp_space_24,
  mp_fontFamily_mono,
  mp_fontSize_12,
  mp_fontSize_11,
} from '@/design-tokens/generated/tokens'

/** Reusable swatch-grid section. `panel` styles let dark tokens render on a dark canvas. */
export const SwatchGrid = {
  props: ['swatches', 'heading', 'panelBg', 'panelText', 'panelMuted', 'panelBorder'],
  setup() {
    return {
      mp_radius_12,
      mp_space_12,
      mp_space_24,
      mp_fontFamily_mono,
      mp_fontSize_12,
      mp_fontSize_11,
    }
  },
  template: `
    <section
      :style="{
        background: panelBg,
        color: panelText,
        padding: mp_space_24,
        borderRadius: mp_radius_12,
        border: '1px solid ' + panelBorder,
        marginBottom: mp_space_24,
      }"
    >
      <p class="text-overline" :style="{ color: panelMuted, marginBottom: mp_space_12 }">{{ heading }}</p>
      <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: mp_space_12 }">
        <div v-for="s in swatches" :key="s.token">
          <div
            :style="{
              background: s.value,
              height: '56px',
              borderRadius: mp_radius_12,
              border: '1px solid ' + panelBorder,
            }"
          />
          <div :style="{ fontSize: mp_fontSize_12, fontWeight: 600, marginTop: '6px', wordBreak: 'break-all' }">{{ s.name }}</div>
          <div :style="{ fontFamily: mp_fontFamily_mono, fontSize: mp_fontSize_11, color: panelMuted, wordBreak: 'break-all' }">{{ s.value }}</div>
        </div>
      </div>
    </section>
  `,
}
