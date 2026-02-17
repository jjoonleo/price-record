import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceDetailHeader } from './ProductPriceDetailHeader';

const meta = {
  title: 'Product Price Detail/ProductPriceDetailHeader',
  component: ProductPriceDetailHeader,
  args: {
    frameWidth: productPriceDetailFixture.width,
    title: 'Price Detail',
    backLabel: productPriceDetailFixture.backLabel,
    shareLabel: productPriceDetailFixture.shareLabel,
    onBack: fn(),
    onShare: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 420, width: '100%' }}>
      <ProductPriceDetailHeader {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceDetailHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithShare: Story = {};

export const WithoutShare: Story = {
  args: {
    shareLabel: undefined,
    onShare: undefined,
  },
};
