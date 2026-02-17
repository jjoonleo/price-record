import type { Meta, StoryObj } from '@storybook/react';
import { Animated, View } from 'react-native';
import { fn } from 'storybook/test';
import {
  placePickerCoordinatesFixture,
  placePickerCurrentLocationFixture,
  placePickerSuggestionsFixture,
} from '../../storybook/fixtures/placePicker';
import { PlacePickerModalContentWeb } from './PlacePickerModalContent.web';

const controlsTranslateY = new Animated.Value(0).interpolate({
  inputRange: [0, 1],
  outputRange: [0, 0],
});

const webArgs = {
  visible: false,
  coordinates: placePickerCoordinatesFixture,
  currentLocationCoordinates: placePickerCurrentLocationFixture,
  hasPlaceInfo: true,
  initialCoordinates: placePickerCoordinatesFixture,
  isPlaceInfoVisible: true,
  onMapError: fn(),
  onMapPress: fn(),
  onMarkerPress: fn(),
  recenterCoordinates: null,
  recenterRequestId: 0,
  isInitializingLocation: false,
  mapCenteringLabel: 'Centering map...',
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
  isLocatingCurrent: false,
  onUseCurrentLocation: fn(),
  controlsTranslateY,
  mapError: null,
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
};

const meta = {
  title: 'Place Picker/PlacePickerModalContent',
  component: PlacePickerModalContentWeb,
  args: webArgs,
  render: (args) => (
    <View style={{ backgroundColor: '#E2E8F0', height: 680, position: 'relative', width: '100%' }}>
      <PlacePickerModalContentWeb {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerModalContentWeb>;

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
