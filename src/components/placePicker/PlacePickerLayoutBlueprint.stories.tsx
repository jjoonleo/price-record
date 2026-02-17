import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { PlacePickerLayoutBlueprint } from './PlacePickerLayoutBlueprint.web';

const meta = {
  title: 'Place Picker/PlacePickerLayoutBlueprint',
  component: PlacePickerLayoutBlueprint,
  render: () => (
    <View style={{ maxWidth: 560, padding: 20, width: '100%' }}>
      <PlacePickerLayoutBlueprint />
    </View>
  ),
} satisfies Meta<typeof PlacePickerLayoutBlueprint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
