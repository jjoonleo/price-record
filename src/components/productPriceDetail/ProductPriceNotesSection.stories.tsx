import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceNotesSection } from './ProductPriceNotesSection';

const meta = {
  title: 'Product Price Detail/ProductPriceNotesSection',
  component: ProductPriceNotesSection,
  args: {
    width: productPriceDetailFixture.width,
    notes: productPriceDetailFixture.notes,
    meta: productPriceDetailFixture.notesMeta,
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceNotesSection {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceNotesSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
