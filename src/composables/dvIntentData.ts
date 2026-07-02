// Da Vinci canned-intent data + speech templates — the single source of truth shared by
// the intent handlers (useDaVinciIntents) AND scripts/bake-lines.mjs, which pre-bakes a
// WAV per realized speech line so canned replies play instantly in the realistic voice.
// Dependency-free on purpose: the bake script imports this file directly under Node's
// native TypeScript type-stripping. If you edit a template or the data, re-run
// `node scripts/bake-lines.mjs --force` so the baked audio matches the runtime strings
// byte-for-byte (the text is the audio-cache key).

export type AudienceKey = 'all' | 'vip' | 'lapsed' | 'cart'

export const audiences: Record<AudienceKey, { label: string; size: number }> = {
  all: { label: 'All subscribers', size: 48230 },
  vip: { label: 'VIP customers', size: 3120 },
  lapsed: { label: 'Lapsed buyers', size: 7480 },
  cart: { label: 'Cart abandoners', size: 1985 },
}

export const campaignNames = [
  'Spring Style Refresh',
  'Weekend Flash Sale',
  'New Arrivals Spotlight',
  'Loyalty Member Exclusive',
]

export const productDrafts = [
  {
    title: 'Aurora Trail Jacket',
    content:
      'Built for shoulder-season hikes, the Aurora Trail Jacket pairs a windproof ripstop shell with a brushed-mesh lining that breathes when the pace picks up. Zippered chest pocket, packable hood, and reflective seams for low-light returns.',
  },
  {
    title: 'Coastline Canvas Tote',
    content:
      'The Coastline Canvas Tote carries beach days and farmers markets alike — 16oz washed canvas, interior zip pocket, and straps reinforced to hold 20kg without complaint. Available in three salt-faded colourways.',
  },
]

export const segmentVariants = {
  vip: {
    name: 'VIP Customers',
    rules: ['Lifetime spend > $500', 'Ordered in the last 90 days', 'Email engagement: high'],
    estimatedSize: 3120,
  },
  highIntent: {
    name: 'High-intent shoppers',
    rules: ['Viewed a product 3+ times in 14 days', 'Added to cart in the last 30 days', 'No purchase yet'],
    estimatedSize: 5240,
  },
}

// ── Speech templates (fixed 'en-US' formatting so runtime text === baked text) ──
export const campaignSpeech = (name: string, audienceLabel: string) =>
  `Done. I've drafted the ${name} email to ${audienceLabel.toLowerCase()}, scheduled for tomorrow at 9 AM.`
export const productSpeech = (title: string) => `Here's a product description draft for ${title}.`
export const revenueSpeech = 'Revenue is up 12 percent this week, at 128 thousand dollars across 1,284 orders.'
export const segmentSpeech = (name: string, estimatedSize: number) =>
  `I've built the ${name} segment with about ${estimatedSize.toLocaleString('en-US')} contacts.`
export const fallbackSpeech = 'I can run campaigns, draft product copy, report on revenue, or build segments.'
export const clarifyAudienceSpeech = 'Happy to. Which audience should this campaign go to?'

/** Every realized canned speech line — the bake list (~23 lines). */
export function listCannedSpeech(): string[] {
  const lines: string[] = []
  for (const name of campaignNames) {
    for (const a of Object.values(audiences)) lines.push(campaignSpeech(name, a.label))
  }
  for (const draft of productDrafts) lines.push(productSpeech(draft.title))
  lines.push(revenueSpeech)
  for (const v of Object.values(segmentVariants)) lines.push(segmentSpeech(v.name, v.estimatedSize))
  lines.push(fallbackSpeech)
  lines.push(clarifyAudienceSpeech)
  return lines
}
