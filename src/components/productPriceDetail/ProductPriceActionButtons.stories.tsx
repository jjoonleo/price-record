import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceActionButtons } from './ProductPriceActionButtons';

const meta = {
  title: 'Product Price Detail/ProductPriceActionButtons',
  component: ProductPriceActionButtons,
  args: {
    width: productPriceDetailFixture.width,
    editLabel: 'Edit Entry',
    deleteLabel: 'Delete Entry',
    onEdit: fn(),
    onDelete: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceActionButtons {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceActionButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
