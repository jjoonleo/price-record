import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type EntryLocationMapProps = {
  latitude: number;
  longitude: number;
  storeName: string;
  cityArea: string;
};

export const EntryLocationMap = ({ latitude, longitude, storeName, cityArea: _cityArea }: EntryLocationMapProps) => {
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  };

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={region}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        rotateEnabled={false}
        scrollEnabled={false}
        style={styles.map}
        zoomEnabled={false}
      >
        <Marker coordinate={{ latitude, longitude }}>
          <View style={styles.markerWrap}>
            <View style={styles.marker}>
              <MaterialCommunityIcons color={colors.white} name="shopping" size={14} />
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={styles.storeBadge}>
        <Text numberOfLines={1} style={styles.storeBadgeText}>
          {storeName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 192,
    overflow: 'hidden',
    position: 'relative',
    width: '100%'
  },
  map: {
    flex: 1
  },
  markerWrap: {
    alignItems: 'center'
  },
  marker: {
    alignItems: 'center',
    backgroundColor: '#137FEC',
    borderColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  storeBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.sm,
    bottom: spacing.lg,
    maxWidth: '80%',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    position: 'absolute'
  },
  storeBadgeText: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15
  }
});
