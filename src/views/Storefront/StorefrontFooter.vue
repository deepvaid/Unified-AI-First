<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import { money } from '@/maropay/money'
import StorefrontAnchor from './StorefrontAnchor.vue'
import StorefrontPayMark from './StorefrontPayMark.vue'
import NewsletterForm from './sections/NewsletterForm.vue'
import { STOREFRONT } from './storefrontContext'
import { chromeSettings, flag, num, templateForRoute, text } from './sections/sectionSettings'

// The storefront's footer, hidden on the checkout. Two drawings:
// - classic: the markup StorefrontLayout has always drawn, moved here unchanged;
// - sections (Northfold, Torqline): the theme's footer section caps the link columns,
//   shows the social links or not, and paints light or dark. The wordmark leads, with
//   the newsletter under it; the home page leaves the newsletter out of the footer
//   when the page has a newsletter section of its own. The ways to pay and the
//   copyright close it.

const storefront = inject(STOREFRONT)!
const route = useRoute()

const chrome = computed(() => storefront.chrome.value)
const minimal = computed(() => route.meta.minimalChrome === true)
const footerMarks = computed(() => storefront.offerFor(money(0, storefront.currency.value)).acceptedMarks)

// ── Classic newsletter ──────────────────────────────────────────────────
const email = ref('')
const consent = ref(false)
const subscribing = ref(false)
const subscribed = ref(false)
const canSubscribe = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) && consent.value && !subscribing.value)

function subscribe(): void {
  if (!canSubscribe.value) return
  subscribing.value = true
  window.setTimeout(() => {
    subscribing.value = false
    subscribed.value = true
    email.value = ''
    consent.value = false
  }, 600)
}

// ── Sections drawing ────────────────────────────────────────────────────
const settings = computed(() => chromeSettings(storefront.theme.value, templateForRoute(route.name), 'footer'))
const dark = computed(() => text(settings.value, 'colorScheme') === 'Dark')
const columns = computed(() => chrome.value.footerColumns.slice(0, Math.max(1, num(settings.value, 'columns', 3))))
const social = computed(() => (flag(settings.value, 'showSocial') ? chrome.value.social : []))
/** The home page's own newsletter section asks for the same thing: one form a page is enough. */
const newsletterOnPage = computed(() => route.name === 'StorefrontHome'
  && (storefront.theme.value?.templates.home ?? []).some((s) => s.kind === 'newsletter' && !s.hidden))
</script>

<template>
  <template v-if="!minimal">
    <!-- ── Sections drawing ──────────────────────────────────────────── -->
    <footer v-if="storefront.sectionsDrawing.value" class="sff" :class="{ 'sff--dark': dark }">
      <div class="sff__grid">
        <div class="sff__lead">
          <StorefrontAnchor href="/" class="sff__wordmark">{{ chrome.wordmark }}</StorefrontAnchor>
          <template v-if="chrome.newsletter && !newsletterOnPage">
            <h2 class="sff__heading">{{ chrome.newsletter.heading }}</h2>
            <NewsletterForm />
          </template>
          <ul v-if="social.length" class="sff__social" aria-label="Social links">
            <li v-for="item in social" :key="item.label">
              <StorefrontAnchor :href="item.href" class="sff__social-link" :aria-label="item.label">
                <v-icon size="20" aria-hidden="true">{{ item.icon }}</v-icon>
              </StorefrontAnchor>
            </li>
          </ul>
        </div>
        <nav v-for="column in columns" :key="column.heading.label" class="sff__col" :aria-label="column.heading.label">
          <h2 class="sff__heading">{{ column.heading.label }}</h2>
          <ul>
            <li v-for="item in column.items" :key="item.label">
              <StorefrontAnchor :href="item.href" class="sff__link">{{ item.label }}</StorefrontAnchor>
            </li>
          </ul>
        </nav>
      </div>
      <div class="sff__base">
        <p v-if="chrome.copyright" class="sff__copyright">{{ chrome.copyright }}</p>
        <ul v-if="footerMarks.length" class="sff__marks" aria-label="Ways to pay">
          <li v-for="mark in footerMarks" :key="mark"><StorefrontPayMark :mark="mark" /></li>
        </ul>
      </div>
    </footer>

    <!-- ── Classic (moved unchanged from StorefrontLayout) ───────────────── -->
    <footer v-else-if="chrome.footerColumns.length || chrome.newsletter || chrome.copyright || footerMarks.length" class="sf-foot">
      <div v-if="chrome.footerColumns.length || chrome.newsletter" class="sf-foot__grid">
        <div v-for="column in chrome.footerColumns" :key="column.heading.label" class="sf-foot__col">
          <StorefrontAnchor :href="column.heading.href" class="sf-foot__heading">{{ column.heading.label }}</StorefrontAnchor>
          <ul>
            <li v-for="item in column.items" :key="item.label">
              <StorefrontAnchor :href="item.href">{{ item.label }}</StorefrontAnchor>
            </li>
          </ul>
        </div>

        <form v-if="chrome.newsletter" class="sf-foot__col sf-newsletter" novalidate @submit.prevent="subscribe">
          <p class="sf-foot__heading">{{ chrome.newsletter.heading }}</p>
          <input v-model="email" type="email" required :placeholder="chrome.newsletter.placeholder" :aria-label="chrome.newsletter.placeholder" class="sf-input">
          <label class="sf-newsletter__consent">
            <input v-model="consent" type="checkbox">
            <span>
              <template v-for="(part, index) in chrome.newsletter.consent" :key="index">
                <template v-if="typeof part === 'string'">{{ part }}</template>
                <StorefrontAnchor v-else :href="part.href">{{ part.label }}</StorefrontAnchor>
              </template>
            </span>
          </label>
          <button type="submit" class="sf-button" :disabled="!canSubscribe">
            {{ subscribing ? chrome.newsletter.busy : chrome.newsletter.button }}
          </button>
          <p v-if="subscribed && chrome.newsletter.success" class="sf-newsletter__done" role="status">{{ chrome.newsletter.success }}</p>
        </form>
      </div>
      <ul v-if="footerMarks.length" class="sf-foot__marks" aria-label="Ways to pay">
        <li v-for="mark in footerMarks" :key="mark"><StorefrontPayMark :mark="mark" /></li>
      </ul>
      <p v-if="chrome.copyright" class="sf-foot__copyright">{{ chrome.copyright }}</p>
    </footer>
  </template>
</template>

<style scoped>
/* ─────────────────────────────────────────────────────────────────────────────
 * P4-8 — DELIBERATELY OUT OF SYSTEM, like the rest of the storefront (see
 * StorefrontLayout.vue). The classic rules are moved from StorefrontLayout
 * unchanged; the sections drawing's (.sff*) follow the theme's footer settings.
 * ───────────────────────────────────────────────────────────────────────────── */

/* ── Classic ─────────────────────────────────────────────────────────── */
.sf-foot a {
  color: inherit;
  text-decoration: none;
}

.sf-foot a:hover {
  text-decoration: underline;
}

.sf-foot {
  border-top: 1px solid var(--sf-divider);
  margin-top: 48px;
}

.sf-foot__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 1.4fr;
  gap: 32px;
  max-width: var(--sf-measure);
  margin: 0 auto;
  padding: 40px var(--sf-gutter);
}

.sf-foot__col ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.sf-foot__heading {
  display: inline-block;
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.sf-newsletter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sf-input {
  height: 50px;
  padding: 0 14px;
  border: 1px solid var(--sf-divider);
  border-radius: 4px;
  background: var(--sf-bg, var(--sf-bg-fallback));
  color: inherit;
  font: inherit;
}

.sf-newsletter__done {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
}

.sf-newsletter__consent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 18px;
}

.sf-newsletter__consent a {
  text-decoration: underline;
}

.sf-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--sf-radius, 6px);
  background: var(--sf-brand, var(--sf-text-fallback));
  color: var(--sf-bg, var(--sf-bg-fallback));
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.sf-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sf-foot__marks {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: var(--sf-measure);
  margin: 0 auto;
  padding: 0 var(--sf-gutter) 24px;
  list-style: none;
}

.sf-foot__copyright {
  margin: 0;
  padding: 16px var(--sf-gutter) 24px;
  border-top: 1px solid var(--sf-divider);
  text-align: center;
  font-size: 13px;
}

@media (max-width: 900px) {
  .sf-foot__grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* ── Sections drawing ────────────────────────────────────────────────── */
.sff {
  /* Matched by the newsletter band's negative margin when the band closes the home page (sections/Newsletter.vue). */
  margin-top: 96px;
  border-top: 1px solid var(--sf-divider, #e5e5e5);
  background: var(--sf-bg, #ffffff);
  color: var(--sf-text, #121011);
}

.sff--dark {
  --sf-accent: var(--sf-on-brand, #ffffff);
  --sf-focus: var(--sf-on-brand, #ffffff);
  border-top-color: transparent;
  background: var(--sf-brand, #121011);
  color: var(--sf-on-brand, #ffffff);
}

.sff a {
  color: inherit;
  text-decoration: none;
}

.sff__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(auto-fit, minmax(150px, 1fr));
  gap: 48px 40px;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 64px var(--sf-gutter, 24px) 56px;
}

.sff__lead {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.sff__wordmark {
  margin-bottom: 8px;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 34px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1;
  letter-spacing: -0.01em;
  text-transform: var(--sf-heading-case, none);
}

.sff__heading {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sff__col ul {
  display: flex;
  flex-direction: column;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

/* 32px rows: the links are easy to hit, and still read as a list. */
.sff__link {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-size: 15px;
}

.sff__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sff__social {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sff__social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.sff__wordmark:focus-visible,
.sff__link:focus-visible,
.sff__social-link:focus-visible {
  outline: 2px solid var(--sf-focus, var(--sf-accent, #2563eb));
  outline-offset: 2px;
}

/* Its hairline runs the width of the columns above it, gutter to gutter. */
.sff__base {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: calc(100% - 2 * var(--sf-gutter, 24px));
  max-width: calc(var(--sf-measure, 1200px) - 2 * var(--sf-gutter, 24px));
  margin: 0 auto;
  padding: 20px 0 32px;
  border-top: 1px solid var(--sf-divider, #e5e5e5);
}

.sff--dark .sff__base {
  border-top-color: color-mix(in srgb, currentColor 20%, transparent);
}

.sff__copyright {
  margin: 0;
  color: var(--sf-muted, inherit);
  font-size: 13px;
}

.sff--dark .sff__copyright {
  color: inherit;
}

.sff__marks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 900px) {
  .sff {
    margin-top: 64px;
  }

  .sff__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 40px 24px;
    padding-top: 48px;
  }

  .sff__lead {
    grid-column: 1 / -1;
  }
}

@media (max-width: 420px) {
  .sff__base {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
