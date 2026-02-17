import { Region } from 'react-native-maps';
import { Coordinates } from '../../types/domain';

export const regionFromCoordinates = (coords: Coordinates): Region => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04
});
