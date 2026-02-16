import { StyleSheet, Text } from 'react-native';
import { spacing, typography } from '../../theme/tokens';

type PlacePickerMapErrorBannerProps = {
  message: string | null;
};

export const PlacePickerMapErrorBanner = ({ message }: PlacePickerMapErrorBannerProps) => {
  if (!message) {
    return null;
  }

  return <Text style={styles.error}>{message}</Text>;
};

const styles = StyleSheet.create({
  error: {
    bottom: 320,
    color: '#B91C1C',
    fontFamily: typography.body,
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    textAlign: 'center',
    zIndex: 45
  }
});
