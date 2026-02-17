import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { featuredStoreFixture } from '../storybook/fixtures/storeComparisons';
import { StoreScoreCard } from './StoreScoreCard';

const meta = {
  title: 'Components/StoreScoreCard',
  component: StoreScoreCard,
  args: {
    item: featuredStoreFixture,
    rank: 1,
  },
  render: (args) => (
    <View style={{ maxWidth: 520, padding: 20, width: '100%' }}>
      <StoreScoreCard {...args} />
    </View>
  ),
} satisfies Meta<typeof StoreScoreCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RankedBest: Story = {};

export const RankedSecond: Story = {
  args: {
    item: {
      ...featuredStoreFixture,
      storeId: 'store-yokohama-harbor',
      storeName: 'Yokohama Harbor',
      cityArea: 'Minatomirai',
      latestPriceYen: 5250,
      distanceKm: 2.1,
      score: 84.7,
      tags: ['CHEAPEST'],
    },
    rank: 2,
  },
};
