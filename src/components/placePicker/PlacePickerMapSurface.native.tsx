import { Platform, StyleSheet, View } from 'react-native';
import MapView, {
  Details,
  MapPressEvent,
  Marker,
  PROVIDER_GOOGLE,
  Region,
  UserLocationChangeEvent
} from 'react-native-maps';
import { colors } from '../../theme/tokens';
import { Coordinates } from '../../types/domain';
import { regionFromCoordinates } from './placePickerMapUtils';

type PlacePickerMapSurfaceProps = {
  region: Region;
  coordinates: Coordinates;
  currentLocationCoordinates: Coordinates | null;
  hasPlaceInfo: boolean;
  followsUserLocation: boolean;
  onMapPress: (event: MapPressEvent) => void;
  onPanDrag: () => void;
  onRegionChangeComplete: (region: Region, details?: Details) => void;
  onMarkerPress: () => void;
  onUserLocationChange: (coordinates: Coordinates) => void;
};

export const PlacePickerMapSurface = ({
  region,
  coordinates,
  currentLocationCoordinates,
  hasPlaceInfo,
  followsUserLocation,
  onMapPress,
  onPanDrag,
  onRegionChangeComplete,
  onMarkerPress,
  onUserLocationChange
}: PlacePickerMapSurfaceProps) => {
  const fallbackRegion = regionFromCoordinates(region);
  const normalizedRegion: Region = {
    latitude: fallbackRegion.latitude,
    longitude: fallbackRegion.longitude,
    latitudeDelta: Number.isFinite(region.latitudeDelta) && region.latitudeDelta > 0 ? region.latitudeDelta : fallbackRegion.latitudeDelta,
    longitudeDelta:
      Number.isFinite(region.longitudeDelta) && region.longitudeDelta > 0 ? region.longitudeDelta : fallbackRegion.longitudeDelta
  };
  const isValidCoordinate = (value: number): boolean => Number.isFinite(value);
  const isValidRegion =
    isValidCoordinate(normalizedRegion.latitude) &&
    isValidCoordinate(normalizedRegion.longitude) &&
    isValidCoordinate(normalizedRegion.latitudeDelta) &&
    isValidCoordinate(normalizedRegion.longitudeDelta) &&
    isValidCoordinate(coordinates.latitude) &&
    isValidCoordinate(coordinates.longitude) &&
    (!currentLocationCoordinates ||
      (isValidCoordinate(currentLocationCoordinates.latitude) &&
        isValidCoordinate(currentLocationCoordinates.longitude)));

  if (!isValidRegion) {
    return <View style={styles.map} />;
  }

  return (
    <MapView
      {...(Platform.OS === 'android' ? { provider: PROVIDER_GOOGLE } : {})}
      onPress={onMapPress}
      onPanDrag={onPanDrag}
      onRegionChangeComplete={onRegionChangeComplete}
      onUserLocationChange={(event: UserLocationChangeEvent) => {
        const coordinate = event.nativeEvent.coordinate;
        if (!coordinate) {
          return;
        }

        if (!Number.isFinite(coordinate.latitude) || !Number.isFinite(coordinate.longitude)) {
          return;
        }

        onUserLocationChange({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude
        });
      }}
      region={normalizedRegion}
      showsUserLocation
      {...(Platform.OS === 'android' ? { showsMyLocationButton: false } : {})}
      style={styles.map}
      {...(Platform.OS === 'ios' ? { followsUserLocation } : {})}
      {...(Platform.OS === 'android' ? { googleRenderer: 'LEGACY' as const } : {})}
    >
      {Platform.OS !== 'android' && currentLocationCoordinates ? (
        <Marker coordinate={currentLocationCoordinates} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.currentLocationDot} />
        </Marker>
      ) : null}

      {hasPlaceInfo ? (
        <Marker coordinate={coordinates} onPress={onMarkerPress} pinColor={colors.mapPin} />
      ) : null}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject
  },
  currentLocationDot: {
    backgroundColor: '#1D4ED8',
    borderColor: colors.white,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12
  }
});
