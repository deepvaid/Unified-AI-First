/**
 * Deterministic demo-channel fixtures mirroring the real dashboard's
 * demo_channel_trend / demo_channel_mix metrics (useWidgetData.ts L722–761) —
 * copied rather than imported because the composable needs widget/filter
 * context. Same formula, same values, no RNG.
 */

interface ChannelSpec {
  name: string
  base: number
  amp: number
  phase: number
}

const CHANNEL_SPECS: ChannelSpec[] = [
  { name: 'Direct', base: 8200, amp: 900, phase: 0 },
  { name: 'Email', base: 6400, amp: 1200, phase: 1 },
  { name: 'Paid Search', base: 5200, amp: 800, phase: 2 },
  { name: 'Social', base: 3800, amp: 1400, phase: 3 },
  { name: 'Organic', base: 4600, amp: 700, phase: 4 },
  { name: 'Referral', base: 2400, amp: 600, phase: 5 },
]

const POINTS = 12

export const CHANNEL_TREND = {
  labels: Array.from({ length: POINTS }, (_, i) => `W${i + 1}`),
  series: CHANNEL_SPECS.map((c) => ({
    name: c.name,
    data: Array.from({ length: POINTS }, (_, i) => Math.round(c.base + c.amp * Math.sin((i + c.phase) * 0.6) + i * 60)),
  })),
}

/** demo_channel_mix — traffic share per source, sums to 100. */
export const TRAFFIC_MIX = [
  { name: 'Direct', value: 31 },
  { name: 'Email', value: 24 },
  { name: 'Paid Search', value: 17 },
  { name: 'Social', value: 12 },
  { name: 'Organic', value: 10 },
  { name: 'Referral', value: 6 },
]

/** 6-channel colors from the Tailwind blue ramp (Direct strongest). */
export const SCN_CHANNEL_COLORS = [
  '#2B7FFF', // Direct — blue-500
  '#8EC5FF', // Email — blue-300
  '#51A2FF', // Paid Search — blue-400
  '#1C398E', // Social — blue-900
  '#1447E6', // Organic — blue-700
  '#193CB8', // Referral — blue-800
]
