import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceLocationSection } from './ProductPriceLocationSection';

const meta = {
  title: 'Product Price Detail/ProductPriceLocationSection',
  component: ProductPriceLocationSection,
  args: {
    width: productPriceDetailFixture.width,
    heading: productPriceDetailFixture.headingLocation,
    cityArea: productPriceDetailFixture.cityArea,
    latitude: productPriceDetailFixture.latitude,
    longitude: productPriceDetailFixture.longitude,
    storeName: productPriceDetailFixture.storeName,
    navigateLabel: productPriceDetailFixture.navigateLabel,
    onNavigate: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceLocationSection {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceLocationSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
