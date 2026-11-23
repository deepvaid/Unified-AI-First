/**
 * What a store's assistant knows about what the store sells: the needs shoppers
 * describe and the words its products use for them, the questions it must answer
 * with care instead of a product, and the lines that only make sense for that
 * kind of store. The conversation itself (orders, sign-in, the store's pages) is
 * the same for every store, in storeAssistant.ts.
 *
 * A chatbot names its profile in `ChatbotConfig.assistantProfile`, so a store's
 * assistant travels with it when its theme is applied elsewhere. Unset: wellness.
 * Wellness is Vitaheal's, apparel Northfold's. Auto parts (Part 3) answers as
 * wellness until it is written.
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
  /**
   * Clothing: a kind of piece ("a coat or jacket") or an occasion ("cold days"),
   * so a suggestion reads "A coat or jacket for cold days". Unset: the need is
   * named as the wellness store names it ("For better sleep, …").
   */
  kind?: 'piece' | 'occasion'
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
  /**
   * How a suggestion is introduced, for one product or several: after "For better
   * sleep, " on a store whose needs have no kind, or after "A coat or jacket for
   * cold days under $250. " on one whose needs do.
   */
  suggestionLead: { one: string; many: string }
  /** Questions that get this careful answer, never a product. */
  caution: { says: RegExp; text: string; link?: AssistantLink }
  /** Asked for a discount when no campaign is running. */
  noPromotion: { text: string; link: AssistantLink }
  /** Said after "I can’t find a subscription for <email>.", or on its own by a store that sells none. */
  noSubscription: { text: string; link: AssistantLink }
  /** The chat's text field, before the shopper types. */
  placeholder: string
  /**
   * False: the store sells no subscriptions. A question about one is answered with
   * `noSubscription` at once, and "next delivery" means the shopper's order. A store
   * that still lists subscribers (a theme applied over one that had them) answers
   * as one that sells them.
   */
  subscriptions?: false
  /** Clothing: size and fit, fabric and care, and suggestions for him or her, under a price. */
  clothing?: ClothingKnowledge
}

/** A fibre a shopper may want to avoid ("I’m allergic to wool"). */
export interface AssistantFibre {
  /** How the answer names it: "These are made without any wool". */
  name: string
  says: RegExp
  /** A product contains it when its fabric or its name mentions one of these. */
  in: string[]
  /** What to suggest instead when the shopper names nothing to look for. */
  instead: string[]
}

/** What a clothing store's assistant knows beyond the needs: sizes, fabrics and how to say them. */
export interface ClothingKnowledge {
  fibres: AssistantFibre[]
  /** Pieces worn over others: between two sizes, the larger one leaves room to layer. Matched against name, subtitle and collections. */
  layering: string[]
  /** Collections that are one audience's: a gift "for him" keeps to the first, "for her" to the second. */
  audiences: { him: RegExp; her: RegExp }
  /** The store's page on fabrics and washing, pointed to from fabric, care and allergy answers. */
  fabricPage: AssistantLink
  /** The store's page on measuring and sizes, pointed to when no piece is named. */
  sizePage: AssistantLink
  /** Asked about size or fit without naming a piece, and not on a product page. */
  askPiece: string
  /** Given only a height and a weight. */
  heightWeight: string
  /** After a fibre-free suggestion, or a fabric answer. */
  fabricNote: string
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
  placeholder: 'Ask about an order, a subscription or a product',
}

const FABRIC_PAGE: AssistantLink = { label: 'Fabric and care', href: '/page/fabric-and-care' }

/**
 * A clothing store: it suggests pieces by kind and occasion, answers size and fit
 * from each product's fit note and size chart, and fabric and care from its fabric
 * and care fields. It gives no health answers: an allergy to a fibre gets the
 * pieces made without it, never advice.
 */
const APPAREL: AssistantProfile = {
  id: 'apparel',
  help: 'I can look up your order, help you find your size, tell you what a piece is made of and how to wash it, suggest something to wear, and answer questions about shipping and returns.',
  needs: [
    { kind: 'piece', label: 'a coat or jacket', says: /\b(coats?|jackets?|outerwear|parkas?|overshirts?|shackets?)\b/, means: ['coat', 'jacket', 'outerwear', 'overshirt'] },
    { kind: 'piece', label: 'knitwear', says: /\b(sweaters?|jumpers?|knit\w*|cardigans?|pullovers?|crewnecks?|quarter[- ]zips?)\b/, means: ['sweater', 'knit', 'cardigan'] },
    { kind: 'piece', label: 'a top', says: /\b(tees?|t-shirts?|tops?|shirts?|blouses?|button[- ]downs?)\b/, means: ['tee', 'top', 'shirt', 'blouse'] },
    { kind: 'piece', label: 'trousers', says: /\b(trousers?|pants|chinos?|slacks|bottoms)\b/, means: ['trouser', 'chino'] },
    { kind: 'piece', label: 'an accessory', says: /\b(scarf|scarves|hats?|beanies?|bags?|totes?|accessor\w*)\b/, means: ['scarf', 'beanie', 'tote'] },
    { kind: 'piece', label: 'a gift', says: /\b(gifts?|presents?|birthday|christmas|stocking)\b/, means: ['scarf', 'beanie', 'tote', 'lambswool', 'merino'] },
    { kind: 'occasion', label: 'cold days', says: /\b(warm(?!\s+(weather|days?|climates?))\w*|cold|winter\w*|chilly|freezing|snow\w*|layer\w*|cozy|cosy)\b/, means: ['wool', 'merino', 'lambswool', 'warm', 'insulation', 'cold', 'flannel'] },
    { kind: 'occasion', label: 'rainy days', says: /\b(rain\w*|wet|showers?|drizzle)\b/, means: ['rain', 'waxed'] },
    { kind: 'occasion', label: 'warm days', says: /\b(summer|hot|heat|humid|beach|breathab\w*|warm (weather|days?|climates?))\b/, means: ['linen', 'poplin', 'cotton'] },
    { kind: 'occasion', label: 'work', says: /\b(work|office|smart|meetings?|interviews?|dressy|dress(ed)? up|weddings?|dinner)\b/, means: ['smart', 'work', 'dressier', 'silk', 'oxford', 'pleat'] },
    { kind: 'occasion', label: 'the weekend', says: /\b(weekends?|casual|everyday|travel\w*|lounge)\b/, means: ['weekend', 'everyday', 'easy', 'tee'] },
  ],
  askNeed: 'Tell me what you’re looking for, for example a warm coat, knitwear, something for work or a gift, and I’ll suggest a few pieces.',
  suggestionLead: { one: 'Here’s the one I’d pick:', many: 'Here’s what I’d pick:' },
  caution: {
    says: /\b(allerg\w*|eczema|dermatitis|psoriasis|rash\w*|hives|skin (conditions?|problems?|irritation)|irritat\w*|sensitive skin|hypo-?allergenic|medical|doctor|latex|nickel|pregnan\w*|medications?|medicines?|toxic\w*|chemicals?)\b/,
    text: 'I can’t give medical or health advice, so I can’t say how a fabric or finish will suit you. What I can tell you is exactly what each piece is made of: every product lists its fabric under Fabric and care.',
    link: FABRIC_PAGE,
  },
  noPromotion: {
    text: 'There’s no discount code running right now. Our Sale collection has a few styles at a lower price.',
    link: { label: 'See the sale', href: '/collections/sale' },
  },
  noSubscription: {
    text: 'We don’t sell subscriptions. Every order you place is listed in your account.',
    link: { label: 'Your account', href: '/account' },
  },
  placeholder: 'Ask about an order, a size or a return',
  subscriptions: false,
  clothing: {
    fibres: [
      { name: 'wool', says: /\b(wool\w*|merino|lambswool|cashmere|alpaca|mohair|lanolin)\b/, in: ['wool', 'merino', 'cashmere', 'alpaca', 'mohair'], instead: ['sweater', 'knit', 'jacket', 'warm', 'insulation'] },
      { name: 'silk', says: /\bsilk\w*\b/, in: ['silk'], instead: ['shirt', 'blouse', 'poplin'] },
      { name: 'linen', says: /\blinen\b/, in: ['linen'], instead: ['shirt', 'cotton', 'poplin'] },
      { name: 'cotton', says: /\bcotton\b/, in: ['cotton'], instead: ['wool', 'merino', 'silk'] },
      { name: 'synthetic fibres', says: /\b(polyester|nylon|polyamide|elastane|spandex|synthetic\w*|plastic)\b/, in: ['polyester', 'nylon', 'polyamide', 'elastane', 'spandex'], instead: ['wool', 'cotton', 'linen'] },
    ],
    layering: ['knit', 'sweater', 'cardigan', 'coat', 'jacket', 'outerwear', 'overshirt', 'quarter-zip'],
    audiences: { him: /^(men|mens|men’s|men's|man)$/i, her: /^(women|womens|women’s|women's|woman)$/i },
    fabricPage: FABRIC_PAGE,
    sizePage: { label: 'Size guide', href: '/page/size-guide' },
    askPiece: 'Which piece is it for? Tell me its name, or ask me on its page, and I’ll check its fit note and size chart.',
    heightWeight: 'I can’t tell your size from height and weight alone, because our sizes go by body measurements.',
    fabricNote: 'Every product lists its full fabric under Fabric and care.',
  },
}

/** The profiles there are. A store whose profile is not here yet answers as wellness. */
export const ASSISTANT_PROFILES: Partial<Record<AssistantProfileId, AssistantProfile>> = { wellness: WELLNESS, apparel: APPAREL }

export const DEFAULT_ASSISTANT_PROFILE: AssistantProfileId = 'wellness'

/** The profile a chatbot names, or wellness when it names none. */
export function assistantProfile(id?: AssistantProfileId | null): AssistantProfile {
  return (id && ASSISTANT_PROFILES[id]) || WELLNESS
}
