import type { Meta, StoryObj } from '@storybook/vue3';
import MbChip from './MbChip.vue';
import type { MbChipProps, MbChipTone } from './MbChip.types';

const toneOptions: MbChipTone[] = ['neutral', 'brand', 'danger', 'success', 'warning'];

const meta: Meta<MbChipProps> = {
  title: 'Components/MbChip',
  component: MbChip,
  tags: ['autodocs'],
  args: {
    label: 'Tag with Dismiss',
    tone: 'neutral',
    selected: false,
    dismissible: true,
    disabled: false
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: toneOptions
    }
  },
  render: (args) => ({
    components: { MbChip },
    setup() {
      return { args };
    },
    template: `
      <div style="display:grid;gap:16px;align-items:start;justify-items:start;padding:24px;">
        <MbChip v-bind="args" />
      </div>
    `
  })
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Selected: Story = {
  args: {
    selected: true
  }
};

export const WithPrepend: Story = {
  args: {
    label: 'Sent',
    tone: 'brand',
    dismissible: false
  },
  render: (args) => ({
    components: { MbChip },
    setup() {
      return { args };
    },
    template: `
      <div style="display:grid;gap:16px;align-items:start;justify-items:start;padding:24px;">
        <MbChip v-bind="args">
          <template #prepend>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </template>
        </MbChip>
      </div>
    `
  })
};
