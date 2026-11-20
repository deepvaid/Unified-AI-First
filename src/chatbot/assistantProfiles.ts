/**
 * What a store's assistant knows about what the store sells: the needs shoppers
 * describe and the words its products use for them, the questions it must answer
 * with care instead of a product, and the lines that only make sense for that
 * kind of store. The conversation itself (orders, sign-in, the store's pages) is
 * the same for every store, in storeAssistant.ts.
 *
 * A chatbot names its profile in `ChatbotConfig.assistantProfile`, so a store's
 * assistant travels with it when its theme is applied elsewhere. Unset: wellness.
 * Wellness is Vitaheal's. Part 2 adds apparel and Part 3 auto parts; until then
 * they answer as wellness.
 *
 * Pure, with relative `.ts` imports only, so `npm run test:chatbot` runs it in Node.
 */

import type { AssistantProfileId } from '../storefront/demoStores/types.ts'

/** Everyday words for a need, and the words products use for it. */
export interface AssistantNeed {
  /** How the answer names the need: "For better sleep, …". */
  label: string
  says: RegExp
  /** Matched against each product's own name, subtitle, description and collections. */
  means: string[]
}

export interface AssistantLink {
  label: string
  href: string
}

export interface AssistantProfile {
  id: AssistantProfileId
  /** What it can help with, after a greeting and when it did not understand. */
  help: string
  /** The needs it suggests products for. A product the merchant adds is matched too, by its own words. */
  needs: AssistantNeed[]
  /** Asked for a suggestion without saying what for. */
  askNeed: string
  /** After "For better sleep, ": one product, or several. */
  suggestionLead: { one: string; many: string }
  /** Questions that get this careful answer, never a product. */
  caution: { says: RegExp; text: string }
  /** Asked for a discount when no campaign is running. */
  noPromotion: { text: string; link: AssistantLink }
  /** Said after "I can’t find a subscription for <email>." */
  noSubscription: { text: string; link: AssistantLink }
}

const WELLNESS: AssistantProfile = {
  id: 'wellness',
  help: 'I can look up your order, tell you when your next subscription delivery is, suggest a product for sleep, focus, hydration, skin or healthy ageing, and answer questions about delivery and returns.',
  needs: [
    { label: 'better sleep', says: /\b(sleep\w*|insomnia|awake|restless|bedtime|wind(ing)? down|at night)\b/, means: ['sleep', 'bed', 'evening'] },
    { label: 'feeling calmer', says: /\b(stress\w*|anxious|anxiety|calm\w*|relax\w*|overwhelmed)\b/, means: ['calm', 'winding'] },
    { label: 'focus', says: /\b(focus\w*|concentrat\w*|brain fog|study\w*|sharp\w*|alert\w*|productiv\w*|distract\w*)\b/, means: ['focus'] },
    { label: 'steady energy', says: /\b(tired\w*|fatigue\w*|exhausted|energy|sluggish|afternoon dip|worn out)\b/, means: ['energy'] },
    { label: 'hydration and training', says: /\b(hydrat\w*|dehydrat\w*|thirst\w*|cramps?|sweat\w*|electrolytes?|run(ning|ner)?|workouts?|train\w*|gym|sports?|exercis\w*|cycling|marathon)\b/, means: ['hydrat', 'train', 'sport'] },
    { label: 'skin, hair and joints', says: /\b(skin|hair|nails?|joints?|knees?|collagen|glow\w*|wrinkles?)\b/, means: ['skin', 'hair', 'joint', 'collagen'] },
    { label: 'healthy ageing', says: /\b(age(ing)?|aging|longevity|getting older|cellular|nad)\b/, means: ['longevity', 'cellular', 'ageing'] },
    { label: 'easier breathing', says: /\b(snor\w*|breath\w*|blocked nose|stuffy|congest\w*|nasal|nose)\b/, means: ['breath', 'nose'] },
    { label: 'women’s daily balance', says: /\b(wom[ae]n\w*|cycle|period|hormon\w*|menopause|pms)\b/, means: ['women', 'month'] },
  ],
  askNeed: 'Tell me what you would like help with, for example better sleep, focus, hydration, skin or healthy ageing, and I will suggest a product.',
  suggestionLead: { one: 'this is the one we make for it', many: 'these are the ones we make for it' },
  caution: {
    says: /\b(pregnan\w*|breast\s?feed\w*|nursing|medication|medicines?|prescription|antidepress\w*|blood pressure|diabet\w*|disease|illness|diagnos\w*|allerg\w*|side effects?|doctor|cure|treat(s|ment)?|my (child|kid|baby|son|daughter)|under 18)\b/,
    text: 'I can’t give medical advice. If you are pregnant, breastfeeding, taking medication, managing a condition or asking for a child, please check with your doctor or pharmacist before starting a supplement. I can tell you what each product contains and what it is made for.',
  },
  noPromotion: {
    text: 'There is no discount code running right now. A subscription saves 20% to 30% on every delivery, all year.',
    link: { label: 'See subscriptions', href: '/collections/subscription' },
  },
  noSubscription: {
    text: 'You can start one from any product in our Subscription collection.',
    link: { label: 'See subscriptions', href: '/collections/subscription' },
  },
}

/** The profiles there are. A store whose profile is not here yet answers as wellness. */
export const ASSISTANT_PROFILES: Partial<Record<AssistantProfileId, AssistantProfile>> = { wellness: WELLNESS }

export const DEFAULT_ASSISTANT_PROFILE: AssistantProfileId = 'wellness'

/** The profile a chatbot names, or wellness when it names none. */
export function assistantProfile(id?: AssistantProfileId | null): AssistantProfile {
  return (id && ASSISTANT_PROFILES[id]) || WELLNESS
}
