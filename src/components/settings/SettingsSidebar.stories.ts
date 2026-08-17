import type { Meta, StoryObj } from '@storybook/vue3'
import type { Router } from 'vue-router'
import { useRouter } from 'vue-router'
import SettingsSidebar from './SettingsSidebar.vue'
import { SETTINGS_GROUPS } from './settingsMenu'

/**
 * Story-side workaround: the Storybook preview router only has a catch-all
 * route, but the sidebar resolves named routes from settingsMenu.ts. Register
 * a stub route per menu entry so router-link resolution succeeds.
 */
function ensureSettingsRoutes(router: Router) {
  for (const group of SETTINGS_GROUPS) {
    for (const item of group.items) {
      if (!router.hasRoute(item.routeName)) {
        router.addRoute({
          path: `/accounts/:accountId/sb-settings/${item.slug}`,
          name: item.routeName,
          component: { template: '<div />' },
        })
      }
    }
  }
}

function sidebarStory(activeRouteName: string) {
  return () => ({
    components: { SettingsSidebar },
    setup() {
      const router = useRouter()
      ensureSettingsRoutes(router)
      void router.push({ name: activeRouteName, params: { accountId: '2000290' } })
    },
    template: `
      <div class="d-flex bg-background border rounded-lg" style="height: 560px; max-width: 900px; overflow: hidden;">
        <SettingsSidebar />
        <div class="flex-grow-1 pa-6 text-body-2 text-medium-emphasis">
          The active settings page renders here.
        </div>
      </div>
    `,
  })
}

const meta = {
  title: 'Settings/SettingsSidebar',
  component: SettingsSidebar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`SettingsSidebar\` is the left navigation of the Settings shell (260px, grouped links from
\`settingsMenu.ts\`). The active item is derived from the current route name; entries flagged
\`external\` render a launch icon. The search field filters items across all groups (internal
state — type in the canvas to try it; an empty result shows "No matching settings").

Stories register stub routes for the menu's route names and navigate to one of them, since the
Storybook preview router only ships a catch-all route.

### API
\`SettingsSidebar\` takes **no props, emits, or slots** — the menu comes from \`SETTINGS_GROUPS\`
in \`./settingsMenu.ts\`, the active item from \`route.name\`, and the account id from the
\`accountId\` route param (falling back to \`'2000290'\`). That's why the Controls panel is empty:
to change what it renders, edit the menu module or navigate the router.
        `,
      },
    },
  },
} satisfies Meta<typeof SettingsSidebar>

export default meta
type Story = StoryObj<typeof meta>

/** "General" active — the default landing state of the Settings shell. */
export const Default: Story = {
  render: sidebarStory('SettingsGeneral'),
}

/** Deep link into a Platform Setup page — active indicator moves with the route. */
export const PlatformSetupActive: Story = {
  render: sidebarStory('SettingsConnections'),
}
