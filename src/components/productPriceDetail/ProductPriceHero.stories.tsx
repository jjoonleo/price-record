import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceHero } from './ProductPriceHero';

const meta = {
  title: 'Product Price Detail/ProductPriceHero',
  component: ProductPriceHero,
  args: {
    width: productPriceDetailFixture.width,
    productName: productPriceDetailFixture.productName,
    priceText: productPriceDetailFixture.priceText,
    dealTone: 'great',
    dealLabel: productPriceDetailFixture.greatDealLabel,
    imageSource: productPriceDetailFixture.imageSource,
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceHero {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GreatDeal: Story = {};

export const StandardDeal: Story = {
  args: {
    dealTone: 'standard',
    dealLabel: productPriceDetailFixture.standardDealLabel,
    priceText: '520',
  },
};
