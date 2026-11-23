/**
 * What a store's assistant knows about what the store sells: the needs shoppers
 * describe and the words its products use for them, the questions it must answer
 * with care instead of a product, and the lines that only make sense for that
 * kind of store. The conversation itself (orders, sign-in, the store's pages) is
 * the same for every store, in storeAssistant.ts.
 *
 * A chatbot names its profile in `ChatbotConfig.assistantProfile`, so a store's
 * assistant travels with it when its theme is applied elsewhere. Unset: wellness.
 * Wellness is Vitaheal's, apparel Northfold's, auto parts Torqline's.
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
  /** Auto parts: whether a part fits a vehicle, part numbers, the shopper's vehicle, and the work it leaves to a mechanic. */
  parts?: PartsKnowledge
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

/**
 * What an auto parts store's assistant knows beyond the needs, which name the kinds
 * of part it sells ("brake pads"). Whether a part fits comes from each product's own
 * fitment rows (src/storefront/fitment.ts), never from the assistant.
 */
export interface PartsKnowledge {
  /**
   * Work and safety questions that get a careful answer, never a product or a
   * how-to: doing brake work yourself, a symptom or "is it safe to drive",
   * steering, suspension and airbags, and handling fluids and batteries. Checked
   * in order, after the health caution. `page` names the store's own knowledge
   * entry that answers it ("Brake work"), whose words are used when it has one.
   * A question about buying a part is not refused: it gets the fit, and `mechanic`.
   */
  cautions: Array<{ says: RegExp; text: string; link?: AssistantLink; page?: RegExp }>
  /** Asked which part fits without a vehicle the chat knows. */
  askVehicle: string
  /** After a fit answer on a universal part sold in grades or sizes ("0W-20"): where the right one is written. */
  choiceNote: string
  /** The kinds of part (need labels) a qualified mechanic should fit, and the line said after an answer that offers one. */
  mechanic: { kinds: string[]; text: string }
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

/**
 * An auto parts store: it checks a part against a vehicle from the part's own
 * fitment rows, finds a part by its number, lists the parts that fit the shopper's
 * vehicle, and sets that vehicle for the store when the shopper asks or agrees. It
 * never guesses a fit for a vehicle the store does not list, and it leaves brake,
 * steering, suspension and airbag work, and handling fluids and batteries, to a
 * qualified mechanic. It gives no health answers.
 *
 * A need is a kind of part: its `says` is matched against the shopper's message and
 * against each part's name (the first need a name matches is that part's kind, so
 * the specific kinds come before the general ones), its `means` against each part's
 * name and category.
 */
const AUTO_PARTS: AssistantProfile = {
  id: 'auto-parts',
  help: 'I can check whether a part fits your vehicle, find a part by its part number, show the parts that fit your vehicle, look up your order, and answer questions about shipping and returns.',
  needs: [
    { label: 'brake pads', says: /\b(brake ?pads?|pads)\b/, means: ['brake', 'pad'] },
    { label: 'brake rotors', says: /\b(brake )?(rotors?|discs?)\b/, means: ['brake', 'rotor'] },
    { label: 'brake fluid', says: /\bbrake fluids?\b/, means: ['brake', 'fluid'] },
    { label: 'brake parts', says: /\bbrak(e|es|ing)\b(?!\s*(pads?|fluids?|rotors?|discs?))/, means: ['brake'] },
    { label: 'oil filters', says: /\boil filters?\b/, means: ['oil', 'filter'] },
    { label: 'engine air filters', says: /\bengine (air )?filters?\b/, means: ['engine', 'air', 'filter'] },
    { label: 'cabin air filters', says: /\bcabin (air )?filters?\b/, means: ['cabin', 'air', 'filter'] },
    { label: 'air filters', says: /\bair filters?\b/, means: ['air', 'filter'] },
    { label: 'motor oil', says: /\b(motor oil|engine oil|oil change|synthetic oil|oil)\b(?!\s*filters?)/, means: ['oil'] },
    { label: 'batteries', says: /\b(batter(y|ies)|agm)\b/, means: ['battery'] },
    { label: 'headlight bulbs', says: /\b(head ?lights?|head ?lamps?|bulbs?|low beams?|high beams?)\b/, means: ['headlight', 'bulb'] },
    { label: 'rear wiper blades', says: /\brear wipers?( blades?)?\b/, means: ['rear', 'wiper'] },
    { label: 'wiper blades', says: /\b(wipers?|wiper blades?)\b/, means: ['wiper'] },
    { label: 'spark plugs', says: /\b(spark ?plugs?|plugs)\b/, means: ['spark', 'plug'] },
    { label: 'floor mats', says: /\b(floor ?mats?|mats|floor liners?)\b/, means: ['floor', 'mat'] },
    { label: 'tire pressure gauges', says: /\b(tire|tyre)s? (pressure )?gauges?\b|\bpressure gauges?\b|\btire pressure\b/, means: ['tire', 'gauge'] },
    { label: 'jump starters', says: /\b(jump ?starters?|jump ?start\w*|booster packs?)\b/, means: ['jump', 'starter'] },
  ],
  askNeed: 'Tell me the part you need, like brake pads, a battery or wiper blades, and your vehicle’s year, make and model, and I’ll find what fits.',
  suggestionLead: { one: 'this is the one that matches', many: 'these are the ones that match' },
  caution: {
    says: /\b(swallow\w*|drank|ingest\w*|poison\w*|in (my|his|her|their|your) eyes?|eyes? (burn|sting)\w*|on (my|his|her|their) (skin|hands?|face)|toxic|skin (burn|rash)\w*|chemical burns?|breath\w* (in )?(the )?fumes|inhal\w*|dizzy|nause\w*|pregnan\w*|medical|doctor|medications?|allerg\w*|injur\w*|hurt (myself|himself|herself)|(got|is|was|am|been) hurt)\b/,
    text: 'I can’t give medical advice. If someone has swallowed a fluid, got one in their eyes or is hurt, call 911 or Poison Control at 1-800-222-1222 right away. Every fluid we sell has first-aid directions on its label.',
  },
  noPromotion: {
    text: 'There’s no discount code running right now. Our Deals collection has a few parts at a lower price.',
    link: { label: 'See the deals', href: '/collections/deals' },
  },
  noSubscription: {
    text: 'We don’t sell subscriptions. Every order you place is listed in your account.',
    link: { label: 'Your account', href: '/account' },
  },
  placeholder: 'Ask about a part, a fit or an order',
  subscriptions: false,
  parts: {
    cautions: [
      {
        // Doing brake work: how to, or by yourself. The store's own "Brake work" page answers.
        says: /\bhow (?:(?:do|can|should|would) (?:i|you|we)|to) (?!know|find|tell|choose|pick|check|see|get|order|buy|return|look|pay|track)\w+[^.?!]*\bbrak\w*|\bbrak\w*[^.?!]*\bhow (?:(?:do|can|should|would) (?:i|you|we)|to) (?!know|find|tell|choose|pick|check|see|get|order|buy|return|look|pay|track)\w+|\b(myself|diy|on my own|at home|my own)\b[^.?!]*\b(brak\w*|pads?|rotors?)\b|\b(brak\w*|pads?|rotors?)\b[^.?!]*\b(myself|diy|on my own|at home)\b|\bbleed\w*\b[^.?!]*\bbrak\w*|\bbrak\w*[^.?!]*\bbleed\w*/,
        page: /\bbrake work\b/i,
        text: 'Brakes are safety parts, so unless you’ve done the job before, have a qualified mechanic fit pads and rotors, and bleed the brakes after changing the fluid. I can’t walk you through brake work in a chat. I can tell you which parts fit your vehicle.',
      },
      {
        // A symptom, "is it safe to drive", or steering, suspension and airbags: a mechanic, never a diagnosis.
        // A part that "won't make noise" is a part, not a symptom.
        says: /\b(safe to drive|ok(ay)? to drive|keep driving|still drive|drive on it|drive with)\b|\bair ?bags?\b|\bsrs\b|\b(steering|suspension|ball joints?|tie rods?|control arms?|struts?|shocks?|wheel bearings?)\b|(?<!\b(?:won['’]?t|don['’]?t|doesn['’]?t|didn['’]?t|no|not|never|less|without|stop|reduce|quiet|quieter)\s+(?:make\s+|any\s+|much\s+|a\s+|the\s+)?)\b(grind\w*|squeal\w*|squeak\w*|noises?|noisy|spongy|soft pedal|pedal (is |feels |goes |went )?(soft|spongy|low|to the floor)|pulls? to (the )?(left|right|one side)|vibrat\w*|shudder\w*|shak(e|es|ing)|smok(e|es|ing|y)|burning smell|warning light|light (is |came |comes |went )?on|fail(s|ed|ing)?|not working|stopped working)\b/,
        text: 'That’s a safety question, so please have a qualified mechanic look at your vehicle before you drive it. I can’t diagnose a problem or walk you through brake, steering, suspension or airbag work in a chat. I can tell you which parts fit your vehicle and what each one is.',
      },
      {
        // Handling fluids and batteries: the label and a mechanic, never a how-to.
        says: /\b(mix\w*|dispos\w*|recycl\w*|spill\w*|leak\w*|swollen|bulg\w*|crack\w*|corro\w*|acid|rotten eggs?|sulfur|explod\w*)\b[^.?!]*\b(fluids?|oil|coolant|antifreeze|batter(y|ies))\b|\b(fluids?|oil|coolant|antifreeze|batter(y|ies))\b[^.?!]*\b(mix\w*|dispos\w*|recycl\w*|spill\w*|leak\w*|swollen|bulg\w*|crack\w*|corro\w*|acid|rotten eggs?|smell\w*|explod\w*)\b|\bhow (do|to|can|should) i (jump|charge|connect|disconnect|hook up)\b|\b(safe|safely)\b[^.?!]*\b(jump\w*|charg\w*|batter(y|ies)|fluids?|oil|coolant|antifreeze)\b|\b(jump\w*|charg\w*|batter(y|ies)|fluids?|coolant|antifreeze)\b[^.?!]*\b(safe|safely)\b/,
        text: 'Fluids and batteries need care, so I won’t walk you through that in a chat. Follow the directions on the label, wear gloves and eye protection, and have a qualified mechanic deal with a leak or a damaged or swollen battery. Your local recycling center can tell you where to take used oil and old batteries.',
      },
    ],
    askVehicle: 'Which vehicle is it for? Tell me the year, make and model, like 2019 Ford F-150, or choose it here.',
    choiceNote: 'Your owner’s manual says which one your vehicle takes.',
    mechanic: {
      kinds: ['brake pads', 'brake rotors'],
      text: 'Brakes are safety parts: unless you’ve done the job before, have a qualified mechanic fit them.',
    },
  },
}

/** The profiles there are. A store whose profile is not here answers as wellness. */
export const ASSISTANT_PROFILES: Partial<Record<AssistantProfileId, AssistantProfile>> = { wellness: WELLNESS, apparel: APPAREL, 'auto-parts': AUTO_PARTS }

export const DEFAULT_ASSISTANT_PROFILE: AssistantProfileId = 'wellness'

/** The profile a chatbot names, or wellness when it names none. */
export function assistantProfile(id?: AssistantProfileId | null): AssistantProfile {
  return (id && ASSISTANT_PROFILES[id]) || WELLNESS
}
