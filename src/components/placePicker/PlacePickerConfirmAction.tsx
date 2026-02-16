import { StyleSheet, Text } from 'react-native';
import { spacing, typography, colors } from '../../theme/tokens';
import { PrimaryButton } from '../ui/PrimaryButton';

type PlacePickerConfirmActionProps = {
  isResolvingAddress: boolean;
  resolvingLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
};

export const PlacePickerConfirmAction = ({
  isResolvingAddress,
  resolvingLabel,
  confirmLabel,
  onConfirm
}: PlacePickerConfirmActionProps) => {
  return (
    <>
      {isResolvingAddress ? <Text style={styles.loaderText}>{resolvingLabel}</Text> : null}
      <PrimaryButton label={confirmLabel} onPress={onConfirm} style={styles.confirmButton} />
    </>
  );
};

const styles = StyleSheet.create({
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption
  },
  confirmButton: {
    marginTop: spacing.xl
  }
});
