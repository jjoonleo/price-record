import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { CompareBestValueCard } from './CompareBestValueCard';

const meta = {
  title: 'Compare/CompareBestValueCard',
  component: CompareBestValueCard,
  args: {
    bestLabel: 'BEST VALUE',
    priceText: '¥128',
    storeText: 'Don Quijote (Shibuya)',
    vsAvgPercentText: '-35%',
    vsAvgLabel: 'vs Avg',
    lastVerifiedText: 'Last verified 2h ago',
    navigateLabel: 'Navigate',
    onNavigate: () => {},
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <CompareBestValueCard {...args} />
    </View>
  ),
} satisfies Meta<typeof CompareBestValueCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
