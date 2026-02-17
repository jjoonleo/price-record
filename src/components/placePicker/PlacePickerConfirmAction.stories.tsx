import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { PlacePickerConfirmAction } from './PlacePickerConfirmAction';

const meta = {
  title: 'Place Picker/PlacePickerConfirmAction',
  component: PlacePickerConfirmAction,
  args: {
    isResolvingAddress: false,
    resolvingLabel: 'Resolving address...',
    confirmLabel: 'Confirm location',
    onConfirm: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 360, padding: 20, width: '100%' }}>
      <PlacePickerConfirmAction {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerConfirmAction>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {};

export const Resolving: Story = {
  args: {
    isResolvingAddress: true,
  },
};
