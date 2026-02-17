import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceStoreSummaryCard } from './ProductPriceStoreSummaryCard';

const meta = {
  title: 'Product Price Detail/ProductPriceStoreSummaryCard',
  component: ProductPriceStoreSummaryCard,
  args: {
    width: productPriceDetailFixture.width,
    storeName: productPriceDetailFixture.storeName,
    cityArea: productPriceDetailFixture.cityArea,
    addressLine: '1 Chome-9 Marunouchi, Chiyoda City',
    directionsLabel: 'Get Directions',
    onDirections: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceStoreSummaryCard {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceStoreSummaryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutOptionalRows: Story = {
  args: {
    addressLine: undefined,
    openStatusLabel: undefined,
    closeTimeLabel: undefined,
  },
};
