import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { PlacePickerMapLoadingOverlay } from './PlacePickerMapLoadingOverlay';

const meta = {
  title: 'Place Picker/PlacePickerMapLoadingOverlay',
  component: PlacePickerMapLoadingOverlay,
  args: {
    label: 'Centering map...',
    absolute: false,
    translucent: false,
  },
  render: (args) => (
    <View style={{ backgroundColor: '#F8FAFC', height: 240, position: 'relative', width: '100%' }}>
      <PlacePickerMapLoadingOverlay {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerMapLoadingOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const AbsoluteTranslucent: Story = {
  args: {
    absolute: true,
    translucent: true,
  },
};
