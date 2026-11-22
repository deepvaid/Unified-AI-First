import type { Meta, StoryObj } from '@storybook/vue3'
import ChatbotSiteCrawl from './ChatbotSiteCrawl.vue'
import { grid } from '@/stories/storyTemplate'

const meta = {
  title: 'Product/Chatbot/ChatbotSiteCrawl',
  component: ChatbotSiteCrawl,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The "Website URL" source in the chatbot builder's Knowledge base. The merchant enters a site,
the crawl lists the pages it found, they tick the ones the chatbot should learn from, and
**Extract text** turns the selection into a knowledge source (\`@extracted\`).

One state drives the whole flow: \`idle → crawling → discovered | empty | failed → extracting → done\`,
with one primary action per state. The crawl is mocked and deterministic so every state can be
demoed: a domain starting \`empty.\` finds nothing and one starting \`down.\` fails.

\`initialState\` exists for these stories — in the app the flow always starts idle.
        `,
      },
    },
  },
  args: { initialUrl: 'https://johny-style.sss.com' },
} satisfies Meta<typeof ChatbotSiteCrawl>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const States: Story = {
  render: grid({ ChatbotSiteCrawl }, [
    { label: 'idle — no URL', args: { initialUrl: '' } },
    { label: 'idle — URL entered', args: {} },
    { label: 'crawling', args: { initialState: 'crawling' } },
    { label: 'pages discovered', args: { initialState: 'discovered' } },
    { label: 'no pages found', args: { initialState: 'empty', initialUrl: 'https://empty.mystore.com' } },
    { label: 'crawl failed', args: { initialState: 'failed', initialUrl: 'https://down.mystore.com' } },
    { label: 'extracting', args: { initialState: 'extracting' } },
    { label: 'done', args: { initialState: 'done' } },
  ], { columns: 'repeat(auto-fit, minmax(420px, 1fr))' }),
}
