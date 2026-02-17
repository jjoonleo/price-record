import { PlaceSuggestion } from '../../services/placesService';
import { Coordinates } from '../../types/domain';

export const placePickerCoordinatesFixture: Coordinates = {
  latitude: 35.6812,
  longitude: 139.7671,
};

export const placePickerCurrentLocationFixture: Coordinates = {
  latitude: 35.6804,
  longitude: 139.7682,
};

export const placePickerSuggestionsFixture: PlaceSuggestion[] = [
  {
    placeId: 'tokyo-station-mart',
    primaryText: 'Tokyo Station Mart',
    secondaryText: 'Marunouchi, Chiyoda City',
  },
  {
    placeId: 'shinjuku-central',
    primaryText: 'Shinjuku Central',
    secondaryText: 'Shinjuku, Tokyo',
  },
  {
    placeId: 'kyoto-corner',
    primaryText: 'Kyoto Corner',
    secondaryText: 'Shimogyo Ward, Kyoto',
  },
];

export const placePickerRegionFixture = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const placePickerSelectionFixture = {
  latitude: 35.6812,
  longitude: 139.7671,
  cityArea: 'Marunouchi',
  addressLine: '1 Chome-9 Marunouchi, Chiyoda City',
  suggestedStoreName: 'Tokyo Station Mart',
};
