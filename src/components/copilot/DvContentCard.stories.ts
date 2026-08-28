import type { Meta, StoryObj } from '@storybook/vue3'
import DvContentCard from './DvContentCard.vue'

const meta = {
  title: 'Product/Da Vinci/DvContentCard',
  component: DvContentCard,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['email', 'product', 'blog', 'sms'],
      description: 'Type of content being displayed'
    },
    title: {
      control: 'text',
      description: 'Content title or headline'
    },
    content: {
      control: 'textarea',
      description: 'Main content body'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `
## Overview
DvContentCard displays different types of content (email, product, blog, SMS) with actions to copy, edit, or use the content. It's used in the AI copilot to preview and interact with generated content.

## Do's
- Show content in appropriate format (email preview, product card, etc.)
- Provide quick actions to use or modify content
- Display content type clearly
- Keep content preview readable and scannable
- Use for content suggestions and recommendations

## Don'ts
- Don't truncate content without indicating continuation
- Don't hide edit/use actions
- Don't mix multiple content types in one card
- Don't use without a clear content type label

## Best Practices
- Show realistic content samples from your domain
- Highlight key sections (subject line, CTA, etc.)
- Provide context about where content can be used
- Include previews of how content will appear to users
        `
      }
    }
  }
} satisfies Meta<typeof DvContentCard>

export default meta
type Story = StoryObj<typeof meta>

export const EmailContent: Story = {
  args: {
    type: 'email',
    title: 'Welcome Email Campaign',
    content: 'Subject: Welcome to [Brand]! We\'re excited to have you.\n\nHi [First Name],\n\nThank you for joining our community. We\'re thrilled to introduce you to our latest collections and exclusive member benefits.\n\nGet started:\n• Browse our New Arrivals\n• Claim your 15% welcome discount\n• Explore our style guides\n\nWelcome aboard!\n\n[Brand] Team'
  }
}

export const ProductDescription: Story = {
  args: {
    type: 'product',
    title: 'Premium Wireless Headphones',
    content: 'Experience crystal-clear sound with active noise cancellation technology. These premium headphones feature a 30-hour battery life, premium leather ear cushions, and seamless Bluetooth connectivity.\n\nKey Features:\n• Active Noise Cancellation (ANC)\n• 30-hour battery life\n• Premium comfort fit\n• Foldable design for portability\n• Built-in microphone for calls\n\nPerfect for music lovers and professionals alike.'
  }
}

export const BlogPost: Story = {
  args: {
    type: 'blog',
    title: 'Tips for Building Your Summer Wardrobe',
    content: 'As the weather warms up, it\'s the perfect time to refresh your wardrobe. Here are our top tips for building a summer wardrobe that\'s both stylish and versatile.\n\n1. Start with Basics\nWhite tees, neutral shorts, and lightweight layers form the foundation of any summer look.\n\n2. Add Color and Pattern\nBright colors and fun prints instantly elevate your summer style.\n\n3. Don\'t Forget Accessories\nSunglasses, hats, and scarves can transform any outfit.\n\nShop our summer collection today!'
  }
}

export const SMSMessage: Story = {
  args: {
    type: 'sms',
    title: 'Flash Sale Alert SMS',
    content: '🔥 FLASH SALE ALERT 🔥\n\nHi [Name]! Your exclusive 24-hour sale starts NOW.\n\nSave 40% on ALL items with code: FLASH40\n\nShop now: [link]\n\nOffer expires in 24 hours!'
  }
}
