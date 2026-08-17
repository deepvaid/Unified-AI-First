import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import PermissionMatrix from './PermissionMatrix.vue'

const meta = {
  title: 'RBAC/PermissionMatrix',
  component: PermissionMatrix,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`PermissionMatrix\` renders the unified RBAC permission catalog (Core Platform, MMC, MSC, MCC) as per-module
checklists with product tabs. It encodes the PRD's dependency rules: checking a permission auto-grants its
\`requires\` closure (create/edit/delete require view; manage requires edit), and a granted permission that
another grant depends on renders checked + disabled with a "Required by …" tooltip.

**Use when:** editing a custom role's permissions, or showing a role's / user's effective permissions read-only.

**Don't use when:** picking roles for a user — that's \`RolePicker\`.

### Usage
\`\`\`html
<PermissionMatrix v-model="role.permissionIds" :products="['platform', 'marketing']" />
<PermissionMatrix :model-value="[...effectivePermissions]" readonly />
\`\`\`

### 🟢 Do's
- **Do** scope \`products\` to the role's product (plus \`platform\` for global roles) so the tabs stay relevant.
- **Do** persist through \`expandWithDependencies\` on save — the matrix keeps the model closed over dependencies, but defense in depth is cheap.

### 🔴 Don'ts
- **Don't** hand-edit the model to remove a dependency of a granted permission; unlock it by removing the dependent grant first.

### A11y
- **Provides:** every checkbox has an explicit \`aria-label\` (permission + module); the module tri-state toggle is labelled "Grant all …"; locked rows expose the reason via the lock icon's label; read-only mode conveys state with icon + text colour, not colour alone.
- **Consumer must:** place the matrix under a heading that names whose permissions are being edited.
        `,
      },
    },
  },
  render: (args) => ({
    components: { PermissionMatrix },
    setup() {
      const model = ref<string[]>([...args.modelValue])
      return { args, model }
    },
    template: `
      <section style="padding:24px;background:rgb(var(--v-theme-background));max-width:880px;">
        <PermissionMatrix v-model="model" :products="args.products" :readonly="args.readonly" />
        <p class="text-caption text-medium-emphasis mt-4">{{ model.length }} permissions granted</p>
      </section>
    `,
  }),
  argTypes: {
    modelValue: { control: 'object', description: 'Granted permission ids (v-model). The matrix is controlled — it never mutates this array.' },
    products: { control: 'object', description: 'ProductKey[] limiting which product tabs render, in catalog order. Defaults to the full PRODUCT_ORDER catalog.' },
    readonly: { control: 'boolean', description: 'Read-only rendering — check / minus icons instead of interactive checkboxes. Default false.' },
    'update:modelValue': { action: 'update:modelValue', description: 'Emitted with the next granted-id array whenever a permission or module row is toggled.' },
  },
} satisfies Meta<typeof PermissionMatrix>

export default meta
type Story = StoryObj<typeof meta>

export const EditableMarketingRole: Story = {
  args: {
    modelValue: [
      'marketing.campaigns.view', 'marketing.campaigns.create', 'marketing.campaigns.edit',
      'marketing.audience.view', 'marketing.content.view',
    ],
    products: ['marketing'],
  },
}

export const DependencyLocking: Story = {
  args: {
    // campaigns.manage requires edit requires view — view and edit render locked
    modelValue: ['marketing.campaigns.view', 'marketing.campaigns.edit', 'marketing.campaigns.manage'],
    products: ['marketing'],
  },
}

export const GlobalRoleAllProducts: Story = {
  args: {
    modelValue: ['platform.dashboards.view', 'marketing.analytics.view'],
    products: ['platform', 'marketing', 'service', 'commerce'],
  },
}

export const ReadonlyEffectivePermissions: Story = {
  args: {
    modelValue: [
      'marketing.campaigns.view', 'marketing.campaigns.create', 'marketing.campaigns.edit',
      'marketing.campaigns.delete', 'marketing.campaigns.manage',
      'marketing.audience.view', 'marketing.content.view', 'marketing.analytics.view',
    ],
    products: ['marketing'],
    readonly: true,
  },
}

export const ProvisionalCommerce: Story = {
  args: {
    modelValue: ['commerce.orders.view', 'commerce.orders.edit'],
    products: ['commerce'],
  },
}
