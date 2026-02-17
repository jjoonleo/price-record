import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { PlacePickerStatusMessages } from './PlacePickerStatusMessages';

const meta = {
  title: 'Place Picker/PlacePickerStatusMessages',
  component: PlacePickerStatusMessages,
  args: {
    fallbackMessage: 'Search key missing. Manual pin mode enabled.',
    searchErrorMessage: null,
    locationStatusMessage: null,
  },
  render: (args) => (
    <View style={{ backgroundColor: '#334155', maxWidth: 520, padding: 20, width: '100%' }}>
      <PlacePickerStatusMessages {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerStatusMessages>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FallbackOnly: Story = {};

export const WithErrors: Story = {
  args: {
    fallbackMessage: null,
    searchErrorMessage: 'Search unavailable',
    locationStatusMessage: 'Location permission denied',
  },
};
