import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { productPriceDetailFixture } from '../../storybook/fixtures/productPriceDetail';
import { ProductPriceMapHero } from './ProductPriceMapHero';

const meta = {
  title: 'Product Price Detail/ProductPriceMapHero',
  component: ProductPriceMapHero,
  args: {
    width: 390,
    latitude: productPriceDetailFixture.latitude,
    longitude: productPriceDetailFixture.longitude,
    isFavorite: false,
    onBack: fn(),
    onFavorite: fn(),
    onShare: fn(),
  },
  render: (args) => {
    const [isFavorite, setIsFavorite] = useState(args.isFavorite);

    return (
      <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
        <ProductPriceMapHero
          {...args}
          isFavorite={isFavorite}
          onFavorite={() => {
            setIsFavorite((current) => !current);
            args.onFavorite();
          }}
        />
      </View>
    );
  },
} satisfies Meta<typeof ProductPriceMapHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
