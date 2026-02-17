import { Region } from 'react-native-maps';
import { Coordinates } from '../../types/domain';

const DEFAULT_PLACE_PICKER_COORDINATES: Coordinates = {
  latitude: 35.6812,
  longitude: 139.7671
};

const hasFiniteCoordinates = (coords: Coordinates): boolean => {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
};

export const regionFromCoordinates = (coords: Coordinates): Region => {
  const fallback = hasFiniteCoordinates(coords) ? coords : DEFAULT_PLACE_PICKER_COORDINATES;

  return {
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04
  };
};
