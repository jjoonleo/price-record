import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { CompareHeader } from './CompareHeader';

const meta = {
  title: 'Compare/CompareHeader',
  component: CompareHeader,
  args: {
    title: 'Compare',
    backLabel: 'Back',
    onBack: () => {},
    onAction: () => {},
  },
  render: (args) => (
    <View style={{ maxWidth: 420, width: '100%' }}>
      <CompareHeader {...args} />
    </View>
  ),
} satisfies Meta<typeof CompareHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
