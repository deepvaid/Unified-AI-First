import { ref, watch } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3';
import MbInputField from './MbInputField.vue';
import type {
  MbInputFieldProps,
  MbInputFieldState
} from './MbInputField.types';

const stateOptions: MbInputFieldState[] = ['default', 'hover', 'focus', 'disabled', 'error'];

const meta: Meta<MbInputFieldProps> = {
  title: 'Forms/MbInputField',
  component: MbInputField,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    state: 'default',
    label: 'Label',
    required: false,
    hint: 'Hint text',
    errorMessage: 'Error message',
    placeholder: 'Placeholder',
    leftAddon: 'Text',
    trailingIcon: 'rhombus',
    width: 320
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: stateOptions
    },
    trailingIcon: {
      control: 'inline-radio',
      options: ['rhombus', 'none']
    },
    width: {
      control: { type: 'number', min: 260, max: 420, step: 10 }
    }
  },
  render: (args) => ({
    components: { MbInputField },
    setup() {
      const value = ref(args.modelValue ?? '');

      watch(
        () => args.modelValue,
        (next) => {
          value.value = next ?? '';
        }
      );

      return { args, value };
    },
    template: `
      <div style="display:grid;gap:16px;align-items:start;justify-items:start;padding:24px;">
        <MbInputField v-bind="args" :model-value="value" @update:modelValue="value = $event" />
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FigmaDefault: Story = {
  args: {
    state: 'default',
    label: 'Label',
    leftAddon: 'Text',
    placeholder: 'Placeholder',
    hint: 'Hint text',
    width: 320
  }
};

export const Focus: Story = {
  args: {
    state: 'focus'
  }
};

export const AllStates: Story = {
  name: 'All States',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { MbInputField },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;padding:24px;background:var(--mb-color-background,#f9fafb)">
        <div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Default</div>
          <MbInputField label="Search" placeholder="Search records…" trailing-icon="none" :width="300" state="default" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Focus</div>
          <MbInputField label="Search" placeholder="Search records…" trailing-icon="none" :width="300" state="focus" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Disabled</div>
          <MbInputField label="Search" model-value="Locked content" trailing-icon="none" :width="300" state="disabled" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Error</div>
          <MbInputField label="Email" placeholder="you@example.com" trailing-icon="none" :width="300" state="error" error-message="Please enter a valid email" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">With hint</div>
          <MbInputField label="Subdomain" placeholder="my-store" trailing-icon="none" :width="300" state="default" hint="Appears in your store URL" />
        </div>
      </div>
    `
  })
};

export const SearchVariant: Story = {
  name: 'Search (toolbar)',
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { MbInputField },
    setup() {
      const query = ref('');
      return { query };
    },
    template: `
      <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;max-width:400px">
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px">Toolbar search (as used in MpDataTableToolbar)</div>
        <MbInputField
          :model-value="query"
          label="Search"
          placeholder="Search records…"
          trailing-icon="none"
          :width="320"
          state="default"
          @update:modelValue="query = $event"
        />
      </div>
    `
  })
};
