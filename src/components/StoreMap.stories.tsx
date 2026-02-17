import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { storeComparisonsFixture } from '../storybook/fixtures/storeComparisons';
import { StoreMap } from './StoreMap';

const meta = {
  title: 'Components/StoreMap',
  component: StoreMap,
  args: {
    comparisons: storeComparisonsFixture,
  },
  render: (args) => (
    <View style={{ maxWidth: 620, padding: 20, width: '100%' }}>
      <StoreMap {...args} />
    </View>
  ),
} satisfies Meta<typeof StoreMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithComparisons: Story = {};

export const Empty: Story = {
  args: {
    comparisons: [],
  },
};
