import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type PlacePickerStatusMessagesProps = {
  fallbackMessage: string | null;
  searchErrorMessage: string | null;
  locationStatusMessage: string | null;
};

export const PlacePickerStatusMessages = ({
  fallbackMessage,
  searchErrorMessage,
  locationStatusMessage
}: PlacePickerStatusMessagesProps) => {
  if (!fallbackMessage && !searchErrorMessage && !locationStatusMessage) {
    return null;
  }

  return (
    <View style={styles.stack}>
      {fallbackMessage ? <Text style={styles.helperText}>{fallbackMessage}</Text> : null}
      {searchErrorMessage ? <Text style={styles.errorText}>{searchErrorMessage}</Text> : null}
      {locationStatusMessage ? <Text style={styles.errorText}>{locationStatusMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.xxs
  },
  helperText: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    marginTop: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  errorText: {
    color: '#FEE2E2',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    marginTop: spacing.xxs
  }
});
