import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { ProductPriceMapHeaderActions } from './ProductPriceMapHeaderActions';

const meta = {
  title: 'Product Price Detail/ProductPriceMapHeaderActions',
  component: ProductPriceMapHeaderActions,
  args: {
    isFavorite: false,
    onBack: fn(),
    onFavorite: fn(),
    onShare: fn(),
  },
  render: (args) => {
    const [isFavorite, setIsFavorite] = useState(args.isFavorite);

    return (
      <View style={{ backgroundColor: '#1F2937', borderRadius: 20, height: 260, position: 'relative', width: 390 }}>
        <ProductPriceMapHeaderActions
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
} satisfies Meta<typeof ProductPriceMapHeaderActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
