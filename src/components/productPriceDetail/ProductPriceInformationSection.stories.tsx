import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceInformationSection } from './ProductPriceInformationSection';

const meta = {
  title: 'Product Price Detail/ProductPriceInformationSection',
  component: ProductPriceInformationSection,
  args: {
    width: productPriceDetailFixture.width,
    heading: productPriceDetailFixture.headingInformation,
    storeLabel: productPriceDetailFixture.storeLabel,
    areaLabel: productPriceDetailFixture.areaLabel,
    observedLabel: productPriceDetailFixture.observedLabel,
    storeValue: productPriceDetailFixture.storeValue,
    areaValue: productPriceDetailFixture.areaValue,
    observedValue: productPriceDetailFixture.observedValue,
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <ProductPriceInformationSection {...args} />
    </View>
  ),
} satisfies Meta<typeof ProductPriceInformationSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
