import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { CompareHero } from './CompareHero';

const meta = {
  title: 'Compare/CompareHero',
  component: CompareHero,
  args: {
    imageSource: require('../../assets/compare-placeholder.png'),
    productName: 'Matcha Pocky',
    productSubtitle: 'Box of 10 Packs • 120g',
  },
  render: (args) => (
    <View style={{ maxWidth: 420, width: '100%' }}>
      <CompareHero {...args} />
    </View>
  ),
} satisfies Meta<typeof CompareHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoSubtitle: Story = {
  args: {
    productSubtitle: null,
  },
};
