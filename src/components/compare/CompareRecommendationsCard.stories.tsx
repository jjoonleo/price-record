import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { buildRecommendationRows } from '../../utils/compareScreen';
import { storeComparisonsFixture } from '../../storybook/fixtures/storeComparisons';
import { formatYen } from '../../utils/formatters';
import { CompareRecommendationsCard } from './CompareRecommendationsCard';

const rows = buildRecommendationRows(storeComparisonsFixture, 3).map((row) => ({
  storeId: row.item.storeId,
  rank: row.rank,
  storeName: row.item.storeName,
  metaText: `${row.item.distanceKm.toFixed(1)}km • ${row.item.cityArea}`,
  priceText: formatYen(row.item.latestPriceYen, 'en-US').replace('JP¥', '¥'),
  statusText: row.savingsYen > 0 ? `Save ¥${row.savingsYen}` : 'Regular',
  statusTone: row.savingsYen > 0 ? ('positive' as const) : ('muted' as const),
}));

const meta = {
  title: 'Compare/CompareRecommendationsCard',
  component: CompareRecommendationsCard,
  args: {
    title: 'Top Recommendations',
    rows,
    onSelect: () => {},
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <CompareRecommendationsCard {...args} />
    </View>
  ),
} satisfies Meta<typeof CompareRecommendationsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
