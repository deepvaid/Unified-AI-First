<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ThemeSection } from '@/storefront/themeSections'
import { STOREFRONT } from '../storefrontContext'
import NewsletterForm from './NewsletterForm.vue'
import { text } from './sectionSettings'

// A band asking shoppers to sign up for the store's emails: the `newsletter`
// section, with its headline and button label over the store's sign-up form
// (the field, consent and thank-you line of its newsletter). A store without a
// newsletter shows nothing here.

const props = defineProps<{ section: ThemeSection }>()

const storefront = inject(STOREFRONT)!
const headline = computed(() => text(props.section.settings, 'headline', storefront.chrome.value.newsletter?.heading ?? 'Sign up'))
const buttonLabel = computed(() => text(props.section.settings, 'buttonLabel'))
</script>

<template>
  <section v-if="storefront.chrome.value.newsletter" class="sfl" :aria-labelledby="`${section.id}-title`">
    <div class="sfl__inner">
      <h2 :id="`${section.id}-title`" class="sfl__title">{{ headline }}</h2>
      <NewsletterForm :button-label="buttonLabel" inline />
    </div>
  </section>
</template>

<style scoped>
/* P4-8 — out of system on purpose: see StorefrontLayout.vue. A band of the theme's
   quiet surface, the full width of the page, so it reads as a pause before the footer. */
.sfl {
  margin-top: 96px;
  background: var(--sf-surface, #f1f1f1);
  color: var(--sf-text, #121011);
}

/* The band closes the home page when it comes last: the footer sits right under it, not a gap away. */
.sf-home--sections > .sfl:last-child {
  margin-bottom: -96px;
}

.sfl__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  box-sizing: border-box;
  max-width: var(--sf-measure, 1200px);
  margin: 0 auto;
  padding: 80px var(--sf-gutter, 24px);
  text-align: center;
}

.sfl__inner :deep(.sfn) {
  text-align: left;
}

.sfl__title {
  max-width: 18ch;
  margin: 0;
  font-family: var(--sf-heading-font, system-ui), Georgia, serif;
  font-size: 44px;
  font-weight: var(--sf-heading-weight, 700);
  line-height: 1.08;
  letter-spacing: -0.01em;
  text-transform: var(--sf-heading-case, none);
  text-wrap: balance;
}

@media (max-width: 900px) {
  .sfl {
    margin-top: 64px;
  }

  .sf-home--sections > .sfl:last-child {
    margin-bottom: -64px;
  }

  .sfl__inner {
    gap: 20px;
    padding-block: 56px;
  }

  .sfl__title {
    font-size: 32px;
  }
}
</style>
