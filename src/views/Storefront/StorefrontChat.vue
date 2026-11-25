<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { assistantProfile } from '@/chatbot/assistantProfiles'
import { chatLineVehicle } from '@/chatbot/partsAnswers'
import { NEW_CONVERSATION, assistantProduct, assistantReply } from '@/chatbot/storeAssistant'
import type { AssistantAction, AssistantContext, AssistantReply, AssistantState } from '@/chatbot/storeAssistant'
import { money, parseDecimal } from '@/maropay/money'
import { useChatbotStore } from '@/stores/useChatbot'
import type { Chatbot } from '@/stores/useChatbot'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Product } from '@/stores/useCommerce'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { vehicleLabel } from '@/storefront/fitment'
import type { Vehicle } from '@/storefront/fitment'
import { optionKind } from '@/storefront/variants'
import { allowedActions, chargeAmount, dayLabel } from '@/subscriptions/contracts'
import { onBrand } from '@/utils/brandContrast'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'
import { inStock, previewProducts, productFromHandle, productHandle, storefrontProducts } from './storefrontCatalog'

// The store's chatbot, as its shoppers meet it: a launcher in the corner and a
// chat panel. How it looks and what it opens with come from the chatbot's own
// settings (Service › Chatbots in the admin), so the builder controls it. What it
// answers is src/chatbot/storeAssistant.ts: scripted rules over this store's real
// orders, subscriptions, products and pages. Nothing is sent anywhere.
//
// It can also act: add a suggested product to the cart, and skip a subscription's
// next delivery. Each chat is saved to the chatbot's Conversations in the admin.
// What it knows about the kind of store (wellness, apparel, auto parts) is the
// chatbot's assistant profile; a clothing store's assistant also reads the store's
// size charts and the product page the shopper is on. An auto-parts store's reads
// the shopper's vehicle, and can set it: when the shopper asks, says yes to its
// offer, or presses its button, never on its own, and it says so in the chat
// ("Showing parts for your 2019 Ford F-150."). Its "Choose your vehicle" button
// opens the store's vehicle selector, and the vehicle chosen there answers the
// question that was waiting for it.
//
// On the richer theme drawing (Northfold, Torqline) the launcher is a 48px circle on
// a phone, and it steps aside (fades out, out of the Tab order) while a control the
// page marks `data-sf-clear` is under its corner: the product page's choices and
// buttons, the cart's checkout. It comes back as soon as nothing is under it. Other
// stores' launchers stay as they are.

const props = defineProps<{ chatbot: Chatbot }>()

const storefront = inject(STOREFRONT)!
const route = useRoute()
const commerce = useCommerceStore()
const chatbots = useChatbotStore()
const cart = useStorefrontCartStore()
const shopper = useStorefrontShopperStore()
const subscriptions = useSubscriptionsStore()

const cfg = computed(() => props.chatbot.config)
const channelId = computed(() => storefront.channel.value.id)
const brandVars = computed(() => ({ '--chat-brand': cfg.value.primaryColor, '--chat-on-brand': onBrand(cfg.value.primaryColor) }))
const prompts = computed(() => cfg.value.quickPrompts.filter((p) => p.enabled).map((p) => p.text))
const placeholder = computed(() => assistantProfile(cfg.value.assistantProfile).placeholder)

/** A store with a locale writes days its way ("18 Nov 2026"); one without, as US shoppers read them ("Nov 18, 2026"). */
const usDay = (date: string): string =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const day = computed(() => (storefront.channel.value.webStore?.locale ? dayLabel : usDay))

/** The product whose page the shopper is on, so "Which size should I get?" is about it. */
const currentProductId = computed(() => (route.name === 'StorefrontProduct'
  ? productFromHandle(commerce.products, channelId.value, String(route.params.handle ?? ''))?.id
  : undefined))

// ── What the assistant may know ──────────────────────────────────────
// Read fresh for every message, so an order placed a moment ago is found.

function context(): AssistantContext {
  const currency = storefront.currency.value
  return {
    email: shopper.emailFor(channelId.value),
    orders: commerce.orders.filter((o) => o.channelId === channelId.value).map((o) => ({
      id: o.id,
      number: o.orderNumber,
      email: o.customer.email,
      date: o.date,
      status: o.status,
      fulfillment: o.fulfillmentStatus,
      tracking: o.trackingNumber,
      items: o.lineItems.map((line) => ({ name: line.product, qty: line.qty })),
      total: storefront.formatExact(parseDecimal(o.total, o.currency) ?? money(0, currency)),
    })),
    subscriptions: subscriptions.contracts.filter((c) => c.channelId === channelId.value).map((c) => ({
      id: c.id,
      number: c.number,
      email: c.customer.email,
      product: c.product,
      plan: c.plan.name,
      status: c.status,
      nextChargeOn: c.nextChargeOn,
      price: storefront.formatExact(chargeAmount(c)),
      canSkip: allowedActions(c).includes('skip'),
    })),
    // A parts store hands in its sold-out parts too, so their part numbers are found (and said to be sold out).
    products: storefrontProducts(commerce.products, channelId.value).filter((p) => storefront.sellsParts.value || inStock(p)).map((p) => assistantProduct(p, `/products/${productHandle(p)}`)),
    entries: cfg.value.knowledgeSources
      .filter((s) => s.enabled && s.status === 'Active')
      .flatMap((s) => (s.entries ?? []).map((e) => ({ title: e.title, text: e.text, url: e.url, source: s.name }))),
    shoppingEnabled: cfg.value.shopping.enabled,
    trackingEnabled: cfg.value.orderTracking.enabled,
    demo: storefront.demo.value,
    promotion: storefront.campaignMessage.value,
    profile: cfg.value.assistantProfile,
    sizeCharts: storefront.sizeCharts.value,
    ...(currentProductId.value ? { currentProductId: currentProductId.value } : {}),
    ...(storefront.channel.value.webStore?.locale ? {} : { formatDay: usDay }),
    // An auto-parts store keeps the shopper's vehicle (null until one is chosen) and writes its prices.
    ...(storefront.sellsParts.value ? { vehicle: storefront.vehicle.value, formatPrice: partPrice } : {}),
  }
}

/** A part's price as the store writes it: 64.99 → "$64.99". */
function partPrice(amount: number): string {
  const currency = storefront.currency.value
  return storefront.formatExact(parseDecimal(amount.toFixed(2), currency) ?? money(0, currency))
}

// ── The conversation ─────────────────────────────────────────────────

interface Message {
  id: number
  from: 'shopper' | 'bot'
  text: string
  time: string
  reply?: AssistantReply
}

const thread = ref<Message[]>([])
const state = ref<AssistantState>(NEW_CONVERSATION)
const typing = ref(false)
const draft = ref('')
const offerPrompts = ref(true)
let nextId = 0
/** This chat's id under the chatbot's Conversations; set with its first message. */
let conversationId = ''
let startedAt = ''
let resolved = true

// Signing out on the account page signs the chat out too.
watch(() => shopper.emailFor(channelId.value), (email) => {
  if (!email) state.value = { ...state.value, email: null }
})

const clock = (): string => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

function say(from: Message['from'], text: string, reply?: AssistantReply): void {
  thread.value.push({ id: ++nextId, from, text, time: clock(), ...(reply ? { reply } : {}) })
}

const body = ref<HTMLElement | null>(null)
const field = ref<HTMLInputElement | null>(null)
async function settle(): Promise<void> {
  await nextTick()
  body.value?.scrollTo({ top: body.value.scrollHeight })
}

const TOPICS: Partial<Record<AssistantReply['kind'], string>> = { order: 'Order status', subscriptions: 'Subscription', products: 'Product advice', answer: 'Store question' }

/** A product reply's cards carry the names (and a part's fit and price); the saved transcript spells them out. */
function transcriptText(message: Message): string {
  const reply = message.reply
  if (reply?.kind !== 'products') return message.text
  const named = reply.productIds.map((id) => {
    const name = productById(id)?.name
    return name && reply.notes?.[id] ? `${name} (${reply.notes[id]})` : name
  })
  return `${message.text} ${named.filter(Boolean).join(', ')}.`
}

/** Saves the chat so far under the chatbot's Conversations in the admin. */
function record(): void {
  const topic = thread.value.map((m) => (m.reply?.kind === 'text' && m.reply.topic) || (m.reply ? TOPICS[m.reply.kind] : undefined)).find(Boolean) ?? 'General question'
  chatbots.recordConversation({
    id: conversationId,
    chatbotId: props.chatbot.id,
    visitor: state.value.email ?? shopper.emailFor(channelId.value) ?? 'Guest visitor',
    startedAt,
    topic,
    resolved,
    messages: thread.value.map((m) => ({ from: m.from, text: transcriptText(m), time: m.time })),
  })
}

async function send(text: string = draft.value): Promise<void> {
  const message = text.trim()
  if (!message || typing.value) return
  if (!conversationId) {
    conversationId = `live-${Date.now()}`
    startedAt = `Today, ${clock()}`
  }
  draft.value = ''
  offerPrompts.value = false
  say('shopper', message)
  typing.value = true
  await settle()
  // A short pause, so the answer reads as written rather than looked up.
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  resumeOnVehicle = false
  const turn = assistantReply(message, context(), state.value)
  state.value = turn.state
  if (turn.signedIn) shopper.signIn(channelId.value, turn.signedIn)
  // The shopper asked for this vehicle, or said yes to it; the reply says "Showing parts for your …".
  if (turn.vehicle) setVehicle(turn.vehicle)
  for (const reply of turn.replies) say('bot', reply.text, reply)
  typing.value = false
  offerPrompts.value = turn.offerPrompts
  resolved = !turn.offerPrompts
  record()
  await settle()
  field.value?.focus()
}

// ── The shopper's vehicle (an auto-parts store) ──────────────────────

/** The vehicle the chat is setting itself, so the watch below does not answer for it again. */
let settingVehicle = false
function setVehicle(vehicle: Vehicle): void {
  settingVehicle = true
  storefront.setVehicle(vehicle)
  settingVehicle = false
}

/** A "Choose your vehicle" was pressed: the vehicle chosen in the selector answers the question waiting for it. */
let resumeOnVehicle = false
/** Buttons already pressed, by message: each acts once. */
const used = ref<number[]>([])

async function act(message: Message, action: AssistantAction): Promise<void> {
  if (action.kind === 'choose-vehicle') {
    resumeOnVehicle = true
    storefront.chooseVehicle()
    return
  }
  used.value.push(message.id)
  setVehicle(action.vehicle)
  state.value = { ...state.value, offer: undefined, named: undefined }
  say('bot', `Showing parts for your ${vehicleLabel(action.vehicle)}.`)
  record()
  await settle()
}

// A vehicle chosen on the store (the header, a list, the selector the chat opened) replaces the
// one the chat was talking about. Chosen from the chat's own button, it answers the waiting question.
watch(() => storefront.vehicle.value, async (vehicle) => {
  if (settingVehicle) return
  state.value = { ...state.value, offer: undefined, named: undefined }
  const asked = state.value.asked
  const resume = resumeOnVehicle
  resumeOnVehicle = false
  if (!resume || !vehicle || !asked) return
  const turn = assistantReply(asked, context(), { ...state.value, asked: undefined })
  state.value = turn.state
  say('bot', `Showing parts for your ${vehicleLabel(vehicle)}.`)
  for (const reply of turn.replies) say('bot', reply.text, reply)
  record()
  await settle()
}, { flush: 'sync' })

// ── Cards ────────────────────────────────────────────────────────────

function productById(id: number): Product | undefined {
  return commerce.products.find((p) => p.id === id)
}

/** Price as the store's product cards read it ("From 399 kr"), by id: a women's and a men's piece may share a name. */
const priceText = computed(() => {
  const list = previewProducts(commerce.products, storefront.channel.value) ?? []
  return (product: Product): string => list.find((p) => p.id === product.id)?.price ?? ''
})

/**
 * On the richer theme drawing, a piece sold in colours or sizes is chosen on its
 * page: the card links there ("Choose a size") instead of adding a line without one.
 */
function choiceNeeded(product: Product): string | null {
  if (!storefront.sectionsDrawing.value) return null
  const kinds = (product.detail?.options ?? []).filter((o) => o.values.length > 1).map(optionKind)
  if (kinds.includes('size')) return 'Choose a size'
  if (kinds.includes('color')) return 'Choose a color'
  return kinds.length ? 'Choose options' : null
}

const added = ref<number[]>([])
async function addToCart(product: Product): Promise<void> {
  // On a parts store the line carries the shopper's vehicle when the part fits it, as every other Add to cart does.
  const vehicle = storefront.sellsParts.value ? chatLineVehicle(product, storefront.vehicle.value) : undefined
  cart.add(channelId.value, product, 1, vehicle ? { vehicle } : undefined)
  added.value.push(product.id)
  say('bot', `Added ${product.name} to your cart.`, { kind: 'text', text: '', link: { label: 'View cart', href: '/cart-page' } })
  record()
  await settle()
}

/** A subscription card shows the subscription as it is now, so a skip made here shows on it. */
function live(id: string) {
  return subscriptions.contractById(id)
}

async function skip(id: string): Promise<void> {
  const before = live(id)
  if (!before || !subscriptions.skipNext(id, 'customer')) return
  say('bot', `Done. I skipped that delivery, so your next ${before.product} delivery is now ${day.value(live(id)!.nextChargeOn!)}. Nothing is charged before then.`)
  record()
  await settle()
}

// ── Open and close ───────────────────────────────────────────────────

const open = ref(false)
const launcher = ref<HTMLButtonElement | null>(null)

async function show(): Promise<void> {
  open.value = true
  await settle()
  field.value?.focus()
}

async function hide(): Promise<void> {
  open.value = false
  await nextTick()
  launcher.value?.focus()
}

/** On a phone the panel covers the page, so following a link out of the chat closes it. */
function followed(): void {
  if (window.matchMedia('(max-width: 640px)').matches) open.value = false
}

// ── Out of the way (the sections drawing) ────────────────────────────
// An IntersectionObserver whose root is cut down, by its root margin, to the corner
// the launcher sits in: from just above and beside the launcher to the window's
// bottom edge and its own side. Anything marked `data-sf-clear` in that band hides
// the launcher. The band is measured again when the window or the launcher changes
// size; the marked controls are found again when the page changes.

/** Room kept around the launcher, so a control just touching it counts. */
const CLEAR_PAD = 8
const covered = ref(false)
const launcherFocused = ref(false)
/** The launcher is stepping aside: never while the chat is open, or while it has focus. */
const clear = computed(() => storefront.sectionsDrawing.value && covered.value && !open.value && !launcherFocused.value)

let clearObserver: IntersectionObserver | undefined
/** The marked controls being watched, and those in the band now. */
let watched: Element[] = []
const under = new Set<Element>()

/** The root margin that leaves only the launcher's corner of the window; null while the launcher is not shown. */
function band(): string | null {
  const rect = launcher.value?.getBoundingClientRect()
  if (!rect?.width) return null
  const width = document.documentElement.clientWidth
  const onLeft = cfg.value.position === 'left'
  const left = onLeft ? 0 : Math.max(0, rect.left - CLEAR_PAD)
  const right = onLeft ? Math.min(width, rect.right + CLEAR_PAD) : width
  const top = Math.max(0, rect.top - CLEAR_PAD)
  return `${-Math.round(top)}px ${-Math.round(width - right)}px 0px ${-Math.round(left)}px`
}

/** Finds the marked controls on the page: new ones are watched, gone ones let go. */
function track(): void {
  const observer = clearObserver
  if (!observer) return
  const now = [...document.querySelectorAll('[data-sf-clear]')]
  let gone = false
  for (const el of watched) {
    if (now.includes(el)) continue
    observer.unobserve(el)
    gone = under.delete(el) || gone
  }
  for (const el of now) if (!watched.includes(el)) observer.observe(el)
  watched = now
  if (gone || !now.length) covered.value = under.size > 0
}

/** Starts watching the band again, measured as the launcher is now. */
function watchBand(): void {
  clearObserver?.disconnect()
  clearObserver = undefined
  watched = []
  under.clear()
  const margin = storefront.sectionsDrawing.value && typeof IntersectionObserver !== 'undefined' ? band() : null
  if (margin === null) {
    covered.value = false
    return
  }
  clearObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) under.add(entry.target)
      else under.delete(entry.target)
    }
    covered.value = under.size > 0
  }, { rootMargin: margin })
  track()
}

let launcherSize: ResizeObserver | undefined
let pageChanges: MutationObserver | undefined
let retrack = 0
/** Many changes to the page in one frame are one look for marked controls. */
function soon(): void {
  if (retrack || !clearObserver) return
  retrack = window.requestAnimationFrame(() => {
    retrack = 0
    track()
  })
}

onMounted(() => {
  window.addEventListener('resize', watchBand)
  if (typeof ResizeObserver !== 'undefined' && launcher.value) {
    launcherSize = new ResizeObserver(() => watchBand())
    launcherSize.observe(launcher.value)
  } else {
    watchBand()
  }
  if (typeof MutationObserver !== 'undefined') {
    pageChanges = new MutationObserver(soon)
    pageChanges.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sf-clear'] })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', watchBand)
  launcherSize?.disconnect()
  pageChanges?.disconnect()
  clearObserver?.disconnect()
  window.cancelAnimationFrame(retrack)
})

watch(() => storefront.sectionsDrawing.value, watchBand)
watch(() => route.fullPath, track, { flush: 'post' })
</script>

<template>
  <div class="sf-chat" :class="[`sf-chat--${cfg.position}`, { 'sf-chat--touch': storefront.sectionsDrawing.value, 'sf-chat--clear': clear }]" :style="brandVars">
    <section v-if="open" id="sf-chat-panel" class="sf-chat__panel" role="dialog" :aria-label="`Chat with ${cfg.brandName}`" @keydown.esc="hide">
      <header class="sf-chat__head">
        <span class="sf-chat__avatar" aria-hidden="true"><v-icon size="18">message-circle</v-icon></span>
        <div class="sf-chat__who">
          <h2 class="sf-chat__name">{{ cfg.brandName }}</h2>
          <p class="sf-chat__sub">{{ cfg.brandSubtitle }}</p>
        </div>
        <button type="button" class="sf-chat__close" aria-label="Close chat" @click="hide"><v-icon size="20">x</v-icon></button>
      </header>

      <div ref="body" class="sf-chat__body" role="log" aria-live="polite" aria-label="Conversation">
        <div class="sf-chat__msg sf-chat__msg--bot">
          <p class="sf-chat__bubble">{{ cfg.welcomeMessage }}</p>
        </div>

        <div v-for="message in thread" :key="message.id" class="sf-chat__msg" :class="`sf-chat__msg--${message.from}`">
          <span class="sf-chat__sr">{{ message.from === 'bot' ? `${cfg.brandName} says:` : 'You said:' }}</span>
          <p v-if="message.text" class="sf-chat__bubble">{{ message.text }}</p>

          <!-- A link the answer points to: the contact page, the cart, the page an answer came from. -->
          <template v-if="message.reply?.kind === 'text' || message.reply?.kind === 'answer'">
            <p v-if="message.reply.kind === 'answer'" class="sf-chat__source">From {{ message.reply.source.toLowerCase() }}</p>
            <StorefrontAnchor v-if="message.reply.link" :href="message.reply.link.href" class="sf-chat__link" @click="followed">
              {{ message.reply.link.label }} <v-icon size="14" aria-hidden="true">arrow-right</v-icon>
            </StorefrontAnchor>
            <button
              v-if="message.reply.kind === 'text' && message.reply.action"
              type="button"
              class="sf-chat__btn"
              :disabled="used.includes(message.id)"
              @click="act(message, message.reply.action)"
            >
              <v-icon size="16" aria-hidden="true">{{ message.reply.action.kind === 'choose-vehicle' ? 'car-front' : 'check' }}</v-icon>
              {{ message.reply.action.label }}
            </button>
          </template>

          <ul v-else-if="message.reply?.kind === 'products'" class="sf-chat__cards">
            <template v-for="id in message.reply.productIds" :key="id">
              <li v-if="productById(id)" class="sf-chat__product">
                <span class="sf-chat__thumb" aria-hidden="true">
                  <img v-if="productById(id)!.imageUrls?.[0]" :src="productById(id)!.imageUrls![0]" alt="">
                  <v-icon v-else size="22">package</v-icon>
                </span>
                <div class="sf-chat__product-text">
                  <strong>{{ productById(id)!.name }}</strong>
                  <!-- A part's line says how it fits and what it costs: "Front or rear · $64.99". -->
                  <span v-if="message.reply.notes?.[id]" class="sf-chat__note">{{ message.reply.notes[id] }}</span>
                  <template v-else>
                    <span v-if="productById(id)!.detail?.subtitle" class="sf-chat__muted">{{ productById(id)!.detail!.subtitle }}</span>
                    <span>{{ priceText(productById(id)!) }}</span>
                  </template>
                </div>
                <div class="sf-chat__product-actions">
                  <StorefrontAnchor :href="`/products/${productHandle(productById(id)!)}`" class="sf-chat__btn sf-chat__btn--quiet" @click="followed">
                    View<span class="sf-chat__sr"> {{ productById(id)!.name }}</span>
                  </StorefrontAnchor>
                  <StorefrontAnchor v-if="choiceNeeded(productById(id)!)" :href="`/products/${productHandle(productById(id)!)}`" class="sf-chat__btn" @click="followed">
                    {{ choiceNeeded(productById(id)!) }}<span class="sf-chat__sr"> for {{ productById(id)!.name }}</span>
                  </StorefrontAnchor>
                  <button v-else type="button" class="sf-chat__btn" :disabled="added.includes(id) || !inStock(productById(id)!)" @click="addToCart(productById(id)!)">
                    {{ !inStock(productById(id)!) ? 'Sold out' : added.includes(id) ? 'Added' : 'Add to cart' }}<span class="sf-chat__sr"> {{ productById(id)!.name }}</span>
                  </button>
                </div>
              </li>
            </template>
          </ul>

          <dl v-else-if="message.reply?.kind === 'order'" class="sf-chat__card sf-chat__facts">
            <div><dt>Order</dt><dd>{{ message.reply.order.number }}</dd></div>
            <div><dt>Placed</dt><dd>{{ day(message.reply.order.date) }}</dd></div>
            <div><dt>Status</dt><dd>{{ /shipped/i.test(message.reply.order.fulfillment) ? 'Shipped' : /cancel|refund/i.test(message.reply.order.status) ? message.reply.order.status : 'Being packed' }}</dd></div>
            <div><dt>Total</dt><dd>{{ message.reply.order.total }}</dd></div>
          </dl>

          <ul v-else-if="message.reply?.kind === 'subscriptions'" class="sf-chat__cards">
            <li v-for="card in message.reply.subscriptions" :key="card.id" class="sf-chat__card">
              <dl class="sf-chat__facts">
                <div><dt>Subscription</dt><dd>{{ card.product }}</dd></div>
                <div><dt>Plan</dt><dd>{{ live(card.id)?.plan.name ?? card.plan }}</dd></div>
                <div>
                  <dt>{{ (live(card.id)?.status ?? card.status) === 'Active' ? 'Next delivery' : 'Status' }}</dt>
                  <dd>{{ (live(card.id)?.status ?? card.status) === 'Active' ? day((live(card.id)?.nextChargeOn ?? card.nextChargeOn)!) : (live(card.id)?.status ?? card.status) }}</dd>
                </div>
                <div><dt>Per delivery</dt><dd>{{ card.price }}</dd></div>
              </dl>
              <div class="sf-chat__card-actions">
                <button v-if="live(card.id) && allowedActions(live(card.id)!).includes('skip')" type="button" class="sf-chat__btn" @click="skip(card.id)">
                  Skip next delivery
                </button>
                <StorefrontAnchor href="/account" class="sf-chat__btn sf-chat__btn--quiet" @click="followed">Manage subscription</StorefrontAnchor>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="typing" class="sf-chat__msg sf-chat__msg--bot">
          <p class="sf-chat__bubble sf-chat__typing"><span /><span /><span /><span class="sf-chat__sr">{{ cfg.brandName }} is typing</span></p>
        </div>

        <ul v-if="offerPrompts && !typing && prompts.length" class="sf-chat__prompts" aria-label="Suggested questions">
          <li v-for="prompt in prompts" :key="prompt">
            <button type="button" class="sf-chat__prompt" @click="send(prompt)">{{ prompt }}</button>
          </li>
        </ul>
      </div>

      <form class="sf-chat__input" @submit.prevent="send()">
        <label for="sf-chat-field" class="sf-chat__sr">Your message</label>
        <input id="sf-chat-field" ref="field" v-model="draft" class="sf-chat__field" :placeholder="placeholder" autocomplete="off">
        <button type="submit" class="sf-chat__send" aria-label="Send" :disabled="!draft.trim() || typing"><v-icon size="18">send</v-icon></button>
      </form>
    </section>

    <button
      ref="launcher"
      type="button"
      class="sf-chat__launcher"
      :aria-expanded="open"
      aria-controls="sf-chat-panel"
      :aria-label="open ? 'Close chat' : `Chat with ${cfg.brandName}`"
      :tabindex="clear ? -1 : undefined"
      @click="open ? hide() : show()"
      @focus="launcherFocused = true"
      @blur="launcherFocused = false"
    >
      <v-icon size="22" aria-hidden="true">{{ open ? 'x' : 'message-circle' }}</v-icon>
      <span v-if="!open && cfg.launcherTextEnabled && cfg.launcherText" class="sf-chat__launcher-text">{{ cfg.launcherText }}</span>
    </button>
  </div>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. The widget takes the
   chatbot's own colour (--chat-brand, with a text colour that reads on it), not the
   store theme's, and every surface it paints sets its own text colour. */
.sf-chat {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  font-family: var(--sf-body-font, inherit);
}

.sf-chat--left {
  right: auto;
  left: 20px;
  align-items: flex-start;
}

.sf-chat__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.sf-chat__launcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 56px;
  height: 56px;
  padding: 0 17px;
  border: 0;
  border-radius: 999px;
  background: var(--chat-brand);
  color: var(--chat-on-brand);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.sf-chat__launcher:focus-visible,
.sf-chat__close:focus-visible,
.sf-chat__send:focus-visible,
.sf-chat__btn:focus-visible,
.sf-chat__prompt:focus-visible,
.sf-chat__link:focus-visible {
  outline: 2px solid var(--chat-brand);
  outline-offset: 2px;
}

.sf-chat__panel {
  display: flex;
  flex-direction: column;
  width: 380px;
  max-width: calc(100vw - 40px);
  height: min(620px, calc(100vh - 120px));
  overflow: hidden;
  border-radius: 16px;
  background: #ffffff;
  color: #121011;
  box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.sf-chat__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--chat-brand);
  color: var(--chat-on-brand);
}

.sf-chat__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--chat-on-brand) 18%, transparent);
}

.sf-chat__who {
  flex: 1;
  min-width: 0;
}

.sf-chat__name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.sf-chat__sub {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.sf-chat__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: inherit;
  cursor: pointer;
}

.sf-chat__close:focus-visible {
  outline-color: var(--chat-on-brand);
}

.sf-chat__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  background: #f7f7f5;
}

.sf-chat__msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  max-width: 92%;
}

.sf-chat__msg--shopper {
  align-self: flex-end;
  align-items: flex-end;
}

.sf-chat__bubble {
  margin: 0;
  padding: 10px 14px;
  border-radius: 14px 14px 14px 4px;
  background: #ffffff;
  color: #121011;
  font-size: 14px;
  line-height: 1.45;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.sf-chat__msg--shopper .sf-chat__bubble {
  border-radius: 14px 14px 4px 14px;
  background: var(--chat-brand);
  color: var(--chat-on-brand);
  box-shadow: none;
}

.sf-chat__source,
.sf-chat__muted {
  margin: 0;
  color: #5f5f5f;
  font-size: 12px;
}

.sf-chat__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #121011;
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
}

.sf-chat__cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sf-chat__product,
.sf-chat__card {
  padding: 12px;
  border-radius: 12px;
  background: #ffffff;
  color: #121011;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.sf-chat__product {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 10px 12px;
  align-items: center;
}

.sf-chat__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0ee;
  color: #5f5f5f;
}

.sf-chat__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sf-chat__product-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: 13px;
}

.sf-chat__product-text strong {
  font-size: 14px;
}

.sf-chat__note {
  font-variant-numeric: tabular-nums;
}

.sf-chat__product-actions,
.sf-chat__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sf-chat__product-actions {
  grid-column: 1 / -1;
}

.sf-chat__card-actions {
  margin-top: 12px;
}

.sf-chat__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--chat-brand);
  border-radius: 999px;
  background: var(--chat-brand);
  color: var(--chat-on-brand);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.sf-chat__btn--quiet {
  border-color: #c9c9c9;
  background: #ffffff;
  color: #121011;
}

.sf-chat__btn:disabled {
  border-color: #e3e3e1;
  background: #e3e3e1;
  color: #5f5f5f;
  cursor: default;
}

.sf-chat__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  width: 100%;
  margin: 0;
}

.sf-chat__facts dt {
  color: #5f5f5f;
  font-size: 12px;
}

.sf-chat__facts dd {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.sf-chat__prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.sf-chat__prompt {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #c9c9c9;
  border-radius: 999px;
  background: #ffffff;
  color: #121011;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.sf-chat__prompt:hover {
  border-color: var(--chat-brand);
}

.sf-chat__typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 14px;
}

.sf-chat__typing > span:not(.sf-chat__sr) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8a8a8a;
  animation: sf-chat-dot 1s infinite ease-in-out;
}

.sf-chat__typing > span:nth-child(2) { animation-delay: 0.15s; }
.sf-chat__typing > span:nth-child(3) { animation-delay: 0.3s; }

@keyframes sf-chat-dot {
  0%, 60%, 100% { opacity: 0.35; }
  30% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .sf-chat__typing > span:not(.sf-chat__sr) {
    animation: none;
  }
}

.sf-chat__input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e3e3e1;
  background: #ffffff;
}

.sf-chat__field {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #8a8a8a;
  border-radius: 999px;
  background: #ffffff;
  color: #121011;
  font: inherit;
  font-size: 14px;
}

.sf-chat__field::placeholder {
  color: #6b6b6b;
}

.sf-chat__field:focus-visible {
  outline: 2px solid var(--chat-brand);
  outline-offset: 1px;
}

.sf-chat__send {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--chat-brand);
  color: var(--chat-on-brand);
  cursor: pointer;
}

.sf-chat__send:disabled {
  background: #e3e3e1;
  color: #5f5f5f;
  cursor: default;
}

/* The richer theme drawing: the launcher fades out while a marked control is under it. */
.sf-chat--touch .sf-chat__launcher {
  transition: opacity 160ms ease;
}

.sf-chat--clear {
  pointer-events: none;
}

.sf-chat--clear .sf-chat__launcher {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sf-chat--touch .sf-chat__launcher {
    transition: none;
  }
}

/* A phone: the panel is the screen, and the launcher steps aside while it is open. */
@media (max-width: 640px) {
  .sf-chat {
    right: 16px;
    bottom: 16px;
  }

  .sf-chat--left {
    left: 16px;
  }

  .sf-chat__panel {
    position: fixed;
    inset: 0;
    width: auto;
    max-width: none;
    height: auto;
    border-radius: 0;
  }

  .sf-chat__panel + .sf-chat__launcher {
    display: none;
  }

  /* The richer theme drawing (Northfold, Torqline): the launcher is a 48px circle, its words
     hidden (the button keeps its name), and every control is a 44px touch target. */
  .sf-chat--touch .sf-chat__launcher {
    justify-content: center;
    width: 48px;
    min-width: 48px;
    height: 48px;
    padding: 0;
  }

  .sf-chat--touch .sf-chat__launcher-text {
    display: none;
  }

  .sf-chat--touch .sf-chat__btn,
  .sf-chat--touch .sf-chat__prompt {
    min-height: 44px;
  }

  .sf-chat--touch .sf-chat__close {
    width: 44px;
    height: 44px;
  }

  .sf-chat--touch .sf-chat__link {
    min-height: 44px;
  }
}
</style>
