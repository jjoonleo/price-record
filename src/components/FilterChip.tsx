import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export const FilterChip = ({ label, active = false, onPress }: FilterChipProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.activeChip : styles.inactiveChip,
        pressed && styles.pressed
      ]}
    >
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm
  },
  activeChip: {
    backgroundColor: colors.ink900,
    borderColor: colors.ink900
  },
  inactiveChip: {
    backgroundColor: colors.white,
    borderColor: colors.sky300
  },
  text: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600'
  },
  activeText: {
    color: colors.white
  },
  inactiveText: {
    color: colors.ink700
  },
  pressed: {
    transform: [{ scale: 0.97 }]
  }
});
