import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { buildPriceComparisonRows } from '../../utils/compareScreen';
import { storeComparisonsFixture } from '../../storybook/fixtures/storeComparisons';
import { formatYen } from '../../utils/formatters';
import { ComparePriceComparisonCard } from './ComparePriceComparisonCard';

const rows = buildPriceComparisonRows(storeComparisonsFixture, 4).map((row) => ({
  storeId: row.item.storeId,
  storeName: row.item.storeName,
  priceText: formatYen(row.item.latestPriceYen, 'en-US').replace('JP¥', '¥'),
  widthPercent: row.widthPercent,
  color: row.color,
  isBest: row.isBest,
}));

const meta = {
  title: 'Compare/ComparePriceComparisonCard',
  component: ComparePriceComparisonCard,
  args: {
    title: 'Price Comparison',
    rows,
    viewHistoryLabel: 'View Full History',
    onViewFullHistory: () => {},
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ComparePriceComparisonCard {...args} />
    </View>
  ),
} satisfies Meta<typeof ComparePriceComparisonCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
