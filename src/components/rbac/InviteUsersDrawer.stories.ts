import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import InviteUsersDrawer from './InviteUsersDrawer.vue'
import { darkModeGlobals } from '@/stories/storybookTheme'

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

/** Sets a combobox input's text and commits it as a chip via Enter, same as a user typing an email and pressing Enter. */
function commitEmail(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
}

const meta = {
  title: 'RBAC/InviteUsersDrawer',
  component: InviteUsersDrawer,
  tags: ['autodocs'],
  parameters: {
    // MpFormDrawer teleports to <body>, and every story here defaults open — isolate
    // each story in its own iframe on the Docs page so one story's drawer (and this
    // file's play functions) can never collide with another's, same convention as
    // MpToastStack.stories.ts.
    docs: {
      story: { inline: false, height: '720px' },
      description: {
        component: `
### Overview
\`InviteUsersDrawer\` is the two-step "Invite users" flow: pick email addresses and roles (via
\`RolePicker\`, grouped and filtered by the account's subscriptions), review a summary, then send.
It composes \`MpFormDrawer\` and owns its email/role/step state entirely internally, resetting to
step 1 with everything empty every time it's reopened. Sending creates the users through
\`useRbacStore.inviteUsers()\` and closes itself, emitting \`invited\` with the new emails.

**Use when:** adding new users to the account and assigning their initial roles in one flow.

**Don't use when:** changing an existing user's roles or status (\`UserAccessDrawer\`), or picking
roles outside an invite/edit flow (\`RolePicker\` on its own).

### Usage
\`\`\`html
<v-btn color="primary" prepend-icon="user-plus" @click="inviteOpen = true">Invite users</v-btn>
<InviteUsersDrawer
  v-model="inviteOpen"
  @invited="emails => toast.success(\`Invited \${emails.length} user\${emails.length === 1 ? '' : 's'}\`)"
/>
\`\`\`

### 🟢 Do's
- **Do** let the drawer own its email/role/step state — it always resets to step 1 empty on open,
  so there's no need (and no prop) to seed it from outside.
- **Do** handle \`@invited\` to confirm the result (toast, refresh the users list); the drawer has
  already closed itself by the time it fires.
- **Do** rely on \`RolePicker\`'s subscription-aware grouping and \`validateAssignment\` instead of
  re-checking role conflicts or entitlements yourself.

### 🔴 Don'ts
- **Don't** try to pass initial emails or roles — there's no prop for it; every open starts blank.
- **Don't** duplicate the commerce store-scope logic — it only appears once a commerce role is
  selected, and the drawer already gates Continue on it being resolved.

### A11y
- **Provides:** inherits \`MpFormDrawer\`'s dialog semantics (focus trap, Escape, focus restore on
  close); the email field carries \`aria-label="Email addresses to invite"\`; invalid emails surface
  as a field \`error-messages\` string, not color alone; the role conflict warning is a \`v-alert\`
  with icon + text, matching \`RolePicker\`'s own conflict styling.
- **Consumer must:** keep the trigger button mounted while the drawer is open so focus can return
  to it on close.
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility. Reopening always resets to step 1 with empty emails and roles.' },
    invited: { control: false, description: 'Event — emitted with the created emails after Send; the drawer closes itself first.', table: { category: 'events' } },
  },
  args: {
    modelValue: true,
  },
  render: (args) => ({
    components: { InviteUsersDrawer },
    setup() {
      const open = ref(args.modelValue)
      const lastInvited = ref('—')
      return { args, open, lastInvited }
    },
    template: `
      <section style="min-height:640px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn color="primary" variant="flat" prepend-icon="user-plus" class="text-none" @click="open = true">Invite users</v-btn>
        <div class="text-caption text-medium-emphasis mt-3">Last invited: {{ lastInvited }}</div>
        <InviteUsersDrawer v-bind="args" v-model="open" @invited="emails => lastInvited = emails.join(', ')" />
      </section>
    `,
  }),
} satisfies Meta<typeof InviteUsersDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** Closed — just the trigger button, the resting state on the Users & Roles page. */
export const Default: Story = {
  args: { modelValue: false },
}

/** Freshly opened step 1: empty emails, no roles selected yet, Continue disabled. */
export const Open: Story = {
  args: { modelValue: true },
}

/** A typical filled-out step 1 — two email chips plus two compatible Marketing Cloud roles, so Continue is enabled. */
export const PopulatedForm: Story = {
  args: { modelValue: true },
  play: async () => {
    await wait(300)
    const emailInput = document.querySelector<HTMLInputElement>('.mp-form-drawer__body input')
    if (emailInput) {
      commitEmail(emailInput, 'jordan@maropost.com')
      await wait(80)
      commitEmail(emailInput, 'casey@maropost.com')
      await wait(80)
    }
    document.querySelector<HTMLInputElement>('input[aria-label*="Campaign Manager"]')?.click()
    document.querySelector<HTMLInputElement>('input[aria-label*="Content Manager"]')?.click()
  },
}

/** Selecting two conflicting roles (Read-Only Analyst + Platform Admin) surfaces the inline warning — Continue stays blocked until one is removed. */
export const RoleConflictWarning: Story = {
  args: { modelValue: true },
  play: async () => {
    await wait(300)
    document.querySelector<HTMLInputElement>('input[aria-label*="Read-Only Analyst"]')?.click()
    await wait(60)
    document.querySelector<HTMLInputElement>('input[aria-label*="Platform Admin"]')?.click()
  },
}

/** L4 overlay surface in dark mode. */
export const DarkModeOpen: Story = {
  globals: darkModeGlobals,
  ...Open,
}
