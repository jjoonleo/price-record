import type { Meta, StoryObj } from '@storybook/react';
import { Text, View } from 'react-native';
import { AppCard } from './AppCard';

const meta = {
  title: 'UI/AppCard',
  component: AppCard,
  args: {
    padded: true,
    children: <Text>Tax-free travel adapter: 4,980 JPY</Text>,
  },
  argTypes: {
    children: {
      control: false,
    },
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <AppCard {...args} />
    </View>
  ),
} satisfies Meta<typeof AppCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPadding: Story = {
  args: {
    padded: false,
    children: (
      <View style={{ padding: 16 }}>
        <Text>Content controls card padding externally.</Text>
      </View>
    ),
  },
};
