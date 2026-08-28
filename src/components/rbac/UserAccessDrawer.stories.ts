import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import UserAccessDrawer from './UserAccessDrawer.vue'
import { SEED_USERS } from '@/stores/rbacData'

function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

const meta = {
  title: 'Product/RBAC/UserAccessDrawer',
  component: UserAccessDrawer,
  tags: ['autodocs'],
  parameters: {
    // MpFormDrawer teleports to <body>, and every story here defaults open — isolate
    // each story in its own iframe on the Docs page so one story's drawer (and this
    // file's play function) can never collide with another's, same convention as
    // MpToastStack.stories.ts.
    docs: {
      story: { inline: false, height: '760px' },
      description: {
        component: `
### Overview
\`UserAccessDrawer\` is the "Manage access" flow for an existing user: identity + status, an
editable \`RolePicker\` (disabled outright for the account owner), a conditional commerce
store-scope picker, a live product-access preview with a togglable read-only \`PermissionMatrix\`,
and a danger zone (deactivate/reactivate, remove). It reads the user via
\`useRbacStore.userById(userId)\` and reinitializes its local role/scope selection from that user
every time \`userId\` or \`open\` changes. Save calls \`rbac.assignRoles()\`; the danger-zone buttons
call \`rbac.setUserStatus()\` directly, while removal only asks the parent to confirm via
\`request-remove\` — the drawer never deletes a user itself.

**Use when:** editing an existing user's roles, commerce scope, or account status from the Users
& Roles list.

**Don't use when:** inviting a brand-new user (\`InviteUsersDrawer\`), or editing what a role itself
grants (\`PermissionMatrix\` inside role management).

### Usage
\`\`\`html
<UserAccessDrawer
  v-model="accessOpen"
  :user-id="selectedUserId"
  @notify="message => toast.success(message)"
  @request-remove="userId => confirmRemove(userId)"
/>
\`\`\`

### 🟢 Do's
- **Do** keep passing the same \`userId\` for the drawer's whole open lifetime — it resets its local
  role/scope selection whenever \`userId\` (or \`open\`) changes.
- **Do** handle \`@request-remove\` with a confirm step (\`MpConfirmDialog\`) before actually removing
  the user — the drawer only asks, it never removes on its own.
- **Do** leave the account owner's row alone — \`isOwner\` already disables roles, scope, and the
  danger zone, and replaces them with explanatory copy.

### 🔴 Don'ts
- **Don't** call \`rbac.assignRoles\` yourself from \`@notify\` — Save has already persisted the
  change by the time \`@notify\` fires; it's just the message to surface.
- **Don't** open the drawer with \`userId: null\` expecting content — it renders nothing until a
  real user resolves.

### A11y
- **Provides:** inherits \`MpFormDrawer\`'s dialog semantics (focus trap, Escape, focus restore); the
  owner's shield icon carries its explanation via \`v-tooltip\` rather than being decorative; the
  status chip conveys state with icon + text, not color alone; the danger zone is set apart with a
  border (not color alone), and its buttons are explicitly labelled ("Reactivate user" /
  "Deactivate user" / "Remove user").
- **Consumer must:** confirm destructive actions on \`@request-remove\` before calling into the
  store, and surface \`@notify\` messages (e.g. via \`MpToastStack\`) — the drawer shows no inline
  confirmation of its own.
        `,
      },
    },
  },
  argTypes: {
    modelValue: { control: 'boolean', description: 'v-model — drawer visibility.' },
    userId: {
      control: 'select',
      options: SEED_USERS.map(u => u.id),
      description: 'The user being managed, looked up via useRbacStore.userById(). Local role/scope selection reinitializes from this user whenever it changes.',
    },
    notify: { control: false, description: 'Event — a message to surface (e.g. via toast) after Save, or after a deactivate/reactivate.', table: { category: 'events' } },
    'request-remove': { control: false, description: 'Event — emitted with the userId when "Remove user" is clicked; the host must confirm and perform the removal.', table: { category: 'events' } },
  },
  args: {
    modelValue: true,
    userId: 'user-3',
  },
  render: (args) => ({
    components: { UserAccessDrawer },
    setup() {
      const open = ref(args.modelValue)
      const lastNotice = ref('—')
      return { args, open, lastNotice }
    },
    template: `
      <section style="min-height:640px;background:rgb(var(--v-theme-background));padding:24px;">
        <v-btn variant="flat" size="small" class="text-none" prepend-icon="user-cog" rounded="lg" color="surface" @click="open = true">Manage access</v-btn>
        <div class="text-caption text-medium-emphasis mt-3">Last notice: {{ lastNotice }}</div>
        <UserAccessDrawer
          v-bind="args"
          v-model="open"
          @notify="message => lastNotice = message"
          @request-remove="removedId => lastNotice = 'Requested removal of ' + removedId"
        />
      </section>
    `,
  }),
} satisfies Meta<typeof UserAccessDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** Closed — just the trigger button, the resting state from a row's "Manage access" action. */
export const Default: Story = {
  args: { modelValue: false, userId: 'user-3' },
}

/** Mike Zhang — a single-role active user, the baseline open state. */
export const Open: Story = {
  args: { modelValue: true, userId: 'user-3' },
}

/** James Okafor — MCC Admin scoped to two specific locations: exercises the commerce store-scope picker and a fuller product-access preview. */
export const CommerceScopeAccess: Story = {
  args: { modelValue: true, userId: 'user-7' },
}

/** The account owner is fully protected: roles and scope render disabled behind an explanatory alert, and the danger zone is replaced with protective copy — Save stays disabled. */
export const OwnerProtected: Story = {
  args: { modelValue: true, userId: 'user-1' },
}

/** Priya Sharma with "Show effective permissions" expanded, revealing the read-only PermissionMatrix for her current role selection. */
export const EffectivePermissionsExpanded: Story = {
  args: { modelValue: true, userId: 'user-4' },
  play: async () => {
    await wait(300)
    const toggle = Array.from(document.querySelectorAll<HTMLButtonElement>('.mp-form-drawer__body button'))
      .find(btn => btn.textContent?.includes('Show effective permissions'))
    toggle?.click()
  },
}
