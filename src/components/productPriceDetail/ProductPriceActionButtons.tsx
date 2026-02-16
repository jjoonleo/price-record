import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type ProductPriceActionButtonsProps = {
  width: number;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
};

export const ProductPriceActionButtons = ({
  width,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete
}: ProductPriceActionButtonsProps) => {
  return (
    <View style={[styles.actionGroup, { width }]}>
      <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
        <Text style={styles.actionButtonPrimaryText}>{editLabel}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onDelete} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
        <Text style={styles.actionButtonDangerText}>{deleteLabel}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  actionGroup: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.md
  },
  actionButtonPrimaryText: {
    color: '#007AFF',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '600',
    lineHeight: 26
  },
  actionButtonDangerText: {
    color: '#FF3B30',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '600',
    lineHeight: 26
  },
  pressed: {
    opacity: 0.82
  }
});
