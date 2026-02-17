import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { ProductPriceDetailLayoutBlueprint } from './ProductPriceDetailLayoutBlueprint.web';

const meta = {
  title: 'Product Price Detail/ProductPriceDetailLayoutBlueprint',
  component: ProductPriceDetailLayoutBlueprint,
  render: () => (
    <View style={{ maxWidth: 560, padding: 20, width: '100%' }}>
      <ProductPriceDetailLayoutBlueprint />
    </View>
  ),
} satisfies Meta<typeof ProductPriceDetailLayoutBlueprint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
