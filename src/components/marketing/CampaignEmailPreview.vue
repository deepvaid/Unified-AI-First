<script setup lang="ts">
/**
 * Mock rendering of a campaign's email content, standing in for the HTML the
 * real platform renders from the selected Email Content record. Merge tags are
 * shown verbatim ({{contact.first_name}}, …) exactly as UAT's preview does.
 */
withDefaults(defineProps<{
  contentName?: string
  /** Adds the "having trouble viewing this email" preview link row (UAT: Show email preview link). */
  showPreviewLink?: boolean
  /** Renders the email on a dark canvas, for dark-mode device previews. */
  dark?: boolean
}>(), {
  contentName: '',
  showPreviewLink: false,
  dark: false,
})
</script>

<template>
  <div class="cep" :class="{ 'cep--dark': dark }">
    <p v-if="showPreviewLink" class="cep__preview-link">
      Having trouble viewing this email? <span class="cep__link">View it in your browser</span>
    </p>
    <div class="cep__brand">
      <v-icon size="18" aria-hidden="true">send</v-icon>
      <span>MAROPOST STORE</span>
    </div>
    <div class="cep__hero">
      <h1 class="cep__headline">You Left Something Behind</h1>
      <p class="cep__sub">We noticed that you left something in your shopping cart.</p>
      <span class="cep__cta">Finish checking out</span>
    </div>
    <div class="cep__body">
      <p>Hi {{ '\{\{contact.first_name\}\}' }},</p>
      <p>We noticed you added some great items to your cart but didn't complete your purchase.</p>
      <p class="cep__strong">No worries — your cart is still waiting for you!</p>
      <p class="cep__items-label">Items</p>
      <div class="cep__items">
        <span>Total: ${{ '\{\{cart_total\}\}' }}</span>
      </div>
      <p class="cep__muted">
        Trouble checking out? We're here to help. For any questions just email us at
        <span class="cep__link">{{ '\{\{campaign.from_email\}\}' }}</span>
      </p>
    </div>
    <div class="cep__footer">
      <p>{{ '\{\{campaign.address\}\}' }}</p>
      <p><span class="cep__link">{{ '\{\{campaign.unsubscribe_link\}\}' }}</span></p>
    </div>
  </div>
</template>

<style scoped>
.cep {
  background: var(--surface-primary);
  color: var(--on-surface);
  border-radius: var(--mp-radius-8);
  padding: var(--mp-space-24);
  max-width: var(--mp-component-state-measureWide);
  margin-inline: auto;
  font-size: var(--mp-fontSize-13);
  line-height: 1.6;
}
.cep--dark {
  background: var(--ink-panel-bg);
  color: var(--ink-panel-fg);
}
.cep__preview-link {
  text-align: center;
  font-size: var(--mp-fontSize-11);
  color: var(--on-surface-muted);
  margin-bottom: var(--mp-space-12);
}
.cep--dark .cep__preview-link { color: var(--ink-panel-muted-fg); }
.cep__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mp-space-6);
  font-weight: 700;
  letter-spacing: 0.08em;
  font-size: var(--mp-fontSize-12);
  padding-block: var(--mp-space-12);
}
.cep__hero {
  background: var(--accent-container);
  color: var(--accent-on-container);
  border-radius: var(--mp-radius-8);
  text-align: center;
  padding: var(--mp-space-24) var(--mp-space-20);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-8);
  align-items: center;
}
.cep__headline { font-size: var(--mp-fontSize-20); line-height: 1.25; margin: 0; }
.cep__sub { margin: 0; }
.cep__cta {
  display: inline-block;
  background: var(--accent-default);
  color: var(--accent-on);
  border-radius: var(--mp-radius-full);
  padding: var(--mp-space-8) var(--mp-space-20);
  font-weight: 600;
  margin-top: var(--mp-space-4);
}
.cep__body { padding-block: var(--mp-space-16); display: flex; flex-direction: column; gap: var(--mp-space-8); }
.cep__body p { margin: 0; }
.cep__strong { font-weight: 700; }
.cep__items-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: var(--mp-fontSize-11);
  margin-top: var(--mp-space-8);
}
.cep__items {
  border-block: 1px solid var(--border-default);
  padding-block: var(--mp-space-8);
  font-weight: 600;
}
.cep--dark .cep__items { border-color: var(--ink-panel-muted-fg); }
.cep__muted { color: var(--on-surface-muted); }
.cep--dark .cep__muted { color: var(--ink-panel-muted-fg); }
.cep__footer {
  border-top: 1px solid var(--border-default);
  padding-top: var(--mp-space-12);
  text-align: center;
  font-size: var(--mp-fontSize-11);
  color: var(--on-surface-muted);
  display: flex;
  flex-direction: column;
  gap: var(--mp-space-4);
}
.cep--dark .cep__footer { color: var(--ink-panel-muted-fg); border-color: var(--ink-panel-muted-fg); }
.cep__footer p { margin: 0; }
.cep__link { color: var(--accent-default); text-decoration: underline; }
.cep--dark .cep__link { color: var(--ink-panel-accent); }
</style>
