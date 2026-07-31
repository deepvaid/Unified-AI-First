<script setup lang="ts">
// /reel/fly — continuous 3D camera fly-through over real product screens
// (Atlassian "vision film" style). Timing comes from flyover-plan.json — the
// SAME file scripts/trailer/assemble.mjs uses to place the voiceover, so the
// camera waypoints and the narration stay in sync by construction.
//
// Screens are served from /trailer-screens/ (run scripts/trailer/prep-screens.mjs).
// R replays from t=0 (same convention as ReelView).
import { computed, onMounted, ref } from 'vue'
import { useSlideKeyboard } from '@/views/Deck/useSlideKeyboard'
import MpKpiCard from '@/components/MpKpiCard.vue'
import MpStatusChip from '@/components/MpStatusChip.vue'
import plan from './flyover-plan.json'

// ── Timeline (single source of truth: flyover-plan.json) ─────────────────────
const TOTAL = plan.segments.reduce((s, x) => s + x.dur, 0)
const bounds: number[] = []
let acc = 0
for (const seg of plan.segments) {
  acc += seg.dur
  bounds.push(acc)
}
// Camera dolly value v (px of world translateZ) at each segment boundary.
const V: [number, number, number, number, number] = [200, 2700, 5500, 9700, 10150]
const T = [0, ...bounds] as [number, number, number, number, number] // seconds at each boundary
const flipTime = T[3] + plan.flipAt // world goes dark this many seconds in

/** Seconds at which the camera dolly reaches value v (piecewise linear). */
function vToTime(v: number): number | null {
  for (let i = 0; i < V.length - 1; i++) {
    const currentV = V[i]!
    const nextV = V[i + 1]!
    const currentT = T[i]!
    const nextT = T[i + 1]!
    if (v >= currentV && v <= nextV) {
      const f = (v - currentV) / (nextV - currentV)
      return currentT + f * (nextT - currentT)
    }
  }
  return null // camera never reaches it
}

// ── World contents ────────────────────────────────────────────────────────────
interface FlyNode {
  kind: 'screen' | 'stat' | 'kpi' | 'chips'
  screen?: string
  stat?: { value: string; label: string }
  x: number
  y: number
  z: number
  ry: number
  w: number
}

const NODES: FlyNode[] = [
  // Zone A — landscape (S4): high slow descent over floating light screens
  { kind: 'screen', screen: 'dashboard-home', x: 0, y: 40, z: -1500, ry: 0, w: 1250 },
  { kind: 'screen', screen: 'sales-orders', x: -1280, y: -140, z: -1100, ry: 18, w: 980 },
  { kind: 'screen', screen: 'email-campaigns', x: 1320, y: -80, z: -1300, ry: -16, w: 980 },
  { kind: 'screen', screen: 'all-contacts', x: -840, y: 280, z: -2000, ry: 10, w: 940 },
  { kind: 'screen', screen: 'marketing-landing', x: 920, y: 260, z: -2200, ry: -10, w: 940 },
  { kind: 'screen', screen: 'products-list', x: -1750, y: 60, z: -2450, ry: 22, w: 940 },
  { kind: 'screen', screen: 'analytics-orders-report', x: 1780, y: 110, z: -2550, ry: -20, w: 940 },
  { kind: 'screen', screen: 'commerce-cloud-landing', x: 220, y: -300, z: -2650, ry: -4, w: 980 },
  { kind: 'kpi', x: 540, y: 350, z: -900, ry: -8, w: 340 },

  // Zone B — stats wall (S5)
  { kind: 'stat', stat: { value: '89', label: 'live components' }, x: -720, y: -40, z: -3700, ry: 6, w: 640 },
  { kind: 'stat', stat: { value: '84', label: 'storybook stories' }, x: 740, y: 120, z: -4050, ry: -6, w: 640 },
  { kind: 'stat', stat: { value: '171', label: 'product screens' }, x: -560, y: 180, z: -4450, ry: 5, w: 720 },
  { kind: 'stat', stat: { value: '297', label: 'design tokens' }, x: 820, y: -100, z: -4800, ry: -5, w: 760 },

  // Zone C — the street (S6): screens whoosh past on both sides
  { kind: 'screen', screen: 'order-detail', x: -790, y: 0, z: -6200, ry: 38, w: 1010 },
  { kind: 'screen', screen: 'journey-builder', x: 790, y: -40, z: -6650, ry: -38, w: 1010 },
  { kind: 'screen', screen: 'contact-lists', x: -790, y: 60, z: -7100, ry: 38, w: 1010 },
  { kind: 'chips', x: -280, y: -300, z: -7300, ry: 0, w: 300 },
  { kind: 'screen', screen: 'coupons', x: 790, y: 40, z: -7550, ry: -38, w: 1010 },
  { kind: 'screen', screen: 'settings-general', x: -790, y: -30, z: -8000, ry: 38, w: 1010 },
  { kind: 'screen', screen: 'da-vinci-experience', x: 790, y: 0, z: -8450, ry: -38, w: 1010 },
  { kind: 'screen', screen: 'sales-orders', x: -790, y: 40, z: -8900, ry: 38, w: 1010 },
  { kind: 'screen', screen: 'email-campaigns', x: 790, y: -50, z: -9250, ry: -38, w: 1010 },

  // Zone D — head-on dashboard (S7): fills the frame, then the world flips dark
  { kind: 'screen', screen: 'dashboard-home', x: 0, y: 0, z: -10600, ry: 0, w: 2700 },
]

interface RenderNode extends FlyNode {
  idx: number
  fadeDelay: number | null
  floatDelay: number
}

const nodes: RenderNode[] = NODES.map((n, idx) => ({
  ...n,
  idx,
  // Fade a node out just before the camera reaches its plane (z_eff ≈ −120px)
  // so nothing flips through the perspective origin.
  fadeDelay: vToTime(Math.abs(n.z) - 120),
  floatDelay: -(idx * 0.7) % 6,
}))

const screens = [...new Set(NODES.filter((n) => n.screen).map((n) => n.screen!))]

// ── Master animation CSS (generated so json edits stay in sync) ──────────────
const pct = (s: number) => ((s / TOTAL) * 100).toFixed(3)
const css = computed(() => {
  const [v0, v1, v2, v3, v4] = V
  return `
@keyframes fly-camera {
  0%       { transform: translate3d(0, -150px, ${v0}px) rotateX(7deg); }
  ${pct(T[1])}% { transform: translate3d(0, 40px, ${v1}px) rotateX(1.5deg); }
  ${pct(T[2])}% { transform: translate3d(0, 55px, ${v2}px) rotateX(0deg); }
  ${pct(T[3])}% { transform: translate3d(0, 40px, ${v3}px) rotateX(0deg); }
  100%     { transform: translate3d(0, 20px, ${v4}px) rotateX(0deg); }
}
.fly-world { animation: fly-camera ${TOTAL}s linear both; }
.fly-dark { animation: fly-flip 1.4s ease-in-out ${flipTime}s both; }
.fly-node { animation: fly-node-fade 0.35s linear both paused; }
@keyframes fly-flip { to { opacity: 1; } }
@keyframes fly-node-fade { to { opacity: 0; visibility: hidden; } }
`
})

// ── Lifecycle: preload → play; R replays ──────────────────────────────────────
const ready = ref(false)
const runId = ref(0)

useSlideKeyboard({
  count: () => 1,
  get: () => 0,
  set: () => {},
  onKey: (e) => {
    if (e.key.toLowerCase() === 'r') {
      runId.value++
      return true
    }
    return false
  },
})

onMounted(async () => {
  await Promise.all(
    screens.flatMap((s) => ['light', 'dark'].map((theme) => {
      const img = new Image()
      img.src = `/trailer-screens/${s}--${theme}.png`
      return img.decode().catch(() => {})
    }))
  )
  ready.value = true
})
</script>

<template>
  <v-theme-provider theme="maropostDark" with-background class="fly-root">
    <component :is="'style'">{{ css }}</component>
    <div class="fly-stage">
      <div v-if="ready" :key="runId" class="fly-viewport">
        <div class="fly-world">
          <div class="fly-floor" />
          <div
            v-for="n in nodes"
            :key="`${n.idx}`"
            class="fly-node"
            :style="{
              transform: `translate(-50%, -50%) translate3d(${n.x}px, ${n.y}px, ${n.z}px) rotateY(${n.ry}deg)`,
              width: `${n.w}px`,
              animationDelay: n.fadeDelay === null ? '' : `${n.fadeDelay.toFixed(2)}s`,
              animationPlayState: n.fadeDelay === null ? 'paused' : 'running',
            }"
          >
            <div class="fly-float" :style="{ animationDelay: `${n.floatDelay}s` }">
              <div v-if="n.kind === 'screen'" class="fly-screen">
                <img :src="`/trailer-screens/${n.screen}--light.png`" alt="" />
                <img :src="`/trailer-screens/${n.screen}--dark.png`" alt="" class="fly-dark" />
              </div>
              <div v-else-if="n.kind === 'stat'" class="fly-stat">
                <div class="fly-stat__value">{{ n.stat!.value }}</div>
                <div class="fly-stat__label">{{ n.stat!.label }}</div>
              </div>
              <v-theme-provider v-else-if="n.kind === 'kpi'" theme="maropostLight" with-background class="fly-card">
                <MpKpiCard label="Revenue" value="$48,210" icon="dollar-sign" trend="+12.4%" trend-positive period="Last 30 days" />
              </v-theme-provider>
              <v-theme-provider v-else theme="maropostLight" with-background class="fly-card fly-chips">
                <MpStatusChip status="Processing" type="order" />
                <MpStatusChip status="Completed" type="order" />
                <MpStatusChip status="Paid" type="payment" />
                <MpStatusChip status="Active" type="campaign" />
              </v-theme-provider>
            </div>
          </div>
        </div>
        <div class="fly-vignette" />
      </div>
    </div>
  </v-theme-provider>
</template>

<style scoped>
.fly-root {
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #08090c !important;
}

/* 16:9-safe stage, same convention as ReelView */
.fly-stage {
  position: relative;
  aspect-ratio: 16 / 9;
  width: min(100vw, calc(100dvh * 16 / 9));
  max-height: 100dvh;
  overflow: hidden;
  background: radial-gradient(ellipse 90% 70% at 50% 38%, #10141c 0%, #08090c 68%);
}

.fly-viewport {
  position: absolute;
  inset: 0;
  perspective: 1000px;
  perspective-origin: 50% 46%;
}

.fly-world {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}

.fly-node {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-style: preserve-3d;
  will-change: transform, opacity;
}

/* (fly-node-fade + fly-flip keyframes live in the generated <style> — scoped
   keyframes get renamed by the SFC compiler and would never match.) */

/* Gentle idle float so the world feels alive while the camera glides. */
.fly-float { animation: fly-float 6s ease-in-out infinite alternate; }
@keyframes fly-float {
  from { transform: translateY(-7px); }
  to { transform: translateY(7px); }
}

.fly-screen {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  /* Cheap shadow — big soft box-shadows make software-rendered capture choke */
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.42);
  background: #0d1117;
  position: relative;
}

.fly-screen img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: auto;
  display: block;
}

.fly-screen .fly-dark { opacity: 0; }

.fly-stat { text-align: center; }
.fly-stat__value {
  font-size: 250px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.96);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 40px rgba(45, 99, 232, 0.35);
}
.fly-stat__label {
  margin-top: 14px;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.fly-card {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
}
.fly-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 18px;
}

/* Distant dotted grid floor for spatial grounding */
.fly-floor {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 9000px;
  height: 9000px;
  transform: translate(-50%, -50%) translate3d(0, 560px, -5200px) rotateX(90deg);
  background-image:
    linear-gradient(rgba(120, 150, 220, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 150, 220, 0.16) 1px, transparent 1px);
  background-size: 340px 340px;
  -webkit-mask-image: radial-gradient(ellipse 42% 42% at 50% 50%, black 30%, transparent 75%);
  mask-image: radial-gradient(ellipse 42% 42% at 50% 50%, black 30%, transparent 75%);
}

.fly-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 78% 68% at 50% 46%, transparent 58%, rgba(0, 0, 0, 0.5) 100%);
}
</style>
