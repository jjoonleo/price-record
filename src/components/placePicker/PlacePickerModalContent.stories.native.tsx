import type { Meta, StoryObj } from '@storybook/react';
import { Animated, View } from 'react-native';
import { fn } from 'storybook/test';
import {
  placePickerCoordinatesFixture,
  placePickerCurrentLocationFixture,
  placePickerRegionFixture,
  placePickerSuggestionsFixture,
} from '../../storybook/fixtures/placePicker';
import { PlacePickerModalContentNative } from './PlacePickerModalContent.native';

const controlsTranslateY = new Animated.Value(0).interpolate({
  inputRange: [0, 1],
  outputRange: [0, 0],
});

const meta = {
  title: 'Place Picker (Native)/PlacePickerModalContent',
  component: PlacePickerModalContentNative,
  args: {
    visible: false,
    searchOverlayTop: 16,
    isInitializingLocation: false,
    mapCenteringLabel: 'Centering map...',
    coordinates: placePickerCoordinatesFixture,
    currentLocationCoordinates: placePickerCurrentLocationFixture,
    hasPlaceInfo: true,
    onMapPress: fn(),
    onMarkerPress: fn(),
    onMapPanDrag: fn(),
    onRegionChangeComplete: fn(),
    mapRegion: placePickerRegionFixture,
    followsUserLocation: false,
    clearAccessibilityLabel: 'Clear search',
    isSearchEnabled: true,
    isSearchFocused: false,
    onBackPress: fn(),
    onSearchBlur: fn(),
    onSearchChange: fn(),
    onSearchClear: fn(),
    onSearchFocus: fn(),
    onSearchSubmit: fn(),
    searchPlaceholder: 'Search places',
    searchQuery: 'Tokyo Station',
    fallbackMessage: null,
    locationStatusMessage: null,
    searchErrorMessage: null,
    suggestionApplyingLabel: 'Applying...',
    isSearchLoading: false,
    isSearchPanelVisible: true,
    searchingPlacesLabel: 'Searching places...',
    onSuggestionPress: fn(),
    onSuggestionPressIn: fn(),
    selectedSuggestionId: null,
    suggestions: placePickerSuggestionsFixture,
    controlsBottomOffset: 20,
    isLocatingCurrent: false,
    onRecenter: fn(),
    onUseCurrentLocation: fn(),
    controlsTranslateY,
    sheetBodyPaddingBottom: 24,
    isPlaceInfoVisible: true,
    onSheetLayout: fn(),
    sheetPanHandlers: {},
    sheetTranslateY: new Animated.Value(0),
    cityAreaLabel: 'Marunouchi',
    onHidePlaceInfo: fn(),
    selectedPlaceTitle: 'Tokyo Station Mart',
    addressLine: '1 Chome-9 Marunouchi, Chiyoda City',
    noAddressLabel: 'No address',
    websiteLabel: 'example.com',
    websiteUri: 'https://example.com/store',
    confirmLabel: 'Confirm location',
    isResolvingAddress: false,
    onConfirm: fn(),
    resolvingLabel: 'Resolving address...',
  },
  render: (args) => (
    <View style={{ backgroundColor: '#E2E8F0', height: 680, position: 'relative', width: '100%' }}>
      <PlacePickerModalContentNative {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerModalContentNative>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HiddenShell: Story = {};

export const LoadingState: Story = {
  args: {
    isInitializingLocation: true,
    isSearchLoading: true,
    suggestions: [],
  },
};
