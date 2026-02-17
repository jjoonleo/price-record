import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { expect, within } from 'storybook/test';
import { storeComparisonsFixture } from '../storybook/fixtures/storeComparisons';
import { PriceBarChart } from './PriceBarChart';

const meta = {
  title: 'Components/PriceBarChart',
  component: PriceBarChart,
  args: {
    comparisons: storeComparisonsFixture,
  },
  render: (args) => (
    <View style={{ maxWidth: 520, padding: 20, width: '100%' }}>
      <PriceBarChart {...args} />
    </View>
  ),
} satisfies Meta<typeof PriceBarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Shinjuku Central')).resolves.toBeTruthy();
    await expect(canvas.findByText('Tokyo Station Mart')).resolves.toBeTruthy();
    await expect(canvas.findByText('Kyoto Corner')).resolves.toBeTruthy();
  },
};

export const Empty: Story = {
  args: {
    comparisons: [],
  },
  render: (args) => (
    <View style={{ maxWidth: 520, padding: 20, width: '100%' }}>
      <PriceBarChart {...args} />
    </View>
  ),
};
