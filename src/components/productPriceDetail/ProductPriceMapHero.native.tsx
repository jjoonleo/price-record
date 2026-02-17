import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/tokens';

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
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
        pitchEnabled={false}
        pointerEvents="none"
        region={region}
        rotateEnabled={false}
        scrollEnabled={false}
        style={StyleSheet.absoluteFill}
        zoomEnabled={false}
      />

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

      <View style={styles.headerRow}>
        <Pressable
          accessibilityLabel="detail-back-button"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={17} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="detail-favorite-button"
            accessibilityRole="button"
            onPress={onFavorite}
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.primary} name={isFavorite ? 'heart' : 'heart-outline'} size={16} />
          </Pressable>

          <Pressable
            accessibilityLabel="detail-share-button"
            accessibilityRole="button"
            onPress={onShare}
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.primary} name="share-variant" size={16} />
          </Pressable>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 48,
    position: 'absolute',
    right: 0,
    top: 0
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12
  },
  circleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    width: 32
  },
  mapPinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '45%'
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
  },
  pressed: {
    opacity: 0.82
  }
});
