import type { Meta, StoryObj } from '@storybook/react';
import { Animated, Text, View } from 'react-native';
import { fn } from 'storybook/test';
import { PlacePickerInfoSheet } from './PlacePickerInfoSheet';

const meta = {
  title: 'Place Picker/PlacePickerInfoSheet',
  component: PlacePickerInfoSheet,
  args: {
    translateY: new Animated.Value(0),
    isVisible: true,
    onLayout: fn(),
    panHandlers: {},
    zIndex: 1000,
    bodyPaddingBottom: 20,
    children: null,
  },
  render: (args) => (
    <View style={{ backgroundColor: '#E2E8F0', height: 420, position: 'relative', width: '100%' }}>
      <PlacePickerInfoSheet {...args}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>Store details</Text>
        <Text style={{ marginTop: 8 }}>Address and actions go here.</Text>
      </PlacePickerInfoSheet>
    </View>
  ),
} satisfies Meta<typeof PlacePickerInfoSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Visible: Story = {};

export const Hidden: Story = {
  args: {
    isVisible: false,
    translateY: new Animated.Value(360),
  },
};
