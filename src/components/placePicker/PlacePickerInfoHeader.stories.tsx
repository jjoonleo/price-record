import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { PlacePickerInfoHeader } from './PlacePickerInfoHeader';

const meta = {
  title: 'Place Picker/PlacePickerInfoHeader',
  component: PlacePickerInfoHeader,
  args: {
    title: 'Tokyo Station Mart',
    meta: 'Marunouchi',
    onClose: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <PlacePickerInfoHeader {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerInfoHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongTitle: Story = {
  args: {
    title: 'Tokyo Station Market Downtown Building East Wing',
    meta: 'Chiyoda City, Tokyo',
  },
};
