import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CSSProperties, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { loadGoogleMapsApi } from '../../services/googleMapsWebLoader';
import { colors } from '../../theme/tokens';
import { ProductPriceMapHeaderActions } from './ProductPriceMapHeaderActions';

type ProductPriceMapHeroProps = {
  width: number;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
  onBack: () => void;
  onFavorite: () => void;
  onShare: () => void;
};

const HERO_ASPECT_RATIO = 397.8 / 390;

const toLatLng = (latitude: number, longitude: number) => ({ lat: latitude, lng: longitude });

export const ProductPriceMapHero = ({
  width,
  latitude,
  longitude,
  isFavorite,
  onBack,
  onFavorite,
  onShare
}: ProductPriceMapHeroProps) => {
  const height = width * HERO_ASPECT_RATIO;
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const mapsApiRef = useRef<any | null>(null);

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

        const map = new maps.Map(mapNodeRef.current, {
          center: toLatLng(latitude, longitude),
          zoom: 15,
          mapTypeId: 'roadmap',
          disableDefaultUI: true,
          gestureHandling: 'none',
          keyboardShortcuts: false,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true
        });

        mapRef.current = map;
        mapsApiRef.current = maps;
      } catch {
        // Keep static background/overlay when map script fails.
      }
    };

    void initMap();

    return () => {
      disposed = true;

      if (mapRef.current && mapsApiRef.current?.event) {
        mapsApiRef.current.event.clearInstanceListeners(mapRef.current);
      }

      mapRef.current = null;
      mapsApiRef.current = null;

      if (mapNodeRef.current) {
        mapNodeRef.current.innerHTML = '';
      }
    };
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.setCenter(toLatLng(latitude, longitude));
  }, [latitude, longitude]);

  return (
    <View style={[styles.container, { width, height }]}>
      <div ref={mapNodeRef} style={mapStyle} />

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
        locations={[0, 0.52, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.mapPinWrap}>
        <View style={styles.pinHalo} />
        <View style={styles.pinCore}>
          <MaterialCommunityIcons color={colors.white} name="shopping" size={14} />
        </View>
      </View>

      <View pointerEvents="box-none" style={styles.headerOverlay}>
        <ProductPriceMapHeaderActions
          isFavorite={isFavorite}
          onBack={onBack}
          onFavorite={onFavorite}
          onShare={onShare}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    position: 'relative'
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60
  },
  mapPinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '45%',
    zIndex: 30
  },
  pinHalo: {
    backgroundColor: 'rgba(0,122,255,0.3)',
    borderRadius: 20,
    height: 40,
    position: 'absolute',
    width: 40
  },
  pinCore: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    width: 40
  }
});

const mapStyle: CSSProperties = {
  height: '100%',
  position: 'relative',
  width: '100%',
  zIndex: 0
};
