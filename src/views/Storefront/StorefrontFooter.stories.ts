import type { Meta, StoryObj } from '@storybook/vue3'
import { isolateStorage } from '@/stories/decorators'
import StorefrontFooter from './StorefrontFooter.vue'
import { withStorefront } from './sections/storyContext'

const meta = {
  title: 'Product/Storefront/StorefrontFooter',
  component: StorefrontFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### Overview
The storefront's footer, shown here in Northfold's theme. Hidden on the checkout. Two drawings:

- **Classic** — every theme but the sections drawing's: the markup the storefront has always drawn.
- **Sections** (\`styles.drawing: 'sections'\`: Northfold, Torqline, Lumos) — the theme's **footer
  section** caps the link \`columns\`, shows the social links or not (\`showSocial\`), and paints
  **Light** or **Dark** (\`colorScheme\`). The wordmark leads with the store's newsletter sign-up under
  it; the ways to pay and the copyright close it. On the home page the newsletter stays out of the
  footer when the page has a newsletter section of its own, so a page never asks twice.

The store's chrome can add (Lumos): a \`tagline\` under the wordmark; \`newsletterColumn\`, the
newsletter as the footer's last column ("Newsletter", with the store's own line under it); and
\`bottomLinks\`, the legal links beside the copyright (a "Legal" navigation).

### Newsletter
The button is never disabled: an empty or mistyped email, or the consent box left unticked, is said
under the field it belongs to, and focus goes there. Once signed up, the form gives way to the
store's thank-you line, which takes focus so a screen reader reads it. Nothing is sent anywhere.

Out of system on purpose (P4-8): it draws with the store's theme variables, not Marobase tokens.
        `,
      },
    },
  },
  decorators: [withStorefront(), isolateStorage],
} satisfies Meta<typeof StorefrontFooter>

export default meta
type Story = StoryObj<typeof meta>

/** Northfold's footer: the wordmark and newsletter, three link columns, the ways to pay. */
export const Default: Story = {}

/** The brand colour, with its own ink; two link columns. */
export const DarkTwoColumns: Story = {
  decorators: [withStorefront({ footer: { colorScheme: 'Dark', columns: 2 } })],
}

/** Lumos's chrome on Northfold's theme: a tagline, the newsletter as its own column, legal links beside the copyright. */
export const TaglineNewsletterColumnLegalLinks: Story = {
  decorators: [withStorefront({
    chrome: {
      tagline: 'Clothes made to be worn for years',
      newsletterColumn: true,
      bottomLinks: [
        { label: 'Privacy policy', href: '/policies/privacy-policy' },
        { label: 'Terms of service', href: '/policies/terms-of-service' },
        { label: 'Accessibility', href: '/page/accessibility' },
      ],
    },
  })],
}

/** Sign up with nothing filled in: each missing answer is said under its field, and focus goes to the first. */
export const NewsletterErrors: Story = {
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    canvasElement.querySelector<HTMLButtonElement>('.sfn button[type="submit"]')?.click()
  },
}

/** Vitaheal's footer: the classic drawing, exactly as before the sections drawing. */
export const Classic: Story = {
  decorators: [withStorefront({ channelId: 'vitaheal-demo' })],
}
