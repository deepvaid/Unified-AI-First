// Copy and setup schema for the production "Journey Selection" templates —
// what the template dialog says, which prerequisites a template needs, and how
// the "Setup" wizard step binds lists / stores / segments / products / content
// onto the template's node graph (crawled 2026-09-02, see
// docs/rebuild/new-journey/AUDIT.md §2). The node graphs themselves live in
// journeyFlowData.ts (`journeyTemplates`).

export type PrerequisiteKind = 'list' | 'content' | 'store' | 'segment' | 'product'
export type TriggerSetupKind = 'list' | 'store' | 'product' | 'segment'

/** One paragraph (or bullet list) of the template dialog's long description. */
export interface DetailBlock {
  text?: string
  items?: string[]
  /** Trailing link appended to `text` (production embeds these inline). */
  link?: { label: string; href: string }
}

export interface EmailStep {
  title: string
  description: string
  /** Template node ids that receive this step's content (Lapsed Buyer maps one pick onto four thank-you emails). */
  nodeIds: string[]
  /** In-app link shown under the description (Lapsed Buyer → product recommendation feeds). */
  link?: { label: string; path: string }
}

export interface TemplateSetupMeta {
  id: string
  details: DetailBlock[]
  prerequisites: PrerequisiteKind[]
  /** Paragraph under the "Setup for …" heading. */
  setupDescription: string
  trigger: { description: string; kind: TriggerSetupKind; nodeId: string }
  /** Lapsed Buyer only: the segment bound to every Yes/No gate. */
  filter?: { description: string; nodeIds: string[] }
  contentIntro: string
  emails: EmailStep[]
  /** Email Re-Engagement only: the Do Not Mail step. */
  dnm?: { description: string; nodeId: string }
}

/** Verbatim prerequisite copy from `managePrerequisites()`; `path` is where the "create it" action goes (`:accountId` is substituted). */
export const prerequisiteCopy: Record<PrerequisiteKind, {
  success: string
  error: string
  tooltip?: string
  action?: { label: string; path: string }
}> = {
  list: {
    success: 'You have email contact lists to trigger the journey.',
    error: 'Please create at least one email contact list to use this journey.',
    action: { label: 'Create a list', path: '/accounts/:accountId/lists/new' },
  },
  content: {
    success: 'You have email content to use within the journey.',
    error: 'Please create email content to use this journey.',
    action: { label: 'Create content', path: '/accounts/:accountId/contents/template' },
  },
  store: {
    success: 'You have connected your store to trigger the journey.',
    error: 'Please connect your store to use this journey.',
    tooltip: 'If you have already connected your store, make sure it is active.',
    action: { label: 'Connect a store', path: '/accounts/:accountId/integrations' },
  },
  segment: {
    success: 'You have a segment to trigger this journey.',
    error: 'Please create at least one segment to use this journey.',
    action: { label: 'Create a segment', path: '/accounts/:accountId/segments/types' },
  },
  product: {
    success: 'You have connected Product & Revenue details.',
    error: 'You need to connect Product & Revenue details. Contact your Customer Success Manager about how to get it enabled.',
  },
}

/** Production's "Select Source" options for the Product Categories trigger mode. */
export const productSourceTypes = [
  'Default', 'Sk Test', 'Keap', 'Amazon', 'Woocommerce', 'Magento',
  'Retail Express', 'Shopify', 'Unified', 'Google Analytics',
]

export const orderStatusHint =
  'Selecting order status adds another filter to the products, so only contacts whose order has the status you enter are triggered. Use the checkbox to enable or disable the filter.'

/**
 * Webstores connected to this sandbox account that send abandoned-cart
 * triggers. Deliberately empty: it is the one missing prerequisite in the
 * sandbox, so the Abandoned Cart template demonstrates the "✗ + create it"
 * state that could not be reached on UAT (every prerequisite was present there).
 */
export const connectedStores: { id: string; name: string }[] = []

/** Product & Revenue is enabled on the sandbox account. */
export const productRevenueEnabled = true

export const templateSetupById: Record<string, TemplateSetupMeta> = {
  welcome: {
    id: 'welcome',
    details: [
      { text: 'This journey will introduce new subscribers to your brand and will restate the benefits of being a subscriber.' },
      { text: 'You can use this opportunity to tell them what to expect and what to do next.' },
    ],
    prerequisites: ['list', 'content'],
    setupDescription: 'Greet new customers with an email series that provides an introduction to your business. It is the best chance to introduce yourself to an excited new customer and show the benefits of being on your list. The whole purpose of a Welcome journey is to lay the foundation of trust between your brand and your customers. It is not the time to sell your customers anything! It’s the time to tell your story.',
    trigger: {
      kind: 'list',
      nodeId: 'w1',
      description: 'A trigger is an element that starts the entire journey. In this case the trigger is one or more contact lists. As soon as someone is added to a list for the first time, they will be brought into the journey.',
    },
    contentIntro: 'There are three emails sent within this journey. Choose the content for each email and it will be populated in your journey.',
    emails: [
      { title: 'Email 1: Introduction', nodeIds: ['w2'], description: 'The first email of the Welcome series is where you introduce your contact to your brand, set expectations and what they need to do to continue receiving emails in their inbox. It is not a time to sell them anything.' },
      { title: 'Email 2: Expectations', nodeIds: ['w4'], description: 'The second email is where you want to show your subscribers what to expect by being on this list. Send them some of your best content and show them how you can improve their lives.' },
      { title: 'Email 3: Benefits', nodeIds: ['w6'], description: 'The third email is to show what is special about your company. Why should your subscribers continue to subscribe to you?' },
    ],
  },
  'abandoned-cart': {
    id: 'abandoned-cart',
    details: [
      { text: 'This journey only works if you have connected your Marketing Cloud account with your website that sends Abandoned Cart triggers to Maropost. If a customer abandons their cart during a shopping session then this journey will trigger.' },
      { text: 'After a delay of 30 minutes (or more, or less — this can easily be changed) the customer will receive an email. You can include the Abandoned Cart tag within the email to automatically send the customer their most recent items. To learn more about the Abandoned Cart tag', link: { label: 'please click here', href: 'https://galaxy.maropost.com/s/article/Journey-Triggers' } },
      { text: 'The second email will be sent to the customer a day later. In this email you can include the Abandoned Cart tag once again, with content as to why they should come back and purchase from your store. The multi-email approach can remind your customers about their purchase at a better time.' },
    ],
    prerequisites: ['store', 'content'],
    setupDescription: 'This journey targets customers who have abandoned a product or a service from your website in their cart. This series of emails reminds your customer about what they have left behind in their cart and provides them information about why they should complete their purchase. To use this journey, you need to create content that includes the Abandoned Cart tag associated with the appropriate webstore.',
    trigger: {
      kind: 'store',
      nodeId: 'c1',
      description: 'The Abandoned Cart trigger is initiated when a customer leaves items in their cart but does not purchase them. The dropdown lets you choose which web store will trigger this journey.',
    },
    contentIntro: 'There are two emails sent within this journey. Choose the content for each email and it will be populated in your journey.',
    emails: [
      { title: 'Email 1: Reminder', nodeIds: ['c2'], description: 'In this email, remind the customer of the products they left in their cart. Give them reasons why they should continue their purchase.' },
      { title: 'Email 2: Secondary reminder', nodeIds: ['c4'], description: 'In this email, remind the customer again about the products they left in their cart. Tell them what they’ll be missing out on if they don’t continue their purchase.' },
    ],
  },
  nurture: {
    id: 'nurture',
    details: [
      { text: 'This journey targets users who just bought a particular product or service. This series of emails can provide the customer with information about the product they purchased. It helps build trust and allows them to feel comfortable with your brand.' },
      { text: 'The emails can have care instructions or complementary products or services.' },
    ],
    prerequisites: ['product', 'content'],
    setupDescription: 'This journey targets customers who just bought a particular product or service. This series of emails provides the customer information about the product they just purchased, helps build trust with them and allows them to feel more comfortable with your brand.',
    trigger: {
      kind: 'product',
      nodeId: 'n1',
      description: 'A trigger is an element that starts the entire journey. In this case the trigger is one or more products that have been purchased by your contact.',
    },
    contentIntro: 'There are three emails sent within this journey. Choose the content for each email and it will be populated in your journey.',
    emails: [
      { title: 'Email 1: Introduction', nodeIds: ['n2'], description: 'In this email, introduce your customer to the product they just purchased. Thank them for the purchase and provide them more information about the product, such as how to wear or care instructions.' },
      { title: 'Email 2: Question', nodeIds: ['n4'], description: 'In this email ask your user how they are enjoying the product they purchased. Remind them they can always email you if there is a problem — the point is to make them more comfortable with your brand.' },
      { title: 'Email 3: Upsell', nodeIds: ['n6'], description: 'In this email, you can try to upsell your customers by showing them products related to the product that they purchased. Make sure to explain how these products are relevant to your customer.' },
    ],
  },
  advocacy: {
    id: 'advocacy',
    details: [
      { text: 'This journey targets repeat buyers with the goal of getting them to give a positive testimonial about products or services. This is especially good for service-based industries, such as coaches. This journey is built to move the relationship between your company and your loyal subscribers beyond transactional. Many choose to send advocacy emails to people who have just purchased or repeat buyers.' },
      { text: 'There are no pre-built segments for this journey because the segment of your subscribers that you want to reach is highly dependent on your product or service. Some examples could be:', items: ['Transactional: bought in the last 30 days', 'Repeat buyers: bought at least 2 products in the last 90 days'] },
      { text: 'You can ask your customers for multiple advocacy actions such as:', items: ['Leave a product review', 'Provide a quote for the website', 'Refer someone else with a coupon and get a discount based on the referral'] },
    ],
    prerequisites: ['segment', 'content'],
    setupDescription: 'Target your repeat customers and help them become advocates of your brand. This is best for service-based industries. Move your relationships with your customers beyond just transactional. These emails are normally sent to people who just bought a product or have bought from you repeatedly. In your emails to them, you can ask them to leave a product review, provide a quote for your website or refer someone else to your website with a coupon code.',
    trigger: {
      kind: 'segment',
      nodeId: 'a1',
      description: 'A trigger is an element that starts the entire journey. In this case the trigger is one segment. The segment you choose depends on your product or service — for example customers that bought in the past 30 days, or customers that bought at least 2 products in the last 90 days.',
    },
    contentIntro: 'There are three emails sent within this journey. Choose the content for each email and it will be populated in your journey.',
    emails: [
      { title: 'Email 1: Introduction', nodeIds: ['a2'], description: 'In this email, thank your buyers for their loyalty. You do not want to use the first email to ask for a testimonial — rather use this email to reaffirm the benefits of your products or services.' },
      { title: 'Email 2: Testimonial', nodeIds: ['a4'], description: 'In this email, you’ll be asking your customers for their testimonials. Tell your customer why you are asking for their testimonial, where it will be used and how they are to submit their testimonial.' },
      { title: 'Email 3: Incentivize', nodeIds: ['a6'], description: 'In this email you want to remind your customers that you are asking for a testimonial and incentivize them to refer their friends or family.' },
    ],
  },
  're-engagement': {
    id: 're-engagement',
    details: [
      { text: 'This journey helps to maintain your deliverability by only keeping subscribers that actually want to be there on your lists. ISPs keep track of open and click-through rates. If the click rate goes up then your reputation goes up. If people are repeatedly deleting your emails, it will impact your reputation score.' },
      { text: 'You want to remove people from your list that are not interested in your content. With this journey you can get rid of contacts that don’t want to receive your emails. Additionally you will also re-engage subscribers that are interested but have not sought out your content on their own.' },
      { text: 'This journey should allow for re-triggering, as subscribers might lapse multiple times in the future. This journey includes subscribers that have been inactive with your content for at least 90 days.' },
      { text: 'Each Yes/No segment checks to see if the subscribers have taken action with your content. If they continue to be inactive they will continue on the journey and eventually be unsubscribed. If they take action then they will exit the journey and continue to be subscribed.' },
    ],
    prerequisites: ['segment', 'content'],
    setupDescription: 'Help maintain your deliverability by sending emails to subscribers that are interested in your company or service. This journey will help to maintain your list by unsubscribing contacts who are not interacting with your material. This journey can also be used to re-engage people that are interested but have not sought out your content lately.',
    trigger: {
      kind: 'segment',
      nodeId: 'r1',
      description: 'This trigger targets your contacts who are not responding to your email campaigns. The objective of this type of campaign is to get the non-responsive subscribers off your email list. Doing so helps your sending reputation, which increases your inbox rate. This segment has been pre-built.',
    },
    contentIntro: 'There are four emails sent within this journey. Choose the content for each email and it will be populated in your journey.',
    emails: [
      { title: 'Email 1: Introduction', nodeIds: ['r3'], description: 'In this email you should re-affirm the benefits of your email program. Explain why your subscribers should stay on your list. However, make sure to include a place where people can unsubscribe from your list. You don’t want to send emails to people who don’t want them — it can affect your deliverability.' },
      { title: 'Email 2: Benefits', nodeIds: ['r6'], description: 'In this email focus on the benefits again. Remind them why they signed up in the beginning. Focus on the experiences they are missing out on. However, make sure to include a place where people can unsubscribe from your list.' },
      { title: 'Email 3: Consequences', nodeIds: ['r9'], description: 'At this point your subscribers have not responded to your prior emails, so a strong emotion is required in your copy. The email should expand on the consequences of losing the benefits of receiving future emails.' },
      { title: 'Email 4: Last chance', nodeIds: ['r12'], description: 'This is the final email before you cleanse total non-responders from your email list. Similar to the third email, you can use strong emotions. It is also your chance to remind the user that after this, they will not be receiving any more emails from you, which means they also lose access to the benefits that you are providing.' },
    ],
    dnm: {
      nodeId: 'r15',
      description: 'This will be the Do Not Mail list where your inactive contacts will be moved at the end of the journey, preventing them from receiving future communications. Doing so helps your sending reputation because now you’re sending your emails to those who want them.',
    },
  },
  'lapsed-buyer': {
    id: 'lapsed-buyer',
    details: [
      { text: 'This journey helps to connect with subscribers that have purchased something over 6 months ago but have not purchased in the last 90 days. It encourages lapsed buyers to purchase again. In this journey, the Yes/No filters check if a subscriber has purchased something. If they do, then the journey sends them a thank-you email, with a coupon code or a similar benefit for their next purchase.' },
      { text: 'If a subscriber continues not to purchase anything they will experience the entire journey, which will be a set of emails explaining why they should purchase something, show them the best available products and develop a relationship with the subscriber.', link: { label: 'To create a set of product recommendations to use in an email, please click here.', href: '/commerce/:accountId/product_recommendations' } },
      { text: 'This journey should not be re-triggered.' },
    ],
    prerequisites: ['segment', 'content'],
    setupDescription: 'This journey connects with subscribers that have purchased something 6 months ago, but have not purchased in 90 days. Use this journey to encourage lapsed buyers to buy again by providing more details about your products. If a subscriber does purchase something, then thank them and provide them with something special, like a coupon code for their next purchase.',
    trigger: {
      kind: 'segment',
      nodeId: 'l1',
      description: 'A trigger is an element that starts the entire journey. You want to target people who have bought from you in the past but not recently — this segment is pre-made to include people who have bought at least one product more than 6 months ago and have not purchased in the last 90 days.',
    },
    filter: {
      nodeIds: ['l4', 'l8', 'l11', 'l14'],
      description: 'Use this filter to make sure that you’re only sending the emails of this journey to people who have not responded to your earlier emails. It has been pre-built to include contacts who have purchased in the last 7 days.',
    },
    contentIntro: 'There are five emails sent within this journey. Choose the content for each email and it will be populated in your journey.',
    emails: [
      { title: 'Email 1: Introduction', nodeIds: ['l2'], description: 'This email should promote brand awareness rather than be transactional. By re-building this trust with your customers, it will help urge them to purchase again.' },
      { title: 'Email 2: Brand introduction', nodeIds: ['l6'], description: 'In this email, you want to re-introduce your lapsed buyers to your brand. Humanize your brand with unique stories or shared passions between your brand and your subscribers.' },
      { title: 'Email 3: Story telling', nodeIds: ['l9'], description: 'In this email, use it as an opportunity to tell another story, similar to the second email of the journey. Stay focused on telling your story, about the integrity of your company and why the lapsed buyer can confidently trust you enough to buy from you again.' },
      { title: 'Email 4: Product focused', nodeIds: ['l12'], description: 'In this email, you are going to shift to being more product-focused. If you have targeted this journey to lapsed buyers of a particular product, use this email to show similar or complementary products. If you are using Marketing Cloud’s Product Recommendations feature, then you can have the option to show Best Selling, Trending or New Arrival products.', link: { label: 'Create a product recommendations feed', path: '/commerce/:accountId/product_recommendations/product_feeds' } },
      { title: 'Email 5: Thank you', nodeIds: ['l5a', 'l5b', 'l5c', 'l5d'], description: 'In this email, thank your subscriber for purchasing from you and add a coupon code or a different type of discount for future purchases as another reason to purchase again.' },
    ],
  },
}

// ── Setup-step bindings (what the wizard collects) ───────────────────────────

export interface SetupBindings {
  fromName: string
  fromEmail: string
  /** list trigger */
  listIds: number[]
  /** store trigger */
  storeId: string | null
  /** segment trigger (+ Lapsed Buyer filter segment) */
  segmentId: number | null
  filterSegmentId: number | null
  /** product trigger */
  productMode: 'product' | 'categories'
  productIds: number[]
  allProducts: boolean
  orderStatusEnabled: boolean
  orderStatus: string
  source: string | null
  brands: string[]
  categories: string[]
  /** email step index → content id */
  contentIds: (number | null)[]
  /** Do Not Mail step */
  dnmType: 'general' | 'brand'
  dnmBrand: string
}

export function blankBindings(emailCount: number): SetupBindings {
  return {
    fromName: '',
    fromEmail: '',
    listIds: [],
    storeId: null,
    segmentId: null,
    filterSegmentId: null,
    productMode: 'product',
    productIds: [],
    allProducts: false,
    orderStatusEnabled: false,
    orderStatus: '',
    source: null,
    brands: [],
    categories: [],
    contentIds: Array.from({ length: emailCount }, () => null),
    dnmType: 'general',
    dnmBrand: 'All Brands',
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Production's "You cannot use emojis in this field." rule. */
export const EMOJI_RE = /\p{Extended_Pictographic}/u
