import type { Meta, StoryObj } from '@storybook/vue3'
import { VContainer } from 'vuetify/components'
import { QA_COMPONENTS, QA_LINKS, type QaComponent } from './liquidskyMap'

/** One exported property: the computed value per theme, and the token that owns it. */
interface ExportedProp { light?: string; dark?: string; token?: string }
interface ExportedSpec extends Omit<QaComponent, 'stories'> {
  stories: {
    id: string
    label: string
    url: string
    parts: { part: string; state?: string; props: Record<string, ExportedProp> }[]
  }[]
}

// Written by `npm run qa:export`; the same files QA downloads from /qa-reference/spec/.
const exported = import.meta.glob<ExportedSpec>('../../../public/qa-reference/spec/*.json', { eager: true, import: 'default' })
const specs = QA_COMPONENTS
  .map((component) => exported[`../../../public/qa-reference/spec/${component.key}.json`])
  .filter((spec): spec is ExportedSpec => Boolean(spec))

const STATUS_LABEL = { matched: 'Matched', partial: 'Partial', 'no-reference': 'No reference' } as const

const meta = {
  title: 'Foundations/QA Reference',
  component: VContainer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
The design reference for LiquidSky. LiquidSky (\`App*\` components) implements this design system
for production, and there is no Figma file — this Storybook is the reference.

### Compare, Approve, Lock
1. **Compare** — \`npm run qa:compare\` puts each reference story next to the LiquidSky build and
   lists what differs. Nobody writes tests for it.
2. **Approve** — the designer reviews the list and tags what is left Blocker, Must-fix or
   Nice-to-have. Only a Blocker holds a release, and functional QA never waits for the review.
3. **Lock** — QA's Playwright run screenshots the approved component in the LiquidSky Storybook.
   That screenshot is the baseline from then on.

### On this page
- **Component map** — which \`Mp*\` story is the reference for each LiquidSky component in
  design review, and where there is none.
- **Spec contract** — the values the comparison checks, per part, in light and dark.

\`npm run build-storybook && npm run qa:export\` writes them to \`public/qa-reference/\` from
\`src/stories/qa/liquidskyMap.ts\`. Process and the Playwright files: \`docs/qa/\`.
        `,
      },
    },
  },
} satisfies Meta<typeof VContainer>

export default meta
type Story = StoryObj<typeof meta>

/** Every LiquidSky component in review and its Marobase reference stories. */
export const ComponentMap: Story = {
  render: () => ({
    setup: () => ({ components: QA_COMPONENTS, links: QA_LINKS, STATUS_LABEL }),
    template: `
      <v-table>
        <thead>
          <tr>
            <th scope="col">LiquidSky</th>
            <th scope="col">Status</th>
            <th scope="col">Marobase reference</th>
            <th scope="col">Reference stories</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in components" :key="c.key">
            <td class="font-weight-medium">{{ c.liquidsky.join(', ') }}</td>
            <td class="text-no-wrap">{{ STATUS_LABEL[c.status] }}</td>
            <td>
              {{ c.reference }}
              <div v-if="c.note" class="text-medium-emphasis text-body-2 mt-1">{{ c.note }}</div>
            </td>
            <td>
              <div v-for="s in c.stories" :key="s.id">
                <a class="mp-link" :href="links.marobaseStorybook + '?path=/story/' + s.id" target="_blank" rel="noopener">{{ s.label }}</a>
              </div>
              <span v-if="!c.stories.length" class="text-medium-emphasis">Needs a design decision</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    `,
  }),
}

/** The values the comparison checks. A row with a token is owned by that token; change the token, not the number. */
export const SpecContract: Story = {
  render: () => ({
    setup: () => ({ specs }),
    template: `
      <div class="d-flex flex-column ga-8">
        <p v-if="!specs.length" class="ma-0 text-medium-emphasis">No export found. Run <code>npm run qa:export</code>.</p>
        <section v-for="spec in specs" :key="spec.key">
          <h3 class="text-h6 mb-1">{{ spec.liquidsky.join(', ') }}</h3>
          <p class="text-medium-emphasis text-body-2 mb-4">Reference: {{ spec.reference }}<template v-if="spec.note"> — {{ spec.note }}</template></p>
          <template v-for="story in spec.stories" :key="story.id">
            <div v-if="story.parts.length" class="mb-6">
              <a class="mp-link font-weight-medium" :href="story.url" target="_blank" rel="noopener">{{ story.label }}</a>
              <v-table density="compact" class="mt-2">
                <thead>
                  <tr>
                    <th scope="col">Part</th>
                    <th scope="col">Property</th>
                    <th scope="col">Light</th>
                    <th scope="col">Dark</th>
                    <th scope="col">Token</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="part in story.parts" :key="part.part">
                    <tr v-for="(value, prop, index) in part.props" :key="part.part + prop">
                      <td class="font-weight-medium">{{ index === 0 ? part.part : '' }}</td>
                      <td><code>{{ prop }}</code></td>
                      <td><code>{{ value.light }}</code></td>
                      <td><code>{{ value.dark === value.light ? '=' : value.dark }}</code></td>
                      <td class="text-medium-emphasis"><code v-if="value.token">{{ value.token }}</code></td>
                    </tr>
                  </template>
                </tbody>
              </v-table>
            </div>
          </template>
        </section>
      </div>
    `,
  }),
}
