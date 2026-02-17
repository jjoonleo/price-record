import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { CompareEmptyStateCard } from './CompareEmptyStateCard';

const meta = {
  title: 'Compare/CompareEmptyStateCard',
  component: CompareEmptyStateCard,
  args: {
    title: 'No comparisons yet',
    body: 'Capture at least one product across multiple stores to see rankings.',
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <CompareEmptyStateCard {...args} />
    </View>
  ),
} satisfies Meta<typeof CompareEmptyStateCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
