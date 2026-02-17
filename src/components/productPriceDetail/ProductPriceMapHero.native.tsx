import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
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
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <MapView
        liteMode={Platform.OS === 'android'}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        pitchEnabled={false}
        pointerEvents="none"
        region={region}
        rotateEnabled={false}
        scrollEnabled={false}
        style={styles.map}
        zoomEnabled={false}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
        locations={[0, 0.52, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" renderToHardwareTextureAndroid style={styles.mapPinWrap}>
        <View style={styles.pinHalo} />
        <View style={styles.pinCore}>
          <MaterialCommunityIcons color={colors.white} name="shopping" size={14} />
        </View>
      </View>

      <View pointerEvents="box-none" renderToHardwareTextureAndroid style={styles.headerOverlay}>
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
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50
  },
  mapPinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '45%',
    zIndex: 40,
    elevation: 40
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
