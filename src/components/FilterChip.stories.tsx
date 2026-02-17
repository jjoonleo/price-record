import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { FilterChip } from './FilterChip';

const meta = {
  title: 'Components/FilterChip',
  component: FilterChip,
  args: {
    label: 'All Areas',
    active: false,
    onPress: fn(),
  },
  render: (args) => (
    <View style={{ alignItems: 'flex-start', padding: 20 }}>
      <FilterChip {...args} />
    </View>
  ),
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
