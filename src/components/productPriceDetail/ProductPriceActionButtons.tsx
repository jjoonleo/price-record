import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme/tokens';

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
      <Pressable accessibilityRole="button" onPress={onDelete} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons color="#334155" name="trash-can-outline" size={15} />
        <Text style={styles.actionButtonText}>{deleteLabel}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
        <MaterialCommunityIcons color="#334155" name="pencil-outline" size={16} />
        <Text style={styles.actionButtonText}>{editLabel}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  actionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    height: 44,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  actionButtonText: {
    color: '#334155',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  pressed: {
    opacity: 0.82
  }
});
