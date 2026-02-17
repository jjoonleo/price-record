import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

type ProductPriceMapHeaderActionsProps = {
  isFavorite: boolean;
  onBack: () => void;
  onFavorite: () => void;
  onShare: () => void;
};

export const ProductPriceMapHeaderActions = ({
  isFavorite,
  onBack,
  onFavorite,
  onShare
}: ProductPriceMapHeaderActionsProps) => {
  return (
    <View pointerEvents="box-none" style={styles.headerRow}>
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
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 48,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 60,
    elevation: 60
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
  pressed: {
    opacity: 0.82
  }
});
