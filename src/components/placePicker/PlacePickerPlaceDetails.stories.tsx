import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { PlacePickerPlaceDetails } from './PlacePickerPlaceDetails';

const meta = {
  title: 'Place Picker/PlacePickerPlaceDetails',
  component: PlacePickerPlaceDetails,
  args: {
    addressLine: '1 Chome-9 Marunouchi, Chiyoda City',
    cityAreaLabel: 'Marunouchi',
    noAddressLabel: 'No address',
    websiteUri: 'https://example.com/store',
    websiteLabel: 'example.com',
    onOpenWebsite: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 420, padding: 20, width: '100%' }}>
      <PlacePickerPlaceDetails {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerPlaceDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithWebsite: Story = {};

export const WithoutWebsite: Story = {
  args: {
    websiteUri: undefined,
    websiteLabel: null,
  },
};
