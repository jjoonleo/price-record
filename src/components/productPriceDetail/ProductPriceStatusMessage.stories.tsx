import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { ProductPriceStatusMessage } from './ProductPriceStatusMessage';

const meta = {
  title: 'Product Price Detail/ProductPriceStatusMessage',
  component: ProductPriceStatusMessage,
  args: {
    message: 'Prices are updated daily at 09:00 JST.',
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceStatusMessage {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceStatusMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
