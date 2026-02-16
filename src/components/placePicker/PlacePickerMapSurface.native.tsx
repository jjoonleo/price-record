import { StyleSheet, View } from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import { colors } from '../../theme/tokens';
import { Coordinates } from '../../types/domain';

type PlacePickerMapSurfaceProps = {
  region: Region;
  coordinates: Coordinates;
  currentLocationCoordinates: Coordinates | null;
  hasPlaceInfo: boolean;
  userTrackingMode: number;
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
  userTrackingMode,
  onMapPress,
  onPanDrag,
  onRegionChangeComplete,
  onMarkerPress
}: PlacePickerMapSurfaceProps) => {
  return (
    <MapView
      onPress={onMapPress}
      onPanDrag={onPanDrag}
      onRegionChangeComplete={onRegionChangeComplete}
      region={region}
      showsUserLocation
      style={styles.map}
      userTrackingMode={userTrackingMode as never}
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
