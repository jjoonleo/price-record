import { CSSProperties, useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { colors, spacing, typography } from '../theme/tokens';

type EntryLocationMapProps = {
  latitude: number;
  longitude: number;
  storeName: string;
  cityArea: string;
};

export const EntryLocationMap = ({ latitude, longitude, storeName, cityArea }: EntryLocationMapProps) => {
  const { t } = useI18n();
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapNodeRef.current || typeof window === 'undefined') {
      return;
    }

    let disposed = false;

    const initMap = async () => {
      try {
        const module = await import('leaflet');
        const L = module.default;

        if (disposed || !mapNodeRef.current) {
          return;
        }

        const map = L.map(mapNodeRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([latitude, longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: 'entry-location-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            html:
              '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:#137FEC;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.2)"><span style="width:8px;height:8px;border-radius:999px;background:#fff"></span></div>'
          })
        }).addTo(map);

        mapRef.current = map;
        markerRef.current = marker;
        window.requestAnimationFrame(() => {
          map.invalidateSize();
        });
      } catch (error) {
        setMapError(error instanceof Error ? error.message : 'Map failed to load');
      }
    };

    void initMap();

    return () => {
      disposed = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) {
      return;
    }

    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], mapRef.current.getZoom() ?? 15, { animate: false });
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
