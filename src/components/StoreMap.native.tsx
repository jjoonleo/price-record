import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import { useI18n } from '../i18n/useI18n';
import { StoreComparison } from '../types/domain';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { formatYen } from '../utils/formatters';

type StoreMapProps = {
  comparisons: StoreComparison[];
};

const defaultRegion: Region = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18
};

export const StoreMap = ({ comparisons }: StoreMapProps) => {
  const { language, t } = useI18n();
  if (comparisons.length === 0) {
    return null;
  }

  const first = comparisons[0];
  const region: Region = {
    latitude: first.latitude,
    longitude: first.longitude,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('map_title')}</Text>
      <MapView initialRegion={region || defaultRegion} style={styles.map}>
        {comparisons.map((item) => (
          <Marker
            key={item.storeId}
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            pinColor={item.tags.includes('BEST') ? colors.coral500 : colors.sea500}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{item.storeName}</Text>
                <Text style={styles.calloutText}>{formatYen(item.latestPriceYen, language === 'ko' ? 'ko-KR' : 'en-US')}</Text>
                <Text style={styles.calloutText}>{t('map_distance_km', { distance: item.distanceKm.toFixed(2) })}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sky200,
    padding: spacing.md,
    marginBottom: spacing.xl
  },
  title: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 18,
    marginBottom: spacing.sm
  },
  map: {
    width: '100%',
    height: 260,
    borderRadius: radius.md
  },
  callout: {
    minWidth: 130,
    paddingVertical: spacing.xs,
    rowGap: 2
  },
  calloutTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 14
  },
  calloutText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  }
});
