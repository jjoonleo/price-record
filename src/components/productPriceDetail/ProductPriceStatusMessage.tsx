import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type ProductPriceStatusMessageProps = {
  message: string;
};

export const ProductPriceStatusMessage = ({ message }: ProductPriceStatusMessageProps) => {
  return <Text style={styles.statusMessage}>{message}</Text>;
};

const styles = StyleSheet.create({
  statusMessage: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center'
  }
});
