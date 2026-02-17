import { Platform, StyleSheet, View } from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
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
  onRegionChangeComplete: (region: Region) => void;
  onMarkerPress: () => void;
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
  onMarkerPress
}: PlacePickerMapSurfaceProps) => {
  const normalizedRegion = regionFromCoordinates(region);
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
      onPress={onMapPress}
      onPanDrag={onPanDrag}
      onRegionChangeComplete={onRegionChangeComplete}
      region={normalizedRegion}
      showsUserLocation
      style={styles.map}
      {...(Platform.OS === 'ios' ? { followsUserLocation } : {})}
    >
      {currentLocationCoordinates ? (
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
