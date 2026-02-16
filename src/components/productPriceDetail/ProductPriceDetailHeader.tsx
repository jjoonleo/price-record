import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type ProductPriceDetailHeaderProps = {
  frameWidth: number;
  title: string;
  backLabel: string;
  shareLabel?: string;
  onBack: () => void;
  onShare?: () => void;
};

export const ProductPriceDetailHeader = ({
  frameWidth,
  title,
  backLabel,
  shareLabel,
  onBack,
  onShare
}: ProductPriceDetailHeaderProps) => {
  return (
    <View style={styles.header}>
      <View style={[styles.headerRow, { width: frameWidth }]}>
        <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
          <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={20} />
          <Text style={styles.headerButtonText}>{backLabel}</Text>
        </Pressable>

        <Text style={styles.headerTitle}>{title}</Text>

        {onShare && shareLabel ? (
          <Pressable accessibilityRole="button" onPress={onShare} style={({ pressed }) => [styles.headerButtonTrailing, pressed && styles.pressed]}>
            <Text style={styles.headerButtonText}>{shareLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(246,247,248,0.9)',
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1
  },
  headerRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    position: 'relative'
  },
  headerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 82
  },
  headerButtonTrailing: {
    alignItems: 'flex-end',
    minWidth: 70
  },
  headerButtonPlaceholder: {
    minWidth: 70
  },
  headerButtonText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  headerTitle: {
    color: '#0F172A',
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    textAlign: 'center'
  },
  pressed: {
    opacity: 0.82
  }
});
