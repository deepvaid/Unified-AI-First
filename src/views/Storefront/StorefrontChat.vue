<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import { NEW_CONVERSATION, assistantReply } from '@/chatbot/storeAssistant'
import type { AssistantContext, AssistantReply, AssistantState } from '@/chatbot/storeAssistant'
import { money, parseDecimal } from '@/maropay/money'
import { useChatbotStore } from '@/stores/useChatbot'
import type { Chatbot } from '@/stores/useChatbot'
import { useCommerceStore } from '@/stores/useCommerce'
import type { Product } from '@/stores/useCommerce'
import { useStorefrontCartStore } from '@/stores/useStorefrontCart'
import { useStorefrontShopperStore } from '@/stores/useStorefrontShopper'
import { useSubscriptionsStore } from '@/stores/useSubscriptions'
import { allowedActions, chargeAmount, dayLabel } from '@/subscriptions/contracts'
import { onBrand } from '@/utils/brandContrast'
import StorefrontAnchor from './StorefrontAnchor.vue'
import { STOREFRONT } from './storefrontContext'
import { inStock, previewProducts, productHandle, storefrontProducts } from './storefrontCatalog'

// The store's chatbot, as its shoppers meet it: a launcher in the corner and a
// chat panel. How it looks and what it opens with come from the chatbot's own
// settings (Service › Chatbots in the admin), so the builder controls it. What it
// answers is src/chatbot/storeAssistant.ts: scripted rules over this store's real
// orders, subscriptions, products and pages. Nothing is sent anywhere.
//
// It can also act: add a suggested product to the cart, and skip a subscription's
// next delivery. Each chat is saved to the chatbot's Conversations in the admin.

const props = defineProps<{ chatbot: Chatbot }>()

const storefront = inject(STOREFRONT)!
const commerce = useCommerceStore()
const chatbots = useChatbotStore()
const cart = useStorefrontCartStore()
const shopper = useStorefrontShopperStore()
const subscriptions = useSubscriptionsStore()

const cfg = computed(() => props.chatbot.config)
const channelId = computed(() => storefront.channel.value.id)
const brandVars = computed(() => ({ '--chat-brand': cfg.value.primaryColor, '--chat-on-brand': onBrand(cfg.value.primaryColor) }))
const prompts = computed(() => cfg.value.quickPrompts.filter((p) => p.enabled).map((p) => p.text))

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
    products: storefrontProducts(commerce.products, channelId.value).filter(inStock).map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.detail?.subtitle ?? '',
      description: p.detail?.description ?? '',
      collections: p.collections,
    })),
    entries: cfg.value.knowledgeSources
      .filter((s) => s.enabled && s.status === 'Active')
      .flatMap((s) => (s.entries ?? []).map((e) => ({ title: e.title, text: e.text, url: e.url, source: s.name }))),
    shoppingEnabled: cfg.value.shopping.enabled,
    trackingEnabled: cfg.value.orderTracking.enabled,
    demo: storefront.demo.value,
  }
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

/** A product reply's cards carry the names; the saved transcript spells them out. */
function transcriptText(message: Message): string {
  const reply = message.reply
  if (reply?.kind !== 'products') return message.text
  return `${message.text} ${reply.productIds.map((id) => productById(id)?.name).filter(Boolean).join(', ')}.`
}

/** Saves the chat so far under the chatbot's Conversations in the admin. */
function record(): void {
  const topic = thread.value.map((m) => (m.reply ? TOPICS[m.reply.kind] : undefined)).find(Boolean) ?? 'General question'
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
  const turn = assistantReply(message, context(), state.value)
  state.value = turn.state
  if (turn.signedIn) shopper.signIn(channelId.value, turn.signedIn)
  for (const reply of turn.replies) say('bot', reply.text, reply)
  typing.value = false
  offerPrompts.value = turn.offerPrompts
  resolved = !turn.offerPrompts
  record()
  await settle()
  field.value?.focus()
}

// ── Cards ────────────────────────────────────────────────────────────

function productById(id: number): Product | undefined {
  return commerce.products.find((p) => p.id === id)
}

/** Price as the store's product cards read it ("From 399 kr"). */
const priceText = computed(() => {
  const list = previewProducts(commerce.products, storefront.channel.value) ?? []
  return (product: Product): string => list.find((p) => p.name === product.name)?.price ?? ''
})

const added = ref<number[]>([])
async function addToCart(product: Product): Promise<void> {
  cart.add(channelId.value, product)
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
  say('bot', `Done. I skipped that delivery, so your next ${before.product} delivery is now ${dayLabel(live(id)!.nextChargeOn!)}. Nothing is charged before then.`)
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
</script>

<template>
  <div class="sf-chat" :class="`sf-chat--${cfg.position}`" :style="brandVars">
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
                  <span v-if="productById(id)!.detail?.subtitle" class="sf-chat__muted">{{ productById(id)!.detail!.subtitle }}</span>
                  <span>{{ priceText(productById(id)!) }}</span>
                </div>
                <div class="sf-chat__product-actions">
                  <StorefrontAnchor :href="`/products/${productHandle(productById(id)!)}`" class="sf-chat__btn sf-chat__btn--quiet" @click="followed">
                    View<span class="sf-chat__sr"> {{ productById(id)!.name }}</span>
                  </StorefrontAnchor>
                  <button type="button" class="sf-chat__btn" :disabled="added.includes(id)" @click="addToCart(productById(id)!)">
                    {{ added.includes(id) ? 'Added' : 'Add to cart' }}<span class="sf-chat__sr"> {{ productById(id)!.name }}</span>
                  </button>
                </div>
              </li>
            </template>
          </ul>

          <dl v-else-if="message.reply?.kind === 'order'" class="sf-chat__card sf-chat__facts">
            <div><dt>Order</dt><dd>{{ message.reply.order.number }}</dd></div>
            <div><dt>Placed</dt><dd>{{ dayLabel(message.reply.order.date) }}</dd></div>
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
                  <dd>{{ (live(card.id)?.status ?? card.status) === 'Active' ? dayLabel((live(card.id)?.nextChargeOn ?? card.nextChargeOn)!) : (live(card.id)?.status ?? card.status) }}</dd>
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
        <input id="sf-chat-field" ref="field" v-model="draft" class="sf-chat__field" placeholder="Ask about an order, a subscription or a product" autocomplete="off">
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
      @click="open ? hide() : show()"
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
}
</style>
