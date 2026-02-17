import type { Meta, StoryObj } from '@storybook/react';
import { Animated, View } from 'react-native';
import { fn } from 'storybook/test';
import { PlacePickerFloatingControls } from './PlacePickerFloatingControls';

const translateY = new Animated.Value(0).interpolate({
  inputRange: [0, 1],
  outputRange: [0, 0],
});

const meta = {
  title: 'Place Picker/PlacePickerFloatingControls',
  component: PlacePickerFloatingControls,
  args: {
    bottomOffset: 16,
    translateY,
    isLocatingCurrent: false,
    onUseCurrentLocation: fn(),
    onRecenter: fn(),
  },
  render: (args) => (
    <View style={{ backgroundColor: '#F8FAFC', height: 200, position: 'relative', width: 280 }}>
      <PlacePickerFloatingControls {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerFloatingControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Locating: Story = {
  args: {
    isLocatingCurrent: true,
  },
  tags: ['!test'],
};
