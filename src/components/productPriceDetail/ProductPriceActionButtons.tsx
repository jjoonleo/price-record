import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/tokens';
import { OutlineIconButton } from '../ui/OutlineIconButton';

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
      <OutlineIconButton iconName="trash-can-outline" label={deleteLabel} onPress={onDelete} style={styles.actionButton} />

      <OutlineIconButton iconName="pencil-outline" label={editLabel} onPress={onEdit} style={styles.actionButton} />
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
    flex: 1
  }
});
