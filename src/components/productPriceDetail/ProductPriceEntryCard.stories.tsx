import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceEntryCard } from './ProductPriceEntryCard';

const meta = {
  title: 'Product Price Detail/ProductPriceEntryCard',
  component: ProductPriceEntryCard,
  args: {
    width: productPriceDetailFixture.width,
    productName: productPriceDetailFixture.productName,
    productNote: 'Limited seasonal package',
    priceLabel: `¥${productPriceDetailFixture.priceText}`,
    observedLabel: 'Observed Feb 17',
    imageSource: productPriceDetailFixture.imageSource,
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceEntryCard {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceEntryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutNote: Story = {
  args: {
    productNote: undefined,
  },
};
