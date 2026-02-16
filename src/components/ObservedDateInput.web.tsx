import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  value: Date;
  preview: string;
  labelDone: string;
  onChange: (nextDate: Date) => void;
};

export const ObservedDateInput = ({ value, preview, onChange }: Props) => {
  const current = value.toISOString().slice(0, 10);

  return (
    <View style={styles.trigger}>
      <TextInput
        value={current}
        onChangeText={(next) => {
          const [year, month, day] = next.split('-').map(Number);
          if (!year || !month || !day) return;
          onChange(new Date(year, month - 1, day));
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.slate500}
        style={styles.input}
      />
      <Text style={styles.text}>{preview}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.slate100,
    marginBottom: spacing.sm,
    rowGap: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.white,
    color: colors.ink900
  },
  text: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontSize: 15
  }
});
