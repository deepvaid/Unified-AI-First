import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import RolePicker from './RolePicker.vue'

const meta = {
  title: 'Product/RBAC/RolePicker',
  component: RolePicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`RolePicker\` is the grouped role checklist used by the invite flow and the per-user access drawer. Roles are
grouped Global-first, then by product (MMC / MSC / MCC). Groups whose product isn't in the active account's
subscription render locked ("Requires … subscription"), demoing the PRD rule that role availability is
filtered by subscription entitlements. Account Owner is never assignable and never appears.

The picker reads role groups and usage counts from \`useRbacStore\`; the active account (from \`useAccountsStore\`)
drives which groups are locked. A role that conflicts with an already-selected role shows an inline warning —
final validation happens on save via \`rbac.validateAssignment\`.

**Use when:** assigning one or more roles to a user (invite, edit access, bulk assign).

**Don't use when:** editing what a role can do — that's \`PermissionMatrix\`.

### Usage
\`\`\`html
<RolePicker v-model="selectedRoleIds" />
<RolePicker v-model="ownerRoleIds" disabled />
\`\`\`

### A11y
- **Provides:** every checkbox is labelled "\{role\} — \{product group\}"; locked groups explain why in text; selection state is conveyed by border + checkbox, not colour alone; conflict warnings are text + icon.
- **Consumer must:** surface \`validateAssignment\` errors near the save action, not only in the picker.
        `,
      },
    },
  },
  render: (args) => ({
    components: { RolePicker },
    setup() {
      const model = ref<string[]>([...args.modelValue])
      return { args, model }
    },
    template: `
      <section style="padding:24px;background:rgb(var(--v-theme-background));max-width:560px;">
        <RolePicker v-model="model" :disabled="args.disabled" />
        <p class="text-caption text-medium-emphasis mt-4">Selected: {{ model.join(', ') || 'none' }}</p>
      </section>
    `,
  }),
  argTypes: {
    modelValue: { control: 'object', description: 'Selected role ids (v-model). Controlled — the picker emits the next array rather than mutating this one.' },
    disabled: { control: 'boolean', description: 'Disables every checkbox (e.g. the account owner\'s roles can\'t change). Individually locked roles stay locked regardless. Default false.' },
    'update:modelValue': { action: 'update:modelValue', description: 'Emitted with the next selected-id array when a role is checked or unchecked.' },
  },
} satisfies Meta<typeof RolePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    modelValue: ['role-mmc-campaign-manager'],
  },
}

export const ConflictWarning: Story = {
  args: {
    // Read-Only Analyst is selected — Platform Admin and MMC Admin show conflict hints
    modelValue: ['role-analyst'],
  },
}

export const Disabled: Story = {
  args: {
    modelValue: ['role-platform-admin'],
    disabled: true,
  },
}
