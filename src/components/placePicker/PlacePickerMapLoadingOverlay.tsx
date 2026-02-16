import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type PlacePickerMapLoadingOverlayProps = {
  label: string;
  absolute?: boolean;
  translucent?: boolean;
};

export const PlacePickerMapLoadingOverlay = ({
  label,
  absolute = false,
  translucent = false
}: PlacePickerMapLoadingOverlayProps) => {
  return (
    <View style={[styles.container, absolute && styles.absolute, translucent && styles.translucent]}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    rowGap: spacing.sm
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20
  },
  translucent: {
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption
  }
});
