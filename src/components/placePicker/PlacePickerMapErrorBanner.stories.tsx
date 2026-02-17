import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { PlacePickerMapErrorBanner } from './PlacePickerMapErrorBanner.web';

const meta = {
  title: 'Place Picker/PlacePickerMapErrorBanner',
  component: PlacePickerMapErrorBanner,
  args: {
    message: 'Map tiles failed to load.',
  },
  render: (args) => (
    <View style={{ backgroundColor: '#F1F5F9', height: 420, position: 'relative', width: '100%' }}>
      <PlacePickerMapErrorBanner {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerMapErrorBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithMessage: Story = {};

export const Hidden: Story = {
  args: {
    message: null,
  },
};
