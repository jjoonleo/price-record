import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Animated, Pressable, StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '../../theme/tokens';

type PlacePickerFloatingControlsProps = {
  bottomOffset: number;
  translateY: Animated.AnimatedInterpolation<number>;
  isLocatingCurrent: boolean;
  onUseCurrentLocation: () => void;
  onRecenter: () => void;
};

export const PlacePickerFloatingControls = ({
  bottomOffset,
  translateY,
  isLocatingCurrent,
  onUseCurrentLocation,
  onRecenter
}: PlacePickerFloatingControlsProps) => {
  return (
    <Animated.View style={[styles.wrap, { bottom: bottomOffset, transform: [{ translateY }] }]}>
      <Pressable disabled={isLocatingCurrent} onPress={onUseCurrentLocation} style={styles.button}>
        {isLocatingCurrent ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <MaterialCommunityIcons color={colors.primary} name="crosshairs-gps" size={18} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
    elevation: 1200,
    gap: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    zIndex: 1200
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  }
});
