import { Region } from 'react-native-maps';
import { Coordinates } from '../../types/domain';

export const USER_TRACKING_MODES = {
  none: 0,
  follow: 1,
  followWithHeading: 2
} as const;

const MAP_LOCATION_TOLERANCE = 0.0015;

export const regionFromCoordinates = (coords: Coordinates): Region => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04
});

export const isCloseToCoordinates = (left: Coordinates, right: Coordinates): boolean => {
  return (
    Math.abs(left.latitude - right.latitude) <= MAP_LOCATION_TOLERANCE &&
    Math.abs(left.longitude - right.longitude) <= MAP_LOCATION_TOLERANCE
  );
};
