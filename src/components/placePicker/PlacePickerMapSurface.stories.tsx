import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import {
  placePickerCoordinatesFixture,
  placePickerCurrentLocationFixture,
  placePickerRegionFixture,
} from '../../storybook/fixtures/placePicker';
import { PlacePickerMapSurface } from './PlacePickerMapSurface';

const nativeArgs = {
  region: placePickerRegionFixture,
  coordinates: placePickerCoordinatesFixture,
  currentLocationCoordinates: placePickerCurrentLocationFixture,
  hasPlaceInfo: true,
  followsUserLocation: false,
  onMapPress: fn(),
  onPanDrag: fn(),
  onRegionChangeComplete: fn(),
  onMarkerPress: fn(),
  onUserLocationChange: fn(),
};

const webExtraProps = {
  visible: false,
  initialCoordinates: placePickerCoordinatesFixture,
  isPlaceInfoVisible: false,
  onMapError: fn(),
  recenterRequestId: 0,
  recenterCoordinates: null,
};

const meta = {
  title: 'Place Picker/PlacePickerMapSurface',
  component: PlacePickerMapSurface,
  args: nativeArgs,
  render: (args) => (
    <View style={{ backgroundColor: '#E2E8F0', height: 300, overflow: 'hidden', width: '100%' }}>
      <PlacePickerMapSurface {...args} {...webExtraProps} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerMapSurface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: nativeArgs,
};

export const NoPlaceInfo: Story = {
  args: nativeArgs,
  render: (args) => (
    <View style={{ backgroundColor: '#E2E8F0', height: 300, overflow: 'hidden', width: '100%' }}>
      <PlacePickerMapSurface {...args} {...webExtraProps} hasPlaceInfo={false} />
    </View>
  ),
};
