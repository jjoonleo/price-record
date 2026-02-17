import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { ProductPriceDetailInvalidState } from './ProductPriceDetailInvalidState';

const meta = {
  title: 'Product Price Detail/ProductPriceDetailInvalidState',
  component: ProductPriceDetailInvalidState,
  args: {
    title: 'Entry Not Found',
    body: 'This price entry may have been removed or is no longer available.',
  },
  render: (args) => (
    <View style={{ backgroundColor: '#F8FAFC', height: 320, width: '100%' }}>
      <ProductPriceDetailInvalidState {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceDetailInvalidState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
