import { ChangeEvent, CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  value: Date;
  preview: string;
  labelDone: string;
  onChange: (nextDate: Date) => void;
};

export const ObservedDateInput = ({ value, onChange }: Props) => {
  const current = [
    value.getFullYear().toString().padStart(4, '0'),
    (value.getMonth() + 1).toString().padStart(2, '0'),
    value.getDate().toString().padStart(2, '0')
  ].join('-');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value;
    const [yearText, monthText, dayText] = next.split('-');
    if (!yearText || !monthText || !dayText) return;

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return;

    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return;
    }

    onChange(parsed);
  };

  return (
    <View style={styles.wrap}>
      <input aria-label="Observed date" onChange={handleChange} style={webInputStyle} type="date" value={current} />
    </View>
  );
};

const webInputStyle: CSSProperties = {
  border: `1px solid ${colors.slate300}`,
  borderRadius: radius.md,
  padding: '10px 12px',
  backgroundColor: colors.slate100,
  color: colors.ink900,
  fontFamily: typography.body,
  fontSize: 15,
  lineHeight: 1.2,
  width: '100%',
  boxSizing: 'border-box'
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm
  }
});
