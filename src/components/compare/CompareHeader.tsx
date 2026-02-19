import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type CompareHeaderProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
  onAction: () => void;
  actionLabel?: string;
  actionAccessibilityLabel?: string;
};

export const CompareHeader = ({
  title,
  backLabel,
  onBack,
  onAction,
  actionLabel,
  actionAccessibilityLabel
}: CompareHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={19} />
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>

        <Text pointerEvents="none" style={styles.headerTitle}>
          {title}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
          accessibilityLabel={actionAccessibilityLabel}
          accessibilityHint={actionLabel}
        >
          <MaterialCommunityIcons color={colors.textSecondary} name="pencil" size={16} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(246,247,248,0.9)',
    borderBottomColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
    paddingBottom: 13,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 32,
    position: 'relative'
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 72
  },
  backText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  headerTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    left: 0,
    lineHeight: 26,
    position: 'absolute',
    right: 0,
    textAlign: 'center'
  },
  headerAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(226,232,240,0.5)',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  pressed: {
    opacity: 0.85
  }
});
