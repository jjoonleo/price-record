import { CSSProperties, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { loadGoogleMapsApi } from '../services/googleMapsWebLoader';
import { useI18n } from '../i18n/useI18n';
import { colors, spacing, typography } from '../theme/tokens';

type EntryLocationMapProps = {
  latitude: number;
  longitude: number;
  storeName: string;
  cityArea: string;
};

const toLatLng = (latitude: number, longitude: number) => ({ lat: latitude, lng: longitude });

export const EntryLocationMap = ({ latitude, longitude, storeName, cityArea }: EntryLocationMapProps) => {
  const { t } = useI18n();
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const mapsApiRef = useRef<any | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapNodeRef.current || typeof window === 'undefined') {
      return;
    }

    let disposed = false;

    const initMap = async () => {
      try {
        const maps = await loadGoogleMapsApi();

        if (disposed || !mapNodeRef.current) {
          return;
        }

        const center = toLatLng(latitude, longitude);
        const map = new maps.Map(mapNodeRef.current, {
          center,
          zoom: 15,
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        const marker = new maps.Marker({
          map,
          position: center,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            fillColor: '#137FEC',
            fillOpacity: 1,
            scale: 8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });

        mapRef.current = map;
        markerRef.current = marker;
        mapsApiRef.current = maps;
        setMapError(null);
      } catch (error) {
        if (disposed) {
          return;
        }

        setMapError(error instanceof Error ? error.message : 'Map failed to load');
      }
    };

    void initMap();

    return () => {
      disposed = true;

      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      if (mapRef.current && mapsApiRef.current?.event) {
        mapsApiRef.current.event.clearInstanceListeners(mapRef.current);
      }

      mapRef.current = null;
      mapsApiRef.current = null;

      if (mapNodeRef.current) {
        mapNodeRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;

    if (!map || !marker) {
      return;
    }

    const nextCenter = toLatLng(latitude, longitude);
    marker.setPosition(nextCenter);
    map.setCenter(nextCenter);
  }, [latitude, longitude]);

  return (
    <View style={styles.container}>
      <div ref={mapNodeRef} style={mapStyle} />
      {mapError ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{t('search_unavailable')}</Text>
        </View>
      ) : null}
      <View style={styles.badge}>
        <Text numberOfLines={1} style={styles.storeName}>
          {storeName}
        </Text>
        <Text numberOfLines={1} style={styles.cityArea}>
          {cityArea}
        </Text>
        <Text style={styles.coordinates}>
          {t('detail_coordinates', {
            latitude: latitude.toFixed(5),
            longitude: longitude.toFixed(5)
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 192,
    overflow: 'hidden',
    position: 'relative',
    width: '100%'
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    bottom: spacing.sm,
    maxWidth: '88%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute'
  },
  errorOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  errorText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  storeName: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    lineHeight: 20
  },
  cityArea: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    lineHeight: 16
  },
  coordinates: {
    color: '#475569',
    fontFamily: typography.mono,
    fontSize: 10,
    lineHeight: 14
  }
});

const mapStyle: CSSProperties = {
  height: '100%',
  width: '100%'
};
