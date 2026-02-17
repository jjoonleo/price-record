import type { Meta, StoryObj } from '@storybook/react';
import { Text, View } from 'react-native';
import { PlacePickerSearchOverlay } from './PlacePickerSearchOverlay';

const meta = {
  title: 'Place Picker/PlacePickerSearchOverlay',
  component: PlacePickerSearchOverlay,
  args: {
    top: 16,
    zIndex: 30,
    children: null,
  },
  render: (args) => (
    <View style={{ backgroundColor: '#E2E8F0', height: 220, position: 'relative', width: '100%' }}>
      <PlacePickerSearchOverlay {...args}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 }}>
          <Text>Search row + status + suggestions</Text>
        </View>
      </PlacePickerSearchOverlay>
    </View>
  ),
} satisfies Meta<typeof PlacePickerSearchOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OffsetDown: Story = {
  args: {
    top: 48,
  },
};
