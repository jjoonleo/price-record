import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../theme/tokens';

type PillChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export const PillChip = ({ label, active = false, onPress }: PillChipProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.activeChip : styles.inactiveChip,
        pressed && onPress && styles.pressed
      ]}
    >
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  activeChip: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary
  },
  inactiveChip: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle
  },
  text: {
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    fontWeight: '500',
    lineHeight: 22
  },
  activeText: {
    color: colors.white
  },
  inactiveText: {
    color: colors.textPrimary
  },
  pressed: {
    opacity: 0.85
  }
});

